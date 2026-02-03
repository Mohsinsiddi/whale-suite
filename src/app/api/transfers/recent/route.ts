import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { Transaction } from '@/lib/database/models';

export const dynamic = 'force-dynamic';

/**
 * GET /api/transfers/recent
 * Fetch recent shadow transfers (single send and multi-send)
 * Excludes deposits and withdrawals
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const wallet = searchParams.get('wallet');
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const network = searchParams.get('network') || 'mainnet';

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Fetch only shadow_transfer type (excludes privacy_deposit and privacy_withdraw)
    const transfers = await Transaction.find({
      wallet,
      network,
      type: 'shadow_transfer',
      status: 'confirmed',
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select({
        _id: 1,
        amount: 1,
        token: 1,
        signature: 1,
        createdAt: 1,
        metadata: 1,
      })
      .lean();

    // Format the transfers for the frontend
    const formattedTransfers = transfers.map((tx) => {
      const metadata = tx.metadata as Record<string, unknown> || {};
      const isMultiSend = metadata.isMultiSend === true;
      const recipient = metadata.recipient as string || '';
      const transferType = metadata.transferType as string || 'internal';

      return {
        id: tx._id?.toString(),
        to: recipient ? `${recipient.slice(0, 6)}...${recipient.slice(-4)}` : 'Unknown',
        toFull: recipient,
        amount: `${tx.amount} ${tx.token || 'SOL'}`,
        amountRaw: tx.amount,
        token: tx.token || 'SOL',
        time: getRelativeTime(tx.createdAt),
        timestamp: tx.createdAt,
        type: transferType, // 'internal' or 'external'
        isMultiSend,
        signature: tx.signature,
      };
    });

    return NextResponse.json({
      success: true,
      transfers: formattedTransfers,
      count: formattedTransfers.length,
    });
  } catch (error) {
    console.error('Recent transfers fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent transfers' },
      { status: 500 }
    );
  }
}

/**
 * Get relative time string (e.g., "2h ago", "1d ago")
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return 'Just now';
}
