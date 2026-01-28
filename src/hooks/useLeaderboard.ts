'use client';

import { useState, useCallback, useEffect } from 'react';

export interface LeaderboardEntry {
  rank: number;
  wallet: string;
  userNumber: number;
  displayName: string;
  badgeTier: string;
  points: number;
  streak: number;
  privacyScore: number;
  privateTransfers: number;
  swapVolume: number;
  lastActive?: string;
}

export interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  podium: LeaderboardEntry[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  period: string;
}

export type LeaderboardPeriod = 'all' | 'weekly' | 'monthly';

export function useLeaderboard(initialPeriod: LeaderboardPeriod = 'all') {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [period, setPeriod] = useState<LeaderboardPeriod>(initialPeriod);

  const fetchLeaderboard = useCallback(async (
    options: { limit?: number; offset?: number; period?: LeaderboardPeriod } = {}
  ) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: (options.limit || 50).toString(),
        offset: (options.offset || 0).toString(),
        period: options.period || period,
      });

      const response = await fetch(`/api/leaderboard?${params}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch leaderboard');
      }

      setData(result);
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to fetch leaderboard';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [period]);

  const loadMore = useCallback(async () => {
    if (!data || !data.pagination.hasMore || loading) return;

    const newOffset = data.pagination.offset + data.pagination.limit;
    const result = await fetchLeaderboard({ offset: newOffset });

    if (result) {
      setData(prev => prev ? {
        ...result,
        leaderboard: [...prev.leaderboard, ...result.leaderboard],
      } : result);
    }
  }, [data, loading, fetchLeaderboard]);

  const changePeriod = useCallback((newPeriod: LeaderboardPeriod) => {
    setPeriod(newPeriod);
    setData(null);
  }, []);

  // Auto-fetch on period change
  useEffect(() => {
    fetchLeaderboard({ period });
  }, [period, fetchLeaderboard]);

  return {
    loading,
    error,
    data,
    leaderboard: data?.leaderboard || [],
    podium: data?.podium || [],
    pagination: data?.pagination,
    period,
    fetchLeaderboard,
    loadMore,
    changePeriod,
    refresh: () => fetchLeaderboard({ period }),
  };
}

export default useLeaderboard;
