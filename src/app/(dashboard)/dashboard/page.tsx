"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { StealthRating } from "@/components/ui/Progress";
import Badge, { TierBadge } from "@/components/ui/Badge";
import DashboardGate from "@/components/dashboard/DashboardGate";
import { useShadowWire, useWalletBalance, useWhaleFeed } from "@/hooks";
import { usePrivacyCash } from "@/hooks/usePrivacyCash";
import { usePNP } from "@/hooks/usePNP";
import { useAuth } from "@/lib/privy/hooks";

export default function DashboardPage() {
  return (
    <DashboardGate>
      <DashboardContent />
    </DashboardGate>
  );
}

// Actual dashboard content - only rendered when authenticated
function DashboardContent() {
  const router = useRouter();
  const { walletAddress } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [privacyCashInitLoading, setPrivacyCashInitLoading] = useState(false);

  // Public wallet balance - no signature needed
  const { balance: publicBalance, loading: balanceLoading } = useWalletBalance(walletAddress);

  // ShadowWire - NO signature needed to view balance
  const {
    shieldedBalance,
    fetchShieldedBalance,
    loading: shadowWireLoading,
  } = useShadowWire();

  // Privacy Cash - REQUIRES signature to view balance
  const {
    privateBalance: privacyCashBalance,
    initialized: privacyCashInitialized,
    initialize: initializePrivacyCash,
    loading: privacyCashLoading,
  } = usePrivacyCash();

  // Public data - no signature needed
  const { events: whaleEvents, isLoading: whaleFeedLoading } = useWhaleFeed({ limit: 10 });
  const { markets, loading: marketsLoading, formatVolume, isMarketActive } = usePNP();

  // Fetch ShadowWire balance on mount (no signature needed)
  useEffect(() => {
    fetchShieldedBalance();
  }, [fetchShieldedBalance]);

  // Handle Privacy Cash initialization (requires signature)
  const handleInitPrivacyCash = async () => {
    if (privacyCashInitialized) return;
    setPrivacyCashInitLoading(true);
    try {
      await initializePrivacyCash();
    } finally {
      setPrivacyCashInitLoading(false);
    }
  };

  // Calculate balances
  const shadowWireSOL = shieldedBalance?.available ? shieldedBalance.available / 1e9 : 0;
  const privacyCashSOL = privacyCashBalance?.balance || 0;
  const totalHiddenSOL = shadowWireSOL + (privacyCashInitialized ? privacyCashSOL : 0);

  // Active PNP markets
  const activeMarkets = markets.filter(m => isMarketActive(m)).slice(0, 3);

  // Format time
  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Quick actions
  const quickActions = [
    { icon: "🛡️", label: "Shield", desc: "Privacy Cash", href: "/privacy", badge: "$15K" },
    { icon: "👻", label: "Ghost Send", desc: "ShadowWire", href: "/transfer", badge: "$15K" },
    { icon: "💱", label: "Swap", desc: "Jupiter", href: "/swap" },
    { icon: "🎲", label: "Predict", desc: "PNP Markets", href: "/markets", badge: "$2.5K" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Command Center</h1>
          <p className="text-sm text-text-secondary">
            {walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TierBadge tier="gold" size="sm" />
          <Badge variant="success" dot pulse>Premium Active</Badge>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Public Balance - No signature needed */}
        <Card variant="default" padding="md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-text-muted">Public Balance</span>
            <span className="text-xs text-warning">⚠️ Visible</span>
          </div>
          <div className="text-2xl font-bold text-text-primary mb-1">
            {balanceLoading ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              `${publicBalance.toFixed(4)} SOL`
            )}
          </div>
          <div className="text-xs text-text-secondary">Anyone can see this</div>
        </Card>

        {/* ShadowWire Pool - NO signature needed */}
        <Card variant="glow" padding="md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-text-muted">ShadowWire</span>
            <Badge size="xs" variant="success">$15K</Badge>
          </div>
          <div className="text-2xl font-bold text-neon-green mb-1">
            {shadowWireLoading ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              `${shadowWireSOL.toFixed(4)} SOL`
            )}
          </div>
          <div className="text-xs text-text-secondary">Bulletproof ZK</div>
        </Card>

        {/* Privacy Cash Pool - REQUIRES signature to view */}
        <Card variant="default" padding="md" className="border-neon-cyan/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-text-muted">Privacy Cash</span>
            <Badge size="xs" variant="cyan">$15K</Badge>
          </div>
          {privacyCashInitialized ? (
            <>
              <div className="text-2xl font-bold text-neon-cyan mb-1">
                {privacyCashLoading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  `${privacyCashSOL.toFixed(4)} SOL`
                )}
              </div>
              <div className="text-xs text-text-secondary">Light Protocol ZK</div>
            </>
          ) : (
            <button
              onClick={handleInitPrivacyCash}
              disabled={privacyCashInitLoading}
              className="text-left w-full"
            >
              <div className="text-sm text-neon-cyan hover:text-neon-cyan/80 transition-colors underline mb-1">
                {privacyCashInitLoading ? "Signing..." : "Click to reveal (requires signature)"}
              </div>
              <div className="text-xs text-text-secondary">Light Protocol ZK</div>
            </button>
          )}
        </Card>

        {/* Total Hidden */}
        <Card variant="default" padding="md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-text-muted">Total Hidden</span>
            <Badge size="xs" variant="success">
              {privacyCashInitialized ? "2 Pools" : "1 Pool"}
            </Badge>
          </div>
          <div className="text-2xl font-bold text-text-primary mb-1">
            {shadowWireLoading ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              `${totalHiddenSOL.toFixed(4)} SOL`
            )}
          </div>
          <div className="text-xs text-text-secondary">
            {privacyCashInitialized ? "Combined pools" : "Sign Privacy Cash to see total"}
          </div>
        </Card>
      </div>

      {/* Quick Actions & Stealth Rating */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <Card variant="default" padding="md" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Privacy Tools</CardTitle>
            <Badge size="xs" variant="success">$32.5K Bounties</Badge>
          </CardHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => router.push(action.href)}
                className="p-4 rounded-xl bg-bg-tertiary border border-border-secondary hover:border-neon-green/40 hover:bg-bg-elevated transition-all text-center group relative"
              >
                {action.badge && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-medium bg-neon-green/10 text-neon-green rounded">
                    {action.badge}
                  </span>
                )}
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
            <StealthRating score={totalHiddenSOL > 0 ? 750 : 250} />
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 rounded-lg bg-bg-tertiary">
                <div className="text-sm font-semibold text-neon-green">
                  {totalHiddenSOL > 0 ? `${totalHiddenSOL.toFixed(2)}` : "0"} SOL
                </div>
                <div className="text-[10px] text-text-muted">Hidden</div>
              </div>
              <div className="p-2 rounded-lg bg-bg-tertiary">
                <div className="text-sm font-semibold text-neon-cyan">
                  {privacyCashInitialized ? "2 Pools" : "1 Pool"}
                </div>
                <div className="text-[10px] text-text-muted">Active</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ShadowWire Info */}
        <Card variant="default" padding="md" className="border-neon-green/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">👻</span>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-text-primary mb-2">ShadowWire - $15K Bounty</h3>
              <p className="text-xs text-text-secondary mb-3">
                Private transfers using Bulletproof ZK proofs. Amount hidden from public view.
              </p>
              <Button size="xs" onClick={() => router.push('/transfer')}>
                Go to Transfer
              </Button>
            </div>
          </div>
        </Card>

        {/* Privacy Cash Info */}
        <Card variant="default" padding="md" className="border-neon-cyan/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-green/20 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🛡️</span>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-text-primary mb-2">Privacy Cash - $15K Bounty</h3>
              <p className="text-xs text-text-secondary mb-3">
                Shield your SOL balance using Light Protocol ZK compression.
              </p>
              <Button size="xs" variant="secondary" onClick={() => router.push('/privacy')}>
                Go to Privacy Cash
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Whale Feed */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {whaleFeedLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-bg-elevated" />
                  <div className="space-y-1">
                    <div className="h-4 w-32 bg-bg-elevated rounded" />
                    <div className="h-3 w-16 bg-bg-elevated rounded" />
                  </div>
                </div>
              </div>
            ))
          ) : whaleEvents && whaleEvents.length > 0 ? (
            whaleEvents.slice(0, 6).map((event, i) => (
              <div
                key={event.id || i}
                className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary hover:bg-bg-elevated transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center text-xs font-bold text-bg-primary">
                    🐋
                  </div>
                  <div>
                    <div className="text-sm text-text-primary">
                      <span className="font-medium text-neon-cyan">{event.whaleId}</span>
                      <span className="text-text-secondary"> {event.eventType?.replace('_', ' ') || 'transferred'}</span>
                    </div>
                    <div className="text-xs text-text-muted">{formatTimeAgo(event.blockTime * 1000)}</div>
                  </div>
                </div>
                <div className="text-sm font-medium text-text-primary">
                  {event.amount ? `${event.amount.toFixed(2)} SOL` : 'N/A'}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-4 text-text-muted text-sm">
              No whale activity detected yet
            </div>
          )}
        </div>
      </Card>

      {/* PNP Markets */}
      <Card variant="default" padding="md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Prediction Markets
            <Badge size="xs" variant="success">$2.5K Bounty</Badge>
          </CardTitle>
          <Button variant="ghost" size="xs" onClick={() => router.push('/markets')}>
            View All →
          </Button>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {marketsLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="p-4 rounded-xl bg-bg-tertiary animate-pulse">
                <div className="h-4 w-3/4 bg-bg-elevated rounded mb-3" />
                <div className="flex justify-between">
                  <div className="h-6 w-16 bg-bg-elevated rounded" />
                  <div className="h-6 w-16 bg-bg-elevated rounded" />
                </div>
              </div>
            ))
          ) : activeMarkets.length > 0 ? (
            activeMarkets.map((market) => (
              <button
                key={market.publicKey}
                onClick={() => router.push('/markets')}
                className="p-4 rounded-xl bg-bg-tertiary border border-border-secondary hover:border-neon-green/40 transition-all text-left"
              >
                <p className="text-sm text-text-primary font-medium mb-2 line-clamp-2">
                  {market.question}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <span className="px-2 py-1 text-xs rounded bg-neon-green/10 text-neon-green">
                      YES {(market.yesPrice * 100).toFixed(0)}¢
                    </span>
                    <span className="px-2 py-1 text-xs rounded bg-error/10 text-error">
                      NO {(market.noPrice * 100).toFixed(0)}¢
                    </span>
                  </div>
                  <span className="text-xs text-text-muted">{formatVolume(market.volume)}</span>
                </div>
              </button>
            ))
          ) : (
            <div className="col-span-full text-center py-4 text-text-muted text-sm">
              No active markets
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
