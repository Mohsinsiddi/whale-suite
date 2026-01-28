'use client';

import { useState, useEffect, useCallback } from 'react';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import Button from '@/components/ui/Button';
import { LeaderboardTable, PointsDisplay, StreakCounter, RankBadge } from '@/components/leaderboard';
import { useLeaderboard, type LeaderboardPeriod } from '@/hooks/useLeaderboard';
import { useUserStats } from '@/hooks/useUserStats';
import { useRequireAuth } from '@/hooks/useAuth';
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
  ArrowRightCircle,
  Repeat,
  Dices,
  CreditCard,
  Bell,
  Filter,
  Flame,
} from 'lucide-react';

interface WhaleFeedEvent {
  _id: string;
  whaleId: string;
  eventType: string;
  amount?: number;
  token?: string;
  usdValue?: number;
  signature: string;
  displayText: string;
  blockTime: number;
  createdAt: string;
}

interface FeedStats {
  volume24h: number;
  activeWhales: number;
  largeTxs: number;
  netFlow: number;
}

// Event type icons
const EVENT_ICONS: Record<string, typeof Activity> = {
  large_transfer: ArrowRightCircle,
  privacy_deposit: ArrowDownCircle,
  privacy_withdraw: ArrowUpCircle,
  token_swap: Repeat,
  anonymous_bet: Dices,
  card_order: CreditCard,
};

const EVENT_COLORS: Record<string, string> = {
  large_transfer: 'bg-neon-cyan/20 text-neon-cyan',
  privacy_deposit: 'bg-neon-green/20 text-neon-green',
  privacy_withdraw: 'bg-warning/20 text-warning',
  token_swap: 'bg-purple-500/20 text-purple-400',
  anonymous_bet: 'bg-pink-500/20 text-pink-400',
  card_order: 'bg-orange-500/20 text-orange-400',
};

