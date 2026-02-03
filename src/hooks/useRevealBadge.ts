'use client';

import { useState, useCallback } from 'react';
import { PublicKey, Connection, Transaction, ComputeBudgetProgram, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { useWallets, useSignTransaction, useSignMessage } from '@privy-io/react-auth/solana';
import { decrypt } from '@inco/solana-sdk/attested-decrypt';
import bs58 from 'bs58';
import {
  PROGRAM_ID,
  INCO_PROGRAM_ID,
  INSTRUCTION_DISCRIMINATORS,
} from '@/lib/contract/badge-sdk';
import type { UserBadge } from './useChannelJoin';

// ============================================
// TYPES
// ============================================

export interface RevealStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  description?: string;
}

export interface RevealBadgeState {
  loading: boolean;
  currentStep: number;
  steps: RevealStep[];
  error: string | null;
  success: boolean;
  revealedTier: number | null;
  txSignature: string | null;
}

export interface RevealBadgeResult {
  success: boolean;
  tier?: number;
  txSignature?: string;
  error?: string;
}

// ============================================
// CONSTANTS
// ============================================

const STEP_TRANSITION_DELAY = 400;
const TX_CONFIRM_DELAY = 2000;
const INCO_PROPAGATION_DELAY = 25000;  // 25s for INCO sync
const DECRYPT_RETRY_DELAY = 3000;
const MAX_DECRYPT_RETRIES = 6;

export const TIER_NAMES: Record<number, string> = {
  1: 'Bronze',
  2: 'Silver',
  3: 'Gold',
  4: 'Diamond',
  5: 'Legendary',
};

