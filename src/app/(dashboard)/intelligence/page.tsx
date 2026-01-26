"use client";

import { useState } from "react";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Tabs from "@/components/ui/Tabs";

const whaleFeed = [
  {
    id: "1",
    whale: "Whale #A34F",
    action: "deposited",
    amount: "5,000 SOL",
    usdValue: "$750,000",
    time: "2m ago",
    type: "deposit",
    significance: "high",
  },
  {
    id: "2",
    whale: "Whale #B7C2",
    action: "transferred",
    amount: "12,500 SOL",
    usdValue: "$1,875,000",
    time: "8m ago",
    type: "transfer",
    significance: "high",
  },
  {
    id: "3",
    whale: "Whale #C91D",
    action: "swapped",
    amount: "500K USDC → SOL",
    usdValue: "$500,000",
    time: "15m ago",
    type: "swap",
    significance: "medium",
  },
  {
    id: "4",
    whale: "Whale #D45E",
    action: "withdrew",
    amount: "800 SOL",
    usdValue: "$120,000",
    time: "23m ago",
    type: "withdraw",
    significance: "low",
  },
  {
    id: "5",
    whale: "Whale #E8F1",
    action: "bet",
    amount: "100 SOL",
    usdValue: "$15,000",
    time: "45m ago",
    type: "bet",
    significance: "low",
  },
];

const topWhales = [
  { id: "A34F", activity: 156, volume: "$12.5M", lastSeen: "2m ago" },
  { id: "B7C2", activity: 89, volume: "$8.2M", lastSeen: "8m ago" },
  { id: "C91D", activity: 67, volume: "$5.1M", lastSeen: "15m ago" },
  { id: "D45E", activity: 45, volume: "$3.8M", lastSeen: "23m ago" },
];

export default function IntelligencePage() {
  const [activeTab, setActiveTab] = useState("all");
  const [timeRange, setTimeRange] = useState("24h");

  const tabs = [
    { id: "all", label: "All Activity" },
    { id: "deposits", label: "Deposits" },
    { id: "transfers", label: "Transfers" },
    { id: "swaps", label: "Swaps" },
  ];

  const filteredFeed = whaleFeed.filter(
    (item) => activeTab === "all" || item.type === activeTab.slice(0, -1)
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">Whale Intelligence</h1>
        <p className="text-sm text-text-secondary">Track large movements in real-time</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "24h Volume", value: "$45.2M", change: "+15%" },
          { label: "Active Whales", value: "127", change: "+8" },
          { label: "Large Txs", value: "342", change: "+23" },
          { label: "Net Flow", value: "+$2.1M", change: "Bullish", positive: true },
        ].map((stat, i) => (
          <Card key={i} variant="stat" padding="sm">
            <div className="text-xs text-text-muted mb-1">{stat.label}</div>
            <div className="text-lg font-bold text-text-primary">{stat.value}</div>
            <div className={`text-xs ${stat.positive ? "text-neon-green" : "text-text-muted"}`}>
              {stat.change}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Feed */}
        <div className="lg:col-span-2">
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>Live Feed</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="success" size="xs" dot pulse>Live</Badge>
                <div className="flex gap-1">
                  {["1h", "24h", "7d"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTimeRange(t)}
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${
                        timeRange === t
                          ? "bg-neon-green/10 text-neon-green"
                          : "text-text-muted hover:text-text-secondary"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} size="sm" />

            <div className="mt-4 space-y-2">
              {filteredFeed.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl transition-colors ${
                    item.significance === "high"
                      ? "bg-neon-green/5 border border-neon-green/20"
                      : "bg-bg-tertiary hover:bg-bg-elevated"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                        item.type === "deposit" ? "bg-neon-green/20" :
                        item.type === "withdraw" ? "bg-warning/20" :
                        item.type === "transfer" ? "bg-neon-cyan/20" :
                        item.type === "swap" ? "bg-purple-500/20" :
                        "bg-pink-500/20"
                      }`}>
                        {item.type === "deposit" ? "↓" :
                         item.type === "withdraw" ? "↑" :
                         item.type === "transfer" ? "→" :
                         item.type === "swap" ? "↔" : "🎲"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-neon-cyan">{item.whale}</span>
                          <span className="text-sm text-text-secondary">{item.action}</span>
                        </div>
                        <div className="text-xs text-text-muted">{item.time}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-text-primary">{item.amount}</div>
                      <div className="text-xs text-text-muted">{item.usdValue}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Top Whales */}
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>Top Whales</CardTitle>
            </CardHeader>
            <div className="space-y-3">
              {topWhales.map((whale, i) => (
                <div key={whale.id} className="flex items-center gap-3 p-2 rounded-lg bg-bg-tertiary">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center text-xs font-bold text-bg-primary">
                    #{i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-neon-cyan">Whale #{whale.id}</div>
                    <div className="text-xs text-text-muted">{whale.activity} txs</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-text-primary">{whale.volume}</div>
                    <div className="text-xs text-text-muted">{whale.lastSeen}</div>
                  </div>
                </div>
              ))}
            </div>
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
                  <span className="text-text-primary">68%</span>
                </div>
                <div className="h-2 bg-bg-primary rounded-full overflow-hidden">
                  <div className="h-full w-[68%] bg-gradient-to-r from-neon-green to-neon-cyan rounded-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-2 rounded-lg bg-neon-green/10">
                  <div className="text-sm font-semibold text-neon-green">+$8.5M</div>
                  <div className="text-[10px] text-text-muted">Net Inflow</div>
                </div>
                <div className="p-2 rounded-lg bg-error/10">
                  <div className="text-sm font-semibold text-error">-$6.4M</div>
                  <div className="text-[10px] text-text-muted">Net Outflow</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Alerts */}
          <Card variant="glow" padding="md">
            <CardHeader>
              <CardTitle>Set Alerts</CardTitle>
            </CardHeader>
            <p className="text-xs text-text-secondary mb-3">
              Get notified when whales make large movements
            </p>
            <button className="w-full py-2 text-sm font-semibold text-neon-green border border-neon-green/30 rounded-lg hover:bg-neon-green/10 transition-colors">
              Configure Alerts
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
