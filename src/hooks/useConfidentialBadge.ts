'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/lib/privy/hooks';

export interface ConfidentialBadgeData {
  hasClaimed: boolean;
  tier: number;
  tierName: string;
  badgeAccountAddress?: string;
  claimTxSignature?: string;
  claimedAt?: string;
  proofHandles?: {
    bronze: string;
    silver: string;
    gold: string;
    diamond: string;
    legendary: string;
  };
}

export interface UseConfidentialBadgeReturn {
  badge: ConfidentialBadgeData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  canAccessTier: (requiredTier: number) => boolean;
}

export function useConfidentialBadge(): UseConfidentialBadgeReturn {
  const { walletAddress } = useAuth();
  const [badge, setBadge] = useState<ConfidentialBadgeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBadge = useCallback(async () => {
    if (!walletAddress) {
      setBadge(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useConfidentialBadge] Fetching badge for wallet:', walletAddress);
      const response = await fetch(`/api/badges/confidential?wallet=${walletAddress}`);
      const data = await response.json();
      console.log('[useConfidentialBadge] API response:', data);

      if (data.success) {
        const badgeData = data.badge || { hasClaimed: false, tier: 0, tierName: 'None' };
        console.log('[useConfidentialBadge] Setting badge:', badgeData);
        setBadge(badgeData);
      } else {
        console.log('[useConfidentialBadge] API returned success=false, setting no badge');
        setBadge({ hasClaimed: false, tier: 0, tierName: 'None' });
      }
    } catch (err) {
      console.error('[useConfidentialBadge] Failed to fetch:', err);
      setError('Failed to fetch badge status');
      setBadge({ hasClaimed: false, tier: 0, tierName: 'None' });
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  // Fetch on mount and when wallet changes
  useEffect(() => {
    fetchBadge();
  }, [fetchBadge]);

  // Check if user can access a specific tier
  const canAccessTier = useCallback((requiredTier: number): boolean => {
    if (!badge?.hasClaimed) return false;
    return badge.tier >= requiredTier;
  }, [badge]);

  return {
    badge,
    loading,
    error,
    refetch: fetchBadge,
    canAccessTier,
  };
}

export default useConfidentialBadge;

// Tier utilities
export const TIER_INFO = {
  1: { name: 'Bronze', icon: '🥉', color: 'from-amber-600 to-amber-400' },
  2: { name: 'Silver', icon: '🥈', color: 'from-gray-400 to-gray-200' },
  3: { name: 'Gold', icon: '🥇', color: 'from-yellow-500 to-yellow-300' },
  4: { name: 'Diamond', icon: '💎', color: 'from-cyan-400 to-blue-300' },
  5: { name: 'Legendary', icon: '👑', color: 'from-purple-500 to-pink-400' },
} as const;

export const TIER_PRICES = {
  1: 0.1,
  2: 0.2,
  3: 0.3,
  4: 0.4,
  5: 0.5,
} as const;

/**
 * PRIVACY-FIRST DESIGN
 *
 * The badge tier is NOT stored on-chain in plain text!
 * Only encrypted INCO handles are stored:
 * - encrypted_tier: INCO u128 handle
 * - proof_bronze: INCO u128 handle (tier >= 1)
 * - proof_silver: INCO u128 handle (tier >= 2)
 * - proof_gold: INCO u128 handle (tier >= 3)
 * - proof_diamond: INCO u128 handle (tier >= 4)
 * - proof_legendary: INCO u128 handle (tier >= 5)
 *
 * ALL 5 proof handles are ALWAYS non-zero for EVERY tier.
 * This prevents observers from determining the tier by checking
 * which handles are zero vs non-zero.
 *
 * To verify tier access:
 * 1. User signs with wallet
 * 2. INCO decrypts the relevant proof handle
 * 3. Result: "1" (TRUE) or "0" (FALSE)
 *
 * Example: Gold tier user
 * - proof_bronze: decrypts to "1" (TRUE)
 * - proof_silver: decrypts to "1" (TRUE)
 * - proof_gold: decrypts to "1" (TRUE)
 * - proof_diamond: decrypts to "0" (FALSE)
 * - proof_legendary: decrypts to "0" (FALSE)
 */
export const PRIVACY_INFO = {
  allHandlesNonZero: true,
  tierStoredOnChain: false,
  decryptRequiresSignature: true,
};
