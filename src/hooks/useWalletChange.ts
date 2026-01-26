'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSWRConfig } from 'swr';
import { useStore } from '@/store';
import { useAuth } from '@/lib/privy/hooks';

/**
 * CRITICAL HOOK: Handles wallet switching
 *
 * When the connected wallet changes:
 * 1. Updates store with new wallet
 * 2. Clears old user data
 * 3. Invalidates all SWR caches
 * 4. Syncs user data for new wallet
 */
export function useWalletChange() {
  const { walletAddress, authenticated } = useAuth();
  const { mutate } = useSWRConfig();

  // Get store actions once (stable references)
  const setWallet = useStore((state) => state.setWallet);
  const resetUser = useStore((state) => state.resetUser);
  const resetWallet = useStore((state) => state.resetWallet);
  const setAuthenticated = useStore((state) => state.setAuthenticated);
  const setAuthLoading = useStore((state) => state.setAuthLoading);

  const previousWalletRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);

  // Sync user to backend
  const syncUserToBackend = useCallback(async (wallet: string) => {
    try {
      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update store with user data
        const store = useStore.getState();
        if (data.user) {
          store.setUser({
            userNumber: data.user.userNumber,
            email: data.user.email,
            badgeTier: data.user.badgeTier,
            badgeMint: data.user.badgeMint,
            isPremium: data.user.isPremium,
            premiumExpiry: data.user.premiumExpiry,
            privacyScore: data.user.privacyScore,
            stats: data.user.stats,
            referralCode: data.user.referralCode,
            referredBy: data.user.referredBy,
            settings: data.user.settings,
          });
        }
      }
    } catch (error) {
      console.error('Failed to sync user:', error);
    }
  }, []);

  useEffect(() => {
    // Skip if already processing
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      setAuthLoading(false);
    }

    // Update auth state only if changed
    setAuthenticated(authenticated);

    // If not authenticated or no wallet, clear everything
    if (!authenticated || !walletAddress) {
      if (previousWalletRef.current) {
        console.log('Wallet disconnected, clearing state');
        resetWallet();
        resetUser();
        mutate(() => true, undefined, { revalidate: false });
        previousWalletRef.current = null;
      }
      return;
    }

    // Check if wallet actually changed
    if (previousWalletRef.current === walletAddress) {
      return; // No change, skip
    }

    console.log('Wallet changed:', {
      from: previousWalletRef.current,
      to: walletAddress,
    });

    // Clear previous wallet data if exists
    if (previousWalletRef.current) {
      resetUser();
      mutate(
        (key: unknown) =>
          typeof key === 'string' && key.includes(previousWalletRef.current!),
        undefined,
        { revalidate: false }
      );
    }

    // Update to new wallet
    setWallet(walletAddress);
    previousWalletRef.current = walletAddress;

    // Sync user data
    syncUserToBackend(walletAddress);

    // Trigger revalidation for new wallet
    mutate((key: unknown) => {
      if (typeof key === 'string') {
        return (
          key.includes(`/api/users/${walletAddress}`) ||
          key.includes(`/api/transactions/${walletAddress}`) ||
          key.includes(`/api/referrals/${walletAddress}`) ||
          key.includes('/api/whale-feed') ||
          key.includes('/api/badges')
        );
      }
      return false;
    });
  }, [walletAddress, authenticated]); // Minimal dependencies

  return {
    wallet: walletAddress,
    previousWallet: previousWalletRef.current,
    isConnected: !!walletAddress && authenticated,
  };
}

export default useWalletChange;
