/**
 * Darklake Pending Orders API
 * Saves/retrieves pending swap orders so users can resume if they close the page
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/mongodb';

// Pending order schema
interface PendingOrder {
  wallet: string;
  orderKey: string;
  inputMint: string;
  outputMint: string;
  inputAmount: string;
  minOutputAmount: string;
  salt: string; // Base64 encoded
  commitSignature: string; // TX 1: Order creation
  settleSignature?: string; // TX 2: Order settlement (only after success)
  status: 'pending_settle' | 'settled' | 'cancelled' | 'expired';
  createdAt: Date;
  updatedAt: Date;
  settledAt?: Date; // When order was successfully settled
  expiresAt?: Date; // Deadline for settlement (~2 min from creation)
}

/**
 * GET - Fetch pending orders for a wallet
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    // Check for debug param to see all orders
    const showAll = searchParams.get('all') === 'true';

    // Query wallet - try both exact match and lowercase (for backwards compatibility)
    const query: Record<string, unknown> = {
      $or: [
        { wallet: wallet },
        { wallet: wallet.toLowerCase() },
      ],
    };

    if (!showAll) {
      query.status = 'pending_settle';
    }

    const orders = await db
      .collection('darklake_orders')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50) // Increased limit to show more orders
      .toArray();

    console.log('[Darklake Orders API] Found orders:', orders.length, 'for wallet:', wallet, 'showAll:', showAll);

    return NextResponse.json({ orders, count: orders.length });
  } catch (error) {
    console.error('[Darklake Orders API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

/**
 * POST - Save a new pending order after commit
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      wallet,
      orderKey,
      inputMint,
      outputMint,
      inputAmount,
      minOutputAmount,
      salt, // Base64 encoded Uint8Array
      commitSignature,
    } = body;

    // Validate required fields
    if (!wallet || !orderKey || !inputMint || !outputMint || !inputAmount || !salt || !commitSignature) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const order: PendingOrder = {
      wallet: wallet, // Keep original case (Solana addresses are case-sensitive)
      orderKey,
      inputMint,
      outputMint,
      inputAmount: inputAmount.toString(),
      minOutputAmount: minOutputAmount?.toString() || '0',
      salt,
      commitSignature,
      status: 'pending_settle',
      createdAt: new Date(),
      updatedAt: new Date(),
      // Approximate expiry for UI - actual deadline is controlled by Darklake's
      // on-chain deadline_slot_duration config (typically ~300 slots ≈ 2 minutes)
      expiresAt: new Date(Date.now() + 2 * 60 * 1000),
    };

    // Upsert to handle retries - use exact wallet and orderKey
    await db.collection('darklake_orders').updateOne(
      { wallet: wallet, orderKey },
      { $set: order },
      { upsert: true }
    );

    console.log('[Darklake Orders API] Saved pending order:', orderKey);

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('[Darklake Orders API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save order' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update order status (settled, cancelled, expired)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet, orderKey, status, settleSignature } = body;

    if (!wallet || !orderKey || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };

    if (settleSignature) {
      updateData.settleSignature = settleSignature;
    }

    // Record settlement timestamp on success
    if (status === 'settled' && settleSignature) {
      updateData.settledAt = new Date();
    }

    // Try to update - check both exact wallet and lowercase for backwards compatibility
    let result = await db.collection('darklake_orders').updateOne(
      { wallet: wallet, orderKey },
      { $set: updateData }
    );

    // If no match, try lowercase (backwards compatibility)
    if (result.matchedCount === 0) {
      result = await db.collection('darklake_orders').updateOne(
        { wallet: wallet.toLowerCase(), orderKey },
        { $set: updateData }
      );
    }

    if (result.matchedCount === 0) {
      console.log('[Darklake Orders API] Order not found for update:', { wallet, orderKey });
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    console.log('[Darklake Orders API] Updated order:', orderKey, 'to', status);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Darklake Orders API] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
