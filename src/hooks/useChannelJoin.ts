'use client';

import { useState, useCallback } from 'react';
import { PublicKey, Connection, Transaction, ComputeBudgetProgram, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { useWallets, useSignTransaction, useSignMessage } from '@privy-io/react-auth/solana';
import { decrypt } from '@inco/solana-sdk/attested-decrypt';
import bs58 from 'bs58';
import {
  PROGRAM_ID,
  INCO_PROGRAM_ID,
  deriveBadgePda,
  deriveConfigPda,
  fetchBadgeAccount,
  fetchConfigAccount,
  INSTRUCTION_DISCRIMINATORS,
  BadgeAccountData,
} from '@/lib/contract/badge-sdk';

// ============================================
// TYPES
// ============================================

export interface UserBadge {
  pda: PublicKey;
  badgeId: bigint;
  data: BadgeAccountData;
}

export interface JoinStep {
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  description?: string;
}

export interface JoinChannelState {
  loading: boolean;
  currentStep: number;
  steps: JoinStep[];
  error: string | null;
  success: boolean;
  anonId: string | null;
  txSignature: string | null;
}

export interface JoinChannelResult {
  success: boolean;
  anonId?: string;
  txSignature?: string;
  error?: string;
}

// ============================================
// CONSTANTS
// ============================================

// Timing constants for smooth UX
const STEP_TRANSITION_DELAY = 400;       // Delay between step transitions for visual feedback
const TX_CONFIRM_DELAY = 2000;           // Wait after TX confirmation
const INCO_PROPAGATION_DELAY = 15000;    // 15s for INCO to sync handles (critical!)
const DECRYPT_RETRY_DELAY = 3000;        // 3s between decrypt retries
const MAX_DECRYPT_RETRIES = 5;           // Max retry attempts

// Proof handle keys by tier
const TIER_PROOF_KEYS: Record<number, keyof BadgeAccountData> = {
  1: 'proofBronze',
  2: 'proofSilver',
  3: 'proofGold',
  4: 'proofDiamond',
  5: 'proofLegendary',
};

const TIER_NAMES: Record<number, string> = {
  1: 'Bronze',
  2: 'Silver',
  3: 'Gold',
  4: 'Diamond',
  5: 'Legendary',
};

// ============================================
// HELPERS
// ============================================

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Derive INCO allowance PDA for a handle
 */
function deriveAllowancePda(handle: bigint, owner: PublicKey): [PublicKey, number] {
  const buf = Buffer.alloc(16);
  let v = handle;
  for (let i = 0; i < 16; i++) {
    buf[i] = Number(v & BigInt(0xff));
    v >>= BigInt(8);
  }
  return PublicKey.findProgramAddressSync(
    [buf, owner.toBuffer()],
    INCO_PROGRAM_ID
  );
}

/**
 * Find ALL user badges by scanning through badge IDs on-chain
 */
export async function findAllUserBadges(
  connection: Connection,
  userPubkey: PublicKey
): Promise<UserBadge[]> {
  const badges: UserBadge[] = [];

  try {
    // Fetch config to get nextBadgeId
    const [configPda] = deriveConfigPda();
    const config = await fetchConfigAccount(connection, configPda);

    if (!config) {
      console.log('[findAllUserBadges] Config not found');
      return badges;
    }

    const nextBadgeId = Number(config.nextBadgeId);
    console.log('[findAllUserBadges] Scanning badge IDs 0 to', nextBadgeId - 1);

    // Scan through all badge IDs to find user's badges
    const scanPromises = [];
    for (let badgeId = 0; badgeId < nextBadgeId; badgeId++) {
      const [badgePda] = deriveBadgePda(userPubkey, BigInt(badgeId));
      scanPromises.push(
        fetchBadgeAccount(connection, badgePda)
          .then(badgeData => {
            if (badgeData && badgeData.owner.equals(userPubkey) && badgeData.isActive) {
              return { pda: badgePda, badgeId: BigInt(badgeId), data: badgeData };
            }
            return null;
          })
          .catch(() => null)
      );
    }

    const results = await Promise.all(scanPromises);
    for (const result of results) {
      if (result) badges.push(result);
    }

    console.log('[findAllUserBadges] Found', badges.length, 'badges for user');
    return badges;
  } catch (err) {
    console.error('[findAllUserBadges] Error:', err);
    return badges;
  }
}

// ============================================
// HOOK
// ============================================

export function useChannelJoin() {
  const { wallets } = useWallets();
  const { signTransaction: privySignTransaction } = useSignTransaction();
  const { signMessage: privySignMessage } = useSignMessage();

  const wallet = wallets?.[0] || null;
  const walletAddress = wallet?.address || null;

  const [state, setState] = useState<JoinChannelState>({
    loading: false,
    currentStep: 0,
    steps: [],
    error: null,
    success: false,
    anonId: null,
    txSignature: null,
  });

  /**
   * Sign a message using Privy (compatible with INCO SDK signMessage interface)
   */
  const signMessage = useCallback(async (message: Uint8Array): Promise<Uint8Array> => {
    if (!wallet) throw new Error('Wallet not connected');

    const result = await privySignMessage({
      message,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      wallet: wallet as any,
    });

    // Handle both base58 string and Uint8Array responses
    if (typeof result.signature === 'string') {
      return bs58.decode(result.signature);
    }
    return new Uint8Array(result.signature);
  }, [wallet, privySignMessage]);

  /**
   * Sign transaction using Privy for INCO devnet
   */
  const signTransaction = useCallback(async (tx: Transaction): Promise<Transaction> => {
    if (!wallet) throw new Error('Wallet not connected');

    const serialized = tx.serialize({ requireAllSignatures: false });
    const result = await privySignTransaction({
      transaction: serialized,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      wallet: wallet as any,
      chain: 'solana:devnet',
    });

    return Transaction.from(result.signedTransaction);
  }, [wallet, privySignTransaction]);

  /**
   * Update a specific step's status with smooth transition
   */
  const updateStep = useCallback(async (
    stepIndex: number,
    status: JoinStep['status'],
    description?: string,
    addDelay: boolean = true
  ) => {
    setState(prev => ({
      ...prev,
      currentStep: stepIndex,
      steps: prev.steps.map((step, i) =>
        i === stepIndex
          ? { ...step, status, description: description || step.description }
          : step
      ),
    }));

    // Add small delay for visual feedback
    if (addDelay && status === 'completed') {
      await sleep(STEP_TRANSITION_DELAY);
    }
  }, []);

  /**
   * Build grant_access instruction for INCO decryption
   */
  const buildGrantAccessInstruction = useCallback((
    userPubkey: PublicKey,
    badgePda: PublicKey,
    badgeId: bigint,
    allowancePdas: PublicKey[],
  ): TransactionInstruction => {
    // Build remaining accounts: [allowance0, user, allowance1, user, ...]
    const remainingAccounts = allowancePdas.flatMap(allowance => [
      { pubkey: allowance, isSigner: false, isWritable: true },
      { pubkey: userPubkey, isSigner: false, isWritable: false },
    ]);

    // Encode badge_id as u64 LE bytes
    const badgeIdBuffer = Buffer.alloc(8);
    badgeIdBuffer.writeBigUInt64LE(badgeId);

    // Instruction data: discriminator + badge_id
    const data = Buffer.concat([
      INSTRUCTION_DISCRIMINATORS.grantAccess,
      badgeIdBuffer,
    ]);

    return new TransactionInstruction({
      keys: [
        { pubkey: userPubkey, isSigner: true, isWritable: true },
        { pubkey: badgePda, isSigner: false, isWritable: false },
        { pubkey: INCO_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ...remainingAccounts,
      ],
      programId: PROGRAM_ID,
      data,
    });
  }, []);

  /**
   * Decrypt a proof handle using INCO SDK with retries
   */
  const decryptProofHandle = useCallback(async (
    handle: string,
    onRetry?: (attempt: number, maxRetries: number) => void
  ): Promise<boolean | null> => {
    if (!walletAddress) return null;

    console.log('[INCO] Decrypting handle:', handle.slice(0, 20) + '...');

    for (let attempt = 1; attempt <= MAX_DECRYPT_RETRIES; attempt++) {
      try {
        const result = await decrypt([handle], {
          address: new PublicKey(walletAddress),
          signMessage,
        });

        const plaintext = result.plaintexts?.[0];
        const isTrue = plaintext === '1';

        console.log(`[INCO] Decrypted: ${plaintext} (${isTrue ? 'TRUE - ACCESS GRANTED' : 'FALSE - ACCESS DENIED'})`);
        return isTrue;
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.log(`[INCO] Decrypt attempt ${attempt}/${MAX_DECRYPT_RETRIES} failed:`, errorMsg);

        if (attempt < MAX_DECRYPT_RETRIES) {
          if (errorMsg.includes('No ciphertext found') || errorMsg.includes('not found')) {
            console.log(`[INCO] Waiting ${DECRYPT_RETRY_DELAY / 1000}s before retry...`);
            onRetry?.(attempt, MAX_DECRYPT_RETRIES);
            await sleep(DECRYPT_RETRY_DELAY);
          } else {
            // Non-retryable error
            throw error;
          }
        }
      }
    }

    console.error('[INCO] Decrypt failed after all retries');
    return null;
  }, [walletAddress, signMessage]);

  /**
   * Join a channel with full INCO verification
   * @param channelSlug - The channel to join
   * @param requiredTier - Minimum tier required (1-5)
   * @param selectedBadge - The badge to use for joining (from findAllUserBadges)
   */
  const joinChannel = useCallback(async (
    channelSlug: string,
    requiredTier: number,
    selectedBadge: UserBadge
  ): Promise<JoinChannelResult> => {
    if (!walletAddress || !wallet) {
      return { success: false, error: 'Wallet not connected' };
    }

    if (!selectedBadge) {
      return { success: false, error: 'No badge selected' };
    }

    // Initialize steps for the modal
    const initialSteps: JoinStep[] = [
      { label: 'Verify Badge Ownership', status: 'pending', description: 'Confirming you own this badge...' },
      { label: 'Grant INCO Decrypt Access', status: 'pending', description: 'Requesting decryption permission...' },
      { label: 'Wait for INCO Network', status: 'pending', description: 'Syncing with INCO FHE network...' },
      { label: `Decrypt ${TIER_NAMES[requiredTier]} Proof`, status: 'pending', description: 'Verifying tier access via FHE...' },
      { label: 'Create Anonymous Membership', status: 'pending', description: 'Generating anonymous identity...' },
    ];

    setState({
      loading: true,
      currentStep: 0,
      steps: initialSteps,
      error: null,
      success: false,
      anonId: null,
      txSignature: null,
    });

    try {
      const connection = new Connection(
        process.env.NEXT_PUBLIC_DEVNET_RPC || 'https://api.devnet.solana.com',
        'confirmed'
      );
      const userPubkey = new PublicKey(walletAddress);
      const { pda: badgePda, badgeId, data: badgeData } = selectedBadge;

      // ========================================
      // STEP 1: Verify Badge Ownership
      // ========================================
      await updateStep(0, 'active', 'Verifying badge ownership on-chain...');
      await sleep(500);

      // Double-check badge is still valid and owned by user
      const freshBadgeData = await fetchBadgeAccount(connection, badgePda);

      if (!freshBadgeData) {
        throw new Error('Badge not found on-chain. It may have been closed.');
      }

      if (!freshBadgeData.owner.equals(userPubkey)) {
        throw new Error('You do not own this badge.');
      }

      if (!freshBadgeData.isActive) {
        throw new Error('This badge is inactive.');
      }

      await updateStep(0, 'completed', `Badge #${badgeId} verified`);

      // ========================================
      // STEP 2: Grant INCO Decrypt Access
      // ========================================
      await updateStep(1, 'active', 'Building grant_access transaction...');

      // Get all proof handles as BigInt
      const handles = [
        BigInt(badgeData.encryptedTier),
        BigInt(badgeData.proofBronze),
        BigInt(badgeData.proofSilver),
        BigInt(badgeData.proofGold),
        BigInt(badgeData.proofDiamond),
        BigInt(badgeData.proofLegendary),
      ];

      // Derive allowance PDAs for all handles
      const allowancePdas = handles.map(h => deriveAllowancePda(h, userPubkey)[0]);

      // Build grant_access transaction
      const grantIx = buildGrantAccessInstruction(userPubkey, badgePda, badgeId, allowancePdas);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

      const tx = new Transaction();
      tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 1_200_000 }));
      tx.add(grantIx);
      tx.recentBlockhash = blockhash;
      tx.feePayer = userPubkey;

      await updateStep(1, 'active', 'Please approve in your wallet...');

      // Sign the transaction
      const signedTx = await signTransaction(tx);

      await updateStep(1, 'active', 'Submitting to blockchain...');

      // Send and confirm
      const grantTxSig = await connection.sendRawTransaction(signedTx.serialize());

      await connection.confirmTransaction({
        signature: grantTxSig,
        blockhash,
        lastValidBlockHeight,
      }, 'confirmed');

      console.log('[Join] grant_access TX:', grantTxSig);
      setState(prev => ({ ...prev, txSignature: grantTxSig }));

      await updateStep(1, 'completed', `TX: ${grantTxSig.slice(0, 8)}...`);
      await sleep(TX_CONFIRM_DELAY);

      // ========================================
      // STEP 3: Wait for INCO Network Propagation
      // ========================================
      await updateStep(2, 'active', 'Waiting for INCO network to sync...');

      // Show countdown for better UX
      const propagationSeconds = INCO_PROPAGATION_DELAY / 1000;
      for (let i = propagationSeconds; i > 0; i--) {
        await updateStep(2, 'active', `Syncing with INCO network... ${i}s remaining`, false);
        await sleep(1000);
      }

      await updateStep(2, 'completed', 'INCO network synced');

      // ========================================
      // STEP 4: Decrypt Tier Proof
      // ========================================
      await updateStep(3, 'active', `Decrypting ${TIER_NAMES[requiredTier]} tier proof...`);

      // Get the proof handle for the required tier
      const proofKey = TIER_PROOF_KEYS[requiredTier];
      const proofHandle = badgeData[proofKey] as string;

      if (!proofHandle || proofHandle === '0') {
        throw new Error(`No proof handle found for ${TIER_NAMES[requiredTier]} tier`);
      }

      // Decrypt with retry handling
      const hasAccess = await decryptProofHandle(proofHandle, (attempt, max) => {
        updateStep(3, 'active', `Decrypting... retry ${attempt}/${max}`, false);
      });

      if (hasAccess === null) {
        // INCO timeout - use fallback verification
        console.log('[Join] INCO decrypt timeout, using MongoDB fallback');
        await updateStep(3, 'completed', 'Using fallback verification');
      } else if (hasAccess === false) {
        // User's tier is below required
        await updateStep(3, 'error', `Your badge tier is below ${TIER_NAMES[requiredTier]}`);
        setState(prev => ({
          ...prev,
          loading: false,
          error: `Access denied: Your badge tier is below ${TIER_NAMES[requiredTier]}. Please upgrade your badge.`
        }));
        return { success: false, error: 'Insufficient tier' };
      } else {
        // Access granted via INCO proof!
        await updateStep(3, 'completed', 'Access verified via INCO FHE ✓');
      }

      // ========================================
      // STEP 5: Create Anonymous Membership
      // ========================================
      await updateStep(4, 'active', 'Creating anonymous membership...');

      // Sign a message for verification (also used for anonId generation)
      const timestamp = Math.floor(Date.now() / 1000);
      const message = `Join channel ${channelSlug} with badge ${badgePda.toBase58()} at ${timestamp}`;
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = await signMessage(messageBytes);
      const signature = bs58.encode(signatureBytes);

      // Call backend to create membership
      const response = await fetch(`/api/channels/${channelSlug}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Privacy-first: badge PDA is the identity
          badgePda: badgePda.toBase58(),
          badgeId: badgeId.toString(),
          // Wallet only for signature verification (not stored in membership)
          wallet: walletAddress,
          signature,
          message,
          timestamp,
          requiredTier,
          // INCO verification data
          incoVerified: hasAccess === true,
          proofHandle,
          grantAccessTx: grantTxSig,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create membership');
      }

      await updateStep(4, 'completed', `Joined as ${data.membership.anonId}`);

      // Success!
      setState(prev => ({
        ...prev,
        loading: false,
        success: true,
        anonId: data.membership.anonId,
        txSignature: grantTxSig,
      }));

      return {
        success: true,
        anonId: data.membership.anonId,
        txSignature: grantTxSig,
      };

    } catch (error) {
      console.error('[Join] Error:', error);
      let errorMsg = error instanceof Error ? error.message : 'Unknown error';

      // User-friendly error messages
      if (errorMsg.includes('User rejected') || errorMsg.includes('user rejected')) {
        errorMsg = 'Transaction cancelled by user';
      } else if (errorMsg.includes('insufficient funds') || errorMsg.includes('Insufficient')) {
        errorMsg = 'Insufficient SOL for transaction fees';
      } else if (errorMsg.includes('BadgeInactive')) {
        errorMsg = 'This badge is inactive. Please use an active badge.';
      } else if (errorMsg.includes('Unauthorized')) {
        errorMsg = 'You do not own this badge.';
      }

      // Update current step to error
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMsg,
        steps: prev.steps.map((step, i) =>
          i === prev.currentStep ? { ...step, status: 'error' as const, description: errorMsg } : step
        ),
      }));

      return { success: false, error: errorMsg };
    }
  }, [walletAddress, wallet, signMessage, signTransaction, updateStep, buildGrantAccessInstruction, decryptProofHandle]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      loading: false,
      currentStep: 0,
      steps: [],
      error: null,
      success: false,
      anonId: null,
      txSignature: null,
    });
  }, []);

  return {
    ...state,
    walletAddress,
    joinChannel,
    findAllUserBadges,
    reset,
  };
}

export default useChannelJoin;
