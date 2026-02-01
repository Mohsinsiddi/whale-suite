// Auth Hooks
export { useAuth, useRequireAuth } from './useAuth';
export type { AuthState } from './useAuth';
export { useAuthenticatedFetch } from './useAuthenticatedFetch';

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

// StarPay Virtual Cards
export { useStarPay } from './useStarPay';
export type {
  CardType,
  PriceResponse,
  CardOrder,
  OrderStatusResponse,
  AccountInfo,
  OrderStatus,
} from './useStarPay';

// Activity Tracking
export { useActivity } from './useActivity';
export type { ActivityRecord, UseActivityReturn } from './useActivity';

// Leaderboard & Points
export { useLeaderboard } from './useLeaderboard';
export type { LeaderboardEntry } from './useLeaderboard';
export { usePoints } from './usePoints';
export { useUserStats } from './useUserStats';

// Token Prices
export { useTokenPrices, TOKEN_MINTS as TOKEN_PRICE_MINTS } from './useTokenPrices';

// Multi-Send
export { useMultiSend } from './useMultiSend';
export type {
  MultiSendRecipient,
  MultiSendProgress,
  MultiSendResult,
  TokenType,
} from './useMultiSend';

// Darklake Private Swap
export { useDarklake } from './useDarklake';
export type { DarklakeState, UseDarklakeReturn } from './useDarklake';

// Confidential Badge & Channels
export { useConfidentialBadge, TIER_INFO, TIER_PRICES } from './useConfidentialBadge';
export type { ConfidentialBadgeData, UseConfidentialBadgeReturn } from './useConfidentialBadge';
export { useClaimBadge } from './useClaimBadge';
export type { ClaimBadgeState, ClaimBadgeResult } from './useClaimBadge';
