'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { TierBadge } from '@/components/ui/Badge';
import { ProfileAvatar } from '@/components/ui/Avatar';
import Toggle from '@/components/ui/Toggle';
import { StealthRating } from '@/components/ui/Progress';
import Tabs from '@/components/ui/Tabs';
import VirtualCard3D from '@/components/cards/VirtualCard3D';
import { ActivityTable, ActivityItem } from '@/components/activity/ActivityTable';
import { PointsDisplay, StreakCounter, RankBadge, PointsBadge, StreakBadge } from '@/components/leaderboard';
import { useUserStats } from '@/hooks/useUserStats';
import { useRequireAuth } from '@/hooks/useAuth';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { useNetwork } from '@/hooks/useNetwork';
import { useTokenPrices } from '@/hooks/useTokenPrices';
import {
  CreditCard,
  Plus,
  ChevronRight,
  Wallet,
  Trophy,
  Activity,
  Download,
  Edit,
  ExternalLink,
  RefreshCw,
  Calendar,
  Shield,
  Users,
  Sparkles,
  Flame,
  Copy,
  Check,
  Globe,
  Lock,
  Eye,
  Camera,
} from 'lucide-react';

// Types
interface IssuedCard {
  id: string;
  cardType: 'visa' | 'mastercard';
  amount: number;
  email: string;
  issuedAt: string;
  cardDetails?: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardholderName: string;
  };
}

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  token?: string;
  signature: string;
  status: string;
  createdAt: string;
  metadata?: {
    fromToken?: string;
    toToken?: string;
    toAmount?: number;
    [key: string]: unknown;
  };
}

// Badge tier info
const BADGE_INFO: Record<string, { emoji: string; color: string; name: string }> = {
  none: { emoji: '⚪', color: 'from-gray-500 to-gray-600', name: 'No Badge' },
  bronze: { emoji: '🥉', color: 'from-amber-600 to-amber-800', name: 'Bronze Ghost' },
  silver: { emoji: '🥈', color: 'from-gray-400 to-gray-500', name: 'Silver Shadow' },
  gold: { emoji: '🥇', color: 'from-yellow-500 to-amber-500', name: 'Gold Phantom' },
  diamond: { emoji: '💎', color: 'from-cyan-400 to-blue-500', name: 'Diamond Whale' },
  legendary: { emoji: '👑', color: 'from-purple-500 to-pink-500', name: 'Legendary Titan' },
};

