"use client";

import { useState, useEffect, useMemo } from "react";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { InfoTooltip } from "@/components/ui/Tooltip";
import { TransactionModal, SuccessModal } from "@/components/ui/Modal";
import { useDarklake, usePoints } from "@/hooks";
import { useWalletBalances } from "@/hooks/useHelius";
import { useAuth } from "@/lib/privy/hooks";
import { useNetwork } from "@/hooks/useNetwork";
import { SWAP_TOKENS, type TokenMetadata } from "@/lib/tokens";
import { PointsEarned } from "@/components/leaderboard";
import LearnMoreLink from "@/components/ui/LearnMoreLink";

interface Token {
  symbol: string;
  name: string;
  icon: string;
  mint: string;
  decimals: number;
  balance?: number;
  logoURI?: string;
  description?: string; // Extra info for user
}

// Native SOL mint (Darklake SDK auto-wraps this internally)
const NATIVE_SOL_MINT = 'So11111111111111111111111111111111111111111';
// Wrapped SOL mint
const WSOL_MINT = 'So11111111111111111111111111111111111111112';

// Check if two mints are both SOL variants (native or wrapped)
const isSolToSolSwap = (mintA: string, mintB: string): boolean => {
  const solMints = [NATIVE_SOL_MINT, WSOL_MINT];
  return solMints.includes(mintA) && solMints.includes(mintB);
};

// Supported tokens for Darklake private swap
const PRIVATE_SWAP_TOKENS: Token[] = [
  {
    symbol: 'SOL',
    name: 'Native SOL',
    icon: '◎',
    mint: NATIVE_SOL_MINT, // Darklake auto-wraps native SOL
    decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    description: 'Auto-wrapped by Darklake',
  },
  {
    symbol: 'WSOL',
    name: 'Wrapped SOL',
    icon: '◎',
    mint: WSOL_MINT, // Already wrapped
    decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    description: 'Already wrapped',
  },
  ...SWAP_TOKENS.filter((t: TokenMetadata) =>
    ["USDC", "USDT"].includes(t.symbol)
  ).map((t: TokenMetadata) => ({
    symbol: t.symbol,
    name: t.name,
    icon: t.icon,
    mint: t.mint,
    decimals: t.decimals,
    logoURI: t.logoURI,
  })),
];

