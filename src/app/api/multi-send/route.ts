import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { MultiSendBatch, Transaction } from '@/lib/database/models';

export const dynamic = 'force-dynamic';

// GET - Fetch multi-send batches for a wallet
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const wallet = searchParams.get('wallet');
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    await connectDB();

    const [batches, total] = await Promise.all([
      MultiSendBatch.find({ wallet })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      MultiSendBatch.countDocuments({ wallet }),
    ]);

    return NextResponse.json({
      success: true,
      batches,
      total,
      hasMore: offset + batches.length < total,
    });
  } catch (error) {
    console.error('Multi-send fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch multi-send batches' },
      { status: 500 }
    );
  }
}

// POST - Create a new multi-send batch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      wallet,
      network = 'mainnet',
      token = 'SOL',
      tokenMint,
      tokenPrice,
      transferType = 'internal',
      recipients,
    } = body;

    if (!wallet || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Wallet and recipients array required' },
        { status: 400 }
      );
    }

    if (recipients.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 recipients per batch' },
        { status: 400 }
      );
    }

    await connectDB();

    // Calculate totals
    const totalAmount = recipients.reduce((sum: number, r: { amount: number }) => sum + r.amount, 0);
    const totalUsdValue = recipients.reduce((sum: number, r: { usdValue: number }) => sum + r.usdValue, 0);

    // Create batch
    const batch = await MultiSendBatch.create({
      wallet,
      network,
      token,
      tokenMint,
      tokenPrice: tokenPrice || 1,
      transferType,
      recipients: recipients.map((r: { address: string; amount: number; usdValue: number }) => ({
        address: r.address,
        amount: r.amount,
        usdValue: r.usdValue,
        status: 'pending',
      })),
      totalAmount,
      totalUsdValue,
      recipientCount: recipients.length,
      status: 'pending',
    });

    return NextResponse.json({
      success: true,
      batch: {
        id: batch._id.toString(),
        ...batch.toObject(),
      },
    });
  } catch (error) {
    console.error('Multi-send create error:', error);
    return NextResponse.json(
      { error: 'Failed to create multi-send batch' },
      { status: 500 }
    );
  }
}

// PATCH - Update batch progress (called after each transfer)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      batchId,
      recipientIndex,
      status,
      signature,
      error: errorMessage,
    } = body;

    if (!batchId || recipientIndex === undefined) {
      return NextResponse.json(
        { error: 'batchId and recipientIndex required' },
        { status: 400 }
      );
    }

    await connectDB();

    const batch = await MultiSendBatch.findById(batchId);
    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Update recipient status
    if (batch.recipients[recipientIndex]) {
      batch.recipients[recipientIndex].status = status;
      batch.recipients[recipientIndex].signature = signature;
      batch.recipients[recipientIndex].error = errorMessage;
      batch.recipients[recipientIndex].completedAt = new Date();
    }

    // Update batch counters
    if (status === 'success') {
      batch.completedCount += 1;

      // Also create a transaction record for this transfer
      try {
        await Transaction.create({
          wallet: batch.wallet,
          network: batch.network,
          type: 'shadow_transfer',
          amount: batch.recipients[recipientIndex].amount,
          token: batch.token,
          sdk: 'shadow-wire',
          signature,
          status: 'confirmed',
          metadata: {
            batchId: batch._id.toString(),
            recipientIndex,
            recipient: batch.recipients[recipientIndex].address,
            transferType: batch.transferType,
            isMultiSend: true,
          },
        });
      } catch (txError) {
        console.error('Failed to create transaction record:', txError);
      }
    } else if (status === 'failed') {
      batch.failedCount += 1;
    }

    batch.currentIndex = recipientIndex + 1;

    // Update batch status
    if (batch.currentIndex >= batch.recipientCount) {
      if (batch.failedCount === 0) {
        batch.status = 'completed';
      } else if (batch.completedCount === 0) {
        batch.status = 'failed';
      } else {
        batch.status = 'partial';
      }
      batch.completedAt = new Date();
    } else {
      batch.status = 'in_progress';
    }

    if (!batch.startedAt) {
      batch.startedAt = new Date();
    }

    await batch.save();

    return NextResponse.json({
      success: true,
      batch: {
        id: batch._id.toString(),
        status: batch.status,
        completedCount: batch.completedCount,
        failedCount: batch.failedCount,
        currentIndex: batch.currentIndex,
        recipients: batch.recipients,
      },
    });
  } catch (error) {
    console.error('Multi-send update error:', error);
    return NextResponse.json(
      { error: 'Failed to update multi-send batch' },
      { status: 500 }
    );
  }
}
