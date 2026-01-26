'use client';

import { useState, useCallback } from 'react';
import { VersionedTransaction } from '@solana/web3.js';
import { useWallets, useSignTransaction } from '@privy-io/react-auth/solana';
import { jupiterService, TOKEN_MINTS, SwapResult, UltraOrderResponse } from '@/lib/privacy-sdks';

export interface SwapState {
  order: UltraOrderResponse | null;
  loading: boolean;
  error: string | null;
  result: SwapResult | null;
}

export function useSwap() {
  const { wallets } = useWallets();
  const { signTransaction: privySignTransaction } = useSignTransaction();

  // Get primary wallet
  const wallet = wallets?.[0] || null;
  const walletAddress = wallet?.address || null;

  const [state, setState] = useState<SwapState>({
    order: null,
    loading: false,
    error: null,
    result: null,
  });

  /**
   * Sign transaction wrapper for Jupiter
   */
  const signTransaction = useCallback(
    async (tx: VersionedTransaction): Promise<VersionedTransaction> => {
      if (!wallet) {
        throw new Error('Wallet not connected');
      }

      // Serialize the versioned transaction
      const serializedTx = tx.serialize();

      // Sign with Privy
      const result = await privySignTransaction({
        transaction: serializedTx,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        wallet: wallet as any,
      });

      // Privy returns { signedTransaction: Uint8Array }
      return VersionedTransaction.deserialize(result.signedTransaction);
    },
    [wallet, privySignTransaction]
  );

  /**
   * Get a swap order (quote) via Jupiter Ultra API
   */
  const getOrder = useCallback(
    async (
      inputMint: string,
      outputMint: string,
      amount: number
    ) => {
      if (!walletAddress) {
        setState((prev) => ({ ...prev, error: 'Wallet not connected' }));
        return null;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const order = await jupiterService.getOrder(
          inputMint,
          outputMint,
          amount,
          walletAddress
        );

        if (!order) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: 'Failed to get quote. Try a different amount or token pair.',
          }));
          return null;
        }

        setState((prev) => ({ ...prev, order, loading: false }));
        return order;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
        return null;
      }
    },
    [walletAddress]
  );

  /**
   * Execute the swap
   */
  const executeSwap = useCallback(
    async (
      inputMint: string,
      outputMint: string,
      amount: number,
      slippageBps: number = 50
    ) => {
      if (!wallet || !walletAddress) {
        setState((prev) => ({ ...prev, error: 'Wallet not connected' }));
        return null;
      }

      setState((prev) => ({ ...prev, loading: true, error: null, result: null }));

      try {
        const result = await jupiterService.executeSwap(
          inputMint,
          outputMint,
          amount,
          slippageBps,
          signTransaction,
          walletAddress
        );

        if (!result.success) {
          // Better error messages
          let errorMsg = result.error || 'Swap failed';
          if (errorMsg.includes('insufficient')) {
            errorMsg = 'Insufficient balance for this swap.';
          } else if (errorMsg.includes('slippage')) {
            errorMsg = 'Price moved too much. Try increasing slippage.';
          }

          setState((prev) => ({
            ...prev,
            loading: false,
            error: errorMsg,
            result,
          }));
          return result;
        }

        setState((prev) => ({ ...prev, loading: false, result }));
        return result;
      } catch (error) {
        let errorMessage = error instanceof Error ? error.message : 'Swap failed';

        // User-friendly error messages
        if (errorMessage.includes('User rejected')) {
          errorMessage = 'Transaction cancelled by user.';
        } else if (errorMessage.includes('timeout')) {
          errorMessage = 'Transaction timed out. Please try again.';
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
          result: {
            signature: '',
            inputAmount: amount,
            outputAmount: 0,
            priceImpact: 0,
            success: false,
            error: errorMessage,
          },
        }));
        return null;
      }
    },
    [wallet, walletAddress, signTransaction]
  );

  /**
   * Get expected output without executing
   */
  const getExpectedOutput = useCallback(
    async (inputMint: string, outputMint: string, amount: number) => {
      return jupiterService.getExpectedOutput(inputMint, outputMint, amount);
    },
    []
  );

  /**
   * Get token price in USDC
   */
  const getTokenPrice = useCallback(async (tokenMint: string) => {
    return jupiterService.getTokenPrice(tokenMint);
  }, []);

  /**
   * Search for token metadata
   */
  const searchToken = useCallback(async (query: string) => {
    return jupiterService.searchToken(query);
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      order: null,
      loading: false,
      error: null,
      result: null,
    });
  }, []);

  return {
    ...state,
    walletAddress,
    getOrder,
    executeSwap,
    getExpectedOutput,
    getTokenPrice,
    searchToken,
    reset,
    TOKEN_MINTS,
  };
}

export default useSwap;
