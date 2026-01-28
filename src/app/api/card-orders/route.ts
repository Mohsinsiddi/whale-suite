import { NextRequest, NextResponse } from 'next/server';
import { requireWallet } from '@/lib/auth/verifyPrivy';
import connectDB from '@/lib/database/mongodb';
import CardOrder from '@/lib/database/models/CardOrder';

/**
 * GET /api/card-orders - Get all card order IDs for authenticated user
 * Query params: network (mainnet | devnet)
 */
export async function GET(request: NextRequest) {
  const auth = await requireWallet(request);
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const network = searchParams.get('network') || 'mainnet';

    await connectDB();

    const orders = await CardOrder.find({
      wallet: auth.user.wallet.toLowerCase(),
      network
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

/**
 * POST /api/card-orders - Save a new card order ID
 */
export async function POST(request: NextRequest) {
  const auth = await requireWallet(request);
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json();
    const { orderId, network = 'mainnet', cardType, amount } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    await connectDB();

    // Check if order already exists on same network
    const existing = await CardOrder.findOne({
      orderId,
      network,
      wallet: auth.user.wallet.toLowerCase()
    });

    if (existing) {
      return NextResponse.json({ order: existing });
    }

    const order = await CardOrder.create({
      wallet: auth.user.wallet.toLowerCase(),
      orderId,
      network,
      cardType,
      amount,
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error('Failed to save order:', error);
    return NextResponse.json({ error: 'Failed to save order' }, { status: 500 });
  }
}

/**
 * PATCH /api/card-orders - Update order (add txSignature)
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireWallet(request);
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json();
    const { orderId, txSignature, network = 'mainnet' } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    await connectDB();

    const order = await CardOrder.findOneAndUpdate(
      { orderId, wallet: auth.user.wallet.toLowerCase(), network },
      { $set: { txSignature } },
      { new: true }
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Failed to update order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
