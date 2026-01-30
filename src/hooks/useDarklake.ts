'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Transaction, VersionedTransaction } from '@solana/web3.js';
import { useWallets, useSignTransaction } from '@privy-io/react-auth/solana';
import {
  darklakeService,
  type PrivateSwapResult,
  type PrivateSwapQuote,
  type SwapStep,
  type CommitCompleteData,
} from '@/lib/privacy-sdks/darklake';

// Order from DB
export interface DarklakeOrderRecord {
  orderKey: string;
  inputMint: string;
  outputMint: string;
  inputAmount: string;
  minOutputAmount: string;
  salt: string; // Base64 encoded
  commitSignature: string;
  settleSignature?: string;
  status: 'pending_settle' | 'settled' | 'cancelled' | 'expired';
  createdAt: string;
  updatedAt?: string;
  settledAt?: string;
  expiresAt?: string;
}

// Alias for backwards compatibility
export type PendingOrder = DarklakeOrderRecord;

export interface DarklakeState {
  loading: boolean;
  error: string | null;
  quote: PrivateSwapQuote | null;
  result: PrivateSwapResult | null;
  initialized: boolean;
  currentStep: SwapStep | null;
  pendingOrders: PendingOrder[];
  pendingOrdersLoading: boolean;
  allOrders: DarklakeOrderRecord[];
  allOrdersLoading: boolean;
}

export interface UseDarklakeReturn {
  // State
  loading: boolean;
  error: string | null;
  quote: PrivateSwapQuote | null;
  result: PrivateSwapResult | null;
  initialized: boolean;
  currentStep: SwapStep | null;
  walletAddress: string | null;
  pendingOrders: PendingOrder[];
  pendingOrdersLoading: boolean;
  allOrders: DarklakeOrderRecord[];
  allOrdersLoading: boolean;

  // Actions
  initialize: () => Promise<boolean>;
  getQuote: (
    inputMint: string,
    outputMint: string,
    inputAmount: number,
    slippageBps?: number
  ) => Promise<PrivateSwapQuote | null>;
  executePrivateSwap: (
    inputMint: string,
    outputMint: string,
    inputAmount: number,
    minOutputAmount: number
  ) => Promise<PrivateSwapResult | null>;
  resumePendingOrder: (order: PendingOrder) => Promise<PrivateSwapResult | null>;
  fetchPendingOrders: () => Promise<void>;
  fetchAllOrders: () => Promise<void>;
  isPairAvailable: (tokenA: string, tokenB: string) => Promise<boolean>;
  getSupportedPairs: () => Array<{ tokenA: string; tokenB: string; name: string }>;
  reset: () => void;
}

/**
 * React hook for Darklake ZK-AMM private swaps
 *
 * Features:
 * - MEV-resistant swaps with blind slippage
 * - Two-step commit-settle flow with ZK proofs
 * - Privy wallet integration
 */
