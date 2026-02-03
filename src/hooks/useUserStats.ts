'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRequireAuth } from './useAuth';
import { useStore } from '@/store';

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
    termsAcceptedAt?: string;
    termsVersion?: string;
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

// Cache to prevent duplicate calls across component instances
const statsCache: Map<string, { data: UserStats; timestamp: number }> = new Map();
const CACHE_DURATION = 15000; // 15 seconds cache - matches API cache
const pendingRequests: Map<string, Promise<UserStats | null>> = new Map();

export function useUserStats() {
  const { isAuthenticated, walletAddress } = useRequireAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const lastFetchedWallet = useRef<string | null>(null);

  const fetchStats = useCallback(async (wallet?: string, forceRefresh = false) => {
    const targetWallet = wallet || walletAddress;
    if (!targetWallet) {
      setError('No wallet address');
      return null;
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = statsCache.get(targetWallet);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setStats(cached.data);
        return cached.data;
      }
    }

    // Check if there's already a pending request for this wallet
    const pendingRequest = pendingRequests.get(targetWallet);
    if (pendingRequest) {
      return pendingRequest;
    }

    setLoading(true);
    setError(null);

    const requestPromise = (async () => {
      try {
        const response = await fetch(`/api/users/${targetWallet}/stats`);
        const data = await response.json();

        if (!data.success) {
          // Check specifically for "User not found" error (user exists in Privy but not in DB)
          if (data.error === 'User not found') {
            const store = useStore.getState();
            store.setUserNotFound(true);
          }
          throw new Error(data.error || 'Failed to fetch stats');
        }

        // User was found, ensure userNotFound is false
        const storeState = useStore.getState();
        if (storeState.userNotFound) {
          storeState.setUserNotFound(false);
        }

        // Update cache
        statsCache.set(targetWallet, { data, timestamp: Date.now() });
        setStats(data);

        // Sync to Zustand store so Sidebar and other components stay updated
        const store = useStore.getState();
        if (data.user) {
          store.setPrivacyScore(data.user.privacyScore || 0);
          store.setBadgeTier(data.user.badgeTier || 'none');
          // Sync terms acceptance status
          if (data.user.termsAcceptedAt) {
            store.setTermsAccepted(new Date(data.user.termsAcceptedAt), data.user.termsVersion || '1.0.0');
          }
        }
        if (data.stats) {
          store.setStats({
            hiddenBalance: data.stats.hiddenBalance || 0,
            privateTransfers: data.stats.privateTransfers || 0,
            anonymousBets: data.stats.anonymousBets || 0,
            swapVolume: data.stats.swapVolume || 0,
            activeDays: data.stats.activeDays || 0,
          });
        }

        return data as UserStats;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to fetch stats';
        setError(message);
        return null;
      } finally {
        setLoading(false);
        pendingRequests.delete(targetWallet);
      }
    })();

    pendingRequests.set(targetWallet, requestPromise);
    return requestPromise;
  }, [walletAddress]);

  // Auto-fetch when wallet changes (not on every render)
  useEffect(() => {
    if (isAuthenticated && walletAddress && walletAddress !== lastFetchedWallet.current) {
      lastFetchedWallet.current = walletAddress;
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, walletAddress]);

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
    refresh: () => fetchStats(undefined, true), // Force refresh bypasses cache
  };
}

export default useUserStats;
