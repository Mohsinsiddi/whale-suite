"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { Connection } from "@solana/web3.js";

// Network types
export type NetworkType = "mainnet" | "devnet";

// Feature availability by network
// Devnet SDKs will be added one by one as they become available
export const FEATURE_NETWORK_SUPPORT = {
  // Mainnet-only features (production SDKs)
  "shadow-wire": { mainnet: true, devnet: false, label: "ShadowWire Transfers" },
  "pnp-markets": { mainnet: true, devnet: false, label: "PNP Markets" },
  "jupiter-swap": { mainnet: true, devnet: false, label: "Jupiter Swap" },
  "privacy-cash": { mainnet: true, devnet: false, label: "Privacy Cash" },
  "cross-chain": { mainnet: false, devnet: false, label: "Cross-Chain Swap (Coming Soon)" },
  "whale-feed": { mainnet: true, devnet: true, label: "Whale Intelligence" },
  "darklake": { mainnet: true, devnet: false, label: "Darklake Private Swap" },

  // Devnet-only features (beta/testing)
  "dark-pool": { mainnet: false, devnet: true, label: "Dark Pool (Beta)" },

  // Available on both networks
  "standard-transfer": { mainnet: true, devnet: true, label: "Standard Transfer" },

  // StarPay Virtual Cards (mainnet only)
  "virtual-cards": { mainnet: true, devnet: false, label: "Virtual Cards" },

  // INCO Confidential Badge & Channels System
  "confidential-badge": { mainnet: false, devnet: true, label: "Confidential Badge" },
  "channels": { mainnet: true, devnet: true, label: "Private Channels" },
  "private-payments": { mainnet: false, devnet: true, label: "Private Payments" },

  // Coming soon - will be enabled as SDKs are integrated
  // "arcium": { mainnet: false, devnet: true, label: "Arcium (Coming Soon)" },
  // "inco": { mainnet: false, devnet: true, label: "Inco Network (Coming Soon)" },
} as const;

export type FeatureKey = keyof typeof FEATURE_NETWORK_SUPPORT;

// RPC Configuration
interface RpcConfig {
  mainnet: string;
  devnet: string;
}

// Network context state
interface NetworkContextState {
  // Current network
  network: NetworkType;
  setNetwork: (network: NetworkType) => void;

  // RPC
  rpcUrl: string;
  connection: Connection;
  rpcPing: number | null;
  rpcLoading: boolean;

  // Feature availability
  isFeatureAvailable: (feature: FeatureKey) => boolean;
  getFeatureStatus: (feature: FeatureKey) => {
    available: boolean;
    network: NetworkType;
    label: string;
  };

  // Switching state (for UI transitions)
  isSwitching: boolean;
  switchProgress: number;

  // Actions
  refreshPing: () => Promise<void>;
  switchNetwork: (network: NetworkType) => Promise<void>;
}

const NetworkContext = createContext<NetworkContextState | null>(null);

// Get RPC URLs based on environment
function getRpcConfig(): RpcConfig {
  const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;

  return {
    mainnet: apiKey
      ? `https://mainnet.helius-rpc.com/?api-key=${apiKey}`
      : process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.mainnet-beta.solana.com",
    devnet: apiKey
      ? `https://devnet.helius-rpc.com/?api-key=${apiKey}`
      : "https://api.devnet.solana.com",
  };
}

interface NetworkProviderProps {
  children: ReactNode;
  defaultNetwork?: NetworkType;
}

