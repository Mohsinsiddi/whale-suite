'use client';

import { useState, useCallback } from 'react';
import { VersionedTransaction } from '@solana/web3.js';
import { jupiterService, TOKEN_MINTS, SwapQuote, SwapResult } from '@/lib/privacy-sdks';
import { useAuth } from '@/lib/privy/hooks';

export interface SwapState {
  quote: SwapQuote | null;
  loading: boolean;
  error: string | null;
  result: SwapResult | null;
}

export function useSwap() {
  const { wallet, walletAddress } = useAuth();
  const [state, setState] = useState<SwapState>({
    quote: null,
    loading: false,
    error: null,
    result: null,
  });

  /**
   * Get a swap quote
   */
  const getQuote = useCallback(
    async (
      inputMint: string,
      outputMint: string,
      amount: number,
      slippageBps: number = 50
    ) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const quote = await jupiterService.getQuote(
          inputMint,
          outputMint,
          amount,
          slippageBps
        );

        if (!quote) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: 'Failed to get quote. Try a different amount or token pair.',
          }));
          return null;
        }

        setState((prev) => ({ ...prev, quote, loading: false }));
        return quote;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
        return null;
      }
    },
    []
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
        // Sign transaction function using wallet
        const signTransaction = async (tx: VersionedTransaction) => {
          // Use wallet's signTransaction method
          if ('signTransaction' in wallet) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return await (wallet as unknown as { signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction> }).signTransaction(tx);
          }
          throw new Error('Wallet does not support signing');
        };

        const result = await jupiterService.executeSwap(
          inputMint,
          outputMint,
          amount,
          slippageBps,
          signTransaction,
          walletAddress
        );

        setState((prev) => ({ ...prev, loading: false, result }));
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Swap failed';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
          result: { signature: '', inputAmount: amount, outputAmount: 0, priceImpact: 0, success: false, error: errorMessage },
        }));
        return null;
      }
    },
    [wallet, walletAddress]
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
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      quote: null,
      loading: false,
      error: null,
      result: null,
    });
  }, []);

  return {
    ...state,
    getQuote,
    executeSwap,
    getExpectedOutput,
    reset,
    TOKEN_MINTS,
  };
}

export default useSwap;
