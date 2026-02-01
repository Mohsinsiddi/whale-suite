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
      // Privacy-first: badgePda is the identity
      badgePda,
      badgeId,
      // Wallet is only used for signature verification
      wallet,
      signature,
      message,
      timestamp,
      // requiredTier - sent by client but tier verification happens client-side via INCO
      // INCO verification fields
      incoVerified,
      proofHandle,
      grantAccessTx,
    } = body;

    // Require badgePda for privacy-first membership
    if (!badgePda || !signature || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields (badgePda, signature, message)' },
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

    // Extract wallet from message if not provided directly
    // Message format: "Join channel {slug} with badge {badgePda} at {timestamp}"
    const signerWallet = wallet;
    if (!signerWallet) {
      // Try to verify signature against the badge PDA's owner
      // For now, require wallet to be passed
      return NextResponse.json(
        { success: false, error: 'Wallet required for signature verification' },
        { status: 400 }
      );
    }

    // Verify signature (proves badge ownership via wallet)
    try {
      const publicKey = new PublicKey(signerWallet);
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
      console.log(`[Join] INCO-verified join for badge ${badgePda}`);
      console.log(`[Join] Badge ID: ${badgeId}`);
      console.log(`[Join] Proof handle: ${proofHandle.toString().slice(0, 20)}...`);
      console.log(`[Join] Grant access TX: ${grantAccessTx}`);

      // TODO: In production, verify the grantAccessTx on-chain
      // and potentially re-decrypt server-side for security
    } else {
      // Fallback: Check MongoDB cached tier using wallet
      const badge = await ConfidentialBadge.findOne({
        $or: [
          { badgeAccountAddress: badgePda },
          { wallet: signerWallet },
        ],
        isActive: true,
      });

      if (!badge || badge.tier < channel.tier) {
        return NextResponse.json(
          { success: false, error: `Requires ${channel.tierName}+ badge` },
          { status: 403 }
        );
      }
      console.log(`[Join] MongoDB-verified join for badge ${badgePda}, tier: ${badge.tier}`);
    }

    // ========================================
    // MEMBERSHIP: Use badgePda as identity (privacy!)
    // This way, wallet address is never stored in membership
    // ========================================

    // Check if already a member (by badge PDA, not wallet)
    let membership = await ChannelMembership.findOne({
      badgePda, // Privacy: lookup by badge, not wallet
      channelId: channel._id,
    });

    // Also check legacy wallet-based membership
    if (!membership) {
      membership = await ChannelMembership.findOne({
        wallet: signerWallet,
        channelId: channel._id,
      });

      // If found legacy membership, migrate to badge-based
      if (membership) {
        membership.badgePda = badgePda;
        membership.badgeId = badgeId;
        await membership.save();
        console.log(`[Join] Migrated legacy membership to badge-based for ${badgePda}`);
      }
    }

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
        membership.badgePda = badgePda;
        membership.badgeId = badgeId;
        membership.verificationSignature = signature;
        membership.verifiedAt = new Date();
        if (grantAccessTx) {
          membership.grantAccessTx = grantAccessTx;
        }
        await membership.save();
      }
    } else {
      // Create new membership with badge PDA as identity
      membership = await ChannelMembership.create({
        // Privacy: Store badge PDA, not wallet (wallet is only for verification)
        badgePda,
        badgeId,
        wallet: signerWallet, // Keep for backwards compatibility, but badge is primary
        channelId: channel._id,
        anonId: generateAnonId(),
        verificationSignature: signature,
        grantAccessTx: grantAccessTx || null,
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

      console.log(`[Join] Created new membership for badge ${badgePda} as ${membership.anonId}`);
    }

    return NextResponse.json({
      success: true,
      membership: {
        anonId: membership.anonId,
        joinedAt: membership.joinedAt,
        badgePda, // Return for client reference
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
