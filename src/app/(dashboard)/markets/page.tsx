"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Tabs from "@/components/ui/Tabs";
import { SearchInput } from "@/components/ui/Input";

const markets = [
  {
    id: "1",
    question: "Will SOL reach $200 by Q2 2026?",
    category: "Crypto",
    yesPrice: 0.65,
    noPrice: 0.35,
    volume: "$125K",
    liquidity: "$50K",
    endDate: "Mar 31, 2026",
    trending: true,
  },
  {
    id: "2",
    question: "Will Bitcoin ETF inflows exceed $100B?",
    category: "Crypto",
    yesPrice: 0.72,
    noPrice: 0.28,
    volume: "$89K",
    liquidity: "$35K",
    endDate: "Jun 30, 2026",
    trending: true,
  },
  {
    id: "3",
    question: "Will Ethereum flip Bitcoin market cap?",
    category: "Crypto",
    yesPrice: 0.15,
    noPrice: 0.85,
    volume: "$45K",
    liquidity: "$20K",
    endDate: "Dec 31, 2026",
    trending: false,
  },
  {
    id: "4",
    question: "Will Fed cut rates 3+ times in 2026?",
    category: "Macro",
    yesPrice: 0.55,
    noPrice: 0.45,
    volume: "$200K",
    liquidity: "$80K",
    endDate: "Dec 31, 2026",
    trending: false,
  },
];

export default function MarketsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const tabs = [
    { id: "all", label: "All Markets" },
    { id: "crypto", label: "Crypto" },
    { id: "macro", label: "Macro" },
    { id: "sports", label: "Sports" },
  ];

  const filteredMarkets = markets.filter(
    (m) =>
      m.question.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (activeTab === "all" || m.category.toLowerCase() === activeTab)
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Prediction Markets</h1>
          <p className="text-sm text-text-secondary">Anonymous betting via PNP Exchange</p>
        </div>
        <Badge variant="warning" size="sm">
          ⚠️ Beta Feature
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Volume", value: "$459K" },
          { label: "Active Markets", value: "24" },
          { label: "Your Positions", value: "3" },
          { label: "P&L", value: "+$125", positive: true },
        ].map((stat, i) => (
          <Card key={i} variant="stat" padding="sm">
            <div className="text-xs text-text-muted mb-1">{stat.label}</div>
            <div className={`text-lg font-bold ${stat.positive ? "text-neon-green" : "text-text-primary"}`}>
              {stat.value}
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} size="sm" />
        <div className="sm:ml-auto w-full sm:w-64">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery("")}
            placeholder="Search markets..."
          />
        </div>
      </div>

      {/* Markets List */}
      <div className="space-y-4">
        {filteredMarkets.map((market) => (
          <Card key={market.id} variant="default" padding="md" className="hover:border-neon-cyan/40">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Question */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {market.trending && (
                    <Badge size="xs" variant="warning">🔥 Trending</Badge>
                  )}
                  <Badge size="xs" variant="cyan">{market.category}</Badge>
                </div>
                <h3 className="text-sm font-semibold text-text-primary mb-2">
                  {market.question}
                </h3>
                <div className="flex items-center gap-4 text-xs text-text-muted">
                  <span>Vol: {market.volume}</span>
                  <span>Liq: {market.liquidity}</span>
                  <span>Ends: {market.endDate}</span>
                </div>
              </div>

              {/* Prices */}
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-neon-green/10 border border-neon-green/30 text-center min-w-[80px]">
                  <div className="text-xs text-neon-green mb-0.5">YES</div>
                  <div className="text-lg font-bold text-neon-green">
                    {(market.yesPrice * 100).toFixed(0)}¢
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-error/10 border border-error/30 text-center min-w-[80px]">
                  <div className="text-xs text-error mb-0.5">NO</div>
                  <div className="text-lg font-bold text-error">
                    {(market.noPrice * 100).toFixed(0)}¢
                  </div>
                </div>
                <Button size="sm">Trade</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Privacy Notice */}
      <Card variant="default" padding="md">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🎭</div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-1">Anonymous Betting</h4>
            <p className="text-xs text-text-secondary">
              Your bets are placed anonymously. Other users cannot see your wallet address or position sizes.
              Only you can view your positions in your private dashboard.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
