'use client';

import type { PrivyClientConfig } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';

// Create Solana wallet connectors for Phantom, Solflare, etc.
const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: true,
});

export const privyConfig: PrivyClientConfig = {
  // Appearance
  appearance: {
    theme: 'dark',
    accentColor: '#00ff88',
    showWalletLoginFirst: true,
    walletChainType: 'solana-only',
  },

  // Login methods
  loginMethods: ['wallet', 'email'],

  // Solana embedded wallet
  embeddedWallets: {
    solana: {
      createOnLogin: 'users-without-wallets',
    },
  },

  // External Solana wallets - THIS IS REQUIRED!
  externalWallets: {
    solana: {
      connectors: solanaConnectors,
    },
  },
};

export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';
