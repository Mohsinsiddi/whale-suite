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

    // Try to find and update existing user in one query (uses wallet index)
    const existingUser = await User.findOneAndUpdate(
      { wallet },
      {
        $set: {
          lastLoginAt: new Date(),
          ...(privyId && { privyId }),
          ...(email && { email }),
        },
      },
      {
        new: true,
        lean: true, // Return plain object for speed
      }
    );

    if (existingUser) {
      // Recalculate privacy score (lightweight operation)
      const privacyScore = calculatePrivacyScore({
        hiddenBalance: existingUser.stats?.hiddenBalance,
        privateTransfers: existingUser.stats?.privateTransfers,
        anonymousBets: existingUser.stats?.anonymousBets,
        swapVolume: existingUser.stats?.swapVolume,
        streak: existingUser.streak,
        badgeTier: (existingUser.badgeTier || 'none') as BadgeTier,
      });

      // Update privacy score async (don't wait)
      if (Math.abs((existingUser.privacyScore || 0) - privacyScore) > 5) {
        User.updateOne({ wallet }, { privacyScore }).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        user: {
          wallet: existingUser.wallet,
          userNumber: existingUser.userNumber,
          email: existingUser.email,
          badgeTier: existingUser.badgeTier,
          badgeMint: existingUser.badgeMint,
          isPremium: existingUser.isPremium,
          premiumExpiry: existingUser.premiumExpiry,
          privacyScore,
          stats: existingUser.stats,
          referralCode: existingUser.referralCode,
          referredBy: existingUser.referredBy,
          settings: existingUser.settings,
          termsAcceptedAt: existingUser.termsAcceptedAt,
          termsVersion: existingUser.termsVersion,
          createdAt: existingUser.createdAt,
          lastLoginAt: existingUser.lastLoginAt,
        },
        isNewUser: false,
      });
    }

    // New user - get next user number using atomic counter
    // Use findOneAndUpdate with $inc for atomic increment
    const counter = await User.findOneAndUpdate(
      {},
      { $inc: { userNumber: 0 } }, // No-op to get max
      { sort: { userNumber: -1 }, lean: true, projection: { userNumber: 1 } }
    );
    const nextUserNumber = (counter?.userNumber || 0) + 1;

    // Create new user with 30-day trial
    const trialExpiry = new Date();
    trialExpiry.setDate(trialExpiry.getDate() + 30);

    const newUser = await User.create({
      wallet,
      privyId,
      email,
      userNumber: nextUserNumber,
      badgeTier: 'none',
      isPremium: true,
      premiumExpiry: trialExpiry,
      privacyScore: 0,
      referralCode: `WHALE${nextUserNumber}`,
      lastLoginAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      user: {
        wallet: newUser.wallet,
        userNumber: newUser.userNumber,
        email: newUser.email,
        badgeTier: newUser.badgeTier,
        badgeMint: newUser.badgeMint,
        isPremium: newUser.isPremium,
        premiumExpiry: newUser.premiumExpiry,
        privacyScore: 0,
        stats: newUser.stats,
        referralCode: newUser.referralCode,
        referredBy: newUser.referredBy,
        settings: newUser.settings,
        termsAcceptedAt: newUser.termsAcceptedAt,
        termsVersion: newUser.termsVersion,
        createdAt: newUser.createdAt,
        lastLoginAt: newUser.lastLoginAt,
      },
      isNewUser: true,
    });
  } catch (error) {
    console.error('Auth sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
