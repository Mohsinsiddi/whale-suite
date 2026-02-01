"use client";

import { useState } from "react";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge, { TierBadge } from "@/components/ui/Badge";
import { TransactionModal, SuccessModal } from "@/components/ui/Modal";
import { useUserStats } from "@/hooks/useUserStats";
import {
  Award,
  Lock,
  Unlock,
  Shield,
  Flame,
  Trophy,
  Zap,
  Star,
  Crown,
  Target,
  Users,
  TrendingUp,
  Gift,
  Check,
  ArrowDownCircle,
} from "lucide-react";
import LearnMoreLink from "@/components/ui/LearnMoreLink";

// Alias for Flame
const Fire = Flame;

// Badge tiers with requirements
const BADGE_TIERS = [
  {
    id: "bronze",
    name: "Bronze Ghost",
    price: 0.5,
    icon: "🥉",
    color: "from-amber-700 to-amber-600",
    multiplier: 1.25,
    commission: 5,
    requirements: {
      minDeposits: 1,
      minTransfers: 5,
      minPoints: 100,
    },
    benefits: [
      "1 year premium access",
      "+10% privacy score boost",
      "1.25x points multiplier",
      "Bronze badge NFT",
      "5% affiliate commission",
    ],
  },
  {
    id: "silver",
    name: "Silver Shadow",
    price: 2,
    icon: "🥈",
    color: "from-slate-400 to-slate-300",
    multiplier: 1.5,
    commission: 10,
    requirements: {
      minDeposits: 5,
      minTransfers: 20,
      minPoints: 500,
      previousBadge: "bronze",
    },
    benefits: [
      "1 year premium access",
      "+25% privacy score boost",
      "1.5x points multiplier",
      "Silver badge NFT",
      "10% affiliate commission",
      "Silver Lounge access",
    ],
  },
  {
    id: "gold",
    name: "Gold Phantom",
    price: 5,
    icon: "🥇",
    color: "from-yellow-500 to-amber-400",
    popular: true,
    multiplier: 1.75,
    commission: 15,
    requirements: {
      minDeposits: 10,
      minTransfers: 50,
      minPoints: 2000,
      previousBadge: "silver",
    },
    benefits: [
      "1 year premium access",
      "+50% privacy score boost",
      "1.75x points multiplier",
      "Gold badge NFT",
      "15% affiliate commission",
      "Custom themes",
      "Priority support",
    ],
  },
  {
    id: "diamond",
    name: "Diamond Whale",
    price: 10,
    icon: "💎",
    color: "from-cyan-400 to-blue-400",
    multiplier: 2.0,
    commission: 20,
    requirements: {
      minDeposits: 25,
      minTransfers: 100,
      minPoints: 5000,
      previousBadge: "gold",
    },
    benefits: [
      "1 year premium access",
      "+100% privacy score boost",
      "2.0x points multiplier",
      "Diamond badge NFT",
      "20% affiliate commission",
      "Whale Club access",
      "Feature voting rights",
    ],
  },
  {
    id: "legendary",
    name: "Legendary Titan",
    price: 25,
    icon: "👑",
    color: "from-purple-500 to-pink-500",
    multiplier: 2.5,
    commission: 25,
    requirements: {
      minDeposits: 50,
      minTransfers: 250,
      minPoints: 15000,
      previousBadge: "diamond",
    },
    benefits: [
      "1 year premium access",
      "+200% privacy score boost",
      "2.5x points multiplier",
      "Legendary badge NFT",
      "25% affiliate commission",
      "1% lifetime revenue share",
      "Custom badge design",
      "Advisory board invitation",
    ],
  },
];

