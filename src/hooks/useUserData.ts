'use client';

import useSWR from 'swr';
import { useStore } from '@/store';
import { useCallback, useEffect, useRef } from 'react';

interface UserData {
  wallet: string;
  userNumber: number;
  email?: string;
  badgeTier: 'none' | 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary';
  badgeMint?: string;
  isPremium: boolean;
  premiumExpiry?: string;
  privacyScore: number;
  stats: {
    hiddenBalance: number;
    privateTransfers: number;
    anonymousBets: number;
    swapVolume: number;
    activeDays: number;
  };
  referralCode: string;
  referredBy?: string;
  settings: {
    notifications: boolean;
    emailUpdates: boolean;
    language: string;
    theme: string;
  };
  createdAt: string;
  lastLoginAt: string;
}

interface UserResponse {
  success: boolean;
  user: UserData;
}

const fetcher = async (url: string): Promise<UserResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch user data');
  }
  return res.json();
};

export function useUserData(wallet: string | null) {
  const lastSyncedRef = useRef<string | null>(null);

  const { data, error, isLoading, mutate } = useSWR<UserResponse>(
    wallet ? `/api/users/${wallet}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000,
    }
  );

  // Sync user data to store - only when data actually changes
  useEffect(() => {
    const store = useStore.getState();
    store.setUserLoading(isLoading);

    if (data?.success && data.user) {
      const userKey = `${data.user.wallet}-${data.user.userNumber}`;

      // Only update if user data actually changed
      if (lastSyncedRef.current !== userKey) {
        lastSyncedRef.current = userKey;
        store.setUser({
          userNumber: data.user.userNumber,
          email: data.user.email || null,
          badgeTier: data.user.badgeTier,
          badgeMint: data.user.badgeMint || null,
          isPremium: data.user.isPremium,
          premiumExpiry: data.user.premiumExpiry
            ? new Date(data.user.premiumExpiry)
            : null,
          privacyScore: data.user.privacyScore,
          stats: data.user.stats,
          referralCode: data.user.referralCode,
          referredBy: data.user.referredBy || null,
          settings: data.user.settings,
        });
      }
    }
  }, [data, isLoading]);

  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);

  return {
    user: data?.user || null,
    isLoading,
    error,
    refresh,
    mutate,
  };
}

// Sync user on login (creates if not exists)
export function useSyncUser() {
  const syncUser = useCallback(async (
    wallet: string,
    privyId?: string,
    email?: string
  ): Promise<UserData | null> => {
    try {
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet, privyId, email }),
      });

      if (!res.ok) {
        throw new Error('Failed to sync user');
      }

      const data = await res.json();

      if (data.success && data.user) {
        const store = useStore.getState();
        store.setUser({
          userNumber: data.user.userNumber,
          email: data.user.email || null,
          badgeTier: data.user.badgeTier,
          badgeMint: data.user.badgeMint || null,
          isPremium: data.user.isPremium,
          premiumExpiry: data.user.premiumExpiry
            ? new Date(data.user.premiumExpiry)
            : null,
          privacyScore: data.user.privacyScore,
          stats: data.user.stats,
          referralCode: data.user.referralCode,
          referredBy: data.user.referredBy || null,
          settings: data.user.settings,
        });

        return data.user;
      }

      return null;
    } catch (error) {
      console.error('Sync user error:', error);
      return null;
    }
  }, []);

  return { syncUser };
}
