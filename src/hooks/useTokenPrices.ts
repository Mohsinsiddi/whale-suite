'use client';

import { useCallback } from 'react';
import useSWR from 'swr';

// Token mint addresses for price lookup
const TOKEN_MINTS: Record<string, string> = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  USD1: 'USD1ttGY1N17NEEHLmELoaybftRBUSErhqYiQzvEmuB', // World Liberty Financial USD
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  JTO: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  RADR: 'CzFvsLdUazabdiu9TYXujj4EY495fG7VgJJ3vQs6bonk', // Radr
  WLFI: 'WLFinEv6ypjkczcS83FZqFpgFZYwQXutRbxGe7oC16g', // World Liberty Financial
};

// Export token mints for use in other modules
export { TOKEN_MINTS };

// Cache prices for 30 seconds
const CACHE_DURATION = 30 * 1000;

interface TokenPrices {
  [symbol: string]: number;
}

// Fallback prices when API is unavailable
const getFallbackPrices = (): TokenPrices => ({
  SOL: 180, // Update periodically
  USDC: 1,
  USDT: 1,
  USD1: 1,
  BONK: 0.000025,
  JTO: 3.5,
  WIF: 1.5,
  JUP: 0.8,
  RADR: 0.02, // Radr fallback
  WLFI: 0.015, // World Liberty Financial fallback
});

// Jupiter API key (optional but recommended)
const JUPITER_API_KEY = process.env.NEXT_PUBLIC_JUPITER_API_KEY || '';

// Simple fetcher for Jupiter Price API
const fetchPrices = async (): Promise<TokenPrices> => {
  try {
    const ids = Object.values(TOKEN_MINTS).join(',');

    // Build headers with API key if available
    const headers: HeadersInit = {};
    if (JUPITER_API_KEY) {
      headers['x-api-key'] = JUPITER_API_KEY;
    }

    const response = await fetch(
      `https://api.jup.ag/price/v2?ids=${ids}`,
      {
        headers,
        next: { revalidate: 30 }
      }
    );

    // If 401, return fallback prices silently
    if (response.status === 401) {
      console.warn('Jupiter API: No API key or invalid key, using fallback prices');
      return getFallbackPrices();
    }

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
    if (!prices.USD1) prices.USD1 = 1;

    return prices;
  } catch (error) {
    console.warn('Price fetch error, using fallback:', error);
    return getFallbackPrices();
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
    const upperSymbol = symbol.toUpperCase();
    // Stablecoins always return $1
    if (upperSymbol === 'USDC' || upperSymbol === 'USDT' || upperSymbol === 'USD1') {
      return prices?.[upperSymbol] || 1;
    }
    if (!prices) return upperSymbol === 'SOL' ? 150 : 0;
    return prices[upperSymbol] || 0;
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
