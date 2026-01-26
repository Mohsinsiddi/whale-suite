'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useCallback, useMemo } from 'react';

export function useAuth() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();

  // Get the primary wallet (first connected wallet)
  const primaryWallet = useMemo(() => {
    if (!wallets || wallets.length === 0) return null;

    // Find external wallet first, then embedded
    const externalWallet = wallets.find((w) => w.walletClientType !== 'privy');
    return externalWallet || wallets[0] || null;
  }, [wallets]);

  // Get wallet address
  const walletAddress = useMemo(() => {
    return primaryWallet?.address || null;
  }, [primaryWallet]);

  // Handle login
  const handleLogin = useCallback(() => {
    try {
      login();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, [login]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, [logout]);

  return {
    ready,
    authenticated,
    user,
    wallet: primaryWallet,
    walletAddress,
    login: handleLogin,
    logout: handleLogout,
    isLoading: !ready,
  };
}

export function useWalletAddress() {
  const { walletAddress } = useAuth();
  return walletAddress;
}

export function useIsAuthenticated() {
  const { ready, authenticated } = usePrivy();
  return ready && authenticated;
}
