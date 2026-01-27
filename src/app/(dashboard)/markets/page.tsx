"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Tabs from "@/components/ui/Tabs";
import Input, { SearchInput } from "@/components/ui/Input";
import Modal, { SuccessModal } from "@/components/ui/Modal";
import { usePNP, MarketCategory, CreateMarketParams } from "@/hooks/usePNP";
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
    allMarkets,
    loading,
    error,
    stats,
    category,
    fetchMarkets,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fetchMyMarkets, // Available for programmatic fetching
    loadMore,
    setCategory,
    formatVolume,
    formatLiquidity,
    getMarketStatus,
    trading,
    creating,
    // New wallet-connected trading
    walletConnected,
    walletAddress,
    sdkReady,
    buyTokensV2,
    buyTokensP2P,
    createMarket,
  } = usePNP();

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMyMarkets, setShowMyMarkets] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<PNPMarket | null>(null);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [tradeSide, setTradeSide] = useState<"yes" | "no">("yes");
  const [tradeAmount, setTradeAmount] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [lastTrade, setLastTrade] = useState<{ side: string; amount: string; market: string; signature?: string } | null>(null);

  // Create Market Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createMarketType, setCreateMarketType] = useState<"v2" | "p2p">("v2");
  const [createQuestion, setCreateQuestion] = useState("");
  const [createLiquidity, setCreateLiquidity] = useState("");
  const [createEndDate, setCreateEndDate] = useState("");
  const [createSide, setCreateSide] = useState<"yes" | "no">("yes");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [lastCreatedMarket, setLastCreatedMarket] = useState<{ market: string; signature?: string } | null>(null);

  // Fetch markets on mount and when category changes
  useEffect(() => {
    fetchMarkets({ limit: 20, reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  // Category tabs (V2 AMM vs P2P)
  const categoryTabs = [
    { id: "all", label: `All (${stats.totalCount})` },
    { id: "v2", label: `V2 AMM (${stats.v2Count})` },
    { id: "p2p", label: `P2P (${stats.p2pCount})` },
  ];

  // Status tabs
  const statusTabs = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "ended", label: "Ended" },
    { id: "resolved", label: "Resolved" },
  ];

  // Use allMarkets (full cache) for My Markets filtering
  const sourceMarkets = showMyMarkets && walletAddress
    ? allMarkets.filter(m => m.creator === walletAddress)
    : markets;

  // Filter markets by status and search
  const filteredMarkets = sourceMarkets
    .filter((m, index, self) =>
      // Remove duplicates by publicKey
      index === self.findIndex((t) => t.publicKey === m.publicKey)
    )
    .filter((m) => {
      const matchesSearch = m.question.toLowerCase().includes(searchQuery.toLowerCase());
      const status = getMarketStatus(m);

      if (statusFilter === "all") return matchesSearch;
      return matchesSearch && status === statusFilter;
    });

  // Count user's markets from the full cache
  const myMarketsCount = walletConnected && allMarkets.length > 0
    ? allMarkets.filter((m) => m.creator === walletAddress).length
    : 0;

  const handleTrade = (market: PNPMarket, side: "yes" | "no") => {
    setSelectedMarket(market);
    setTradeSide(side);
    setTradeAmount("");
    setTradeError(null);
    setTradeModalOpen(true);
  };

  const executeTrade = async () => {
    if (!selectedMarket || !tradeAmount) return;

    setTradeError(null);

    // Check if wallet is connected
    if (!walletConnected || !sdkReady) {
      setTradeError("Please connect your wallet to trade");
      return;
    }

    const amount = parseFloat(tradeAmount);
    if (isNaN(amount) || amount <= 0) {
      setTradeError("Please enter a valid amount");
      return;
    }

    try {
      // Execute trade based on market type
      let result;
      if (selectedMarket.marketType === "v2") {
        result = await buyTokensV2(selectedMarket.publicKey, tradeSide, amount);
      } else {
        result = await buyTokensP2P(selectedMarket.publicKey, tradeSide, amount);
      }

      if (result.success) {
        setTradeModalOpen(false);
        setLastTrade({
          side: tradeSide.toUpperCase(),
          amount: tradeAmount,
          market: selectedMarket.question.slice(0, 50) + "...",
          signature: result.signature,
        });
        setShowSuccess(true);
      } else {
        setTradeError(result.error || "Trade failed");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Trade failed";
      setTradeError(message);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory as MarketCategory);
  };

  const openCreateModal = () => {
    setCreateQuestion("");
    setCreateLiquidity("");
    setCreateEndDate("");
    setCreateMarketType("v2");
    setCreateSide("yes");
    setCreateError(null);
    setCreateModalOpen(true);
  };

  const executeCreateMarket = async () => {
    if (!createQuestion.trim()) {
      setCreateError("Please enter a market question");
      return;
    }

    const liquidity = parseFloat(createLiquidity);
    if (isNaN(liquidity) || liquidity < 1) {
      setCreateError("Initial liquidity must be at least 1 USDC");
      return;
    }

    if (!createEndDate) {
      setCreateError("Please select an end date");
      return;
    }

    const endTime = new Date(createEndDate);
    if (endTime <= new Date()) {
      setCreateError("End date must be in the future");
      return;
    }

    if (!walletConnected || !sdkReady) {
      setCreateError("Please connect your wallet to create markets");
      return;
    }

    setCreateError(null);

    try {
      const params: CreateMarketParams = {
        question: createQuestion.trim(),
        initialLiquidity: liquidity,
        endTime,
        marketType: createMarketType,
        side: createMarketType === "p2p" ? createSide : undefined,
      };

      const result = await createMarket(params);

      if (result.success) {
        setCreateModalOpen(false);
        setLastCreatedMarket({
          market: result.market,
          signature: result.signature,
        });
        setCreateSuccess(true);
        // Refresh markets list to show the newly created market
        setTimeout(() => {
          fetchMarkets({ limit: 20, reset: true });
          setShowMyMarkets(true); // Auto-enable "My Markets" filter
        }, 2000); // Wait 2s for blockchain to index
      } else {
        setCreateError(result.error || "Failed to create market");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create market";
      setCreateError(message);
    }
  };

  // Get minimum date for date picker (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
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
          <Button
            size="sm"
            onClick={openCreateModal}
            disabled={!walletConnected}
            className="ml-2"
          >
            + Create Market
          </Button>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: "Total Markets", value: stats.totalCount.toLocaleString(), highlight: true },
          { label: "V2 AMM", value: stats.v2Count.toLocaleString() },
          { label: "P2P Markets", value: stats.p2pCount.toLocaleString() },
          { label: "Loaded", value: `${stats.loadedCount} / ${category === "v2" ? stats.v2Count : category === "p2p" ? stats.p2pCount : stats.totalCount}` },
          { label: "Status", value: error ? "Error" : loading ? "Loading..." : "Connected", positive: !error && !loading },
          {
            label: "Wallet",
            value: walletConnected ? `${walletAddress?.slice(0, 4)}...${walletAddress?.slice(-4)}` : "Not Connected",
            positive: walletConnected,
            icon: walletConnected ? "✓" : "○"
          },
        ].map((stat, i) => (
          <Card key={i} variant="stat" padding="sm">
            <div className="text-xs text-text-muted mb-1">{stat.label}</div>
            <div
              className={`text-lg font-bold flex items-center gap-1 ${
                stat.positive === false ? "text-error" : stat.highlight ? "text-neon-cyan" : stat.positive ? "text-neon-green" : "text-text-primary"
              }`}
            >
              {stat.icon && <span className="text-sm">{stat.icon}</span>}
              {stat.value}
            </div>
          </Card>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div>
          <span className="text-xs text-text-muted mr-2">Market Type:</span>
          <Tabs tabs={categoryTabs} activeTab={category} onChange={handleCategoryChange} size="sm" />
        </div>
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
            <Button size="sm" variant="secondary" onClick={() => fetchMarkets({ reset: true })} className="ml-auto">
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Status Filter + Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Tabs tabs={statusTabs} activeTab={statusFilter} onChange={setStatusFilter} size="sm" />

        {/* My Markets Toggle */}
        {walletConnected && (
          <button
            onClick={() => setShowMyMarkets(!showMyMarkets)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showMyMarkets
                ? "bg-neon-green/20 border border-neon-green text-neon-green"
                : "bg-bg-elevated border border-border-secondary text-text-secondary hover:border-neon-green/50"
            }`}
          >
            My Markets ({myMarketsCount})
          </button>
        )}

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
          filteredMarkets.map((market, index) => {
            const status = getMarketStatus(market);
            const isActive = status === "active";

            return (
              <Card
                key={`${market.publicKey}-${index}`}
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
                      <Badge size="xs" variant={market.marketType === "v2" ? "cyan" : "warning"}>
                        {market.marketType.toUpperCase()}
                      </Badge>
                      {walletConnected && market.creator === walletAddress && (
                        <Badge size="xs" variant="success">
                          ✨ Your Market
                        </Badge>
                      )}
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

      {/* Load More Button */}
      {stats.hasMore && markets.length > 0 && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={() => loadMore(20)}
            disabled={loading}
          >
            {loading ? "Loading..." : `Load More (${stats.loadedCount} / ${category === "v2" ? stats.v2Count : category === "p2p" ? stats.p2pCount : stats.totalCount})`}
          </Button>
        </div>
      )}

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

            {/* Error Display */}
            {tradeError && (
              <div className="p-3 rounded-xl bg-error/10 border border-error/30">
                <p className="text-sm text-error">{tradeError}</p>
              </div>
            )}

            {/* Wallet Status */}
            {!walletConnected && (
              <div className="p-3 rounded-xl bg-warning/10 border border-warning/30">
                <p className="text-sm text-warning">Connect your wallet to place trades</p>
              </div>
            )}

            <Button
              onClick={executeTrade}
              disabled={!tradeAmount || parseFloat(tradeAmount) <= 0 || trading || !walletConnected}
              className="w-full"
            >
              {trading
                ? "Processing..."
                : !walletConnected
                ? "Connect Wallet to Trade"
                : `Buy ${tradeSide.toUpperCase()} for $${tradeAmount || "0"}`}
            </Button>

            <p className="text-xs text-text-muted text-center">
              {walletConnected
                ? `Trading with ${walletAddress?.slice(0, 4)}...${walletAddress?.slice(-4)}`
                : "Trading requires USDC in your wallet. Connect wallet to trade."}
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
            ? `Placed ${lastTrade.side} bet of $${lastTrade.amount} USDC on "${lastTrade.market}"`
            : "Your trade has been submitted"
        }
        txSignature={lastTrade?.signature}
      />

      {/* Create Market Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Prediction Market"
        size="md"
      >
        <div className="space-y-4">
          {/* Market Type Selection */}
          <div>
            <label className="block text-xs text-text-secondary mb-2">Market Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setCreateMarketType("v2")}
                className={`flex-1 p-3 rounded-xl border text-center transition-all ${
                  createMarketType === "v2"
                    ? "bg-neon-cyan/20 border-neon-cyan text-neon-cyan"
                    : "bg-bg-elevated border-border-secondary text-text-secondary hover:border-neon-cyan/50"
                }`}
              >
                <div className="text-sm font-semibold mb-0.5">V2 AMM</div>
                <div className="text-xs text-text-muted">Liquidity Pool</div>
              </button>
              <button
                onClick={() => setCreateMarketType("p2p")}
                className={`flex-1 p-3 rounded-xl border text-center transition-all ${
                  createMarketType === "p2p"
                    ? "bg-warning/20 border-warning text-warning"
                    : "bg-bg-elevated border-border-secondary text-text-secondary hover:border-warning/50"
                }`}
              >
                <div className="text-sm font-semibold mb-0.5">P2P</div>
                <div className="text-xs text-text-muted">Peer-to-Peer</div>
              </button>
            </div>
          </div>

          {/* Market Question */}
          <div>
            <label className="block text-xs text-text-secondary mb-1">Market Question</label>
            <textarea
              value={createQuestion}
              onChange={(e) => setCreateQuestion(e.target.value)}
              placeholder="Will Bitcoin reach $100,000 by end of 2026?"
              rows={3}
              className="w-full px-3 py-2 bg-bg-elevated border border-border-secondary rounded-lg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-neon-green/50 resize-none"
            />
            <p className="text-xs text-text-muted mt-1">
              Ask a clear yes/no question that can be resolved objectively
            </p>
          </div>

          {/* Initial Liquidity */}
          <div>
            <label className="block text-xs text-text-secondary mb-1">
              Initial Liquidity (USDC)
            </label>
            <Input
              type="number"
              value={createLiquidity}
              onChange={(e) => setCreateLiquidity(e.target.value)}
              placeholder="100"
              min="1"
              step="1"
            />
            <p className="text-xs text-text-muted mt-1">
              Minimum 1 USDC. Higher liquidity = less slippage for traders
            </p>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs text-text-secondary mb-1">End Date</label>
            <Input
              type="date"
              value={createEndDate}
              onChange={(e) => setCreateEndDate(e.target.value)}
              min={getMinDate()}
            />
            <p className="text-xs text-text-muted mt-1">
              Market closes on this date for resolution
            </p>
          </div>

          {/* P2P Side Selection */}
          {createMarketType === "p2p" && (
            <div>
              <label className="block text-xs text-text-secondary mb-2">Your Position</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setCreateSide("yes")}
                  className={`flex-1 p-3 rounded-xl border text-center transition-all ${
                    createSide === "yes"
                      ? "bg-neon-green/20 border-neon-green text-neon-green"
                      : "bg-bg-elevated border-border-secondary text-text-secondary hover:border-neon-green/50"
                  }`}
                >
                  <div className="text-sm font-semibold">YES</div>
                  <div className="text-xs text-text-muted">I believe it will happen</div>
                </button>
                <button
                  onClick={() => setCreateSide("no")}
                  className={`flex-1 p-3 rounded-xl border text-center transition-all ${
                    createSide === "no"
                      ? "bg-error/20 border-error text-error"
                      : "bg-bg-elevated border-border-secondary text-text-secondary hover:border-error/50"
                  }`}
                >
                  <div className="text-sm font-semibold">NO</div>
                  <div className="text-xs text-text-muted">I believe it won&apos;t happen</div>
                </button>
              </div>
            </div>
          )}

          {/* Summary */}
          {createQuestion && createLiquidity && createEndDate && (
            <div className="p-3 rounded-xl bg-bg-elevated text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-text-muted">Type</span>
                <span className="text-text-primary">{createMarketType.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Initial Liquidity</span>
                <span className="text-text-primary">${createLiquidity} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">End Date</span>
                <span className="text-text-primary">{new Date(createEndDate).toLocaleDateString()}</span>
              </div>
              {createMarketType === "p2p" && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Your Side</span>
                  <span className={createSide === "yes" ? "text-neon-green" : "text-error"}>
                    {createSide.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {createError && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/30">
              <p className="text-sm text-error">{createError}</p>
            </div>
          )}

          {/* Wallet Status */}
          {!walletConnected && (
            <div className="p-3 rounded-xl bg-warning/10 border border-warning/30">
              <p className="text-sm text-warning">Connect your wallet to create markets</p>
            </div>
          )}

          <Button
            onClick={executeCreateMarket}
            disabled={!createQuestion || !createLiquidity || !createEndDate || creating || !walletConnected}
            className="w-full"
          >
            {creating
              ? "Creating Market..."
              : !walletConnected
              ? "Connect Wallet to Create"
              : `Create ${createMarketType.toUpperCase()} Market`}
          </Button>

          <p className="text-xs text-text-muted text-center">
            Creating a market requires USDC for initial liquidity.
            {createMarketType === "v2"
              ? " V2 markets use automated market makers."
              : " P2P markets match you directly with other traders."}
          </p>
        </div>
      </Modal>

      {/* Create Market Success Modal */}
      <SuccessModal
        isOpen={createSuccess}
        onClose={() => {
          setCreateSuccess(false);
          // Ensure My Markets is shown to find the new market
          if (walletConnected) {
            setShowMyMarkets(true);
          }
        }}
        title="Market Created!"
        message={
          lastCreatedMarket
            ? `Your prediction market has been created and is now live! ${
                lastCreatedMarket.market
                  ? `Market Address: ${lastCreatedMarket.market.slice(0, 8)}...${lastCreatedMarket.market.slice(-4)}`
                  : "Markets list will refresh automatically."
              }`
            : "Market created successfully"
        }
        txSignature={lastCreatedMarket?.signature}
      />
    </div>
  );
}
