"use client";

import Card from "@/components/ui/Card";
import Badge, { TierBadge } from "@/components/ui/Badge";

export default function AffiliatePage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Affiliate Program</h1>
          <p className="text-sm text-text-secondary">Earn commissions by referring whales</p>
        </div>
        <Badge variant="warning" size="sm">Coming Soon</Badge>
      </div>

      {/* Coming Soon Banner */}
      <Card variant="glow" padding="lg">
        <div className="text-center py-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 flex items-center justify-center">
            <span className="text-4xl">🚀</span>
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-3">
            Affiliate Program Coming to Mainnet
          </h2>
          <p className="text-text-secondary max-w-lg mx-auto mb-6">
            Our affiliate program will launch with mainnet. Earn commissions by referring
            new whales to the platform. Higher badge tiers unlock better commission rates!
          </p>

          {/* Commission Tiers Preview */}
          <div className="max-w-md mx-auto">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-4">Commission Tiers Preview</p>
            <div className="grid grid-cols-5 gap-2">
              {[
                { tier: "bronze", rate: "5%" },
                { tier: "silver", rate: "10%" },
                { tier: "gold", rate: "15%" },
                { tier: "diamond", rate: "20%" },
                { tier: "legendary", rate: "25%" },
              ].map((t) => (
                <div
                  key={t.tier}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg bg-bg-tertiary/50"
                >
                  <TierBadge tier={t.tier as "bronze" | "silver" | "gold" | "diamond" | "legendary"} size="sm" showLabel={false} />
                  <span className="text-xs font-semibold text-neon-green">{t.rate}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Features Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: "🔗",
            title: "Unique Referral Links",
            description: "Get your personalized referral link to share with friends and followers",
          },
          {
            icon: "💰",
            title: "Lifetime Commissions",
            description: "Earn on every purchase your referrals make, forever",
          },
          {
            icon: "📊",
            title: "Real-time Analytics",
            description: "Track clicks, conversions, and earnings in real-time",
          },
        ].map((feature, i) => (
          <Card key={i} variant="default" padding="md" className="opacity-60">
            <div className="text-center">
              <span className="text-3xl mb-3 block">{feature.icon}</span>
              <h3 className="font-semibold text-text-primary mb-1">{feature.title}</h3>
              <p className="text-xs text-text-muted">{feature.description}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Info Box */}
      <Card variant="default" padding="md">
        <div className="flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div>
            <p className="text-sm font-medium text-text-primary mb-1">Get Ready for Launch</p>
            <p className="text-xs text-text-muted">
              In the meantime, focus on increasing your badge tier! Higher tiers will unlock
              better commission rates when the affiliate program launches. Diamond and Legendary
              badge holders will get early access.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
