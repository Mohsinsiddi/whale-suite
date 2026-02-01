/**
 * usePNP Hook
 * React hook for PNP Exchange integration
 * Supports pagination, category filtering, and market stats
 * Uses ShadowWire pattern: signTransaction → sendRawTransaction
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { useWallets, useSignTransaction } from "@privy-io/react-auth/solana";
import { Transaction, VersionedTransaction } from "@solana/web3.js";
import { pnpService, PNPMarket, UserPosition, TradeParams, TradeResult, TransactionSigner } from "@/lib/privacy-sdks/pnp";

export type MarketCategory = "all" | "v2" | "p2p";

// Demo markets for when API returns empty
const DEMO_MARKETS: PNPMarket[] = [
  {
    id: "demo-1",
    publicKey: "Demo1111111111111111111111111111111111111111",
    question: "Will SOL reach $300 by end of Q1 2026?",
    marketType: "v2",
    marketSource: "general",
    yesPrice: 0.65,
    noPrice: 0.35,
    yesMultiplier: 1.54,
    noMultiplier: 2.86,
    yesTokenMint: "Demo1111111111111111111111111111111111111111",
    noTokenMint: "Demo2222222222222222222222222222222222222222",
    collateralToken: "USDC",
    marketReserves: 125000,
    volume: 125000,
    liquidity: 125000,
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    resolved: false,
    resolvable: false,
    winningToken: null,
    creator: "Demo3333333333333333333333333333333333333333",
  },
  {
    id: "demo-2",
    publicKey: "Demo4444444444444444444444444444444444444444",
    question: "Will Bitcoin hit $150K in 2026?",
    marketType: "v2",
    marketSource: "general",
    yesPrice: 0.45,
    noPrice: 0.55,
    yesMultiplier: 2.22,
    noMultiplier: 1.82,
    yesTokenMint: "Demo4444444444444444444444444444444444444444",
    noTokenMint: "Demo5555555555555555555555555555555555555555",
    collateralToken: "USDC",
    marketReserves: 89000,
    volume: 89000,
    liquidity: 89000,
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    resolved: false,
    resolvable: false,
    winningToken: null,
    creator: "Demo6666666666666666666666666666666666666666",
  },
  {
    id: "demo-3",
    publicKey: "Demo7777777777777777777777777777777777777777",
    question: "Will Ethereum flip Bitcoin market cap by 2027?",
    marketType: "v2",
    marketSource: "general",
    yesPrice: 0.22,
    noPrice: 0.78,
    yesMultiplier: 4.55,
    noMultiplier: 1.28,
    yesTokenMint: "Demo7777777777777777777777777777777777777777",
    noTokenMint: "Demo8888888888888888888888888888888888888888",
    collateralToken: "USDC",
    marketReserves: 56000,
    volume: 56000,
    liquidity: 56000,
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    resolved: false,
    resolvable: false,
    winningToken: null,
    creator: "Demo9999999999999999999999999999999999999999",
  },
];

interface MarketStats {
  v2Count: number;
  p2pCount: number;
  totalCount: number;
  loadedCount: number;
  hasMore: boolean;
}

export interface CreateMarketParams {
  question: string;
  initialLiquidity: number; // in USDC
  endTime: Date;
  marketType: "v2" | "p2p";
  side?: "yes" | "no"; // For P2P markets
}

export interface CreateMarketResult {
  signature: string;
  market: string;
  success: boolean;
  error?: string;
}

interface UsePNPReturn {
  // State
  markets: PNPMarket[];
  allMarkets: PNPMarket[]; // Full cache of all markets
  loading: boolean;
  error: string | null;
  selectedMarket: PNPMarket | null;
  userPosition: UserPosition | null;
  trading: boolean;
  creating: boolean;
  stats: MarketStats;
  category: MarketCategory;
  walletConnected: boolean;
  walletAddress: string | null;
  sdkReady: boolean;

  // Actions
  fetchMarkets: (options?: { limit?: number; reset?: boolean }) => Promise<void>;
  fetchMyMarkets: () => Promise<PNPMarket[]>; // Fetch markets by connected wallet
  loadMore: (limit?: number) => Promise<void>;
  setCategory: (category: MarketCategory) => void;
  fetchMarket: (address: string) => Promise<PNPMarket | null>;
  selectMarket: (market: PNPMarket | null) => void;
  buyTokens: (params: TradeParams) => Promise<TradeResult>;
  buyTokensV2: (marketAddress: string, side: "yes" | "no", amountUsdc: number) => Promise<TradeResult>;
  buyTokensP2P: (marketAddress: string, side: "yes" | "no", amountUsdc: number) => Promise<TradeResult>;
  sellTokensV2: (marketAddress: string, side: "yes" | "no", tokenAmount: number) => Promise<TradeResult>;
  sellTokens: (params: { marketPubkey: string; side: "yes" | "no"; amount: number }) => Promise<TradeResult>;
  getMinimumTradeAmount: (marketLiquidity: number) => number;
  fetchUserPosition: (marketAddress: string) => Promise<void>;
  redeemPosition: (marketAddress: string) => Promise<{ signature: string; success: boolean; error?: string }>;
  redeemPositionV2: (marketAddress: string) => Promise<{ signature: string; success: boolean; error?: string }>;
  redeemPositionP2P: (marketAddress: string) => Promise<{ signature: string; success: boolean; error?: string }>;
  refreshPrices: (marketAddress: string) => Promise<void>;
  refreshStats: () => Promise<void>;
  createMarket: (params: CreateMarketParams) => Promise<CreateMarketResult>;

  // Utilities
  formatVolume: (volume: number) => string;
  formatLiquidity: (liquidity: number) => string;
  isMarketActive: (market: PNPMarket) => boolean;
  getMarketStatus: (market: PNPMarket) => "active" | "ended" | "resolved";
  getMarketTokenBalances: (marketAddress: string) => Promise<{ yesBalance: number; noBalance: number; yesTokenMint: string; noTokenMint: string }>;
}

const DEFAULT_LIMIT = 20;

export function usePNP(): UsePNPReturn {
  const { wallets } = useWallets();
  const { signTransaction: privySignTransaction } = useSignTransaction();

  // Get first available Solana wallet
  const solanaWallet = wallets?.[0];

  // Get wallet address
  const walletAddress = useMemo(() => {
    return solanaWallet?.address || null;
  }, [solanaWallet]);

  const walletConnected = useMemo(() => {
    return !!solanaWallet && !!walletAddress;
  }, [solanaWallet, walletAddress]);

  /**
   * Sign transaction using Privy (ShadowWire pattern)
   * This is passed to pnpService direct methods
   */
  const signTransaction: TransactionSigner = useCallback(
    async (tx: Transaction | VersionedTransaction): Promise<Transaction | VersionedTransaction> => {
      if (!solanaWallet) {
        throw new Error("Wallet not connected");
      }

      console.log("[PNP] Signing transaction with Privy...");

      // Serialize the transaction
      const serialized = tx.serialize({ requireAllSignatures: false });

      // Sign with Privy
      const result = await privySignTransaction({
        transaction: serialized,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        wallet: solanaWallet as any,
      });

      console.log("[PNP] Privy signing successful");

      // Deserialize back
      try {
        return VersionedTransaction.deserialize(result.signedTransaction);
      } catch {
        return Transaction.from(result.signedTransaction);
      }
    },
    [solanaWallet, privySignTransaction]
  );

  // SDK ready when wallet is connected
  const sdkReady = useMemo(() => {
    return !!walletAddress && !!solanaWallet;
  }, [walletAddress, solanaWallet]);

  // Placeholder for backward compatibility (direct methods don't need this)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _pnpClient = walletAddress ? { connected: true } : null;

  // State
  const [markets, setMarkets] = useState<PNPMarket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<PNPMarket | null>(null);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [trading, setTrading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [category, setCategory] = useState<MarketCategory>("all");
  const [offset, setOffset] = useState(0);
  const [stats, setStats] = useState<MarketStats>({
    v2Count: 0,
    p2pCount: 0,
    totalCount: 0,
    loadedCount: 0,
    hasMore: true,
  });

  /**
   * Refresh market stats/counts
   */
  const refreshStats = useCallback(async () => {
    try {
      const counts = await pnpService.getMarketCounts();
      setStats((prev) => ({
        ...prev,
        v2Count: counts.v2,
        p2pCount: counts.p2p,
        totalCount: counts.total,
      }));
    } catch (e) {
      console.error("Failed to refresh stats:", e);
    }
  }, []);

  // Cache for all markets (to avoid refetching)
  const [allMarketsCache, setAllMarketsCache] = useState<PNPMarket[]>([]);

  /**
   * Fetch ALL markets from SDK (recommended - gets creator info)
   * Then apply client-side filtering for category/pagination
   */
  const fetchMarkets = useCallback(async (options?: { limit?: number; reset?: boolean }) => {
    const limit = options?.limit || DEFAULT_LIMIT;
    const shouldReset = options?.reset !== false;

    setLoading(true);
    setError(null);

    try {
      // Reset offset if needed
      const currentOffset = shouldReset ? 0 : offset;
      if (shouldReset) {
        setOffset(0);
      }

      let allFetched: PNPMarket[];

      // Use cache if available and not resetting
      if (allMarketsCache.length > 0 && !shouldReset) {
        allFetched = allMarketsCache;
      } else {
        // Fetch ALL markets from SDK (includes creator info)
        console.log("[usePNP] Fetching all markets from SDK...");
        allFetched = await pnpService.fetchAllMarketsFromSDK();

        // Use demo markets if API returns empty
        if (allFetched.length === 0) {
          console.log("[usePNP] No markets from API, using demo markets");
          allFetched = DEMO_MARKETS;
        }

        setAllMarketsCache(allFetched);
        console.log(`[usePNP] Cached ${allFetched.length} markets`);
      }

      // Filter by category
      let filteredByCategory = allFetched;
      if (category === "v2") {
        filteredByCategory = allFetched.filter(m => m.marketType === "v2");
      } else if (category === "p2p") {
        filteredByCategory = allFetched.filter(m => m.marketType === "p2p");
      }

      // Apply pagination
      const paginatedMarkets = filteredByCategory.slice(currentOffset, currentOffset + limit);

      // Update markets
      if (shouldReset) {
        setMarkets(paginatedMarkets);
      } else {
        setMarkets((prev) => [...prev, ...paginatedMarkets]);
      }

      // Update stats
      const v2Count = allFetched.filter(m => m.marketType === "v2").length;
      const p2pCount = allFetched.filter(m => m.marketType === "p2p").length;
      const totalForCategory = category === "v2" ? v2Count : category === "p2p" ? p2pCount : allFetched.length;
      const loadedCount = shouldReset ? paginatedMarkets.length : markets.length + paginatedMarkets.length;

      setStats({
        v2Count,
        p2pCount,
        totalCount: allFetched.length,
        loadedCount,
        hasMore: loadedCount < totalForCategory,
      });

      setOffset(currentOffset + paginatedMarkets.length);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to fetch markets";
      setError(message);
      console.error("fetchMarkets error:", e);
    } finally {
      setLoading(false);
    }
  }, [category, offset, markets.length, allMarketsCache]);

  /**
   * Load more markets (pagination)
   */
  const loadMore = useCallback(async (limit: number = DEFAULT_LIMIT) => {
    if (loading || !stats.hasMore) return;
    await fetchMarkets({ limit, reset: false });
  }, [fetchMarkets, loading, stats.hasMore]);

  /**
   * Fetch markets created by the connected wallet
   * Uses cached data if available, otherwise fetches from SDK
   */
  const fetchMyMarkets = useCallback(async (): Promise<PNPMarket[]> => {
    if (!walletAddress) return [];

    try {
      // Use cache if available
      if (allMarketsCache.length > 0) {
        return allMarketsCache.filter(m => m.creator === walletAddress);
      }

      // Otherwise fetch from SDK
      return await pnpService.fetchMarketsByCreator(walletAddress);
    } catch (e) {
      console.error("fetchMyMarkets error:", e);
      return [];
    }
  }, [walletAddress, allMarketsCache]);

  /**
   * Change category and reset markets
   */
  const handleSetCategory = useCallback((newCategory: MarketCategory) => {
    if (newCategory === category) return;
    setCategory(newCategory);
    setMarkets([]);
    setOffset(0);
    setStats((prev) => ({ ...prev, loadedCount: 0, hasMore: true }));
  }, [category]);

  /**
   * Fetch a single market
   */
  const fetchMarket = useCallback(async (address: string): Promise<PNPMarket | null> => {
    try {
      const market = await pnpService.fetchMarket(address);
      if (market) {
        setMarkets((prev) =>
          prev.map((m) => (m.publicKey === address ? market : m))
        );
      }
      return market;
    } catch (e) {
      console.error("fetchMarket error:", e);
      return null;
    }
  }, []);

  /**
   * Select a market for trading
   */
  const selectMarket = useCallback((market: PNPMarket | null) => {
    setSelectedMarket(market);
    setUserPosition(null);
  }, []);

  /**
   * Fetch user's position in a market
   */
  const fetchUserPosition = useCallback(async (marketAddress: string) => {
    try {
      const positions = await pnpService.getUserPositions(marketAddress);
      const position = positions.find((p) => p.marketId === marketAddress) || null;
      setUserPosition(position);
    } catch (e) {
      console.error("fetchUserPosition error:", e);
    }
  }, []);

  /**
   * Buy tokens (legacy - uses service)
   */
  const buyTokens = useCallback(async (params: TradeParams): Promise<TradeResult> => {
    setTrading(true);
    setError(null);

    try {
      const result = await pnpService.buyTokens(params);

      if (!result.success) {
        setError(result.error || "Trade failed");
      }

      if (result.success) {
        await fetchMarket(params.marketPubkey);
        await fetchUserPosition(params.marketPubkey);
      }

      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Trade failed";
      setError(message);
      return { signature: "", tokensReceived: 0, success: false, error: message };
    } finally {
      setTrading(false);
    }
  }, [fetchMarket, fetchUserPosition]);

  /**
   * Buy tokens on V2 AMM market
   * Uses direct signing pattern (ShadowWire style) - sign → sendRawTransaction
   */
  const buyTokensV2 = useCallback(async (
    marketAddress: string,
    side: "yes" | "no",
    amountUsdc: number
  ): Promise<TradeResult> => {
    if (!walletAddress) {
      return { signature: "", tokensReceived: 0, success: false, error: "Wallet not connected" };
    }

    setTrading(true);
    setError(null);

    try {
      // Use direct service method with signTransaction
      const result = await pnpService.buyTokensDirect(
        marketAddress,
        side,
        amountUsdc,
        walletAddress,
        signTransaction
      );

      if (result.success) {
        await fetchMarket(marketAddress);
        await fetchUserPosition(marketAddress);
      } else {
        setError(result.error || "Trade failed");
      }

      return result;
    } catch (e) {
      let message = e instanceof Error ? e.message : "Trade failed";
      if (message.includes("403") || message.includes("Access forbidden")) {
        message += " (Try changing the RPC URL)";
      } else if (message.includes("0x1778") || message.includes("Market already resolved") || message.includes("MarketResolved")) {
        message += " (This market has ended or is invalid)";
      }
      setError(message);
      return { signature: "", tokensReceived: 0, success: false, error: message };
    } finally {
      setTrading(false);
    }
  }, [walletAddress, signTransaction, fetchMarket, fetchUserPosition]);

  /**
   * Buy tokens on P2P market
   * Uses same direct signing pattern as V2
   */
  const buyTokensP2P = useCallback(async (
    marketAddress: string,
    side: "yes" | "no",
    amountUsdc: number
  ): Promise<TradeResult> => {
    // P2P uses same method as V2
    return buyTokensV2(marketAddress, side, amountUsdc);
  }, [buyTokensV2]);

  /**
   * Sell tokens on V2 AMM market
   * Burns decision tokens and receives USDC back
   */
  const sellTokensV2 = useCallback(async (
    marketAddress: string,
    side: "yes" | "no",
    tokenAmount: number
  ): Promise<TradeResult> => {
    if (!walletAddress) {
      return { signature: "", tokensReceived: 0, success: false, error: "Wallet not connected" };
    }

    setTrading(true);
    setError(null);

    try {
      const result = await pnpService.sellTokensDirect(
        marketAddress,
        side,
        tokenAmount,
        walletAddress,
        signTransaction
      );

      if (result.success) {
        await fetchMarket(marketAddress);
        await fetchUserPosition(marketAddress);
      } else {
        setError(result.error || "Sell failed");
      }

      return result;
    } catch (e) {
      let message = e instanceof Error ? e.message : "Sell failed";
      if (message.includes("403") || message.includes("Access forbidden")) {
        message += " (Try changing the RPC URL)";
      }
      setError(message);
      return { signature: "", tokensReceived: 0, success: false, error: message };
    } finally {
      setTrading(false);
    }
  }, [walletAddress, signTransaction, fetchMarket, fetchUserPosition]);

  /**
   * Get minimum trade amount for a market
   */
  const getMinimumTradeAmount = useCallback((marketLiquidity: number): number => {
    return pnpService.getMinimumTradeAmount(marketLiquidity);
  }, []);

  /**
   * Sell tokens
   */
  const sellTokens = useCallback(async (params: {
    marketPubkey: string;
    side: "yes" | "no";
    amount: number;
  }): Promise<TradeResult> => {
    setTrading(true);
    setError(null);

    try {
      const result = await pnpService.sellTokens({
        ...params,
        tokenAmount: params.amount,
      });

      if (!result.success) {
        setError(result.error || "Trade failed");
      }

      if (result.success) {
        await fetchMarket(params.marketPubkey);
        await fetchUserPosition(params.marketPubkey);
      }

      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Trade failed";
      setError(message);
      return { signature: "", tokensReceived: 0, success: false, error: message };
    } finally {
      setTrading(false);
    }
  }, [fetchMarket, fetchUserPosition]);

  /**
   * Redeem winning position (legacy - uses service)
   */
  const redeemPosition = useCallback(async (marketAddress: string) => {
    setTrading(true);
    setError(null);

    try {
      const result = await pnpService.redeemPosition(marketAddress);

      if (!result.success) {
        setError(result.error || "Redeem failed");
      }

      if (result.success) {
        await fetchUserPosition(marketAddress);
      }

      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Redeem failed";
      setError(message);
      return { signature: "", success: false, error: message };
    } finally {
      setTrading(false);
    }
  }, [fetchUserPosition]);

  /**
   * Redeem V2 position
   * Uses direct signing pattern (ShadowWire style) - sign → sendRawTransaction
   */
  const redeemPositionV2 = useCallback(async (marketAddress: string) => {
    if (!walletAddress) {
      return { signature: "", success: false, error: "Wallet not connected" };
    }

    setTrading(true);
    setError(null);

    try {
      // Use direct service method with signTransaction
      const result = await pnpService.redeemPositionDirect(
        marketAddress,
        walletAddress,
        signTransaction
      );

      if (result.success) {
        await fetchUserPosition(marketAddress);
      } else {
        setError(result.error || "Redeem failed");
      }

      return result;
    } catch (e) {
      let message = e instanceof Error ? e.message : "Redeem failed";
      if (message.includes("403") || message.includes("Access forbidden")) {
        message += " (Try changing the RPC URL)";
      }
      setError(message);
      return { signature: "", success: false, error: message };
    } finally {
      setTrading(false);
    }
  }, [walletAddress, signTransaction, fetchUserPosition]);

  /**
   * Redeem P2P position
   * Uses same direct signing pattern as V2
   */
  const redeemPositionP2P = useCallback(async (marketAddress: string) => {
    // P2P uses same method as V2
    return redeemPositionV2(marketAddress);
  }, [redeemPositionV2]);

  /**
   * Create a new prediction market
   * Uses direct signing pattern (ShadowWire style) - sign → sendRawTransaction
   */
  const createMarket = useCallback(async (params: CreateMarketParams): Promise<CreateMarketResult> => {
    if (!walletAddress) {
      return { signature: "", market: "", success: false, error: "Wallet not connected" };
    }

    setCreating(true);
    setError(null);

    try {
      // Convert to base units (USDC has 6 decimals)
      const liquidityBaseUnits = BigInt(Math.floor(params.initialLiquidity * 1e6));
      // Convert end time to unix timestamp (seconds)
      const endTimeUnix = BigInt(Math.floor(params.endTime.getTime() / 1000));

      // Use direct service method with signTransaction (ShadowWire pattern)
      const result = await pnpService.createV2MarketDirect(
        {
          question: params.question,
          initialLiquidity: liquidityBaseUnits,
          endTime: endTimeUnix,
        },
        walletAddress,
        signTransaction
      );

      if (result.success) {
        // Refresh markets list
        await fetchMarkets({ reset: true });
      }

      return result;
    } catch (e) {
      let message = e instanceof Error ? e.message : "Failed to create market";
      if (message.includes("403") || message.includes("Access forbidden")) {
        message += " (Try changing the RPC URL)";
      } else if (message.includes("insufficient")) {
        message = "Insufficient USDC balance for initial liquidity";
      }
      setError(message);
      return { signature: "", market: "", success: false, error: message };
    } finally {
      setCreating(false);
    }
  }, [walletAddress, signTransaction, fetchMarkets]);

  /**
   * Refresh prices for a market
   */
  const refreshPrices = useCallback(async (marketAddress: string) => {
    const prices = await pnpService.getPrices(marketAddress);
    if (prices) {
      setMarkets((prev) =>
        prev.map((m) =>
          m.publicKey === marketAddress
            ? { ...m, yesPrice: prices.yesPrice, noPrice: prices.noPrice }
            : m
        )
      );

      if (selectedMarket?.publicKey === marketAddress) {
        setSelectedMarket((prev) =>
          prev ? { ...prev, yesPrice: prices.yesPrice, noPrice: prices.noPrice } : null
        );
      }
    }
  }, [selectedMarket]);

  // Utility wrappers
  const formatVolume = useCallback((volume: number) => pnpService.formatVolume(volume), []);
  const formatLiquidity = useCallback((liquidity: number) => pnpService.formatLiquidity(liquidity), []);
  const isMarketActive = useCallback((market: PNPMarket) => pnpService.isMarketActive(market), []);
  const getMarketStatus = useCallback((market: PNPMarket) => pnpService.getMarketStatus(market), []);

  /**
   * Get user's YES/NO token balances for a market
   */
  const getMarketTokenBalances = useCallback(
    async (marketAddress: string) => {
      if (!walletAddress) {
        return { yesBalance: 0, noBalance: 0, yesTokenMint: "", noTokenMint: "" };
      }
      return pnpService.getMarketTokenBalances(marketAddress, walletAddress);
    },
    [walletAddress]
  );

  return {
    // State
    markets,
    allMarkets: allMarketsCache,
    loading,
    error,
    selectedMarket,
    userPosition,
    trading,
    creating,
    stats,
    category,
    walletConnected,
    walletAddress,
    sdkReady,

    // Actions
    fetchMarkets,
    fetchMyMarkets,
    loadMore,
    setCategory: handleSetCategory,
    fetchMarket,
    selectMarket,
    buyTokens,
    buyTokensV2,
    buyTokensP2P,
    sellTokensV2,
    sellTokens,
    getMinimumTradeAmount,
    fetchUserPosition,
    redeemPosition,
    redeemPositionV2,
    redeemPositionP2P,
    refreshPrices,
    refreshStats,
    createMarket,

    // Utilities
    formatVolume,
    formatLiquidity,
    isMarketActive,
    getMarketStatus,
    getMarketTokenBalances,
  };
}
