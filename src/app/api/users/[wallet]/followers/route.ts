import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { Follow, User } from '@/lib/database/models';

interface RouteParams {
  params: Promise<{ wallet: string }>;
}

// GET - Get followers list
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { wallet } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    await connectDB();

    // Build query
    const query: Record<string, unknown> = {
      followingWallet: wallet,
      isActive: true,
    };

    if (cursor) {
      query.followedAt = { $lt: new Date(cursor) };
    }

    // Get followers
    const follows = await Follow.find(query)
      .sort({ followedAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = follows.length > limit;
    if (hasMore) follows.pop();

    // Get user details for followers
    const followerWallets = follows.map(f => f.followerWallet);
    const users = await User.find({ wallet: { $in: followerWallets } })
      .select('wallet userNumber badgeTier profile.displayName profile.avatarUrl')
      .lean();

    const userMap = new Map(users.map(u => [u.wallet, u]));

    const followers = follows.map(f => {
      const user = userMap.get(f.followerWallet);
      return {
        wallet: f.followerWallet,
        userNumber: user?.userNumber,
        badgeTier: user?.badgeTier,
        displayName: user?.profile?.displayName,
        avatarUrl: user?.profile?.avatarUrl,
        followedAt: f.followedAt,
      };
    });

    return NextResponse.json({
      success: true,
      followers,
      nextCursor: hasMore ? follows[follows.length - 1]?.followedAt?.toISOString() : null,
      hasMore,
    });
  } catch (error) {
    console.error('Failed to get followers:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