// Achievements that can be unlocked
const ACHIEVEMENTS = [
  {
    id: "first_deposit",
    name: "First Deposit",
    description: "Make your first privacy deposit",
    icon: ArrowDownCircle,
    requirement: { type: "deposits", value: 1 },
    points: 100,
  },
  {
    id: "privacy_pro",
    name: "Privacy Pro",
    description: "Complete 10 privacy deposits",
    icon: Shield,
    requirement: { type: "deposits", value: 10 },
    points: 250,
  },
  {
    id: "transfer_master",
    name: "Transfer Master",
    description: "Complete 50 private transfers",
    icon: Zap,
    requirement: { type: "transfers", value: 50 },
    points: 500,
  },
  {
    id: "streak_warrior",
    name: "Streak Warrior",
    description: "Maintain a 7-day streak",
    icon: Flame,
    requirement: { type: "streak", value: 7 },
    points: 200,
  },
  {
    id: "streak_legend",
    name: "Streak Legend",
    description: "Maintain a 30-day streak",
    icon: Fire,
    requirement: { type: "streak", value: 30 },
    points: 1000,
  },
  {
    id: "point_collector",
    name: "Point Collector",
    description: "Earn 1,000 total points",
    icon: Star,
    requirement: { type: "points", value: 1000 },
    points: 100,
  },
  {
    id: "whale_status",
    name: "Whale Status",
    description: "Earn 10,000 total points",
    icon: Crown,
    requirement: { type: "points", value: 10000 },
    points: 500,
  },
  {
    id: "top_100",
    name: "Top 100",
    description: "Reach top 100 on leaderboard",
    icon: Trophy,
    requirement: { type: "rank", value: 100 },
    points: 300,
  },
  {
    id: "top_10",
    name: "Elite 10",
    description: "Reach top 10 on leaderboard",
    icon: Target,
    requirement: { type: "rank", value: 10 },
    points: 1000,
  },
  {
    id: "referral_starter",
    name: "Referral Starter",
    description: "Refer 3 new users",
    icon: Users,
    requirement: { type: "referrals", value: 3 },
    points: 300,
  },
  {
    id: "referral_master",
    name: "Referral Master",
    description: "Refer 25 new users",
    icon: Gift,
    requirement: { type: "referrals", value: 25 },
    points: 1000,
  },
  {
    id: "high_volume",
    name: "High Volume",
    description: "Swap over 1000 SOL total",
    icon: TrendingUp,
    requirement: { type: "swapVolume", value: 1000 },
    points: 500,
  },
];

