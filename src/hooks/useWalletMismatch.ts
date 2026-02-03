'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/privy/hooks';

interface PhantomProvider {
  isPhantom?: boolean;
  publicKey?: { toBase58: () => string } | null;
  isConnected?: boolean;
  on: (event: string, callback: (publicKey: { toBase58: () => string } | null) => void) => void;
  off: (event: string, callback: (publicKey: { toBase58: () => string } | null) => void) => void;
}

declare global {
  interface Window {
    solana?: PhantomProvider;
    phantom?: {
      solana?: PhantomProvider;
    };
  }
}

// Session storage key to track original auth wallet
const AUTH_WALLET_KEY = 'whale-suite-auth-wallet';

/**
 * Hook to detect when Phantom wallet has changed since last full authentication.
 * Shows warning when user switches wallet in Phantom - app data syncs automatically,
 * but user should reconnect for fresh auth session.
 */
export function useWalletMismatch() {
  const { walletAddress: privyWallet, authenticated } = useAuth();
  const [phantomWallet, setPhantomWallet] = useState<string | null>(null);
  const [walletChanged, setWalletChanged] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const originalAuthWalletRef = useRef<string | null>(null);

  // Get Phantom provider
  const getPhantomProvider = useCallback((): PhantomProvider | null => {
    if (typeof window === 'undefined') return null;

    const provider = window.phantom?.solana || window.solana;
    if (provider?.isPhantom) {
      return provider;
    }
    return null;
  }, []);

  // Update phantom wallet state
  const updatePhantomWallet = useCallback(() => {
    const provider = getPhantomProvider();
    if (provider?.publicKey) {
      const address = provider.publicKey.toBase58();
      setPhantomWallet(address);
      return address;
    } else {
      setPhantomWallet(null);
      return null;
    }
  }, [getPhantomProvider]);

  // Track original authenticated wallet
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (authenticated && privyWallet) {
      // Check if we have a stored original wallet
      const storedWallet = sessionStorage.getItem(AUTH_WALLET_KEY);

      if (!storedWallet) {
        // First auth - store the wallet
        sessionStorage.setItem(AUTH_WALLET_KEY, privyWallet);
        originalAuthWalletRef.current = privyWallet;
        setWalletChanged(false);
      } else {
        originalAuthWalletRef.current = storedWallet;
      }
    } else if (!authenticated) {
      // User logged out - clear stored wallet
      sessionStorage.removeItem(AUTH_WALLET_KEY);
      originalAuthWalletRef.current = null;
      setWalletChanged(false);
    }
  }, [authenticated, privyWallet]);

  // Listen for Phantom wallet changes
  useEffect(() => {
    const provider = getPhantomProvider();
    if (!provider) return;

    // Initial check
    updatePhantomWallet();

    // Listen for account changes
    const handleAccountChange = (publicKey: { toBase58: () => string } | null) => {
      if (publicKey) {
        const newAddress = publicKey.toBase58();
        console.log('[WalletMismatch] Phantom account changed:', newAddress);
        setPhantomWallet(newAddress);
        setDismissed(false); // Reset dismissed state on wallet change

        // Check if different from original auth wallet
        const originalWallet = originalAuthWalletRef.current || sessionStorage.getItem(AUTH_WALLET_KEY);
        if (originalWallet && originalWallet.toLowerCase() !== newAddress.toLowerCase()) {
          console.log('[WalletMismatch] Wallet changed from original auth:', {
            original: originalWallet,
            current: newAddress,
          });
          setWalletChanged(true);
        }
      } else {
        setPhantomWallet(null);
      }
    };

    provider.on('accountChanged', handleAccountChange);

    return () => {
      provider.off('accountChanged', handleAccountChange);
    };
  }, [getPhantomProvider, updatePhantomWallet]);

  // Also check on mount if there's already a mismatch
  useEffect(() => {
    if (!authenticated || !phantomWallet) return;

    const originalWallet = originalAuthWalletRef.current || sessionStorage.getItem(AUTH_WALLET_KEY);
    if (originalWallet && originalWallet.toLowerCase() !== phantomWallet.toLowerCase()) {
      setWalletChanged(true);
    }
  }, [authenticated, phantomWallet]);

  // Dismiss warning (temporary - until next wallet change)
  const dismissWarning = useCallback(() => {
    setDismissed(true);
  }, []);

  // Clear mismatch state (called when user logs out)
  const clearMismatch = useCallback(() => {
    sessionStorage.removeItem(AUTH_WALLET_KEY);
    originalAuthWalletRef.current = null;
    setWalletChanged(false);
    setDismissed(false);
  }, []);

  return {
    isMismatch: walletChanged && !dismissed,
    privyWallet,
    phantomWallet,
    originalAuthWallet: originalAuthWalletRef.current,
    dismiss: dismissWarning,
    clearMismatch,
  };
}

export default useWalletMismatch;
