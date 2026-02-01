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

    // Check if active badge already exists
    const existingBadge = await ConfidentialBadge.findOne({ wallet, isActive: true });
    if (existingBadge) {
      return NextResponse.json(
        { success: false, error: 'Badge already claimed for this wallet' },
        { status: 400 }
      );
    }

    // Delete any inactive badge records for this wallet before creating new one
    await ConfidentialBadge.deleteMany({ wallet, isActive: false });

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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      wallet,
      txSignature,
      tier,
      tierName,
      amountPaid,
    } = body;

    // Validate required fields
    if (!wallet || !txSignature || !tier) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields for upgrade' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find existing badge
    const existingBadge = await ConfidentialBadge.findOne({ wallet });
    if (!existingBadge) {
      return NextResponse.json(
        { success: false, error: 'No existing badge to upgrade' },
        { status: 404 }
      );
    }

    // Validate upgrade (new tier must be higher)
    if (tier <= existingBadge.tier) {
      return NextResponse.json(
        { success: false, error: 'Can only upgrade to a higher tier' },
        { status: 400 }
      );
    }

    // Update badge
    existingBadge.tier = tier;
    existingBadge.tierName = tierName || getTierName(tier);
    existingBadge.upgradeTxSignature = txSignature;
    existingBadge.upgradeAmountPaid = amountPaid || getTierPrice(tier);
    existingBadge.upgradedAt = new Date();
    await existingBadge.save();

    return NextResponse.json({
      success: true,
      badge: {
        hasClaimed: true,
        tier: existingBadge.tier,
        tierName: existingBadge.tierName,
        badgeAccountAddress: existingBadge.badgeAccountAddress,
        claimTxSignature: existingBadge.claimTxSignature,
        upgradeTxSignature: existingBadge.upgradeTxSignature,
        claimedAt: existingBadge.claimedAt,
        upgradedAt: existingBadge.upgradedAt,
      },
    });
  } catch (error) {
    console.error('Failed to upgrade confidential badge:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet } = body;

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet address required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find and delete badge, or mark as inactive
    const result = await ConfidentialBadge.findOneAndUpdate(
      { wallet },
      { isActive: false, deletedAt: new Date() },
      { new: true }
    );

    if (!result) {
      return NextResponse.json({
        success: true,
        message: 'No badge found to delete',
      });
    }

    console.log(`[API] Badge marked inactive for wallet: ${wallet}`);

    return NextResponse.json({
      success: true,
      message: 'Badge deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete confidential badge:', error);
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
