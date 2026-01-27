"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Tabs from "@/components/ui/Tabs";
import Input, { SearchInput } from "@/components/ui/Input";
import Modal, { SuccessModal } from "@/components/ui/Modal";
import { usePNP } from "@/hooks/usePNP";
import { PNPMarket } from "@/lib/privacy-sdks/pnp";

// Loading skeleton component
function MarketSkeleton() {
  return (
    <Card variant="default" padding="md" className="animate-pulse">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-4 w-16 bg-bg-elevated rounded" />
            <div className="h-4 w-12 bg-bg-elevated rounded" />
          </div>
          <div className="h-5 w-3/4 bg-bg-elevated rounded mb-2" />
          <div className="flex items-center gap-4">
            <div className="h-3 w-20 bg-bg-elevated rounded" />
            <div className="h-3 w-20 bg-bg-elevated rounded" />
            <div className="h-3 w-24 bg-bg-elevated rounded" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-20 h-16 bg-bg-elevated rounded-xl" />
          <div className="w-20 h-16 bg-bg-elevated rounded-xl" />
          <div className="w-16 h-8 bg-bg-elevated rounded-lg" />
        </div>
      </div>
    </Card>
  );
}

export default function MarketsPage() {
  const {
    markets,
    loading,
    error,
    fetchMarkets,
    formatVolume,
    formatLiquidity,
    isMarketActive,
    getMarketStatus,
    trading,
  } = usePNP();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMarket, setSelectedMarket] = useState<PNPMarket | null>(null);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [tradeSide, setTradeSide] = useState<"yes" | "no">("yes");
  const [tradeAmount, setTradeAmount] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastTrade, setLastTrade] = useState<{ side: string; amount: string; market: string } | null>(null);

  // Fetch markets on mount
  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMarkets();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchMarkets]);

  const tabs = [
    { id: "all", label: "All Markets" },
    { id: "active", label: "Active" },
    { id: "ended", label: "Ended" },
    { id: "resolved", label: "Resolved" },
  ];

  // Filter markets
  const filteredMarkets = markets.filter((m) => {
    const matchesSearch = m.question.toLowerCase().includes(searchQuery.toLowerCase());
    const status = getMarketStatus(m);

    if (activeTab === "all") return matchesSearch;
    return matchesSearch && status === activeTab;
  });

  // Stats
  const totalVolume = markets.reduce((sum, m) => sum + m.volume, 0);
  const activeMarkets = markets.filter((m) => isMarketActive(m)).length;

  const handleTrade = (market: PNPMarket, side: "yes" | "no") => {
    setSelectedMarket(market);
    setTradeSide(side);
    setTradeAmount("");
    setTradeModalOpen(true);
  };

  const executeTrade = async () => {
    if (!selectedMarket || !tradeAmount) return;

    // TODO: Implement actual trading when wallet is connected
    // For now, show success modal as demo
    setTradeModalOpen(false);
    setLastTrade({
      side: tradeSide.toUpperCase(),
      amount: tradeAmount,
      market: selectedMarket.question.slice(0, 50) + "...",
    });
    setShowSuccess(true);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Prediction Markets</h1>
          <p className="text-sm text-text-secondary">
            Anonymous betting via PNP Exchange
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" size="sm">
            PNP SDK v0.2.8
          </Badge>
          <Badge variant="warning" size="sm">
            Beta Feature
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Volume", value: formatVolume(totalVolume), loading },
          { label: "Active Markets", value: activeMarkets.toString(), loading },
          { label: "Total Markets", value: markets.length.toString(), loading },
          { label: "Status", value: error ? "Error" : "Connected", positive: !error, loading: false },
        ].map((stat, i) => (
          <Card key={i} variant="stat" padding="sm">
            <div className="text-xs text-text-muted mb-1">{stat.label}</div>
            {stat.loading ? (
              <div className="h-6 w-16 bg-bg-elevated rounded animate-pulse" />
            ) : (
              <div
                className={`text-lg font-bold ${
                  stat.positive === false ? "text-error" : stat.positive ? "text-neon-green" : "text-text-primary"
                }`}
              >
                {stat.value}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <Card variant="default" padding="md" className="border-error/30 bg-error/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-sm font-medium text-error">Failed to fetch markets</p>
              <p className="text-xs text-text-secondary">{error}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={fetchMarkets} className="ml-auto">
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} size="sm" />
        <div className="sm:ml-auto w-full sm:w-64">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery("")}
            placeholder="Search markets..."
          />
        </div>
      </div>

      {/* Markets List */}
      <div className="space-y-4">
        {loading && markets.length === 0 ? (
          // Loading skeletons
          <>
            <MarketSkeleton />
            <MarketSkeleton />
            <MarketSkeleton />
          </>
        ) : filteredMarkets.length === 0 ? (
          // Empty state
          <Card variant="default" padding="lg" className="text-center">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">No Markets Found</h3>
            <p className="text-xs text-text-secondary">
              {searchQuery
                ? "Try adjusting your search query"
                : "No prediction markets available at the moment"}
            </p>
          </Card>
        ) : (
          filteredMarkets.map((market) => {
            const status = getMarketStatus(market);
            const isActive = status === "active";

            return (
              <Card
                key={market.publicKey}
                variant="default"
                padding="md"
                className={`hover:border-neon-cyan/40 transition-all ${
                  !isActive ? "opacity-70" : ""
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Question */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {market.volume > 10000 && (
                        <Badge size="xs" variant="warning">
                          🔥 Hot
                        </Badge>
                      )}
                      <Badge
                        size="xs"
                        variant={status === "active" ? "success" : status === "resolved" ? "cyan" : "default"}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                      {market.resolved && market.winningToken && (
                        <Badge size="xs" variant={market.winningToken === "yes" ? "success" : "error"}>
                          {market.winningToken.toUpperCase()} Won
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-text-primary mb-2">{market.question}</h3>
                    <div className="flex items-center gap-4 text-xs text-text-muted flex-wrap">
                      <span>Vol: {formatVolume(market.volume)}</span>
                      <span>Liq: {formatLiquidity(market.liquidity)}</span>
                      <span>Ends: {formatDate(market.endDate)}</span>
                    </div>
                  </div>

                  {/* Prices & Trade */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => isActive && handleTrade(market, "yes")}
                      disabled={!isActive}
                      className={`p-3 rounded-xl bg-neon-green/10 border border-neon-green/30 text-center min-w-[80px] transition-all ${
                        isActive ? "hover:bg-neon-green/20 hover:border-neon-green/50 cursor-pointer" : "cursor-not-allowed"
                      }`}
                    >
                      <div className="text-xs text-neon-green mb-0.5">YES</div>
                      <div className="text-lg font-bold text-neon-green">
                        {(market.yesPrice * 100).toFixed(0)}¢
                      </div>
                    </button>
                    <button
                      onClick={() => isActive && handleTrade(market, "no")}
                      disabled={!isActive}
                      className={`p-3 rounded-xl bg-error/10 border border-error/30 text-center min-w-[80px] transition-all ${
                        isActive ? "hover:bg-error/20 hover:border-error/50 cursor-pointer" : "cursor-not-allowed"
                      }`}
                    >
                      <div className="text-xs text-error mb-0.5">NO</div>
                      <div className="text-lg font-bold text-error">
                        {(market.noPrice * 100).toFixed(0)}¢
                      </div>
                    </button>
                    <Button
                      size="sm"
                      disabled={!isActive}
                      onClick={() => handleTrade(market, "yes")}
                    >
                      Trade
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Privacy Notice */}
      <Card variant="default" padding="md">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🎭</div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-1">Anonymous Betting</h4>
            <p className="text-xs text-text-secondary">
              Your bets are placed anonymously. Other users cannot see your wallet address or
              position sizes. Only you can view your positions in your private dashboard.
            </p>
          </div>
        </div>
      </Card>

      {/* Trade Modal */}
      {selectedMarket && (
        <Modal
          isOpen={tradeModalOpen}
          onClose={() => setTradeModalOpen(false)}
          title={`${tradeSide === "yes" ? "Buy YES" : "Buy NO"} Tokens`}
          size="sm"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-bg-elevated">
              <p className="text-sm text-text-primary font-medium mb-1">{selectedMarket.question}</p>
              <div className="flex items-center gap-3 text-xs text-text-muted">
                <span>Ends: {formatDate(selectedMarket.endDate)}</span>
                <span>Liq: {formatLiquidity(selectedMarket.liquidity)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setTradeSide("yes")}
                className={`flex-1 p-3 rounded-xl border text-center transition-all ${
                  tradeSide === "yes"
                    ? "bg-neon-green/20 border-neon-green text-neon-green"
                    : "bg-bg-elevated border-border-secondary text-text-secondary hover:border-neon-green/50"
                }`}
              >
                <div className="text-xs mb-0.5">YES</div>
                <div className="text-lg font-bold">{(selectedMarket.yesPrice * 100).toFixed(0)}¢</div>
              </button>
              <button
                onClick={() => setTradeSide("no")}
                className={`flex-1 p-3 rounded-xl border text-center transition-all ${
                  tradeSide === "no"
                    ? "bg-error/20 border-error text-error"
                    : "bg-bg-elevated border-border-secondary text-text-secondary hover:border-error/50"
                }`}
              >
                <div className="text-xs mb-0.5">NO</div>
                <div className="text-lg font-bold">{(selectedMarket.noPrice * 100).toFixed(0)}¢</div>
              </button>
            </div>

            <div>
              <label className="block text-xs text-text-secondary mb-1">Amount (USDC)</label>
              <Input
                type="number"
                value={tradeAmount}
                onChange={(e) => setTradeAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            {tradeAmount && parseFloat(tradeAmount) > 0 && (
              <div className="p-3 rounded-xl bg-bg-elevated text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-text-muted">Est. Tokens</span>
                  <span className="text-text-primary">
                    ~{(parseFloat(tradeAmount) / (tradeSide === "yes" ? selectedMarket.yesPrice : selectedMarket.noPrice)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Max Payout</span>
                  <span className="text-neon-green">
                    ${(parseFloat(tradeAmount) / (tradeSide === "yes" ? selectedMarket.yesPrice : selectedMarket.noPrice)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={executeTrade}
              disabled={!tradeAmount || parseFloat(tradeAmount) <= 0 || trading}
              className="w-full"
            >
              {trading ? "Processing..." : `Buy ${tradeSide.toUpperCase()} for $${tradeAmount || "0"}`}
            </Button>

            <p className="text-xs text-text-muted text-center">
              Trading requires USDC in your wallet. Connect wallet to trade.
            </p>
          </div>
        </Modal>
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Trade Submitted!"
        message={
          lastTrade
            ? `Placed ${lastTrade.side} bet of $${lastTrade.amount} USDC on "${lastTrade.market}" (Demo Mode)`
            : "Your trade has been submitted"
        }
      />
    </div>
  );
}
