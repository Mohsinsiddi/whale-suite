"use client";

import { useState } from "react";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { StealthRating } from "@/components/ui/Progress";
import Badge, { TierBadge } from "@/components/ui/Badge";

// Mock data
const quickActions = [
  { icon: "🔒", label: "Deposit", desc: "Hide SOL" },
  { icon: "👻", label: "Transfer", desc: "Ghost Send" },
  { icon: "💱", label: "Swap", desc: "Dark Pool" },
  { icon: "🎲", label: "Bet", desc: "Anonymous" },
];

const recentActivity = [
  { type: "deposit", amount: "50 SOL", time: "2m ago", status: "success" },
  { type: "transfer", amount: "10 SOL", time: "1h ago", status: "success" },
  { type: "swap", amount: "100 USDC", time: "3h ago", status: "success" },
  { type: "withdraw", amount: "25 SOL", time: "1d ago", status: "pending" },
];

const whaleFeed = [
  { whale: "Whale #A34F", action: "deposited", amount: "500 SOL", time: "5m ago" },
  { whale: "Whale #B7C2", action: "transferred", amount: "1,200 SOL", time: "12m ago" },
  { whale: "Whale #D91E", action: "swapped", amount: "50K USDC", time: "23m ago" },
  { whale: "Whale #F45A", action: "withdrew", amount: "200 SOL", time: "45m ago" },
];

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("24h");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Command Center</h1>
          <p className="text-sm text-text-secondary">Welcome back, Whale #999</p>
        </div>
        <div className="flex items-center gap-2">
          <TierBadge tier="gold" size="sm" />
          <Badge variant="success" dot pulse>Premium Active</Badge>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Public Balance */}
        <Card variant="default" padding="md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-text-muted">Public Balance</span>
            <span className="text-xs text-warning">⚠️ Visible</span>
          </div>
          <div className="text-2xl font-bold text-text-primary mb-1">124.5 SOL</div>
          <div className="text-xs text-text-secondary">≈ $18,675</div>
        </Card>

        {/* Hidden Balance */}
        <Card variant="glow" padding="md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-text-muted">Hidden Balance</span>
            <span className="text-xs text-neon-green">🔒 Private</span>
          </div>
          <div className="text-2xl font-bold text-neon-green mb-1">850.0 SOL</div>
          <div className="text-xs text-text-secondary">≈ $127,500</div>
        </Card>

        {/* Total Portfolio */}
        <Card variant="default" padding="md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-text-muted">Total Portfolio</span>
            <Badge size="xs" variant="success">+12.5%</Badge>
          </div>
          <div className="text-2xl font-bold text-text-primary mb-1">974.5 SOL</div>
          <div className="text-xs text-text-secondary">≈ $146,175</div>
        </Card>
      </div>

      {/* Quick Actions & Stealth Rating */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <Card variant="default" padding="md" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action, i) => (
              <button
                key={i}
                className="p-4 rounded-xl bg-bg-tertiary border border-border-secondary hover:border-neon-green/40 hover:bg-bg-elevated transition-all text-center group"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                  {action.icon}
                </div>
                <div className="text-sm font-medium text-text-primary">{action.label}</div>
                <div className="text-xs text-text-muted">{action.desc}</div>
              </button>
            ))}
          </div>
        </Card>

        {/* Stealth Rating */}
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle>Stealth Rating</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <StealthRating score={750} />
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 rounded-lg bg-bg-tertiary">
                <div className="text-sm font-semibold text-neon-green">87%</div>
                <div className="text-[10px] text-text-muted">Hidden</div>
              </div>
              <div className="p-2 rounded-lg bg-bg-tertiary">
                <div className="text-sm font-semibold text-neon-cyan">42</div>
                <div className="text-[10px] text-text-muted">Private Txs</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Activity & Whale Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <Button variant="ghost" size="xs">View All</Button>
          </CardHeader>
          <div className="space-y-2">
            {recentActivity.map((activity, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary hover:bg-bg-elevated transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                    activity.type === "deposit" ? "bg-neon-green/10 text-neon-green" :
                    activity.type === "withdraw" ? "bg-warning/10 text-warning" :
                    activity.type === "transfer" ? "bg-neon-cyan/10 text-neon-cyan" :
                    "bg-purple-500/10 text-purple-400"
                  }`}>
                    {activity.type === "deposit" ? "↓" :
                     activity.type === "withdraw" ? "↑" :
                     activity.type === "transfer" ? "→" : "↔"}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text-primary capitalize">
                      {activity.type}
                    </div>
                    <div className="text-xs text-text-muted">{activity.time}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-text-primary">{activity.amount}</div>
                  <Badge size="xs" variant={activity.status === "success" ? "success" : "warning"}>
                    {activity.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Whale Intelligence Feed */}
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle>Whale Intelligence</CardTitle>
            <div className="flex gap-1">
              {["24h", "7d", "30d"].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    selectedPeriod === period
                      ? "bg-neon-green/10 text-neon-green"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </CardHeader>
          <div className="space-y-2">
            {whaleFeed.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary hover:bg-bg-elevated transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center text-xs font-bold text-bg-primary">
                    🐋
                  </div>
                  <div>
                    <div className="text-sm text-text-primary">
                      <span className="font-medium text-neon-cyan">{item.whale}</span>
                      <span className="text-text-secondary"> {item.action}</span>
                    </div>
                    <div className="text-xs text-text-muted">{item.time}</div>
                  </div>
                </div>
                <div className="text-sm font-medium text-text-primary">{item.amount}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "24h Volume", value: "$12.5K", change: "+15%" },
          { label: "Total Txs", value: "156", change: "+8" },
          { label: "Gas Saved", value: "2.3 SOL", change: "-12%" },
          { label: "Referrals", value: "12", change: "+3" },
        ].map((stat, i) => (
          <Card key={i} variant="stat" padding="sm">
            <div className="text-xs text-text-muted mb-1">{stat.label}</div>
            <div className="text-lg font-bold text-text-primary">{stat.value}</div>
            <div className={`text-xs ${stat.change.startsWith("+") ? "text-neon-green" : "text-error"}`}>
              {stat.change}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
