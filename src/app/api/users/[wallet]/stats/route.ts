import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { User, PointsHistory, Transaction, CardOrder, Referral } from '@/lib/database/models';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users/[wallet]/stats
 * Get comprehensive user stats including rank, points, activity
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    await connectDB();

    const { wallet } = await params;

    // Find user
    const user = await User.findOne({ wallet }).lean();
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Calculate user's rank
    const rank = await User.countDocuments({
      points: { $gt: user.points || 0 },
    }) + 1;

    // Get total users for percentile
    const totalUsers = await User.countDocuments({ points: { $gt: 0 } });
    const percentile = totalUsers > 0 ? Math.round(((totalUsers - rank) / totalUsers) * 100) : 0;

    // Get recent points history
    const recentPoints = await PointsHistory.find({ wallet })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Calculate points earned today/week/month in a single aggregation
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now);
    monthStart.setMonth(monthStart.getMonth() - 1);

    // Single aggregation for all time periods
    const pointsAggregation = await PointsHistory.aggregate([
      { $match: { wallet, createdAt: { $gte: monthStart } } },
      {
        $group: {
          _id: null,
          totalMonth: { $sum: '$totalPoints' },
          totalWeek: {
            $sum: { $cond: [{ $gte: ['$createdAt', weekStart] }, '$totalPoints', 0] }
          },
          totalToday: {
            $sum: { $cond: [{ $gte: ['$createdAt', todayStart] }, '$totalPoints', 0] }
          },
        },
      },
    ]);

    const pointsData = pointsAggregation[0] || { totalMonth: 0, totalWeek: 0, totalToday: 0 };

    // Get transaction counts
    const [transactionStats, cardCount, referralCount] = await Promise.all([
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
      CardOrder.countDocuments({ wallet }),
      Referral.countDocuments({ referrerWallet: wallet }),
    ]);

    // Build activity breakdown
    const activityBreakdown: Record<string, { count: number; amount: number }> = {};
    transactionStats.forEach((stat) => {
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

    return NextResponse.json({
      success: true,
      user: {
        wallet: user.wallet,
        userNumber: user.userNumber,
        displayName: `Whale #${user.userNumber}`,
        badgeTier: user.badgeTier,
        isPremium: user.isPremium,
        premiumExpiry: user.premiumExpiry,
        privacyScore: user.privacyScore,
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
    });
  } catch (error) {
    console.error('User stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}
