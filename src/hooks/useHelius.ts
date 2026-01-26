'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  heliusService,
  WalletBalances,
  TransactionInfo,
  WhaleActivity,
} from '@/lib/privacy-sdks';

/**
 * Hook for fetching wallet balances via Helius
 */
export function useWalletBalances(walletAddress: string | null) {
  const [balances, setBalances] = useState<WalletBalances | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!walletAddress) {
      setBalances(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await heliusService.getWalletBalances(walletAddress);
      setBalances(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balances');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!walletAddress) return;

    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [walletAddress, fetchBalances]);

  return {
    balances,
    loading,
    error,
    refetch: fetchBalances,
  };
}

/**
 * Hook for fetching transaction history via Helius
 */
export function useTransactionHistory(walletAddress: string | null, limit: number = 50) {
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!walletAddress) {
      setTransactions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await heliusService.getTransactionHistory(walletAddress, limit);
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [walletAddress, limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
  };
}

/**
 * Hook for whale activity feed
 */
export function useWhaleFeed(minAmountSOL: number = 100) {
  const [activities, setActivities] = useState<WhaleActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWhaleActivity = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await heliusService.getWhaleActivity(minAmountSOL);
      setActivities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch whale activity');
    } finally {
      setLoading(false);
    }
  }, [minAmountSOL]);

  useEffect(() => {
    fetchWhaleActivity();
  }, [fetchWhaleActivity]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchWhaleActivity, 60000);
    return () => clearInterval(interval);
  }, [fetchWhaleActivity]);

  return {
    activities,
    loading,
    error,
    refetch: fetchWhaleActivity,
  };
}

/**
 * Hook for real-time wallet subscription
 */
export function useWalletSubscription(
  walletAddress: string | null,
  onUpdate: (data: { balance: number }) => void
) {
  useEffect(() => {
    if (!walletAddress) return;

    const unsubscribe = heliusService.subscribeToWallet(walletAddress, onUpdate);

    return () => {
      unsubscribe();
    };
  }, [walletAddress, onUpdate]);
}

export default {
  useWalletBalances,
  useTransactionHistory,
  useWhaleFeed,
  useWalletSubscription,
};
