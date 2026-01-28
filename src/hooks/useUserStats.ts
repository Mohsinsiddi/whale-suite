'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRequireAuth } from './useAuth';

export interface UserStats {
  user: {
    wallet: string;
    userNumber: number;
    displayName: string;
    badgeTier: string;
    isPremium: boolean;
    premiumExpiry?: string;
    privacyScore: number;
    memberSince: string;
  };
  points: {
    total: number;
    today: number;
    week: number;
    month: number;
    recentHistory: Array<{
      _id: string;
      action: string;
      totalPoints: number;
      createdAt: string;
    }>;
  };
  leaderboard: {
    rank: number;
    totalUsers: number;
    percentile: number;
    topPercent: string | null;
  };
  streak: {
    current: number;
    lastActive?: string;
    isActiveToday: boolean;
  };
  stats: {
    hiddenBalance: number;
    privateTransfers: number;
    anonymousBets: number;
    swapVolume: number;
    activeDays: number;
    totalTransactions: number;
    virtualCards: number;
    referrals: number;
  };
  activity: Record<string, { count: number; amount: number }>;
}

export function useUserStats() {
  const { isAuthenticated, walletAddress } = useRequireAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);

  const fetchStats = useCallback(async (wallet?: string) => {
    const targetWallet = wallet || walletAddress;
    if (!targetWallet) {
      setError('No wallet address');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${targetWallet}/stats`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch stats');
      }

      setStats(data);
      return data as UserStats;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to fetch stats';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  // Auto-fetch when authenticated
  useEffect(() => {
    if (isAuthenticated && walletAddress) {
      fetchStats();
    }
  }, [isAuthenticated, walletAddress, fetchStats]);

  // Derived values
  const rank = stats?.leaderboard.rank || 0;
  const points = stats?.points.total || 0;
  const streak = stats?.streak.current || 0;
  const isActiveToday = stats?.streak.isActiveToday || false;
  const badgeTier = stats?.user.badgeTier || 'none';

  // Calculate rank change indicator (mock - would need historical data)
  const rankTrend = 0; // TODO: Track rank changes

  return {
    loading,
    error,
    stats,
    // Quick access
    rank,
    points,
    streak,
    isActiveToday,
    badgeTier,
    rankTrend,
    // Actions
    fetchStats,
    refresh: () => fetchStats(),
  };
}

export default useUserStats;
