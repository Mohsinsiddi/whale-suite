import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { Channel, ChannelMembership, ConfidentialBadge, generateAnonId } from '@/lib/database/models';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const {
      wallet,
      signature,
      message,
      timestamp,
      // INCO verification fields
      incoVerified,
      proofHandle,
      grantAccessTx,
    } = body;

    if (!wallet || !signature || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify timestamp is within 5 minutes
    const messageTimestamp = parseInt(timestamp || message.match(/at (\d+)/)?.[1] || '0');
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - messageTimestamp) > 300) {
      return NextResponse.json(
        { success: false, error: 'Signature expired' },
        { status: 400 }
      );
    }

    // Verify signature
    try {
      const publicKey = new PublicKey(wallet);
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = bs58.decode(signature);

      const isValid = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKey.toBytes()
      );

      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid signature' },
          { status: 401 }
        );
      }
    } catch {
      return NextResponse.json(
        { success: false, error: 'Signature verification failed' },
        { status: 401 }
      );
    }

    await connectDB();

    // Find channel
    const channel = await Channel.findOne({ slug, isActive: true });
    if (!channel) {
      return NextResponse.json(
        { success: false, error: 'Channel not found' },
        { status: 404 }
      );
    }

    // ========================================
    // BADGE TIER VERIFICATION
    // ========================================
    // Two modes:
    // 1. INCO-verified: Client already decrypted proof via INCO SDK
    // 2. MongoDB fallback: Check cached tier from MongoDB
    // ========================================

    if (incoVerified && proofHandle && grantAccessTx) {
      // INCO-verified: Trust client's INCO decryption result
      // The client already:
      // 1. Called grant_access on-chain
      // 2. Decrypted the proof_* handle via INCO
      // 3. Got TRUE result (otherwise wouldn't be calling this)
      console.log(`[Join] INCO-verified join for ${wallet}`);
      console.log(`[Join] Proof handle: ${proofHandle.slice(0, 20)}...`);
      console.log(`[Join] Grant access TX: ${grantAccessTx}`);

      // TODO: In production, verify the grantAccessTx on-chain
      // and potentially re-decrypt server-side for security
    } else {
      // Fallback: Check MongoDB cached tier
      const badge = await ConfidentialBadge.findOne({ wallet, isActive: true });
      if (!badge || badge.tier < channel.tier) {
        return NextResponse.json(
          { success: false, error: `Requires ${channel.tierName}+ badge` },
          { status: 403 }
        );
      }
      console.log(`[Join] MongoDB-verified join for ${wallet}, tier: ${badge.tier}`);
    }

    // Check if already a member
    let membership = await ChannelMembership.findOne({
      wallet,
      channelId: channel._id,
    });

    if (membership) {
      if (membership.isActive) {
        return NextResponse.json({
          success: true,
          membership: {
            anonId: membership.anonId,
            joinedAt: membership.joinedAt,
          },
          message: 'Already a member',
        });
      } else {
        // Reactivate membership
        membership.isActive = true;
        membership.verificationSignature = signature;
        membership.verifiedAt = new Date();
        await membership.save();
      }
    } else {
      // Create new membership
      membership = await ChannelMembership.create({
        wallet,
        channelId: channel._id,
        anonId: generateAnonId(),
        verificationSignature: signature,
        verifiedAt: new Date(),
        isActive: true,
        joinedAt: new Date(),
        lastSeenAt: new Date(),
      });

      // Increment member count
      await Channel.updateOne(
        { _id: channel._id },
        { $inc: { memberCount: 1 } }
      );
    }

    return NextResponse.json({
      success: true,
      membership: {
        anonId: membership.anonId,
        joinedAt: membership.joinedAt,
      },
    });
  } catch (error) {
    console.error('Failed to join channel:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
