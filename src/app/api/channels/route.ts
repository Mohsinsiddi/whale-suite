import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { Channel, ChannelMembership, ConfidentialBadge, DEFAULT_CHANNELS } from '@/lib/database/models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    await connectDB();

    // Ensure default channels exist
    const existingCount = await Channel.countDocuments();
    if (existingCount === 0) {
      await Channel.insertMany(DEFAULT_CHANNELS);
    }

    // Get all channels
    const channels = await Channel.find({ isActive: true })
      .sort({ tier: 1 })
      .lean();

    // If wallet provided, get user's badge and memberships
    let userTier = 0;
    let memberships: Set<string> = new Set();

    if (wallet) {
      const badge = await ConfidentialBadge.findOne({ wallet, isActive: true });
      if (badge) {
        userTier = badge.tier;
      }

      const userMemberships = await ChannelMembership.find({
        wallet,
        isActive: true,
      }).lean();

      memberships = new Set(userMemberships.map(m => m.channelId.toString()));
    }

    // Transform channels with access info
    const channelsWithAccess = channels.map(channel => ({
      id: channel._id.toString(),
      name: channel.name,
      slug: channel.slug,
      description: channel.description,
      tier: channel.tier,
      tierName: channel.tierName,
      icon: channel.icon,
      memberCount: channel.memberCount,
      messageCount: channel.messageCount,
      userAccess: userTier >= channel.tier
        ? memberships.has(channel._id.toString())
          ? 'joined'
          : 'eligible'
        : 'locked',
    }));

    return NextResponse.json({
      success: true,
      channels: channelsWithAccess,
      userTier,
    });
  } catch (error) {
    console.error('Failed to fetch channels:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
