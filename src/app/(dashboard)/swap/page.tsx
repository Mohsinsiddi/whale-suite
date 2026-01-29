"use client";

import { useState, useEffect, useMemo } from "react";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { InfoTooltip } from "@/components/ui/Tooltip";
import { TransactionModal, SuccessModal } from "@/components/ui/Modal";
import { useSwap, usePoints } from "@/hooks";
import { useWalletBalances } from "@/hooks/useHelius";
import { useAuth } from "@/lib/privy/hooks";
import { useNetwork } from "@/hooks/useNetwork";
import { TOKEN_MINTS } from "@/lib/privacy-sdks";
import { useWallet } from "@/store";
import { PointsEarned } from "@/components/leaderboard";

interface Token {
  symbol: string;
  name: string;
  icon: string;
  mint: string;
  decimals: number;
  balance?: number;
  logoURI?: string;
}

// Default tokens with proper logos
const DEFAULT_TOKENS: Token[] = [
  {
    symbol: "SOL",
    name: "Solana",
    icon: "◎",
    mint: TOKEN_MINTS.SOL,
    decimals: 9,
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    icon: "$",
    mint: TOKEN_MINTS.USDC,
    decimals: 6,
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png"
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    icon: "₮",
    mint: TOKEN_MINTS.USDT,
    decimals: 6,
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg"
  },
  {
    symbol: "BONK",
    name: "Bonk",
    icon: "🐕",
    mint: TOKEN_MINTS.BONK,
    decimals: 5,
    logoURI: "https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I"
  },
  {
    symbol: "JUP",
    name: "Jupiter",
    icon: "♃",
    mint: TOKEN_MINTS.JUP,
    decimals: 6,
    logoURI: "https://static.jup.ag/jup/icon.png"
  },
];

