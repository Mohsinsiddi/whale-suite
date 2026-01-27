'use client';

import { useEffect, useState, useCallback } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useStore } from '@/store';

// RPC endpoints with fallbacks
// Helius free tier: https://docs.helius.dev/ (recommended)
// Get free API key at: https://dev.helius.xyz/
const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
const SOLANA_RPC = HELIUS_API_KEY
  ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com'; // Mainnet only

interface WalletBalance {
  balance: number; // In SOL
  lamports: number; // Raw lamports
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useWalletBalance(walletAddress: string | null): WalletBalance {
  // Subscribe to global balance refresh trigger
  const balanceRefreshTrigger = useStore((state) => state.balanceRefreshTrigger);
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
      const connection = new Connection(SOLANA_RPC, 'confirmed');
      const publicKey = new PublicKey(walletAddress);
      const balanceLamports = await connection.getBalance(publicKey);

      setLamports(balanceLamports);
      setBalance(balanceLamports / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
      setBalance(0);
      setLamports(0);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  // Fetch balance when wallet address changes
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
    refetch: fetchBalance,
  };
}