export function useDarklake(): UseDarklakeReturn {
  const { wallets } = useWallets();
  const { signTransaction: privySignTransaction } = useSignTransaction();

  // Get primary wallet
  const wallet = wallets?.[0] || null;
  const walletAddress = wallet?.address || null;

  const [state, setState] = useState<DarklakeState>({
    loading: false,
    error: null,
    quote: null,
    result: null,
    initialized: false,
    currentStep: null,
    pendingOrders: [],
    pendingOrdersLoading: false,
    allOrders: [],
    allOrdersLoading: false,
  });

  /**
   * Fetch pending orders from DB and verify on-chain status
   */
  const fetchPendingOrders = useCallback(async () => {
    if (!walletAddress) return;

    setState((prev) => ({ ...prev, pendingOrdersLoading: true }));

    try {
      const response = await fetch(`/api/darklake-orders?wallet=${walletAddress}`);
      if (response.ok) {
        const data = await response.json();
        const dbOrders: PendingOrder[] = data.orders || [];

        // Verify each order is still pending on-chain
        // IMPORTANT: We do NOT auto-update DB status here anymore
        // Status is ONLY updated when we have a confirmed settle/cancel transaction
        const verifiedOrders: PendingOrder[] = [];
        for (const order of dbOrders) {
          const isPending = await darklakeService.isOrderPending(order.orderKey);
          if (isPending) {
            verifiedOrders.push(order);
          } else {
            // Order account is closed on-chain
            // Could be: settled, cancelled, or expired
            // We still show it so user knows what happened
            // But mark it with a flag so UI can show appropriate status
            const expiresAt = order.expiresAt ? new Date(order.expiresAt) : null;
            const isExpired = expiresAt && expiresAt < new Date();

            console.log('[useDarklake] Order closed on-chain:', order.orderKey,
              isExpired ? '(likely expired - funds returned)' : '(status unknown)');

            // Still include in list but with a note
            // User can manually dismiss or we can show "Order completed/expired"
            verifiedOrders.push({
              ...order,
              status: isExpired ? 'expired' : 'pending_settle', // Don't change actual DB status
            } as PendingOrder);
          }
        }

        setState((prev) => ({
          ...prev,
          pendingOrders: verifiedOrders,
          pendingOrdersLoading: false,
        }));
      }
    } catch (error) {
      console.error('[useDarklake] Failed to fetch pending orders:', error);
      setState((prev) => ({ ...prev, pendingOrdersLoading: false }));
    }
  }, [walletAddress]);

  /**
   * Fetch ALL orders from DB (pending, settled, expired, cancelled)
   */
  const fetchAllOrders = useCallback(async () => {
    if (!walletAddress) return;

    setState((prev) => ({ ...prev, allOrdersLoading: true }));

    try {
      // Use ?all=true to get all orders regardless of status
      const response = await fetch(`/api/darklake-orders?wallet=${walletAddress}&all=true`);
      if (response.ok) {
        const data = await response.json();
        setState((prev) => ({
          ...prev,
          allOrders: data.orders || [],
          allOrdersLoading: false,
        }));
      }
    } catch (error) {
      console.error('[useDarklake] Failed to fetch all orders:', error);
      setState((prev) => ({ ...prev, allOrdersLoading: false }));
    }
  }, [walletAddress]);

  /**
   * Save pending order to DB after commit
   */
  const savePendingOrder = useCallback(
    async (
      orderKey: string,
      inputMint: string,
      outputMint: string,
      inputAmount: number,
      minOutputAmount: number,
      salt: Uint8Array,
      commitSignature: string
    ) => {
      if (!walletAddress) return;

      try {
        // Convert salt to base64 for storage
        const saltBase64 = Buffer.from(salt).toString('base64');

        await fetch('/api/darklake-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet: walletAddress,
            orderKey,
            inputMint,
            outputMint,
            inputAmount,
            minOutputAmount,
            salt: saltBase64,
            commitSignature,
          }),
        });

        console.log('[useDarklake] Saved pending order to DB');
      } catch (error) {
        console.error('[useDarklake] Failed to save pending order:', error);
      }
    },
    [walletAddress]
  );

  /**
   * Update order status in DB
   */
  const updateOrderStatus = useCallback(
    async (orderKey: string, status: string, settleSignature?: string) => {
      if (!walletAddress) return;

      try {
        await fetch('/api/darklake-orders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet: walletAddress,
            orderKey,
            status,
            settleSignature,
          }),
        });

        // Refresh pending orders
        await fetchPendingOrders();
      } catch (error) {
        console.error('[useDarklake] Failed to update order status:', error);
      }
    },
    [walletAddress, fetchPendingOrders]
  );

  // Fetch orders on wallet connect
  useEffect(() => {
    if (walletAddress) {
      fetchPendingOrders();
      fetchAllOrders();
    }
  }, [walletAddress, fetchPendingOrders, fetchAllOrders]);

  /**
   * Initialize Darklake SDK
   */
  const initialize = useCallback(async (): Promise<boolean> => {
    if (state.initialized) {
      return true;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const success = await darklakeService.initialize();

      setState((prev) => ({
        ...prev,
        loading: false,
        initialized: success,
        error: success ? null : 'Failed to initialize Darklake SDK',
      }));

      return success;
    } catch (error) {
      console.error('[useDarklake] Initialization error:', error);
      setState((prev) => ({
        ...prev,
        loading: false,
        initialized: false,
        error: error instanceof Error ? error.message : 'Failed to initialize',
      }));
      return false;
    }
  }, [state.initialized]);

  /**
   * Get quote for private swap
   */
  const getQuote = useCallback(
    async (
      inputMint: string,
      outputMint: string,
      inputAmount: number,
      slippageBps: number = 100
    ): Promise<PrivateSwapQuote | null> => {
      // Initialize if needed
      if (!darklakeService.isInitialized()) {
        const initialized = await initialize();
        if (!initialized) return null;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const quote = await darklakeService.getQuote(
          inputMint,
          outputMint,
          inputAmount,
          slippageBps
        );

        setState((prev) => ({
          ...prev,
          loading: false,
          quote,
          error: quote ? null : 'Failed to get quote',
        }));

        return quote;
      } catch (error) {
        console.error('[useDarklake] Quote error:', error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to get quote',
        }));
        return null;
      }
    },
    [initialize]
  );

  /**
   * Create transaction signer using Privy
   */
  const createTransactionSigner = useCallback(() => {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }

    return async (
      tx: Transaction | VersionedTransaction
    ): Promise<Transaction | VersionedTransaction> => {
      // Serialize the transaction for Privy
      const serializedTx = tx.serialize();

      // Sign with Privy
      const result = await privySignTransaction({
        transaction: serializedTx,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        wallet: wallet as any,
      });

      // Deserialize back to appropriate type
      if (tx instanceof VersionedTransaction) {
        return VersionedTransaction.deserialize(result.signedTransaction);
      } else {
        return Transaction.from(result.signedTransaction);
      }
    };
  }, [wallet, privySignTransaction]);

  /**
   * Execute private swap
   */
  const executePrivateSwap = useCallback(
    async (
      inputMint: string,
      outputMint: string,
      inputAmount: number,
      minOutputAmount: number
    ): Promise<PrivateSwapResult | null> => {
      if (!walletAddress) {
        setState((prev) => ({
          ...prev,
          error: 'Please connect your wallet first',
        }));
        return null;
      }

      // Initialize if needed
      if (!darklakeService.isInitialized()) {
        const initialized = await initialize();
        if (!initialized) return null;
      }

      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        result: null,
        currentStep: null,
      }));

      try {
        const signer = createTransactionSigner();

        const result = await darklakeService.executePrivateSwap(
          inputMint,
          outputMint,
          inputAmount,
          minOutputAmount,
          walletAddress,
          signer,
          (step) => {
            setState((prev) => ({ ...prev, currentStep: step }));
          },
          // Save order to DB after commit succeeds (for recovery if settle fails)
          async (commitData: CommitCompleteData) => {
            await savePendingOrder(
              commitData.orderKey,
              commitData.inputMint,
              commitData.outputMint,
              commitData.inputAmount,
              commitData.minOutputAmount,
              commitData.salt,
              commitData.commitSignature
            );
          }
        );

        // ONLY update DB status on SUCCESS with confirmed transaction
        // If settle fails, order remains 'pending_settle' - user can retry
        if (result.success && result.orderKey && result.signature) {
          await updateOrderStatus(
            result.orderKey,
            'settled',
            result.signature
          );
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          result,
          error: result.success ? null : result.error || 'Swap failed',
          currentStep: result.success
            ? { step: 'settle', status: 'completed', signature: result.signature }
            : { step: 'settle', status: 'failed', error: result.error },
        }));

        return result;
      } catch (error) {
        console.error('[useDarklake] Swap error:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error during swap';

        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
          currentStep: { step: 'commit', status: 'failed', error: errorMessage },
        }));

        return null;
      }
    },
    [walletAddress, initialize, createTransactionSigner, savePendingOrder, updateOrderStatus]
  );

  /**
   * Check if trading pair is available
   */
  const isPairAvailable = useCallback(
    async (tokenA: string, tokenB: string): Promise<boolean> => {
      if (!darklakeService.isInitialized()) {
        const initialized = await initialize();
        if (!initialized) return false;
      }

      return darklakeService.isPairAvailable(tokenA, tokenB);
    },
    [initialize]
  );

  /**
   * Get supported trading pairs
   */
  const getSupportedPairs = useCallback(() => {
    return darklakeService.getSupportedPairs();
  }, []);

  /**
   * Resume a pending order (settle it)
   */
  const resumePendingOrder = useCallback(
    async (order: PendingOrder): Promise<PrivateSwapResult | null> => {
      if (!walletAddress) {
        setState((prev) => ({
          ...prev,
          error: 'Please connect your wallet first',
        }));
        return null;
      }

      // Initialize if needed
      if (!darklakeService.isInitialized()) {
        const initialized = await initialize();
        if (!initialized) return null;
      }

      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        currentStep: { step: 'settle', status: 'processing' },
      }));

      try {
        const signer = createTransactionSigner();

        // Decode salt from base64
        const saltBuffer = Buffer.from(order.salt, 'base64');
        const salt = new Uint8Array(saltBuffer);

        console.log('[useDarklake] Resuming pending order:', order.orderKey);

        // Call service to settle the order
        const result = await darklakeService.settlePendingOrder(
          order.orderKey,
          parseInt(order.minOutputAmount),
          salt,
          signer,
          (step) => {
            setState((prev) => ({ ...prev, currentStep: step }));
          }
        );

        // ONLY update DB status on SUCCESS with confirmed transaction
        if (result.success && result.signature) {
          await updateOrderStatus(
            order.orderKey,
            'settled',
            result.signature
          );
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          result,
          error: result.success ? null : result.error || 'Settlement failed',
          currentStep: result.success
            ? { step: 'settle', status: 'completed', signature: result.signature }
            : { step: 'settle', status: 'failed', error: result.error },
        }));

        return result;
      } catch (error) {
        console.error('[useDarklake] Resume order error:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error during settlement';

        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
          currentStep: { step: 'settle', status: 'failed', error: errorMessage },
        }));

        return null;
      }
    },
    [walletAddress, initialize, createTransactionSigner, updateOrderStatus]
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      quote: null,
      result: null,
      initialized: darklakeService.isInitialized(),
      currentStep: null,
      pendingOrders: state.pendingOrders, // Keep pending orders
      pendingOrdersLoading: false,
      allOrders: state.allOrders, // Keep all orders
      allOrdersLoading: false,
    });
  }, [state.pendingOrders, state.allOrders]);

  return useMemo(
    () => ({
      // State
      loading: state.loading,
      error: state.error,
      quote: state.quote,
      result: state.result,
      initialized: state.initialized,
      currentStep: state.currentStep,
      walletAddress,
      pendingOrders: state.pendingOrders,
      pendingOrdersLoading: state.pendingOrdersLoading,
      allOrders: state.allOrders,
      allOrdersLoading: state.allOrdersLoading,

      // Actions
      initialize,
      getQuote,
      executePrivateSwap,
      resumePendingOrder,
      fetchPendingOrders,
      fetchAllOrders,
      isPairAvailable,
      getSupportedPairs,
      reset,
    }),
    [
      state,
      walletAddress,
      initialize,
      getQuote,
      executePrivateSwap,
      resumePendingOrder,
      fetchPendingOrders,
      fetchAllOrders,
      isPairAvailable,
      getSupportedPairs,
      reset,
    ]
  );
}

export default useDarklake;
