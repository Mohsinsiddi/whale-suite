"use client";

import { useState } from "react";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { InfoTooltip } from "@/components/ui/Tooltip";

interface Token {
  symbol: string;
  name: string;
  icon: string;
  balance: number;
}

const tokens: Token[] = [
  { symbol: "SOL", name: "Solana", icon: "◎", balance: 124.5 },
  { symbol: "USDC", name: "USD Coin", icon: "$", balance: 5420.0 },
  { symbol: "USDT", name: "Tether", icon: "₮", balance: 1250.0 },
  { symbol: "JUP", name: "Jupiter", icon: "♃", balance: 10000.0 },
  { symbol: "RAY", name: "Raydium", icon: "◈", balance: 500.0 },
];

export default function SwapPage() {
  const [fromToken, setFromToken] = useState(tokens[0]);
  const [toToken, setToToken] = useState(tokens[1]);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [slippage, setSlippage] = useState("0.5");

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
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
                  Balance: {fromToken.balance} {fromToken.symbol}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-2xl font-semibold text-text-primary placeholder:text-text-muted focus:outline-none"
                />
                <TokenSelector token={fromToken} tokens={tokens} onSelect={setFromToken} />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-text-muted">
                  ≈ ${(parseFloat(fromAmount || "0") * 150).toLocaleString()}
                </span>
                <button
                  className="text-xs text-neon-green hover:underline"
                  onClick={() => setFromAmount(fromToken.balance.toString())}
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
                  Balance: {toToken.balance} {toToken.symbol}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={toAmount}
                  onChange={(e) => setToAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-2xl font-semibold text-text-primary placeholder:text-text-muted focus:outline-none"
                />
                <TokenSelector token={toToken} tokens={tokens} onSelect={setToToken} />
              </div>
              <span className="text-xs text-text-muted mt-2 block">
                ≈ ${(parseFloat(toAmount || "0") * 1).toLocaleString()}
              </span>
            </div>

            {/* Route Info */}
            <div className="mt-4 p-3 rounded-xl bg-bg-tertiary">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-text-muted">Rate</span>
                <span className="text-text-secondary">
                  1 {fromToken.symbol} = 150 {toToken.symbol}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs mb-2">
                <div className="flex items-center gap-1">
                  <span className="text-text-muted">Slippage</span>
                  <InfoTooltip content="Maximum price movement you're willing to accept" />
                </div>
                <div className="flex items-center gap-1">
                  {["0.1", "0.5", "1.0"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSlippage(s)}
                      className={`px-2 py-0.5 rounded text-xs transition-colors ${
                        slippage === s
                          ? "bg-neon-green/20 text-neon-green"
                          : "bg-bg-elevated text-text-muted hover:text-text-secondary"
                      }`}
                    >
                      {s}%
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-text-muted">Price Impact</span>
                <span className="text-neon-green">&lt;0.01%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted">Network Fee</span>
                <span className="text-text-secondary">~0.00025 SOL</span>
              </div>
            </div>

            <Button fullWidth className="mt-4" disabled={!fromAmount}>
              Swap Tokens
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
