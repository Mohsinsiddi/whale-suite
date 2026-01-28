import { NextRequest, NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';
import connectDB from '@/lib/database/mongodb';
import { User, PointsHistory, calculatePoints, POINT_VALUES } from '@/lib/database/models';
import type { PointAction, BadgeTier } from '@/lib/database/models';

const privyClient = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

export const dynamic = 'force-dynamic';

/**
 * POST /api/points/award
 * Award points for an action
 *
 * Body:
 * - action: PointAction type
 * - volumeMultiplier?: number (for volume-based actions like swaps)
 * - metadata?: object (txSignature, amount, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let verifiedClaims;
    try {
      verifiedClaims = await privyClient.verifyAuthToken(token);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { action, volumeMultiplier = 1, metadata = {} } = body;

    // Validate action
    if (!action || !POINT_VALUES[action as PointAction]) {
      return NextResponse.json(
        { success: false, error: 'Invalid action type' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get user's wallet from Privy
    const privyUser = await privyClient.getUser(verifiedClaims.userId);
    const solanaWallet = privyUser.linkedAccounts.find(
      (account) => account.type === 'wallet' && account.chainType === 'solana'
    );

    if (!solanaWallet || !('address' in solanaWallet)) {
      return NextResponse.json({ success: false, error: 'No Solana wallet found' }, { status: 400 });
    }

    const wallet = solanaWallet.address;

    // Find user
    const user = await User.findOne({ wallet });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Calculate points with badge multiplier
    const badgeTier = (user.badgeTier || 'none') as BadgeTier;
    const { basePoints, multiplier, totalPoints } = calculatePoints(
      action as PointAction,
      badgeTier,
      volumeMultiplier
    );

    // Check for streak bonus (daily login)
    let streakBonus = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (user.lastActiveDate) {
      const lastActive = new Date(user.lastActiveDate);
      lastActive.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        // Consecutive day - increase streak
        user.streak = (user.streak || 0) + 1;
        // Streak bonus: 5% per day, max 50%
        const streakMultiplier = Math.min(1 + (user.streak * 0.05), 1.5);
        streakBonus = Math.floor(totalPoints * (streakMultiplier - 1));
      } else if (daysDiff > 1) {
        // Streak broken
        user.streak = 1;
      }
      // If same day (daysDiff === 0), keep streak as is
    } else {
      // First activity
      user.streak = 1;
    }

    // Update last active date if it's a new day
    const wasActiveToday = user.lastActiveDate &&
      new Date(user.lastActiveDate).toDateString() === today.toDateString();

    if (!wasActiveToday) {
      user.lastActiveDate = today;
    }

    // Record points history
    const pointsEntry = await PointsHistory.create({
      wallet,
      action: action as PointAction,
      basePoints,
      multiplier,
      totalPoints: totalPoints + streakBonus,
      badgeTier,
      metadata: {
        ...metadata,
        streakBonus,
        streakDay: user.streak,
      },
    });

    // Update user points
    const finalPoints = totalPoints + streakBonus;
    user.points = (user.points || 0) + finalPoints;

    // Update relevant stats
    if (action === 'privacy_deposit' || action === 'privacy_withdraw') {
      user.stats = user.stats || {};
      if (metadata.amount) {
        user.stats.hiddenBalance = (user.stats.hiddenBalance || 0) +
          (action === 'privacy_deposit' ? metadata.amount : -metadata.amount);
      }
    } else if (action === 'shadow_transfer' || action === 'standard_transfer') {
      user.stats = user.stats || {};
      user.stats.privateTransfers = (user.stats.privateTransfers || 0) + 1;
    } else if (action === 'jupiter_swap') {
      user.stats = user.stats || {};
      if (metadata.amount) {
        user.stats.swapVolume = (user.stats.swapVolume || 0) + metadata.amount;
      }
    }

    await user.save();

    return NextResponse.json({
      success: true,
      points: {
        action,
        basePoints,
        multiplier,
        streakBonus,
        totalAwarded: finalPoints,
        newTotal: user.points,
      },
      streak: user.streak,
      historyId: pointsEntry._id,
    });
  } catch (error) {
    console.error('Award points error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to award points' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/points/award
 * Get points history for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let verifiedClaims;
    try {
      verifiedClaims = await privyClient.verifyAuthToken(token);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();

    const privyUser = await privyClient.getUser(verifiedClaims.userId);
    const solanaWallet = privyUser.linkedAccounts.find(
      (account) => account.type === 'wallet' && account.chainType === 'solana'
    );

    if (!solanaWallet || !('address' in solanaWallet)) {
      return NextResponse.json({ success: false, error: 'No Solana wallet found' }, { status: 400 });
    }

    const wallet = solanaWallet.address;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const history = await PointsHistory.find({ wallet })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    const total = await PointsHistory.countDocuments({ wallet });

    return NextResponse.json({
      success: true,
      history,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  } catch (error) {
    console.error('Get points history error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch points history' },
      { status: 500 }
    );
  }
}
