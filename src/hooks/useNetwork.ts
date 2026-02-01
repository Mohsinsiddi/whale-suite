/**
 * Network Hook
 * Facade hook that uses NetworkProvider context
 * Provides backwards compatibility with existing code
 */

'use client';

import {
  useNetworkContext,
  useConnection,
  useFeatureAvailable,
  FEATURE_NETWORK_SUPPORT,
  type NetworkType,
  type FeatureKey,
} from '@/providers/NetworkProvider';

// Re-export types and constants for backwards compatibility
export { FEATURE_NETWORK_SUPPORT };
export type { NetworkType, FeatureKey };

/**
 * Main network hook - uses NetworkProvider context
 */
export function useNetwork() {
  const {
    network,
    setNetwork,
    rpcUrl,
    connection,
    rpcPing,
    rpcLoading,
    isFeatureAvailable,
    getFeatureStatus,
    isSwitching,
    switchProgress,
    refreshPing,
    switchNetwork,
  } = useNetworkContext();

  // Legacy compatibility: getRpcUrl function
  const getRpcUrl = () => rpcUrl;

  // Legacy compatibility: toggleNetwork function
  const toggleNetwork = () => {
    const newNetwork = network === 'mainnet' ? 'devnet' : 'mainnet';
    switchNetwork(newNetwork);
  };

  return {
    // State
    network,
    rpcUrl,
    connection,
    rpcPing,
    rpcLoading,
    isSwitching,
    switchProgress,

    // Actions
    setNetwork,
    toggleNetwork,
    switchNetwork,
    refreshPing,

    // Feature checks
    isFeatureAvailable,
    getFeatureStatus,

    // Legacy
    getRpcUrl,
  };
}

// Re-export utility hooks
export { useConnection, useFeatureAvailable };

export default useNetwork;
