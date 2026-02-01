/**
 * User Tokens API
 * Store and retrieve tokens created by users via Anoncoin
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/mongodb';

const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

interface TokenRecord {
  wallet: string;
  mintAddress: string;
  name: string;
  symbol: string;
  description: string;
  imageUrl?: string;
  twitterLink?: string;
  telegramLink?: string;
  signature: string;
  createdAt: Date;
  // Metadata from Helius (cached)
  metadata?: {
    supply?: string;
    decimals?: number;
    holders?: number;
    price?: number;
    lastUpdated?: Date;
  };
}

/**
 * Fetch token metadata from Helius DAS API
 */
async function fetchTokenMetadata(mintAddress: string) {
  try {
    const response = await fetch(HELIUS_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'token-metadata',
        method: 'getAsset',
        params: { id: mintAddress },
      }),
    });

    const data = await response.json();

    if (data.result) {
      const asset = data.result;
      return {
        name: asset.content?.metadata?.name || '',
        symbol: asset.content?.metadata?.symbol || '',
        imageUrl: asset.content?.links?.image || asset.content?.files?.[0]?.uri || '',
        description: asset.content?.metadata?.description || '',
        supply: asset.token_info?.supply || '0',
        decimals: asset.token_info?.decimals || 9,
      };
    }
    return null;
  } catch (error) {
    console.error('[Tokens API] Helius fetch error:', error);
    return null;
  }
}

/**
 * GET - Fetch tokens created by a wallet
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    const tokens = await db
      .collection('user_tokens')
      .find({ wallet })
      .sort({ createdAt: -1 })
      .toArray();

    // Optionally refresh metadata for tokens (in background for performance)
    // For now, just return cached data

    console.log('[Tokens API] Found', tokens.length, 'tokens for wallet:', wallet);

    return NextResponse.json({ tokens, count: tokens.length });
  } catch (error) {
    console.error('[Tokens API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
}

/**
 * POST - Save a new token created by user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      wallet,
      mintAddress,
      name,
      symbol,
      description,
      imageUrl,
      twitterLink,
      telegramLink,
      signature,
    } = body;

    if (!wallet || !mintAddress || !name || !symbol || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Fetch metadata from Helius
    const metadata = await fetchTokenMetadata(mintAddress);

    const tokenRecord: TokenRecord = {
      wallet,
      mintAddress,
      name,
      symbol,
      description: description || '',
      imageUrl: imageUrl || metadata?.imageUrl || '',
      twitterLink: twitterLink || '',
      telegramLink: telegramLink || '',
      signature,
      createdAt: new Date(),
      metadata: metadata ? {
        supply: metadata.supply,
        decimals: metadata.decimals,
        lastUpdated: new Date(),
      } : undefined,
    };

    // Upsert to handle retries
    await db.collection('user_tokens').updateOne(
      { wallet, mintAddress },
      { $set: tokenRecord },
      { upsert: true }
    );

    console.log('[Tokens API] Saved token:', symbol, 'for wallet:', wallet);

    return NextResponse.json({ success: true, token: tokenRecord });
  } catch (error) {
    console.error('[Tokens API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save token' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Refresh token metadata from Helius
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { mintAddress } = body;

    if (!mintAddress) {
      return NextResponse.json(
        { error: 'Mint address required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Fetch fresh metadata from Helius
    const metadata = await fetchTokenMetadata(mintAddress);

    if (!metadata) {
      return NextResponse.json(
        { error: 'Failed to fetch metadata' },
        { status: 404 }
      );
    }

    // Update the token record
    await db.collection('user_tokens').updateOne(
      { mintAddress },
      {
        $set: {
          'metadata.supply': metadata.supply,
          'metadata.decimals': metadata.decimals,
          'metadata.lastUpdated': new Date(),
          imageUrl: metadata.imageUrl,
        },
      }
    );

    console.log('[Tokens API] Refreshed metadata for:', mintAddress);

    return NextResponse.json({ success: true, metadata });
  } catch (error) {
    console.error('[Tokens API] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh metadata' },
      { status: 500 }
    );
  }
}
