import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { Transaction, User } from '@/lib/database/models';

export const dynamic = 'force-dynamic';

/**
 * GET /api/activity/global
 * Fetch global activity feed - all user transactions with user info
 * Used for Whale Intelligence page
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const eventType = searchParams.get('eventType');
    const since = searchParams.get('since'); // ISO timestamp for polling

    // Build query
    const query: Record<string, unknown> = {
      status: 'confirmed',
    };

    if (eventType && eventType !== 'all') {
      query.type = eventType;
    }

    // If 'since' is provided, only get newer transactions (for polling)
    if (since) {
      query.createdAt = { $gt: new Date(since) };
    }

    // Fetch transactions with user info
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    // Get unique wallet addresses
    const wallets = Array.from(new Set(transactions.map(tx => tx.wallet)));

    // Fetch user info for all wallets
    const users = await User.find({ wallet: { $in: wallets } })
      .select('wallet userNumber badgeTier points displayName')
      .lean();

    const userMap = new Map(users.map(u => [u.wallet, u]));

    // Format activity feed
    const activity = transactions.map(tx => {
      const user = userMap.get(tx.wallet);
      return {
        _id: tx._id,
        type: tx.type,
        amount: tx.amount,
        token: tx.token || 'SOL',
        signature: tx.signature,
        status: tx.status,
        createdAt: tx.createdAt,
        // User info
        wallet: tx.wallet,
        userNumber: user?.userNumber || 0,
        displayName: user ? `Whale #${user.userNumber}` : 'Unknown',
        badgeTier: user?.badgeTier || 'none',
        userPoints: user?.points || 0,
        // SDK info
        sdk: tx.sdk,
        // Metadata
        metadata: tx.metadata,
      };
    });

    // Get total count and 24h stats in parallel
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [total, statsAgg] = await Promise.all([
      Transaction.countDocuments(query),
      Transaction.aggregate([
        { $match: { status: 'confirmed', createdAt: { $gt: dayAgo } } },
        {
          $group: {
            _id: null,
            totalVolume: { $sum: '$amount' },
            txCount: { $sum: 1 },
            uniqueWallets: { $addToSet: '$wallet' },
            deposits: {
              $sum: { $cond: [{ $eq: ['$type', 'privacy_deposit'] }, '$amount', 0] }
            },
            withdraws: {
              $sum: { $cond: [{ $eq: ['$type', 'privacy_withdraw'] }, '$amount', 0] }
            },
          },
        },
      ]),
    ]);

    const stats24h = statsAgg[0] || {
      totalVolume: 0,
      txCount: 0,
      uniqueWallets: [],
      deposits: 0,
      withdraws: 0,
    };

    return NextResponse.json({
      success: true,
      activity,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      stats: {
        // Return raw SOL values - frontend will convert using live prices
        volume24h: stats24h.totalVolume || 0,
        activeUsers: stats24h.uniqueWallets?.length || 0,
        totalTxs: stats24h.txCount || 0,
        netFlow: (stats24h.deposits || 0) - (stats24h.withdraws || 0),
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Global activity API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}
