import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { User } from '@/lib/database/models';

export const dynamic = 'force-dynamic';

/**
 * GET /api/leaderboard
 * Fetch top users by points for the leaderboard
 *
 * Query params:
 * - limit: number of users to return (default 50, max 100)
 * - offset: pagination offset (default 0)
 * - period: 'all' | 'weekly' | 'monthly' (default 'all')
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const period = searchParams.get('period') || 'all';

    // Build date filter for period
    let dateFilter = {};
    if (period === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { lastActiveDate: { $gte: weekAgo } };
    } else if (period === 'monthly') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { lastActiveDate: { $gte: monthAgo } };
    }

    // Fetch users sorted by points
    const users = await User.find({
      points: { $gt: 0 },
      ...dateFilter,
    })
      .sort({ points: -1, streak: -1 })
      .skip(offset)
      .limit(limit)
      .select('wallet userNumber badgeTier points streak lastActiveDate privacyScore stats.privateTransfers stats.swapVolume')
      .lean();

    // Get total count for pagination
    const total = await User.countDocuments({
      points: { $gt: 0 },
      ...dateFilter,
    });

    // Add rank to each user
    const leaderboard = users.map((user, index) => ({
      rank: offset + index + 1,
      wallet: user.wallet,
      userNumber: user.userNumber,
      displayName: `Whale #${user.userNumber}`,
      badgeTier: user.badgeTier,
      points: user.points,
      streak: user.streak || 0,
      privacyScore: user.privacyScore || 0,
      privateTransfers: user.stats?.privateTransfers || 0,
      swapVolume: user.stats?.swapVolume || 0,
      lastActive: user.lastActiveDate,
    }));

    // Get top 3 for podium
    const podium = leaderboard.slice(0, 3);

    return NextResponse.json({
      success: true,
      leaderboard,
      podium,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      period,
    });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