export default function IntelligencePage() {
  const { isAuthenticated, walletAddress } = useRequireAuth();
  const [mainTab, setMainTab] = useState<'feed' | 'leaderboard'>('feed');
  const [feedFilter, setFeedFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('24h');
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>('all');

  // Data states
  const [feedEvents, setFeedEvents] = useState<WhaleFeedEvent[]>([]);
  const [feedStats, setFeedStats] = useState<FeedStats>({
    volume24h: 0,
    activeWhales: 0,
    largeTxs: 0,
    netFlow: 0,
  });
  const [feedLoading, setFeedLoading] = useState(true);

  // Hooks
  const { leaderboard, podium, loading: leaderboardLoading, loadMore, pagination, refresh: refreshLeaderboard } = useLeaderboard(leaderboardPeriod);
  const { stats: userStats, rank, points, streak } = useUserStats();

  // Fetch whale feed
  const fetchFeed = useCallback(async () => {
    setFeedLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '50',
        ...(feedFilter !== 'all' && { eventType: feedFilter }),
      });

      const response = await fetch(`/api/whale-feed?${params}`);
      const data = await response.json();

      if (data.success) {
        setFeedEvents(data.events || []);

        // Calculate stats from events
        const now = Date.now();
        const dayAgo = now - 24 * 60 * 60 * 1000;
        const recentEvents = (data.events || []).filter(
          (e: WhaleFeedEvent) => new Date(e.createdAt).getTime() > dayAgo
        );

        const uniqueWhales = new Set(recentEvents.map((e: WhaleFeedEvent) => e.whaleId));
        const totalVolume = recentEvents.reduce((sum: number, e: WhaleFeedEvent) => sum + (e.usdValue || 0), 0);
        const deposits = recentEvents
          .filter((e: WhaleFeedEvent) => e.eventType === 'privacy_deposit')
          .reduce((sum: number, e: WhaleFeedEvent) => sum + (e.usdValue || 0), 0);
        const withdraws = recentEvents
          .filter((e: WhaleFeedEvent) => e.eventType === 'privacy_withdraw')
          .reduce((sum: number, e: WhaleFeedEvent) => sum + (e.usdValue || 0), 0);

        setFeedStats({
          volume24h: totalVolume,
          activeWhales: uniqueWhales.size,
          largeTxs: recentEvents.filter((e: WhaleFeedEvent) => (e.usdValue || 0) > 100000).length,
          netFlow: deposits - withdraws,
        });
      }
    } catch (error) {
      console.error('Failed to fetch whale feed:', error);
    } finally {
      setFeedLoading(false);
    }
  }, [feedFilter]);

  // Initial fetch
  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchFeed, 30000);
    return () => clearInterval(interval);
  }, [fetchFeed]);

  // Format time ago
  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Format currency
  const formatUSD = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const mainTabs = [
    { id: 'feed', label: 'Live Feed', icon: Activity },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  const feedTabs = [
    { id: 'all', label: 'All Activity' },
    { id: 'privacy_deposit', label: 'Deposits' },
    { id: 'privacy_withdraw', label: 'Withdrawals' },
    { id: 'large_transfer', label: 'Transfers' },
    { id: 'token_swap', label: 'Swaps' },
  ];

  const filteredFeed = feedFilter === 'all'
    ? feedEvents
    : feedEvents.filter((e) => e.eventType === feedFilter);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Activity className="w-6 h-6 text-neon-cyan" />
            Whale Intelligence
          </h1>
          <p className="text-sm text-text-secondary">Track large movements & compete on the leaderboard</p>
        </div>

        {/* User Stats Quick View */}
        {isAuthenticated && userStats && (
          <div className="flex items-center gap-4 p-3 rounded-xl bg-bg-elevated border border-border-primary">
            <RankBadge rank={rank} size="sm" showDetails={false} />
            <div className="h-8 w-px bg-border-primary" />
            <PointsDisplay points={points} size="sm" showLabel={false} />
            <div className="h-8 w-px bg-border-primary" />
            <StreakCounter streak={streak} size="sm" showLabel={false} />
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card variant="stat" padding="sm">
          <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
            <TrendingUp className="w-3 h-3" />
            24h Volume
          </div>
          <div className="text-lg font-bold text-text-primary">{formatUSD(feedStats.volume24h)}</div>
          <div className="text-xs text-neon-green">+15%</div>
        </Card>

        <Card variant="stat" padding="sm">
          <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
            <Users className="w-3 h-3" />
            Active Whales
          </div>
          <div className="text-lg font-bold text-text-primary">{feedStats.activeWhales}</div>
          <div className="text-xs text-text-muted">Last 24h</div>
        </Card>

        <Card variant="stat" padding="sm">
          <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
            <Zap className="w-3 h-3" />
            Large Txs
          </div>
          <div className="text-lg font-bold text-text-primary">{feedStats.largeTxs}</div>
          <div className="text-xs text-text-muted">&gt;$100K</div>
        </Card>

        <Card variant="stat" padding="sm">
          <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
            {feedStats.netFlow >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            Net Flow
          </div>
          <div className={`text-lg font-bold ${feedStats.netFlow >= 0 ? 'text-neon-green' : 'text-error'}`}>
            {feedStats.netFlow >= 0 ? '+' : ''}{formatUSD(feedStats.netFlow)}
          </div>
          <div className={`text-xs ${feedStats.netFlow >= 0 ? 'text-neon-green' : 'text-error'}`}>
            {feedStats.netFlow >= 0 ? 'Bullish' : 'Bearish'}
          </div>
        </Card>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-2 border-b border-border-primary pb-2">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setMainTab(tab.id as 'feed' | 'leaderboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mainTab === tab.id
                  ? 'bg-neon-green/10 text-neon-green border border-neon-green/30'
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
          {/* Live Feed */}
          <div className="lg:col-span-2">
            <Card variant="default" padding="md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Live Feed
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="success" size="xs" dot pulse>Live</Badge>
                  <button onClick={fetchFeed} className="p-1 rounded hover:bg-bg-elevated transition-colors">
                    <RefreshCw className={`w-4 h-4 text-text-muted ${feedLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <div className="flex gap-1">
                    {['1h', '24h', '7d'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTimeRange(t)}
                        className={`px-2 py-1 text-xs rounded-md transition-colors ${
                          timeRange === t
                            ? 'bg-neon-green/10 text-neon-green'
                            : 'text-text-muted hover:text-text-secondary'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>

              <Tabs
                tabs={feedTabs}
                activeTab={feedFilter}
                onChange={setFeedFilter}
                size="sm"
              />

              <div className="mt-4 space-y-2 max-h-[600px] overflow-y-auto">
                {feedLoading && feedEvents.length === 0 ? (
                  [...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-bg-tertiary rounded-xl animate-pulse" />
                  ))
                ) : filteredFeed.length === 0 ? (
                  <div className="text-center py-8">
                    <Filter className="w-8 h-8 text-text-muted mx-auto mb-2" />
                    <p className="text-text-muted">No activity found</p>
                  </div>
                ) : (
                  filteredFeed.map((event) => {
                    const Icon = EVENT_ICONS[event.eventType] || Activity;
                    const colorClass = EVENT_COLORS[event.eventType] || 'bg-bg-tertiary text-text-muted';
                    const isHighValue = (event.usdValue || 0) > 100000;

                    return (
                      <div
                        key={event._id}
                        className={`p-3 rounded-xl transition-colors ${
                          isHighValue
                            ? 'bg-neon-green/5 border border-neon-green/20'
                            : 'bg-bg-tertiary hover:bg-bg-elevated'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-neon-cyan">{event.whaleId}</span>
                                {isHighValue && <Badge variant="warning" size="xs">Large</Badge>}
                              </div>
                              <div className="text-xs text-text-muted">{formatTimeAgo(event.createdAt)}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            {event.amount && (
                              <div className="text-sm font-semibold text-text-primary">
                                {event.amount.toLocaleString()} {event.token || 'SOL'}
                              </div>
                            )}
                            {event.usdValue && (
                              <div className="text-xs text-text-muted">{formatUSD(event.usdValue)}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Top Performers */}
            <Card variant="default" padding="md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <div className="space-y-3">
                {podium.slice(0, 5).map((user, i) => (
                  <div
                    key={user.wallet}
                    className="flex items-center gap-3 p-2 rounded-lg bg-bg-tertiary"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-600 text-white' :
                      i === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600 text-white' :
                      i === 2 ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white' :
                      'bg-bg-elevated text-text-muted'
                    }`}>
                      #{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-text-primary truncate">{user.displayName}</div>
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <span>{user.points.toLocaleString()} pts</span>
                        {user.streak > 0 && (
                          <span className="flex items-center gap-0.5 text-orange-400">
                            <Flame className="w-3 h-3" />{user.streak}
                          </span>
                        )}
                      </div>
                    </div>
                    {user.badgeTier !== 'none' && (
                      <Badge variant="default" size="xs">{user.badgeTier}</Badge>
                    )}
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3"
                onClick={() => setMainTab('leaderboard')}
              >
                View Full Leaderboard
              </Button>
            </Card>

            {/* Market Sentiment */}
            <Card variant="default" padding="md">
              <CardHeader>
                <CardTitle>Market Sentiment</CardTitle>
              </CardHeader>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neon-green">Bullish</span>
                    <span className="text-text-primary">
                      {feedStats.netFlow >= 0 ? Math.min(100, 50 + Math.floor(feedStats.netFlow / 10000)) : Math.max(0, 50 + Math.floor(feedStats.netFlow / 10000))}%
                    </span>
                  </div>
                  <div className="h-2 bg-bg-primary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-neon-green to-neon-cyan rounded-full transition-all"
                      style={{
                        width: `${feedStats.netFlow >= 0 ? Math.min(100, 50 + Math.floor(feedStats.netFlow / 10000)) : Math.max(0, 50 + Math.floor(feedStats.netFlow / 10000))}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-2 rounded-lg bg-neon-green/10">
                    <div className="text-sm font-semibold text-neon-green">
                      +{formatUSD(Math.abs(feedStats.netFlow > 0 ? feedStats.netFlow : feedStats.volume24h * 0.4))}
                    </div>
                    <div className="text-[10px] text-text-muted">Net Inflow</div>
                  </div>
                  <div className="p-2 rounded-lg bg-error/10">
                    <div className="text-sm font-semibold text-error">
                      -{formatUSD(Math.abs(feedStats.netFlow < 0 ? feedStats.netFlow : feedStats.volume24h * 0.35))}
                    </div>
                    <div className="text-[10px] text-text-muted">Net Outflow</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Alerts CTA */}
            <Card variant="glow" padding="md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Set Alerts
                </CardTitle>
              </CardHeader>
              <p className="text-xs text-text-secondary mb-3">
                Get notified when whales make large movements
              </p>
              <Button variant="secondary" size="sm" className="w-full">
                Configure Alerts
              </Button>
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
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  Global Leaderboard
                </CardTitle>
                <div className="flex items-center gap-2">
                  <button onClick={refreshLeaderboard} className="p-1 rounded hover:bg-bg-elevated transition-colors">
                    <RefreshCw className={`w-4 h-4 text-text-muted ${leaderboardLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <div className="flex gap-1">
                    {(['all', 'weekly', 'monthly'] as LeaderboardPeriod[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => setLeaderboardPeriod(p)}
                        className={`px-2 py-1 text-xs rounded-md transition-colors capitalize ${
                          leaderboardPeriod === p
                            ? 'bg-neon-green/10 text-neon-green'
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
                      <div className="text-center">
                        <PointsDisplay points={points} size="md" showIcon={false} />
                      </div>
                      <div className="text-center">
                        <StreakCounter streak={streak} size="md" showLabel={false} />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Points Breakdown */}
                <Card variant="default" padding="md">
                  <CardHeader>
                    <CardTitle>Points This Week</CardTitle>
                  </CardHeader>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-bg-tertiary">
                      <span className="text-sm text-text-secondary">Today</span>
                      <span className="text-sm font-medium text-neon-green">+{userStats.points.today}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-bg-tertiary">
                      <span className="text-sm text-text-secondary">This Week</span>
                      <span className="text-sm font-medium text-text-primary">+{userStats.points.week}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-bg-tertiary">
                      <span className="text-sm text-text-secondary">This Month</span>
                      <span className="text-sm font-medium text-text-primary">+{userStats.points.month}</span>
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              <Card variant="glow" padding="md" className="text-center">
                <Trophy className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <h3 className="font-semibold text-text-primary mb-2">Join the Leaderboard</h3>
                <p className="text-sm text-text-muted mb-4">
                  Connect your wallet and start earning points to appear on the leaderboard!
                </p>
                <Button variant="primary" size="sm">
                  Connect Wallet
                </Button>
              </Card>
            )}

            {/* How Points Work */}
            <Card variant="default" padding="md">
              <CardHeader>
                <CardTitle>How to Earn Points</CardTitle>
              </CardHeader>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-text-muted">Private Transfer</span>
                  <span className="text-neon-green font-medium">+25 pts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-muted">Privacy Deposit</span>
                  <span className="text-neon-green font-medium">+10 pts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-muted">Virtual Card</span>
                  <span className="text-neon-green font-medium">+50 pts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-muted">Daily Streak</span>
                  <span className="text-orange-400 font-medium">+5%/day</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-muted">Badge Multiplier</span>
                  <span className="text-purple-400 font-medium">up to 2.5x</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
