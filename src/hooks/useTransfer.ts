'use client';

import { useState, useCallback } from 'react';
import { Transaction } from '@solana/web3.js';
import {
  transferService,
  TransferType,
  TransferParams,
  TransferResult,
  TransferEstimate,
} from '@/lib/privacy-sdks';
import { useAuth } from '@/lib/privy/hooks';

export interface TransferState {
  loading: boolean;
  error: string | null;
  result: TransferResult | null;
  estimate: TransferEstimate | null;
}

export function useTransfer() {
  const { wallet, walletAddress } = useAuth();
  const [state, setState] = useState<TransferState>({
    loading: false,
    error: null,
    result: null,
    estimate: null,
  });

  /**
   * Estimate transfer details
   */
  const estimateTransfer = useCallback(
    async (to: string, amount: number, type: TransferType = 'standard') => {
      if (!walletAddress) return null;

      const params: TransferParams = {
        from: walletAddress,
        to,
        amount,
        type,
      };

      const estimate = await transferService.estimateTransfer(params);
      setState((prev) => ({ ...prev, estimate }));
      return estimate;
    },
    [walletAddress]
  );

  /**
   * Execute a transfer
   */
  const executeTransfer = useCallback(
    async (to: string, amount: number, type: TransferType = 'standard') => {
      if (!wallet || !walletAddress) {
        setState((prev) => ({ ...prev, error: 'Wallet not connected' }));
        return null;
      }

      // Validate recipient
      if (!transferService.isValidAddress(to)) {
        setState((prev) => ({ ...prev, error: 'Invalid recipient address' }));
        return null;
      }

      setState((prev) => ({ ...prev, loading: true, error: null, result: null }));

      try {
        const params: TransferParams = {
          from: walletAddress,
          to,
          amount,
          type,
        };

        // Sign transaction function
        const signTransaction = async (tx: Transaction) => {
          if ('signTransaction' in wallet) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return await (wallet as unknown as { signTransaction: (tx: Transaction) => Promise<Transaction> }).signTransaction(tx);
          }
          throw new Error('Wallet does not support signing');
        };

        const result = await transferService.executeTransfer(params, signTransaction);

        setState((prev) => ({ ...prev, loading: false, result }));

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Transfer failed';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
          result: {
            signature: '',
            success: false,
            error: errorMessage,
            fee: 0,
            type,
          },
        }));
        return null;
      }
    },
    [wallet, walletAddress]
  );

  /**
   * Get recent transfers
   */
  const getRecentTransfers = useCallback(
    async (limit: number = 10) => {
      if (!walletAddress) return [];
      return transferService.getRecentTransfers(walletAddress, limit);
    },
    [walletAddress]
  );

  /**
   * Validate an address
   */
  const validateAddress = useCallback((address: string) => {
    return transferService.isValidAddress(address);
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      result: null,
      estimate: null,
    });
  }, []);

  return {
    ...state,
    estimateTransfer,
    executeTransfer,
    getRecentTransfers,
    validateAddress,
    reset,
  };
}

export default useTransfer;
