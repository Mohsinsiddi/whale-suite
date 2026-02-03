'use client';

import useSWR from 'swr';
import { useNetwork } from './useNetwork';

export interface RecentTransfer {
  id: string;
  to: string;
  toFull: string;
  amount: string;
  amountRaw: number;
  token: string;
  time: string;
  timestamp: Date;
  type: 'internal' | 'external';
  isMultiSend: boolean;
  signature: string;
}

interface RecentTransfersResponse {
  success: boolean;
  transfers: RecentTransfer[];
  count: number;
}

const fetcher = async (url: string): Promise<RecentTransfersResponse> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch transfers');
  return response.json();
};

/**
 * Hook to fetch recent shadow wire transfers for a wallet
 * Only fetches single send and multi-send transfers (excludes deposits/withdrawals)
 */
export function useRecentTransfers(wallet: string | null, limit: number = 10) {
  const { network } = useNetwork();

  const { data, error, isLoading, mutate } = useSWR<RecentTransfersResponse>(
    wallet ? `/api/transfers/recent?wallet=${wallet}&network=${network}&limit=${limit}` : null,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      dedupingInterval: 10000,
    }
  );

  return {
    transfers: data?.transfers || [],
    count: data?.count || 0,
    loading: isLoading,
    error: error?.message,
    refresh: mutate,
  };
}

export default useRecentTransfers;
