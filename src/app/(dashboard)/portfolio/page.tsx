"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { WalletMismatchBanner } from "@/components/ui/WalletMismatchBanner";
import RPCProviderSelector from "@/components/portfolio/RPCProviderSelector";
import ProviderSwitchingOverlay from "@/components/portfolio/ProviderSwitchingOverlay";
import RevealBadgeModal from "@/components/modals/RevealBadgeModal";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useWalletAddress } from "@/lib/privy/hooks";
import { useNetworkContext } from "@/providers/NetworkProvider";
import { findAllUserBadges, UserBadge } from "@/hooks/useChannelJoin";
import { useRevealBadge, TIER_INFO } from "@/hooks/useRevealBadge";
import { Connection, PublicKey } from "@solana/web3.js";
import Link from "next/link";
import Pagination from "@/components/ui/Pagination";
import {
  Wallet,
  TrendingUp,
  Image as ImageIcon,
  Shield,
  Activity,
  RefreshCw,
  ExternalLink,
  Layers,
  Sparkles,
  Lock,
  Globe,
  Users,
  Zap,
  BarChart3,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  EyeOff,
  Filter,
} from "lucide-react";

// INCO Devnet RPC
const INCO_DEVNET_RPC = 'https://devnet.helius-rpc.com/?api-key=2572cf42-5399-4552-a902-495bd4cb11c5';

