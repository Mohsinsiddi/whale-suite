/**
 * usePNP Hook
 * React hook for PNP Exchange integration
 * Bounty: $2,500
 */

"use client";

import { useState, useCallback } from "react";
import { useWallets } from "@privy-io/react-auth";
import { pnpService, PNPMarket, UserPosition, TradeParams, TradeResult } from "@/lib/privacy-sdks/pnp";

interface UsePNPReturn {
  // State
  markets: PNPMarket[];
  loading: boolean;
  error: string | null;
  selectedMarket: PNPMarket | null;
  userPosition: UserPosition | null;
  trading: boolean;

  // Actions
  fetchMarkets: () => Promise<void>;
  fetchMarket: (address: string) => Promise<PNPMarket | null>;
  selectMarket: (market: PNPMarket | null) => void;
  buyTokens: (params: TradeParams) => Promise<TradeResult>;
  sellTokens: (params: { marketPubkey: string; side: "yes" | "no"; amount: number }) => Promise<TradeResult>;
  fetchUserPosition: (marketAddress: string) => Promise<void>;
  redeemPosition: (marketAddress: string) => Promise<{ signature: string; success: boolean; error?: string }>;
  refreshPrices: (marketAddress: string) => Promise<void>;

  // Utilities
  formatVolume: (volume: number) => string;
  formatLiquidity: (liquidity: number) => string;
  isMarketActive: (market: PNPMarket) => boolean;
  getMarketStatus: (market: PNPMarket) => "active" | "ended" | "resolved";
}

export function usePNP(): UsePNPReturn {
  const { wallets } = useWallets();
  // Embedded wallet for future trading integration
  const _embeddedWallet = wallets?.find((w) => w.walletClientType === "privy");
  void _embeddedWallet; // Suppress unused variable warning

  // State
  const [markets, setMarkets] = useState<PNPMarket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<PNPMarket | null>(null);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [trading, setTrading] = useState(false);

  /**
   * Fetch all markets
   */
  const fetchMarkets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchedMarkets = await pnpService.fetchMarkets();
      setMarkets(fetchedMarkets);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to fetch markets";
      setError(message);
      console.error("fetchMarkets error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch a single market
   */
  const fetchMarket = useCallback(async (address: string): Promise<PNPMarket | null> => {
    try {
      const market = await pnpService.fetchMarket(address);
      if (market) {
        // Update in list if exists
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
      const position = await pnpService.getUserPositions(marketAddress);
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

      // Refresh market data after trade
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
      const result = await pnpService.sellTokens(params);

      if (!result.success) {
        setError(result.error || "Trade failed");
      }

      // Refresh market data after trade
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

      // Refresh position after redeem
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

    // Actions
    fetchMarkets,
    fetchMarket,
    selectMarket,
    buyTokens,
    sellTokens,
    fetchUserPosition,
    redeemPosition,
    refreshPrices,

    // Utilities
    formatVolume,
    formatLiquidity,
    isMarketActive,
    getMarketStatus,
  };
}
