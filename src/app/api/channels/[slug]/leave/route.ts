import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { Channel, ChannelMembership } from '@/lib/database/models';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * DELETE - Leave a channel (remove membership)
 * Used for testing fresh joins with INCO
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    const badgePda = searchParams.get('badgePda');

    if (!wallet && !badgePda) {
      return NextResponse.json(
        { success: false, error: 'wallet or badgePda required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find channel
    const channel = await Channel.findOne({ slug });
    if (!channel) {
      return NextResponse.json(
        { success: false, error: 'Channel not found' },
        { status: 404 }
      );
    }

    // Find and delete membership
    const query: Record<string, unknown> = { channelId: channel._id };
    if (badgePda) {
      query.badgePda = badgePda;
    } else if (wallet) {
      query.wallet = wallet;
    }

    const membership = await ChannelMembership.findOneAndDelete(query);

    if (!membership) {
      return NextResponse.json({
        success: true,
        message: 'No membership found (already left or never joined)',
      });
    }

    // Decrement member count
    await Channel.updateOne(
      { _id: channel._id },
      { $inc: { memberCount: -1 } }
    );

    console.log(`[Leave] Deleted membership for ${badgePda || wallet} from ${slug}`);

    return NextResponse.json({
      success: true,
      message: 'Left channel successfully',
      deletedAnonId: membership.anonId,
    });
  } catch (error) {
    console.error('Failed to leave channel:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
