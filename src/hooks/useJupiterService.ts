'use client';

/**
 * Network-aware Jupiter Service Hook
 * Jupiter only works on mainnet - this hook handles network validation
 */

import { useMemo, useCallback } from 'react';
import { useConnection, useFeatureAvailable } from '@/providers/NetworkProvider';

// Jupiter API endpoints
const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6';
const JUPITER_PRICE_API = 'https://price.jup.ag/v6';

// Common token mints
export const TOKEN_MINTS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
} as const;

export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: RoutePlan[];
}

export interface RoutePlan {
  swapInfo: {
    ammKey: string;
    label: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    feeAmount: string;
    feeMint: string;
  };
  percent: number;
}

export interface TokenPrice {
  id: string;
  mintSymbol: string;
  vsToken: string;
  vsTokenSymbol: string;
  price: number;
}

export function useJupiterService() {
  const { connection, network, rpcUrl } = useConnection();
  const { available: isJupiterAvailable } = useFeatureAvailable('jupiter-swap');

  /**
   * Check if Jupiter is available on current network
   */
  const checkAvailability = useCallback(() => {
    if (!isJupiterAvailable) {
      throw new Error(`Jupiter swap is not available on ${network}. Please switch to mainnet.`);
    }
  }, [isJupiterAvailable, network]);

  /**
   * Get swap quote from Jupiter
   */
  const getQuote = useCallback(async (params: {
    inputMint: string;
    outputMint: string;
    amount: number; // in lamports/smallest unit
    slippageBps?: number; // default 50 = 0.5%
  }): Promise<SwapQuote | null> => {
    checkAvailability();

    try {
      const { inputMint, outputMint, amount, slippageBps = 50 } = params;

      const response = await fetch(
        `${JUPITER_QUOTE_API}/quote?` +
        `inputMint=${inputMint}&` +
        `outputMint=${outputMint}&` +
        `amount=${amount}&` +
        `slippageBps=${slippageBps}`
      );

      if (!response.ok) {
        throw new Error(`Jupiter API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting Jupiter quote:', error);
      return null;
    }
  }, [checkAvailability]);

  /**
   * Get token price from Jupiter Price API
   */
  const getTokenPrice = useCallback(async (mintAddress: string): Promise<number | null> => {
    checkAvailability();

    try {
      const response = await fetch(
        `${JUPITER_PRICE_API}/price?ids=${mintAddress}`
      );

      if (!response.ok) {
        throw new Error(`Jupiter Price API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data?.[mintAddress]?.price || null;
    } catch (error) {
      console.error('Error getting token price:', error);
      return null;
    }
  }, [checkAvailability]);

  /**
   * Get multiple token prices
   */
  const getTokenPrices = useCallback(async (mintAddresses: string[]): Promise<Record<string, number>> => {
    checkAvailability();

    try {
      const ids = mintAddresses.join(',');
      const response = await fetch(
        `${JUPITER_PRICE_API}/price?ids=${ids}`
      );

      if (!response.ok) {
        throw new Error(`Jupiter Price API error: ${response.status}`);
      }

      const data = await response.json();
      const prices: Record<string, number> = {};

      for (const mint of mintAddresses) {
        prices[mint] = data.data?.[mint]?.price || 0;
      }

      return prices;
    } catch (error) {
      console.error('Error getting token prices:', error);
      return {};
    }
  }, [checkAvailability]);

  /**
   * Build swap transaction
   */
  const buildSwapTransaction = useCallback(async (params: {
    quote: SwapQuote;
    userPublicKey: string;
    wrapUnwrapSOL?: boolean;
  }): Promise<string | null> => {
    checkAvailability();

    try {
      const { quote, userPublicKey, wrapUnwrapSOL = true } = params;

      const response = await fetch(`${JUPITER_QUOTE_API}/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey,
          wrapAndUnwrapSol: wrapUnwrapSOL,
        }),
      });

      if (!response.ok) {
        throw new Error(`Jupiter swap API error: ${response.status}`);
      }

      const data = await response.json();
      return data.swapTransaction;
    } catch (error) {
      console.error('Error building swap transaction:', error);
      return null;
    }
  }, [checkAvailability]);

  return useMemo(() => ({
    // Network info
    network,
    rpcUrl,
    connection,
    isAvailable: isJupiterAvailable,

    // Methods
    getQuote,
    getTokenPrice,
    getTokenPrices,
    buildSwapTransaction,

    // Constants
    TOKEN_MINTS,
  }), [
    network,
    rpcUrl,
    connection,
    isJupiterAvailable,
    getQuote,
    getTokenPrice,
    getTokenPrices,
    buildSwapTransaction,
  ]);
}

export default useJupiterService;
