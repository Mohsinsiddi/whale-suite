import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { Channel, ChannelMembership, ChannelMessage } from '@/lib/database/models';

// PRIVACY-FIRST MESSAGING:
// - No signature required for every message (bad UX)
// - User already proved identity when joining channel (INCO proof)
// - Membership record = session (valid while active)
// - Just verify: Privy auth wallet + active membership

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET - Fetch messages
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const wallet = searchParams.get('wallet');

    await connectDB();

    // Find channel
    const channel = await Channel.findOne({ slug, isActive: true });
    if (!channel) {
      return NextResponse.json(
        { success: false, error: 'Channel not found' },
        { status: 404 }
      );
    }

    // Verify membership if wallet provided
    if (wallet) {
      const membership = await ChannelMembership.findOne({
        wallet,
        channelId: channel._id,
        isActive: true,
      });

      if (!membership) {
        return NextResponse.json(
          { success: false, error: 'Not a member of this channel' },
          { status: 403 }
        );
      }

      // Update last seen
      await ChannelMembership.updateOne(
        { _id: membership._id },
        { $set: { lastSeenAt: new Date() } }
      );
    }

    // Build query
    const query: Record<string, unknown> = {
      channelId: channel._id,
      isDeleted: false,
    };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    // Fetch messages
    const messages = await ChannelMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();

    return NextResponse.json({
      success: true,
      messages: messages.reverse().map(m => ({
        id: m._id.toString(),
        content: m.content,
        contentType: m.contentType,
        activityData: m.activityData,
        senderAnonId: m.senderAnonId,
        // PRIVACY: Only show wallet to the sender, not to other users
        isOwnMessage: wallet ? m.senderWallet === wallet : false,
        createdAt: m.createdAt,
        isEdited: m.isEdited,
        isPinned: m.isPinned,
        reactions: m.reactions && typeof m.reactions === 'object' ? m.reactions : {},
        replyTo: m.replyTo?.toString(),
      })),
      nextCursor: hasMore ? messages[0]?.createdAt?.toISOString() : null,
      hasMore,
    });
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Send message (NO SIGNING - membership is the session!)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { wallet, badgePda, content, contentType, activityData, replyTo } = body;
    // badgePda used for privacy-first membership lookup below

    // Wallet required (from Privy auth)
    if (!wallet || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields (wallet, content)' },
        { status: 400 }
      );
    }

    // Validate content length
    if (content.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Message too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    // Content moderation (basic)
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return NextResponse.json(
        { success: false, error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find channel
    const channel = await Channel.findOne({ slug, isActive: true });
    if (!channel) {
      return NextResponse.json(
        { success: false, error: 'Channel not found' },
        { status: 404 }
      );
    }

    // Verify membership (by badgePda first, fallback to wallet)
    // PRIVACY: badgePda is preferred identity
    let membership = null;

    if (badgePda) {
      membership = await ChannelMembership.findOne({
        badgePda,
        channelId: channel._id,
        isActive: true,
      });
    }

    // Fallback to wallet lookup
    if (!membership) {
      membership = await ChannelMembership.findOne({
        wallet,
        channelId: channel._id,
        isActive: true,
      });
    }

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'Not a member of this channel. Please join first.' },
        { status: 403 }
      );
    }

    // Create message (PRIVACY: store wallet for own-message detection, but never expose to others)
    const message = await ChannelMessage.create({
      channelId: channel._id,
      membershipId: membership._id,
      content: trimmedContent,
      contentType: contentType || 'text',
      activityData,
      senderAnonId: membership.anonId,
      senderWallet: wallet, // Only used for isOwnMessage check, never exposed
      replyTo: replyTo || undefined,
    });

    // Update channel message count
    await Channel.updateOne(
      { _id: channel._id },
      { $inc: { messageCount: 1 } }
    );

    // Update membership last seen
    await ChannelMembership.updateOne(
      { _id: membership._id },
      { $set: { lastSeenAt: new Date() } }
    );

    return NextResponse.json({
      success: true,
      message: {
        id: message._id.toString(),
        content: message.content,
        contentType: message.contentType,
        activityData: message.activityData,
        senderAnonId: message.senderAnonId,
        createdAt: message.createdAt,
      },
    });
  } catch (error) {
    console.error('Failed to send message:', error);
    // Log full error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Error details:', { errorMessage, errorStack });

    return NextResponse.json(
      { success: false, error: `Server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
