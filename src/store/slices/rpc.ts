import { StateCreator } from 'zustand';

// RPC Provider types
export type RPCProvider = 'helius' | 'quicknode' | 'public' | 'custom';
export type NetworkType = 'mainnet' | 'devnet';

export interface RPCEndpoint {
  id: string;
  provider: RPCProvider;
  name: string;
  url: string;
  network: NetworkType;
  isCustom: boolean;
  ping?: number; // latency in ms
  lastChecked?: number; // timestamp
  isHealthy?: boolean;
  logo?: string;
}

// RPC URLs from environment (hidden from client)
const RPC_URLS = {
  helius: {
    mainnet: process.env.NEXT_PUBLIC_HELIUS_RPC_MAINNET || 'https://mainnet.helius-rpc.com/?api-key=',
    devnet: process.env.NEXT_PUBLIC_HELIUS_RPC_DEVNET || 'https://devnet.helius-rpc.com/?api-key=',
  },
  quicknode: {
    mainnet: process.env.NEXT_PUBLIC_QUICKNODE_RPC_MAINNET || 'https://api.mainnet-beta.solana.com',
  },
  public: {
    mainnet: 'https://api.mainnet-beta.solana.com',
    devnet: 'https://api.devnet.solana.com',
  },
};

// Default RPC configurations
export const DEFAULT_RPC_ENDPOINTS: Omit<RPCEndpoint, 'ping' | 'lastChecked' | 'isHealthy'>[] = [
  // Helius (Sponsor) - Mainnet & Devnet
  {
    id: 'helius-mainnet',
    provider: 'helius',
    name: 'Helius',
    url: RPC_URLS.helius.mainnet,
    network: 'mainnet',
    isCustom: false,
    logo: '/rpc/helius.svg',
  },
  {
    id: 'helius-devnet',
    provider: 'helius',
    name: 'Helius',
    url: RPC_URLS.helius.devnet,
    network: 'devnet',
    isCustom: false,
    logo: '/rpc/helius.svg',
  },
  // QuickNode (Sponsor) - Mainnet only
  {
    id: 'quicknode-mainnet',
    provider: 'quicknode',
    name: 'QuickNode',
    url: RPC_URLS.quicknode.mainnet,
    network: 'mainnet',
    isCustom: false,
    logo: '/rpc/quicknode.svg',
  },
  // Public Solana RPCs (Fallback)
  {
    id: 'public-mainnet',
    provider: 'public',
    name: 'Solana Public',
    url: RPC_URLS.public.mainnet,
    network: 'mainnet',
    isCustom: false,
    logo: '/rpc/solana.svg',
  },
  {
    id: 'public-devnet',
    provider: 'public',
    name: 'Solana Public',
    url: RPC_URLS.public.devnet,
    network: 'devnet',
    isCustom: false,
    logo: '/rpc/solana.svg',
  },
];

// Selection strategies
export type RPCSelectionStrategy = 'auto' | 'manual' | 'round-robin';

export interface RPCSlice {
  // State
  endpoints: RPCEndpoint[];
  activeEndpointId: string | null;
  selectionStrategy: RPCSelectionStrategy;
  customEndpoints: RPCEndpoint[];
  apiKeys: {
    helius?: string;
    quicknode?: string;
  };
  isTestingPings: boolean;
  lastPingTest: number | null;

  // Computed (call these as functions)
  getActiveEndpoint: () => RPCEndpoint | null;
  getEndpointsForNetwork: (network: NetworkType) => RPCEndpoint[];
  getBestEndpoint: (network: NetworkType) => RPCEndpoint | null;

  // Actions
  setActiveEndpoint: (endpointId: string) => void;
  setSelectionStrategy: (strategy: RPCSelectionStrategy) => void;
  setApiKey: (provider: RPCProvider, key: string) => void;
  addCustomEndpoint: (endpoint: Omit<RPCEndpoint, 'id' | 'isCustom'>) => void;
  removeCustomEndpoint: (endpointId: string) => void;
  updateEndpointPing: (endpointId: string, ping: number, isHealthy: boolean) => void;
  testAllPings: () => Promise<void>;
  selectBestEndpoint: (network: NetworkType) => void;
  rotateEndpoint: (network: NetworkType) => void;
  resetToDefaults: () => void;
}

// Helper to generate endpoint URL with API key
const getEndpointUrl = (endpoint: RPCEndpoint, apiKeys: RPCSlice['apiKeys']): string => {
  if (endpoint.isCustom || endpoint.provider === 'public') return endpoint.url;

  const key = apiKeys[endpoint.provider as keyof typeof apiKeys];
  if (!key) return endpoint.url;

  // Append API key based on provider format
  if (endpoint.provider === 'helius') {
    return `${endpoint.url}${key}`;
  }
  // QuickNode already has the key in the URL, but allow override
  // Custom endpoints just use as-is

  return endpoint.url;
};

// Ping test function
const testEndpointPing = async (url: string): Promise<{ ping: number; isHealthy: boolean }> => {
  const start = performance.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getHealth',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const ping = Math.round(performance.now() - start);

    if (!response.ok) {
      return { ping: 9999, isHealthy: false };
    }

    const data = await response.json();
    const isHealthy = data.result === 'ok' || !data.error;

    return { ping, isHealthy };
  } catch {
    return { ping: 9999, isHealthy: false };
  }
};

