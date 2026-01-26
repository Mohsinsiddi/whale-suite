"use client";

import { useState } from "react";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { TierBadge } from "@/components/ui/Badge";
import { TransactionModal, SuccessModal } from "@/components/ui/Modal";

const badgeTiers = [
  {
    id: "bronze",
    name: "Bronze Ghost",
    price: 0.5,
    icon: "🥉",
    color: "from-amber-700 to-amber-600",
    benefits: [
      "1 year premium access",
      "+10% privacy score boost",
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
    benefits: [
      "1 year premium access",
      "+25% privacy score boost",
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
    benefits: [
      "1 year premium access",
      "+50% privacy score boost",
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
    benefits: [
      "1 year premium access",
      "+100% privacy score boost",
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
    benefits: [
      "1 year premium access",
      "+200% privacy score boost",
      "Legendary badge NFT",
      "25% affiliate commission",
      "1% lifetime revenue share",
      "Custom badge design",
      "Advisory board invitation",
    ],
  },
];

export default function BadgesPage() {
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Badge Marketplace</h1>
          <p className="text-sm text-text-secondary">Claim your exclusive NFT badge</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Your Badge:</span>
          <TierBadge tier="gold" size="md" />
        </div>
      </div>

      {/* Current Benefits */}
      <Card variant="glow" padding="md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🥇</div>
            <div>
              <h3 className="text-base font-semibold text-text-primary">Gold Phantom</h3>
              <p className="text-xs text-text-secondary">Premium expires in 342 days</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-neon-green">+50%</div>
              <div className="text-[10px] text-text-muted">Privacy Boost</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-neon-cyan">15%</div>
              <div className="text-[10px] text-text-muted">Commission</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Badge Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {badgeTiers.map((badge) => (
          <Card
            key={badge.id}
            variant={badge.popular ? "glow" : "default"}
            padding="lg"
            className={`relative ${badge.popular ? "ring-2 ring-neon-green/50" : ""}`}
          >
            {badge.popular && (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[10px] font-bold bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary rounded-full">
                MOST POPULAR
              </div>
            )}

            <div className="text-center mb-4">
              <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${badge.color} flex items-center justify-center text-3xl shadow-lg`}>
                {badge.icon}
              </div>
              <h3 className="text-lg font-bold text-text-primary">{badge.name}</h3>
              <div className="flex items-baseline justify-center gap-1 mt-1">
                <span className="text-2xl font-black text-neon-green">{badge.price}</span>
                <span className="text-sm text-text-muted">SOL</span>
              </div>
              <p className="text-xs text-text-muted">One-time + 1 Year Premium</p>
            </div>

            <div className="space-y-2 mb-4">
              {badge.benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-neon-green">✓</span>
                  <span className="text-text-secondary">{benefit}</span>
                </div>
              ))}
            </div>

            <Button
              fullWidth
              variant={badge.id === "gold" ? "success" : badge.popular ? "primary" : "secondary"}
              onClick={() => handlePurchase(badge.id)}
              disabled={badge.id === "gold"}
            >
              {badge.id === "gold" ? "Current Badge" : "Claim Badge"}
            </Button>
          </Card>
        ))}
      </div>

      {/* Info Section */}
      <Card variant="default" padding="md">
        <CardHeader>
          <CardTitle>About Badges</CardTitle>
        </CardHeader>
        <div className="grid md:grid-cols-3 gap-4 text-xs text-text-secondary">
          <div>
            <h4 className="font-semibold text-text-primary mb-1">NFT Ownership</h4>
            <p>Each badge is a unique NFT minted on Solana. Trade or transfer anytime.</p>
          </div>
          <div>
            <h4 className="font-semibold text-text-primary mb-1">Upgradeable</h4>
            <p>Upgrade your badge by paying only the difference between tiers.</p>
          </div>
          <div>
            <h4 className="font-semibold text-text-primary mb-1">Premium Access</h4>
            <p>All badges include 1 year of premium features. Renew or upgrade anytime.</p>
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
        }}
        title="Badge Claimed!"
        message={`Your ${badgeTiers.find(b => b.id === selectedBadge)?.name} NFT has been minted`}
        txSignature="badge123...xyz"
      />
    </div>
  );
}
