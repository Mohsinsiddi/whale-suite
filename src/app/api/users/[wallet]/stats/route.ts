import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { User, PointsHistory, Transaction, CardOrder, Referral } from '@/lib/database/models';
import { calculatePrivacyScore, type BadgeTier } from '@/lib/points';

export const dynamic = 'force-dynamic';

// In-memory cache for stats (reduces DB load)
const statsCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 10000; // 10 seconds

/**
 * GET /api/users/[wallet]/stats
 * Get comprehensive user stats including rank, points, activity
 * Optimized with caching and parallel queries
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await params;

    // Check cache first
    const cached = statsCache.get(wallet);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'private, max-age=10',
          'X-Cache': 'HIT',
        },
      });
    }

    await connectDB();

    // Find user with lean for performance
    const user = await User.findOne({ wallet }).lean();
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Calculate privacy score using centralized function
    const privacyScore = calculatePrivacyScore({
      hiddenBalance: user.stats?.hiddenBalance,
      privateTransfers: user.stats?.privateTransfers,
      anonymousBets: user.stats?.anonymousBets,
      swapVolume: user.stats?.swapVolume,
      streak: user.streak,
      badgeTier: (user.badgeTier || 'none') as BadgeTier,
    });

    // Update privacy score in DB if it changed significantly (async, don't wait)
    if (Math.abs((user.privacyScore || 0) - privacyScore) > 5) {
      User.updateOne({ wallet }, { privacyScore }).catch(() => {});
    }

    // Time boundaries for aggregations
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now);
    monthStart.setMonth(monthStart.getMonth() - 1);

    // Run ALL queries in parallel for speed
    const [
      rankResult,
      totalUsersResult,
      recentPoints,
      pointsAggregation,
      transactionStats,
      cardCount,
      referralCount,
    ] = await Promise.all([
      // Rank - use index on points
      User.countDocuments({ points: { $gt: user.points || 0 } }),
      // Total users with points
      User.countDocuments({ points: { $gt: 0 } }),
      // Recent points (limit 10)
      PointsHistory.find({ wallet })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('action totalPoints createdAt')
        .lean(),
      // Points aggregation for time periods
      PointsHistory.aggregate([
        { $match: { wallet, createdAt: { $gte: monthStart } } },
        {
          $group: {
            _id: null,
            totalMonth: { $sum: '$totalPoints' },
            totalWeek: {
              $sum: { $cond: [{ $gte: ['$createdAt', weekStart] }, '$totalPoints', 0] },
            },
            totalToday: {
              $sum: { $cond: [{ $gte: ['$createdAt', todayStart] }, '$totalPoints', 0] },
            },
          },
        },
      ]),
      // Transaction stats
      Transaction.aggregate([
        { $match: { wallet } },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),
      // Card count
      CardOrder.countDocuments({ wallet }),
      // Referral count
      Referral.countDocuments({ referrerWallet: wallet }),
    ]);

    const rank = rankResult + 1;
    const totalUsers = totalUsersResult;
    const percentile = totalUsers > 0 ? Math.round(((totalUsers - rank) / totalUsers) * 100) : 0;
    const pointsData = pointsAggregation[0] || { totalMonth: 0, totalWeek: 0, totalToday: 0 };

    // Build activity breakdown
    const activityBreakdown: Record<string, { count: number; amount: number }> = {};
    transactionStats.forEach((stat: { _id: string; count: number; totalAmount?: number }) => {
      activityBreakdown[stat._id] = {
        count: stat.count,
        amount: stat.totalAmount || 0,
      };
    });

    // Calculate streak status
    const streakStatus = {
      current: user.streak || 0,
      lastActive: user.lastActiveDate,
      isActiveToday: user.lastActiveDate
        ? new Date(user.lastActiveDate).toDateString() === new Date().toDateString()
        : false,
    };

    const responseData = {
      success: true,
      user: {
        wallet: user.wallet,
        userNumber: user.userNumber,
        displayName: `Whale #${user.userNumber}`,
        badgeTier: user.badgeTier,
        isPremium: user.isPremium,
        premiumExpiry: user.premiumExpiry,
        privacyScore,
        memberSince: user.createdAt,
      },
      points: {
        total: user.points || 0,
        today: pointsData.totalToday || 0,
        week: pointsData.totalWeek || 0,
        month: pointsData.totalMonth || 0,
        recentHistory: recentPoints,
      },
      leaderboard: {
        rank,
        totalUsers,
        percentile,
        topPercent: rank <= 10 ? 'Top 10' : rank <= 100 ? 'Top 100' : null,
      },
      streak: streakStatus,
      stats: {
        ...user.stats,
        totalTransactions: Object.values(activityBreakdown).reduce((sum, a) => sum + a.count, 0),
        virtualCards: cardCount,
        referrals: referralCount,
      },
      activity: activityBreakdown,
    };

    // Cache the result
    statsCache.set(wallet, { data: responseData, timestamp: Date.now() });

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'private, max-age=10',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('User stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}