export default function BadgesPage() {
  const { stats, rank, points, streak, refresh } = useUserStats();

  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState<"badges" | "achievements">("badges");

  // Note: useUserStats hook automatically handles wallet changes with caching

  const userBadgeTier = stats?.user?.badgeTier || "none";
  const userStats = stats?.stats || {
    hiddenBalance: 0,
    privateTransfers: 0,
    swapVolume: 0,
    referrals: 0,
  };
  // Activity counts from transactions (not current balance)
  const userActivity = stats?.activity || {};
  const depositCount = userActivity.privacy_deposit?.count || 0;
  const transferCount = userActivity.shadow_transfer?.count || 0;
  const swapVolumeTotal = userActivity.jupiter_swap?.amount || 0;

  // Check if requirements are met for a badge
  const checkRequirements = (badge: typeof BADGE_TIERS[0]) => {
    const reqs = badge.requirements;
    const met = {
      deposits: Math.min(depositCount, reqs.minDeposits),
      transfers: Math.min(transferCount + (userStats.privateTransfers || 0), reqs.minTransfers),
      points: Math.min(points || 0, reqs.minPoints),
      previousBadge: !reqs.previousBadge || BADGE_TIERS.findIndex(b => b.id === userBadgeTier) >= BADGE_TIERS.findIndex(b => b.id === reqs.previousBadge),
    };

    const total = 3; // deposits, transfers, points
    const completed =
      (met.deposits >= reqs.minDeposits ? 1 : 0) +
      (met.transfers >= reqs.minTransfers ? 1 : 0) +
      (met.points >= reqs.minPoints ? 1 : 0);

    return {
      met,
      progress: (completed / total) * 100,
      canPurchase: completed === total && met.previousBadge,
      isOwned: userBadgeTier === badge.id || BADGE_TIERS.findIndex(b => b.id === userBadgeTier) > BADGE_TIERS.findIndex(b => b.id === badge.id),
    };
  };

  // Check achievement unlocked status
  const checkAchievement = (achievement: typeof ACHIEVEMENTS[0]) => {
    const req = achievement.requirement;
    let current = 0;
    let target = req.value;

    switch (req.type) {
      case "deposits":
        // Use actual deposit COUNT from activity, not current balance
        current = depositCount;
        break;
      case "transfers":
        // Use transfer count from activity + legacy stats
        current = transferCount + (userStats.privateTransfers || 0);
        break;
      case "streak":
        current = streak || 0;
        break;
      case "points":
        current = points || 0;
        break;
      case "rank":
        current = rank <= req.value ? req.value : 0;
        target = req.value;
        break;
      case "referrals":
        current = userStats.referrals || 0;
        break;
      case "swapVolume":
        // Use actual swap volume from activity
        current = swapVolumeTotal || userStats.swapVolume || 0;
        break;
    }

    return {
      current,
      target,
      progress: Math.min((current / target) * 100, 100),
      unlocked: current >= target,
    };
  };

  const handlePurchase = (badgeId: string) => {
    setSelectedBadge(badgeId);
    setShowTxModal(true);
    setCurrentStep(0);

    // Simulate transaction
    setTimeout(() => setCurrentStep(1), 1500);
    setTimeout(() => setCurrentStep(2), 3000);
    setTimeout(() => {
      setShowTxModal(false);
      setShowSuccessModal(true);
    }, 4500);
  };

  const getStepStatus = (stepIndex: number): "pending" | "active" | "completed" => {
    if (currentStep > stepIndex) return "completed";
    if (currentStep === stepIndex) return "active";
    return "pending";
  };

  const txSteps = [
    { label: "Verifying requirements", status: getStepStatus(0) },
    { label: "Processing payment", status: getStepStatus(1) },
    { label: "Minting NFT badge", status: getStepStatus(2) },
  ];

  const unlockedAchievements = ACHIEVEMENTS.filter(a => checkAchievement(a).unlocked).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Award className="w-6 h-6 text-neon-green" />
              Badges & Achievements
            </h1>
            <LearnMoreLink section="badges">How it works</LearnMoreLink>
          </div>
          <p className="text-sm text-text-secondary">Unlock achievements and claim exclusive NFT badges</p>
        </div>
        {userBadgeTier !== "none" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Your Badge:</span>
            <TierBadge tier={userBadgeTier as 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary'} size="md" />
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card variant="stat" padding="sm">
          <div className="text-xs text-text-muted mb-1">Total Points</div>
          <div className="text-xl font-bold text-neon-green">{(points || 0).toLocaleString()}</div>
        </Card>
        <Card variant="stat" padding="sm">
          <div className="text-xs text-text-muted mb-1">Current Streak</div>
          <div className="text-xl font-bold text-orange-400 flex items-center gap-1">
            <Flame className="w-5 h-5" />
            {streak || 0}d
          </div>
        </Card>
        <Card variant="stat" padding="sm">
          <div className="text-xs text-text-muted mb-1">Leaderboard Rank</div>
          <div className="text-xl font-bold text-neon-cyan">#{rank || '-'}</div>
        </Card>
        <Card variant="stat" padding="sm">
          <div className="text-xs text-text-muted mb-1">Achievements</div>
          <div className="text-xl font-bold text-purple-400">{unlockedAchievements}/{ACHIEVEMENTS.length}</div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border-primary pb-2">
        <button
          onClick={() => setActiveTab("badges")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "badges"
              ? "bg-neon-green/10 text-neon-green border border-neon-green/30"
              : "text-text-muted hover:text-text-primary hover:bg-bg-elevated"
          }`}
        >
          <Crown className="w-4 h-4" />
          NFT Badges
        </button>
        <button
          onClick={() => setActiveTab("achievements")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "achievements"
              ? "bg-neon-green/10 text-neon-green border border-neon-green/30"
              : "text-text-muted hover:text-text-primary hover:bg-bg-elevated"
          }`}
        >
          <Trophy className="w-4 h-4" />
          Achievements
          <Badge variant="default" size="xs">{unlockedAchievements}/{ACHIEVEMENTS.length}</Badge>
        </button>
      </div>

      {/* Badges Tab */}
      {activeTab === "badges" && (
        <>
          {/* Current Badge */}
          {userBadgeTier !== "none" && (
            <Card variant="glow" padding="md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">
                    {BADGE_TIERS.find(b => b.id === userBadgeTier)?.icon || "🏅"}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-text-primary">
                      {BADGE_TIERS.find(b => b.id === userBadgeTier)?.name || "Badge"}
                    </h3>
                    <p className="text-xs text-text-secondary">Premium expires in 342 days</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-neon-green">
                      {BADGE_TIERS.find(b => b.id === userBadgeTier)?.multiplier || 1}x
                    </div>
                    <div className="text-[10px] text-text-muted">Points Multiplier</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-neon-cyan">
                      {BADGE_TIERS.find(b => b.id === userBadgeTier)?.commission || 0}%
                    </div>
                    <div className="text-[10px] text-text-muted">Commission</div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Badge Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {BADGE_TIERS.map((badge) => {
              const status = checkRequirements(badge);

              return (
                <Card
                  key={badge.id}
                  variant={badge.popular ? "glow" : "default"}
                  padding="lg"
                  className={`relative ${badge.popular ? "ring-2 ring-neon-green/50" : ""} ${status.isOwned ? "opacity-75" : ""}`}
                >
                  {badge.popular && !status.isOwned && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[10px] font-bold bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary rounded-full">
                      MOST POPULAR
                    </div>
                  )}

                  {status.isOwned && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[10px] font-bold bg-neon-green text-bg-primary rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> OWNED
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${badge.color} flex items-center justify-center text-3xl shadow-lg ${!status.canPurchase && !status.isOwned ? "grayscale opacity-50" : ""}`}>
                      {badge.icon}
                    </div>
                    <h3 className="text-lg font-bold text-text-primary">{badge.name}</h3>
                    <div className="flex items-baseline justify-center gap-1 mt-1">
                      <span className="text-2xl font-black text-neon-green">{badge.price}</span>
                      <span className="text-sm text-text-muted">SOL</span>
                    </div>
                    <p className="text-xs text-text-muted">{badge.multiplier}x multiplier • {badge.commission}% commission</p>
                  </div>

                  {/* Requirements Progress */}
                  {!status.isOwned && (
                    <div className="mb-4 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-text-muted">Requirements</span>
                        <span className={status.canPurchase ? "text-neon-green" : "text-text-muted"}>
                          {Math.round(status.progress)}%
                        </span>
                      </div>
                      <div className="h-2 bg-bg-primary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${status.canPurchase ? "bg-neon-green" : "bg-text-muted"}`}
                          style={{ width: `${status.progress}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-[10px]">
                        <div className={status.met.deposits >= badge.requirements.minDeposits ? "text-neon-green" : "text-text-muted"}>
                          ✓ {badge.requirements.minDeposits} deposits
                        </div>
                        <div className={status.met.transfers >= badge.requirements.minTransfers ? "text-neon-green" : "text-text-muted"}>
                          ✓ {badge.requirements.minTransfers} transfers
                        </div>
                        <div className={status.met.points >= badge.requirements.minPoints ? "text-neon-green" : "text-text-muted"}>
                          ✓ {badge.requirements.minPoints} pts
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 mb-4">
                    {badge.benefits.slice(0, 4).map((benefit, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="text-neon-green">✓</span>
                        <span className="text-text-secondary">{benefit}</span>
                      </div>
                    ))}
                    {badge.benefits.length > 4 && (
                      <div className="text-xs text-text-muted">+{badge.benefits.length - 4} more benefits</div>
                    )}
                  </div>

                  <Button
                    fullWidth
                    variant={status.isOwned ? "success" : status.canPurchase ? "primary" : "secondary"}
                    onClick={() => !status.isOwned && status.canPurchase && handlePurchase(badge.id)}
                    disabled={status.isOwned || !status.canPurchase}
                  >
                    {status.isOwned ? (
                      <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Owned</span>
                    ) : status.canPurchase ? (
                      <span className="flex items-center gap-2"><Unlock className="w-4 h-4" /> Claim Badge</span>
                    ) : (
                      <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> Locked</span>
                    )}
                  </Button>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Achievements Tab */}
      {activeTab === "achievements" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACHIEVEMENTS.map((achievement) => {
            const status = checkAchievement(achievement);
            const Icon = achievement.icon;

            return (
              <Card
                key={achievement.id}
                variant={status.unlocked ? "glow" : "default"}
                padding="md"
                className={status.unlocked ? "" : "opacity-75"}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    status.unlocked
                      ? "bg-neon-green/20 text-neon-green"
                      : "bg-bg-elevated text-text-muted"
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-text-primary">{achievement.name}</h3>
                      {status.unlocked && (
                        <Badge variant="success" size="xs">
                          <Check className="w-3 h-3 mr-1" /> Unlocked
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-1">{achievement.description}</p>

                    {!status.unlocked && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-text-muted">
                            {status.current} / {status.target}
                          </span>
                          <span className="text-text-muted">{Math.round(status.progress)}%</span>
                        </div>
                        <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-text-muted rounded-full transition-all"
                            style={{ width: `${status.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-2 text-xs">
                      <span className={status.unlocked ? "text-neon-green" : "text-text-muted"}>
                        +{achievement.points} bonus points
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info Section */}
      <Card variant="default" padding="md">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <div className="grid md:grid-cols-3 gap-4 text-xs text-text-secondary">
          <div>
            <h4 className="font-semibold text-text-primary mb-1">Earn Achievements</h4>
            <p>Complete activities to unlock achievements and earn bonus points. Achievements are tracked automatically.</p>
          </div>
          <div>
            <h4 className="font-semibold text-text-primary mb-1">Meet Requirements</h4>
            <p>Each badge tier has requirements. Meet them to unlock the ability to purchase that badge.</p>
          </div>
          <div>
            <h4 className="font-semibold text-text-primary mb-1">Claim NFT Badges</h4>
            <p>Once requirements are met, purchase your badge NFT. Higher tiers give better multipliers and benefits.</p>
          </div>
        </div>
      </Card>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={showTxModal}
        onClose={() => setShowTxModal(false)}
        title="Purchasing Badge..."
        steps={txSteps}
        currentStep={currentStep}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setSelectedBadge(null);
          refresh();
        }}
        title="Badge Claimed!"
        message={`Your ${BADGE_TIERS.find(b => b.id === selectedBadge)?.name} NFT has been minted`}
        txSignature="badge123...xyz"
      />
    </div>
  );
}
