'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Badge, { TierBadge } from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import Button from '@/components/ui/Button';
import { LeaderboardTable, PointsDisplay, StreakCounter, RankBadge } from '@/components/leaderboard';
import { useLeaderboard, type LeaderboardPeriod } from '@/hooks/useLeaderboard';
import { useUserStats } from '@/hooks/useUserStats';
import { useRequireAuth } from '@/hooks/useAuth';
import { useTokenPrices } from '@/hooks/useTokenPrices';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  RefreshCw,
  Trophy,
  ArrowDownCircle,
  ArrowUpCircle,
  Repeat,
  Dices,
  CreditCard,
  Bell,
  Filter,
  Flame,
  Shield,
  ExternalLink,
  BarChart3,
  Eye,
} from 'lucide-react';

interface GlobalActivity {
  _id: string;
  type: string;
  amount: number;
  token: string;
  signature: string;
  status: string;
  createdAt: string;
  wallet: string;
  userNumber: number;
  displayName: string;
  badgeTier: string;
  userPoints: number;
  sdk?: string;
  metadata?: {
    fromToken?: string;
    toToken?: string;
    toAmount?: number;
    [key: string]: unknown;
  };
}

interface ActivityStats {
  volume24h: number;
  activeUsers: number;
  totalTxs: number;
  netFlow: number;
}

// Event type configurations with enhanced styling
const EVENT_CONFIG: Record<string, {
  icon: typeof Activity;
  gradient: string;
  bgGlow: string;
  label: string;
  action: string;
}> = {
  privacy_deposit: {
    icon: ArrowDownCircle,
    gradient: 'from-emerald-500 to-green-600',
    bgGlow: 'shadow-emerald-500/20',
    label: 'Deposit',
    action: 'deposited',
  },
  privacy_withdraw: {
    icon: ArrowUpCircle,
    gradient: 'from-amber-500 to-orange-600',
    bgGlow: 'shadow-amber-500/20',
    label: 'Withdraw',
    action: 'withdrew',
  },
  shadow_transfer: {
    icon: Shield,
    gradient: 'from-cyan-500 to-blue-600',
    bgGlow: 'shadow-cyan-500/20',
    label: 'Transfer',
    action: 'transferred',
  },
  jupiter_swap: {
    icon: Repeat,
    gradient: 'from-purple-500 to-pink-600',
    bgGlow: 'shadow-purple-500/20',
    label: 'Swap',
    action: 'swapped',
  },
  pnp_bet: {
    icon: Dices,
    gradient: 'from-pink-500 to-rose-600',
    bgGlow: 'shadow-pink-500/20',
    label: 'Bet',
    action: 'placed bet',
  },
  card_order: {
    icon: CreditCard,
    gradient: 'from-orange-500 to-red-600',
    bgGlow: 'shadow-orange-500/20',
    label: 'Card',
    action: 'ordered card',
  },
};

