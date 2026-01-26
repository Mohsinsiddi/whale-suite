"use client";

import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Tabs from "@/components/ui/Tabs";
import { useState } from "react";

const holdings = [
  { token: "SOL", name: "Solana", icon: "◎", amount: 974.5, value: 146175, change: 12.5, hidden: 850 },
  { token: "USDC", name: "USD Coin", icon: "$", amount: 5420, value: 5420, change: 0, hidden: 5420 },
  { token: "USDT", name: "Tether", icon: "₮", amount: 1250, value: 1250, change: 0, hidden: 1250 },
  { token: "JUP", name: "Jupiter", icon: "♃", amount: 10000, value: 8500, change: -5.2, hidden: 0 },
  { token: "RAY", name: "Raydium", icon: "◈", amount: 500, value: 2250, change: 8.3, hidden: 500 },
];

const pnlHistory = [
  { date: "Jan 25", pnl: 1250, cumulative: 12500 },
  { date: "Jan 24", pnl: -320, cumulative: 11250 },
  { date: "Jan 23", pnl: 890, cumulative: 11570 },
  { date: "Jan 22", pnl: 450, cumulative: 10680 },
  { date: "Jan 21", pnl: -150, cumulative: 10230 },
];

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState("holdings");

  const tabs = [
    { id: "holdings", label: "Holdings" },
    { id: "pnl", label: "P&L History" },
    { id: "activity", label: "Activity" },
  ];

  const totalValue = holdings.reduce((acc, h) => acc + h.value, 0);
  const totalHidden = holdings.reduce((acc, h) => acc + (h.hidden * (h.value / h.amount)), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">Portfolio</h1>
        <p className="text-sm text-text-secondary">Track your holdings and P&L</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="glow" padding="md">
          <div className="text-xs text-text-muted mb-1">Total Value</div>
          <div className="text-2xl font-bold text-text-primary">${totalValue.toLocaleString()}</div>
          <div className="text-xs text-neon-green">+$12,500 (7.8%)</div>
        </Card>
        <Card variant="default" padding="md">
          <div className="text-xs text-text-muted mb-1">Hidden Value</div>
          <div className="text-2xl font-bold text-neon-green">${totalHidden.toLocaleString()}</div>
          <div className="text-xs text-text-secondary">{((totalHidden / totalValue) * 100).toFixed(1)}% private</div>
        </Card>
        <Card variant="default" padding="md">
          <div className="text-xs text-text-muted mb-1">24h P&L</div>
          <div className="text-2xl font-bold text-neon-green">+$1,250</div>
          <div className="text-xs text-neon-green">+2.4%</div>
        </Card>
        <Card variant="default" padding="md">
          <div className="text-xs text-text-muted mb-1">All-Time P&L</div>
          <div className="text-2xl font-bold text-neon-green">+$12,500</div>
          <div className="text-xs text-neon-green">+8.5%</div>
        </Card>
      </div>

      {/* Chart Placeholder */}
      <Card variant="default" padding="md">
        <CardHeader>
          <CardTitle>Portfolio Value</CardTitle>
          <div className="flex gap-2">
            {["1D", "1W", "1M", "3M", "1Y", "ALL"].map((period) => (
              <button
                key={period}
                className="px-2 py-1 text-xs rounded-md hover:bg-bg-tertiary text-text-muted hover:text-text-secondary transition-colors"
              >
                {period}
              </button>
            ))}
          </div>
        </CardHeader>
        <div className="h-64 flex items-end justify-between gap-1 p-4">
          {[65, 70, 68, 75, 72, 78, 82, 80, 85, 88, 84, 90, 92, 88, 95].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-neon-green/30 to-neon-green/10 rounded-t transition-all hover:from-neon-green/50 hover:to-neon-green/20"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </Card>

      {/* Tabs Content */}
      <div>
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} size="sm" />

        <div className="mt-4">
          {activeTab === "holdings" && (
            <Card variant="default" padding="md">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-secondary">
                      <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-2">Asset</th>
                      <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-2">Balance</th>
                      <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-2">Value</th>
                      <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-2">24h</th>
                      <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-2">Hidden</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((holding) => (
                      <tr key={holding.token} className="border-b border-border-secondary/50 hover:bg-bg-tertiary/50">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-bg-tertiary flex items-center justify-center text-lg">
                              {holding.icon}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-text-primary">{holding.token}</div>
                              <div className="text-xs text-text-muted">{holding.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-right py-3 px-2">
                          <div className="text-sm text-text-primary">{holding.amount.toLocaleString()}</div>
                        </td>
                        <td className="text-right py-3 px-2">
                          <div className="text-sm text-text-primary">${holding.value.toLocaleString()}</div>
                        </td>
                        <td className="text-right py-3 px-2">
                          <span className={`text-sm ${holding.change >= 0 ? "text-neon-green" : "text-error"}`}>
                            {holding.change >= 0 ? "+" : ""}{holding.change}%
                          </span>
                        </td>
                        <td className="text-right py-3 px-2">
                          {holding.hidden > 0 ? (
                            <Badge size="xs" variant="success">{holding.hidden.toLocaleString()} 🔒</Badge>
                          ) : (
                            <Badge size="xs" variant="warning">Public</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeTab === "pnl" && (
            <Card variant="default" padding="md">
              <div className="space-y-2">
                {pnlHistory.map((day, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary hover:bg-bg-elevated transition-colors">
                    <div className="text-sm text-text-secondary">{day.date}</div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${day.pnl >= 0 ? "text-neon-green" : "text-error"}`}>
                        {day.pnl >= 0 ? "+" : ""}{day.pnl.toLocaleString()} USD
                      </div>
                      <div className="text-xs text-text-muted">
                        Total: ${day.cumulative.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === "activity" && (
            <Card variant="default" padding="md">
              <div className="space-y-2">
                {[
                  { action: "Deposit", amount: "50 SOL", time: "2h ago", type: "deposit" },
                  { action: "Swap", amount: "100 USDC → SOL", time: "5h ago", type: "swap" },
                  { action: "Transfer", amount: "25 SOL", time: "1d ago", type: "transfer" },
                  { action: "Withdraw", amount: "10 SOL", time: "2d ago", type: "withdraw" },
                ].map((tx, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary hover:bg-bg-elevated transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                        tx.type === "deposit" ? "bg-neon-green/20 text-neon-green" :
                        tx.type === "withdraw" ? "bg-warning/20 text-warning" :
                        tx.type === "transfer" ? "bg-neon-cyan/20 text-neon-cyan" :
                        "bg-purple-500/20 text-purple-400"
                      }`}>
                        {tx.type === "deposit" ? "↓" :
                         tx.type === "withdraw" ? "↑" :
                         tx.type === "transfer" ? "→" : "↔"}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-text-primary">{tx.action}</div>
                        <div className="text-xs text-text-muted">{tx.time}</div>
                      </div>
                    </div>
                    <div className="text-sm text-text-primary">{tx.amount}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
