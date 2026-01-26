import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { User, Transaction } from '@/lib/database/models';

interface RouteParams {
  params: Promise<{ wallet: string }>;
}

// For now, vaults are computed from transactions + user stats
// In production, you'd have a dedicated Vault model
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

    // Get user
    const user = await User.findOne({ wallet });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get recent privacy transactions to build vault data
    const privacyTxns = await Transaction.find({
      wallet,
      type: { $in: ['privacy_deposit', 'privacy_withdraw'] },
      status: 'confirmed',
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Calculate vault balances from transactions
    // This is a simplified version - real implementation would track by vault/token
    const deposits = privacyTxns
      .filter(tx => tx.type === 'privacy_deposit')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const withdrawals = privacyTxns
      .filter(tx => tx.type === 'privacy_withdraw')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const currentBalance = deposits - withdrawals;

    interface Vault {
      id: string;
      name: string;
      token: string;
      balance: number;
      usdValue: number;
      depositAddress: string | null;
      status: string;
      createdAt: Date | null;
      lastActivity: Date | null;
    }

    // Return mock vault data structure (would be from dedicated model in production)
    const vaults: Vault[] = [
      {
        id: 'vault-sol-main',
        name: 'Main SOL Vault',
        token: 'SOL',
        balance: user.stats.hiddenBalance || currentBalance,
        usdValue: (user.stats.hiddenBalance || currentBalance) * 150, // Mock SOL price
        depositAddress: `${wallet.slice(0, 8)}...shadow`,
        status: 'active',
        createdAt: user.createdAt,
        lastActivity: privacyTxns[0]?.createdAt || user.lastLoginAt,
      },
    ];

    // If user has significant balance, add additional vault suggestions
    if (user.isPremium) {
      vaults.push({
        id: 'vault-usdc-main',
        name: 'USDC Vault',
        token: 'USDC',
        balance: 0,
        usdValue: 0,
        depositAddress: null,
        status: 'available',
        createdAt: null,
        lastActivity: null,
      });
    }

    return NextResponse.json({
      success: true,
      vaults,
      totalHiddenBalance: user.stats.hiddenBalance || currentBalance,
      totalUsdValue: (user.stats.hiddenBalance || currentBalance) * 150,
      recentActivity: privacyTxns.slice(0, 5).map(tx => ({
        type: tx.type,
        amount: tx.amount,
        createdAt: tx.createdAt,
      })),
    });
  } catch (error) {
    console.error('Vaults error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