export default function PrivateSwapPage() {
  const { walletAddress, authenticated } = useAuth();
  const { balances, loading: balancesLoading } = useWalletBalances(walletAddress);
  const {
    executePrivateSwap,
    getQuote,
    loading: swapLoading,
    error: swapError,
    result: swapResult,
    currentStep,
    initialized,
    initialize,
    reset: resetSwap,
    pendingOrders,
    pendingOrdersLoading,
    resumePendingOrder,
    fetchPendingOrders,
    allOrders,
    allOrdersLoading,
    fetchAllOrders,
  } = useDarklake();
  const { awardPoints } = usePoints();
  const { network } = useNetwork();

  const [fromToken, setFromToken] = useState(PRIVATE_SWAP_TOKENS[0]); // SOL
  const [toToken, setToToken] = useState(PRIVATE_SWAP_TOKENS[1]); // USDC
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [slippage, setSlippage] = useState("100"); // In basis points (1%)
  const [showTxModal, setShowTxModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<{
    fee: number;
    route?: string;
    priceImpact: number;
  } | null>(null);

  // Store last swap for success modal
  const [lastSwap, setLastSwap] = useState<{
    fromAmount: string;
    toAmount: string;
    fromSymbol: string;
    toSymbol: string;
    signature: string;
  } | null>(null);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);
  const [isResumingOrder, setIsResumingOrder] = useState(false);

  // Build token list with balances
  const tokens = useMemo(() => {
    const tokenList = PRIVATE_SWAP_TOKENS.map(t => ({ ...t })); // Clone to avoid mutation

    // Add native SOL balance
    if (balances?.sol !== undefined) {
      const solToken = tokenList.find((t) => t.symbol === "SOL");
      if (solToken) solToken.balance = balances.sol;
    }

    // Add WSOL and other token balances from tokens array
    if (balances?.tokens) {
      for (const token of balances.tokens) {
        const existingToken = tokenList.find(
          (t) => t.mint.toLowerCase() === token.mint.toLowerCase()
        );
        if (existingToken) {
          existingToken.balance = token.uiAmount;
        }
      }
    }

    return tokenList;
  }, [balances]);

  // Update fromToken and toToken with current balances
  const currentFromToken = useMemo(
    () => tokens.find((t) => t.mint === fromToken.mint) || fromToken,
    [tokens, fromToken]
  );
  const currentToToken = useMemo(
    () => tokens.find((t) => t.mint === toToken.mint) || toToken,
    [tokens, toToken]
  );

  // Check if current pair is invalid (SOL ↔ WSOL)
  const isInvalidPair = useMemo(() => {
    return isSolToSolSwap(fromToken.mint, toToken.mint);
  }, [fromToken.mint, toToken.mint]);

  // Get quote when amount changes
  useEffect(() => {
    const fetchQuote = async () => {
      // Don't fetch quote for invalid SOL ↔ WSOL pairs
      if (isInvalidPair) {
        setToAmount("");
        setCurrentQuote(null);
        return;
      }

      if (!fromAmount || parseFloat(fromAmount) <= 0) {
        setToAmount("");
        setCurrentQuote(null);
        return;
      }

      setQuoteLoading(true);
      try {
        const quote = await getQuote(
          fromToken.mint,
          toToken.mint,
          parseFloat(fromAmount) * Math.pow(10, fromToken.decimals),
          parseInt(slippage)
        );

        if (quote) {
          const outputAmount = quote.expectedOutput / Math.pow(10, toToken.decimals);
          setToAmount(outputAmount.toFixed(4));

          // Store quote details for display
          setCurrentQuote({
            fee: quote.fee / Math.pow(10, fromToken.decimals),
            route: quote.route,
            priceImpact: quote.priceImpact,
          });
        } else {
          setCurrentQuote(null);
        }
      } catch (err) {
        console.error("Quote error:", err);
        setCurrentQuote(null);
      } finally {
        setQuoteLoading(false);
      }
    };

    const debounce = setTimeout(fetchQuote, 500);
    return () => clearTimeout(debounce);
  }, [fromAmount, fromToken, toToken, slippage, getQuote, isInvalidPair]);

  // Initialize Darklake on mount
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleMaxClick = () => {
    if (currentFromToken.balance) {
      // Leave some SOL for fees if swapping SOL
      const maxAmount =
        fromToken.symbol === "SOL"
          ? Math.max(0, currentFromToken.balance - 0.01)
          : currentFromToken.balance;
      setFromAmount(maxAmount.toFixed(6));
    }
  };

  const handleSwap = async () => {
    if (!fromAmount || !walletAddress) return;

    const inputAmount = parseFloat(fromAmount) * Math.pow(10, fromToken.decimals);
    const minOutput = parseFloat(toAmount) * Math.pow(10, toToken.decimals) * (1 - parseInt(slippage) / 10000);

    setShowTxModal(true);

    const result = await executePrivateSwap(
      fromToken.mint,
      toToken.mint,
      inputAmount,
      Math.floor(minOutput)
    );

    setShowTxModal(false);

    if (result?.success) {
      const swapData = {
        fromAmount,
        toAmount,
        fromSymbol: fromToken.symbol,
        toSymbol: toToken.symbol,
        signature: result.signature || "",
      };

      setLastSwap(swapData);

      // Award points
      try {
        const pointsResult = await awardPoints("private_swap", {
          txSignature: result.signature,
          inputToken: fromToken.symbol,
          outputToken: toToken.symbol,
          amount: parseFloat(fromAmount),
          network,
        });
        if (pointsResult) {
          setPointsEarned(pointsResult.totalAwarded);
        }
      } catch (err) {
        console.error("Failed to award points:", err);
      }

      setShowSuccessModal(true);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setFromAmount("");
    setToAmount("");
    setLastSwap(null);
    setPointsEarned(null);
    setIsResumingOrder(false);
    resetSwap();
    // Refresh orders
    fetchPendingOrders();
    fetchAllOrders();
  };

  const handleResumeOrder = async (order: typeof pendingOrders[0]) => {
    setIsResumingOrder(true);
    setShowTxModal(true);

    const result = await resumePendingOrder(order);

    setShowTxModal(false);

    if (result?.success) {
      // Find token symbols from mints
      const inputToken = PRIVATE_SWAP_TOKENS.find(t => t.mint === order.inputMint);
      const outputToken = PRIVATE_SWAP_TOKENS.find(t => t.mint === order.outputMint);

      const swapData = {
        fromAmount: (parseFloat(order.inputAmount) / Math.pow(10, inputToken?.decimals || 9)).toFixed(4),
        toAmount: (parseFloat(order.minOutputAmount) / Math.pow(10, outputToken?.decimals || 6)).toFixed(4),
        fromSymbol: inputToken?.symbol || "SOL",
        toSymbol: outputToken?.symbol || "USDC",
        signature: result.signature || "",
      };

      setLastSwap(swapData);

      // Award points
      try {
        const pointsResult = await awardPoints("private_swap", {
          txSignature: result.signature,
          inputToken: inputToken?.symbol || "SOL",
          outputToken: outputToken?.symbol || "USDC",
          amount: parseFloat(order.inputAmount) / Math.pow(10, inputToken?.decimals || 9),
          network,
          resumed: true,
        });
        if (pointsResult) {
          setPointsEarned(pointsResult.totalAwarded);
        }
      } catch (err) {
        console.error("Failed to award points:", err);
      }

      setShowSuccessModal(true);
    }
    setIsResumingOrder(false);
  };

  const txSteps: { label: string; status: "pending" | "active" | "completed" | "error"; description: string }[] = isResumingOrder
    ? [
        {
          label: "Sign 1 of 1 - Settle Order",
          status: currentStep?.step === "settle"
            ? currentStep.status === "completed"
              ? "completed"
              : currentStep.status === "processing"
              ? "active"
              : currentStep.status === "failed"
              ? "error"
              : "pending"
            : "pending",
          description: "Generating ZK proof and completing your swap. This verifies the trade without revealing details.",
        },
      ]
    : [
        {
          label: "Sign 1 of 2 - Commit Order",
          status: currentStep?.step === "commit"
            ? currentStep.status === "completed"
              ? "completed"
              : currentStep.status === "processing"
              ? "active"
              : currentStep.status === "failed"
              ? "error"
              : "pending"
            : currentStep?.step === "settle"
            ? "completed"
            : "pending",
          description: "Creating encrypted order on-chain. Your SOL will be locked. Trade intent hidden from MEV bots.",
        },
        {
          label: "Sign 2 of 2 - Settle Swap (within 2 min)",
          status: currentStep?.step === "settle"
            ? currentStep.status === "completed"
              ? "completed"
              : currentStep.status === "processing"
              ? "active"
              : currentStep.status === "failed"
              ? "error"
              : "pending"
            : "pending",
          description: "Generating Groth16 ZK proof and executing swap. You'll receive your tokens after this.",
        },
      ];

  const isSwapDisabled =
    !authenticated ||
    !fromAmount ||
    parseFloat(fromAmount) <= 0 ||
    !toAmount ||
    swapLoading ||
    balancesLoading ||
    isInvalidPair ||
    (currentFromToken.balance !== undefined && parseFloat(fromAmount) > currentFromToken.balance);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-text-primary">Private Swap</h1>
            <Badge variant="default" size="sm">ZK-AMM</Badge>
          </div>
          <p className="text-sm text-text-secondary">
            MEV-resistant swaps powered by Darklake zero-knowledge proofs
          </p>
        </div>
        <LearnMoreLink section="darklake">How ZK-AMM works</LearnMoreLink>
      </div>

      {/* Privacy Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-neon-green/10 via-neon-cyan/10 to-neon-green/10 border border-neon-green/30">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-neon-green/20 flex items-center justify-center flex-shrink-0">
            <ShieldIcon className="w-5 h-5 text-neon-green" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neon-green mb-1">
              Two-Step ZK Swap Process
            </h3>
            <p className="text-xs text-text-secondary mb-2">
              Private swaps require <span className="text-neon-green font-medium">2 signatures</span> to protect against MEV:
            </p>
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-neon-green/20 flex items-center justify-center text-neon-green font-bold text-[10px]">1</span>
                <span className="text-text-secondary">Commit Order <span className="text-text-muted">(locks funds)</span></span>
              </div>
              <span className="text-text-muted">→</span>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-neon-green/20 flex items-center justify-center text-neon-green font-bold text-[10px]">2</span>
                <span className="text-text-secondary">Settle Swap <span className="text-text-muted">(within 2 min)</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Important Warning */}
      <div className="p-3 rounded-xl bg-warning/10 border border-warning/30">
        <div className="flex items-center gap-2">
          <ClockIcon className="w-4 h-4 text-warning flex-shrink-0" />
          <p className="text-xs text-warning">
            <span className="font-semibold">Complete both signatures within ~2 minutes.</span>
            {" "}If you miss the deadline, your funds are automatically returned.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Swap Card */}
        <div className="lg:col-span-2">
          <Card variant="default" padding="lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Swap Privately</span>
                <InfoTooltip content="Two-step swap: 1) Commit encrypted order, 2) Settle with ZK proof" />
              </CardTitle>
            </CardHeader>

            <div className="space-y-4 mt-4">
              {/* From Token */}
              <div className="p-4 rounded-xl bg-bg-tertiary border border-border-secondary">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-muted">You Pay</span>
                  <span className="text-xs text-text-muted">
                    Balance: {currentFromToken.balance?.toFixed(4) || "0"} {fromToken.symbol}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={fromAmount}
                      onChange={(e) => setFromAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-transparent text-2xl font-bold text-text-primary placeholder:text-text-muted focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleMaxClick}
                      className="px-2 py-1 text-xs font-medium text-neon-green hover:bg-neon-green/10 rounded transition-colors"
                    >
                      MAX
                    </button>
                    <TokenSelector
                      tokens={tokens}
                      selected={fromToken}
                      onSelect={setFromToken}
                      excludeMint={toToken.mint}
                    />
                  </div>
                </div>
              </div>

              {/* Swap Direction Button */}
              <div className="flex justify-center -my-2 relative z-10">
                <button
                  onClick={handleSwapTokens}
                  className="p-2 rounded-xl bg-bg-elevated border border-border-secondary hover:border-neon-green hover:bg-neon-green/10 transition-all group"
                >
                  <SwapIcon className="w-5 h-5 text-text-muted group-hover:text-neon-green transition-colors" />
                </button>
              </div>

              {/* To Token */}
              <div className="p-4 rounded-xl bg-bg-tertiary border border-border-secondary">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-muted">You Receive</span>
                  <span className="text-xs text-text-muted">
                    Balance: {currentToToken.balance?.toFixed(4) || "0"} {toToken.symbol}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={quoteLoading ? "Loading..." : toAmount || "0.00"}
                      readOnly
                      className="w-full bg-transparent text-2xl font-bold text-text-primary placeholder:text-text-muted focus:outline-none"
                    />
                  </div>
                  <TokenSelector
                    tokens={tokens}
                    selected={toToken}
                    onSelect={setToToken}
                    excludeMint={fromToken.mint}
                  />
                </div>
              </div>

              {/* Slippage Settings */}
              <div className="p-3 rounded-xl bg-bg-tertiary border border-border-secondary">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">Slippage Tolerance</span>
                    <InfoTooltip content="Hidden from MEV bots via blind slippage" />
                  </div>
                  <div className="flex items-center gap-1">
                    {["50", "100", "200"].map((bps) => (
                      <button
                        key={bps}
                        onClick={() => setSlippage(bps)}
                        className={`px-2 py-1 text-xs rounded-lg transition-all ${
                          slippage === bps
                            ? "bg-neon-green/20 text-neon-green font-medium"
                            : "text-text-muted hover:text-text-primary"
                        }`}
                      >
                        {parseFloat(bps) / 100}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Swap Details */}
              {currentQuote && fromAmount && (
                <div className="p-3 rounded-xl bg-bg-tertiary border border-border-secondary space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Exchange Fee</span>
                    <span className="text-text-primary font-medium">
                      {currentQuote.fee.toFixed(6)} {fromToken.symbol}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Route</span>
                    <span className="text-neon-cyan font-medium">
                      {currentQuote.route || "Darklake ZK-AMM"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Min. Received</span>
                    <span className="text-text-primary font-medium">
                      {(parseFloat(toAmount) * (1 - parseInt(slippage) / 10000)).toFixed(4)} {toToken.symbol}
                    </span>
                  </div>
                </div>
              )}

              {/* Privacy Info */}
              <div className="p-3 rounded-xl bg-neon-green/5 border border-neon-green/20">
                <div className="flex items-start gap-2">
                  <LockIcon className="w-4 h-4 text-neon-green mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-text-secondary">
                    <span className="text-neon-green font-medium">What&apos;s hidden:</span>{" "}
                    Trade direction, size, and slippage are encrypted until settlement.
                    Groth16 ZK proofs verify validity without revealing details.
                  </div>
                </div>
              </div>

              {/* Invalid Pair Warning */}
              {isInvalidPair && (
                <div className="p-3 rounded-xl bg-warning/10 border border-warning/20">
                  <p className="text-xs text-warning">
                    ⚠️ Cannot swap between SOL and WSOL - they are the same asset.
                    Use SOL for native balance, WSOL if you have wrapped tokens.
                  </p>
                </div>
              )}

              {/* Error Display */}
              {swapError && !isInvalidPair && (
                <div className="p-3 rounded-xl bg-error/10 border border-error/20">
                  <p className="text-xs text-error">{swapError}</p>
                </div>
              )}

              {/* Swap Button */}
              <Button
                fullWidth
                onClick={handleSwap}
                disabled={isSwapDisabled}
                loading={swapLoading}
              >
                {swapLoading
                  ? currentStep?.step === "commit"
                    ? "Step 1/2: Creating Encrypted Order..."
                    : "Step 2/2: Settling with ZK Proof..."
                  : "Swap Privately"}
              </Button>

              {/* Processing Info */}
              <div className="text-center text-xs text-text-muted">
                <span>⏱ Two signatures required: (1) Commit order → (2) Settle swap</span>
              </div>
            </div>
          </Card>

          {/* Pending Orders Section */}
          {(pendingOrders.length > 0 || pendingOrdersLoading) && (
            <Card variant="default" padding="md" className="border-warning/30 bg-warning/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                  <AlertIcon className="w-4 h-4 text-warning" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-warning">
                    Pending Orders ({pendingOrders.length})
                  </h3>
                  <p className="text-xs text-text-muted">
                    Orders committed but not settled. Click to resume.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {pendingOrdersLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="w-5 h-5 border-2 border-warning border-t-transparent rounded-full animate-spin" />
                    <span className="ml-2 text-sm text-text-muted">Loading...</span>
                  </div>
                ) : (
                  pendingOrders.map((order) => {
                    const inputToken = PRIVATE_SWAP_TOKENS.find(t => t.mint === order.inputMint);
                    const outputToken = PRIVATE_SWAP_TOKENS.find(t => t.mint === order.outputMint);
                    const inputAmount = parseFloat(order.inputAmount) / Math.pow(10, inputToken?.decimals || 9);
                    const outputAmount = parseFloat(order.minOutputAmount) / Math.pow(10, outputToken?.decimals || 6);

                    return (
                      <div
                        key={order.orderKey}
                        className="flex items-center justify-between p-3 rounded-xl bg-bg-tertiary border border-border-secondary"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-sm">
                            <span className="font-medium text-text-primary">
                              {inputAmount.toFixed(4)} {inputToken?.symbol || "?"}
                            </span>
                            <span className="text-text-muted mx-2">→</span>
                            <span className="font-medium text-text-primary">
                              ≥{outputAmount.toFixed(4)} {outputToken?.symbol || "?"}
                            </span>
                          </div>
                          <Badge variant="warning" size="sm">Pending</Badge>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleResumeOrder(order)}
                          loading={swapLoading && isResumingOrder}
                          disabled={swapLoading}
                        >
                          Resume
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
              <p className="text-[10px] text-text-muted mt-3">
                Orders expire after ~2 minutes (set by Darklake protocol). If expired, funds return automatically.
              </p>
            </Card>
          )}

          {/* Order History Section */}
          <Card variant="default" padding="md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neon-cyan/20 flex items-center justify-center">
                  <HistoryIcon className="w-4 h-4 text-neon-cyan" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    Order History
                  </h3>
                  <p className="text-xs text-text-muted">
                    All your private swap orders
                  </p>
                </div>
              </div>
              <button
                onClick={() => { fetchAllOrders(); fetchPendingOrders(); }}
                className="text-xs text-neon-cyan hover:underline"
              >
                Refresh
              </button>
            </div>

            {allOrdersLoading ? (
              <div className="flex items-center justify-center p-6">
                <div className="w-5 h-5 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                <span className="ml-2 text-sm text-text-muted">Loading orders...</span>
              </div>
            ) : allOrders.length === 0 ? (
              <div className="text-center p-6 text-text-muted">
                <p className="text-sm">No orders yet</p>
                <p className="text-xs mt-1">Your private swap history will appear here</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {allOrders.map((order) => {
                  const inputToken = PRIVATE_SWAP_TOKENS.find(t => t.mint === order.inputMint);
                  const outputToken = PRIVATE_SWAP_TOKENS.find(t => t.mint === order.outputMint);
                  const inputAmount = parseFloat(order.inputAmount) / Math.pow(10, inputToken?.decimals || 9);
                  const outputAmount = parseFloat(order.minOutputAmount) / Math.pow(10, outputToken?.decimals || 6);

                  const statusConfig = {
                    pending_settle: { label: 'Pending', variant: 'warning' as const, color: 'text-warning' },
                    settled: { label: 'Complete', variant: 'success' as const, color: 'text-neon-green' },
                    expired: { label: 'Expired', variant: 'info' as const, color: 'text-text-muted' },
                    cancelled: { label: 'Cancelled', variant: 'info' as const, color: 'text-text-muted' },
                  };
                  const status = statusConfig[order.status] || statusConfig.pending_settle;

                  return (
                    <div
                      key={order.orderKey}
                      className="p-3 rounded-xl bg-bg-tertiary border border-border-secondary"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary">
                            {inputAmount.toFixed(4)} {inputToken?.symbol || "?"}
                          </span>
                          <span className="text-text-muted">→</span>
                          <span className="text-sm font-medium text-text-primary">
                            {outputAmount.toFixed(4)} {outputToken?.symbol || "?"}
                          </span>
                        </div>
                        <Badge variant={status.variant} size="sm">{status.label}</Badge>
                      </div>

                      {/* Transaction Links */}
                      <div className="flex flex-wrap gap-2 text-[10px]">
                        <a
                          href={`https://solscan.io/tx/${order.commitSignature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neon-cyan hover:underline"
                        >
                          TX1: Commit ↗
                        </a>
                        {order.settleSignature && (
                          <a
                            href={`https://solscan.io/tx/${order.settleSignature}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-neon-green hover:underline"
                          >
                            TX2: Settle ↗
                          </a>
                        )}
                        {order.status === 'pending_settle' && !order.settleSignature && (
                          <span className="text-warning">TX2: Pending signature</span>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div className="mt-1 text-[10px] text-text-muted">
                        {new Date(order.createdAt).toLocaleString()}
                        {order.status === 'pending_settle' && order.expiresAt && (
                          <span className="ml-2 text-warning">
                            (expires {new Date(order.expiresAt).toLocaleTimeString()})
                          </span>
                        )}
                      </div>

                      {/* Resume Button for Pending */}
                      {order.status === 'pending_settle' && (
                        <div className="mt-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleResumeOrder(order)}
                            loading={swapLoading && isResumingOrder}
                            disabled={swapLoading}
                          >
                            Resume & Settle
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-4">
          {/* How It Works */}
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>How Private Swap Works</CardTitle>
            </CardHeader>
            <div className="space-y-4 mt-3">
              <Step
                number={1}
                title="Sign TX 1: Commit"
                description="Your SOL is locked. Trade intent encrypted. MEV bots can't see details."
              />
              <Step
                number={2}
                title="Sign TX 2: Settle"
                description="ZK proof generated. Swap executes privately. Must complete within ~2 min."
              />
              <Step
                number={3}
                title="Receive Tokens"
                description="USDC delivered to your wallet. Both TX signatures stored for your records."
              />
            </div>
            <div className="mt-3 p-2 rounded-lg bg-bg-tertiary">
              <p className="text-[10px] text-text-muted">
                <span className="text-warning">⏱</span> If TX 2 is not signed within ~2 minutes, your SOL is automatically returned.
              </p>
            </div>
          </Card>

          {/* Privacy Guarantees */}
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>Privacy Guarantees</CardTitle>
            </CardHeader>
            <div className="space-y-2 mt-3">
              <PrivacyItem icon="✓" text="Trade direction hidden" />
              <PrivacyItem icon="✓" text="Trade size hidden" />
              <PrivacyItem icon="✓" text="Slippage hidden" />
              <PrivacyItem icon="✓" text="No frontrunning" />
              <PrivacyItem icon="✓" text="No sandwich attacks" />
            </div>
          </Card>

          {/* Supported Pairs */}
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>Supported Pairs</CardTitle>
            </CardHeader>
            <div className="space-y-2 mt-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-bg-tertiary">
                <div className="flex items-center gap-2">
                  <span className="text-sm">◎</span>
                  <span className="text-sm text-text-primary">SOL</span>
                  <span className="text-text-muted">↔</span>
                  <span className="text-sm text-text-primary">USDC</span>
                </div>
                <Badge variant="default" size="sm">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-bg-tertiary">
                <div className="flex items-center gap-2">
                  <span className="text-sm">◎</span>
                  <span className="text-sm text-text-primary">SOL</span>
                  <span className="text-text-muted">↔</span>
                  <span className="text-sm text-text-primary">USDT</span>
                </div>
                <Badge variant="default" size="sm">Active</Badge>
              </div>
              <p className="text-[10px] text-text-muted mt-2">
                Pools are permissionless - more pairs coming soon
              </p>
            </div>
          </Card>

          {/* Powered By */}
          <Card variant="default" padding="md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">DL</span>
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Powered by Darklake</p>
                <p className="text-xs text-text-muted">ZK-AMM on Solana Mainnet</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Transaction Progress Modal */}
      <TransactionModal
        isOpen={showTxModal}
        onClose={() => {}}
        title={isResumingOrder ? "Settling Pending Order..." : "Private Swap in Progress..."}
        steps={txSteps}
        currentStep={isResumingOrder ? 0 : (currentStep?.step === "settle" ? 1 : 0)}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        title="Private Swap Complete!"
        message={
          lastSwap
            ? `Swapped ${lastSwap.fromAmount} ${lastSwap.fromSymbol} for ${lastSwap.toAmount} ${lastSwap.toSymbol} with MEV protection`
            : "Swap completed successfully"
        }
        txSignature={lastSwap?.signature || swapResult?.signature || ""}
        actions={pointsEarned ? <PointsEarned points={pointsEarned} action="Private Swap" /> : undefined}
      />
    </div>
  );
}

// Token Selector Component
function TokenSelector({
  tokens,
  selected,
  onSelect,
  excludeMint,
}: {
  tokens: Token[];
  selected: Token;
  onSelect: (token: Token) => void;
  excludeMint?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const availableTokens = tokens.filter((t) => t.mint !== excludeMint);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-elevated border border-border-secondary hover:border-neon-green transition-colors"
      >
        {selected.logoURI ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={selected.logoURI} alt={selected.symbol} className="w-6 h-6 rounded-full" />
        ) : (
          <span className="text-lg">{selected.icon}</span>
        )}
        <span className="font-medium text-text-primary">{selected.symbol}</span>
        <ChevronDownIcon className="w-4 h-4 text-text-muted" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-bg-elevated border border-border-secondary shadow-xl z-50 overflow-hidden">
            {availableTokens.map((token) => (
              <button
                key={token.mint}
                onClick={() => {
                  onSelect(token);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-bg-tertiary transition-colors ${
                  token.mint === selected.mint ? "bg-neon-green/10" : ""
                }`}
              >
                {token.logoURI ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={token.logoURI} alt={token.symbol} className="w-6 h-6 rounded-full" />
                ) : (
                  <span className="text-lg">{token.icon}</span>
                )}
                <div className="text-left">
                  <div className="text-sm font-medium text-text-primary">{token.symbol}</div>
                  <div className="text-xs text-text-muted">{token.balance?.toFixed(4) || "0"}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Step Component
function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-6 h-6 rounded-full bg-neon-green/20 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-neon-green">{number}</span>
      </div>
      <div>
        <p className="text-sm font-medium text-text-primary">{title}</p>
        <p className="text-xs text-text-muted mt-0.5">{description}</p>
      </div>
    </div>
  );
}

// Privacy Item Component
function PrivacyItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-neon-green text-sm">{icon}</span>
      <span className="text-xs text-text-secondary">{text}</span>
    </div>
  );
}

// Icons
const ShieldIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const SwapIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
  </svg>
);

const LockIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const ChevronDownIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const AlertIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

const ClockIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const HistoryIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
