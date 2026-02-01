'use client';

import { useMemo, useEffect, useCallback } from 'react';
import { Connection } from '@solana/web3.js';
import { useRPC, useStore } from '@/store';
import { useNetwork } from './useNetwork';
import type { RPCEndpoint } from '@/store';

// Fallback RPC URLs (public, rate-limited)
const FALLBACK_RPC: Record<string, string> = {
  mainnet: 'https://api.mainnet-beta.solana.com',
  devnet: 'https://api.devnet.solana.com',
};

/**
 * Hook to get the current RPC endpoint URL based on network and user selection
 * Handles fallbacks and connection creation
 */
export function useRPCEndpoint() {
  const { network } = useNetwork();
  const {
    endpoints,
    customEndpoints,
    activeEndpointId,
    selectionStrategy,
    apiKeys,
    getBestEndpoint,
    selectBestEndpoint,
    testAllPings,
    lastPingTest,
  } = useRPC();

  // Get endpoint URL with API key
  const getEndpointUrl = useCallback((endpoint: RPCEndpoint | null): string => {
    if (!endpoint) return FALLBACK_RPC[network] || FALLBACK_RPC.devnet;

    let url = endpoint.url;

    // Append API key if available (only for Helius which needs key appended)
    if (!endpoint.isCustom && endpoint.provider === 'helius') {
      const key = apiKeys.helius;
      if (key) {
        url = `${endpoint.url}${key}`;
      }
    }

    return url;
  }, [apiKeys, network]);

  // Get the active endpoint
  const activeEndpoint = useMemo(() => {
    const allEndpoints = [...endpoints, ...customEndpoints];

    // If manual selection, use the active endpoint
    if (selectionStrategy === 'manual' && activeEndpointId) {
      const endpoint = allEndpoints.find(
        (e) => e.id === activeEndpointId && e.network === network
      );
      if (endpoint) return endpoint;
    }

    // If auto or no active endpoint, get best for network
    const best = getBestEndpoint(network);
    if (best) return best;

    // Fallback to first endpoint for network
    return allEndpoints.find((e) => e.network === network) || null;
  }, [endpoints, customEndpoints, activeEndpointId, selectionStrategy, network, getBestEndpoint]);

  // Get the RPC URL
  const rpcUrl = useMemo(() => {
    return getEndpointUrl(activeEndpoint);
  }, [activeEndpoint, getEndpointUrl]);

  // Create a Solana connection
  const connection = useMemo(() => {
    return new Connection(rpcUrl, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
    });
  }, [rpcUrl]);

  // Test pings on first load
  useEffect(() => {
    if (!lastPingTest) {
      testAllPings();
    }
  }, [lastPingTest, testAllPings]);

  // Auto-select best endpoint when strategy is 'auto' and we have ping data
  useEffect(() => {
    if (selectionStrategy === 'auto' && lastPingTest) {
      selectBestEndpoint(network);
    }
  }, [selectionStrategy, lastPingTest, network, selectBestEndpoint]);

  return {
    rpcUrl,
    connection,
    activeEndpoint,
    network,
    isUsingFallback: !activeEndpoint,
    provider: activeEndpoint?.provider || 'custom',
    ping: activeEndpoint?.ping,
    isHealthy: activeEndpoint?.isHealthy,
  };
}

/**
 * Get the RPC URL directly from store (for non-hook contexts)
 */
export function getRPCUrl(network: 'mainnet' | 'devnet'): string {
  const state = useStore.getState();
  const allEndpoints = [...state.endpoints, ...state.customEndpoints];

  // Get active or best endpoint
  let endpoint: RPCEndpoint | undefined;

  if (state.selectionStrategy === 'manual' && state.activeEndpointId) {
    endpoint = allEndpoints.find(
      (e) => e.id === state.activeEndpointId && e.network === network
    );
  }

  if (!endpoint) {
    // Get best endpoint (lowest ping, healthy)
    const networkEndpoints = allEndpoints.filter((e) => e.network === network && e.isHealthy !== false);
    networkEndpoints.sort((a, b) => (a.ping || 9999) - (b.ping || 9999));
    endpoint = networkEndpoints[0];
  }

  if (!endpoint) {
    return FALLBACK_RPC[network] || FALLBACK_RPC.devnet;
  }

  // Append API key
  let url = endpoint.url;
  const key = state.apiKeys[endpoint.provider as keyof typeof state.apiKeys];
  if (key && !endpoint.isCustom) {
    url = `${endpoint.url}${key}`;
  }

  return url;
}

export default useRPCEndpoint;
