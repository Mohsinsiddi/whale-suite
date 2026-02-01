import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { Channel, ChannelMembership, ChannelMessage, ConfidentialBadge } from '@/lib/database/models';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    await connectDB();

    // Find channel
    const channel = await Channel.findOne({ slug, isActive: true }).lean();
    if (!channel) {
      return NextResponse.json(
        { success: false, error: 'Channel not found' },
        { status: 404 }
      );
    }

    let membership = null;
    let userTier = 0;
    let canAccess = false;

    if (wallet) {
      // Get user's badge
      const badge = await ConfidentialBadge.findOne({ wallet, isActive: true });
      if (badge) {
        userTier = badge.tier;
        canAccess = userTier >= channel.tier;
      }

      // Get membership if exists
      membership = await ChannelMembership.findOne({
        wallet,
        channelId: channel._id,
        isActive: true,
      }).lean();
    }

    // Get recent messages (last 50)
    const messages = await ChannelMessage.find({
      channelId: channel._id,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Get pinned messages
    const pinnedMessages = await ChannelMessage.find({
      channelId: channel._id,
      isPinned: true,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return NextResponse.json({
      success: true,
      channel: {
        id: channel._id.toString(),
        name: channel.name,
        slug: channel.slug,
        description: channel.description,
        tier: channel.tier,
        tierName: channel.tierName,
        icon: channel.icon,
        memberCount: channel.memberCount,
        messageCount: channel.messageCount,
      },
      membership: membership
        ? {
            anonId: membership.anonId,
            joinedAt: membership.joinedAt,
            notifications: membership.notifications,
          }
        : null,
      messages: messages.reverse().map(m => ({
        id: m._id.toString(),
        content: m.content,
        contentType: m.contentType,
        activityData: m.activityData,
        senderAnonId: m.senderAnonId,
        isOwnMessage: wallet ? m.senderWallet === wallet : false, // PRIVACY: Compare server-side
        createdAt: m.createdAt,
        isEdited: m.isEdited,
        isPinned: m.isPinned,
        reactions: m.reactions && typeof m.reactions === 'object' ? m.reactions : {},
      })),
      pinnedMessages: pinnedMessages.map(m => ({
        id: m._id.toString(),
        content: m.content,
        senderAnonId: m.senderAnonId,
        createdAt: m.createdAt,
      })),
      userTier,
      canAccess,
    });
  } catch (error) {
    console.error('Failed to fetch channel:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
