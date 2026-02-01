import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { Follow, User } from '@/lib/database/models';

interface RouteParams {
  params: Promise<{ wallet: string }>;
}

// GET - Get following list
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { wallet } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    await connectDB();

    // Build query
    const query: Record<string, unknown> = {
      followerWallet: wallet,
      isActive: true,
    };

    if (cursor) {
      query.followedAt = { $lt: new Date(cursor) };
    }

    // Get following
    const follows = await Follow.find(query)
      .sort({ followedAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = follows.length > limit;
    if (hasMore) follows.pop();

    // Get user details for following
    const followingWallets = follows.map(f => f.followingWallet);
    const users = await User.find({ wallet: { $in: followingWallets } })
      .select('wallet userNumber badgeTier profile.displayName profile.avatarUrl')
      .lean();

    const userMap = new Map(users.map(u => [u.wallet, u]));

    const following = follows.map(f => {
      const user = userMap.get(f.followingWallet);
      return {
        wallet: f.followingWallet,
        userNumber: user?.userNumber,
        badgeTier: user?.badgeTier,
        displayName: user?.profile?.displayName,
        avatarUrl: user?.profile?.avatarUrl,
        followedAt: f.followedAt,
      };
    });

    return NextResponse.json({
      success: true,
      following,
      nextCursor: hasMore ? follows[follows.length - 1]?.followedAt?.toISOString() : null,
      hasMore,
    });
  } catch (error) {
    console.error('Failed to get following:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
