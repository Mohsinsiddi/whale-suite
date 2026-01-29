"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Tabs from "@/components/ui/Tabs";
import Input, { SearchInput } from "@/components/ui/Input";
import Modal, { SuccessModal, TransactionModal } from "@/components/ui/Modal";
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
    sellTokensV2,
    getMinimumTradeAmount,
    createMarket,
    getMarketTokenBalances,
    redeemPositionV2,
  } = usePNP();

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMyMarkets, setShowMyMarkets] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<PNPMarket | null>(null);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [tradeMode, setTradeMode] = useState<"buy" | "sell">("buy");
  const [tradeSide, setTradeSide] = useState<"yes" | "no">("yes");
  const [tradeAmount, setTradeAmount] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [lastTrade, setLastTrade] = useState<{ side: string; amount: string; market: string; signature?: string; mode: string } | null>(null);

  // Token balances for trade modal
  const [tokenBalances, setTokenBalances] = useState<{ yesBalance: number; noBalance: number }>({ yesBalance: 0, noBalance: 0 });
  const [loadingBalances, setLoadingBalances] = useState(false);

  // Transaction progress modal state
  const [txProgressOpen, setTxProgressOpen] = useState(false);
  const [txSteps, setTxSteps] = useState<{ label: string; status: "pending" | "active" | "completed" | "error"; description?: string }[]>([]);
  const [txCurrentStep, setTxCurrentStep] = useState(0);
  const [txError, setTxError] = useState<string | undefined>();
  const [txTitle, setTxTitle] = useState("Processing Transaction");

  // View Details Modal
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsMarket, setDetailsMarket] = useState<PNPMarket | null>(null);

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

  const handleTrade = async (market: PNPMarket, side: "yes" | "no", mode: "buy" | "sell" = "buy") => {
    setSelectedMarket(market);
    setTradeSide(side);
    setTradeMode(mode);
    setTradeAmount("");
    setTradeError(null);
    setTokenBalances({ yesBalance: 0, noBalance: 0 });
    setTradeModalOpen(true);

    // Fetch token balances if wallet connected
    if (walletConnected && market.publicKey) {
      setLoadingBalances(true);
      try {
        const balances = await getMarketTokenBalances(market.publicKey);
        setTokenBalances({
          yesBalance: balances.yesBalance,
          noBalance: balances.noBalance,
        });
      } catch (e) {
        console.error("Failed to fetch token balances:", e);
      } finally {
        setLoadingBalances(false);
      }
    }
  };

  const handleViewDetails = (market: PNPMarket) => {
    setDetailsMarket(market);
    setDetailsModalOpen(true);
  };

  // Get minimum trade amount for selected market
  const minTradeAmount = selectedMarket ? getMinimumTradeAmount(selectedMarket.liquidity) : 0.01;

  // Redeem handler for resolved markets
  const handleRedeem = async (market: PNPMarket) => {
    if (!walletConnected || !sdkReady) {
      setTradeError("Please connect your wallet to redeem");
      return;
    }

    // Show progress modal
    setTxTitle("Redeeming Position");
    setTxSteps([
      { label: "Building Transaction", status: "active", description: "Preparing redemption..." },
      { label: "Awaiting Signature", status: "pending", description: "Please approve in your wallet" },
      { label: "Confirming on Chain", status: "pending", description: "Waiting for blockchain confirmation" },
    ]);
    setTxCurrentStep(0);
    setTxError(undefined);
    setTxProgressOpen(true);
    setTradeModalOpen(false);

    try {
      // Step 1 → Step 2
      await new Promise(resolve => setTimeout(resolve, 500));
      setTxSteps(prev => prev.map((s, i) => ({
        ...s,
        status: i === 0 ? "completed" : i === 1 ? "active" : "pending"
      })));
      setTxCurrentStep(1);

      const result = await redeemPositionV2(market.publicKey);

      // Step 2 → Step 3
      setTxSteps(prev => prev.map((s, i) => ({
        ...s,
        status: i <= 1 ? "completed" : "active"
      })));
      setTxCurrentStep(2);

      await new Promise(resolve => setTimeout(resolve, 800));

      if (result.success) {
        setTxSteps(prev => prev.map(s => ({ ...s, status: "completed" as const })));

        setTimeout(() => {
          setTxProgressOpen(false);
          setLastTrade({
            side: market.winningToken?.toUpperCase() || "",
            amount: "",
            market: market.question.slice(0, 50) + "...",
            signature: result.signature,
            mode: "redeem",
          });
          setShowSuccess(true);
        }, 500);
      } else {
        setTxSteps(prev => prev.map((s, i) => ({
          ...s,
          status: i === 2 ? "error" : s.status
        })));
        setTxError(result.error || "Redeem failed");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Redeem failed";
      setTxSteps(prev => prev.map((s) => ({
        ...s,
        status: s.status === "active" ? "error" : s.status
      })));
      setTxError(message);
    }
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

    // Check minimum trade amount for buy
    if (tradeMode === "buy" && amount < minTradeAmount) {
      setTradeError(`Minimum trade amount is $${minTradeAmount.toFixed(2)} USDC`);
      return;
    }

    // Check sell amount doesn't exceed balance
    if (tradeMode === "sell") {
      const maxSellable = tradeSide === "yes" ? tokenBalances.yesBalance : tokenBalances.noBalance;
      if (amount > maxSellable) {
        setTradeError(`Insufficient ${tradeSide.toUpperCase()} tokens. You have ${maxSellable.toFixed(2)}`);
        return;
      }
      if (amount <= 0) {
        setTradeError("Please enter a valid amount to sell");
        return;
      }
    }

    // Close trade modal and show progress modal
    setTradeModalOpen(false);
    setTxTitle(tradeMode === "buy" ? `Buying ${tradeSide.toUpperCase()} Tokens` : `Selling ${tradeSide.toUpperCase()} Tokens`);
    setTxSteps([
      { label: "Building Transaction", status: "active", description: "Preparing your trade..." },
      { label: "Awaiting Signature", status: "pending", description: "Please approve in your wallet" },
      { label: "Confirming on Chain", status: "pending", description: "Waiting for blockchain confirmation" },
    ]);
    setTxCurrentStep(0);
    setTxError(undefined);
    setTxProgressOpen(true);

    try {
      // Step 1 → Step 2: Building → Signing
      await new Promise(resolve => setTimeout(resolve, 500));
      setTxSteps(prev => prev.map((s, i) => ({
        ...s,
        status: i === 0 ? "completed" : i === 1 ? "active" : "pending"
      })));
      setTxCurrentStep(1);

      let result;

      if (tradeMode === "buy") {
        // Execute buy based on market type
        if (selectedMarket.marketType === "v2") {
          result = await buyTokensV2(selectedMarket.publicKey, tradeSide, amount);
        } else {
          result = await buyTokensP2P(selectedMarket.publicKey, tradeSide, amount);
        }
      } else {
        // Execute sell
        result = await sellTokensV2(selectedMarket.publicKey, tradeSide, amount);
      }

      // Step 2 → Step 3: Signing → Confirming
      setTxSteps(prev => prev.map((s, i) => ({
        ...s,
        status: i <= 1 ? "completed" : "active"
      })));
      setTxCurrentStep(2);

      // Brief delay to show confirmation step
      await new Promise(resolve => setTimeout(resolve, 800));

      if (result.success) {
        // All steps complete
        setTxSteps(prev => prev.map(s => ({ ...s, status: "completed" as const })));

        // Close progress modal and show success
        setTimeout(() => {
          setTxProgressOpen(false);
          setLastTrade({
            side: tradeSide.toUpperCase(),
            amount: tradeAmount,
            market: selectedMarket.question.slice(0, 50) + "...",
            signature: result.signature,
            mode: tradeMode,
          });
          setShowSuccess(true);
        }, 500);
      } else {
        // Show error in progress modal
        setTxSteps(prev => prev.map((s, i) => ({
          ...s,
          status: i === 2 ? "error" : s.status
        })));
        setTxError(result.error || "Trade failed");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Trade failed";
      setTxSteps(prev => prev.map((s) => ({
        ...s,
        status: s.status === "active" ? "error" : s.status
      })));
      setTxError(message);
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

    // Close create modal and show progress modal
    setCreateModalOpen(false);
    setTxTitle("Creating Prediction Market");
    setTxSteps([
      { label: "Building Transaction", status: "active", description: "Preparing market creation..." },
      { label: "Awaiting Signature", status: "pending", description: "Please approve in your wallet" },
      { label: "Confirming on Chain", status: "pending", description: "Waiting for blockchain confirmation" },
    ]);
    setTxCurrentStep(0);
    setTxError(undefined);
    setTxProgressOpen(true);

    try {
      // Step 1 → Step 2
      await new Promise(resolve => setTimeout(resolve, 500));
      setTxSteps(prev => prev.map((s, i) => ({
        ...s,
        status: i === 0 ? "completed" : i === 1 ? "active" : "pending"
      })));
      setTxCurrentStep(1);

      const params: CreateMarketParams = {
        question: createQuestion.trim(),
        initialLiquidity: liquidity,
        endTime,
        marketType: createMarketType,
        side: createMarketType === "p2p" ? createSide : undefined,
      };

      const result = await createMarket(params);

      // Step 2 → Step 3
      setTxSteps(prev => prev.map((s, i) => ({
        ...s,
        status: i <= 1 ? "completed" : "active"
      })));
      setTxCurrentStep(2);

      await new Promise(resolve => setTimeout(resolve, 800));

      if (result.success) {
        setTxSteps(prev => prev.map(s => ({ ...s, status: "completed" as const })));

        setTimeout(() => {
          setTxProgressOpen(false);
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
        }, 500);
      } else {
        setTxSteps(prev => prev.map((s, i) => ({
          ...s,
          status: i === 2 ? "error" : s.status
        })));
        setTxError(result.error || "Failed to create market");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create market";
      setTxSteps(prev => prev.map((s) => ({
        ...s,
        status: s.status === "active" ? "error" : s.status
      })));
      setTxError(message);
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Markets", value: stats.totalCount.toLocaleString(), highlight: true },
          { label: "V2 AMM", value: stats.v2Count.toLocaleString() },
          { label: "P2P Markets", value: stats.p2pCount.toLocaleString() },
          { label: "Loaded", value: `${stats.loadedCount}/${category === "v2" ? stats.v2Count : category === "p2p" ? stats.p2pCount : stats.totalCount}` },
          { label: "Status", value: error ? "Error" : loading ? "Loading..." : "Connected", positive: !error && !loading },
          {
            label: "Wallet",
            value: walletConnected ? `${walletAddress?.slice(0, 4)}...${walletAddress?.slice(-4)}` : "Not Connected",
            positive: walletConnected,
            icon: walletConnected ? "✓" : "○"
          },
        ].map((stat, i) => (
          <Card key={i} variant="stat" padding="sm">
            <div className="text-center">
              <div className="text-[10px] sm:text-xs text-text-muted mb-1">{stat.label}</div>
              <div
                className={`text-base sm:text-lg font-bold flex items-center justify-center gap-1 ${
                  stat.positive === false ? "text-error" : stat.highlight ? "text-neon-cyan" : stat.positive ? "text-neon-green" : "text-text-primary"
                }`}
              >
                {stat.icon && <span className="text-xs sm:text-sm">{stat.icon}</span>}
                <span className="truncate">{stat.value}</span>
              </div>
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
                <div className="flex flex-col gap-4">
                  {/* Question */}
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <Badge size="xs" variant={market.marketType === "v2" ? "cyan" : "warning"}>
                        {market.marketType.toUpperCase()}
                      </Badge>
                      {walletConnected && market.creator === walletAddress && (
                        <Badge size="xs" variant="success">
                          ✨ Yours
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
                    <h3 className="text-sm font-semibold text-text-primary mb-2 line-clamp-2">{market.question}</h3>
                    <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-text-muted flex-wrap">
                      <span>Vol: {formatVolume(market.volume)}</span>
                      <span>Liq: {formatLiquidity(market.liquidity)}</span>
                      <span className="hidden sm:inline">Ends: {formatDate(market.endDate)}</span>
                    </div>
                  </div>

                  {/* Prices & Trade - Responsive layout */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {/* YES/NO Price buttons */}
                    <div className="flex gap-2 flex-1 sm:flex-none">
                      <button
                        onClick={() => isActive && handleTrade(market, "yes")}
                        disabled={!isActive}
                        className={`flex-1 sm:flex-none p-2 sm:p-3 rounded-xl bg-neon-green/10 border border-neon-green/30 text-center min-w-[60px] sm:min-w-[80px] transition-all ${
                          isActive ? "hover:bg-neon-green/20 hover:border-neon-green/50 cursor-pointer" : "cursor-not-allowed opacity-60"
                        }`}
                      >
                        <div className="text-[10px] sm:text-xs text-neon-green mb-0.5">YES</div>
                        <div className="text-base sm:text-lg font-bold text-neon-green">
                          {(market.yesPrice * 100).toFixed(0)}¢
                        </div>
                      </button>
                      <button
                        onClick={() => isActive && handleTrade(market, "no")}
                        disabled={!isActive}
                        className={`flex-1 sm:flex-none p-2 sm:p-3 rounded-xl bg-error/10 border border-error/30 text-center min-w-[60px] sm:min-w-[80px] transition-all ${
                          isActive ? "hover:bg-error/20 hover:border-error/50 cursor-pointer" : "cursor-not-allowed opacity-60"
                        }`}
                      >
                        <div className="text-[10px] sm:text-xs text-error mb-0.5">NO</div>
                        <div className="text-base sm:text-lg font-bold text-error">
                          {(market.noPrice * 100).toFixed(0)}¢
                        </div>
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 ml-auto">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleViewDetails(market)}
                        className="text-xs px-2 sm:px-3"
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        disabled={!isActive}
                        onClick={() => handleTrade(market, "yes", "buy")}
                        className="text-xs px-2 sm:px-3"
                      >
                        Trade
                      </Button>
                    </div>
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
          title={selectedMarket.resolved
            ? "Market Resolved - Redeem Position"
            : `${tradeMode === "buy" ? "Buy" : "Sell"} ${tradeSide.toUpperCase()} Tokens`}
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

            {/* Redeem Section for Resolved Markets */}
            {selectedMarket.resolved && walletConnected && (tokenBalances.yesBalance > 0 || tokenBalances.noBalance > 0) && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-neon-green/10 to-neon-cyan/10 border border-neon-green/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🎉</span>
                  <span className="text-sm font-semibold text-neon-green">Market Resolved!</span>
                </div>
                <p className="text-xs text-text-secondary mb-3">
                  Winner: <span className={selectedMarket.winningToken === "yes" ? "text-neon-green font-bold" : "text-error font-bold"}>
                    {selectedMarket.winningToken?.toUpperCase()}
                  </span>
                </p>
                {((selectedMarket.winningToken === "yes" && tokenBalances.yesBalance > 0) ||
                  (selectedMarket.winningToken === "no" && tokenBalances.noBalance > 0)) ? (
                  <div>
                    <p className="text-xs text-text-secondary mb-2">
                      You have winning tokens! Redeem to claim your USDC.
                    </p>
                    <Button
                      onClick={() => handleRedeem(selectedMarket)}
                      className="w-full"
                      disabled={trading}
                    >
                      {trading ? "Redeeming..." : `Redeem ${selectedMarket.winningToken === "yes" ? tokenBalances.yesBalance.toFixed(2) : tokenBalances.noBalance.toFixed(2)} Tokens`}
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-text-muted">
                    Your {selectedMarket.winningToken === "yes" ? "NO" : "YES"} tokens are now worthless.
                  </p>
                )}
              </div>
            )}

            {/* Buy/Sell Toggle - Only show for active markets */}
            {!selectedMarket.resolved && (
              <div className="flex gap-2">
                <button
                  onClick={() => setTradeMode("buy")}
                  className={`flex-1 p-2 rounded-lg border text-center text-sm transition-all ${
                    tradeMode === "buy"
                      ? "bg-neon-cyan/20 border-neon-cyan text-neon-cyan"
                      : "bg-bg-elevated border-border-secondary text-text-secondary hover:border-neon-cyan/50"
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setTradeMode("sell")}
                  className={`flex-1 p-2 rounded-lg border text-center text-sm transition-all ${
                    tradeMode === "sell"
                      ? "bg-warning/20 border-warning text-warning"
                      : "bg-bg-elevated border-border-secondary text-text-secondary hover:border-warning/50"
                  }`}
                >
                  Sell
                </button>
              </div>
            )}

            {/* Your Token Balances */}
            {walletConnected && (
              <div className="p-3 rounded-xl bg-bg-elevated border border-border-secondary">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-muted">Your Token Balances</span>
                  {(tokenBalances.yesBalance > 0 || tokenBalances.noBalance > 0) && (
                    <span className="text-[10px] text-text-muted" title="AMM mints both YES and NO tokens to maintain the bonding curve">
                      ℹ️ AMM mints both
                    </span>
                  )}
                </div>
                {loadingBalances ? (
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <span className="animate-pulse">Loading balances...</span>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-neon-green font-bold">{tokenBalances.yesBalance.toFixed(4)}</span>
                      <span className="text-xs text-text-muted">YES</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-error font-bold">{tokenBalances.noBalance.toFixed(4)}</span>
                      <span className="text-xs text-text-muted">NO</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Trading Controls - Only for non-resolved markets */}
            {!selectedMarket.resolved && (
              <>
                {/* YES/NO Selection */}
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
                    {tradeMode === "sell" && tokenBalances.yesBalance > 0 && (
                      <div className="text-xs text-text-muted mt-1">You have: {tokenBalances.yesBalance.toFixed(2)}</div>
                    )}
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
                    {tradeMode === "sell" && tokenBalances.noBalance > 0 && (
                      <div className="text-xs text-text-muted mt-1">You have: {tokenBalances.noBalance.toFixed(2)}</div>
                    )}
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-text-secondary">
                      {tradeMode === "buy" ? "Amount (USDC)" : "Token Amount"}
                    </label>
                    {tradeMode === "sell" && (
                      <button
                        onClick={() => {
                          const maxAmount = tradeSide === "yes" ? tokenBalances.yesBalance : tokenBalances.noBalance;
                          setTradeAmount(maxAmount.toFixed(6));
                        }}
                        className="text-xs text-neon-cyan hover:text-neon-green transition-colors"
                        disabled={loadingBalances}
                      >
                        Max: {(tradeSide === "yes" ? tokenBalances.yesBalance : tokenBalances.noBalance).toFixed(2)}
                      </button>
                    )}
                  </div>
                  <Input
                    type="number"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    placeholder="0.00"
                    min={tradeMode === "buy" ? minTradeAmount.toString() : "0"}
                    step="0.01"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    {tradeMode === "buy"
                      ? `Min: $${minTradeAmount.toFixed(2)}`
                      : `Available: ${(tradeSide === "yes" ? tokenBalances.yesBalance : tokenBalances.noBalance).toFixed(2)} ${tradeSide.toUpperCase()} tokens`
                    }
                  </p>
                </div>

                {tradeAmount && parseFloat(tradeAmount) > 0 && (
                  <div className="p-3 rounded-xl bg-bg-elevated text-xs space-y-1">
                    {tradeMode === "buy" ? (
                      <>
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
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Selling</span>
                          <span className="text-text-primary">
                            {parseFloat(tradeAmount).toFixed(2)} {tradeSide.toUpperCase()} tokens
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Est. USDC Return</span>
                          <span className="text-neon-green">
                            ~${(parseFloat(tradeAmount) * (tradeSide === "yes" ? selectedMarket.yesPrice : selectedMarket.noPrice)).toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
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
                  disabled={
                    !tradeAmount ||
                    parseFloat(tradeAmount) <= 0 ||
                    trading ||
                    !walletConnected ||
                    (tradeMode === "sell" && parseFloat(tradeAmount) > (tradeSide === "yes" ? tokenBalances.yesBalance : tokenBalances.noBalance))
                  }
                  className="w-full"
                >
                  {trading
                    ? "Processing..."
                    : !walletConnected
                    ? "Connect Wallet to Trade"
                    : tradeMode === "buy"
                    ? `Buy ${tradeSide.toUpperCase()} for $${tradeAmount || "0"}`
                    : tradeMode === "sell" && (tradeSide === "yes" ? tokenBalances.yesBalance : tokenBalances.noBalance) === 0
                    ? `No ${tradeSide.toUpperCase()} tokens to sell`
                    : `Sell ${tradeAmount || "0"} ${tradeSide.toUpperCase()} Tokens`}
                </Button>

                <p className="text-xs text-text-muted text-center">
                  {walletConnected
                    ? `Trading with ${walletAddress?.slice(0, 4)}...${walletAddress?.slice(-4)}`
                    : "Trading requires USDC in your wallet. Connect wallet to trade."}
                </p>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* Transaction Progress Modal */}
      <TransactionModal
        isOpen={txProgressOpen}
        onClose={() => {
          if (txError) {
            setTxProgressOpen(false);
          }
          // Don't allow closing while processing
        }}
        title={txTitle}
        steps={txSteps}
        currentStep={txCurrentStep}
        error={txError}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title={lastTrade?.mode === "sell" ? "Sell Complete!" : lastTrade?.mode === "redeem" ? "Redeem Complete!" : "Trade Submitted!"}
        message={
          lastTrade
            ? lastTrade.mode === "sell"
              ? `Sold ${lastTrade.amount} ${lastTrade.side} tokens from "${lastTrade.market}"`
              : lastTrade.mode === "redeem"
              ? `Successfully redeemed your position from "${lastTrade.market}"`
              : `Placed ${lastTrade.side} bet of $${lastTrade.amount} USDC on "${lastTrade.market}"`
            : "Your trade has been submitted"
        }
        txSignature={lastTrade?.signature}
      />

      {/* View Details Modal */}
      {detailsMarket && (
        <Modal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title="Market Details"
          size="md"
        >
          <div className="space-y-4">
            {/* Question */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {detailsMarket.question}
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge size="xs" variant={detailsMarket.marketType === "v2" ? "cyan" : "warning"}>
                  {detailsMarket.marketType.toUpperCase()}
                </Badge>
                <Badge
                  size="xs"
                  variant={
                    getMarketStatus(detailsMarket) === "active"
                      ? "success"
                      : getMarketStatus(detailsMarket) === "resolved"
                      ? "cyan"
                      : "default"
                  }
                >
                  {getMarketStatus(detailsMarket).charAt(0).toUpperCase() + getMarketStatus(detailsMarket).slice(1)}
                </Badge>
                {detailsMarket.resolved && detailsMarket.winningToken && (
                  <Badge size="xs" variant={detailsMarket.winningToken === "yes" ? "success" : "error"}>
                    {detailsMarket.winningToken.toUpperCase()} Won
                  </Badge>
                )}
              </div>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 sm:p-4 rounded-xl bg-neon-green/10 border border-neon-green/30 text-center">
                <div className="text-[10px] sm:text-xs text-neon-green mb-1">YES Price</div>
                <div className="text-xl sm:text-2xl font-bold text-neon-green">
                  {(detailsMarket.yesPrice * 100).toFixed(1)}¢
                </div>
                <div className="text-[10px] sm:text-xs text-text-muted mt-1">
                  {detailsMarket.yesMultiplier.toFixed(2)}x
                </div>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-error/10 border border-error/30 text-center">
                <div className="text-[10px] sm:text-xs text-error mb-1">NO Price</div>
                <div className="text-xl sm:text-2xl font-bold text-error">
                  {(detailsMarket.noPrice * 100).toFixed(1)}¢
                </div>
                <div className="text-[10px] sm:text-xs text-text-muted mt-1">
                  {detailsMarket.noMultiplier.toFixed(2)}x
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 rounded-xl bg-bg-elevated text-center">
                <div className="text-[10px] sm:text-xs text-text-muted">Volume</div>
                <div className="text-xs sm:text-sm font-semibold text-text-primary">{formatVolume(detailsMarket.volume)}</div>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-bg-elevated text-center">
                <div className="text-[10px] sm:text-xs text-text-muted">Liquidity</div>
                <div className="text-xs sm:text-sm font-semibold text-text-primary">{formatLiquidity(detailsMarket.liquidity)}</div>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-bg-elevated text-center">
                <div className="text-[10px] sm:text-xs text-text-muted">End Date</div>
                <div className="text-xs sm:text-sm font-semibold text-text-primary">{formatDate(detailsMarket.endDate)}</div>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-bg-elevated text-center">
                <div className="text-[10px] sm:text-xs text-text-muted">Min Trade</div>
                <div className="text-xs sm:text-sm font-semibold text-text-primary">
                  ${getMinimumTradeAmount(detailsMarket.liquidity).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Addresses */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 rounded bg-bg-elevated">
                <span className="text-text-muted">Market Address</span>
                <a
                  href={`https://solscan.io/account/${detailsMarket.publicKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neon-cyan hover:underline font-mono"
                >
                  {detailsMarket.publicKey.slice(0, 8)}...{detailsMarket.publicKey.slice(-4)}
                </a>
              </div>
              <div className="flex justify-between p-2 rounded bg-bg-elevated">
                <span className="text-text-muted">Creator</span>
                <a
                  href={`https://solscan.io/account/${detailsMarket.creator}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neon-cyan hover:underline font-mono"
                >
                  {detailsMarket.creator.slice(0, 8)}...{detailsMarket.creator.slice(-4)}
                </a>
              </div>
              {detailsMarket.yesTokenMint && (
                <div className="flex justify-between p-2 rounded bg-bg-elevated">
                  <span className="text-text-muted">YES Token</span>
                  <a
                    href={`https://solscan.io/token/${detailsMarket.yesTokenMint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neon-green hover:underline font-mono"
                  >
                    {detailsMarket.yesTokenMint.slice(0, 8)}...
                  </a>
                </div>
              )}
              {detailsMarket.noTokenMint && (
                <div className="flex justify-between p-2 rounded bg-bg-elevated">
                  <span className="text-text-muted">NO Token</span>
                  <a
                    href={`https://solscan.io/token/${detailsMarket.noTokenMint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-error hover:underline font-mono"
                  >
                    {detailsMarket.noTokenMint.slice(0, 8)}...
                  </a>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setDetailsModalOpen(false)}
                className="flex-1"
              >
                Close
              </Button>
              {getMarketStatus(detailsMarket) === "active" && (
                <Button
                  onClick={() => {
                    setDetailsModalOpen(false);
                    handleTrade(detailsMarket, "yes", "buy");
                  }}
                  className="flex-1"
                >
                  Trade
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

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
