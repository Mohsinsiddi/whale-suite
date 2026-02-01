import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { ConfidentialBadge } from '@/lib/database/models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet address required' },
        { status: 400 }
      );
    }

    await connectDB();

    const badge = await ConfidentialBadge.findOne({ wallet, isActive: true }).lean();

    if (!badge) {
      return NextResponse.json({
        success: true,
        badge: {
          hasClaimed: false,
          tier: 0,
          tierName: 'None',
        },
      });
    }

    return NextResponse.json({
      success: true,
      badge: {
        hasClaimed: true,
        tier: badge.tier,
        tierName: badge.tierName,
        badgeAccountAddress: badge.badgeAccountAddress,
        claimTxSignature: badge.claimTxSignature,
        claimedAt: badge.claimedAt,
        proofHandles: badge.proofHandles,
      },
    });
  } catch (error) {
    console.error('Failed to fetch confidential badge:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      wallet,
      txSignature,
      tier,
      tierName,
      badgeAccountAddress,
      amountPaid,
      encryptedTierHandle,
      proofHandles,
    } = body;

    // Validate required fields
    if (!wallet || !txSignature || !tier || !badgeAccountAddress || !proofHandles) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if badge already exists
    const existingBadge = await ConfidentialBadge.findOne({ wallet });
    if (existingBadge) {
      return NextResponse.json(
        { success: false, error: 'Badge already claimed for this wallet' },
        { status: 400 }
      );
    }

    // Create new badge record
    const badge = await ConfidentialBadge.create({
      wallet,
      badgeAccountAddress,
      claimTxSignature: txSignature,
      tier,
      tierName: tierName || getTierName(tier),
      amountPaid: amountPaid || getTierPrice(tier),
      encryptedTierHandle: encryptedTierHandle || '0',
      proofHandles,
      isActive: true,
      claimedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      badge: {
        hasClaimed: true,
        tier: badge.tier,
        tierName: badge.tierName,
        badgeAccountAddress: badge.badgeAccountAddress,
        claimTxSignature: badge.claimTxSignature,
        claimedAt: badge.claimedAt,
        proofHandles: badge.proofHandles,
      },
    });
  } catch (error) {
    console.error('Failed to save confidential badge:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getTierName(tier: number): string {
  const names: Record<number, string> = {
    1: 'Bronze',
    2: 'Silver',
    3: 'Gold',
    4: 'Diamond',
    5: 'Legendary',
  };
  return names[tier] || 'Unknown';
}

function getTierPrice(tier: number): number {
  const prices: Record<number, number> = {
    1: 100_000_000,  // 0.1 SOL
    2: 200_000_000,  // 0.2 SOL
    3: 300_000_000,  // 0.3 SOL
    4: 400_000_000,  // 0.4 SOL
    5: 500_000_000,  // 0.5 SOL
  };
  return prices[tier] || 0;
}
