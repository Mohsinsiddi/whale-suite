"use client";

import { useState } from "react";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge, { TierBadge } from "@/components/ui/Badge";
import { InfoTooltip } from "@/components/ui/Tooltip";

const referrals = [
  { id: "1", user: "User #1234", date: "Jan 15, 2026", purchase: "Gold Badge", earned: "0.75 SOL" },
  { id: "2", user: "User #5678", date: "Jan 12, 2026", purchase: "Premium (3mo)", earned: "0.03 SOL" },
  { id: "3", user: "User #9012", date: "Jan 10, 2026", purchase: "Silver Badge", earned: "0.30 SOL" },
  { id: "4", user: "User #3456", date: "Jan 8, 2026", purchase: "Premium (1mo)", earned: "0.015 SOL" },
];

export default function AffiliatePage() {
  const [copied, setCopied] = useState(false);
  const referralCode = "WHALE999";
  const referralLink = `https://whale-suite.com?ref=${referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Affiliate Program</h1>
          <p className="text-sm text-text-secondary">Earn commissions by referring whales</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Your Rate:</span>
          <Badge variant="success" size="sm">15% Commission</Badge>
          <TierBadge tier="gold" size="sm" showLabel={false} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Earned", value: "12.5 SOL", subtext: "≈ $1,875" },
          { label: "Pending Payout", value: "2.3 SOL", subtext: "Next: Jan 31" },
          { label: "Total Referrals", value: "47", subtext: "+5 this month" },
          { label: "Conversion Rate", value: "12%", subtext: "Above average" },
        ].map((stat, i) => (
          <Card key={i} variant={i === 0 ? "glow" : "default"} padding="md">
            <div className="text-xs text-text-muted mb-1">{stat.label}</div>
            <div className={`text-xl font-bold ${i === 0 ? "text-neon-green" : "text-text-primary"}`}>
              {stat.value}
            </div>
            <div className="text-xs text-text-secondary">{stat.subtext}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Referral Link */}
          <Card variant="glow" padding="md">
            <CardHeader>
              <CardTitle>Your Referral Link</CardTitle>
              <InfoTooltip content="Share this link to earn commissions" />
            </CardHeader>

            <div className="flex gap-2 mb-4">
              <div className="flex-1 p-3 rounded-xl bg-bg-secondary border border-border-secondary font-mono text-sm text-text-secondary truncate">
                {referralLink}
              </div>
              <Button onClick={copyToClipboard} size="sm">
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1">
                <TwitterIcon /> Share on Twitter
              </Button>
              <Button variant="secondary" size="sm" className="flex-1">
                <TelegramIcon /> Share on Telegram
              </Button>
            </div>
          </Card>

          {/* Recent Referrals */}
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>Recent Referrals</CardTitle>
              <Button variant="ghost" size="xs">View All</Button>
            </CardHeader>

            <div className="space-y-2">
              {referrals.map((ref) => (
                <div
                  key={ref.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-bg-tertiary hover:bg-bg-elevated transition-colors"
                >
                  <div>
                    <div className="text-sm font-medium text-text-primary">{ref.user}</div>
                    <div className="text-xs text-text-muted">{ref.date}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-text-secondary">{ref.purchase}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-neon-green">{ref.earned}</div>
                    <Badge size="xs" variant="success">Paid</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Commission Tiers */}
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>Commission Tiers</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              {[
                { tier: "bronze", rate: "5%", current: false },
                { tier: "silver", rate: "10%", current: false },
                { tier: "gold", rate: "15%", current: true },
                { tier: "diamond", rate: "20%", current: false },
                { tier: "legendary", rate: "25%", current: false },
              ].map((t) => (
                <div
                  key={t.tier}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    t.current ? "bg-neon-green/10 border border-neon-green/30" : "bg-bg-tertiary"
                  }`}
                >
                  <TierBadge tier={t.tier as "bronze" | "silver" | "gold" | "diamond" | "legendary"} size="sm" />
                  <span className={`text-sm font-semibold ${t.current ? "text-neon-green" : "text-text-secondary"}`}>
                    {t.rate}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Payout Info */}
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>Payout Info</CardTitle>
            </CardHeader>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted">Minimum Payout</span>
                <span className="text-text-secondary">0.1 SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Payout Schedule</span>
                <span className="text-text-secondary">Monthly</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Next Payout</span>
                <span className="text-neon-green">Jan 31, 2026</span>
              </div>
            </div>
            <div className="mt-4">
              <Button variant="secondary" size="sm" fullWidth>
                Request Early Payout
              </Button>
            </div>
          </Card>

          {/* Leaderboard */}
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>Top Affiliates</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              {[
                { rank: 1, name: "Whale #001", earned: "125.5 SOL" },
                { rank: 2, name: "Whale #042", earned: "89.2 SOL" },
                { rank: 3, name: "Whale #156", earned: "67.8 SOL" },
                { rank: 15, name: "You", earned: "12.5 SOL", isYou: true },
              ].map((a) => (
                <div
                  key={a.rank}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    a.isYou ? "bg-neon-green/10" : "bg-bg-tertiary"
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    a.rank <= 3 ? "bg-gradient-to-br from-neon-green to-neon-cyan text-bg-primary" : "bg-bg-elevated text-text-muted"
                  }`}>
                    {a.rank}
                  </span>
                  <span className={`flex-1 text-sm ${a.isYou ? "text-neon-green font-semibold" : "text-text-secondary"}`}>
                    {a.name}
                  </span>
                  <span className="text-sm font-medium text-text-primary">{a.earned}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Icons
const TwitterIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const TelegramIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);
