'use client';

import { useCallback } from 'react';
import useSWR from 'swr';

// Token mint addresses for price lookup
const TOKEN_MINTS: Record<string, string> = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  JTO: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
};

// Cache prices for 30 seconds
const CACHE_DURATION = 30 * 1000;

interface TokenPrices {
  [symbol: string]: number;
}

// Simple fetcher for Jupiter Price API
const fetchPrices = async (): Promise<TokenPrices> => {
  try {
    const ids = Object.values(TOKEN_MINTS).join(',');
    const response = await fetch(
      `https://api.jup.ag/price/v2?ids=${ids}`,
      { next: { revalidate: 30 } }
    );

    if (!response.ok) throw new Error('Failed to fetch prices');

    const data = await response.json();
    const prices: TokenPrices = {};

    // Map mint addresses back to symbols
    for (const [symbol, mint] of Object.entries(TOKEN_MINTS)) {
      if (data.data?.[mint]?.price) {
        prices[symbol] = data.data[mint].price;
      }
    }

    // Stablecoins default to $1
    if (!prices.USDC) prices.USDC = 1;
    if (!prices.USDT) prices.USDT = 1;

    return prices;
  } catch (error) {
    console.error('Price fetch error:', error);
    // Return fallback prices
    return {
      SOL: 150,
      USDC: 1,
      USDT: 1,
      BONK: 0.00002,
      JTO: 3,
      WIF: 2,
      JUP: 1,
    };
  }
};

export function useTokenPrices() {
  const { data: prices, error, isLoading, mutate } = useSWR<TokenPrices>(
    'token-prices',
    fetchPrices,
    {
      refreshInterval: CACHE_DURATION,
      revalidateOnFocus: false,
      dedupingInterval: CACHE_DURATION,
    }
  );

  const getPrice = useCallback((symbol: string): number => {
    if (!prices) return symbol === 'USDC' || symbol === 'USDT' ? 1 : 150;
    return prices[symbol.toUpperCase()] || 0;
  }, [prices]);

  const formatUSD = useCallback((amount: number, symbol: string): string => {
    const price = getPrice(symbol);
    const usdValue = amount * price;

    if (usdValue >= 1000000) {
      return `$${(usdValue / 1000000).toFixed(2)}M`;
    }
    if (usdValue >= 1000) {
      return `$${(usdValue / 1000).toFixed(2)}K`;
    }
    if (usdValue >= 1) {
      return `$${usdValue.toFixed(2)}`;
    }
    return `$${usdValue.toFixed(4)}`;
  }, [getPrice]);

  const getUSDValue = useCallback((amount: number, symbol: string): number => {
    return amount * getPrice(symbol);
  }, [getPrice]);

  return {
    prices: prices || {},
    loading: isLoading,
    error,
    getPrice,
    formatUSD,
    getUSDValue,
    refresh: mutate,
  };
}

export default useTokenPrices;
