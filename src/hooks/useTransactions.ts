'use client';

import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import { useCallback } from 'react';

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  token?: string;
  fee?: number;
  sdk?: string;
  signature: string;
  status: 'pending' | 'confirmed' | 'failed';
  metadata?: Record<string, unknown>;
  createdAt: string;
  confirmedAt?: string;
}

interface TransactionsResponse {
  success: boolean;
  transactions: Transaction[];
  total: number;
  hasMore: boolean;
}

interface UseTransactionsOptions {
  limit?: number;
  type?: string;
  status?: string;
}

const fetcher = async (url: string): Promise<TransactionsResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch transactions');
  }
  return res.json();
};

export function useTransactions(wallet: string | null, options: UseTransactionsOptions = {}) {
  const { limit = 20, type, status } = options;

  // Build query string
  const queryParams = new URLSearchParams();
  queryParams.set('limit', limit.toString());
  if (type && type !== 'all') {
    queryParams.set('type', type);
  }
  if (status && status !== 'all') {
    queryParams.set('status', status);
  }

  const { data, error, isLoading, mutate } = useSWR<TransactionsResponse>(
    wallet ? `/api/transactions/${wallet}?${queryParams.toString()}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);

  return {
    transactions: data?.transactions || [],
    total: data?.total || 0,
    hasMore: data?.hasMore || false,
    isLoading,
    error,
    refresh,
  };
}

// Infinite loading version
export function useTransactionsInfinite(wallet: string | null, options: UseTransactionsOptions = {}) {
  const { limit = 20, type, status } = options;

  const getKey = (pageIndex: number, previousPageData: TransactionsResponse | null) => {
    if (!wallet) return null;
    if (previousPageData && !previousPageData.hasMore) return null;

    const queryParams = new URLSearchParams();
    queryParams.set('limit', limit.toString());
    queryParams.set('offset', (pageIndex * limit).toString());

    if (type && type !== 'all') {
      queryParams.set('type', type);
    }
    if (status && status !== 'all') {
      queryParams.set('status', status);
    }

    return `/api/transactions/${wallet}?${queryParams.toString()}`;
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite<TransactionsResponse>(getKey, fetcher, {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    });

  const transactions = data?.flatMap((page: TransactionsResponse) => page.transactions) || [];
  const hasMore = data?.[data.length - 1]?.hasMore || false;
  const total = data?.[0]?.total || 0;

  const loadMore = useCallback(() => {
    if (hasMore && !isValidating) {
      setSize(size + 1);
    }
  }, [hasMore, isValidating, setSize, size]);

  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);

  return {
    transactions,
    total,
    hasMore,
    isLoading,
    isValidating,
    loadMore,
    refresh,
    error,
  };
}