export default function SwapPage() {
  const { walletAddress, authenticated } = useAuth();
  const { balances, loading: balancesLoading, refetch: refetchBalances, optimisticSwapUpdate } = useWalletBalances(walletAddress);
  const { balance: storeBalance, setBalance: setStoreBalance, triggerBalanceRefresh } = useWallet();
  const {
    executeSwap,
    getExpectedOutput,
    loading: swapLoading,
    error: swapError,
    result: swapResult,
    reset: resetSwap,
  } = useSwap();
  const { awardPoints } = usePoints();
  const { network } = useNetwork();

  const [fromToken, setFromToken] = useState(DEFAULT_TOKENS[0]);
  const [toToken, setToToken] = useState(DEFAULT_TOKENS[1]);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [slippage, setSlippage] = useState("50"); // In basis points (0.5%)
  const [priceImpact, setPriceImpact] = useState<number>(0);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Store last swap for success modal
  const [lastSwap, setLastSwap] = useState<{ fromAmount: string; toAmount: string; fromSymbol: string; toSymbol: string } | null>(null);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);

  // Build token list with balances
  const tokens = useMemo(() => {
    const tokenList = [...DEFAULT_TOKENS];

    // Add SOL balance
    if (balances?.sol !== undefined) {
      const solToken = tokenList.find((t) => t.symbol === "SOL");
      if (solToken) solToken.balance = balances.sol;
    }

    // Add token balances from wallet
    if (balances?.tokens) {
      for (const token of balances.tokens) {
        const existingToken = tokenList.find(
          (t) => t.mint.toLowerCase() === token.mint.toLowerCase()
        );
        if (existingToken) {
          existingToken.balance = token.uiAmount;
          if (token.logoURI) existingToken.logoURI = token.logoURI;
        } else if (token.uiAmount > 0 && token.symbol) {
          // Add new tokens from wallet that have balance
          tokenList.push({
            symbol: token.symbol || "???",
            name: token.name || token.symbol || "Unknown Token",
            icon: token.logoURI ? "" : "🪙",
            mint: token.mint,
            decimals: token.decimals,
            balance: token.uiAmount,
            logoURI: token.logoURI,
          });
        }
      }
    }

    return tokenList;
  }, [balances]);

  // Fetch quote when input changes
  useEffect(() => {
    const fetchQuote = async () => {
      if (!fromAmount || parseFloat(fromAmount) <= 0) {
        setToAmount("");
        setPriceImpact(0);
        return;
      }

      setQuoteLoading(true);
      setQuoteError(null);
      try {
        const result = await getExpectedOutput(
          fromToken.mint,
          toToken.mint,
          parseFloat(fromAmount)
        );

        if (result) {
          // Jupiter returns raw amount, use decimals from blockchain
          const outputDecimals = result.outputDecimals || toToken.decimals;
          const outputAmount = result.outputAmount / Math.pow(10, outputDecimals);
          setToAmount(outputAmount.toFixed(outputDecimals <= 6 ? 4 : 6));
          setPriceImpact(result.priceImpact);
        } else {
          setToAmount("");
          setQuoteError("Unable to get quote. Jupiter may be temporarily unavailable.");
        }
      } catch (err) {
        console.error("Quote error:", err);
        setToAmount("");
        setQuoteError("Failed to fetch quote. Please try again.");
      } finally {
        setQuoteLoading(false);
      }
    };

    const debounce = setTimeout(fetchQuote, 500);
    return () => clearTimeout(debounce);
  }, [fromAmount, fromToken, toToken, getExpectedOutput]);

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleSwap = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return;

    setShowTxModal(true);
    setCurrentStep(0);

    // Step 1: Getting quote
    await new Promise((r) => setTimeout(r, 500));
    setCurrentStep(1);

    // Step 2: Execute swap
    const result = await executeSwap(
      fromToken.mint,
      toToken.mint,
      parseFloat(fromAmount),
      parseInt(slippage)
    );

    setCurrentStep(2);
    await new Promise((r) => setTimeout(r, 500));

    setShowTxModal(false);

    if (result?.success) {
      // Save swap details for success modal BEFORE clearing
      setLastSwap({
        fromAmount: fromAmount,
        toAmount: toAmount,
        fromSymbol: fromToken.symbol,
        toSymbol: toToken.symbol,
      });

      // Optimistic update - immediately update balances in UI
      optimisticSwapUpdate(
        fromToken.mint,
        toToken.mint,
        parseFloat(fromAmount),
        result.outputAmount,
        toToken.decimals
      );

      // Also update global store balance if SOL is involved
      if (fromToken.mint === TOKEN_MINTS.SOL) {
        setStoreBalance(Math.max(0, (storeBalance || 0) - parseFloat(fromAmount)));
      } else if (toToken.mint === TOKEN_MINTS.SOL) {
        setStoreBalance((storeBalance || 0) + result.outputAmount);
      }

      // Trigger header balance refresh
      triggerBalanceRefresh();

      // Award points for the swap
      try {
        const pointsResult = await awardPoints('jupiter_swap', {
          txSignature: result.signature,
          fromToken: fromToken.symbol,
          toToken: toToken.symbol,
          amount: parseFloat(fromAmount),
          toAmount: result.outputAmount,
          network,
        });
        if (pointsResult) {
          setPointsEarned(pointsResult.totalAwarded);
        }
      } catch (err) {
        console.error('Failed to award points:', err);
      }

      // Clear inputs
      setFromAmount("");
      setToAmount("");

      // Show success modal
      setShowSuccessModal(true);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setPointsEarned(null);
    resetSwap();
  };

  const getStepStatus = (stepIndex: number): "pending" | "active" | "completed" => {
    if (currentStep > stepIndex) return "completed";
    if (currentStep === stepIndex) return "active";
    return "pending";
  };

  const txSteps = [
    {
      label: "Finding Best Route",
      status: getStepStatus(0),
      description: "Scanning Jupiter aggregator for optimal swap path across all DEXs..."
    },
    {
      label: "Signing Transaction",
      status: getStepStatus(1),
      description: "Please approve the transaction in your wallet..."
    },
    {
      label: "Confirming on Chain",
      status: getStepStatus(2),
      description: "Broadcasting swap transaction to Solana network..."
    },
  ];

  // Get token balance
  const getTokenBalance = (token: Token): number => {
    // Check if balance was set from merged list
    if (token.balance !== undefined) return token.balance;

    // Fallback: check from balances object
    if (token.symbol === "SOL") return balances?.sol || 0;

    const walletToken = balances?.tokens?.find(
      (t) => t.mint.toLowerCase() === token.mint.toLowerCase()
    );
    return walletToken?.uiAmount || 0;
  };

  const handleMax = () => {
    const balance = getTokenBalance(fromToken);
    if (fromToken.symbol === "SOL") {
      // Leave some SOL for fees
      const maxSol = Math.max(0, balance - 0.01);
      setFromAmount(maxSol.toFixed(fromToken.decimals));
    } else {
      // Use exact balance with full precision
      setFromAmount(balance.toFixed(fromToken.decimals));
    }
  };

  const canSwap =
    authenticated &&
    fromAmount &&
    parseFloat(fromAmount) > 0 &&
    parseFloat(fromAmount) <= getTokenBalance(fromToken) &&
    toAmount &&
    !swapLoading &&
    !quoteLoading;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-xl font-bold text-text-primary">Jupiter Swap</h1>
          <Badge size="xs" variant="warning">Public</Badge>
        </div>
        <p className="text-sm text-text-secondary">
          Swap tokens via Jupiter aggregator (on-chain, visible to everyone)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Swap Card */}
        <div className="lg:col-span-2">
          <Card variant="glow" padding="lg">
            {/* Warning Banner */}
            <div className="p-3 mb-5 rounded-xl bg-warning/10 border border-warning/20">
              <div className="flex items-start gap-2">
                <WarningIcon className="w-4 h-4 text-warning mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-warning mb-1">Standard Swap (Public Transaction)</p>
                  <p className="text-xs text-text-secondary">
                    This swap is visible on-chain. For private swaps, use Privacy Swap (coming soon).
                    Consider using a fresh wallet or shield your SOL first.
                  </p>
                </div>
              </div>
            </div>

            {/* From Token */}
            <div className="p-4 rounded-xl bg-bg-secondary border border-border-secondary mb-2">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-text-muted">You Pay</span>
                <span className="text-xs text-text-muted">
                  Balance:{" "}
                  {balancesLoading ? "..." : getTokenBalance(fromToken).toFixed(4)}{" "}
                  {fromToken.symbol}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-2xl font-semibold text-text-primary placeholder:text-text-muted focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <TokenSelector
                  token={fromToken}
                  tokens={tokens}
                  onSelect={setFromToken}
                  getBalance={getTokenBalance}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-text-muted">
                  {quoteLoading && fromAmount ? "Fetching quote..." : ""}
                </span>
                <button
                  className="text-xs text-neon-green hover:underline"
                  onClick={handleMax}
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-3 relative z-10">
              <button
                onClick={handleSwapTokens}
                className="w-10 h-10 rounded-xl bg-bg-tertiary border border-border-primary hover:border-neon-green/40 flex items-center justify-center text-text-secondary hover:text-neon-green transition-all"
              >
                <SwapIcon />
              </button>
            </div>

            {/* To Token */}
            <div className="p-4 rounded-xl bg-bg-secondary border border-border-secondary mt-2">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-text-muted">You Receive</span>
                <span className="text-xs text-text-muted">
                  Balance: {getTokenBalance(toToken).toFixed(4)} {toToken.symbol}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={toAmount}
                  readOnly
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-2xl font-semibold text-text-primary placeholder:text-text-muted focus:outline-none"
                />
                <TokenSelector
                  token={toToken}
                  tokens={tokens}
                  onSelect={setToToken}
                  getBalance={getTokenBalance}
                />
              </div>
              <span className="text-xs text-text-muted mt-2 block">
                {quoteLoading ? "Calculating..." : ""}
              </span>
            </div>

            {/* Route Info */}
            <div className="mt-4 p-3 rounded-xl bg-bg-tertiary">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-text-muted">Rate</span>
                <span className="text-text-secondary">
                  {fromAmount && toAmount && parseFloat(fromAmount) > 0
                    ? `1 ${fromToken.symbol} = ${(
                        parseFloat(toAmount) / parseFloat(fromAmount)
                      ).toFixed(4)} ${toToken.symbol}`
                    : `1 ${fromToken.symbol} = ? ${toToken.symbol}`}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs mb-2">
                <div className="flex items-center gap-1">
                  <span className="text-text-muted">Slippage</span>
                  <InfoTooltip content="Maximum price movement you're willing to accept" />
                </div>
                <div className="flex items-center gap-1">
                  {[
                    { label: "0.1%", value: "10" },
                    { label: "0.5%", value: "50" },
                    { label: "1.0%", value: "100" },
                  ].map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSlippage(s.value)}
                      className={`px-2 py-0.5 rounded text-xs transition-colors ${
                        slippage === s.value
                          ? "bg-neon-green/20 text-neon-green"
                          : "bg-bg-elevated text-text-muted hover:text-text-secondary"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-text-muted">Price Impact</span>
                <span className={priceImpact > 1 ? "text-warning" : "text-neon-green"}>
                  {priceImpact > 0 ? `${priceImpact.toFixed(2)}%` : "<0.01%"}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted">Network Fee</span>
                <span className="text-text-secondary">~0.00025 SOL</span>
              </div>
            </div>

            {/* Quote Error */}
            {quoteError && !swapError && (
              <div className="mt-4 p-3 rounded-xl bg-warning/10 border border-warning/20">
                <p className="text-xs text-warning">{quoteError}</p>
              </div>
            )}

            {/* Swap Error Display */}
            {swapError && (
              <div className="mt-4 p-3 rounded-xl bg-error/10 border border-error/20">
                <p className="text-xs text-error">{swapError}</p>
              </div>
            )}

            {/* Insufficient Balance Warning */}
            {fromAmount &&
              parseFloat(fromAmount) > getTokenBalance(fromToken) && (
                <div className="mt-4 p-3 rounded-xl bg-warning/10 border border-warning/20">
                  <p className="text-xs text-warning">
                    Insufficient {fromToken.symbol} balance
                  </p>
                </div>
              )}

            <Button
              fullWidth
              className="mt-4"
              disabled={!canSwap}
              loading={swapLoading}
              onClick={handleSwap}
            >
              {swapLoading ? "Swapping via Jupiter..." : "Swap via Jupiter"}
            </Button>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Your Tokens */}
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>Your Tokens</CardTitle>
              <button
                onClick={() => refetchBalances()}
                className="text-xs text-neon-green hover:underline"
              >
                Refresh
              </button>
            </CardHeader>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {balancesLoading ? (
                <p className="text-xs text-text-muted">Loading...</p>
              ) : (
                <>
                  {/* SOL Balance */}
                  <div className="flex items-center justify-between py-2 border-b border-border-secondary">
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
                        alt="SOL"
                        className="w-5 h-5 rounded-full"
                      />
                      <span className="text-sm font-medium text-text-primary">SOL</span>
                    </div>
                    <span className="text-sm text-text-secondary">
                      {(balances?.sol || 0).toFixed(4)}
                    </span>
                  </div>
                  {/* Token Balances */}
                  {balances?.tokens
                    ?.filter((t) => t.uiAmount > 0)
                    .slice(0, 10)
                    .map((token) => {
                      // Get metadata from DEFAULT_TOKENS if available
                      const defaultToken = DEFAULT_TOKENS.find(
                        (dt) => dt.mint.toLowerCase() === token.mint.toLowerCase()
                      );
                      const logoURI = defaultToken?.logoURI || token.logoURI;
                      const symbol = defaultToken?.symbol || token.symbol || "???";
                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                      const name = defaultToken?.name || token.name || symbol;

                      return (
                        <div
                          key={token.mint}
                          className="flex items-center justify-between py-2 border-b border-border-secondary last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            {logoURI ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={logoURI}
                                alt={symbol}
                                className="w-5 h-5 rounded-full"
                              />
                            ) : (
                              <span className="w-5 h-5 rounded-full bg-bg-elevated flex items-center justify-center text-xs">
                                {symbol[0] || "?"}
                              </span>
                            )}
                            <span className="text-sm font-medium text-text-primary">
                              {symbol}
                            </span>
                          </div>
                          <span className="text-sm text-text-secondary">
                            {token.uiAmount.toFixed(token.decimals <= 6 ? 4 : 6)}
                          </span>
                        </div>
                      );
                    })}
                  {(!balances?.tokens || balances.tokens.filter((t) => t.uiAmount > 0).length === 0) && (
                    <p className="text-xs text-text-muted py-2">No tokens found</p>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* Privacy Tip */}
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>Want Privacy?</CardTitle>
            </CardHeader>
            <p className="text-xs text-text-secondary mb-3">
              This is a standard Jupiter swap (public). For private trading,
              shield your SOL with Privacy Cash first, then use a fresh wallet.
            </p>
            <div className="space-y-2">
              <a href="/privacy" className="block">
                <Button variant="secondary" size="sm" fullWidth>
                  Shield SOL First
                </Button>
              </a>
              <div className="text-center">
                <span className="text-xs text-text-muted">Private Swap coming soon</span>
              </div>
            </div>
          </Card>

          {/* Powered By */}
          <Card variant="default" padding="sm">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-text-muted">Powered by</span>
              <span className="text-sm font-semibold text-text-secondary">Jupiter</span>
              <Badge size="xs" variant="success">
                Best Routes
              </Badge>
            </div>
          </Card>
        </div>
      </div>

      {/* Transaction Progress Modal */}
      <TransactionModal
        isOpen={showTxModal}
        onClose={() => setShowTxModal(false)}
        title="Swapping Tokens..."
        steps={txSteps}
        currentStep={currentStep}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        title="Jupiter Swap Complete!"
        message={lastSwap ? `Swapped ${lastSwap.fromAmount} ${lastSwap.fromSymbol} for ${lastSwap.toAmount} ${lastSwap.toSymbol}` : "Swap completed!"}
        txSignature={swapResult?.signature || ""}
        actions={pointsEarned ? <PointsEarned points={pointsEarned} action="Swap" /> : undefined}
      />
    </div>
  );
}

// Token Selector with balances
function TokenSelector({
  token,
  tokens,
  onSelect,
  getBalance,
}: {
  token: Token;
  tokens: Token[];
  onSelect: (token: Token) => void;
  getBalance: (token: Token) => number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-tertiary hover:bg-bg-elevated transition-colors"
      >
        {token.logoURI ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={token.logoURI} alt={token.symbol} className="w-5 h-5 rounded-full" />
        ) : (
          <span className="text-lg">{token.icon}</span>
        )}
        <span className="text-sm font-semibold text-text-primary">{token.symbol}</span>
        <ChevronDownIcon />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 py-2 bg-bg-tertiary border border-border-primary rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto animate-dropdown-in">
            {tokens.map((t) => (
              <button
                key={t.mint}
                onClick={() => {
                  onSelect(t);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 hover:bg-bg-elevated transition-colors ${
                  t.mint === token.mint ? "bg-neon-green/10" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {t.logoURI ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.logoURI} alt={t.symbol} className="w-5 h-5 rounded-full" />
                  ) : (
                    <span className="text-lg">{t.icon}</span>
                  )}
                  <div className="text-left">
                    <div className="text-sm font-medium text-text-primary">{t.symbol}</div>
                    <div className="text-xs text-text-muted truncate max-w-[100px]">
                      {t.name}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-text-secondary">
                  {getBalance(t).toFixed(t.decimals <= 6 ? 2 : 4)}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Icons
const SwapIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
    />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const WarningIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);