export function NetworkProvider({
  children,
  defaultNetwork = "mainnet",
}: NetworkProviderProps) {
  // Load initial network from localStorage or use default
  const [network, setNetworkState] = useState<NetworkType>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("whale-suite-network");
      if (stored === "mainnet" || stored === "devnet") {
        return stored;
      }
    }
    return defaultNetwork;
  });

  const [rpcPing, setRpcPing] = useState<number | null>(null);
  const [rpcLoading, setRpcLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchProgress, setSwitchProgress] = useState(0);

  // RPC config
  const rpcConfig = useMemo(() => getRpcConfig(), []);

  // Current RPC URL based on network
  const rpcUrl = useMemo(() => rpcConfig[network], [rpcConfig, network]);

  // Connection instance - recreated when network changes
  const connection = useMemo(
    () => new Connection(rpcUrl, "confirmed"),
    [rpcUrl]
  );

  // Persist network to localStorage
  const setNetwork = useCallback((newNetwork: NetworkType) => {
    setNetworkState(newNetwork);
    if (typeof window !== "undefined") {
      localStorage.setItem("whale-suite-network", newNetwork);
    }
  }, []);

  // Measure RPC ping
  const refreshPing = useCallback(async () => {
    setRpcLoading(true);
    try {
      const start = performance.now();
      await connection.getSlot();
      const end = performance.now();
      setRpcPing(Math.round(end - start));
    } catch (error) {
      console.error("Failed to measure RPC ping:", error);
      setRpcPing(-1);
    } finally {
      setRpcLoading(false);
    }
  }, [connection]);

  // Switch network with progress animation
  const switchNetwork = useCallback(
    async (newNetwork: NetworkType) => {
      if (newNetwork === network) return;

      setIsSwitching(true);
      setSwitchProgress(0);

      // Simulate progress steps
      const steps = [
        { progress: 20, delay: 200 },
        { progress: 40, delay: 300 },
        { progress: 60, delay: 250 },
        { progress: 80, delay: 300 },
        { progress: 95, delay: 200 },
      ];

      for (const step of steps) {
        await new Promise((resolve) => setTimeout(resolve, step.delay));
        setSwitchProgress(step.progress);
      }

      // Actually switch
      setNetwork(newNetwork);

      // Measure new ping
      const newRpcUrl = rpcConfig[newNetwork];
      const newConnection = new Connection(newRpcUrl, "confirmed");
      try {
        const start = performance.now();
        await newConnection.getSlot();
        const end = performance.now();
        setRpcPing(Math.round(end - start));
      } catch {
        setRpcPing(-1);
      }

      setSwitchProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 300));

      setIsSwitching(false);
      setSwitchProgress(0);
    },
    [network, setNetwork, rpcConfig]
  );

  // Check feature availability
  const isFeatureAvailable = useCallback(
    (feature: FeatureKey): boolean => {
      const support = FEATURE_NETWORK_SUPPORT[feature];
      return support ? support[network] : false;
    },
    [network]
  );

  // Get feature status with details
  const getFeatureStatus = useCallback(
    (feature: FeatureKey) => {
      const support = FEATURE_NETWORK_SUPPORT[feature];
      return {
        available: support ? support[network] : false,
        network,
        label: support?.label || feature,
      };
    },
    [network]
  );

  // Measure ping on mount and when network changes
  useEffect(() => {
    refreshPing();
  }, [refreshPing]);

  // Refresh ping periodically
  useEffect(() => {
    const interval = setInterval(refreshPing, 60000); // Every minute
    return () => clearInterval(interval);
  }, [refreshPing]);

  const value: NetworkContextState = useMemo(
    () => ({
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
    }),
    [
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
    ]
  );

  return (
    <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
  );
}

// Hook to use network context
export function useNetworkContext() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetworkContext must be used within a NetworkProvider");
  }
  return context;
}

// Utility hook to get connection for current network
export function useConnection() {
  const { connection, network, rpcUrl } = useNetworkContext();
  return { connection, network, rpcUrl };
}

// Utility hook to check if a feature is available
export function useFeatureAvailable(feature: FeatureKey) {
  const { isFeatureAvailable, network } = useNetworkContext();
  return {
    available: isFeatureAvailable(feature),
    network,
  };
}

// Export for backwards compatibility
export { NetworkContext };
