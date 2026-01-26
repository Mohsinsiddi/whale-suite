'use client';

import { useState, useCallback, useEffect } from 'react';
import { Transaction } from '@solana/web3.js';
import { useSignTransaction, useWallets } from '@privy-io/react-auth/solana';
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
}

export function usePrivacyCash() {
  const { wallets } = useWallets();
  const { signTransaction } = useSignTransaction();

  // Get primary wallet
  const wallet = wallets?.[0] || null;
  const walletAddress = wallet?.address || null;

  const [state, setState] = useState<PrivacyCashState>({
    privateBalance: null,
    loading: false,
    error: null,
    result: null,
  });

  /**
   * Fetch private balance
   */
  const fetchPrivateBalance = useCallback(async () => {
    if (!walletAddress) return;

    setState((prev) => ({ ...prev, loading: true }));

    try {
      const balance = await privacyCashService.getPrivateBalance(walletAddress);
      setState((prev) => ({ ...prev, privateBalance: balance, loading: false }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch balance',
      }));
    }
  }, [walletAddress]);

  // Fetch balance on mount and wallet change
  useEffect(() => {
    if (walletAddress) {
      fetchPrivateBalance();
    }
  }, [walletAddress, fetchPrivateBalance]);

  /**
   * Deposit SOL into privacy pool
   */
  const deposit = useCallback(
    async (amount: number) => {
      if (!wallet || !walletAddress || walletAddress.trim() === '') {
        setState((prev) => ({ ...prev, error: 'Wallet not connected. Please connect your wallet first.' }));
        return null;
      }

      setState((prev) => ({ ...prev, loading: true, error: null, result: null }));

      try {
        // Build the transaction using the service
        const connection = privacyCashService.getConnection();
        const transaction = await privacyCashService.buildDepositTransaction(
          walletAddress,
          amount
        );

        // Serialize transaction for Privy
        const serializedTx = transaction.serialize({
          requireAllSignatures: false,
          verifySignatures: false,
        });

        // Sign with Privy - using the correct signature
        const { signedTransaction } = await signTransaction({
          transaction: serializedTx,
          wallet: wallet,
        });

        // Deserialize the signed transaction
        const signedTx = Transaction.from(signedTransaction);

        // Send the signed transaction
        const signature = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        });

        // Wait for confirmation
        await connection.confirmTransaction(signature, 'confirmed');

        // Update local private balance
        const currentBalance = state.privateBalance?.balance || 0;
        const newBalance = currentBalance + amount;

        const result: PrivacyTxResult = {
          success: true,
          signature,
          action: 'deposit',
          amount,
          newPrivateBalance: newBalance,
        };

        setState((prev) => ({
          ...prev,
          loading: false,
          result,
          privateBalance: {
            balance: newBalance,
            lastUpdated: Date.now(),
            pendingDeposits: 0,
            pendingWithdrawals: 0,
          },
        }));

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Deposit failed';
        console.error('Privacy deposit error:', error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
          result: {
            success: false,
            error: errorMessage,
            action: 'deposit',
            amount,
          },
        }));
        return null;
      }
    },
    [wallet, walletAddress, signTransaction, state.privateBalance]
  );

  /**
   * Withdraw SOL from privacy pool
   */
  const withdraw = useCallback(
    async (amount: number) => {
      if (!wallet || !walletAddress || walletAddress.trim() === '') {
        setState((prev) => ({ ...prev, error: 'Wallet not connected. Please connect your wallet first.' }));
        return null;
      }

      setState((prev) => ({ ...prev, loading: true, error: null, result: null }));

      try {
        // Check if user has enough private balance
        const privateBalance = state.privateBalance?.balance || 0;
        if (privateBalance < amount) {
          throw new Error(`Insufficient private balance. Available: ${privateBalance} SOL`);
        }

        // For demo, simulate successful withdrawal
        // In production, this would call the privacy protocol's withdraw instruction
        const newBalance = privateBalance - amount;

        const result: PrivacyTxResult = {
          success: true,
          signature: 'simulated_' + Date.now().toString(36),
          action: 'withdraw',
          amount,
          newPrivateBalance: newBalance,
        };

        setState((prev) => ({
          ...prev,
          loading: false,
          result,
          privateBalance: {
            balance: newBalance,
            lastUpdated: Date.now(),
            pendingDeposits: 0,
            pendingWithdrawals: 0,
          },
        }));

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Withdrawal failed';
        console.error('Privacy withdraw error:', error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
          result: {
            success: false,
            error: errorMessage,
            action: 'withdraw',
            amount,
          },
        }));
        return null;
      }
    },
    [wallet, walletAddress, state.privateBalance]
  );

  /**
   * Estimate fee for an action
   */
  const estimateFee = useCallback((action: PrivacyAction, amount: number) => {
    return privacyCashService.estimateFee(action, amount);
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
    ...state,
    deposit,
    withdraw,
    estimateFee,
    fetchPrivateBalance,
    reset,
  };
}

export default usePrivacyCash;
