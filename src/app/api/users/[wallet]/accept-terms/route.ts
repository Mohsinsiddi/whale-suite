import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { User } from '@/lib/database/models';

const CURRENT_TERMS_VERSION = '1.0.0';

interface RouteParams {
  params: Promise<{ wallet: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { wallet } = await params;

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOneAndUpdate(
      { wallet },
      {
        $set: {
          termsAcceptedAt: new Date(),
          termsVersion: CURRENT_TERMS_VERSION,
        }
      },
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
      termsAcceptedAt: user.termsAcceptedAt,
      termsVersion: user.termsVersion,
    });
  } catch (error) {
    console.error('Accept terms error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
