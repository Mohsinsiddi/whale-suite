"use client";

import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge, { TierBadge } from "@/components/ui/Badge";
import { StealthRating } from "@/components/ui/Progress";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">Profile</h1>
        <p className="text-sm text-text-secondary">Your Whale Suite identity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Card */}
        <div className="lg:col-span-2 space-y-4">
          {/* Identity Card */}
          <Card variant="glow" padding="lg">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center text-4xl font-bold text-bg-primary shadow-glow-md">
                  W
                </div>
                <div className="absolute -bottom-2 -right-2">
                  <TierBadge tier="gold" size="sm" showLabel={false} />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-text-primary">Whale #999</h2>
                  <Badge variant="success" size="sm">Premium</Badge>
                </div>
                <p className="text-sm text-text-muted font-mono mb-3">0x4f2e8a3b9c1d5e6f7a0b2c3d4e5f6a7b8c9d0e1f</p>
                <div className="flex flex-wrap gap-2">
                  <Badge size="sm" variant="cyan">Early Adopter</Badge>
                  <Badge size="sm" variant="default">Privacy Champion</Badge>
                  <Badge size="sm" variant="warning">Top Referrer</Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Member Since", value: "Jan 2026" },
              { label: "Total Txs", value: "1,234" },
              { label: "Hidden Volume", value: "$2.5M" },
              { label: "Referrals", value: "47" },
            ].map((stat, i) => (
              <Card key={i} variant="default" padding="sm">
                <div className="text-xs text-text-muted mb-1">{stat.label}</div>
                <div className="text-lg font-bold text-text-primary">{stat.value}</div>
              </Card>
            ))}
          </div>

          {/* NFT Badge Display */}
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>Your NFT Badge</CardTitle>
              <Button variant="ghost" size="xs">View on Solscan</Button>
            </CardHeader>

            <div className="flex flex-col md:flex-row gap-6">
              {/* Badge Visual */}
              <div className="w-full md:w-48 h-48 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-400 p-1 shadow-[0_0_30px_rgba(234,179,8,0.3)]">
                <div className="w-full h-full rounded-xl bg-bg-primary flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl mb-2">🥇</div>
                    <div className="text-sm font-bold text-yellow-400">Gold Phantom</div>
                    <div className="text-xs text-text-muted">Whale #999</div>
                  </div>
                </div>
              </div>

              {/* Badge Details */}
              <div className="flex-1 space-y-3">
                <div>
                  <div className="text-xs text-text-muted mb-1">Mint Address</div>
                  <div className="text-sm font-mono text-text-secondary">GoLd...NFT123</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted mb-1">Purchased</div>
                  <div className="text-sm text-text-secondary">January 15, 2026</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted mb-1">Premium Expires</div>
                  <div className="text-sm text-neon-green">January 15, 2027 (342 days)</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm">Upgrade Badge</Button>
                  <Button variant="ghost" size="sm">View on Magic Eden</Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Achievements */}
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: "🔒", name: "First Deposit", unlocked: true },
                { icon: "👻", name: "100 Transfers", unlocked: true },
                { icon: "💎", name: "Diamond Hands", unlocked: true },
                { icon: "🐋", name: "Whale Status", unlocked: true },
                { icon: "🎯", name: "Perfect Score", unlocked: false },
                { icon: "🏆", name: "Top 100", unlocked: false },
                { icon: "🌟", name: "50 Referrals", unlocked: false },
                { icon: "👑", name: "Legendary", unlocked: false },
              ].map((achievement, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl text-center ${
                    achievement.unlocked
                      ? "bg-neon-green/10 border border-neon-green/30"
                      : "bg-bg-tertiary opacity-50"
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
            <StealthRating score={750} />
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Hidden Balance</span>
                <span className="text-neon-green">+200 pts</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Private Transfers</span>
                <span className="text-neon-green">+150 pts</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Gold Badge Boost</span>
                <span className="text-neon-green">+50%</span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              <Button variant="secondary" size="sm" fullWidth>Export Data</Button>
              <Button variant="secondary" size="sm" fullWidth>Download NFT</Button>
              <Button variant="ghost" size="sm" fullWidth>Edit Profile</Button>
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
                <div className="flex-1">
                  <div className="text-sm font-medium text-text-primary">Phantom</div>
                  <div className="text-xs text-text-muted">0x4f2...0e1f</div>
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
    </div>
  );
}