export default function PortfolioPage() {
  const walletAddress = useWalletAddress();
  const { network, switchNetwork } = useNetworkContext();

  const {
    tokens,
    nfts,
    allTransactions, // Use full transactions for filtering/pagination in the page
    stats,
    globalStats,
    provider,
    switchProvider,
    ping,
    loading,
    switching,
    error,
    // Token pagination
    tokenPage,
    totalTokenPages,
    totalTokens,
    setTokenPage,
    tokensPerPage,
    // NFT pagination
    nftPage,
    totalNftPages,
    totalNfts,
    setNftPage,
    nftsPerPage,
    // Activity pagination
    activityPage,
    setActivityPage,
    activityPerPage,
    hasMoreTxFromAPI,
    loadingMoreTx,
    loadMoreTransactionsFromAPI,
    refresh,
  } = usePortfolio(walletAddress);

  // FHE Badge state (pure on-chain, no MongoDB)
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [badgesLoadingState, setBadgesLoadingState] = useState(false);
  const [revealedTiers, setRevealedTiers] = useState<Record<string, number>>({}); // pda -> tier
  const [selectedBadgeForReveal, setSelectedBadgeForReveal] = useState<UserBadge | null>(null);

  // FHE Reveal hook
  const {
    loading: revealLoading,
    currentStep,
    steps,
    error: revealError,
    success: revealSuccess,
    revealedTier,
    txSignature: revealTxSignature,
    revealBadge,
    reset: resetReveal,
  } = useRevealBadge();

  // Fetch user badges from INCO devnet (on-chain only)
  useEffect(() => {
    async function fetchBadges() {
      if (!walletAddress) {
        setUserBadges([]);
        return;
      }

      setBadgesLoadingState(true);
      try {
        const connection = new Connection(INCO_DEVNET_RPC, 'confirmed');
        const userPubkey = new PublicKey(walletAddress);
        const badges = await findAllUserBadges(connection, userPubkey);
        setUserBadges(badges);
      } catch (err) {
        console.error('Error fetching FHE badges:', err);
        setUserBadges([]);
      } finally {
        setBadgesLoadingState(false);
      }
    }

    fetchBadges();
  }, [walletAddress]);

  // Handle reveal success - store the tier
  useEffect(() => {
    if (revealSuccess && revealedTier && selectedBadgeForReveal) {
      const pdaKey = selectedBadgeForReveal.pda.toBase58();
      setRevealedTiers(prev => ({ ...prev, [pdaKey]: revealedTier }));
    }
  }, [revealSuccess, revealedTier, selectedBadgeForReveal]);

  // Start reveal flow
  const handleRevealBadge = async (badge: UserBadge) => {
    setSelectedBadgeForReveal(badge);
    resetReveal();
    await revealBadge(badge);
  };

  // Close reveal modal
  const handleCloseRevealModal = () => {
    setSelectedBadgeForReveal(null);
    resetReveal();
  };

  const [activeTab, setActiveTab] = useState("holdings");
  const [activityFilter, setActivityFilter] = useState<'all' | 'outgoing' | 'incoming'>('all');
  const [sdkFilter, setSdkFilter] = useState<string>('all');

  // Sponsor SDKs only (not system programs) - matches Helius source labels
  // altLabels are alternative names that Helius might use for the same SDK
  const SPONSOR_SDKS = [
    { id: 'PRIVACY_CASH', name: 'Privacy Cash', icon: '🔒', color: '#00ff88', programId: '9fhQBbumKEFuXtMBDw8AaQyAjCorLGJQiS3skWZdQyQD', altLabels: ['ELUSIV', 'PRIVACY'] },
    { id: 'DARKLAKE', name: 'Darklake', icon: '🌑', color: '#6366f1', programId: 'darkr3FB87qAZmgLwKov6Hk9Yiah5UT4rUYu8Zhthw1', altLabels: ['DARK_LAKE', 'DARKLAKE_AMM'] },
    { id: 'SHADOWWIRE', name: 'ShadowWire', icon: '👻', color: '#8b5cf6', programId: 'GQBqwwoikYh7p6KEUHDUu5r9dHHXx9tMGskAPubmFPzD', altLabels: ['SHADOW_WIRE', 'SHADOW'] },
    { id: 'PNP', name: 'PNP', icon: '🎲', color: '#f59e0b', programId: '6fnYZUSyp3vJxTNnayq5S62d363EFaGARnqYux5bqrxb', altLabels: ['PNP_EXCHANGE', 'PRIVACY_PNP'] },
    { id: 'JUPITER', name: 'Jupiter', icon: '🪐', color: '#00D18C', programId: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4', altLabels: ['JUP', 'JUPITER_V6'] },
    { id: 'RAYDIUM', name: 'Raydium', icon: '☀️', color: '#58c4f6', programId: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', altLabels: ['RAYDIUM_V4', 'RAY'] },
    { id: 'ORCA', name: 'Orca', icon: '🐋', color: '#FFCE4F', programId: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc', altLabels: ['ORCA_WHIRLPOOL', 'WHIRLPOOL'] },
    { id: 'METEORA', name: 'Meteora', icon: '☄️', color: '#00F0FF', programId: 'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo', altLabels: ['METEORA_DLMM'] },
    { id: 'PUMP_FUN', name: 'Pump.fun', icon: '🎈', color: '#39FF14', programId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P', altLabels: ['PUMPFUN', 'PUMP'] },
    { id: 'MAGIC_EDEN', name: 'Magic Eden', icon: '✨', color: '#E42575', programId: 'M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K', altLabels: ['MAGICEDEN', 'ME'] },
    { id: 'TENSOR', name: 'Tensor', icon: '🟣', color: '#7c3aed', programId: 'TSWAPaqyCSx2KABk68Shruf4rp7CxcNi8hAsbdwmHbN', altLabels: ['TENSORSWAP'] },
  ];

  // Helper function to match a transaction to an SDK
  const matchTxToSdk = (tx: typeof allTransactions[0]) => {
    const sourceUpper = tx.sourceLabel?.toUpperCase() || '';
    const descLower = tx.description?.toLowerCase() || '';

    return SPONSOR_SDKS.find(sdk => {
      // Match by SDK id
      if (sdk.id === sourceUpper) return true;
      // Match by SDK name
      if (sdk.name.toUpperCase() === sourceUpper) return true;
      // Match by alternative labels
      if (sdk.altLabels?.some(alt => alt === sourceUpper)) return true;
      // Match by description containing SDK name
      if (descLower.includes(sdk.name.toLowerCase())) return true;
      // Match by description containing alternative labels
      if (sdk.altLabels?.some(alt => descLower.includes(alt.toLowerCase()))) return true;
      return false;
    });
  };

  // Get sponsor SDKs that have transactions (check both source label and program ID)
  const availableSdks = useMemo(() => {
    const sdkCounts = new Map<string, number>();

    allTransactions.forEach(tx => {
      const matchedSdk = matchTxToSdk(tx);
      if (matchedSdk) {
        const count = sdkCounts.get(matchedSdk.id) || 0;
        sdkCounts.set(matchedSdk.id, count + 1);
      }
    });

    return SPONSOR_SDKS
      .filter(sdk => sdkCounts.has(sdk.id))
      .map(sdk => ({
        ...sdk,
        count: sdkCounts.get(sdk.id) || 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [allTransactions]);

  // Filter transactions based on direction and SDK filter
  const filteredTransactions = useMemo(() => {
    let filtered = allTransactions;

    // Apply direction filter
    if (activityFilter !== 'all') {
      filtered = filtered.filter(tx => tx.direction === activityFilter);
    }

    // Apply SDK filter
    if (sdkFilter !== 'all') {
      const selectedSdk = SPONSOR_SDKS.find(s => s.id === sdkFilter);
      if (selectedSdk) {
        filtered = filtered.filter(tx => {
          const sourceUpper = tx.sourceLabel?.toUpperCase() || '';
          const descLower = tx.description?.toLowerCase() || '';
          // Match by SDK id
          if (selectedSdk.id === sourceUpper) return true;
          // Match by SDK name
          if (selectedSdk.name.toUpperCase() === sourceUpper) return true;
          // Match by alternative labels
          if (selectedSdk.altLabels?.some(alt => alt === sourceUpper)) return true;
          // Match by description containing SDK name
          if (descLower.includes(selectedSdk.name.toLowerCase())) return true;
          // Match by description containing alternative labels
          if (selectedSdk.altLabels?.some(alt => descLower.includes(alt.toLowerCase()))) return true;
          return false;
        });
      }
    }

    return filtered;
  }, [allTransactions, activityFilter, sdkFilter]);

  // Recalculate pagination for filtered transactions
  const filteredActivityPage = activityPage;
  const filteredTotalPages = Math.ceil(filteredTransactions.length / activityPerPage);
  const paginatedFilteredTransactions = useMemo(() => {
    const start = (filteredActivityPage - 1) * activityPerPage;
    const end = start + activityPerPage;
    return filteredTransactions.slice(start, end);
  }, [filteredTransactions, filteredActivityPage, activityPerPage]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setActivityPage(1);
  }, [activityFilter, sdkFilter, setActivityPage]);

  const tabs = [
    { id: "holdings", label: "Holdings", icon: Wallet },
    { id: "nfts", label: "NFTs", icon: ImageIcon },
    { id: "fhe-badges", label: "FHE Badges", icon: Shield },
    { id: "activity", label: "Activity", icon: Activity },
  ];

  // Format currency
  const formatUSD = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  // Format time ago
  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp * 1000;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Check if on devnet - show mainnet notice
  const isOnDevnet = network === 'devnet';

  return (
    <div className="space-y-6">
      {/* Provider Switching Overlay */}
      <ProviderSwitchingOverlay isVisible={switching} provider={provider} />

      <WalletMismatchBanner />

      {/* Devnet Notice */}
      {isOnDevnet && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gradient-to-r from-warning/20 to-warning/10 border border-warning/40"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-warning">You&apos;re on Devnet</p>
                <p className="text-xs text-text-secondary">Portfolio shows mainnet assets. Switch to mainnet for full experience.</p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => switchNetwork('mainnet')}
            >
              Switch to Mainnet
            </Button>
          </div>
        </motion.div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-neon-green" />
              Portfolio
            </h1>
            <Badge variant="success" size="sm">Mainnet</Badge>
          </div>
          <p className="text-sm text-text-secondary">Track your assets, NFTs & on-chain activity</p>
        </div>

        {/* RPC Provider Selector */}
        <div className="flex items-center gap-3">
          <RPCProviderSelector
            provider={provider}
            onProviderChange={switchProvider}
            ping={ping}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card variant="glow" padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-green/10 to-transparent" />
          <div className="relative">
            <div className="text-xs text-text-muted mb-1">Total Value</div>
            <div className="text-2xl font-bold text-text-primary">{formatUSD(stats.totalValue)}</div>
            <div className="text-xs text-neon-green flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              +{stats.pnlAllTimePercent.toFixed(1)}% all time
            </div>
          </div>
        </Card>

        <Card variant="default" padding="md">
          <div className="text-xs text-text-muted mb-1">24h P&L</div>
          <div className="text-2xl font-bold text-neon-green">+{formatUSD(stats.pnl24h)}</div>
          <div className="text-xs text-neon-green flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3 h-3" />
            +{stats.pnl24hPercent.toFixed(1)}%
          </div>
        </Card>

        <Card variant="default" padding="md">
          <div className="text-xs text-text-muted mb-1">Assets</div>
          <div className="text-2xl font-bold text-neon-cyan">{stats.tokenCount}</div>
          <div className="text-xs text-text-secondary mt-1">SPL Tokens</div>
        </Card>

        <Card variant="default" padding="md">
          <div className="text-xs text-text-muted mb-1">NFTs</div>
          <div className="text-2xl font-bold text-purple-400">{stats.nftCount}</div>
          <div className="text-xs text-text-secondary mt-1">Collectibles</div>
        </Card>
      </div>

      {/* Global App Stats */}
      <Card variant="default" padding="sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Globe className="w-4 h-4 text-neon-cyan" />
            <span>Global Stats</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Users className="w-4 h-4 text-neon-green" />
              <span className="text-sm font-medium text-text-primary">{globalStats.totalUsers.toLocaleString()}</span>
              <span className="text-xs text-text-muted hidden sm:inline">Users</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-text-primary">{globalStats.transactionsToday.toLocaleString()}</span>
              <span className="text-xs text-text-muted hidden sm:inline">Txs Today</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-text-primary">{formatUSD(globalStats.totalVolume)}</span>
              <span className="text-xs text-text-muted hidden sm:inline">Volume</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border-primary pb-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-neon-green/10 text-neon-green border border-neon-green/30"
                  : "text-text-muted hover:text-text-primary hover:bg-bg-elevated"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'nfts' && stats.nftCount > 0 && (
                <Badge variant="default" size="xs">{stats.nftCount}</Badge>
              )}
              {tab.id === 'fhe-badges' && (
                <Badge variant="cyan" size="xs">FHE</Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {loading && tokens.length === 0 && (
        <Card variant="default" padding="lg">
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-neon-green animate-spin mb-4" />
            <p className="text-text-muted">Loading portfolio from {provider}...</p>
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card variant="default" padding="lg" className="border-error/30">
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="w-8 h-8 text-error mb-4" />
            <p className="text-error font-medium mb-2">Failed to load portfolio</p>
            <p className="text-text-muted text-sm mb-4">{error}</p>
            <Button variant="secondary" size="sm" onClick={refresh}>
              Try Again
            </Button>
          </div>
        </Card>
      )}

      {/* Holdings Tab */}
      <AnimatePresence mode="wait">
        {activeTab === "holdings" && !loading && !error && (
          <motion.div
            key="holdings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card variant="default" padding="none">
              {tokens.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Wallet className="w-12 h-12 text-text-muted mb-4" />
                  <p className="text-text-muted font-medium">No tokens found</p>
                  <p className="text-xs text-text-muted mt-1">Connect a wallet with assets to view your portfolio</p>
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="md:hidden divide-y divide-border-secondary">
                    {tokens.map((token, i) => (
                      <motion.div
                        key={token.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="p-4 hover:bg-bg-tertiary/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center overflow-hidden flex-shrink-0">
                              {token.logoURI ? (
                                <img src={token.logoURI} alt={token.symbol} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-lg font-bold text-text-muted">{token.symbol.charAt(0)}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-text-primary">{token.symbol}</span>
                                {token.isNative && <Badge variant="success" size="xs">Native</Badge>}
                              </div>
                              <div className="text-xs text-text-muted truncate">{token.name}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-text-primary">{formatUSD(token.usdValue)}</div>
                            <div className="text-xs text-neon-green">+{token.pnl24h.toFixed(1)}%</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-secondary/30">
                          <div className="text-xs text-text-muted">
                            <span className="font-mono">{token.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                            <span className="ml-1">{token.symbol}</span>
                          </div>
                          <div className="text-xs text-text-secondary">
                            ${token.price.toFixed(token.price < 1 ? 6 : 2)}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border-secondary bg-bg-tertiary">
                          <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-4">Asset</th>
                          <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-4">Balance</th>
                          <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-4">Price</th>
                          <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-4">Value</th>
                          <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-4">24h P&L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tokens.map((token, i) => (
                          <motion.tr
                            key={token.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="border-b border-border-secondary/50 hover:bg-bg-tertiary/50 transition-colors"
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center overflow-hidden">
                                  {token.logoURI ? (
                                    <img src={token.logoURI} alt={token.symbol} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-lg font-bold text-text-muted">{token.symbol.charAt(0)}</span>
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-text-primary">{token.symbol}</span>
                                    {token.isNative && <Badge variant="success" size="xs">Native</Badge>}
                                  </div>
                                  <div className="text-xs text-text-muted">{token.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="text-right py-4 px-4">
                              <div className="text-sm text-text-primary font-mono">
                                {token.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                              </div>
                            </td>
                            <td className="text-right py-4 px-4">
                              <div className="text-sm text-text-secondary">
                                ${token.price.toFixed(token.price < 1 ? 6 : 2)}
                              </div>
                            </td>
                            <td className="text-right py-4 px-4">
                              <div className="text-sm font-medium text-text-primary">
                                {formatUSD(token.usdValue)}
                              </div>
                            </td>
                            <td className="text-right py-4 px-4">
                              <div className="text-sm font-medium text-neon-green">
                                +{token.pnl24h.toFixed(1)}%
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalTokenPages > 1 && (
                    <div className="p-4 border-t border-border-primary">
                      <Pagination
                        currentPage={tokenPage}
                        totalPages={totalTokenPages}
                        totalItems={totalTokens}
                        itemsPerPage={tokensPerPage}
                        onPageChange={setTokenPage}
                      />
                    </div>
                  )}
                </>
              )}
            </Card>
          </motion.div>
        )}

        {/* NFTs Tab */}
        {activeTab === "nfts" && !loading && !error && (
          <motion.div
            key="nfts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {nfts.length === 0 ? (
              <Card variant="default" padding="lg">
                <div className="flex flex-col items-center justify-center py-16">
                  <ImageIcon className="w-12 h-12 text-text-muted mb-4" />
                  <p className="text-text-muted font-medium">No NFTs found</p>
                  <p className="text-xs text-text-muted mt-1">Your collectibles will appear here</p>
                </div>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {nfts.map((nft, i) => (
                    <motion.div
                      key={nft.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card variant="default" padding="none" className="group overflow-hidden hover:border-neon-green/30 transition-all">
                        {/* Image */}
                        <div className="aspect-square bg-bg-tertiary relative overflow-hidden">
                          {nft.image ? (
                            <img
                              src={nft.image}
                              alt={nft.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-12 h-12 text-text-muted" />
                            </div>
                          )}

                          {/* Floor Price Badge */}
                          {nft.floorPrice && (
                            <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-bg-primary/90 backdrop-blur text-xs font-medium text-neon-green">
                              ◎ {nft.floorPrice.toFixed(2)}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-3">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-medium text-text-primary text-sm truncate flex-1">{nft.name}</h3>
                            <a
                              href={`https://solscan.io/token/${nft.mint}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded hover:bg-bg-elevated text-text-muted hover:text-neon-cyan transition-colors flex-shrink-0"
                              title="View on Solscan"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                          {nft.collection && (
                            <div className="flex items-center gap-1 mt-1">
                              {nft.collection.verified && (
                                <Sparkles className="w-3 h-3 text-neon-cyan" />
                              )}
                              <span className="text-xs text-text-muted truncate">{nft.collection.name}</span>
                            </div>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {totalNftPages > 1 && (
                  <Card variant="default" padding="md" className="mt-4">
                    <Pagination
                      currentPage={nftPage}
                      totalPages={totalNftPages}
                      totalItems={totalNfts}
                      itemsPerPage={nftsPerPage}
                      onPageChange={setNftPage}
                    />
                  </Card>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* FHE Badges Tab */}
        {activeTab === "fhe-badges" && (
          <motion.div
            key="fhe-badges"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Reveal Badge Modal */}
            <RevealBadgeModal
              isOpen={!!selectedBadgeForReveal}
              onClose={handleCloseRevealModal}
              badgeId={selectedBadgeForReveal?.pda.toBase58() || ''}
              steps={steps}
              currentStep={currentStep}
              loading={revealLoading}
              error={revealError}
              success={revealSuccess}
              revealedTier={revealedTier}
              txSignature={revealTxSignature}
            />

            {/* Network Switch Banner - Show when on mainnet */}
            {!isOnDevnet && (
              <Card variant="default" padding="md" className="bg-gradient-to-r from-warning/10 to-orange-500/10 border-warning/40">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-warning mb-1">Switch to Devnet Required</h3>
                      <p className="text-xs text-text-secondary">
                        FHE Badges are deployed on INCO Devnet. Switch your wallet network to Devnet to view and reveal your badges.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => switchNetwork('devnet')}
                    className="whitespace-nowrap"
                  >
                    Switch to Devnet
                  </Button>
                </div>
              </Card>
            )}

            {/* Info Banner */}
            <Card variant="default" padding="md" className="bg-gradient-to-r from-neon-cyan/5 to-purple-500/5 border-neon-cyan/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-neon-cyan/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-neon-cyan" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-neon-cyan mb-1">INCO FHE Encrypted Badges</h3>
                  <p className="text-xs text-text-secondary">
                    Your badge tier is encrypted using Fully Homomorphic Encryption (FHE) on INCO Network.
                    Click &quot;Reveal Tier&quot; to decrypt and see your actual badge tier.
                  </p>
                </div>
                <Badge variant="warning" size="sm">Devnet</Badge>
              </div>
            </Card>

            {/* Loading State */}
            {badgesLoadingState && (
              <Card variant="default" padding="lg">
                <div className="flex flex-col items-center justify-center py-8">
                  <RefreshCw className="w-8 h-8 text-neon-cyan animate-spin mb-4" />
                  <p className="text-text-muted">Loading FHE badges from INCO devnet...</p>
                </div>
              </Card>
            )}

            {/* FHE Badges - Mystery or Revealed */}
            {!badgesLoadingState && userBadges.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userBadges.map((badge, index) => {
                  const pdaKey = badge.pda.toBase58();
                  const isRevealed = revealedTiers[pdaKey] !== undefined;
                  const tierNum = isRevealed ? revealedTiers[pdaKey] : null;
                  const tierInfo = tierNum ? TIER_INFO[tierNum] : null;

                  // If revealed, show the actual tier
                  if (isRevealed && tierInfo) {
                    return (
                      <motion.div
                        key={pdaKey}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <Card variant="glow" padding="md" style={{ borderColor: `${tierInfo.hex}40` }}>
                          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                            {/* Revealed Badge Icon */}
                            <div
                              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-lg bg-gradient-to-br ${tierInfo.color} flex-shrink-0`}
                              style={{ boxShadow: `0 8px 32px ${tierInfo.hex}30` }}
                            >
                              {tierInfo.icon}
                            </div>

                            <div className="flex-1 text-center sm:text-left w-full">
                              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2 flex-wrap">
                                <h3 className="font-semibold text-text-primary">{tierInfo.name}</h3>
                                <Badge variant="success" size="xs">Revealed</Badge>
                                {userBadges.length > 1 && (
                                  <Badge variant="default" size="xs">#{index + 1}</Badge>
                                )}
                              </div>

                              {/* Badge PDA */}
                              <div className="flex items-center justify-center sm:justify-start gap-2 mb-3 p-2 rounded-lg bg-bg-tertiary">
                                <Eye className="w-4 h-4 text-neon-green flex-shrink-0" />
                                <span className="text-xs font-mono text-text-muted truncate">
                                  {pdaKey.slice(0, 6)}...{pdaKey.slice(-6)}
                                </span>
                                <a
                                  href={`https://solscan.io/account/${pdaKey}?cluster=devnet`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 hover:text-neon-cyan transition-colors flex-shrink-0"
                                  title="View on Solscan"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>

                              {/* Tier Benefits */}
                              <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 sm:gap-2">
                                <Badge variant="default" size="xs">{[1, 1.25, 1.5, 1.75, 2][tierNum! - 1]}x Multiplier</Badge>
                                <Badge variant="default" size="xs">{[5, 10, 15, 20, 25][tierNum! - 1]}% Commission</Badge>
                                {tierNum! >= 3 && <Badge variant="default" size="xs">Priority Support</Badge>}
                              </div>

                              {/* Badge ID */}
                              <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 text-xs text-text-muted">
                                <span>Badge ID: {badge.badgeId.toString()}</span>
                                <span className="text-text-muted/50">•</span>
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-neon-green"></span>
                                  FHE Decrypted
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  }

                  // Mystery badge - not revealed yet
                  return (
                    <motion.div
                      key={pdaKey}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card variant="default" padding="md" className="border-purple-500/30 relative overflow-hidden">
                        {/* Mystery overlay effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-neon-cyan/5 pointer-events-none" />

                        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4">
                          {/* Mystery Badge Icon */}
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-lg bg-gradient-to-br from-gray-600 to-gray-800 relative flex-shrink-0">
                            <span className="opacity-50">?</span>
                            <div className="absolute inset-0 backdrop-blur-[2px] rounded-2xl" />
                            <Lock className="absolute w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                          </div>

                          <div className="flex-1 text-center sm:text-left w-full">
                            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2 flex-wrap">
                              <h3 className="font-semibold text-text-primary">Mystery Badge</h3>
                              <Badge variant="warning" size="xs">
                                <EyeOff className="w-3 h-3 mr-1" />
                                Hidden
                              </Badge>
                              {userBadges.length > 1 && (
                                <Badge variant="default" size="xs">#{index + 1}</Badge>
                              )}
                            </div>

                            {/* Badge PDA */}
                            <div className="flex items-center justify-center sm:justify-start gap-2 mb-3 p-2 rounded-lg bg-bg-tertiary">
                              <Lock className="w-4 h-4 text-purple-400 flex-shrink-0" />
                              <span className="text-xs font-mono text-text-muted truncate">
                                {pdaKey.slice(0, 6)}...{pdaKey.slice(-6)}
                              </span>
                              <a
                                href={`https://solscan.io/account/${pdaKey}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 hover:text-neon-cyan transition-colors flex-shrink-0"
                                title="View on Solscan"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>

                            {/* Hidden benefits */}
                            <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 sm:gap-2 mb-3">
                              <Badge variant="default" size="xs" className="opacity-60">??? Multiplier</Badge>
                              <Badge variant="default" size="xs" className="opacity-60">???% Commission</Badge>
                            </div>

                            {/* Reveal Button */}
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleRevealBadge(badge)}
                              className="w-full"
                            >
                              <Sparkles className="w-4 h-4 mr-2" />
                              Reveal Tier
                            </Button>

                            {/* Badge ID */}
                            <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 text-xs text-text-muted flex-wrap">
                              <span>Badge ID: {badge.badgeId.toString()}</span>
                              <span className="text-text-muted/50 hidden sm:inline">•</span>
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                                FHE Encrypted
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            ) : !badgesLoadingState && (
              <Card variant="default" padding="lg">
                <div className="flex flex-col items-center justify-center py-12">
                  <Shield className="w-12 h-12 text-text-muted mb-4" />
                  <p className="text-text-muted font-medium">No FHE Badges Found</p>
                  <p className="text-xs text-text-muted mt-1 mb-4">Claim your encrypted badge on the Channels page</p>
                  <Link href="/channels">
                    <Button variant="primary" size="sm">
                      <Layers className="w-4 h-4 mr-2" />
                      Go to Channels
                    </Button>
                  </Link>
                </div>
              </Card>
            )}

            {/* Link to Channels */}
            <Card variant="default" padding="md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Layers className="w-5 h-5 text-neon-cyan flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">Manage Badges on Channels</p>
                    <p className="text-xs text-text-muted">Claim, upgrade, and view badge details</p>
                  </div>
                </div>
                <Link href="/channels" className="w-full sm:w-auto">
                  <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                    View Channels
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && !loading && !error && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Activity Filter Tabs */}
            <Card variant="default" padding="sm">
              <div className="flex flex-col gap-3">
                {/* Direction Filter */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <Filter className="w-4 h-4" />
                    <span>Direction</span>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {[
                      { id: 'all', label: 'All', icon: Activity, count: allTransactions.length },
                      { id: 'outgoing', label: 'Sent', icon: ArrowUpRight, count: allTransactions.filter((t: { direction: string }) => t.direction === 'outgoing').length },
                      { id: 'incoming', label: 'Received', icon: ArrowDownLeft, count: allTransactions.filter((t: { direction: string }) => t.direction === 'incoming').length },
                    ].map((filter) => {
                      const Icon = filter.icon;
                      const isActive = activityFilter === filter.id;
                      return (
                        <button
                          key={filter.id}
                          onClick={() => setActivityFilter(filter.id as 'all' | 'outgoing' | 'incoming')}
                          className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? filter.id === 'outgoing'
                                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                : filter.id === 'incoming'
                                ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                                : 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                              : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated border border-transparent'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{filter.label}</span>
                          <Badge variant="default" size="xs" className="ml-1">{filter.count}</Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SDK Filter (Sponsors Only) */}
                {availableSdks.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-border-secondary">
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <Layers className="w-4 h-4" />
                      <span>SDK</span>
                    </div>

                    {/* Mobile: Dropdown */}
                    <div className="sm:hidden w-full">
                      <select
                        value={sdkFilter}
                        onChange={(e) => setSdkFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs font-medium bg-bg-elevated text-text-primary border border-border-primary focus:outline-none focus:border-neon-cyan"
                      >
                        <option value="all">All SDKs</option>
                        {availableSdks.map((sdk) => (
                          <option key={sdk.id} value={sdk.id}>
                            {sdk.icon} {sdk.name} ({sdk.count})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Desktop: Buttons */}
                    <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-1">
                      <button
                        onClick={() => setSdkFilter('all')}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          sdkFilter === 'all'
                            ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                            : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated border border-transparent'
                        }`}
                      >
                        All
                      </button>
                      {availableSdks.map((sdk) => (
                        <button
                          key={sdk.id}
                          onClick={() => setSdkFilter(sdk.id)}
                          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            sdkFilter === sdk.id
                              ? 'border'
                              : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated border border-transparent'
                          }`}
                          style={sdkFilter === sdk.id ? {
                            backgroundColor: `${sdk.color}20`,
                            color: sdk.color,
                            borderColor: `${sdk.color}40`,
                          } : undefined}
                        >
                          <span>{sdk.icon}</span>
                          {sdk.name}
                          <Badge variant="default" size="xs">{sdk.count}</Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card variant="default" padding="none">
              {filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Activity className="w-12 h-12 text-text-muted mb-4" />
                  <p className="text-text-muted font-medium">
                    {activityFilter === 'all' && sdkFilter === 'all'
                      ? 'No recent activity'
                      : sdkFilter !== 'all'
                      ? `No ${sdkFilter} transactions`
                      : `No ${activityFilter} transactions`}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {activityFilter === 'all' && sdkFilter === 'all'
                      ? 'Your transactions will appear here'
                      : 'Try selecting a different filter'}
                  </p>
                  {(activityFilter !== 'all' || sdkFilter !== 'all') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setActivityFilter('all'); setSdkFilter('all'); }}
                      className="mt-3"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-border-secondary">
                  {paginatedFilteredTransactions.map((tx, i) => (
                    <motion.div
                      key={tx.signature}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="p-3 sm:p-4 hover:bg-bg-tertiary/50 transition-colors"
                    >
                      {/* Mobile Layout */}
                      <div className="flex items-start gap-3">
                        {/* Transaction Type Icon */}
                        <div
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-base sm:text-lg flex-shrink-0"
                          style={{
                            backgroundColor: `${tx.typeColor}20`,
                            color: tx.typeColor,
                          }}
                        >
                          {tx.typeIcon}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Header Row */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                {/* Transaction Type */}
                                <span
                                  className="font-medium text-sm"
                                  style={{ color: tx.typeColor }}
                                >
                                  {tx.typeLabel}
                                </span>

                                {/* Source Badge (Jupiter, Raydium, etc.) */}
                                {tx.sourceLabel && (
                                  <span
                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border"
                                    style={{
                                      backgroundColor: `${tx.sourceColor}20`,
                                      color: tx.sourceColor,
                                      borderColor: `${tx.sourceColor}40`,
                                    }}
                                  >
                                    {tx.sourceLabel}
                                  </span>
                                )}

                                {/* Program Badge - Hide on mobile if source exists */}
                                {tx.programLabel && !tx.sourceLabel && (
                                  <Badge variant="default" size="xs" className="text-[10px] hidden sm:inline-flex">
                                    {tx.programLabel}
                                  </Badge>
                                )}

                                {/* Status Badge */}
                                <Badge
                                  variant={tx.status === 'success' ? 'success' : 'error'}
                                  size="xs"
                                >
                                  {tx.status}
                                </Badge>
                              </div>

                              {/* Description or Swap Details */}
                              <div className="text-xs text-text-muted mt-0.5 truncate max-w-[200px] sm:max-w-[300px]">
                                {tx.swapIn?.amount !== undefined && tx.swapOut?.amount !== undefined ? (
                                  <span className="flex items-center gap-1 flex-wrap">
                                    <span className="text-text-secondary">
                                      {tx.swapIn.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {tx.swapIn.symbol}
                                    </span>
                                    <span className="text-text-muted">→</span>
                                    <span className="text-neon-green">
                                      {tx.swapOut.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {tx.swapOut.symbol}
                                    </span>
                                  </span>
                                ) : (
                                  <span className="truncate block">{tx.description}</span>
                                )}
                              </div>
                            </div>

                            {/* Amount + Link (Desktop aligned right) */}
                            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                              {/* Amount - Only show on desktop or if no swap */}
                              {tx.amount && !tx.swapIn && (
                                <div className="text-sm font-medium text-text-primary font-mono hidden sm:block">
                                  {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {tx.tokenSymbol || 'SOL'}
                                </div>
                              )}

                              {/* External Link */}
                              <a
                                href={`https://solscan.io/tx/${tx.signature}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 sm:p-2 rounded-lg hover:bg-bg-elevated text-text-muted hover:text-neon-cyan transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </a>
                            </div>
                          </div>

                          {/* Footer Row - Time & Fee */}
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-secondary/30 sm:border-0 sm:pt-0 sm:mt-1">
                            <span className="text-xs text-text-muted">{formatTimeAgo(tx.timestamp)}</span>
                            <div className="flex items-center gap-2 text-xs text-text-muted">
                              {/* Amount on mobile */}
                              {tx.amount && !tx.swapIn && (
                                <span className="font-mono sm:hidden">
                                  {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {tx.tokenSymbol || 'SOL'}
                                </span>
                              )}
                              <span className="hidden sm:inline text-text-muted/50">•</span>
                              <span className="font-mono text-[10px] sm:text-xs">{tx.fee.toFixed(5)} SOL</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>

            {/* Pagination */}
            {(filteredTotalPages > 1 || hasMoreTxFromAPI) && (
              <Card variant="default" padding="md" className="mt-4">
                <div className="space-y-3">
                  {filteredTotalPages > 1 && (
                    <Pagination
                      currentPage={activityPage}
                      totalPages={filteredTotalPages}
                      totalItems={filteredTransactions.length}
                      itemsPerPage={activityPerPage}
                      onPageChange={setActivityPage}
                    />
                  )}

                  {/* Load More from API - show when on last page and more available */}
                  {hasMoreTxFromAPI && activityPage >= filteredTotalPages && (
                    <div className="pt-3 border-t border-border-secondary">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={loadMoreTransactionsFromAPI}
                        disabled={loadingMoreTx}
                        fullWidth
                      >
                        {loadingMoreTx ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Loading more transactions...
                          </>
                        ) : (
                          <>
                            <Activity className="w-4 h-4 mr-2" />
                            Load More Transactions
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Activity Legend */}
            <Card variant="default" padding="md" className="mt-4">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
                <span className="text-text-muted">Types:</span>
                <div className="flex items-center gap-1">
                  <span className="text-[#00D18C]">🔄</span>
                  <span className="text-text-secondary">Swap</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[#00ff88]">↗️</span>
                  <span className="text-text-secondary">Transfer</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[#E42575]">🛒</span>
                  <span className="text-text-secondary">NFT</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[#14F195]">🔒</span>
                  <span className="text-text-secondary">Stake</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[#8b5cf6]">🐋</span>
                  <span className="text-text-secondary">Privacy</span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sponsor Footer */}
      <Card variant="default" padding="sm">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-text-muted">
          <span>Powered by</span>
          <a href="https://helius.dev" target="_blank" rel="noopener noreferrer" className="text-[#FF6B35] hover:underline font-medium flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-[#FF6B35] text-white text-[10px] flex items-center justify-center font-bold">H</span>
            Helius
          </a>
          <span>•</span>
          <a href="https://quicknode.com" target="_blank" rel="noopener noreferrer" className="text-[#0052FF] hover:underline font-medium flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-[#0052FF] text-white text-[10px] flex items-center justify-center font-bold">Q</span>
            QuickNode
          </a>
          <span>•</span>
          <a href="https://jup.ag" target="_blank" rel="noopener noreferrer" className="text-[#00D18C] hover:underline font-medium flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-[#00D18C] text-white text-[10px] flex items-center justify-center font-bold">J</span>
            Jupiter
          </a>
        </div>
      </Card>
    </div>
  );
}
