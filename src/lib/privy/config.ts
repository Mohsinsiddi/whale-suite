import type { PrivyClientConfig } from '@privy-io/react-auth';

export const privyConfig: PrivyClientConfig = {
  // Appearance
  appearance: {
    theme: 'dark',
    accentColor: '#00ff88',
    logo: '/whale-logo.svg',
    showWalletLoginFirst: true,
  },

  // Login methods
  loginMethods: ['wallet', 'email', 'google', 'twitter'],

  // Embedded wallets
  embeddedWallets: {
    solana: {
      createOnLogin: 'users-without-wallets',
    },
  },
};

export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';