export const TIER_INFO: Record<number, { name: string; icon: string; color: string; hex: string }> = {
  1: { name: 'Bronze', icon: '🥉', color: 'from-amber-700 to-amber-900', hex: '#CD7F32' },
  2: { name: 'Silver', icon: '🥈', color: 'from-gray-300 to-gray-500', hex: '#C0C0C0' },
  3: { name: 'Gold', icon: '🥇', color: 'from-yellow-400 to-yellow-600', hex: '#FFD700' },
  4: { name: 'Diamond', icon: '💎', color: 'from-cyan-300 to-cyan-500', hex: '#00D4FF' },
  5: { name: 'Legendary', icon: '👑', color: 'from-purple-400 to-purple-600', hex: '#8B5CF6' },
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
 * Check if INCO allowance PDA already exists (access already granted)
 */
async function checkAllowanceExists(connection: Connection, allowancePda: PublicKey): Promise<boolean> {
  try {
    const accountInfo = await connection.getAccountInfo(allowancePda);
    return accountInfo !== null && accountInfo.data.length > 0;
  } catch {
    return false;
  }
}

// ============================================
// HOOK
// ============================================

export function useRevealBadge() {
  const { wallets } = useWallets();
  const { signTransaction: privySignTransaction } = useSignTransaction();
  const { signMessage: privySignMessage } = useSignMessage();

  const wallet = wallets?.[0] || null;
  const walletAddress = wallet?.address || null;

  const [state, setState] = useState<RevealBadgeState>({
    loading: false,
    currentStep: 0,
    steps: [],
    error: null,
    success: false,
    revealedTier: null,
    txSignature: null,
  });

  /**
   * Sign a message using Privy (compatible with INCO SDK)
   */
  const signMessage = useCallback(async (message: Uint8Array): Promise<Uint8Array> => {
    if (!wallet) throw new Error('Wallet not connected');

    const result = await privySignMessage({
      message,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      wallet: wallet as any,
    });

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
   * Update a step's status
   */
  const updateStep = useCallback(async (
    stepIndex: number,
    status: RevealStep['status'],
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
    const remainingAccounts = allowancePdas.flatMap(allowance => [
      { pubkey: allowance, isSigner: false, isWritable: true },
      { pubkey: userPubkey, isSigner: false, isWritable: false },
    ]);

    const badgeIdBuffer = Buffer.alloc(8);
    badgeIdBuffer.writeBigUInt64LE(badgeId);

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
   * Decrypt encryptedTier handle using INCO SDK with retries
   */
  const decryptTierHandle = useCallback(async (
    handle: string,
    onRetry?: (attempt: number, maxRetries: number) => void
  ): Promise<number | null> => {
    if (!walletAddress) return null;

    console.log('[INCO] Decrypting tier handle:', handle.slice(0, 20) + '...');

    for (let attempt = 1; attempt <= MAX_DECRYPT_RETRIES; attempt++) {
      try {
        const result = await decrypt([handle], {
          address: new PublicKey(walletAddress),
          signMessage,
        });

        const plaintext = result.plaintexts?.[0];
        const tier = parseInt(plaintext || '1', 10);

        console.log(`[INCO] Decrypted tier: ${tier} (${TIER_NAMES[tier] || 'Unknown'})`);
        return tier;
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.log(`[INCO] Decrypt attempt ${attempt}/${MAX_DECRYPT_RETRIES} failed:`, errorMsg);

        if (attempt < MAX_DECRYPT_RETRIES) {
          if (errorMsg.includes('No ciphertext found') || errorMsg.includes('not found')) {
            console.log(`[INCO] Waiting ${DECRYPT_RETRY_DELAY / 1000}s before retry...`);
            onRetry?.(attempt, MAX_DECRYPT_RETRIES);
            await sleep(DECRYPT_RETRY_DELAY);
          } else {
            throw error;
          }
        }
      }
    }

    console.error('[INCO] Decrypt failed after all retries');
    return null;
  }, [walletAddress, signMessage]);

  /**
   * Reveal badge tier via FHE decryption
   * @param badge - The badge to reveal (from findAllUserBadges)
   *
   * OPTIMIZATION: If access was already granted (allowance PDA exists),
   * skip the grant_access transaction and go directly to decrypt.
   * This means first reveal = transaction + wait + sign,
   * subsequent reveals = sign only (instant!)
   */
  const revealBadge = useCallback(async (badge: UserBadge): Promise<RevealBadgeResult> => {
    if (!walletAddress || !wallet) {
      return { success: false, error: 'Wallet not connected' };
    }

    if (!badge) {
      return { success: false, error: 'No badge provided' };
    }

    try {
      const connection = new Connection(
        process.env.NEXT_PUBLIC_DEVNET_RPC || 'https://api.devnet.solana.com',
        'confirmed'
      );
      const userPubkey = new PublicKey(walletAddress);
      const { pda: badgePda, badgeId, data: badgeData } = badge;

      // Get the encrypted tier handle
      const tierHandle = badgeData.encryptedTier;
      if (!tierHandle || tierHandle === '0') {
        return { success: false, error: 'No encrypted tier found on badge' };
      }

      // Get all handles as BigInt (encryptedTier + all proofs)
      const handles = [
        BigInt(badgeData.encryptedTier),
        BigInt(badgeData.proofBronze),
        BigInt(badgeData.proofSilver),
        BigInt(badgeData.proofGold),
        BigInt(badgeData.proofDiamond),
        BigInt(badgeData.proofLegendary),
      ];

      // Derive allowance PDAs
      const allowancePdas = handles.map(h => deriveAllowancePda(h, userPubkey)[0]);

      // ========================================
      // CHECK: Has access already been granted?
      // ========================================
      const accessAlreadyGranted = await checkAllowanceExists(connection, allowancePdas[0]);
      console.log('[Reveal] Access already granted:', accessAlreadyGranted);

      let grantTxSig: string | null = null;

      if (accessAlreadyGranted) {
        // ========================================
        // FAST PATH: Access already granted, just decrypt
        // ========================================
        const fastSteps: RevealStep[] = [
          { id: 'decrypt', label: 'Decrypt Badge Tier', status: 'pending', description: 'Sign to reveal your tier...' },
        ];

        setState({
          loading: true,
          currentStep: 0,
          steps: fastSteps,
          error: null,
          success: false,
          revealedTier: null,
          txSignature: null,
        });

        await updateStep(0, 'active', 'Sign message to decrypt your badge tier...');

        // Decrypt with retry handling
        const tier = await decryptTierHandle(tierHandle, (attempt, max) => {
          updateStep(0, 'active', `Decrypting... retry ${attempt}/${max}`, false);
        });

        if (tier === null) {
          throw new Error('Failed to decrypt tier');
        }

        const tierInfo = TIER_INFO[tier] || TIER_INFO[1];
        await updateStep(0, 'completed', `${tierInfo.icon} ${tierInfo.name} Badge Revealed!`);

        // Success!
        setState(prev => ({
          ...prev,
          loading: false,
          success: true,
          revealedTier: tier,
        }));

        return {
          success: true,
          tier,
        };

      } else {
        // ========================================
        // FULL PATH: First time - grant access, wait, decrypt
        // ========================================
        const fullSteps: RevealStep[] = [
          { id: 'grant', label: 'Grant Decrypt Access', status: 'pending', description: 'One-time INCO permission...' },
          { id: 'wait', label: 'Sync with INCO Network', status: 'pending', description: 'Waiting for network propagation...' },
          { id: 'decrypt', label: 'Decrypt Badge Tier', status: 'pending', description: 'Revealing your tier via FHE...' },
        ];

        setState({
          loading: true,
          currentStep: 0,
          steps: fullSteps,
          error: null,
          success: false,
          revealedTier: null,
          txSignature: null,
        });

        // ========================================
        // STEP 1: Grant INCO Decrypt Access (one-time only)
        // ========================================
        await updateStep(0, 'active', 'Building grant_access transaction...');

        // Build transaction
        const grantIx = buildGrantAccessInstruction(userPubkey, badgePda, badgeId, allowancePdas);
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

        const tx = new Transaction();
        tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 1_200_000 }));
        tx.add(grantIx);
        tx.recentBlockhash = blockhash;
        tx.feePayer = userPubkey;

        await updateStep(0, 'active', 'Please approve in your wallet (one-time only)...');

        // Sign the transaction
        const signedTx = await signTransaction(tx);

        await updateStep(0, 'active', 'Submitting to blockchain...');

        // Send and confirm
        grantTxSig = await connection.sendRawTransaction(signedTx.serialize());

        await connection.confirmTransaction({
          signature: grantTxSig,
          blockhash,
          lastValidBlockHeight,
        }, 'confirmed');

        console.log('[Reveal] grant_access TX:', grantTxSig);
        setState(prev => ({ ...prev, txSignature: grantTxSig }));

        await updateStep(0, 'completed', `TX: ${grantTxSig.slice(0, 8)}...`);
        await sleep(TX_CONFIRM_DELAY);

        // ========================================
        // STEP 2: Wait for INCO Network
        // ========================================
        await updateStep(1, 'active', 'Waiting for INCO network...');

        const propagationSeconds = INCO_PROPAGATION_DELAY / 1000;
        for (let i = propagationSeconds; i > 0; i--) {
          await updateStep(1, 'active', `Syncing with INCO... ${i}s remaining`, false);
          await sleep(1000);
        }

        await updateStep(1, 'completed', 'INCO network synced');

        // ========================================
        // STEP 3: Decrypt Badge Tier
        // ========================================
        await updateStep(2, 'active', 'Decrypting your badge tier...');

        // Decrypt with retry handling
        const tier = await decryptTierHandle(tierHandle, (attempt, max) => {
          updateStep(2, 'active', `Decrypting... retry ${attempt}/${max}`, false);
        });

        if (tier === null) {
          throw new Error('Failed to decrypt tier after multiple attempts');
        }

        const tierInfo = TIER_INFO[tier] || TIER_INFO[1];
        await updateStep(2, 'completed', `${tierInfo.icon} ${tierInfo.name} Badge Revealed!`);

        // Success!
        setState(prev => ({
          ...prev,
          loading: false,
          success: true,
          revealedTier: tier,
        }));

        return {
          success: true,
          tier,
          txSignature: grantTxSig,
        };
      }

    } catch (error) {
      console.error('[Reveal] Error:', error);
      let errorMsg = error instanceof Error ? error.message : 'Unknown error';

      if (errorMsg.includes('User rejected') || errorMsg.includes('user rejected')) {
        errorMsg = 'Transaction cancelled by user';
      } else if (errorMsg.includes('insufficient funds') || errorMsg.includes('Insufficient')) {
        errorMsg = 'Insufficient SOL for transaction fees';
      } else if (errorMsg.includes('not been authorized') || errorMsg.includes('requested method')) {
        errorMsg = 'Wallet authorization failed. Please ensure your wallet is on Devnet.';
      }

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
  }, [walletAddress, wallet, signTransaction, updateStep, buildGrantAccessInstruction, decryptTierHandle]);

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
      revealedTier: null,
      txSignature: null,
    });
  }, []);

  /**
   * Batch reveal multiple badges with ONE signature (when access already granted)
   *
   * This is the FAST path - skips grant_access and just decrypts.
   * Returns map of badge PDA -> tier
   *
   * @param badges - Array of badges to reveal
   * @returns Map of badge PDA string to tier number
   */
  const batchRevealBadges = useCallback(async (
    badges: UserBadge[]
  ): Promise<{ success: boolean; tiers: Map<string, number>; error?: string }> => {
    if (!walletAddress || badges.length === 0) {
      return { success: false, tiers: new Map(), error: 'No wallet or badges' };
    }

    try {
      const connection = new Connection(
        process.env.NEXT_PUBLIC_DEVNET_RPC || 'https://api.devnet.solana.com',
        'confirmed'
      );
      const userPubkey = new PublicKey(walletAddress);

      // Collect all tier handles
      const handles: string[] = [];
      const badgeKeys: string[] = [];

      for (const badge of badges) {
        const tierHandle = badge.data.encryptedTier;
        if (tierHandle && tierHandle !== '0') {
          // Check if access already granted
          const allowancePda = deriveAllowancePda(BigInt(tierHandle), userPubkey)[0];
          const accessGranted = await checkAllowanceExists(connection, allowancePda);

          if (accessGranted) {
            handles.push(tierHandle);
            badgeKeys.push(badge.pda.toBase58());
          }
        }
      }

      if (handles.length === 0) {
        return { success: false, tiers: new Map(), error: 'No badges with granted access' };
      }

      console.log(`[BatchReveal] Decrypting ${handles.length} badges with ONE signature...`);

      // Batch decrypt ALL handles with ONE signature!
      const result = await decrypt(handles, {
        address: new PublicKey(walletAddress),
        signMessage,
      });

      const tiers = new Map<string, number>();

      if (result.plaintexts) {
        result.plaintexts.forEach((plaintext, index) => {
          const tier = parseInt(plaintext || '1', 10);
          tiers.set(badgeKeys[index], tier);
          console.log(`[BatchReveal] Badge ${badgeKeys[index].slice(0, 8)}... = ${TIER_NAMES[tier] || 'Unknown'}`);
        });
      }

      return { success: true, tiers };

    } catch (error) {
      console.error('[BatchReveal] Error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, tiers: new Map(), error: errorMsg };
    }
  }, [walletAddress, signMessage]);

  /**
   * Check which badges need grant_access (allowance doesn't exist yet)
   * @param badges - Array of badges to check
   * @returns Object with badges that need access and badges that already have access
   */
  const checkBadgesAccessStatus = useCallback(async (
    badges: UserBadge[]
  ): Promise<{ needsAccess: UserBadge[]; hasAccess: UserBadge[] }> => {
    if (!walletAddress || badges.length === 0) {
      return { needsAccess: [], hasAccess: [] };
    }

    const connection = new Connection(
      process.env.NEXT_PUBLIC_DEVNET_RPC || 'https://api.devnet.solana.com',
      'confirmed'
    );
    const userPubkey = new PublicKey(walletAddress);

    const needsAccess: UserBadge[] = [];
    const hasAccess: UserBadge[] = [];

    for (const badge of badges) {
      const tierHandle = badge.data.encryptedTier;
      if (tierHandle && tierHandle !== '0') {
        const allowancePda = deriveAllowancePda(BigInt(tierHandle), userPubkey)[0];
        const accessGranted = await checkAllowanceExists(connection, allowancePda);

        if (accessGranted) {
          hasAccess.push(badge);
        } else {
          needsAccess.push(badge);
        }
      }
    }

    console.log(`[AccessCheck] ${hasAccess.length} badges have access, ${needsAccess.length} need grant_access`);
    return { needsAccess, hasAccess };
  }, [walletAddress]);

  return {
    ...state,
    walletAddress,
    revealBadge,
    batchRevealBadges,
    checkBadgesAccessStatus,
    reset,
  };
}

export default useRevealBadge;
