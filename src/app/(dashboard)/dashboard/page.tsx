"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { StealthRating } from "@/components/ui/Progress";
import Badge, { TierBadge } from "@/components/ui/Badge";
import { useShadowWire, useWalletBalance } from "@/hooks";
import { useAuth } from "@/lib/privy/hooks";

// Mock data for whale feed
const whaleFeed = [
  { whale: "Whale #A34F", action: "deposited", amount: "500 SOL", time: "5m ago" },
  { whale: "Whale #B7C2", action: "transferred", amount: "1,200 SOL", time: "12m ago" },
  { whale: "Whale #D91E", action: "swapped", amount: "50K USDC", time: "23m ago" },
  { whale: "Whale #F45A", action: "withdrew", amount: "200 SOL", time: "45m ago" },
];

export default function DashboardPage() {
  const router = useRouter();
  const { walletAddress } = useAuth();
  const { balance: publicBalance, loading: balanceLoading } = useWalletBalance(walletAddress);
  const {
    shieldedBalance,
    fetchShieldedBalance,
    loading: shadowWireLoading,
  } = useShadowWire();

  const [selectedPeriod, setSelectedPeriod] = useState("24h");

  // Fetch shielded balance on mount
  useEffect(() => {
    if (walletAddress) {
      fetchShieldedBalance();
    }
  }, [walletAddress, fetchShieldedBalance]);

  // Calculate balances
  const shieldedBalanceSOL = shieldedBalance?.available ? shieldedBalance.available / 1e9 : 0;
  const totalBalance = publicBalance + shieldedBalanceSOL;
  const hiddenPercentage = totalBalance > 0 ? ((shieldedBalanceSOL / totalBalance) * 100).toFixed(0) : 0;

  // Quick actions with navigation
  const quickActions = [
    { icon: "🔒", label: "Deposit", desc: "Hide SOL", href: "/transfer" },
    { icon: "👻", label: "Transfer", desc: "Ghost Send", href: "/transfer" },
    { icon: "💱", label: "Swap", desc: "Dark Pool", href: "/swap" },
    { icon: "🎲", label: "Bet", desc: "Anonymous", href: "/markets" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Command Center</h1>
          <p className="text-sm text-text-secondary">
            {walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : 'Connect wallet'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TierBadge tier="gold" size="sm" />
          <Badge variant="success" dot pulse>Premium Active</Badge>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Public Balance */}
        <Card variant="default" padding="md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-text-muted">Public Balance</span>
            <span className="text-xs text-warning">⚠️ Visible on-chain</span>
          </div>
          <div className="text-2xl font-bold text-text-primary mb-1">
            {balanceLoading ? '...' : `${publicBalance.toFixed(4)} SOL`}
          </div>
          <div className="text-xs text-text-secondary">Anyone can see this balance</div>
        </Card>

        {/* Hidden Balance - ShadowWire Pool */}
        <Card variant="glow" padding="md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-text-muted">ShadowWire Pool</span>
            <span className="text-xs text-neon-green">🔒 Private</span>
          </div>
          <div className="text-2xl font-bold text-neon-green mb-1">
            {shadowWireLoading ? '...' : `${shieldedBalanceSOL.toFixed(4)} SOL`}
          </div>
          <div className="text-xs text-text-secondary">Hidden from public view</div>
          <button
            onClick={() => fetchShieldedBalance()}
            className="text-[10px] text-neon-cyan hover:underline mt-1"
          >
            Refresh balance
          </button>
        </Card>

        {/* Total Portfolio */}
        <Card variant="default" padding="md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-text-muted">Total Portfolio</span>
            <Badge size="xs" variant="success">{hiddenPercentage}% Hidden</Badge>
          </div>
          <div className="text-2xl font-bold text-text-primary mb-1">
            {balanceLoading || shadowWireLoading ? '...' : `${totalBalance.toFixed(4)} SOL`}
          </div>
          <div className="text-xs text-text-secondary">Public + Shielded</div>
        </Card>
      </div>

      {/* ShadowWire Info Card */}
      <Card variant="default" padding="md" className="border-neon-green/30">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 flex items-center justify-center flex-shrink-0">
            <ShieldIcon className="w-6 h-6 text-neon-green" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-text-primary mb-2">How ShadowWire Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-text-secondary">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-neon-green font-bold">1.</span>
                  <div>
                    <span className="text-text-primary font-medium">Deposit</span> - Move SOL from public wallet to shielded pool
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-neon-green font-bold">2.</span>
                  <div>
                    <span className="text-text-primary font-medium">Transfer</span> - Send privately using ZK proofs
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="p-2 rounded-lg bg-neon-green/5 border border-neon-green/20">
                  <div className="text-neon-green font-medium mb-1">Amount Hidden</div>
                  <div className="text-[10px]">Transaction amount hidden via Bulletproof ZK proofs. Both parties see each other.</div>
                </div>
                <div className="p-2 rounded-lg bg-neon-cyan/5 border border-neon-cyan/20">
                  <div className="text-neon-cyan font-medium mb-1">Sender Anonymous</div>
                  <div className="text-[10px]">Your identity hidden. Recipient gets SOL in their public wallet.</div>
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="xs" onClick={() => router.push('/transfer')}>
                Go to Transfer
              </Button>
              <Button size="xs" variant="ghost">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions & Stealth Rating */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <Card variant="default" padding="md" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => router.push(action.href)}
                className="p-4 rounded-xl bg-bg-tertiary border border-border-secondary hover:border-neon-green/40 hover:bg-bg-elevated transition-all text-center group"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                  {action.icon}
                </div>
                <div className="text-sm font-medium text-text-primary">{action.label}</div>
                <div className="text-xs text-text-muted">{action.desc}</div>
              </button>
            ))}
          </div>
        </Card>

        {/* Stealth Rating */}
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle>Stealth Rating</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <StealthRating score={shieldedBalanceSOL > 0 ? 750 : 250} />
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 rounded-lg bg-bg-tertiary">
                <div className="text-sm font-semibold text-neon-green">{hiddenPercentage}%</div>
                <div className="text-[10px] text-text-muted">Hidden</div>
              </div>
              <div className="p-2 rounded-lg bg-bg-tertiary">
                <div className="text-sm font-semibold text-neon-cyan">{shieldedBalanceSOL > 0 ? '1+' : '0'}</div>
                <div className="text-[10px] text-text-muted">Pool Txs</div>
              </div>
            </div>
            {shieldedBalanceSOL === 0 && (
              <div className="p-2 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-[10px] text-warning text-center">
                  Deposit SOL to increase your stealth rating
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Pool Stats & Whale Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pool Statistics */}
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle>Your Pool Stats</CardTitle>
            <Button variant="ghost" size="xs" onClick={() => fetchShieldedBalance()}>
              Refresh
            </Button>
          </CardHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neon-green/10 flex items-center justify-center">
                  <span className="text-neon-green">↓</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary">Total Deposited</div>
                  <div className="text-xs text-text-muted">Into shielded pool</div>
                </div>
              </div>
              <div className="text-sm font-medium text-neon-green">
                {shieldedBalance?.deposited ? (shieldedBalance.deposited / 1e9).toFixed(4) : '0.0000'} SOL
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 flex items-center justify-center">
                  <span className="text-neon-cyan">◎</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary">Available Balance</div>
                  <div className="text-xs text-text-muted">Ready for private transfers</div>
                </div>
              </div>
              <div className="text-sm font-medium text-neon-cyan">
                {shieldedBalanceSOL.toFixed(4)} SOL
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <span className="text-purple-400">⚡</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary">Pool Address</div>
                  <div className="text-xs text-text-muted">ShadowWire contract</div>
                </div>
              </div>
              <div className="text-xs font-mono text-text-secondary">
                {shieldedBalance?.pool_address
                  ? `${shieldedBalance.pool_address.slice(0, 4)}...${shieldedBalance.pool_address.slice(-4)}`
                  : 'N/A'}
              </div>
            </div>
          </div>
        </Card>

        {/* Whale Intelligence Feed */}
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle>Whale Intelligence</CardTitle>
            <div className="flex gap-1">
              {["24h", "7d", "30d"].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    selectedPeriod === period
                      ? "bg-neon-green/10 text-neon-green"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </CardHeader>
          <div className="space-y-2">
            {whaleFeed.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary hover:bg-bg-elevated transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center text-xs font-bold text-bg-primary">
                    🐋
                  </div>
                  <div>
                    <div className="text-sm text-text-primary">
                      <span className="font-medium text-neon-cyan">{item.whale}</span>
                      <span className="text-text-secondary"> {item.action}</span>
                    </div>
                    <div className="text-xs text-text-muted">{item.time}</div>
                  </div>
                </div>
                <div className="text-sm font-medium text-text-primary">{item.amount}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Important Info */}
      <Card variant="default" padding="sm" className="border-warning/30 bg-warning/5">
        <div className="flex items-center gap-3">
          <span className="text-lg">⚠️</span>
          <div className="flex-1">
            <p className="text-xs text-warning font-medium">Important: Minimum 0.1 SOL per transaction</p>
            <p className="text-[10px] text-text-muted">
              ShadowWire requires minimum 0.1 SOL for deposits, withdrawals, and transfers (anti-spam protection).
              Balance updates may take 30-60 seconds to reflect.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Shield Icon
const ShieldIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);
