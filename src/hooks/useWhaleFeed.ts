'use client';

import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import { useCallback } from 'react';

export interface WhaleFeedEvent {
  id: string;
  whaleId: string;
  eventType: 'large_transfer' | 'privacy_deposit' | 'privacy_withdraw' | 'token_swap' | 'anonymous_bet';
  amount?: number;
  token?: string;
  usdValue?: number;
  displayText: string;
  signature: string;
  blockTime: number;
  createdAt: string;
}

interface WhaleFeedResponse {
  success: boolean;
  events: WhaleFeedEvent[];
  total: number;
  hasMore: boolean;
}

interface UseWhaleFeedOptions {
  limit?: number;
  eventType?: string;
  timeRange?: '24h' | '7d' | '30d';
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const fetcher = async (url: string): Promise<WhaleFeedResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch whale feed');
  }
  return res.json();
};

export function useWhaleFeed(options: UseWhaleFeedOptions = {}) {
  const {
    limit = 50,
    eventType,
    timeRange,
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
  } = options;

  // Build query string
  const queryParams = new URLSearchParams();
  queryParams.set('limit', limit.toString());
  if (eventType && eventType !== 'all') {
    queryParams.set('eventType', eventType);
  }
  if (timeRange) {
    queryParams.set('timeRange', timeRange);
  }

  const { data, error, isLoading, mutate } = useSWR<WhaleFeedResponse>(
    `/api/whale-feed?${queryParams.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: autoRefresh ? refreshInterval : 0,
      dedupingInterval: 10000,
    }
  );

  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);

  return {
    events: data?.events || [],
    total: data?.total || 0,
    hasMore: data?.hasMore || false,
    isLoading,
    error,
    refresh,
  };
}

// Infinite loading version for paginated feeds
export function useWhaleFeedInfinite(options: UseWhaleFeedOptions = {}) {
  const { limit = 20, eventType, timeRange } = options;

  const getKey = (pageIndex: number, previousPageData: WhaleFeedResponse | null) => {
    if (previousPageData && !previousPageData.hasMore) return null;

    const queryParams = new URLSearchParams();
    queryParams.set('limit', limit.toString());
    queryParams.set('offset', (pageIndex * limit).toString());

    if (eventType && eventType !== 'all') {
      queryParams.set('eventType', eventType);
    }
    if (timeRange) {
      queryParams.set('timeRange', timeRange);
    }

    return `/api/whale-feed?${queryParams.toString()}`;
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite<WhaleFeedResponse>(getKey, fetcher, {
      revalidateOnFocus: false,
      revalidateFirstPage: true,
      dedupingInterval: 10000,
    });

  const events = data?.flatMap((page: WhaleFeedResponse) => page.events) || [];
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
    events,
    total,
    hasMore,
    isLoading,
    isValidating,
    loadMore,
    refresh,
    error,
  };
}
