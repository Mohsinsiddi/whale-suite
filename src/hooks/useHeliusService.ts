'use client';

/**
 * Network-aware Helius Service Hook
 * Provides Helius SDK methods with the correct network connection
 */

import { useMemo, useCallback } from 'react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useConnection } from '@/providers/NetworkProvider';

// Token Program ID
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

export interface TokenBalance {
  mint: string;
  amount: number;
  decimals: number;
  uiAmount: number;
  symbol?: string;
  name?: string;
  logoURI?: string;
}

export interface WalletBalances {
  sol: number;
  tokens: TokenBalance[];
  totalUsdValue?: number;
}

export interface TransactionInfo {
  signature: string;
  slot: number;
  timestamp: number;
  type: string;
  description: string;
  fee: number;
  status: 'success' | 'failed';
}

// Known token decimals (fallback)
const KNOWN_DECIMALS: Record<string, number> = {
  'So11111111111111111111111111111111111111112': 9, // SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 6, // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 6, // USDT
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 5, // BONK
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 6, // JUP
};

export function useHeliusService() {
  const { connection, network, rpcUrl } = useConnection();

  // Get Helius API key
  const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY || '';

  // Helius API base URL - note: Helius API only works on mainnet
  const heliusApiUrl = 'https://api.helius.xyz/v0';

  // Check if we can use Helius API (mainnet only)
  const canUseHeliusApi = network === 'mainnet' && !!apiKey;

  /**
   * Get SOL balance for a wallet
   */
  const getSOLBalance = useCallback(async (walletAddress: string): Promise<number> => {
    try {
      const publicKey = new PublicKey(walletAddress);
      const balance = await connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error(`Error fetching SOL balance (${network}):`, error);
      throw error;
    }
  }, [connection, network]);

  /**
   * Get token balances - uses Helius API on mainnet, RPC on devnet
   */
  const getTokenBalances = useCallback(async (walletAddress: string): Promise<TokenBalance[]> => {
    // On mainnet, use Helius API for better data
    if (canUseHeliusApi) {
      try {
        const response = await fetch(
          `${heliusApiUrl}/addresses/${walletAddress}/balances?api-key=${apiKey}`
        );

        if (response.ok) {
          const data = await response.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return data.tokens?.map((token: any) => ({
            mint: token.mint,
            amount: token.amount,
            decimals: token.decimals,
            uiAmount: token.amount / Math.pow(10, token.decimals),
            symbol: token.symbol,
            name: token.name,
            logoURI: token.logoURI,
          })) || [];
        }
      } catch (error) {
        console.error('Helius API error, falling back to RPC:', error);
      }
    }

    // Fallback: Use RPC directly (works on both mainnet and devnet)
    try {
      const wallet = new PublicKey(walletAddress);
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet, {
        programId: TOKEN_PROGRAM_ID,
      });

      return tokenAccounts.value.map((account) => {
        const parsed = account.account.data.parsed.info;
        const tokenAmount = parsed.tokenAmount;

        return {
          mint: parsed.mint,
          amount: Number(tokenAmount.amount),
          decimals: tokenAmount.decimals,
          uiAmount: tokenAmount.uiAmount || 0,
        };
      });
    } catch (error) {
      console.error(`Error fetching token balances from RPC (${network}):`, error);
      return [];
    }
  }, [connection, network, canUseHeliusApi, apiKey, heliusApiUrl]);

  /**
   * Get complete wallet balances (SOL + tokens)
   */
  const getWalletBalances = useCallback(async (walletAddress: string): Promise<WalletBalances> => {
    const [sol, tokens] = await Promise.all([
      getSOLBalance(walletAddress),
      getTokenBalances(walletAddress),
    ]);

    return { sol, tokens };
  }, [getSOLBalance, getTokenBalances]);

  /**
   * Get token decimals
   */
  const getTokenDecimals = useCallback(async (mintAddress: string): Promise<number> => {
    // Check known decimals first
    if (KNOWN_DECIMALS[mintAddress] !== undefined) {
      return KNOWN_DECIMALS[mintAddress];
    }

    try {
      const mintPubkey = new PublicKey(mintAddress);
      const mintInfo = await connection.getParsedAccountInfo(mintPubkey);

      if (mintInfo.value?.data && 'parsed' in mintInfo.value.data) {
        const parsedData = mintInfo.value.data.parsed;
        if (parsedData.type === 'mint') {
          return parsedData.info.decimals;
        }
      }

      return 9; // Default to 9 if unknown
    } catch (error) {
      console.error(`Error fetching token decimals (${network}):`, error);
      return 9;
    }
  }, [connection, network]);

  /**
   * Subscribe to wallet balance changes
   */
  const subscribeToWallet = useCallback((
    walletAddress: string,
    callback: (data: { balance: number; timestamp: number }) => void
  ): () => void => {
    const publicKey = new PublicKey(walletAddress);

    const subscriptionId = connection.onAccountChange(
      publicKey,
      (accountInfo) => {
        callback({
          balance: accountInfo.lamports / LAMPORTS_PER_SOL,
          timestamp: Date.now(),
        });
      },
      'confirmed'
    );

    // Return unsubscribe function
    return () => {
      connection.removeAccountChangeListener(subscriptionId);
    };
  }, [connection]);

  return useMemo(() => ({
    // Network info
    network,
    rpcUrl,
    connection,
    canUseHeliusApi,

    // Methods
    getSOLBalance,
    getTokenBalances,
    getWalletBalances,
    getTokenDecimals,
    subscribeToWallet,
  }), [
    network,
    rpcUrl,
    connection,
    canUseHeliusApi,
    getSOLBalance,
    getTokenBalances,
    getWalletBalances,
    getTokenDecimals,
    subscribeToWallet,
  ]);
}

export default useHeliusService;
