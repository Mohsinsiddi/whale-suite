'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Transaction, VersionedTransaction } from '@solana/web3.js';
import { useWallets, useSignMessage, useSignTransaction } from '@privy-io/react-auth/solana';
import {
  shadowWireService,
  type TokenSymbol,
  type PoolBalance,
  type ShadowWireTransferResult,
  type ShadowWireDepositResult,
  type ShadowWireWithdrawResult,
  type FeeCalculation,
  type WalletAdapter,
} from '@/lib/privacy-sdks/shadow-wire';

export interface ShadowWireState {
  shieldedBalance: PoolBalance | null;
  loading: boolean;
  error: string | null;
  result: ShadowWireTransferResult | null;
  initialized: boolean;
  wasmSupported: boolean;
}

export function useShadowWire() {
  const { wallets } = useWallets();
  const { signMessage: privySignMessage } = useSignMessage();
  const { signTransaction: privySignTransaction } = useSignTransaction();

  // Get primary wallet
  const wallet = wallets?.[0] || null;
  const walletAddress = wallet?.address || null;

  // Track current wallet for state management
  const currentWallet = useRef<string | null>(null);

  const [state, setState] = useState<ShadowWireState>({
    shieldedBalance: null,
    loading: false,
    error: null,
    result: null,
    initialized: false,
    wasmSupported: true, // Assume supported until checked
  });

  /**
   * Create a WalletAdapter compatible with ShadowWire SDK
   */
  const createWalletAdapter = useCallback((): WalletAdapter | undefined => {
    if (!wallet || !walletAddress) {
      return undefined;
    }

    return {
      signMessage: async (message: Uint8Array): Promise<Uint8Array> => {
        const result = await privySignMessage({
          message,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          wallet: wallet as any,
        });
        return result.signature;
      },
    };
  }, [wallet, walletAddress, privySignMessage]);

  /**
   * Memoized wallet adapter
   */
  const walletAdapter = useMemo(() => createWalletAdapter(), [createWalletAdapter]);

  /**
   * Initialize WASM for ZK proof generation
   */
  const initialize = useCallback(async () => {
    // Check browser support first
    if (!shadowWireService.isSupported()) {
      setState((prev) => ({
        ...prev,
        wasmSupported: false,
        error: 'Your browser does not support privacy features. Please use a modern browser.',
      }));
      return false;
    }

    try {
      await shadowWireService.initWASM();
      setState((prev) => ({
        ...prev,
        initialized: true,
        wasmSupported: true,
        error: null,
      }));
      return true;
    } catch (error) {
      console.error('[useShadowWire] WASM initialization error:', error);
      setState((prev) => ({
        ...prev,
        initialized: false,
        error: error instanceof Error ? error.message : 'Failed to initialize privacy features',
      }));
      return false;
    }
  }, []);

  /**
   * Fetch shielded balance for current wallet
   */
  const fetchShieldedBalance = useCallback(
    async (token: TokenSymbol = 'SOL') => {
      if (!walletAddress) {
        setState((prev) => ({ ...prev, error: 'Wallet not connected' }));
        return null;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const balance = await shadowWireService.getBalance(walletAddress, token);
        currentWallet.current = walletAddress;

        setState((prev) => ({
          ...prev,
          shieldedBalance: balance,
          loading: false,
        }));

        return balance;
      } catch (error) {
        console.error('[useShadowWire] Error fetching balance:', error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch shielded balance',
        }));
        return null;
      }
    },
    [walletAddress]
  );

  // Reset state when wallet changes
  useEffect(() => {
    if (walletAddress !== currentWallet.current) {
      setState((prev) => ({
        ...prev,
        shieldedBalance: null,
        error: null,
        result: null,
      }));
    }
  }, [walletAddress]);

  /**
   * Sign a transaction using Privy
   */
  const signTransaction = useCallback(
    async (tx: Transaction | VersionedTransaction): Promise<Transaction | VersionedTransaction> => {
      if (!wallet) {
        throw new Error('Wallet not connected');
      }

      // Serialize the transaction
      const serialized = tx.serialize({ requireAllSignatures: false });

      // Sign with Privy
      const result = await privySignTransaction({
        transaction: serialized,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        wallet: wallet as any,
      });

      // Deserialize the signed transaction
      try {
        return VersionedTransaction.deserialize(result.signedTransaction);
      } catch {
        return Transaction.from(result.signedTransaction);
      }
    },
    [wallet, privySignTransaction]
  );

  /**
   * Deposit funds to shielded pool
   */
  const deposit = useCallback(
    async (amount: number, token: TokenSymbol = 'SOL'): Promise<ShadowWireDepositResult> => {
      if (!walletAddress || !wallet) {
        const result: ShadowWireDepositResult = {
          success: false,
          error: 'Wallet not connected',
        };
        setState((prev) => ({ ...prev, error: result.error || null }));
        return result;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // Pass signTransaction to handle signing and submission
        const result = await shadowWireService.deposit(
          walletAddress,
          amount,
          signTransaction,
          token
        );

        setState((prev) => ({
          ...prev,
          loading: false,
          error: result.success ? null : (result.error || null),
        }));

        // Refresh balance after deposit
        if (result.success) {
          await fetchShieldedBalance(token);
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Deposit failed';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        return { success: false, error: errorMessage };
      }
    },
    [walletAddress, wallet, signTransaction, fetchShieldedBalance]
  );

  /**
   * Withdraw funds from shielded pool
   */
  const withdraw = useCallback(
    async (amount: number, token: TokenSymbol = 'SOL'): Promise<ShadowWireWithdrawResult> => {
      if (!walletAddress) {
        const result: ShadowWireWithdrawResult = {
          success: false,
          error: 'Wallet not connected',
        };
        setState((prev) => ({ ...prev, error: result.error || null }));
        return result;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const result = await shadowWireService.withdraw(walletAddress, amount, token);

        setState((prev) => ({
          ...prev,
          loading: false,
          error: result.success ? null : (result.error || null),
        }));

        // Refresh balance after withdraw
        if (result.success) {
          await fetchShieldedBalance(token);
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Withdrawal failed';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        return { success: false, error: errorMessage };
      }
    },
    [walletAddress, fetchShieldedBalance]
  );

  /**
   * Execute internal transfer (amount hidden via Bulletproofs)
   * Both sender and recipient are visible, but amount is hidden with ZK proof
   */
  const internalTransfer = useCallback(
    async (
      recipient: string,
      amount: number,
      token: TokenSymbol = 'SOL'
    ): Promise<ShadowWireTransferResult> => {
      if (!walletAddress) {
        const result: ShadowWireTransferResult = {
          signature: '',
          success: false,
          error: 'Wallet not connected',
          type: 'internal',
          amountHidden: false,
        };
        setState((prev) => ({ ...prev, error: result.error || null, result }));
        return result;
      }

      // Ensure WASM is initialized
      const isInit = await initialize();
      if (!isInit) {
        const result: ShadowWireTransferResult = {
          signature: '',
          success: false,
          error: 'Failed to initialize privacy features',
          type: 'internal',
          amountHidden: false,
        };
        setState((prev) => ({ ...prev, error: result.error || null, result }));
        return result;
      }

      setState((prev) => ({ ...prev, loading: true, error: null, result: null }));

      try {
        const result = await shadowWireService.internalTransfer({
          sender: walletAddress,
          recipient,
          amount,
          token,
          wallet: walletAdapter,
        });

        setState((prev) => ({
          ...prev,
          loading: false,
          result,
          error: result.success ? null : (result.error || null),
        }));

        // Refresh balance after transfer
        if (result.success) {
          await fetchShieldedBalance(token);
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Internal transfer failed';
        const result: ShadowWireTransferResult = {
          signature: '',
          success: false,
          error: errorMessage,
          type: 'internal',
          amountHidden: false,
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
    [walletAddress, walletAdapter, initialize, fetchShieldedBalance]
  );

  /**
   * Execute external transfer (sender anonymous)
   * Recipient receives funds from shielded pool, sender identity is hidden
   */
  const externalTransfer = useCallback(
    async (
      recipient: string,
      amount: number,
      token: TokenSymbol = 'SOL'
    ): Promise<ShadowWireTransferResult> => {
      if (!walletAddress) {
        const result: ShadowWireTransferResult = {
          signature: '',
          success: false,
          error: 'Wallet not connected',
          type: 'external',
          amountHidden: false,
        };
        setState((prev) => ({ ...prev, error: result.error || null, result }));
        return result;
      }

      // Ensure WASM is initialized
      const isInit = await initialize();
      if (!isInit) {
        const result: ShadowWireTransferResult = {
          signature: '',
          success: false,
          error: 'Failed to initialize privacy features',
          type: 'external',
          amountHidden: false,
        };
        setState((prev) => ({ ...prev, error: result.error || null, result }));
        return result;
      }

      setState((prev) => ({ ...prev, loading: true, error: null, result: null }));

      try {
        const result = await shadowWireService.externalTransfer({
          sender: walletAddress,
          recipient,
          amount,
          token,
          wallet: walletAdapter,
        });

        setState((prev) => ({
          ...prev,
          loading: false,
          result,
          error: result.success ? null : (result.error || null),
        }));

        // Refresh balance after transfer
        if (result.success) {
          await fetchShieldedBalance(token);
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'External transfer failed';
        const result: ShadowWireTransferResult = {
          signature: '',
          success: false,
          error: errorMessage,
          type: 'external',
          amountHidden: false,
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
    [walletAddress, walletAdapter, initialize, fetchShieldedBalance]
  );

  /**
   * Calculate fee for a transfer
   */
  const calculateFee = useCallback(
    (amount: number, token: TokenSymbol = 'SOL'): FeeCalculation => {
      return shadowWireService.calculateFee(amount, token);
    },
    []
  );

  /**
   * Get minimum transfer amount for a token
   */
  const getMinimumAmount = useCallback((token: TokenSymbol = 'SOL'): number => {
    return shadowWireService.getMinimumAmount(token);
  }, []);

  /**
   * Get fee percentage for a token
   */
  const getFeePercentage = useCallback((token: TokenSymbol = 'SOL'): number => {
    return shadowWireService.getFeePercentage(token);
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

  return {
    // State
    ...state,
    walletAddress,

    // Actions
    initialize,
    fetchShieldedBalance,
    deposit,
    withdraw,
    internalTransfer,
    externalTransfer,

    // Utilities
    reset,
    calculateFee,
    getMinimumAmount,
    getFeePercentage,
  };
}

export default useShadowWire;
