import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { PrivatePayment } from '@/lib/database/models';

interface RouteParams {
  params: Promise<{ paymentId: string }>;
}

// GET - Get payment details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { paymentId } = await params;

    await connectDB();

    const payment = await PrivatePayment.findOne({ paymentId }).lean();

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Check if expired
    const now = new Date();
    const isExpired = new Date(payment.expiresAt) < now && payment.status === 'active';

    if (isExpired) {
      await PrivatePayment.updateOne(
        { paymentId },
        { $set: { status: 'expired' } }
      );
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment._id.toString(),
        paymentId: payment.paymentId,
        paymentAccountAddress: payment.paymentAccountAddress,
        escrowAccountAddress: payment.escrowAccountAddress,
        escrowAmount: payment.escrowAmount,
        status: isExpired ? 'expired' : payment.status,
        expiresAt: payment.expiresAt,
        claimedAt: payment.claimedAt,
        createTxSignature: payment.createTxSignature,
        claimTxSignature: payment.claimTxSignature,
        finalizeTxSignature: payment.finalizeTxSignature,
        cancelTxSignature: payment.cancelTxSignature,
        memo: payment.memo,
        createdAt: payment.createdAt,
      },
    });
  } catch (error) {
    console.error('Failed to fetch payment:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update payment status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { paymentId } = await params;
    const body = await request.json();
    const { status, txSignature, claimedAt, cancelledAt } = body;

    if (!status || !txSignature) {
      return NextResponse.json(
        { success: false, error: 'Status and txSignature required' },
        { status: 400 }
      );
    }

    await connectDB();

    const payment = await PrivatePayment.findOne({ paymentId });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Update based on status change
    const updates: Record<string, unknown> = { status };

    switch (status) {
      case 'pending':
        updates.claimTxSignature = txSignature;
        break;
      case 'claimed':
        updates.finalizeTxSignature = txSignature;
        updates.claimedAt = claimedAt || new Date();
        break;
      case 'cancelled':
        updates.cancelTxSignature = txSignature;
        updates.cancelledAt = cancelledAt || new Date();
        break;
    }

    await PrivatePayment.updateOne({ paymentId }, { $set: updates });

    const updatedPayment = await PrivatePayment.findOne({ paymentId }).lean();

    return NextResponse.json({
      success: true,
      payment: {
        id: updatedPayment!._id.toString(),
        paymentId: updatedPayment!.paymentId,
        status: updatedPayment!.status,
        claimTxSignature: updatedPayment!.claimTxSignature,
        finalizeTxSignature: updatedPayment!.finalizeTxSignature,
        cancelTxSignature: updatedPayment!.cancelTxSignature,
        claimedAt: updatedPayment!.claimedAt,
      },
    });
  } catch (error) {
    console.error('Failed to update payment:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
