// Network Hooks (Global network state)
export { useNetwork, useConnection, useFeatureAvailable } from './useNetwork';
export type { NetworkType, FeatureKey } from './useNetwork';
export { FEATURE_NETWORK_SUPPORT } from './useNetwork';

// User & Data Hooks
export { useUserData, useSyncUser } from './useUserData';
export { useWhaleFeed, useWhaleFeedInfinite, type WhaleFeedEvent } from './useWhaleFeed';
export { useTransactions, useTransactionsInfinite, type Transaction } from './useTransactions';
export { useReferrals, type ReferralSummary, type Referral, type ReferredUser } from './useReferrals';
export { useWalletChange, default as useWalletChangeDefault } from './useWalletChange';

// Balance Hooks
export { useWalletBalance } from './useWalletBalance';

// SDK Transaction Hooks
export { useSwap } from './useSwap';
export { useTransfer } from './useTransfer';
export { usePrivacyCash } from './usePrivacyCash';
export { useShadowWire } from './useShadowWire';
export {
  useWalletBalances,
  useTransactionHistory,
  useWhaleFeed as useHeliusWhaleFeed,
  useWalletSubscription,
} from './useHelius';

// Network-aware SDK Hooks (use these for network-safe SDK calls)
export { useHeliusService } from './useHeliusService';
export { useJupiterService, TOKEN_MINTS } from './useJupiterService';

// PNP uses dynamic imports - import directly: import { usePNP } from '@/hooks/usePNP'
