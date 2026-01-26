'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { PublicKey, VersionedTransaction } from '@solana/web3.js';
import { useWallets, useSignMessage, useSignTransaction } from '@privy-io/react-auth/solana';
import {
  privacyCashService,
  PrivacyAction,
  PrivacyTxResult,
  PrivateBalance,
} from '@/lib/privacy-sdks/privacy-cash';

export interface PrivacyCashState {
  privateBalance: PrivateBalance | null;
  loading: boolean;
  error: string | null;
  result: PrivacyTxResult | null;
  initialized: boolean;
}

export function usePrivacyCash() {
  const { wallets } = useWallets();
  const { signMessage: privySignMessage } = useSignMessage();
  const { signTransaction: privySignTransaction } = useSignTransaction();

  // Get primary wallet
  const wallet = wallets?.[0] || null;
  const walletAddress = wallet?.address || null;

  // Memoize publicKey to prevent unnecessary re-renders
  const publicKey = useMemo(
    () => (walletAddress ? new PublicKey(walletAddress) : null),
    [walletAddress]
  );

  // Track if we've initialized encryption for the current wallet
  const encryptionInitialized = useRef(false);
  const currentWallet = useRef<string | null>(null);

  const [state, setState] = useState<PrivacyCashState>({
    privateBalance: null,
    loading: false,
    error: null,
    result: null,
    initialized: false,
  });

  /**
   * Wrapper for signMessage that works with Privacy Cash SDK
   */
  const signMessage = useCallback(async (message: Uint8Array): Promise<Uint8Array> => {
    if (!wallet || !walletAddress) {
      throw new Error('Wallet not connected');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await privySignMessage({
      message,
      wallet: wallet as any, // Privy ConnectedStandardSolanaWallet type
    });

    // Privy returns { signature: Uint8Array }
    return result.signature;
  }, [wallet, walletAddress, privySignMessage]);

  /**
   * Wrapper for signTransaction that works with Privacy Cash SDK
   */
  const signTransaction = useCallback(async (tx: VersionedTransaction): Promise<VersionedTransaction> => {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }

    // Serialize the versioned transaction
    const serializedTx = tx.serialize();

    // Sign with Privy
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await privySignTransaction({
      transaction: serializedTx,
      wallet: wallet as any, // Privy ConnectedStandardSolanaWallet type
    });

    // Privy returns { signedTransaction: Uint8Array }
    return VersionedTransaction.deserialize(result.signedTransaction);
  }, [wallet, privySignTransaction]);

  /**
   * Fetch private balance
   */
  const fetchPrivateBalance = useCallback(async () => {
    if (!publicKey || !walletAddress) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const balance = await privacyCashService.getPrivateBalance(publicKey, signMessage);
      encryptionInitialized.current = true;
      currentWallet.current = walletAddress;

      setState((prev) => ({
        ...prev,
        privateBalance: balance,
        loading: false,
        initialized: true,
      }));
    } catch (error) {
      console.error('Error fetching private balance:', error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch balance',
        initialized: false,
      }));
    }
  }, [publicKey, walletAddress, signMessage]);

  // Reset state when wallet changes
  useEffect(() => {
    if (walletAddress !== currentWallet.current) {
      encryptionInitialized.current = false;
      setState((prev) => ({
        ...prev,
        privateBalance: null,
        initialized: false,
        error: null,
        result: null,
      }));
    }
  }, [walletAddress]);

  /**
   * Initialize encryption service (requires signature)
   * Call this before any operations that need private balance
   */
  const initialize = useCallback(async () => {
    if (!publicKey) {
      setState((prev) => ({ ...prev, error: 'Wallet not connected' }));
      return false;
    }

    if (encryptionInitialized.current && currentWallet.current === walletAddress) {
      return true;
    }

    try {
      await fetchPrivateBalance();
      return true;
    } catch (error) {
      console.error('Initialization error:', error);
      return false;
    }
  }, [publicKey, walletAddress, fetchPrivateBalance]);

  /**
   * Deposit SOL into privacy pool
   */
  const deposit = useCallback(
    async (amount: number) => {
      if (!publicKey || !walletAddress) {
        setState((prev) => ({ ...prev, error: 'Wallet not connected. Please connect your wallet first.' }));
        return null;
      }

      setState((prev) => ({ ...prev, loading: true, error: null, result: null }));

      try {
        const result = await privacyCashService.deposit(
          publicKey,
          amount,
          signMessage,
          signTransaction
        );

        setState((prev) => ({
          ...prev,
          loading: false,
          result,
          privateBalance: result.newPrivateBalance !== undefined
            ? {
                balance: result.newPrivateBalance,
                lamports: result.newPrivateBalance * 1e9,
                lastUpdated: Date.now(),
              }
            : prev.privateBalance,
        }));

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Deposit failed';
        console.error('Privacy deposit error:', error);

        const result: PrivacyTxResult = {
          success: false,
          error: errorMessage,
          action: 'deposit',
          amount,
        };

        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
          result,
        }));

        return result;
      }
    },
    [publicKey, walletAddress, signMessage, signTransaction]
  );

  /**
   * Withdraw SOL from privacy pool
   */
  const withdraw = useCallback(
    async (amount: number, recipientAddress?: string) => {
      if (!publicKey || !walletAddress) {
        setState((prev) => ({ ...prev, error: 'Wallet not connected. Please connect your wallet first.' }));
        return null;
      }

      setState((prev) => ({ ...prev, loading: true, error: null, result: null }));

      try {
        // Default recipient is the connected wallet
        const recipient = recipientAddress || walletAddress;

        const result = await privacyCashService.withdraw(
          publicKey,
          amount,
          recipient,
          signMessage
        );

        setState((prev) => ({
          ...prev,
          loading: false,
          result,
          privateBalance: result.newPrivateBalance !== undefined
            ? {
                balance: result.newPrivateBalance,
                lamports: result.newPrivateBalance * 1e9,
                lastUpdated: Date.now(),
              }
            : prev.privateBalance,
        }));

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Withdrawal failed';
        console.error('Privacy withdraw error:', error);

        const result: PrivacyTxResult = {
          success: false,
          error: errorMessage,
          action: 'withdraw',
          amount,
        };

        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
          result,
        }));

        return result;
      }
    },
    [publicKey, walletAddress, signMessage]
  );

  /**
   * Estimate fee for an action
   */
  const estimateFee = useCallback((action: PrivacyAction) => {
    return privacyCashService.estimateFee(action);
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      loading: false,
      error: null,
      result: null,
    }));
  }, []);

  /**
   * Clear cache (useful for debugging)
   */
  const clearCache = useCallback(() => {
    privacyCashService.clearCache();
    encryptionInitialized.current = false;
    setState({
      privateBalance: null,
      loading: false,
      error: null,
      result: null,
      initialized: false,
    });
  }, []);

  return {
    ...state,
    publicKey,
    walletAddress,
    deposit,
    withdraw,
    estimateFee,
    fetchPrivateBalance,
    initialize,
    reset,
    clearCache,
  };
}

export default usePrivacyCash;
