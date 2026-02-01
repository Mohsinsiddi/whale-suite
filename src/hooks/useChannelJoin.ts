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
  fetchBadgeAccount,
  INSTRUCTION_DISCRIMINATORS,
} from '@/lib/contract/badge-sdk';

// ============================================
// TYPES
// ============================================

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
  error?: string;
}

// ============================================
// CONSTANTS
// ============================================

const INCO_PROPAGATION_DELAY = 12000; // 12s for INCO sync
const DECRYPT_RETRY_DELAY = 3000;
const MAX_DECRYPT_RETRIES = 4;

// Proof handle keys by tier
const TIER_PROOF_KEYS: Record<number, string> = {
  1: 'proofBronze',
  2: 'proofSilver',
  3: 'proofGold',
  4: 'proofDiamond',
  5: 'proofLegendary',
};

// ============================================
// HELPERS
// ============================================

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
   * IMPORTANT: Must pass chain: 'solana:devnet' for Phantom to show correct network
   */
  const signTransaction = useCallback(async (tx: Transaction): Promise<Transaction> => {
    if (!wallet) throw new Error('Wallet not connected');

    const serialized = tx.serialize({ requireAllSignatures: false });
    const result = await privySignTransaction({
      transaction: serialized,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      wallet: wallet as any,
      // CRITICAL: Tell Privy/Phantom this is a devnet transaction
      chain: 'solana:devnet',
    });

    return Transaction.from(result.signedTransaction);
  }, [wallet, privySignTransaction]);

  /**
   * Update a specific step's status
   */
  const updateStep = useCallback((stepIndex: number, status: JoinStep['status'], description?: string) => {
    setState(prev => ({
      ...prev,
      currentStep: stepIndex,
      steps: prev.steps.map((step, i) =>
        i === stepIndex
          ? { ...step, status, description: description || step.description }
          : step
      ),
    }));
  }, []);

  /**
   * Build grant_access instruction
   */
  const buildGrantAccessInstruction = useCallback((
    userPubkey: PublicKey,
    badgePda: PublicKey,
    allowancePdas: PublicKey[],
  ): TransactionInstruction => {
    // Build remaining accounts: [allowance0, user, allowance1, user, ...]
    const remainingAccounts = allowancePdas.flatMap(allowance => [
      { pubkey: allowance, isSigner: false, isWritable: true },
      { pubkey: userPubkey, isSigner: false, isWritable: false },
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
      data: INSTRUCTION_DISCRIMINATORS.grantAccess,
    });
  }, []);

  /**
   * Decrypt a proof handle using INCO SDK with retries
   */
  const decryptProofHandle = useCallback(async (
    handle: string,
    maxRetries: number = MAX_DECRYPT_RETRIES
  ): Promise<boolean | null> => {
    if (!walletAddress) return null;

    console.log('[INCO] Decrypting handle:', handle.slice(0, 20) + '...');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Use INCO SDK decrypt with Privy signMessage
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
        console.log(`[INCO] Decrypt attempt ${attempt}/${maxRetries} failed:`, errorMsg);

        if (attempt < maxRetries && (errorMsg.includes('No ciphertext found') || errorMsg.includes('not found'))) {
          console.log(`[INCO] Waiting ${DECRYPT_RETRY_DELAY/1000}s before retry...`);
          await sleep(DECRYPT_RETRY_DELAY);
        } else if (attempt === maxRetries) {
          console.error('[INCO] Decrypt failed after all retries');
          return null;
        }
      }
    }
    return null;
  }, [walletAddress, signMessage]);

  /**
   * Join a channel with full INCO verification
   */
  const joinChannel = useCallback(async (
    channelSlug: string,
    requiredTier: number
  ): Promise<JoinChannelResult> => {
    if (!walletAddress || !wallet) {
      return { success: false, error: 'Wallet not connected' };
    }

    // Initialize steps
    const initialSteps: JoinStep[] = [
      { label: 'Verify Wallet Ownership', status: 'pending' },
      { label: 'Fetch On-Chain Badge', status: 'pending' },
      { label: 'Grant INCO Decrypt Access', status: 'pending' },
      { label: 'Decrypt Tier Proof (INCO FHE)', status: 'pending' },
      { label: 'Create Channel Membership', status: 'pending' },
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

      // ========================================
      // STEP 1: Sign message to verify wallet
      // ========================================
      updateStep(0, 'active', 'Signing verification message...');

      const timestamp = Math.floor(Date.now() / 1000);
      const message = `Join channel ${channelSlug} at ${timestamp}`;
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = await signMessage(messageBytes);
      const signature = bs58.encode(signatureBytes);

      updateStep(0, 'completed', 'Wallet verified');

      // ========================================
      // STEP 2: Fetch on-chain badge
      // ========================================
      updateStep(1, 'active', 'Fetching badge from blockchain...');

      const [badgePda] = deriveBadgePda(userPubkey);
      const badgeData = await fetchBadgeAccount(connection, badgePda);

      // Check if badge exists (even with workaround for isActive)
      const badgeExists = badgeData && (badgeData.isActive || (badgeData.proofBronze !== '0'));

      if (!badgeExists) {
        updateStep(1, 'error', 'No badge found');
        setState(prev => ({ ...prev, loading: false, error: 'No badge found. Please claim a badge first.' }));
        return { success: false, error: 'No badge found' };
      }

      console.log('[Join] Badge found:', {
        pda: badgePda.toBase58(),
        owner: badgeData.owner.toBase58(),
        proofs: {
          bronze: badgeData.proofBronze.slice(0, 10) + '...',
          silver: badgeData.proofSilver.slice(0, 10) + '...',
        }
      });

      updateStep(1, 'completed', 'Badge found on-chain');

      // ========================================
      // STEP 3 & 4: INCO verification OR MongoDB fallback
      // ========================================
      // Check if badge has valid INCO handles (real vs fake encryption)
      // Fake handles from our SDK are small numbers, real INCO handles are large
      const bronzeHandle = BigInt(badgeData.proofBronze);
      const hasRealIncoHandles = bronzeHandle > BigInt(1_000_000_000); // Real INCO handles are huge

      let incoVerified = false;
      let proofHandle = '';
      let grantTxSig = '';

      if (hasRealIncoHandles) {
        // Real INCO flow - grant access and decrypt
        try {
          updateStep(2, 'active', 'Submitting grant_access transaction...');

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
          const grantIx = buildGrantAccessInstruction(userPubkey, badgePda, allowancePdas);
          const { blockhash } = await connection.getLatestBlockhash();

          const tx = new Transaction();
          tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 1_200_000 }));
          tx.add(grantIx);
          tx.recentBlockhash = blockhash;
          tx.feePayer = userPubkey;

          // Sign and send
          const signedTx = await signTransaction(tx);
          grantTxSig = await connection.sendRawTransaction(signedTx.serialize());
          await connection.confirmTransaction(grantTxSig, 'confirmed');

          console.log('[Join] grant_access TX:', grantTxSig);

          setState(prev => ({ ...prev, txSignature: grantTxSig }));
          updateStep(2, 'completed', `TX: ${grantTxSig.slice(0, 8)}...`);

          // Wait for INCO to sync the handles
          updateStep(3, 'active', 'Waiting for INCO network sync...');
          await sleep(INCO_PROPAGATION_DELAY);

          updateStep(3, 'active', 'Decrypting tier proof with FHE...');

          // Get the proof handle for the required tier
          const proofKey = TIER_PROOF_KEYS[requiredTier];
          proofHandle = badgeData[proofKey as keyof typeof badgeData] as string;

          if (proofHandle && proofHandle !== '0') {
            const hasAccess = await decryptProofHandle(proofHandle);

            if (hasAccess === true) {
              incoVerified = true;
              updateStep(3, 'completed', 'Access verified via INCO FHE');
            } else if (hasAccess === false) {
              updateStep(3, 'error', 'Tier verification failed');
              setState(prev => ({ ...prev, loading: false, error: `Your badge tier is below ${requiredTier}. Upgrade to access.` }));
              return { success: false, error: 'Insufficient tier' };
            } else {
              // Null result - INCO timeout, fall back to MongoDB
              console.log('[Join] INCO decrypt timeout, falling back to MongoDB verification');
              updateStep(3, 'completed', 'Falling back to MongoDB verification');
            }
          }
        } catch (err) {
          // INCO verification failed (e.g., BadgeInactive error)
          // Fall back to MongoDB verification
          console.log('[Join] INCO verification failed, falling back to MongoDB:', err);
          updateStep(2, 'completed', 'Skipping INCO (using MongoDB)');
          updateStep(3, 'completed', 'Using MongoDB tier verification');
        }
      } else {
        // Badge was claimed with fake encryption, skip INCO entirely
        console.log('[Join] Badge uses test/fake INCO handles, using MongoDB verification');
        updateStep(2, 'completed', 'Skipping (test mode)');
        updateStep(3, 'completed', 'Using MongoDB verification');
      }

      // ========================================
      // STEP 5: Create channel membership
      // ========================================
      updateStep(4, 'active', 'Creating anonymous membership...');

      const response = await fetch(`/api/channels/${channelSlug}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: walletAddress,
          signature,
          message,
          timestamp,
          // Pass INCO verification data if available
          ...(incoVerified && {
            incoVerified: true,
            proofHandle,
            grantAccessTx: grantTxSig,
          }),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        updateStep(4, 'error', data.error || 'Join failed');
        setState(prev => ({ ...prev, loading: false, error: data.error }));
        return { success: false, error: data.error };
      }

      updateStep(4, 'completed', `Joined as ${data.membership.anonId}`);

      setState(prev => ({
        ...prev,
        loading: false,
        success: true,
        anonId: data.membership.anonId,
      }));

      return { success: true, anonId: data.membership.anonId };

    } catch (error) {
      console.error('[Join] Error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';

      // Update current step to error
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMsg,
        steps: prev.steps.map((step, i) =>
          i === prev.currentStep ? { ...step, status: 'error' as const } : step
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
    reset,
  };
}

export default useChannelJoin;
