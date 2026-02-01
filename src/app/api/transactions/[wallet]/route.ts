import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { Transaction, User } from '@/lib/database/models';

interface RouteParams {
  params: Promise<{ wallet: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { wallet } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

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

    // Build query
    const query: Record<string, unknown> = { wallet };

    if (type && type !== 'all') {
      query.type = type;
    }

    if (status && status !== 'all') {
      query.status = status;
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
      success: true,
      transactions: transactions.map((tx) => ({
        id: tx._id?.toString(),
        type: tx.type,
        amount: tx.amount,
        token: tx.token,
        fee: tx.fee,
        sdk: tx.sdk,
        signature: tx.signature,
        status: tx.status,
        metadata: tx.metadata,
        createdAt: tx.createdAt,
        confirmedAt: tx.confirmedAt,
      })),
      total,
      hasMore: offset + transactions.length < total,
    });
  } catch (error) {
    console.error('Transactions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
