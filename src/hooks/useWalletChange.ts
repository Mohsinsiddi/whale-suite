'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSWRConfig } from 'swr';
import { usePrivy } from '@privy-io/react-auth';
import { useStore } from '@/store';
import { useAuth } from '@/lib/privy/hooks';

/**
 * CRITICAL HOOK: Handles wallet switching and user sync
 *
 * When the connected wallet changes OR on initial load:
 * 1. Updates store with new wallet
 * 2. Clears old user data
 * 3. Invalidates all SWR caches
 * 4. Syncs user data (creates user if not exists in DB)
 */
export function useWalletChange() {
  const { walletAddress, authenticated } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { logout } = usePrivy(); // Keep for potential future use
  const { mutate } = useSWRConfig();

  // Get store actions once (stable references)
  const setWallet = useStore((state) => state.setWallet);
  const resetUser = useStore((state) => state.resetUser);
  const resetWallet = useStore((state) => state.resetWallet);
  const setAuthenticated = useStore((state) => state.setAuthenticated);
  const setAuthLoading = useStore((state) => state.setAuthLoading);
  const setUserLoading = useStore((state) => state.setUserLoading);

  const previousWalletRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);
  const hasSyncedRef = useRef(false); // Track if we've synced this session
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isLoggingOutRef = useRef(false); // Keep for potential future use

  // Sync user to backend
  const syncUserToBackend = useCallback(async (wallet: string) => {
    setUserLoading(true); // Start loading
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
          // Set terms acceptance status
          if (data.user.termsAcceptedAt) {
            store.setTermsAccepted(
              new Date(data.user.termsAcceptedAt),
              data.user.termsVersion || '1.0.0'
            );
          }
        }
      }
    } catch (error) {
      console.error('Failed to sync user:', error);
    } finally {
      setUserLoading(false); // Done loading
      useStore.getState().setHasSynced(true); // Mark sync as complete
    }
  }, [setUserLoading]);

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
        hasSyncedRef.current = false; // Reset sync flag on logout
      }
      return;
    }

    // Detect wallet switch while authenticated - sync new wallet data (don't force logout)
    if (previousWalletRef.current && previousWalletRef.current !== walletAddress) {
      console.log('[WalletChange] Wallet switched while authenticated:', {
        from: previousWalletRef.current,
        to: walletAddress,
      });

      // Clear old user data and sync new wallet
      console.log('[WalletChange] Syncing new wallet data...');
      resetUser();
      useStore.getState().setHasSynced(false);

      // Update to new wallet
      setWallet(walletAddress);
      previousWalletRef.current = walletAddress;
      hasSyncedRef.current = false;

      // Invalidate all caches
      mutate(() => true, undefined, { revalidate: false });

      // Sync new user data
      syncUserToBackend(walletAddress);
      hasSyncedRef.current = true;

      return;
    }

    // First time connecting or same wallet
    const shouldSync = !hasSyncedRef.current;

    if (!previousWalletRef.current) {
      console.log('Wallet connected:', walletAddress);
      setWallet(walletAddress);
      previousWalletRef.current = walletAddress;
    }

    // Sync user data (creates user if not exists in DB)
    if (shouldSync) {
      console.log('Syncing user to backend...');
      syncUserToBackend(walletAddress);
      hasSyncedRef.current = true;
    }

    // Trigger revalidation for wallet data
    if (shouldSync) {
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
    }
  }, [walletAddress, authenticated]); // Minimal dependencies

  return {
    wallet: walletAddress,
    previousWallet: previousWalletRef.current,
    isConnected: !!walletAddress && authenticated,
  };
}

export default useWalletChange;
