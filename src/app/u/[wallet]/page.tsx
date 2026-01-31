"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { ProfileAvatar } from "@/components/ui/Avatar";
import { StreakBadge, RankBadge, PointsDisplay } from "@/components/leaderboard";
import { BADGE_TIERS } from "@/lib/badges";

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
    };
  };
  rank?: number;
}

export default function PublicProfilePage({ params }: { params: Promise<{ wallet: string }> }) {
  const { wallet } = use(params);
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/users/${wallet}/profile`);
        const data = await response.json();

        if (!data.success) {
          setError(data.error || "Profile not found");
          return;
        }

        // Check if profile is public
        if (!data.profile?.isPublic) {
          setError("This profile is private");
          return;
        }

        setProfile({
          ...data.user,
          profile: data.profile,
        });
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [wallet]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-green/30 border-t-neon-green rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <Card variant="glow" padding="xl" className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-4">
            <LockIcon className="w-8 h-8 text-text-muted" />
          </div>
          <h1 className="text-xl font-bold text-text-primary mb-2">
            {error === "This profile is private" ? "Private Profile" : "Profile Not Found"}
          </h1>
          <p className="text-text-secondary mb-6">
            {error === "This profile is private"
              ? "This user has chosen to keep their profile private."
              : "The profile you're looking for doesn't exist."}
          </p>
          <Link href="/">
            <Button variant="primary">Go to Whale Suite</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const visible = profile.profile.visibleStats;
  const badgeInfo = BADGE_TIERS[profile.badgeTier as keyof typeof BADGE_TIERS] || BADGE_TIERS.none;
  const displayName = profile.profile.displayName || `Whale #${profile.userNumber}`;

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="bg-bg-secondary border-b border-border-primary">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🐋</span>
            <span className="font-bold text-text-primary">Whale Suite</span>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary" size="sm">
              Open App
            </Button>
          </Link>
        </div>
      </header>

      {/* Profile Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Profile Header */}
          <Card variant="glow" padding="lg" className="mb-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <ProfileAvatar
                address={profile.wallet}
                imageUrl={profile.profile.avatarUrl}
                size="2xl"
                badge={
                  visible.badges && profile.badgeTier !== "none" ? (
                    <Badge
                      variant={badgeInfo.variant as "success" | "warning" | "error" | "info" | "default"}
                      size="sm"
                    >
                      {badgeInfo.icon} {badgeInfo.name}
                    </Badge>
                  ) : undefined
                }
              />

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold text-text-primary mb-1">
                  {displayName}
                </h1>
                <p className="text-text-muted font-mono text-sm mb-4">
                  {profile.wallet.slice(0, 8)}...{profile.wallet.slice(-8)}
                </p>

                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  {visible.points && (
                    <PointsDisplay points={profile.points} size="lg" />
                  )}
                  {visible.streak && profile.streak > 0 && (
                    <StreakBadge streak={profile.streak} size="lg" />
                  )}
                  {visible.rank && profile.rank && (
                    <RankBadge rank={profile.rank} size="lg" />
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {visible.privacyScore && (
              <Card variant="default" padding="md" className="text-center">
                <div className="text-2xl font-bold text-neon-green mb-1">
                  {profile.privacyScore}
                </div>
                <div className="text-xs text-text-muted">Stealth Rating</div>
              </Card>
            )}

            {visible.memberSince && (
              <Card variant="default" padding="md" className="text-center">
                <div className="text-2xl font-bold text-text-primary mb-1">
                  {new Date(profile.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </div>
                <div className="text-xs text-text-muted">Member Since</div>
              </Card>
            )}

            {visible.transactions && (
              <Card variant="default" padding="md" className="text-center">
                <div className="text-2xl font-bold text-text-primary mb-1">
                  {profile.stats.privateTransfers}
                </div>
                <div className="text-xs text-text-muted">Private Transfers</div>
              </Card>
            )}

            {visible.hiddenVolume && (
              <Card variant="default" padding="md" className="text-center">
                <div className="text-2xl font-bold text-text-primary mb-1">
                  {profile.stats.hiddenBalance.toFixed(2)}
                </div>
                <div className="text-xs text-text-muted">Hidden Volume</div>
              </Card>
            )}
          </div>

          {/* Badges Section */}
          {visible.badges && profile.badgeTier !== "none" && (
            <Card variant="default" padding="md">
              <CardHeader>
                <CardTitle>NFT Badges</CardTitle>
              </CardHeader>
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl ${badgeInfo.bgColor}`}
                >
                  {badgeInfo.icon}
                </div>
                <div>
                  <h3 className="font-bold text-text-primary">{badgeInfo.name}</h3>
                  <p className="text-sm text-text-secondary">{badgeInfo.description}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-text-muted text-sm mb-4">
              Want your own privacy-first profile?
            </p>
            <Link href="/dashboard">
              <Button variant="primary">
                Join Whale Suite
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

// Lock Icon
function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}
