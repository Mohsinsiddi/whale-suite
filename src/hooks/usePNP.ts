/**
 * usePNP Hook
 * React hook for PNP Exchange integration
 * Supports pagination, category filtering, and market stats
 * Bounty: $2,500
 */

"use client";

import { useState, useCallback } from "react";
import { useWallets } from "@privy-io/react-auth";
import { pnpService, PNPMarket, UserPosition, TradeParams, TradeResult } from "@/lib/privacy-sdks/pnp";

export type MarketCategory = "all" | "v2" | "p2p";

interface MarketStats {
  v2Count: number;
  p2pCount: number;
  totalCount: number;
  loadedCount: number;
  hasMore: boolean;
}

interface UsePNPReturn {
  // State
  markets: PNPMarket[];
  loading: boolean;
  error: string | null;
  selectedMarket: PNPMarket | null;
  userPosition: UserPosition | null;
  trading: boolean;
  stats: MarketStats;
  category: MarketCategory;

  // Actions
  fetchMarkets: (options?: { limit?: number; reset?: boolean }) => Promise<void>;
  loadMore: (limit?: number) => Promise<void>;
  setCategory: (category: MarketCategory) => void;
  fetchMarket: (address: string) => Promise<PNPMarket | null>;
  selectMarket: (market: PNPMarket | null) => void;
  buyTokens: (params: TradeParams) => Promise<TradeResult>;
  sellTokens: (params: { marketPubkey: string; side: "yes" | "no"; amount: number }) => Promise<TradeResult>;
  fetchUserPosition: (marketAddress: string) => Promise<void>;
  redeemPosition: (marketAddress: string) => Promise<{ signature: string; success: boolean; error?: string }>;
  refreshPrices: (marketAddress: string) => Promise<void>;
  refreshStats: () => Promise<void>;

  // Utilities
  formatVolume: (volume: number) => string;
  formatLiquidity: (liquidity: number) => string;
  isMarketActive: (market: PNPMarket) => boolean;
  getMarketStatus: (market: PNPMarket) => "active" | "ended" | "resolved";
}

const DEFAULT_LIMIT = 20;

export function usePNP(): UsePNPReturn {
  const { wallets } = useWallets();
  const _embeddedWallet = wallets?.find((w) => w.walletClientType === "privy");
  void _embeddedWallet;

  // State
  const [markets, setMarkets] = useState<PNPMarket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<PNPMarket | null>(null);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [trading, setTrading] = useState(false);
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

  /**
   * Fetch markets with category and pagination
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

      let fetchedMarkets: PNPMarket[] = [];

      // Fetch based on category
      if (category === "v2") {
        fetchedMarkets = await pnpService.fetchV2Markets(limit, currentOffset);
      } else if (category === "p2p") {
        fetchedMarkets = await pnpService.fetchP2PMarkets(limit, currentOffset);
      } else {
        fetchedMarkets = await pnpService.fetchAllMarkets(limit, currentOffset);
      }

      // Update markets
      if (shouldReset) {
        setMarkets(fetchedMarkets);
      } else {
        setMarkets((prev) => [...prev, ...fetchedMarkets]);
      }

      // Update stats
      const counts = await pnpService.getMarketCounts();
      const totalForCategory = category === "v2" ? counts.v2 : category === "p2p" ? counts.p2p : counts.total;
      const loadedCount = shouldReset ? fetchedMarkets.length : markets.length + fetchedMarkets.length;

      setStats({
        v2Count: counts.v2,
        p2pCount: counts.p2p,
        totalCount: counts.total,
        loadedCount,
        hasMore: loadedCount < totalForCategory,
      });

      setOffset(currentOffset + fetchedMarkets.length);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to fetch markets";
      setError(message);
      console.error("fetchMarkets error:", e);
    } finally {
      setLoading(false);
    }
  }, [category, offset, markets.length]);

  /**
   * Load more markets (pagination)
   */
  const loadMore = useCallback(async (limit: number = DEFAULT_LIMIT) => {
    if (loading || !stats.hasMore) return;
    await fetchMarkets({ limit, reset: false });
  }, [fetchMarkets, loading, stats.hasMore]);

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
   * Buy tokens
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
   * Redeem winning position
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

  return {
    // State
    markets,
    loading,
    error,
    selectedMarket,
    userPosition,
    trading,
    stats,
    category,

    // Actions
    fetchMarkets,
    loadMore,
    setCategory: handleSetCategory,
    fetchMarket,
    selectMarket,
    buyTokens,
    sellTokens,
    fetchUserPosition,
    redeemPosition,
    refreshPrices,
    refreshStats,

    // Utilities
    formatVolume,
    formatLiquidity,
    isMarketActive,
    getMarketStatus,
  };
}
