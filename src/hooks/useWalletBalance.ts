'use client';

import { useEffect, useState, useCallback } from 'react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useStore } from '@/store';
import { useConnection } from '@/providers/NetworkProvider';

interface WalletBalance {
  balance: number; // In SOL
  lamports: number; // Raw lamports
  loading: boolean;
  error: string | null;
  network: 'mainnet' | 'devnet';
  refetch: () => Promise<void>;
}

export function useWalletBalance(walletAddress: string | null): WalletBalance {
  // Subscribe to global balance refresh trigger
  const balanceRefreshTrigger = useStore((state) => state.balanceRefreshTrigger);

  // Get network-aware connection from context
  const { connection, network } = useConnection();

  const [balance, setBalance] = useState<number>(0);
  const [lamports, setLamports] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!walletAddress) {
      setBalance(0);
      setLamports(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const publicKey = new PublicKey(walletAddress);
      const balanceLamports = await connection.getBalance(publicKey);

      setLamports(balanceLamports);
      setBalance(balanceLamports / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error(`Error fetching balance (${network}):`, err);
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
      setBalance(0);
      setLamports(0);
    } finally {
      setLoading(false);
    }
  }, [walletAddress, connection, network]);

  // Fetch balance when wallet address or network changes
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Auto-refresh balance every 30 seconds
  useEffect(() => {
    if (!walletAddress) return;

    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [walletAddress, fetchBalance]);

  // Refetch when global refresh trigger changes (e.g., after swap)
  useEffect(() => {
    if (balanceRefreshTrigger > 0 && walletAddress) {
      fetchBalance();
    }
  }, [balanceRefreshTrigger, walletAddress, fetchBalance]);

  return {
    balance,
    lamports,
    loading,
    error,
    network,
    refetch: fetchBalance,
  };
}
