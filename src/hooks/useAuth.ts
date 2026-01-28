'use client';

/**
 * Global Auth Hook
 * Provides authentication state and utilities across the app
 * Integrates with Privy for wallet connection
 */

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useCallback, useMemo, useEffect, useState } from 'react';

export interface AuthState {
  // Connection state
  isAuthenticated: boolean;
  isConnecting: boolean;
  isReady: boolean;

  // User info
  userId: string | null;
  walletAddress: string | null;
  email: string | null;

  // Network
  network: 'mainnet' | 'devnet';

  // Actions
  login: () => void;
  logout: () => Promise<void>;

  // Token for API calls
  getAccessToken: () => Promise<string | null>;
}

export function useAuth(): AuthState {
  const { ready, authenticated, user, login, logout: privyLogout, getAccessToken } = usePrivy();
  const { wallets } = useWallets();
  const [isConnecting, setIsConnecting] = useState(false);

  // Determine the active Solana wallet address
  const walletAddress = useMemo(() => {
    // Check general wallets for Solana type
    const solanaWallet = wallets.find(w =>
      w.walletClientType === 'solana' ||
      (w as { chainType?: string }).chainType === 'solana'
    );
    if (solanaWallet) {
      return solanaWallet.address;
    }

    // Check embedded wallet
    if (user?.wallet?.address) {
      return user.wallet.address;
    }

    // Check linked accounts for Solana wallet
    const linkedSolana = user?.linkedAccounts?.find(
      (acc): acc is typeof acc & { address: string } =>
        acc.type === 'wallet' &&
        'chainType' in acc &&
        acc.chainType === 'solana' &&
        'address' in acc
    );

    return linkedSolana?.address || null;
  }, [user, wallets]);

  // Determine network from environment
  const network = useMemo((): 'mainnet' | 'devnet' => {
    const rpcUrl = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || '';
    if (rpcUrl.includes('devnet')) return 'devnet';
    return 'mainnet';
  }, []);

  // Handle login with loading state
  const handleLogin = useCallback(() => {
    setIsConnecting(true);
    login();
  }, [login]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await privyLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [privyLogout]);

  // Get access token for API calls
  const handleGetAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const token = await getAccessToken();
      return token;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }, [getAccessToken]);

  // Reset connecting state when authenticated
  useEffect(() => {
    if (authenticated) {
      setIsConnecting(false);
    }
  }, [authenticated]);

  // Reset connecting state when ready but not authenticated
  useEffect(() => {
    if (ready && !authenticated) {
      setIsConnecting(false);
    }
  }, [ready, authenticated]);

  return {
    isAuthenticated: authenticated,
    isConnecting,
    isReady: ready,
    userId: user?.id || null,
    walletAddress,
    email: user?.email?.address || null,
    network,
    login: handleLogin,
    logout: handleLogout,
    getAccessToken: handleGetAccessToken,
  };
}

/**
 * Hook to require authentication
 * Shows toast and redirects if not authenticated
 */
export function useRequireAuth() {
  const auth = useAuth();

  const requireAuth = useCallback((): boolean => {
    if (!auth.isReady) {
      return false;
    }

    if (!auth.isAuthenticated) {
      return false;
    }

    if (!auth.walletAddress) {
      return false;
    }

    return true;
  }, [auth.isReady, auth.isAuthenticated, auth.walletAddress]);

  return {
    ...auth,
    requireAuth,
    isWalletConnected: !!auth.walletAddress,
  };
}

export default useAuth;
