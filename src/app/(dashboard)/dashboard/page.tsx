"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { StealthRating } from "@/components/ui/Progress";
import Badge, { TierBadge } from "@/components/ui/Badge";
import DashboardGate from "@/components/dashboard/DashboardGate";
import { useShadowWire, useWalletBalance, useWhaleFeed, useNetwork, useUserStats } from "@/hooks";
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

  // User stats (including real privacy score)
  const { stats: userStats } = useUserStats();
  const privacyScore = userStats?.user?.privacyScore || 0;

  // Network state
  const { network, isFeatureAvailable } = useNetwork();
  const isMainnet = network === 'mainnet';

  // Check feature availability
  const shadowWireAvailable = isFeatureAvailable('shadow-wire');
  const privacyCashAvailable = isFeatureAvailable('privacy-cash');
  const pnpAvailable = isFeatureAvailable('pnp-markets');
  const whaleFeedAvailable = isFeatureAvailable('whale-feed');
  const darkPoolAvailable = isFeatureAvailable('dark-pool');

  // Public wallet balance - no signature needed
  const { balance: publicBalance, loading: balanceLoading } = useWalletBalance(walletAddress);

  // ShadowWire - NO signature needed to view balance (only on mainnet)
  const {
    shieldedBalance,
    fetchShieldedBalance,
    loading: shadowWireLoading,
  } = useShadowWire();

  // Privacy Cash - REQUIRES signature to view balance (only on mainnet)
  const {
    privateBalance: privacyCashBalance,
    initialized: privacyCashInitialized,
    initialize: initializePrivacyCash,
    loading: privacyCashLoading,
  } = usePrivacyCash();

  // Public data - no signature needed (only on mainnet)
  const { events: whaleEvents, isLoading: whaleFeedLoading } = useWhaleFeed({ limit: 10 });
  const { markets, loading: marketsLoading, formatVolume, isMarketActive } = usePNP();

  // Fetch ShadowWire balance on mount (only on mainnet)
  useEffect(() => {
    if (shadowWireAvailable) {
      fetchShieldedBalance();
    }
  }, [fetchShieldedBalance, shadowWireAvailable]);

  // Handle Privacy Cash initialization (requires signature)
  const handleInitPrivacyCash = async () => {
    if (privacyCashInitialized || !privacyCashAvailable) return;
    setPrivacyCashInitLoading(true);
    try {
      await initializePrivacyCash();
    } finally {
      setPrivacyCashInitLoading(false);
    }
  };

  // Calculate balances (only if features are available)
  const shadowWireSOL = shadowWireAvailable && shieldedBalance?.available ? shieldedBalance.available / 1e9 : 0;
  const privacyCashSOL = privacyCashAvailable && privacyCashBalance?.balance ? privacyCashBalance.balance : 0;
  const totalHiddenSOL = shadowWireSOL + (privacyCashInitialized && privacyCashAvailable ? privacyCashSOL : 0);

  // Active PNP markets
  const activeMarkets = pnpAvailable ? markets.filter(m => isMarketActive(m)).slice(0, 3) : [];

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

  // Quick actions - filtered by network availability
  const quickActions = [
    { icon: "🛡️", label: "Shield", desc: "Privacy Cash", href: "/privacy", feature: 'privacy-cash' as const },
    { icon: "👻", label: "Ghost Send", desc: "ShadowWire", href: "/transfer", feature: 'shadow-wire' as const },
    { icon: "💱", label: "Swap", desc: "Jupiter", href: "/swap", feature: 'jupiter-swap' as const },
    { icon: "🎲", label: "Predict", desc: "PNP Markets", href: "/markets", feature: 'pnp-markets' as const },
    ...(darkPoolAvailable ? [{ icon: "🌙", label: "Dark Pool", desc: "Beta Testing", href: "/dark-pool", badge: "Beta", feature: 'dark-pool' as const }] : []),
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

      {/* Network Banner - Show on Devnet */}
      {!isMainnet && (
        <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
              <span className="text-xl">🧪</span>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-warning">Devnet Mode</h3>
              <p className="text-xs text-text-secondary">
                You&apos;re on devnet. Some features are mainnet-only. Test tokens have no value.
              </p>
            </div>
            <Badge variant="warning" size="sm">Testing</Badge>
          </div>
        </div>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Public Balance - Always available */}
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
          <div className="text-xs text-text-secondary">
            {isMainnet ? "Anyone can see this" : "Devnet test tokens"}
          </div>
        </Card>

        {/* ShadowWire Pool */}
        {shadowWireAvailable ? (
          <Card variant="glow" padding="md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-text-muted">ShadowWire</span>
              <Badge size="xs" variant="success">ZK Proofs</Badge>
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
        ) : (
          <ComingSoonCard
            title="ShadowWire"
            icon="👻"
            badge="ZK"
            description="Bulletproof ZK transfers"
            network="mainnet"
          />
        )}

        {/* Privacy Cash Pool */}
        {privacyCashAvailable ? (
          <Card variant="default" padding="md" className="border-neon-cyan/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-text-muted">Privacy Cash</span>
              <Badge size="xs" variant="cyan">ZK Proofs</Badge>
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
        ) : (
          <ComingSoonCard
            title="Privacy Cash"
            icon="🛡️"
            badge="ZK"
            description="Light Protocol ZK"
            network="mainnet"
          />
        )}

        {/* Total Hidden / Dark Pool Beta */}
        {isMainnet ? (
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
        ) : (
          <Card variant="default" padding="md" className="border-warning/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-text-muted">Dark Pool</span>
              <Badge size="xs" variant="warning">Beta</Badge>
            </div>
            <div className="text-lg font-bold text-warning mb-1">
              Available for Testing
            </div>
            <div className="text-xs text-text-secondary">ZK swap testing on devnet</div>
            <Button
              size="xs"
              variant="secondary"
              className="mt-2 w-full"
              onClick={() => router.push('/dark-pool')}
            >
              Try Dark Pool
            </Button>
          </Card>
        )}
      </div>

      {/* Quick Actions & Stealth Rating */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <Card variant="default" padding="md" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Privacy Tools</CardTitle>
            <Badge size="xs" variant={isMainnet ? "success" : "warning"}>
              {isMainnet ? "Mainnet" : "Devnet"}
            </Badge>
          </CardHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action, i) => {
              const available = isFeatureAvailable(action.feature);
              return (
                <button
                  key={i}
                  onClick={() => available && router.push(action.href)}
                  disabled={!available}
                  className={`p-4 rounded-xl border transition-all text-center group relative ${
                    available
                      ? "bg-bg-tertiary border-border-secondary hover:border-neon-green/40 hover:bg-bg-elevated cursor-pointer"
                      : "bg-bg-tertiary/50 border-border-secondary/50 cursor-not-allowed opacity-60"
                  }`}
                >
                  {action.badge && (
                    <span className={`absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-medium rounded ${
                      available
                        ? action.badge === "Beta"
                          ? "bg-warning/10 text-warning"
                          : "bg-neon-green/10 text-neon-green"
                        : "bg-text-muted/10 text-text-muted"
                    }`}>
                      {available ? action.badge : "Mainnet"}
                    </span>
                  )}
                  <div className={`text-2xl mb-2 transition-transform ${available ? "group-hover:scale-110" : "grayscale"}`}>
                    {action.icon}
                  </div>
                  <div className={`text-sm font-medium ${available ? "text-text-primary" : "text-text-muted"}`}>
                    {action.label}
                  </div>
                  <div className="text-xs text-text-muted">{action.desc}</div>
                  {!available && (
                    <div className="text-[10px] text-text-muted/60 mt-1">Mainnet only</div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Stealth Rating */}
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle>Stealth Rating</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <StealthRating score={privacyScore} />
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
        {shadowWireAvailable ? (
          <Card variant="default" padding="md" className="border-neon-green/30">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">👻</span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-text-primary mb-2">ShadowWire</h3>
                <p className="text-xs text-text-secondary mb-3">
                  Private transfers using Bulletproof ZK proofs. Amount hidden from public view.
                </p>
                <Button size="xs" onClick={() => router.push('/transfer')}>
                  Go to Transfer
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <ComingSoonFeatureCard
            title="ShadowWire"
            icon="👻"
            description="Private transfers using Bulletproof ZK proofs. Amount hidden from public view."
            partners={["Radr Labs", "Solana Foundation"]}
          />
        )}

        {/* Privacy Cash Info */}
        {privacyCashAvailable ? (
          <Card variant="default" padding="md" className="border-neon-cyan/30">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-green/20 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🛡️</span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-text-primary mb-2">Privacy Cash</h3>
                <p className="text-xs text-text-secondary mb-3">
                  Shield your SOL balance using Light Protocol ZK compression.
                </p>
                <Button size="xs" variant="secondary" onClick={() => router.push('/privacy')}>
                  Go to Privacy Cash
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <ComingSoonFeatureCard
            title="Privacy Cash"
            icon="🛡️"
            description="Shield your SOL balance using Light Protocol ZK compression."
            partners={["Light Protocol", "Helius"]}
          />
        )}
      </div>

      {/* Devnet Features Preview */}
      {!isMainnet && (
        <Card variant="default" padding="md" className="border-warning/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🧪</span> Devnet Testing
            </CardTitle>
            <Badge size="xs" variant="warning">Beta</Badge>
          </CardHeader>

          {/* Available Now */}
          <div className="mb-4">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Available Now</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-bg-tertiary border border-warning/20">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🌙</span>
                  <div>
                    <h4 className="text-sm font-semibold text-warning">Dark Pool</h4>
                    <p className="text-xs text-text-muted">ZK-powered anonymous swaps</p>
                  </div>
                </div>
                <p className="text-xs text-text-secondary mb-3">
                  Test private swaps with zero-knowledge proofs. Coming soon to mainnet.
                </p>
                <Button size="xs" variant="secondary" onClick={() => router.push('/dark-pool')}>
                  Try on Devnet
                </Button>
              </div>
              <div className="p-4 rounded-xl bg-bg-tertiary border border-neon-green/20">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">💸</span>
                  <div>
                    <h4 className="text-sm font-semibold text-neon-green">Standard Transfer</h4>
                    <p className="text-xs text-text-muted">Basic SOL transfers</p>
                  </div>
                </div>
                <p className="text-xs text-text-secondary mb-3">
                  Send test SOL to any address. Get devnet SOL from faucet.
                </p>
                <Button size="xs" onClick={() => router.push('/transfer')}>
                  Send SOL
                </Button>
              </div>
            </div>
          </div>

          {/* Coming Soon SDKs */}
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Coming Soon</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: "🔐", name: "Arcium", desc: "FHE Privacy" },
                { icon: "🌐", name: "Inco", desc: "Confidential Computing" },
                { icon: "⚡", name: "Elusiv", desc: "Private Payments" },
                { icon: "🛡️", name: "Light Protocol", desc: "ZK Compression" },
              ].map((sdk, i) => (
                <div key={i} className="p-3 rounded-xl bg-bg-elevated/50 border border-border-secondary text-center">
                  <span className="text-xl grayscale opacity-60">{sdk.icon}</span>
                  <p className="text-xs font-medium text-text-muted mt-1">{sdk.name}</p>
                  <p className="text-[10px] text-text-muted/60">{sdk.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Whale Feed */}
      {whaleFeedAvailable ? (
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
              [...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-bg-elevated" />
                    <div className="space-y-1">
                      <div className="h-3.5 w-28 bg-bg-elevated rounded" />
                      <div className="h-2.5 w-14 bg-bg-elevated rounded" />
                    </div>
                  </div>
                </div>
              ))
            ) : whaleEvents && whaleEvents.length > 0 ? (
              whaleEvents.slice(0, 6).map((event, i) => (
                <div
                  key={event.id || `whale-event-${i}`}
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
      ) : (
        <ComingSoonSection
          title="Whale Intelligence"
          icon="🐋"
          description="Track large wallet movements, whale accumulation patterns, and market-moving transactions in real-time."
          features={["Real-time whale tracking", "Accumulation alerts", "Market movement signals"]}
        />
      )}

      {/* PNP Markets */}
      {pnpAvailable ? (
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Prediction Markets
              <Badge size="xs" variant="success">P2P</Badge>
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
      ) : (
        <ComingSoonSection
          title="Prediction Markets"
          icon="🎲"
          description="Anonymous prediction markets powered by PNP Protocol. Bet on outcomes without revealing your identity."
          features={["Anonymous betting", "AMM liquidity pools", "P2P markets"]}
        />
      )}
    </div>
  );
}

// Coming Soon Card for Balance Cards
function ComingSoonCard({
  title,
  icon,
  badge,
  description,
  network,
}: {
  title: string;
  icon: string;
  badge?: string;
  description: string;
  network: string;
}) {
  return (
    <Card variant="default" padding="md" className="border-border-secondary/50 opacity-75">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-text-muted">{title}</span>
        {badge && <Badge size="xs" variant="warning">{badge}</Badge>}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl grayscale">{icon}</span>
        <span className="text-lg font-semibold text-text-muted">Coming Soon</span>
      </div>
      <div className="text-xs text-text-muted">{description}</div>
      <div className="mt-2 text-[10px] text-text-muted/60">
        Available on {network}
      </div>
    </Card>
  );
}

// Coming Soon Feature Card for Info Cards
function ComingSoonFeatureCard({
  title,
  icon,
  description,
  partners,
}: {
  title: string;
  icon: string;
  description: string;
  partners: string[];
}) {
  return (
    <Card variant="default" padding="md" className="border-border-secondary/50 relative overflow-hidden">
      {/* Coming Soon overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-bg-secondary/90 to-bg-tertiary/90 backdrop-blur-[1px] z-10 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-bg-elevated border border-border-primary mb-2">
            <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
            <span className="text-sm font-medium text-text-primary">Mainnet Only</span>
          </div>
          <p className="text-xs text-text-muted">Switch to mainnet to use</p>
        </div>
      </div>

      {/* Card content (blurred) */}
      <div className="flex items-start gap-4 opacity-50">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-green/10 to-neon-cyan/10 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl grayscale">{icon}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-text-muted">{title}</h3>
            <Badge size="xs" variant="warning">Coming Soon</Badge>
          </div>
          <p className="text-xs text-text-muted mb-2">{description}</p>
          <div className="flex gap-1">
            {partners.map((partner, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-muted">
                {partner}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

// Coming Soon Section for full-width sections
function ComingSoonSection({
  title,
  icon,
  description,
  features,
}: {
  title: string;
  icon: string;
  description: string;
  features: string[];
}) {
  return (
    <Card variant="default" padding="md" className="border-border-secondary/50">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-bg-tertiary to-bg-elevated border border-border-secondary flex items-center justify-center flex-shrink-0">
          <span className="text-3xl grayscale">{icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-base font-semibold text-text-primary">{title}</h3>
            <Badge size="xs" variant="warning">Mainnet Only</Badge>
          </div>
          <p className="text-sm text-text-secondary mb-3">{description}</p>
          <div className="flex flex-wrap gap-2">
            {features.map((feature, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded-full bg-bg-tertiary text-text-muted border border-border-secondary">
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="flex-shrink-0">
          <div className="px-4 py-3 rounded-xl bg-bg-tertiary border border-border-secondary text-center">
            <div className="text-xs text-text-muted mb-1">Available on</div>
            <div className="flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-neon-green" />
              <span className="text-sm font-medium text-neon-green">Mainnet</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
