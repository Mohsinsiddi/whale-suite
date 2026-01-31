import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { User } from '@/lib/database/models';
import { calculatePrivacyScore, type BadgeTier } from '@/lib/points';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet, privyId, email } = body;

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Try to find existing user
    let user = await User.findOne({ wallet });

    if (user) {
      // Update last login and any new fields
      user.lastLoginAt = new Date();
      if (privyId && !user.privyId) {
        user.privyId = privyId;
      }
      if (email && !user.email) {
        user.email = email;
      }

      // Recalculate privacy score on login
      user.privacyScore = calculatePrivacyScore({
        hiddenBalance: user.stats?.hiddenBalance,
        privateTransfers: user.stats?.privateTransfers,
        anonymousBets: user.stats?.anonymousBets,
        swapVolume: user.stats?.swapVolume,
        streak: user.streak,
        badgeTier: (user.badgeTier || 'none') as BadgeTier,
      });

      await user.save();
    } else {
      // Get the next user number
      const lastUser = await User.findOne().sort({ userNumber: -1 });
      const nextUserNumber = (lastUser?.userNumber || 0) + 1;

      // Create new user with 30-day trial
      const trialExpiry = new Date();
      trialExpiry.setDate(trialExpiry.getDate() + 30);

      user = await User.create({
        wallet,
        privyId,
        email,
        userNumber: nextUserNumber,
        badgeTier: 'none',
        isPremium: true, // 30-day trial
        premiumExpiry: trialExpiry,
        privacyScore: 0,
        referralCode: `WHALE${nextUserNumber}`,
        lastLoginAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        wallet: user.wallet,
        userNumber: user.userNumber,
        email: user.email,
        badgeTier: user.badgeTier,
        badgeMint: user.badgeMint,
        isPremium: user.isPremium,
        premiumExpiry: user.premiumExpiry,
        privacyScore: user.privacyScore,
        stats: user.stats,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        settings: user.settings,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      isNewUser: !user.createdAt ||
        (new Date().getTime() - new Date(user.createdAt).getTime()) < 60000,
    });
  } catch (error) {
    console.error('Auth sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