export default function IntelligencePage() {
  const { isAuthenticated, walletAddress } = useRequireAuth();
  const [mainTab, setMainTab] = useState<'feed' | 'leaderboard'>('feed');
  const [feedFilter, setFeedFilter] = useState('all');
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>('all');

  // Activity state
  const [activity, setActivity] = useState<GlobalActivity[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityStats>({
    volume24h: 0,
    activeUsers: 0,
    totalTxs: 0,
    netFlow: 0,
  });
  const [activityLoading, setActivityLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [newActivityCount, setNewActivityCount] = useState(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Hooks
  const { leaderboard, podium, loading: leaderboardLoading, loadMore, pagination, refresh: refreshLeaderboard } = useLeaderboard(leaderboardPeriod);
  const { stats: userStats, rank, points, streak, refresh: refreshUserStats } = useUserStats();
  const { formatUSD: formatTokenUSD } = useTokenPrices();

  // Fetch global activity
  const fetchActivity = useCallback(async (isPolling = false) => {
    if (!isPolling) setActivityLoading(true);

    try {
      const params = new URLSearchParams({
        limit: '50',
        ...(feedFilter !== 'all' && { eventType: feedFilter }),
        ...(isPolling && lastUpdated && { since: lastUpdated }),
      });

      const response = await fetch(`/api/activity/global?${params}`);
      const data = await response.json();

      if (data.success) {
        if (isPolling && data.activity.length > 0) {
          setNewActivityCount(data.activity.length);
          setActivity(prev => [...data.activity, ...prev].slice(0, 100));
          setTimeout(() => setNewActivityCount(0), 3000);
        } else if (!isPolling) {
          setActivity(data.activity || []);
        }

        setActivityStats(data.stats);
        setLastUpdated(data.lastUpdated);
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error);
    } finally {
      setActivityLoading(false);
    }
  }, [feedFilter, lastUpdated]);

  // Initial fetch
  useEffect(() => {
    fetchActivity(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedFilter]);

  // Poll every 10 seconds
  useEffect(() => {
    pollIntervalRef.current = setInterval(() => {
      fetchActivity(true);
    }, 10000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchActivity]);

  // Refresh everything when wallet changes
  useEffect(() => {
    if (walletAddress) {
      fetchActivity(false);
      refreshUserStats();
      refreshLeaderboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]);

  // Format time ago
  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return 'Just now';
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const mainTabs = [
    { id: 'feed', label: 'Live Activity', icon: Activity },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  const feedTabs = [
    { id: 'all', label: 'All Activity' },
    { id: 'privacy_deposit', label: 'Deposits' },
    { id: 'privacy_withdraw', label: 'Withdrawals' },
    { id: 'shadow_transfer', label: 'Transfers' },
    { id: 'jupiter_swap', label: 'Swaps' },
  ];

  const filteredActivity = feedFilter === 'all'
    ? activity
    : activity.filter((a) => a.type === feedFilter);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-secondary via-bg-tertiary to-bg-secondary border border-border-primary p-6">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-neon-green/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-green flex items-center justify-center">
                <Eye className="w-6 h-6 text-bg-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Whale Intelligence</h1>
                <p className="text-sm text-text-secondary">Real-time on-chain activity & analytics</p>
              </div>
            </div>
          </div>

          {/* User Quick Stats */}
          {isAuthenticated && userStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-bg-primary/50 backdrop-blur border border-border-primary"
            >
              <RankBadge rank={rank} size="sm" showDetails={false} />
              <div className="h-8 w-px bg-border-primary" />
              <PointsDisplay points={points} size="sm" showLabel={false} />
              <div className="h-8 w-px bg-border-primary" />
              <StreakCounter streak={streak} size="sm" showLabel={false} />
            </motion.div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: '24h Volume',
            value: formatTokenUSD(activityStats.volume24h, 'SOL'),
            icon: TrendingUp,
            color: 'text-neon-green',
            gradient: 'from-emerald-500/20 to-transparent',
          },
          {
            label: 'Active Whales',
            value: activityStats.activeUsers.toString(),
            icon: Users,
            color: 'text-neon-cyan',
            gradient: 'from-cyan-500/20 to-transparent',
          },
          {
            label: 'Transactions',
            value: activityStats.totalTxs.toString(),
            icon: Zap,
            color: 'text-purple-400',
            gradient: 'from-purple-500/20 to-transparent',
          },
          {
            label: 'Net Flow',
            value: `${activityStats.netFlow >= 0 ? '+' : ''}${formatTokenUSD(Math.abs(activityStats.netFlow), 'SOL')}`,
            icon: activityStats.netFlow >= 0 ? TrendingUp : TrendingDown,
            color: activityStats.netFlow >= 0 ? 'text-neon-green' : 'text-error',
            gradient: activityStats.netFlow >= 0 ? 'from-emerald-500/20 to-transparent' : 'from-red-500/20 to-transparent',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card variant="default" padding="md" className="relative overflow-hidden group hover:border-border-focus transition-colors">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className="relative">
                <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  {stat.label}
                </div>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-2 border-b border-border-primary pb-2">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setMainTab(tab.id as 'feed' | 'leaderboard')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                mainTab === tab.id
                  ? 'bg-gradient-to-r from-neon-green/20 to-neon-cyan/20 text-neon-green border border-neon-green/30'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Feed Tab Content */}
      {mainTab === 'feed' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Activity Feed */}
          <div className="lg:col-span-2">
            <Card variant="default" padding="none" className="overflow-hidden">
              <div className="p-4 border-b border-border-primary bg-gradient-to-r from-bg-tertiary to-bg-secondary">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center">
                      <Activity className="w-5 h-5 text-bg-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">Live Activity Feed</h3>
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                          Live
                        </span>
                        <span>•</span>
                        <span>Updates every 10s</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {newActivityCount > 0 && (
                      <Badge variant="success" size="xs" className="animate-bounce">
                        +{newActivityCount} new
                      </Badge>
                    )}
                    <button
                      onClick={() => fetchActivity(false)}
                      className="p-2 rounded-lg hover:bg-bg-elevated transition-colors"
                    >
                      <RefreshCw className={`w-4 h-4 text-text-muted ${activityLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                <Tabs
                  tabs={feedTabs}
                  activeTab={feedFilter}
                  onChange={setFeedFilter}
                  size="sm"
                />
              </div>

              <div className="p-4 space-y-3 max-h-[650px] overflow-y-auto">
                {activityLoading && activity.length === 0 ? (
                  [...Array(8)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-bg-tertiary/50 rounded-lg animate-pulse">
                      <div className="w-9 h-9 rounded-lg bg-bg-elevated" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 bg-bg-elevated rounded w-32" />
                        <div className="h-3 bg-bg-elevated rounded w-48" />
                      </div>
                      <div className="w-6 h-6 rounded bg-bg-elevated" />
                    </div>
                  ))
                ) : filteredActivity.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto mb-3">
                      <Filter className="w-8 h-8 text-text-muted" />
                    </div>
                    <p className="text-text-muted font-medium">No activity found</p>
                    <p className="text-xs text-text-muted mt-1">Be the first to make a transaction!</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {filteredActivity.map((item, index) => {
                      const config = EVENT_CONFIG[item.type] || {
                        icon: Activity,
                        gradient: 'from-gray-500 to-gray-600',
                        bgGlow: '',
                        label: item.type,
                        action: 'performed',
                      };
                      const Icon = config.icon;
                      const isCurrentUser = item.wallet === walletAddress;

                      return (
                        <motion.div
                          key={item._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.015 }}
                          className={`group relative rounded-lg transition-all ${
                            isCurrentUser
                              ? 'bg-gradient-to-r from-neon-green/10 to-transparent border border-neon-green/30'
                              : 'bg-bg-tertiary/50 hover:bg-bg-elevated border border-transparent hover:border-border-primary'
                          }`}
                        >
                          <div className="px-3 py-2.5">
                            <div className="flex items-center gap-3">
                              {/* Compact Icon */}
                              <div className={`relative w-9 h-9 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0`}>
                                <Icon className="w-4 h-4 text-white" />
                              </div>

                              {/* Content - Compact */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-medium text-sm text-text-primary truncate max-w-[100px]">
                                    {item.displayName}
                                  </span>
                                  {item.badgeTier !== 'none' && (
                                    <TierBadge
                                      tier={item.badgeTier as 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary'}
                                      size="sm"
                                      showLabel={false}
                                    />
                                  )}
                                  {isCurrentUser && (
                                    <Badge variant="success" size="xs">You</Badge>
                                  )}
                                  <span className="text-text-muted text-xs">{config.action}</span>
                                </div>

                                {/* Amount + Meta on same line */}
                                <div className="flex items-center gap-2 mt-0.5 text-xs">
                                  {item.type === 'jupiter_swap' && item.metadata?.fromToken && item.metadata?.toToken ? (
                                    <>
                                      <span className="font-mono text-text-primary">
                                        {item.amount.toFixed(2)} {item.metadata.fromToken}
                                      </span>
                                      <span className="text-text-muted">→</span>
                                      <span className="font-mono text-neon-green">
                                        {item.metadata.toAmount?.toFixed(2) || '?'} {item.metadata.toToken}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="font-mono font-medium text-text-primary">
                                        {item.amount.toFixed(4)} {item.token}
                                      </span>
                                      <span className="text-text-muted">
                                        ({formatTokenUSD(item.amount, item.token)})
                                      </span>
                                    </>
                                  )}
                                  <span className="text-text-muted">•</span>
                                  <span className="text-text-muted">{formatTimeAgo(item.createdAt)}</span>
                                </div>
                              </div>

                              {/* Right side - Tx link */}
                              <a
                                href={`https://solscan.io/tx/${item.signature}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded hover:bg-bg-primary transition-colors text-text-muted hover:text-neon-cyan"
                                title="View on Solscan"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Top Performers */}
            <Card variant="default" padding="none" className="overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-b border-border-primary">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <h3 className="font-semibold text-text-primary">Top Performers</h3>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {podium.slice(0, 5).map((user, i) => (
                  <motion.div
                    key={user.wallet}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      user.wallet === walletAddress
                        ? 'bg-neon-green/10 border border-neon-green/30'
                        : 'bg-bg-tertiary hover:bg-bg-elevated'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                      i === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-600 text-white shadow-lg shadow-yellow-500/30' :
                      i === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600 text-white' :
                      i === 2 ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white' :
                      'bg-bg-elevated text-text-muted'
                    }`}>
                      #{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary truncate">{user.displayName}</span>
                        {user.wallet === walletAddress && <Badge variant="success" size="xs">You</Badge>}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <span className="text-neon-green font-medium">{user.points.toLocaleString()} pts</span>
                        <span>•</span>
                        <span>{user.transactionCount} txs</span>
                        {user.streak > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-0.5 text-orange-400">
                              <Flame className="w-3 h-3" />{user.streak}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {user.badgeTier !== 'none' && (
                      <TierBadge tier={user.badgeTier as 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary'} size="sm" showLabel={false} />
                    )}
                  </motion.div>
                ))}
              </div>
              <div className="p-4 border-t border-border-primary">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setMainTab('leaderboard')}
                >
                  View Full Leaderboard
                </Button>
              </div>
            </Card>

            {/* Flow Analysis */}
            <Card variant="default" padding="md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-neon-cyan" />
                  Flow Analysis
                </CardTitle>
              </CardHeader>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-neon-green font-medium">Deposits</span>
                    <span className="text-warning font-medium">Withdrawals</span>
                  </div>
                  <div className="h-3 bg-bg-primary rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all"
                      style={{
                        width: `${activityStats.netFlow >= 0 ? Math.min(100, 50 + Math.floor(activityStats.netFlow / 2000)) : Math.max(0, 50 + Math.floor(activityStats.netFlow / 2000))}%`,
                      }}
                    />
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                      style={{
                        width: `${activityStats.netFlow >= 0 ? Math.max(0, 50 - Math.floor(activityStats.netFlow / 2000)) : Math.min(100, 50 - Math.floor(activityStats.netFlow / 2000))}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="text-center py-3 rounded-xl bg-bg-tertiary">
                  <div className={`text-xl font-bold ${activityStats.netFlow >= 0 ? 'text-neon-green' : 'text-error'}`}>
                    {activityStats.netFlow >= 0 ? '📈 Bullish' : '📉 Bearish'}
                  </div>
                  <div className="text-xs text-text-muted mt-1">24h Market Sentiment</div>
                </div>
              </div>
            </Card>

            {/* Alerts CTA */}
            <Card variant="glow" padding="md" className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 to-purple-500/10" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="w-5 h-5 text-neon-cyan" />
                  <h3 className="font-semibold text-text-primary">Whale Alerts</h3>
                </div>
                <p className="text-xs text-text-secondary mb-3">
                  Get notified when large whale movements happen on-chain.
                </p>
                <Button variant="secondary" size="sm" className="w-full">
                  Configure Alerts
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Leaderboard Tab Content */}
      {mainTab === 'leaderboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card variant="default" padding="md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Global Leaderboard
                </CardTitle>
                <div className="flex items-center gap-2">
                  <button onClick={refreshLeaderboard} className="p-2 rounded-lg hover:bg-bg-elevated transition-colors">
                    <RefreshCw className={`w-4 h-4 text-text-muted ${leaderboardLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <div className="flex gap-1 bg-bg-tertiary rounded-lg p-1">
                    {(['all', 'weekly', 'monthly'] as LeaderboardPeriod[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => setLeaderboardPeriod(p)}
                        className={`px-3 py-1.5 text-xs rounded-md transition-all capitalize ${
                          leaderboardPeriod === p
                            ? 'bg-neon-green/20 text-neon-green font-medium'
                            : 'text-text-muted hover:text-text-secondary'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>

              <LeaderboardTable
                entries={leaderboard}
                currentUserWallet={walletAddress || undefined}
                loading={leaderboardLoading}
                showPodium={true}
                onLoadMore={loadMore}
                hasMore={pagination?.hasMore}
              />
            </Card>
          </div>

          {/* Your Stats Sidebar */}
          <div className="space-y-4">
            {isAuthenticated && userStats ? (
              <>
                {/* Your Rank */}
                <Card variant="glow" padding="md">
                  <CardHeader>
                    <CardTitle>Your Position</CardTitle>
                  </CardHeader>
                  <div className="flex flex-col items-center py-4">
                    <RankBadge
                      rank={rank}
                      totalUsers={userStats.leaderboard.totalUsers}
                      percentile={userStats.leaderboard.percentile}
                      size="lg"
                    />
                    <div className="mt-4 grid grid-cols-2 gap-4 w-full">
                      <div className="text-center p-3 rounded-xl bg-bg-tertiary">
                        <PointsDisplay points={points} size="md" showIcon={false} />
                      </div>
                      <div className="text-center p-3 rounded-xl bg-bg-tertiary">
                        <StreakCounter streak={streak} size="md" showLabel={false} />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Points Breakdown */}
                <Card variant="default" padding="md">
                  <CardHeader>
                    <CardTitle>Points Earned</CardTitle>
                  </CardHeader>
                  <div className="space-y-2">
                    {[
                      { label: 'Today', value: userStats.points.today, color: 'text-neon-green' },
                      { label: 'This Week', value: userStats.points.week, color: 'text-neon-cyan' },
                      { label: 'This Month', value: userStats.points.month, color: 'text-purple-400' },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between items-center p-3 rounded-xl bg-bg-tertiary">
                        <span className="text-sm text-text-secondary">{item.label}</span>
                        <span className={`text-sm font-bold ${item.color}`}>+{item.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            ) : (
              <Card variant="glow" padding="lg" className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-text-primary mb-2">Join the Leaderboard</h3>
                <p className="text-sm text-text-muted mb-4">
                  Connect your wallet to appear on the leaderboard!
                </p>
                <Button variant="primary" size="sm">
                  Connect Wallet
                </Button>
              </Card>
            )}

            {/* How Points Work */}
            <Card variant="default" padding="md">
              <CardHeader>
                <CardTitle>Earn Points</CardTitle>
              </CardHeader>
              <div className="space-y-2">
                {[
                  { action: 'Private Transfer', points: 25, icon: Shield, color: 'text-cyan-400' },
                  { action: 'Privacy Deposit', points: 10, icon: ArrowDownCircle, color: 'text-emerald-400' },
                  { action: 'Jupiter Swap', points: 5, icon: Repeat, color: 'text-purple-400' },
                  { action: 'Daily Streak', points: '+5%', icon: Flame, color: 'text-orange-400' },
                ].map((item) => (
                  <div key={item.action} className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-tertiary transition-colors">
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                    <span className="flex-1 text-sm text-text-secondary">{item.action}</span>
                    <span className={`text-sm font-medium ${item.color}`}>+{item.points}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
