'use client';

import { useState, useCallback, useMemo } from 'react';
import { PublicKey, Connection, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useWallets, useSignTransaction } from '@privy-io/react-auth/solana';
import {
  buildClaimBadgeTransaction,
  buildUpgradeTierTransaction,
  buildCloseBadgeTransaction,
  deriveBadgePda,
  TIER_PRICES_LAMPORTS,
  getTierInfo,
  getAllTiers,
} from '@/lib/contract/badge-sdk';

// INCO contract is deployed on DEVNET only
const INCO_DEVNET_RPC = process.env.NEXT_PUBLIC_DEVNET_RPC || 'https://api.devnet.solana.com';

export interface ClaimBadgeState {
  loading: boolean;
  error: string | null;
  txSignature: string | null;
  badgePda: string | null;
  success: boolean;
}

export interface ClaimBadgeResult {
  success: boolean;
  txSignature?: string;
  badgePda?: string;
  error?: string;
}

export function useClaimBadge() {
  const { wallets } = useWallets();
  const { signTransaction: privySignTransaction } = useSignTransaction();

  // INCO badge contract is on devnet - use dedicated connection
  const connection = useMemo(() => new Connection(INCO_DEVNET_RPC, 'confirmed'), []);

  // Get primary wallet
  const wallet = wallets?.[0] || null;
  const walletAddress = wallet?.address || null;

  // Memoize publicKey
  const publicKey = useMemo(
    () => (walletAddress ? new PublicKey(walletAddress) : null),
    [walletAddress]
  );

  const [state, setState] = useState<ClaimBadgeState>({
    loading: false,
    error: null,
    txSignature: null,
    badgePda: null,
    success: false,
  });

  /**
   * Sign transaction using Privy SDK for INCO devnet
   * IMPORTANT: Must pass chain: 'solana:devnet' for Phantom to show correct network
   */
  const signTransaction = useCallback(
    async (tx: Transaction): Promise<Transaction> => {
      if (!wallet) {
        throw new Error('Wallet not connected');
      }

      // Serialize the transaction
      const serialized = tx.serialize({ requireAllSignatures: false });

      // Sign with Privy - specify devnet chain for INCO contract
      const result = await privySignTransaction({
        transaction: serialized,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        wallet: wallet as any,
        // CRITICAL: Tell Privy/Phantom this is a devnet transaction
        chain: 'solana:devnet',
      });

      // Deserialize the signed transaction
      return Transaction.from(result.signedTransaction);
    },
    [wallet, privySignTransaction]
  );

  /**
   * Check if user already has a badge (on-chain or in MongoDB)
   */
  const checkExistingBadge = useCallback(async (): Promise<boolean> => {
    if (!publicKey || !walletAddress) return false;

    try {
      // Check on-chain FIRST (most reliable source of truth)
      // Use connection from NetworkProvider
      const [badgePda] = deriveBadgePda(publicKey);

      // Check if account exists on-chain
      const accountInfo = await connection.getAccountInfo(badgePda);
      if (accountInfo !== null) {
        console.log('Badge account exists on-chain:', badgePda.toBase58());
        return true;
      }

      // Also check MongoDB as backup
      const res = await fetch(`/api/badges/confidential?wallet=${walletAddress}`);
      const data = await res.json();
      if (data.success && data.badge?.hasClaimed) {
        console.log('Badge found in MongoDB for wallet:', walletAddress);
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error checking existing badge:', err);
      // On error, return false but log it
      return false;
    }
  }, [publicKey, walletAddress, connection]);

  /**
   * Claim a badge with the specified tier
   */
  const claimBadge = useCallback(
    async (tier: number): Promise<ClaimBadgeResult> => {
      if (!publicKey || !walletAddress || !wallet) {
        const error = 'Wallet not connected';
        setState((prev) => ({ ...prev, error }));
        return { success: false, error };
      }

      // Validate tier
      if (tier < 1 || tier > 5) {
        const error = 'Invalid tier (must be 1-5)';
        setState((prev) => ({ ...prev, error }));
        return { success: false, error };
      }

      // Check if already has badge before attempting
      const hasBadge = await checkExistingBadge();
      if (hasBadge) {
        const error = 'You already have a badge! Visit /channels to access tier-gated channels.';
        setState((prev) => ({ ...prev, error }));
        return { success: false, error };
      }

      setState({ loading: true, error: null, txSignature: null, badgePda: null, success: false });

      try {
        // INCO badge uses devnet
        console.log('[ClaimBadge] Using INCO devnet connection');

        // Build the transaction
        const { transaction, badgePda, tierPrice } = await buildClaimBadgeTransaction({
          connection,
          userPubkey: publicKey,
          tier,
        });

        console.log('Claiming badge:', {
          tier,
          price: tierPrice / LAMPORTS_PER_SOL,
          badgePda: badgePda.toBase58(),
        });

        // Sign the transaction using Privy
        const signedTx = await signTransaction(transaction);

        // Send the signed transaction
        const txSignature = await connection.sendRawTransaction(signedTx.serialize());

        // Wait for confirmation
        await connection.confirmTransaction(txSignature, 'confirmed');

        console.log('Badge claimed:', txSignature);

        // Save to MongoDB
        const tierInfo = getTierInfo(tier);
        const proofHandles = {
          bronze: '0',
          silver: '0',
          gold: '0',
          diamond: '0',
          legendary: '0',
        };

        await fetch('/api/badges/confidential', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet: walletAddress,
            txSignature,
            tier,
            tierName: tierInfo.name,
            badgeAccountAddress: badgePda.toBase58(),
            amountPaid: tierPrice,
            proofHandles,
          }),
        });

        setState({
          loading: false,
          error: null,
          txSignature,
          badgePda: badgePda.toBase58(),
          success: true,
        });

        return {
          success: true,
          txSignature,
          badgePda: badgePda.toBase58(),
        };
      } catch (err: unknown) {
        console.error('Claim badge error:', err);
        let errorMessage = err instanceof Error ? err.message : 'Transaction failed';

        // Check for "account already in use" error (badge already exists)
        if (errorMessage.includes('already in use') || errorMessage.includes('0x0')) {
          errorMessage = 'Badge already claimed! You already have a confidential badge for this wallet.';
        } else if (errorMessage.includes('insufficient funds') || errorMessage.includes('Insufficient')) {
          errorMessage = 'Insufficient SOL balance. Please add funds and try again.';
        } else if (errorMessage.includes('user rejected') || errorMessage.includes('User rejected')) {
          errorMessage = 'Transaction cancelled by user.';
        }

        setState({
          loading: false,
          error: errorMessage,
          txSignature: null,
          badgePda: null,
          success: false,
        });

        return { success: false, error: errorMessage };
      }
    },
    [publicKey, walletAddress, wallet, signTransaction, connection]
  );

  /**
   * Upgrade an existing badge to a higher tier
   * @param newTier - The new tier to upgrade to (1-5)
   * @param currentTier - The current tier of the badge
   * @param badgeId - The badge ID to upgrade (default: 0 for first badge)
   */
  const upgradeTier = useCallback(
    async (newTier: number, currentTier: number, badgeId: bigint = BigInt(0)): Promise<ClaimBadgeResult> => {
      if (!publicKey || !walletAddress || !wallet) {
        const error = 'Wallet not connected';
        setState((prev) => ({ ...prev, error }));
        return { success: false, error };
      }

      // Validate new tier
      if (newTier < 1 || newTier > 5) {
        const error = 'Invalid tier (must be 1-5)';
        setState((prev) => ({ ...prev, error }));
        return { success: false, error };
      }

      // Must be upgrading to a higher tier
      if (newTier <= currentTier) {
        const error = `Must upgrade to a higher tier. Current: ${currentTier}, Selected: ${newTier}`;
        setState((prev) => ({ ...prev, error }));
        return { success: false, error };
      }

      setState({ loading: true, error: null, txSignature: null, badgePda: null, success: false });

      try {
        // INCO badge uses devnet
        console.log('[UpgradeTier] Using INCO devnet connection');

        // Build the upgrade transaction
        const { transaction, badgePda, tierPrice } = await buildUpgradeTierTransaction({
          connection,
          userPubkey: publicKey,
          badgeId,
          newTier,
        });

        console.log('Upgrading badge:', {
          currentTier,
          newTier,
          price: tierPrice / LAMPORTS_PER_SOL,
          badgePda: badgePda.toBase58(),
        });

        // Sign the transaction using Privy
        const signedTx = await signTransaction(transaction);

        // Send the signed transaction
        const txSignature = await connection.sendRawTransaction(signedTx.serialize());

        // Wait for confirmation
        await connection.confirmTransaction(txSignature, 'confirmed');

        console.log('Badge upgraded:', txSignature);

        // Update MongoDB with new tier
        const tierInfo = getTierInfo(newTier);
        await fetch('/api/badges/confidential', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet: walletAddress,
            txSignature,
            tier: newTier,
            tierName: tierInfo.name,
            amountPaid: tierPrice,
          }),
        });

        setState({
          loading: false,
          error: null,
          txSignature,
          badgePda: badgePda.toBase58(),
          success: true,
        });

        return {
          success: true,
          txSignature,
          badgePda: badgePda.toBase58(),
        };
      } catch (err: unknown) {
        console.error('Upgrade tier error:', err);
        let errorMessage = err instanceof Error ? err.message : 'Transaction failed';

        if (errorMessage.includes('insufficient funds') || errorMessage.includes('Insufficient')) {
          errorMessage = 'Insufficient SOL balance. Please add funds and try again.';
        } else if (errorMessage.includes('user rejected') || errorMessage.includes('User rejected')) {
          errorMessage = 'Transaction cancelled by user.';
        }

        setState({
          loading: false,
          error: errorMessage,
          txSignature: null,
          badgePda: null,
          success: false,
        });

        return { success: false, error: errorMessage };
      }
    },
    [publicKey, walletAddress, wallet, signTransaction, connection]
  );

  /**
   * Close/revoke a badge (for testing - returns rent to owner)
   * @param badgeId - The badge ID to close (default: 0 for first badge)
   */
  const closeBadge = useCallback(
    async (badgeId: bigint = BigInt(0)): Promise<ClaimBadgeResult> => {
      if (!publicKey || !walletAddress || !wallet) {
        const error = 'Wallet not connected';
        setState((prev) => ({ ...prev, error }));
        return { success: false, error };
      }

      setState({ loading: true, error: null, txSignature: null, badgePda: null, success: false });

      try {
        console.log('[CloseBadge] Closing badge with ID:', badgeId.toString());

        // Build the close badge transaction
        const { transaction, badgePda } = await buildCloseBadgeTransaction({
          connection,
          ownerPubkey: publicKey,
          badgeId,
        });

        console.log('[CloseBadge] Badge PDA to close:', badgePda.toBase58());

        // Sign the transaction using Privy (devnet)
        const signedTx = await signTransaction(transaction);

        // Send the signed transaction
        const txSignature = await connection.sendRawTransaction(signedTx.serialize());

        // Wait for confirmation
        await connection.confirmTransaction(txSignature, 'confirmed');

        console.log('[CloseBadge] Badge closed:', txSignature);

        // Delete from MongoDB
        await fetch('/api/badges/confidential', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet: walletAddress }),
        });

        setState({
          loading: false,
          error: null,
          txSignature,
          badgePda: badgePda.toBase58(),
          success: true,
        });

        return {
          success: true,
          txSignature,
          badgePda: badgePda.toBase58(),
        };
      } catch (err: unknown) {
        console.error('[CloseBadge] Error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to close badge';

        setState({
          loading: false,
          error: errorMessage,
          txSignature: null,
          badgePda: null,
          success: false,
        });

        return { success: false, error: errorMessage };
      }
    },
    [publicKey, walletAddress, wallet, signTransaction, connection]
  );

  /**
   * Get tier price in SOL
   */
  const getTierPrice = useCallback((tier: number): number => {
    return (TIER_PRICES_LAMPORTS[tier as keyof typeof TIER_PRICES_LAMPORTS] || 0) / LAMPORTS_PER_SOL;
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      txSignature: null,
      badgePda: null,
      success: false,
    });
  }, []);

  return {
    // State
    ...state,
    walletAddress,
    publicKey,

    // Actions
    claimBadge,
    upgradeTier,
    closeBadge,
    checkExistingBadge,
    reset,

    // Helpers
    getTierPrice,
    getTierInfo,
    getAllTiers,
  };
}

export default useClaimBadge;
