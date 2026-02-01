'use client';

import useSWR from 'swr';
import { useCallback } from 'react';

export interface ReferralSummary {
  totalReferrals: number;
  activeReferrals: number;
  totalEarned: number;
  pendingPayout: number;
  paidOut: number;
  referralCode: string;
}

export interface ReferredUser {
  userNumber: number;
  badgeTier: string;
  joinedAt: string;
}

export interface Referral {
  id: string;
  referredUser: ReferredUser | null;
  commissionRate: number;
  totalEarned: number;
  pendingPayout: number;
  paidOut: number;
  conversions: {
    badgePurchase?: {
      tier: string;
      amount: number;
      commission: number;
      date: string;
    };
    subscriptions: Array<{
      months: number;
      amount: number;
      commission: number;
      date: string;
    }>;
  };
  status: 'active' | 'inactive';
  referredAt: string;
  lastEarningAt?: string;
}

interface ReferralsResponse {
  success: boolean;
  summary: ReferralSummary;
  referrals: Referral[];
}

const fetcher = async (url: string): Promise<ReferralsResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch referrals');
  }
  return res.json();
};

export function useReferrals(wallet: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ReferralsResponse>(
    wallet ? `/api/referrals/${wallet}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);

  return {
    summary: data?.summary || null,
    referrals: data?.referrals || [],
    isLoading,
    error,
    refresh,
  };
}