export const createRPCSlice: StateCreator<RPCSlice, [], [], RPCSlice> = (set, get) => ({
  // Initial state
  endpoints: DEFAULT_RPC_ENDPOINTS.map((e) => ({
    ...e,
    ping: undefined,
    lastChecked: undefined,
    isHealthy: undefined,
  })),
  activeEndpointId: null,
  selectionStrategy: 'auto',
  customEndpoints: [],
  apiKeys: {},
  isTestingPings: false,
  lastPingTest: null,

  // Computed
  getActiveEndpoint: () => {
    const state = get();
    if (!state.activeEndpointId) return null;
    return (
      state.endpoints.find((e) => e.id === state.activeEndpointId) ||
      state.customEndpoints.find((e) => e.id === state.activeEndpointId) ||
      null
    );
  },

  getEndpointsForNetwork: (network: NetworkType) => {
    const state = get();
    const allEndpoints = [...state.endpoints, ...state.customEndpoints];
    return allEndpoints.filter((e) => e.network === network);
  },

  getBestEndpoint: (network: NetworkType) => {
    const endpoints = get().getEndpointsForNetwork(network);
    const healthyEndpoints = endpoints.filter((e) => e.isHealthy !== false && e.ping !== undefined);

    if (healthyEndpoints.length === 0) {
      // Return first endpoint if no ping data
      return endpoints[0] || null;
    }

    // Sort by ping (lowest first)
    healthyEndpoints.sort((a, b) => (a.ping || 9999) - (b.ping || 9999));
    return healthyEndpoints[0];
  },

  // Actions
  setActiveEndpoint: (endpointId: string) => {
    set({ activeEndpointId: endpointId });
  },

  setSelectionStrategy: (strategy: RPCSelectionStrategy) => {
    set({ selectionStrategy: strategy });
  },

  setApiKey: (provider: RPCProvider, key: string) => {
    set((state) => ({
      apiKeys: {
        ...state.apiKeys,
        [provider]: key,
      },
    }));
  },

  addCustomEndpoint: (endpoint) => {
    const id = `custom-${Date.now()}`;
    const newEndpoint: RPCEndpoint = {
      ...endpoint,
      id,
      isCustom: true,
      provider: 'custom',
    };

    set((state) => ({
      customEndpoints: [...state.customEndpoints, newEndpoint],
    }));

    return id;
  },

  removeCustomEndpoint: (endpointId: string) => {
    set((state) => ({
      customEndpoints: state.customEndpoints.filter((e) => e.id !== endpointId),
      // If active endpoint was removed, clear it
      activeEndpointId: state.activeEndpointId === endpointId ? null : state.activeEndpointId,
    }));
  },

  updateEndpointPing: (endpointId: string, ping: number, isHealthy: boolean) => {
    set((state) => {
      const updateEndpoint = (endpoints: RPCEndpoint[]) =>
        endpoints.map((e) =>
          e.id === endpointId
            ? { ...e, ping, isHealthy, lastChecked: Date.now() }
            : e
        );

      return {
        endpoints: updateEndpoint(state.endpoints),
        customEndpoints: updateEndpoint(state.customEndpoints),
      };
    });
  },

  testAllPings: async () => {
    const state = get();
    if (state.isTestingPings) return;

    set({ isTestingPings: true });

    const allEndpoints = [...state.endpoints, ...state.customEndpoints];

    // Test all endpoints in parallel
    const results = await Promise.all(
      allEndpoints.map(async (endpoint) => {
        const url = getEndpointUrl(endpoint, state.apiKeys);
        const result = await testEndpointPing(url);
        return { endpointId: endpoint.id, ...result };
      })
    );

    // Update all pings
    results.forEach(({ endpointId, ping, isHealthy }) => {
      get().updateEndpointPing(endpointId, ping, isHealthy);
    });

    set({
      isTestingPings: false,
      lastPingTest: Date.now(),
    });
  },

  selectBestEndpoint: (network: NetworkType) => {
    const best = get().getBestEndpoint(network);
    if (best) {
      set({ activeEndpointId: best.id });
    }
  },

  rotateEndpoint: (network: NetworkType) => {
    const state = get();
    const endpoints = state.getEndpointsForNetwork(network);
    const healthyEndpoints = endpoints.filter((e) => e.isHealthy !== false);

    if (healthyEndpoints.length === 0) return;

    const currentIndex = healthyEndpoints.findIndex((e) => e.id === state.activeEndpointId);
    const nextIndex = (currentIndex + 1) % healthyEndpoints.length;

    set({ activeEndpointId: healthyEndpoints[nextIndex].id });
  },

  resetToDefaults: () => {
    set({
      endpoints: DEFAULT_RPC_ENDPOINTS.map((e) => ({
        ...e,
        ping: undefined,
        lastChecked: undefined,
        isHealthy: undefined,
      })),
      activeEndpointId: null,
      customEndpoints: [],
      apiKeys: {},
      selectionStrategy: 'auto',
    });
  },
});
