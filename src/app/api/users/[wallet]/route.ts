import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { User } from '@/lib/database/models';

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

    const user = await User.findOne({ wallet });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
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
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { wallet } = await params;
    const body = await request.json();

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOneAndUpdate(
      { wallet },
      { $set: body },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
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
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
