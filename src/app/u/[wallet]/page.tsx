"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import WhaleLogo from "@/components/ui/WhaleLogo";
import { ProfileAvatar } from "@/components/ui/Avatar";
import { BADGE_TIERS } from "@/lib/points/config";

interface ActivityItem {
  type: string;
  description: string;
  timestamp: string;
  points?: number;
}

interface PublicProfileData {
  wallet: string;
  userNumber: number;
  badgeTier: string;
  points: number;
  privacyScore: number;
  streak: number;
  stats: {
    hiddenBalance: number;
    privateTransfers: number;
    anonymousBets: number;
    swapVolume: number;
    activeDays: number;
  };
  createdAt: string;
  profile: {
    isPublic: boolean;
    avatarUrl?: string;
    displayName?: string;
    visibleStats: {
      points: boolean;
      privacyScore: boolean;
      streak: boolean;
      rank: boolean;
      badges: boolean;
      transactions: boolean;
      hiddenVolume: boolean;
      memberSince: boolean;
      activity: boolean;
    };
  };
  rank?: number;
  totalUsers?: number;
  percentile?: number;
}

// Format time ago
function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

// Format large numbers
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

export default function PublicProfilePage() {
  const params = useParams();
  const wallet = params.wallet as string;
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/users/${wallet}/profile`);
        const data = await response.json();

        if (!data.success) {
          setError(data.error || "Profile not found");
          return;
        }

        if (!data.profile?.isPublic) {
          setError("This profile is private");
          return;
        }

        setProfile({
          ...data.user,
          profile: data.profile,
        });

        // Fetch activity if enabled (also fetch if transactions is enabled for backwards compat)
        if (data.profile?.visibleStats?.activity || data.profile?.visibleStats?.transactions) {
          try {
            const activityRes = await fetch(`/api/users/${wallet}/activity?limit=5`);
            const activityData = await activityRes.json();
            if (activityData.success) {
              setActivity(activityData.activities || []);
            }
          } catch {
            // Activity fetch failed silently
          }
        }
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [wallet]);

  const copyProfileUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToTwitter = () => {
    const text = `Check out my Whale Suite profile! 🐋\n\n${profile?.points ? `⭐ ${profile.points.toLocaleString()} Points\n` : ''}${profile?.privacyScore ? `🛡️ ${profile.privacyScore}/1000 Stealth\n` : ''}${profile?.rank ? `🏆 Rank #${profile.rank}\n` : ''}\n`;
    const url = window.location.href;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-neon-green/30 border-t-neon-green rounded-full mx-auto mb-4"
          />
          <p className="text-text-muted">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center p-8 rounded-2xl bg-bg-secondary border border-border-primary"
        >
          <div className="w-20 h-20 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-6">
            <LockIcon className="w-10 h-10 text-text-muted" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-3">
            {error === "This profile is private" ? "Private Profile" : "Profile Not Found"}
          </h1>
          <p className="text-text-secondary mb-8">
            {error === "This profile is private"
              ? "This whale prefers to stay hidden in the deep."
              : "This whale hasn't surfaced yet."}
          </p>
          <Link href="/">
            <Button variant="primary" size="lg">
              Explore Whale Suite
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const visible = profile.profile.visibleStats;
  const badgeInfo = BADGE_TIERS[profile.badgeTier as keyof typeof BADGE_TIERS] || BADGE_TIERS.none;
  const displayName = profile.profile.displayName || `Whale #${profile.userNumber}`;
  const privacyPercent = (profile.privacyScore / 1000) * 100;
  const stealthLevel = profile.privacyScore >= 800 ? "Ghost" :
                       profile.privacyScore >= 600 ? "Shadow" :
                       profile.privacyScore >= 400 ? "Stealth" :
                       profile.privacyScore >= 200 ? "Hidden" : "Visible";

  // Calculate achievements
  const achievements = [
    { icon: '🔒', name: 'First Deposit', unlocked: profile.stats.hiddenBalance > 0 || profile.stats.privateTransfers > 0 },
    { icon: '👻', name: '100 Transfers', unlocked: profile.stats.privateTransfers >= 100 },
    { icon: '💎', name: 'Diamond Hands', unlocked: profile.stats.hiddenBalance >= 10 },
    { icon: '🐋', name: 'Whale Status', unlocked: profile.points >= 1000 },
    { icon: '🎯', name: 'Perfect Score', unlocked: profile.privacyScore >= 900 },
    { icon: '🏆', name: 'Top 100', unlocked: (profile.rank || 999) <= 100 },
    { icon: '🔥', name: '7 Day Streak', unlocked: profile.streak >= 7 },
    { icon: '👑', name: 'Legendary', unlocked: profile.badgeTier === 'legendary' },
  ];
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="min-h-screen bg-bg-primary overflow-hidden">
      {/* Static Background - optimized for performance */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-neon-green/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-neon-cyan/8 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border-primary/50 backdrop-blur-xl bg-bg-secondary/80">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/">
            <WhaleLogo size="sm" showText={false} animated={false} className="sm:hidden" />
            <WhaleLogo size="md" showText={true} animated={false} className="hidden sm:flex" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={copyProfileUrl}
              className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-bg-tertiary hover:bg-bg-elevated border border-border-primary hover:border-neon-green/50 transition-all"
              title="Copy profile URL"
            >
              {copied ? (
                <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-neon-green" />
              ) : (
                <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-text-muted" />
              )}
            </button>
            <button
              onClick={shareToTwitter}
              className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-bg-tertiary hover:bg-bg-elevated border border-border-primary hover:border-neon-cyan/50 transition-all"
              title="Share on Twitter"
            >
              <TwitterIcon className="w-4 h-4 sm:w-5 sm:h-5 text-text-muted" />
            </button>
            <Link href="/dashboard">
              <Button variant="primary" size="sm" className="text-xs sm:text-sm px-3 sm:px-4">
                <span className="hidden sm:inline">Open App</span>
                <span className="sm:hidden">App</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8">

        {/* Hero Card - Avatar + Name + Key Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mb-8"
        >
          <div className="relative rounded-3xl overflow-hidden border border-border-primary">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-neon-green/10 via-bg-secondary to-neon-cyan/10" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,255,136,0.2),transparent_50%)]" />

            {/* Content */}
            <div className="relative p-6 md:p-10">
              <div className="flex flex-col lg:flex-row items-center gap-8">

                {/* Avatar Section */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="relative"
                >
                  <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-neon-green/20 via-neon-cyan/20 to-neon-green/20 blur-xl opacity-60" />
                  <div className="relative p-1.5 rounded-2xl bg-gradient-to-br from-neon-green via-neon-cyan to-neon-green">
                    <ProfileAvatar
                      address={profile.wallet}
                      imageUrl={profile.profile.avatarUrl}
                      size="2xl"
                      badge={
                        visible.badges && profile.badgeTier !== "none" ? (
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg border-2 border-bg-primary"
                            style={{ backgroundColor: badgeInfo.color }}
                          >
                            {badgeInfo.icon}
                          </div>
                        ) : undefined
                      }
                    />
                  </div>
                </motion.div>

                {/* Info Section */}
                <div className="flex-1 text-center lg:text-left">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                      <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
                        {displayName}
                      </h1>
                      {visible.badges && profile.badgeTier !== "none" && (
                        <span
                          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 font-medium border rounded-full"
                          style={{ backgroundColor: badgeInfo.color + '20', color: badgeInfo.color, borderColor: badgeInfo.color + '30' }}
                        >
                          {badgeInfo.icon} {badgeInfo.name}
                        </span>
                      )}
                    </div>
                    <p className="text-text-muted font-mono text-sm mb-6 flex items-center justify-center lg:justify-start gap-2">
                      <span className="px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border-primary">
                        {profile.wallet.slice(0, 6)}...{profile.wallet.slice(-6)}
                      </span>
                      {visible.memberSince && (
                        <span className="text-text-muted">
                          • Joined {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                        </span>
                      )}
                    </p>
                  </motion.div>

                  {/* Hero Stats Row */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-2 sm:gap-3"
                  >
                    {visible.points && (
                      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30">
                        <span className="text-2xl sm:text-3xl">⭐</span>
                        <div>
                          <p className="text-lg sm:text-2xl font-bold text-yellow-400">{formatNumber(profile.points)}</p>
                          <p className="text-[10px] sm:text-xs text-yellow-400/70 font-medium">POINTS</p>
                        </div>
                      </div>
                    )}
                    {visible.rank && profile.rank && (
                      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30">
                        <span className="text-2xl sm:text-3xl">{profile.rank <= 3 ? "👑" : profile.rank <= 10 ? "🏆" : "🎖️"}</span>
                        <div>
                          <p className="text-lg sm:text-2xl font-bold text-purple-400">#{profile.rank}</p>
                          <p className="text-[10px] sm:text-xs text-purple-400/70 font-medium">
                            TOP {profile.percentile ? (100 - profile.percentile) : Math.round((profile.rank / (profile.totalUsers || 100)) * 100)}%
                          </p>
                        </div>
                      </div>
                    )}
                    {visible.streak && profile.streak > 0 && (
                      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 col-span-2 sm:col-span-1 justify-center sm:justify-start">
                        <span className="text-2xl sm:text-3xl">🔥</span>
                        <div>
                          <p className="text-lg sm:text-2xl font-bold text-orange-400">{profile.streak}</p>
                          <p className="text-[10px] sm:text-xs text-orange-400/70 font-medium">DAY STREAK</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Two Column Layout for Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Stealth Rating Card */}
          {visible.privacyScore && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative rounded-2xl overflow-hidden border border-neon-green/30"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-neon-green/5 via-bg-secondary to-neon-cyan/5" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-neon-green/20 rounded-full blur-3xl" />

              <div className="relative p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div>
                    <p className="text-xs sm:text-sm text-text-muted mb-1 flex items-center gap-2">
                      <ShieldIcon className="w-3 h-3 sm:w-4 sm:h-4" /> Stealth Rating
                    </p>
                    <div className="flex items-baseline gap-1 sm:gap-2">
                      <span className="text-3xl sm:text-5xl font-bold text-neon-green">{profile.privacyScore}</span>
                      <span className="text-base sm:text-xl text-text-muted">/1000</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-neon-green/10 border border-neon-green/30">
                      <p className="text-base sm:text-xl font-bold text-neon-green">{stealthLevel}</p>
                      <p className="text-[10px] sm:text-xs text-neon-green/70">LEVEL</p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-4 bg-bg-primary rounded-full overflow-hidden border border-border-primary">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${privacyPercent}%` }}
                    transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-neon-green via-neon-cyan to-neon-green rounded-full"
                  />
                </div>

                {/* Privacy Level Scale */}
                <div className="flex justify-between mt-3 text-xs">
                  <span className={`${profile.privacyScore < 200 ? 'text-text-primary font-bold' : 'text-text-muted'}`}>Visible</span>
                  <span className={`${profile.privacyScore >= 200 && profile.privacyScore < 400 ? 'text-text-primary font-bold' : 'text-text-muted'}`}>Hidden</span>
                  <span className={`${profile.privacyScore >= 400 && profile.privacyScore < 600 ? 'text-text-primary font-bold' : 'text-text-muted'}`}>Stealth</span>
                  <span className={`${profile.privacyScore >= 600 && profile.privacyScore < 800 ? 'text-text-primary font-bold' : 'text-text-muted'}`}>Shadow</span>
                  <span className={`${profile.privacyScore >= 800 ? 'text-neon-green font-bold' : 'text-text-muted'}`}>Ghost</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Detailed Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="relative rounded-2xl overflow-hidden border border-border-primary"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-bg-secondary to-bg-tertiary" />

            <div className="relative p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-text-muted mb-3 sm:mb-4 flex items-center gap-2">
                <ChartIcon className="w-3 h-3 sm:w-4 sm:h-4" /> Statistics
              </p>

              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                {visible.transactions && (
                  <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-bg-primary/50 border border-border-primary">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                      <span className="text-base sm:text-lg">🔐</span>
                      <span className="text-xl sm:text-2xl font-bold text-neon-cyan">{profile.stats.privateTransfers}</span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-text-muted">Private Transfers</p>
                  </div>
                )}

                {visible.hiddenVolume && (
                  <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-bg-primary/50 border border-border-primary">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                      <span className="text-base sm:text-lg">💰</span>
                      <span className="text-lg sm:text-2xl font-bold text-neon-green">${formatNumber(profile.stats.hiddenBalance * 230)}</span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-text-muted">Hidden Volume</p>
                  </div>
                )}

                {visible.transactions && profile.stats.swapVolume > 0 && (
                  <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-bg-primary/50 border border-border-primary">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                      <span className="text-base sm:text-lg">💱</span>
                      <span className="text-xl sm:text-2xl font-bold text-purple-400">{profile.stats.swapVolume.toFixed(2)}</span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-text-muted">Swap Volume</p>
                  </div>
                )}

                {visible.transactions && profile.stats.anonymousBets > 0 && (
                  <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-bg-primary/50 border border-border-primary">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                      <span className="text-base sm:text-lg">🎲</span>
                      <span className="text-xl sm:text-2xl font-bold text-yellow-400">{profile.stats.anonymousBets}</span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-text-muted">Predictions</p>
                  </div>
                )}

                {visible.memberSince && (
                  <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-bg-primary/50 border border-border-primary">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                      <span className="text-base sm:text-lg">📅</span>
                      <span className="text-sm sm:text-lg font-bold text-text-primary">
                        {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-text-muted">Member Since</p>
                  </div>
                )}

                {visible.badges && (
                  <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-bg-primary/50 border border-border-primary">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                      <span className="text-base sm:text-lg">🏆</span>
                      <span className="text-xl sm:text-2xl font-bold text-orange-400">{unlockedCount}/{achievements.length}</span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-text-muted">Achievements</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Achievements Section */}
        {visible.badges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6 sm:mb-8"
          >
            <h2 className="text-base sm:text-xl font-bold text-text-primary mb-3 sm:mb-4 flex items-center gap-2">
              <span>🏆</span> Achievements
              <span className="text-xs sm:text-sm font-normal text-text-muted ml-1 sm:ml-2">({unlockedCount}/{achievements.length})</span>
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
              {achievements.map((achievement, i) => (
                <div
                  key={i}
                  className={`p-2 sm:p-4 rounded-lg sm:rounded-xl text-center transition-transform hover:scale-105 ${
                    achievement.unlocked
                      ? 'bg-gradient-to-br from-neon-green/20 to-neon-cyan/10 border border-neon-green/40 shadow-lg shadow-neon-green/20'
                      : 'bg-bg-tertiary/30 border border-border-primary opacity-50'
                  }`}
                >
                  <div className={`text-xl sm:text-3xl mb-1 sm:mb-2 ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                    {achievement.icon}
                  </div>
                  <div className={`text-[8px] sm:text-[10px] font-medium leading-tight ${achievement.unlocked ? 'text-text-primary' : 'text-text-muted'}`}>
                    {achievement.name}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Activity Section */}
        {(visible.activity || visible.transactions) && activity.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
              <span>📊</span> Recent Activity
            </h2>
            <div className="space-y-2">
              {activity.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl bg-bg-secondary/50 border border-border-primary hover:border-neon-green/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center text-xl">
                      {item.type === 'transfer' ? '👻' :
                       item.type === 'swap' ? '💱' :
                       item.type === 'deposit' ? '🛡️' :
                       item.type === 'bet' ? '🎲' : '✨'}
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{item.description}</p>
                      <p className="text-xs text-text-muted">{timeAgo(item.timestamp)}</p>
                    </div>
                  </div>
                  {item.points && (
                    <span className="px-3 py-1 rounded-lg bg-neon-green/10 text-sm font-bold text-neon-green">
                      +{item.points} pts
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Badge Showcase */}
        {visible.badges && profile.badgeTier !== "none" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <div className="p-6 rounded-2xl border border-border-primary relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${badgeInfo.color}10, transparent, ${badgeInfo.color}05)` }}
            >
              <div
                className="absolute inset-0 opacity-20"
                style={{ background: `radial-gradient(circle at 0% 0%, ${badgeInfo.color}, transparent 50%)` }}
              />
              <div className="relative flex flex-col md:flex-row items-center gap-6">
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl shadow-lg"
                  style={{ backgroundColor: badgeInfo.color + '30', boxShadow: `0 0 40px ${badgeInfo.color}50` }}
                >
                  {badgeInfo.icon}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <p className="text-sm text-text-muted mb-1">NFT Badge</p>
                  <h3 className="text-3xl font-bold mb-2" style={{ color: badgeInfo.color }}>
                    {badgeInfo.name}
                  </h3>
                  <p className="text-text-secondary mb-3">{badgeInfo.description}</p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <span
                      className="inline-flex items-center text-xs px-2.5 py-1 font-medium border rounded-full"
                      style={{ backgroundColor: badgeInfo.color + '20', color: badgeInfo.color, borderColor: badgeInfo.color + '30' }}
                    >
                      {badgeInfo.multiplier}x Points
                    </span>
                    <Badge variant="default" size="md" className="bg-bg-tertiary text-text-secondary">
                      Premium Access
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="text-center py-12"
        >
          <div className="inline-flex flex-col items-center p-8 rounded-3xl bg-gradient-to-br from-neon-green/5 to-neon-cyan/5 border border-neon-green/20">
            <div className="mb-4">
              <WhaleLogo size="xl" showText={false} animated={true} />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Join the Privacy Revolution</h2>
            <p className="text-text-muted mb-6 max-w-md">
              Get your own shareable profile, earn points, and trade privately on Solana.
            </p>
            <Link href="/dashboard">
              <Button variant="primary" size="lg" className="px-8">
                Start Your Journey
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center text-xs text-text-muted py-8 border-t border-border-primary/30">
          <p>Powered by Whale Suite • Privacy-First Trading on Solana</p>
        </div>
      </main>
    </div>
  );
}

// Icons
function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
