import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { Referral, User } from '@/lib/database/models';

interface RouteParams {
  params: Promise<{ wallet: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { wallet } = await params;

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify user exists
    const user = await User.findOne({ wallet });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get all referrals for this user
    const referrals = await Referral.find({ referrerWallet: wallet })
      .sort({ referredAt: -1 })
      .lean();

    // Calculate totals
    const totalEarned = referrals.reduce((sum, r) => sum + r.totalEarned, 0);
    const pendingPayout = referrals.reduce((sum, r) => sum + r.pendingPayout, 0);
    const paidOut = referrals.reduce((sum, r) => sum + r.paidOut, 0);
    const activeReferrals = referrals.filter(r => r.status === 'active').length;

    // Get referred users info
    const referredUsers = await User.find({
      wallet: { $in: referrals.map(r => r.referredUserWallet) }
    }).select('wallet userNumber badgeTier createdAt').lean();

    const referredUsersMap = new Map(
      referredUsers.map(u => [u.wallet, u])
    );

    return NextResponse.json({
      success: true,
      summary: {
        totalReferrals: referrals.length,
        activeReferrals,
        totalEarned,
        pendingPayout,
        paidOut,
        referralCode: user.referralCode,
      },
      referrals: referrals.map((ref) => {
        const referredUser = referredUsersMap.get(ref.referredUserWallet);
        return {
          id: ref._id?.toString(),
          referredUser: referredUser ? {
            userNumber: referredUser.userNumber,
            badgeTier: referredUser.badgeTier,
            joinedAt: referredUser.createdAt,
          } : null,
          commissionRate: ref.commissionRate,
          totalEarned: ref.totalEarned,
          pendingPayout: ref.pendingPayout,
          paidOut: ref.paidOut,
          conversions: ref.conversions,
          status: ref.status,
          referredAt: ref.referredAt,
          lastEarningAt: ref.lastEarningAt,
        };
      }),
    });
  } catch (error) {
    console.error('Referrals error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
