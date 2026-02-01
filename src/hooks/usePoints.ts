'use client';

import { useState, useCallback } from 'react';
import { useAuthenticatedFetch } from './useAuthenticatedFetch';

export type PointAction =
  | 'privacy_deposit'
  | 'privacy_withdraw'
  | 'shadow_transfer'
  | 'standard_transfer'
  | 'jupiter_swap'
  | 'private_swap'
  | 'darklake_swap'
  | 'card_order'
  | 'daily_login'
  | 'referral'
  | 'badge_bronze'
  | 'badge_silver'
  | 'badge_gold'
  | 'badge_diamond'
  | 'badge_legendary'
  | 'pnp_bet'
  | 'pnp_create_market'
  | 'channel_join'
  | 'channel_participate'
  | 'token_launch';

export interface PointsResult {
  action: PointAction;
  basePoints: number;
  multiplier: number;
  streakBonus: number;
  totalAwarded: number;
  newTotal: number;
}

export interface PointsHistoryEntry {
  _id: string;
  wallet: string;
  action: PointAction;
  basePoints: number;
  multiplier: number;
  totalPoints: number;
  badgeTier: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export function usePoints() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<PointsResult | null>(null);
  const [history, setHistory] = useState<PointsHistoryEntry[]>([]);
  const { post, get } = useAuthenticatedFetch();

  /**
   * Award points for an action
   */
  const awardPoints = useCallback(async (
    action: PointAction,
    metadata?: {
      txSignature?: string;
      amount?: number;
      token?: string;
      description?: string;
      [key: string]: unknown;
    },
    volumeMultiplier: number = 1
  ): Promise<PointsResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await post<{
        success: boolean;
        points: PointsResult;
        streak: number;
        error?: string;
      }>('/api/points/award', {
        action,
        volumeMultiplier,
        metadata,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to award points');
      }

      setLastResult(response.data.points);
      return response.data.points;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to award points';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [post]);

  /**
   * Fetch points history
   */
  const fetchHistory = useCallback(async (
    limit: number = 20,
    offset: number = 0
  ): Promise<PointsHistoryEntry[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await get<{
        success: boolean;
        history: PointsHistoryEntry[];
        pagination: { total: number; hasMore: boolean };
        error?: string;
      }>(`/api/points/award?limit=${limit}&offset=${offset}`);

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to fetch history');
      }

      if (offset === 0) {
        setHistory(response.data.history);
      } else {
        setHistory(prev => [...prev, ...response.data!.history]);
      }

      return response.data.history;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to fetch history';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [get]);

  /**
   * Helper to get action display name
   */
  const getActionLabel = (action: PointAction): string => {
    const labels: Record<PointAction, string> = {
      privacy_deposit: 'Privacy Deposit',
      privacy_withdraw: 'Privacy Withdraw',
      shadow_transfer: 'Private Transfer',
      standard_transfer: 'Transfer',
      jupiter_swap: 'Swap',
      private_swap: 'Private Swap',
      darklake_swap: 'DarkLake Swap',
      card_order: 'Virtual Card',
      daily_login: 'Daily Login',
      referral: 'Referral',
      badge_bronze: 'Bronze Badge',
      badge_silver: 'Silver Badge',
      badge_gold: 'Gold Badge',
      badge_diamond: 'Diamond Badge',
      badge_legendary: 'Legendary Badge',
      pnp_bet: 'Anonymous Bet',
      pnp_create_market: 'Create Market',
      channel_join: 'Channel Join',
      channel_participate: 'Channel Activity',
      token_launch: 'Token Launch',
    };
    return labels[action] || action;
  };

  return {
    loading,
    error,
    lastResult,
    history,
    awardPoints,
    fetchHistory,
    getActionLabel,
  };
}

export default usePoints;
