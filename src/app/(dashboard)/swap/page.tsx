"use client";

import { useState, useEffect } from "react";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { InfoTooltip } from "@/components/ui/Tooltip";
import { TransactionModal, SuccessModal } from "@/components/ui/Modal";
import { useSwap, useWalletBalance } from "@/hooks";
import { useAuth } from "@/lib/privy/hooks";
import { TOKEN_MINTS } from "@/lib/privacy-sdks";

interface Token {
  symbol: string;
  name: string;
  icon: string;
  mint: string;
  decimals: number;
}

const tokens: Token[] = [
  { symbol: "SOL", name: "Solana", icon: "◎", mint: TOKEN_MINTS.SOL, decimals: 9 },
  { symbol: "USDC", name: "USD Coin", icon: "$", mint: TOKEN_MINTS.USDC, decimals: 6 },
  { symbol: "USDT", name: "Tether", icon: "₮", mint: TOKEN_MINTS.USDT, decimals: 6 },
  { symbol: "JUP", name: "Jupiter", icon: "♃", mint: TOKEN_MINTS.JUP, decimals: 6 },
  { symbol: "BONK", name: "Bonk", icon: "🐕", mint: TOKEN_MINTS.BONK, decimals: 5 },
];

export default function SwapPage() {
  const { walletAddress } = useAuth();
  const { balance, loading: balanceLoading } = useWalletBalance(walletAddress);
  const {
    executeSwap,
    getExpectedOutput,
    loading: swapLoading,
    error: swapError,
    result: swapResult,
    reset: resetSwap,
  } = useSwap();

  const [fromToken, setFromToken] = useState(tokens[0]);
  const [toToken, setToToken] = useState(tokens[1]);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [slippage, setSlippage] = useState("50"); // In basis points (0.5%)
  const [priceImpact, setPriceImpact] = useState<number>(0);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Fetch quote when input changes
  useEffect(() => {
    const fetchQuote = async () => {
      if (!fromAmount || parseFloat(fromAmount) <= 0) {
        setToAmount("");
        setPriceImpact(0);
        return;
      }

      const result = await getExpectedOutput(
        fromToken.mint,
        toToken.mint,
        parseFloat(fromAmount)
      );

      if (result) {
        // Adjust for decimals
        const outputAmount = result.outputAmount / Math.pow(10, 9 - toToken.decimals);
        setToAmount(outputAmount.toFixed(toToken.decimals === 6 ? 2 : 4));
        setPriceImpact(result.priceImpact);
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
      setShowSuccessModal(true);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setFromAmount("");
    setToAmount("");
    resetSwap();
  };

  const getStepStatus = (stepIndex: number): "pending" | "active" | "completed" => {
    if (currentStep > stepIndex) return "completed";
    if (currentStep === stepIndex) return "active";
    return "pending";
  };

  const txSteps = [
    { label: "Getting best route", status: getStepStatus(0) },
    { label: "Signing transaction", status: getStepStatus(1) },
    { label: "Confirming on chain", status: getStepStatus(2) },
  ];

  // Get token balance (only SOL for now)
  const getTokenBalance = (token: Token) => {
    if (token.symbol === "SOL") return balance;
    return 0; // TODO: Fetch token balances
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">Dark Pool</h1>
        <p className="text-sm text-text-secondary">Swap tokens via Jupiter aggregator</p>
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
                  <p className="text-xs font-medium text-warning mb-1">Swaps Are Public</p>
                  <p className="text-xs text-text-secondary">
                    Token swaps are visible on-chain. Consider using a fresh vault for trading.
                  </p>
                </div>
              </div>
            </div>

            {/* From Token */}
            <div className="p-4 rounded-xl bg-bg-secondary border border-border-secondary mb-2">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-text-muted">You Pay</span>
                <span className="text-xs text-text-muted">
                  Balance: {balanceLoading ? '...' : getTokenBalance(fromToken).toFixed(4)} {fromToken.symbol}
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
                <TokenSelector token={fromToken} tokens={tokens} onSelect={setFromToken} />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-text-muted">
                  {swapLoading && fromAmount ? 'Fetching...' : ''}
                </span>
                <button
                  className="text-xs text-neon-green hover:underline"
                  onClick={() => setFromAmount((getTokenBalance(fromToken) - 0.01).toFixed(4))}
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
                <TokenSelector token={toToken} tokens={tokens} onSelect={setToToken} />
              </div>
              <span className="text-xs text-text-muted mt-2 block">
                {swapLoading ? 'Calculating...' : ''}
              </span>
            </div>

            {/* Route Info */}
            <div className="mt-4 p-3 rounded-xl bg-bg-tertiary">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-text-muted">Rate</span>
                <span className="text-text-secondary">
                  {fromAmount && toAmount
                    ? `1 ${fromToken.symbol} = ${(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(4)} ${toToken.symbol}`
                    : `1 ${fromToken.symbol} = ? ${toToken.symbol}`}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs mb-2">
                <div className="flex items-center gap-1">
                  <span className="text-text-muted">Slippage</span>
                  <InfoTooltip content="Maximum price movement you're willing to accept" />
                </div>
                <div className="flex items-center gap-1">
                  {[{ label: "0.1%", value: "10" }, { label: "0.5%", value: "50" }, { label: "1.0%", value: "100" }].map((s) => (
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
                  {priceImpact > 0 ? `${priceImpact.toFixed(2)}%` : '<0.01%'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted">Network Fee</span>
                <span className="text-text-secondary">~0.00025 SOL</span>
              </div>
            </div>

            {/* Error Display */}
            {swapError && (
              <div className="mt-4 p-3 rounded-xl bg-error/10 border border-error/20">
                <p className="text-xs text-error">{swapError}</p>
              </div>
            )}

            <Button
              fullWidth
              className="mt-4"
              disabled={!fromAmount || !toAmount || swapLoading || parseFloat(fromAmount) > getTokenBalance(fromToken)}
              loading={swapLoading}
              onClick={handleSwap}
            >
              {swapLoading ? 'Swapping...' : 'Swap Tokens'}
            </Button>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Price Chart Placeholder */}
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>SOL/USDC</CardTitle>
              <Badge variant="success" size="xs">+2.4%</Badge>
            </CardHeader>
            <div className="text-2xl font-bold text-text-primary mb-1">$150.00</div>
            <div className="h-32 flex items-end justify-between gap-1">
              {[40, 55, 45, 60, 70, 65, 80, 75, 85, 78, 82, 90].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-neon-green/20 rounded-t"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </Card>

          {/* Privacy Tip */}
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>Privacy Tip</CardTitle>
            </CardHeader>
            <p className="text-xs text-text-secondary mb-3">
              For maximum privacy, create a fresh vault before making large swaps. This prevents linking your trading activity to your main holdings.
            </p>
            <Button variant="secondary" size="sm" fullWidth>
              Create Trading Vault
            </Button>
          </Card>

          {/* Powered By */}
          <Card variant="default" padding="sm">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-text-muted">Powered by</span>
              <span className="text-sm font-semibold text-text-secondary">Jupiter</span>
              <Badge size="xs" variant="success">Best Routes</Badge>
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
        title="Swap Complete!"
        message={`Swapped ${fromAmount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol}`}
        txSignature={swapResult?.signature || ''}
      />
    </div>
  );
}

// Token Selector
function TokenSelector({
  token,
  tokens,
  onSelect,
}: {
  token: Token;
  tokens: Token[];
  onSelect: (token: Token) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-tertiary hover:bg-bg-elevated transition-colors"
      >
        <span className="text-lg">{token.icon}</span>
        <span className="text-sm font-semibold text-text-primary">{token.symbol}</span>
        <ChevronDownIcon />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-48 py-2 bg-bg-tertiary border border-border-primary rounded-xl shadow-xl z-50 animate-dropdown-in">
            {tokens.map((t) => (
              <button
                key={t.symbol}
                onClick={() => {
                  onSelect(t);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-bg-elevated transition-colors ${
                  t.symbol === token.symbol ? "bg-neon-green/10" : ""
                }`}
              >
                <span className="text-lg">{t.icon}</span>
                <div className="text-left">
                  <div className="text-sm font-medium text-text-primary">{t.symbol}</div>
                  <div className="text-xs text-text-muted">{t.name}</div>
                </div>
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
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const WarningIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);
