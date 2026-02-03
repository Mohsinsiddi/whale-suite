'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth/solana';
import { useCallback, useMemo } from 'react';

export function useAuth() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets: solanaWallets } = useWallets();

  // Get the primary Solana wallet
  const primaryWallet = useMemo(() => {
    if (!solanaWallets || solanaWallets.length === 0) return null;
    return solanaWallets[0];
  }, [solanaWallets]);

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
