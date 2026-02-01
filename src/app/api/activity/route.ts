import { NextRequest, NextResponse } from 'next/server';
import { requireWallet } from '@/lib/auth/verifyPrivy';
import connectDB from '@/lib/database/mongodb';
import Transaction from '@/lib/database/models/Transaction';
import { TRANSACTION_CATEGORIES, TransactionType } from '@/lib/database/models/Transaction';

/**
 * GET /api/activity - Get user activity/transactions
 * Query params:
 *   - network: mainnet | devnet
 *   - category: cards | shadowwire | privacy-cash | swap | pnp | all
 *   - limit: number (default 20)
 *   - offset: number (default 0)
 */
export async function GET(request: NextRequest) {
  const auth = await requireWallet(request);
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const network = searchParams.get('network') || 'mainnet';
    const category = searchParams.get('category') || 'all';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    await connectDB();

    // Build query
    const query: Record<string, unknown> = {
      wallet: auth.user.wallet.toLowerCase(),
      network,
    };

    // Filter by category (map category to transaction types)
    if (category !== 'all') {
      const types = Object.entries(TRANSACTION_CATEGORIES)
        .filter(([, cat]) => cat === category)
        .map(([type]) => type);

      if (types.length > 0) {
        query.type = { $in: types };
      }
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(query),
    ]);

    return NextResponse.json({
      transactions,
      total,
      hasMore: offset + transactions.length < total,
    });
  } catch (error) {
    console.error('Failed to fetch activity:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}

/**
 * POST /api/activity - Record new activity
 */
export async function POST(request: NextRequest) {
  const auth = await requireWallet(request);
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json();
    const {
      type,
      amount,
      token,
      fee,
      signature,
      network = 'mainnet',
      metadata = {},
    } = body;

    if (!type || !signature) {
      return NextResponse.json(
        { error: 'Type and signature required' },
        { status: 400 }
      );
    }

    // Validate type
    if (!Object.keys(TRANSACTION_CATEGORIES).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid transaction type' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if transaction already exists
    const existing = await Transaction.findOne({ signature, network });
    if (existing) {
      return NextResponse.json({ transaction: existing });
    }

    const transaction = await Transaction.create({
      wallet: auth.user.wallet.toLowerCase(),
      network,
      type: type as TransactionType,
      amount: amount || 0,
      token,
      fee,
      signature,
      status: 'pending',
      metadata,
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error('Failed to save activity:', error);
    return NextResponse.json({ error: 'Failed to save activity' }, { status: 500 });
  }
}

/**
 * PATCH /api/activity - Update transaction status
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireWallet(request);
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json();
    const { signature, status, network = 'mainnet' } = body;

    if (!signature || !status) {
      return NextResponse.json(
        { error: 'Signature and status required' },
        { status: 400 }
      );
    }

    await connectDB();

    const updateData: Record<string, unknown> = { status };
    if (status === 'confirmed') {
      updateData.confirmedAt = new Date();
    }

    const transaction = await Transaction.findOneAndUpdate(
      { signature, wallet: auth.user.wallet.toLowerCase(), network },
      { $set: updateData },
      { new: true }
    );

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('Failed to update activity:', error);
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 });
  }
}
