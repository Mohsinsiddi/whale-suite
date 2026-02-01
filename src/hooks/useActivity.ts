'use client';

/**
 * Activity Hook
 * Track and fetch user activity across all features
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuthenticatedFetch } from './useAuthenticatedFetch';
import { useNetwork } from './useNetwork';
import { useRequireAuth } from './useAuth';
import { TransactionCategory } from '@/lib/database/models/Transaction';

export interface ActivityRecord {
  _id: string;
  wallet: string;
  network: 'mainnet' | 'devnet';
  type: string;
  amount: number;
  token?: string;
  fee?: number;
  signature: string;
  status: 'pending' | 'confirmed' | 'failed';
  metadata: Record<string, unknown>;
  createdAt: string;
  confirmedAt?: string;
}

export interface UseActivityReturn {
  // State
  activities: ActivityRecord[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;

  // Actions
  fetchActivities: (category?: TransactionCategory | 'all') => Promise<void>;
  loadMore: () => Promise<void>;
  recordActivity: (data: {
    type: string;
    amount?: number;
    token?: string;
    fee?: number;
    signature: string;
    metadata?: Record<string, unknown>;
  }) => Promise<ActivityRecord | null>;
  updateStatus: (signature: string, status: 'confirmed' | 'failed') => Promise<void>;
  refresh: () => Promise<void>;
}

export function useActivity(category: TransactionCategory | 'all' = 'all'): UseActivityReturn {
  const { isAuthenticated } = useRequireAuth();
  const { network } = useNetwork();
  const { get, post, patch } = useAuthenticatedFetch();

  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const LIMIT = 20;

  const fetchActivities = useCallback(async (cat: TransactionCategory | 'all' = category) => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const response = await get<{
        transactions: ActivityRecord[];
        total: number;
        hasMore: boolean;
      }>(`/api/activity?network=${network}&category=${cat}&limit=${LIMIT}&offset=0`);

      if (response.data) {
        setActivities(response.data.transactions);
        setTotal(response.data.total);
        setHasMore(response.data.hasMore);
        setOffset(LIMIT);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, network, category, get]);

  const loadMore = useCallback(async () => {
    if (!isAuthenticated || !hasMore || loading) return;

    setLoading(true);

    try {
      const response = await get<{
        transactions: ActivityRecord[];
        total: number;
        hasMore: boolean;
      }>(`/api/activity?network=${network}&category=${category}&limit=${LIMIT}&offset=${offset}`);

      if (response.data) {
        setActivities(prev => [...prev, ...response.data!.transactions]);
        setHasMore(response.data.hasMore);
        setOffset(prev => prev + LIMIT);
      }
    } catch (err) {
      console.error('Failed to load more:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, hasMore, loading, network, category, offset, get]);

  const recordActivity = useCallback(async (data: {
    type: string;
    amount?: number;
    token?: string;
    fee?: number;
    signature: string;
    metadata?: Record<string, unknown>;
  }): Promise<ActivityRecord | null> => {
    if (!isAuthenticated) return null;

    try {
      const response = await post<{ transaction: ActivityRecord }>('/api/activity', {
        ...data,
        network,
      });

      if (response.data?.transaction) {
        // Add to local state
        setActivities(prev => [response.data!.transaction, ...prev]);
        setTotal(prev => prev + 1);
        return response.data.transaction;
      }
      return null;
    } catch (err) {
      console.error('Failed to record activity:', err);
      return null;
    }
  }, [isAuthenticated, network, post]);

  const updateStatus = useCallback(async (signature: string, status: 'confirmed' | 'failed') => {
    if (!isAuthenticated) return;

    try {
      await patch('/api/activity', { signature, status, network });

      // Update local state
      setActivities(prev =>
        prev.map(a =>
          a.signature === signature
            ? { ...a, status, confirmedAt: status === 'confirmed' ? new Date().toISOString() : undefined }
            : a
        )
      );
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  }, [isAuthenticated, network, patch]);

  const refresh = useCallback(() => fetchActivities(category), [fetchActivities, category]);

  // Fetch on mount and when network changes
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    loading,
    error,
    total,
    hasMore,
    fetchActivities,
    loadMore,
    recordActivity,
    updateStatus,
    refresh,
  };
}

export default useActivity;