// Virtual Cards Display Component
function VirtualCardsDisplay() {
  const [cards, setCards] = useState<IssuedCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedCards = localStorage.getItem('whale-suite-virtual-cards');
    if (savedCards) {
      try {
        setCards(JSON.parse(savedCards));
      } catch {
        setCards([]);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-text-muted" />
        </div>
        <h4 className="text-text-primary font-medium mb-2">No Cards Yet</h4>
        <p className="text-text-muted text-sm mb-4">
          Create virtual cards funded with crypto for anonymous payments
        </p>
        <Link href="/cards">
          <Button variant="secondary" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Card
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {cards.slice(0, 4).map((card) => (
        <VirtualCard3D
          key={card.id}
          cardType={card.cardType}
          amount={card.amount}
          email={card.email}
          status="issued"
          cardDetails={card.cardDetails}
          size="sm"
          interactive={true}
        />
      ))}

      <Link href="/cards" className="block">
        <div className="h-[200px] rounded-2xl border-2 border-dashed border-border-primary hover:border-neon-green/50 flex flex-col items-center justify-center gap-3 transition-all hover:bg-neon-green/5 cursor-pointer group">
          <div className="w-12 h-12 rounded-full bg-bg-tertiary flex items-center justify-center group-hover:bg-neon-green/20 transition-colors">
            <Plus className="w-6 h-6 text-text-muted group-hover:text-neon-green" />
          </div>
          <span className="text-sm text-text-muted group-hover:text-text-primary">
            Add New Card
          </span>
        </div>
      </Link>
    </div>
  );
}

export default function ProfilePage() {
  const { isAuthenticated, walletAddress, login } = useRequireAuth();
  const { stats, loading: statsLoading, rank, points, streak, refresh: refreshStats } = useUserStats();
  const { get } = useAuthenticatedFetch();
  const { network } = useNetwork();
  const { formatUSD } = useTokenPrices();

  // Activity state
  const [activeTab, setActiveTab] = useState('overview');
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Profile settings state
  const [profileSettings, setProfileSettings] = useState({
    isPublic: false,
    displayName: '',
    avatarUrl: null as string | null,
    visibleStats: {
      points: true,
      privacyScore: true,
      streak: true,
      rank: true,
      badges: true,
      transactions: false,
      hiddenVolume: false,
      memberSince: true,
      activity: false,
    },
  });
  const [, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Fetch profile settings
  const fetchProfileSettings = useCallback(async () => {
    if (!walletAddress) return;
    setProfileLoading(true);
    try {
      const response = await get<{ profile: typeof profileSettings }>(`/api/users/${walletAddress}/profile`);
      if (response.data?.profile) {
        const apiProfile = response.data.profile;
        setProfileSettings(prev => ({
          ...prev,
          isPublic: apiProfile.isPublic ?? prev.isPublic,
          displayName: apiProfile.displayName ?? prev.displayName,
          avatarUrl: apiProfile.avatarUrl ?? prev.avatarUrl,
          visibleStats: {
            ...prev.visibleStats,
            ...(apiProfile.visibleStats || {}),
          },
        }));
      }
    } catch (error) {
      console.error('Failed to fetch profile settings:', error);
    } finally {
      setProfileLoading(false);
    }
  }, [walletAddress, get]);

  // Save profile settings
  const saveProfileSettings = useCallback(async (updates: Partial<typeof profileSettings>) => {
    if (!walletAddress) return;
    setProfileSaving(true);
    try {
      const response = await fetch(`/api/users/${walletAddress}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (data.success && data.profile) {
        const apiProfile = data.profile;
        setProfileSettings(prev => ({
          ...prev,
          isPublic: apiProfile.isPublic ?? prev.isPublic,
          displayName: apiProfile.displayName ?? prev.displayName,
          avatarUrl: apiProfile.avatarUrl ?? prev.avatarUrl,
          visibleStats: {
            ...prev.visibleStats,
            ...(apiProfile.visibleStats || {}),
          },
        }));
      }
    } catch (error) {
      console.error('Failed to save profile settings:', error);
    } finally {
      setProfileSaving(false);
    }
  }, [walletAddress]);

  // Toggle public profile
  const togglePublicProfile = () => {
    const newValue = !profileSettings.isPublic;
    setProfileSettings(prev => ({ ...prev, isPublic: newValue }));
    saveProfileSettings({ isPublic: newValue });
  };

  // Toggle stat visibility
  const toggleStatVisibility = (stat: keyof typeof profileSettings.visibleStats) => {
    const newStats = {
      ...profileSettings.visibleStats,
      [stat]: !profileSettings.visibleStats[stat],
    };
    setProfileSettings(prev => ({ ...prev, visibleStats: newStats }));
    saveProfileSettings({ visibleStats: newStats });
  };

  // Copy profile URL
  const copyProfileUrl = () => {
    const url = `${window.location.origin}/u/${walletAddress}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Fetch profile settings on mount
  useEffect(() => {
    if (walletAddress && activeTab === 'settings') {
      fetchProfileSettings();
    }
  }, [walletAddress, activeTab, fetchProfileSettings]);

  // Fetch activity history
  const fetchActivities = useCallback(async () => {
    if (!isAuthenticated || !walletAddress) return;

    setActivitiesLoading(true);
    try {
      const response = await get<{ transactions: Transaction[] }>(
        `/api/transactions/${walletAddress}?limit=20&network=${network}`
      );

      if (response.data?.transactions) {
        const items: ActivityItem[] = response.data.transactions.map((tx) => {
          const getType = (txType: string): ActivityItem['type'] => {
            if (txType.includes('privacy')) return 'privacy-cash';
            if (txType.includes('shadow')) return 'shadowwire';
            if (txType.includes('swap')) return 'swap';
            if (txType.includes('card')) return 'cards';
            if (txType.includes('bet') || txType.includes('pnp')) return 'pnp';
            return 'swap'; // Default fallback
          };

          // Format description based on transaction type
          let description = `${tx.amount?.toFixed(4) || ''} ${tx.token || 'SOL'}`;
          if (tx.type === 'jupiter_swap' && tx.metadata?.fromToken && tx.metadata?.toToken) {
            const toAmount = tx.metadata.toAmount ? tx.metadata.toAmount.toFixed(4) : '?';
            description = `${tx.amount?.toFixed(4) || ''} ${tx.metadata.fromToken} → ${toAmount} ${tx.metadata.toToken}`;
          }

          // Calculate USD value based on token
          const token = tx.token || 'SOL';
          const usdValue = formatUSD(tx.amount || 0, token);

          return {
            id: tx._id,
            type: getType(tx.type),
            action: tx.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            description,
            amount: tx.amount,
            amountLabel: usdValue, // Proper USD value
            status: tx.status as ActivityItem['status'],
            timestamp: tx.createdAt,
            txSignature: tx.signature,
          };
        });
        setActivities(items);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setActivitiesLoading(false);
    }
  }, [isAuthenticated, walletAddress, network, get, formatUSD]);

  useEffect(() => {
    if (activeTab === 'activity') {
      fetchActivities();
    }
  }, [activeTab, fetchActivities]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'activity', label: 'Activity' },
    { id: 'cards', label: 'Cards' },
    { id: 'settings', label: 'Settings' },
  ];

  // If not authenticated, show connect prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card variant="glow" className="max-w-md p-8 text-center">
          <Wallet className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2">Connect Wallet</h2>
          <p className="text-text-muted mb-6">
            Connect your wallet to view your profile, track activity, and earn points!
          </p>
          <Button variant="primary" onClick={login}>
            Connect Wallet
          </Button>
        </Card>
      </div>
    );
  }

  // User info from stats
  const user = stats?.user;
  const badgeInfo = BADGE_INFO[user?.badgeTier || 'none'];
  const userStats = stats?.stats;

  // Activity counts from transactions (for achievements that shouldn't reset on withdraw)
  const activityCounts = stats?.activity || {};
  const depositCount = activityCounts.privacy_deposit?.count || 0;
  const totalDeposited = activityCounts.privacy_deposit?.amount || 0;
  const transferCount = (activityCounts.shadow_transfer?.count || 0) + (userStats?.privateTransfers || 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Profile</h1>
          <p className="text-sm text-text-secondary">Your Whale Suite identity & stats</p>
        </div>
        <Button variant="ghost" size="sm" onClick={refreshStats} disabled={statsLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Identity Card */}
      <Card variant="glow" padding="lg">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Avatar */}
          <ProfileAvatar
            address={walletAddress || ''}
            imageUrl={profileSettings.avatarUrl}
            size="2xl"
            editable
            onEditClick={() => setShowAvatarModal(true)}
            badge={
              user?.badgeTier && user.badgeTier !== 'none' ? (
                <TierBadge tier={user.badgeTier as 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary'} size="sm" showLabel={false} />
              ) : undefined
            }
          />

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h2 className="text-2xl font-bold text-text-primary">
                {user?.displayName || `Whale #${user?.userNumber || '---'}`}
              </h2>
              {user?.isPremium && <Badge variant="success" size="sm">Premium</Badge>}
              <PointsBadge points={points} />
              {streak > 0 && <StreakBadge streak={streak} />}
            </div>
            <p className="text-sm text-text-muted font-mono mb-3 truncate">
              {walletAddress}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge size="sm" variant="cyan">Early Adopter</Badge>
              {(userStats?.privateTransfers || 0) > 10 && (
                <Badge size="sm" variant="default">Privacy Champion</Badge>
              )}
              {(userStats?.referrals || 0) > 5 && (
                <Badge size="sm" variant="warning">Top Referrer</Badge>
              )}
            </div>
          </div>

          {/* Rank & Points */}
          <div className="flex flex-col items-center gap-3">
            <RankBadge rank={rank} size="md" showDetails={false} />
            <StreakCounter streak={streak} size="sm" />
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card variant="default" padding="sm">
                <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                  <Calendar className="w-3 h-3" />
                  Member Since
                </div>
                <div className="text-lg font-bold text-text-primary">
                  {user?.memberSince ? new Date(user.memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '---'}
                </div>
              </Card>

              <Card variant="default" padding="sm">
                <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                  <Activity className="w-3 h-3" />
                  Total Txs
                </div>
                <div className="text-lg font-bold text-text-primary">
                  {userStats?.totalTransactions?.toLocaleString() || 0}
                </div>
              </Card>

              <Card variant="default" padding="sm">
                <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                  <Shield className="w-3 h-3" />
                  Hidden Volume
                </div>
                <div className="text-lg font-bold text-text-primary">
                  ${(Math.max(0, totalDeposited) * 150).toLocaleString()}
                </div>
              </Card>

              <Card variant="default" padding="sm">
                <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                  <Users className="w-3 h-3" />
                  Referrals
                </div>
                <div className="text-lg font-bold text-text-primary">
                  {userStats?.referrals || 0}
                </div>
              </Card>
            </div>

            {/* Points Summary */}
            <Card variant="default" padding="md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-neon-green" />
                  Points & Rank
                </CardTitle>
              </CardHeader>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-bg-tertiary text-center">
                  <PointsDisplay points={points} size="md" showIcon={false} />
                  <p className="text-xs text-text-muted mt-1">Total Points</p>
                </div>
                <div className="p-4 rounded-xl bg-bg-tertiary text-center">
                  <div className="text-2xl font-bold text-neon-green">+{stats?.points.today || 0}</div>
                  <p className="text-xs text-text-muted mt-1">Today</p>
                </div>
                <div className="p-4 rounded-xl bg-bg-tertiary text-center">
                  <div className="text-2xl font-bold text-text-primary">+{stats?.points.week || 0}</div>
                  <p className="text-xs text-text-muted mt-1">This Week</p>
                </div>
                <div className="p-4 rounded-xl bg-bg-tertiary text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-orange-400">
                    <Flame className="w-5 h-5" />{streak}
                  </div>
                  <p className="text-xs text-text-muted mt-1">Day Streak</p>
                </div>
              </div>
            </Card>

            {/* NFT Badge Display */}
            {user?.badgeTier && user.badgeTier !== 'none' && (
              <Card variant="default" padding="md">
                <CardHeader>
                  <CardTitle>Your NFT Badge</CardTitle>
                  <Button variant="ghost" size="xs">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View on Solscan
                  </Button>
                </CardHeader>

                <div className="flex flex-col md:flex-row gap-6">
                  <div className={`w-full md:w-48 h-48 rounded-2xl bg-gradient-to-br ${badgeInfo.color} p-1 shadow-lg`}>
                    <div className="w-full h-full rounded-xl bg-bg-primary flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-5xl mb-2">{badgeInfo.emoji}</div>
                        <div className="text-sm font-bold" style={{ color: badgeInfo.color.includes('yellow') ? '#facc15' : '#00ff88' }}>
                          {badgeInfo.name}
                        </div>
                        <div className="text-xs text-text-muted">{user.displayName}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="text-xs text-text-muted mb-1">Badge Tier</div>
                      <div className="text-sm text-text-secondary capitalize">{user.badgeTier}</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-muted mb-1">Point Multiplier</div>
                      <div className="text-sm text-neon-green font-medium">
                        {user.badgeTier === 'bronze' ? '1.25x' :
                         user.badgeTier === 'silver' ? '1.5x' :
                         user.badgeTier === 'gold' ? '1.75x' :
                         user.badgeTier === 'diamond' ? '2.0x' :
                         user.badgeTier === 'legendary' ? '2.5x' : '1.0x'}
                      </div>
                    </div>
                    {user.premiumExpiry && (
                      <div>
                        <div className="text-xs text-text-muted mb-1">Premium Expires</div>
                        <div className="text-sm text-neon-green">
                          {new Date(user.premiumExpiry).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Link href="/badges">
                        <Button variant="secondary" size="sm">Upgrade Badge</Button>
                      </Link>
                      <Button variant="ghost" size="sm">View on Magic Eden</Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Achievements */}
            <Card variant="default" padding="md">
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
              </CardHeader>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: '🔒', name: 'First Deposit', unlocked: depositCount >= 1 },
                  { icon: '👻', name: '100 Transfers', unlocked: transferCount >= 100 },
                  { icon: '💎', name: 'Diamond Hands', unlocked: totalDeposited >= 10 },
                  { icon: '🐋', name: 'Whale Status', unlocked: points >= 1000 },
                  { icon: '🎯', name: 'Perfect Score', unlocked: (user?.privacyScore || 0) >= 900 },
                  { icon: '🏆', name: 'Top 100', unlocked: rank <= 100 },
                  { icon: '🌟', name: '50 Referrals', unlocked: (userStats?.referrals || 0) >= 50 },
                  { icon: '👑', name: 'Legendary', unlocked: user?.badgeTier === 'legendary' },
                ].map((achievement, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl text-center ${
                      achievement.unlocked
                        ? 'bg-neon-green/10 border border-neon-green/30'
                        : 'bg-bg-tertiary opacity-50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{achievement.icon}</div>
                    <div className="text-xs font-medium text-text-secondary">{achievement.name}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Stealth Rating */}
            <Card variant="default" padding="md">
              <CardHeader>
                <CardTitle>Stealth Rating</CardTitle>
              </CardHeader>
              <StealthRating score={user?.privacyScore || 0} />
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Total Deposited</span>
                  <span className="text-neon-green">+{Math.floor(Math.max(0, totalDeposited) * 10)} pts</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Private Transfers</span>
                  <span className="text-neon-green">+{transferCount * 5} pts</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Badge Boost</span>
                  <span className="text-neon-green">
                    {user?.badgeTier === 'bronze' ? '+25%' :
                     user?.badgeTier === 'silver' ? '+50%' :
                     user?.badgeTier === 'gold' ? '+75%' :
                     user?.badgeTier === 'diamond' ? '+100%' :
                     user?.badgeTier === 'legendary' ? '+150%' : '+0%'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Leaderboard Position */}
            <Card variant="glow" padding="md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <div className="flex flex-col items-center py-4">
                <RankBadge
                  rank={rank}
                  totalUsers={stats?.leaderboard.totalUsers}
                  percentile={stats?.leaderboard.percentile}
                  size="lg"
                />
              </div>
              <Link href="/intelligence">
                <Button variant="ghost" size="sm" className="w-full">
                  View Full Leaderboard
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </Card>

            {/* Quick Actions */}
            <Card variant="default" padding="md">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <div className="space-y-2">
                <Button variant="secondary" size="sm" fullWidth>
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
                {user?.badgeTier && user.badgeTier !== 'none' && (
                  <Button variant="secondary" size="sm" fullWidth>
                    <Download className="w-4 h-4 mr-2" />
                    Download NFT
                  </Button>
                )}
                <Button variant="ghost" size="sm" fullWidth>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </Card>

            {/* Connected Wallets */}
            <Card variant="default" padding="md">
              <CardHeader>
                <CardTitle>Connected</CardTitle>
              </CardHeader>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-bg-tertiary">
                  <span className="text-lg">👻</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary">Wallet</div>
                    <div className="text-xs text-text-muted truncate">
                      {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                    </div>
                  </div>
                  <Badge size="xs" variant="success">Primary</Badge>
                </div>
              </div>
              <Button variant="ghost" size="sm" fullWidth className="mt-3">
                + Add Wallet
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Activity History
            </CardTitle>
            <Button variant="ghost" size="xs" onClick={fetchActivities} disabled={activitiesLoading}>
              <RefreshCw className={`w-3 h-3 mr-1 ${activitiesLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardHeader>
          <ActivityTable
            items={activities}
            loading={activitiesLoading}
            onRefresh={fetchActivities}
            emptyMessage="No activity yet. Start using privacy features to earn points!"
            maxItems={20}
          />
        </Card>
      )}

      {/* Cards Tab */}
      {activeTab === 'cards' && (
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-neon-cyan" />
              Your Virtual Cards
            </CardTitle>
            <Link href="/cards">
              <Button variant="ghost" size="xs">
                Get New Card
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <VirtualCardsDisplay />
        </Card>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Public Profile Settings */}
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-neon-green" />
                Public Profile
              </CardTitle>
            </CardHeader>

            <div className="space-y-6">
              {/* Public Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-bg-tertiary">
                <div className="flex items-center gap-3">
                  {profileSettings.isPublic ? (
                    <Globe className="w-5 h-5 text-neon-green" />
                  ) : (
                    <Lock className="w-5 h-5 text-text-muted" />
                  )}
                  <div>
                    <p className="font-medium text-text-primary">
                      {profileSettings.isPublic ? 'Profile is Public' : 'Profile is Private'}
                    </p>
                    <p className="text-xs text-text-muted">
                      {profileSettings.isPublic
                        ? 'Anyone with your link can view your profile'
                        : 'Only you can see your profile'}
                    </p>
                  </div>
                </div>
                <Toggle
                  checked={profileSettings.isPublic}
                  onChange={togglePublicProfile}
                  disabled={profileSaving}
                />
              </div>

              {/* Share URL */}
              {profileSettings.isPublic && (
                <div className="p-4 rounded-xl bg-bg-tertiary">
                  <p className="text-xs text-text-muted mb-2">Your Public Profile URL</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/u/${walletAddress}`}
                      className="flex-1 px-3 py-2 rounded-lg bg-bg-elevated border border-border-primary text-sm text-text-secondary font-mono truncate"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={copyProfileUrl}
                    >
                      {copiedUrl ? (
                        <Check className="w-4 h-4 text-neon-green" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profileSettings.displayName || ''}
                  onChange={(e) => setProfileSettings(prev => ({ ...prev, displayName: e.target.value }))}
                  onBlur={() => saveProfileSettings({ displayName: profileSettings.displayName || undefined })}
                  placeholder={`Whale #${user?.userNumber || '---'}`}
                  maxLength={30}
                  className="w-full px-4 py-3 rounded-xl bg-bg-tertiary border border-border-primary text-text-primary placeholder:text-text-muted focus:border-neon-green focus:outline-none transition-colors"
                />
                <p className="text-xs text-text-muted mt-1">
                  Leave empty to use default (Whale #{user?.userNumber})
                </p>
              </div>
            </div>
          </Card>

          {/* Visible Stats Settings */}
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-neon-cyan" />
                Visible Stats
              </CardTitle>
            </CardHeader>

            <p className="text-sm text-text-muted mb-4">
              Choose which stats to show on your public profile
            </p>

            <div className="space-y-3">
              {[
                { id: 'points', label: 'Points', description: 'Your total points earned' },
                { id: 'privacyScore', label: 'Stealth Rating', description: 'Your privacy score' },
                { id: 'streak', label: 'Day Streak', description: 'Consecutive active days' },
                { id: 'rank', label: 'Leaderboard Rank', description: 'Your global rank' },
                { id: 'badges', label: 'NFT Badges', description: 'Your badge collection' },
                { id: 'memberSince', label: 'Member Since', description: 'When you joined' },
                { id: 'transactions', label: 'Transaction Count', description: 'Total private transfers' },
                { id: 'hiddenVolume', label: 'Hidden Volume', description: 'Total hidden USD volume' },
                { id: 'activity', label: 'Recent Activity', description: 'Show your recent transactions' },
              ].map((stat) => (
                <div
                  key={stat.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-bg-tertiary transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{stat.label}</p>
                    <p className="text-xs text-text-muted">{stat.description}</p>
                  </div>
                  <Toggle
                    checked={profileSettings.visibleStats[stat.id as keyof typeof profileSettings.visibleStats]}
                    onChange={() => toggleStatVisibility(stat.id as keyof typeof profileSettings.visibleStats)}
                    disabled={profileSaving || !profileSettings.isPublic}
                    size="sm"
                  />
                </div>
              ))}
            </div>

            {!profileSettings.isPublic && (
              <div className="mt-4 p-3 rounded-lg bg-bg-tertiary border border-border-primary">
                <p className="text-xs text-text-muted flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  Enable public profile to customize visible stats
                </p>
              </div>
            )}
          </Card>

          {/* Avatar Settings */}
          <Card variant="default" padding="md" className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-purple-400" />
                Profile Avatar
              </CardTitle>
              <Badge variant="warning" size="xs">Coming Soon</Badge>
            </CardHeader>

            <div className="flex items-center gap-6">
              <ProfileAvatar
                address={walletAddress || ''}
                imageUrl={profileSettings.avatarUrl}
                size="xl"
              />
              <div className="flex-1">
                <p className="text-sm text-text-primary mb-2">
                  Your avatar is automatically generated based on your wallet address
                </p>
                <p className="text-xs text-text-muted mb-4">
                  Custom avatar upload will be available soon! You&apos;ll be able to upload your own image via Cloudinary.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled
                  className="opacity-50"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Upload Custom Avatar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Avatar Upload Modal (Coming Soon) */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card variant="glow" padding="lg" className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Change Avatar</CardTitle>
            </CardHeader>
            <div className="text-center py-6">
              <Camera className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-bold text-text-primary mb-2">Coming Soon!</h3>
              <p className="text-sm text-text-muted mb-6">
                Custom avatar upload will be available in a future update. For now, your avatar is automatically generated from your wallet address.
              </p>
              <Button variant="primary" onClick={() => setShowAvatarModal(false)}>
                Got it
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
