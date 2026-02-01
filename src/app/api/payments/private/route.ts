import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { PrivatePayment } from '@/lib/database/models';

// GET - List user's payments (as creator)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    const status = searchParams.get('status');
    const cursor = searchParams.get('cursor');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet address required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Build query
    const query: Record<string, unknown> = {
      creatorWallet: wallet,
    };

    if (status) {
      query.status = status;
    }

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    // Fetch payments
    const payments = await PrivatePayment.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = payments.length > limit;
    if (hasMore) payments.pop();

    // Check for expired payments and update status
    const now = new Date();
    const expiredPayments = payments.filter(
      p => p.status === 'active' && new Date(p.expiresAt) < now
    );

    if (expiredPayments.length > 0) {
      await PrivatePayment.updateMany(
        {
          _id: { $in: expiredPayments.map(p => p._id) },
          status: 'active',
        },
        { $set: { status: 'expired' } }
      );
    }

    return NextResponse.json({
      success: true,
      payments: payments.map(p => ({
        id: p._id.toString(),
        paymentId: p.paymentId,
        paymentAccountAddress: p.paymentAccountAddress,
        escrowAccountAddress: p.escrowAccountAddress,
        escrowAmount: p.escrowAmount,
        status: new Date(p.expiresAt) < now && p.status === 'active' ? 'expired' : p.status,
        expiresAt: p.expiresAt,
        claimedAt: p.claimedAt,
        createTxSignature: p.createTxSignature,
        claimTxSignature: p.claimTxSignature,
        finalizeTxSignature: p.finalizeTxSignature,
        cancelTxSignature: p.cancelTxSignature,
        memo: p.memo,
        createdAt: p.createdAt,
      })),
      nextCursor: hasMore ? payments[payments.length - 1]?.createdAt?.toISOString() : null,
      hasMore,
    });
  } catch (error) {
    console.error('Failed to fetch private payments:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Record new payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      wallet,
      paymentId,
      txSignature,
      paymentAccountAddress,
      escrowAccountAddress,
      escrowAmount,
      expiresAt,
      memo,
    } = body;

    if (!wallet || !paymentId || !txSignature || !paymentAccountAddress || !escrowAccountAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if payment already exists
    const existingPayment = await PrivatePayment.findOne({ paymentId });
    if (existingPayment) {
      return NextResponse.json(
        { success: false, error: 'Payment already exists' },
        { status: 400 }
      );
    }

    // Create payment record
    const payment = await PrivatePayment.create({
      paymentId,
      paymentAccountAddress,
      escrowAccountAddress,
      creatorWallet: wallet,
      escrowAmount,
      status: 'active',
      expiresAt: new Date(expiresAt),
      createTxSignature: txSignature,
      memo,
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: payment._id.toString(),
        paymentId: payment.paymentId,
        paymentAccountAddress: payment.paymentAccountAddress,
        escrowAccountAddress: payment.escrowAccountAddress,
        escrowAmount: payment.escrowAmount,
        status: payment.status,
        expiresAt: payment.expiresAt,
        createTxSignature: payment.createTxSignature,
        createdAt: payment.createdAt,
      },
    });
  } catch (error) {
    console.error('Failed to create private payment:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
