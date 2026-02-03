"use client";

import { useState } from "react";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import { TabPanel } from "@/components/ui/Tabs";
import RPCSettings from "@/components/settings/RPCSettings";
import { Globe, Shield, Bell, Lock, Settings, Clock } from "lucide-react";
import { WalletMismatchBanner } from "@/components/ui/WalletMismatchBanner";

// Coming Soon Overlay Component
function ComingSoonOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/60 rounded-xl">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-bg-tertiary border border-border-primary">
          <Clock className="w-4 h-4 text-neon-cyan" />
          <span className="text-sm font-medium text-text-primary">Coming Soon</span>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("rpc");

  const tabs = [
    { id: "general", label: "General", icon: Settings, comingSoon: true },
    { id: "rpc", label: "RPC", icon: Globe, comingSoon: false },
    { id: "security", label: "Security", icon: Shield, comingSoon: true },
    { id: "notifications", label: "Notifications", icon: Bell, comingSoon: true },
    { id: "privacy", label: "Privacy", icon: Lock, comingSoon: true },
  ];

  return (
    <div className="space-y-6">
      <WalletMismatchBanner />

      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary">Manage your account preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs Navigation */}
        <div className="lg:w-56">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg text-left transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-neon-green/10 text-neon-green"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.comingSoon ? (
                    <Badge variant="default" size="xs" className="ml-auto opacity-60">Soon</Badge>
                  ) : tab.id === "rpc" ? (
                    <Badge variant="cyan" size="xs" className="ml-auto">New</Badge>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-2xl">
          {/* General */}
          <TabPanel value="general" activeValue={activeTab}>
            <ComingSoonOverlay>
              <Card variant="default" padding="md" className="mb-4">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <div className="space-y-4">
                  <Input label="Display Name" defaultValue="Whale #999" disabled />
                  <Input label="Email" type="email" placeholder="your@email.com" disabled />
                  <Button size="sm" disabled>Save Changes</Button>
                </div>
              </Card>

              <Card variant="default" padding="md">
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                </CardHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-2">Theme</label>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 text-sm rounded-lg bg-neon-green/10 text-neon-green border border-neon-green/30" disabled>
                        Dark
                      </button>
                      <button className="px-4 py-2 text-sm rounded-lg bg-bg-tertiary text-text-muted border border-border-secondary" disabled>
                        Darker
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-2">Language</label>
                    <select className="w-full px-3 py-2 text-sm bg-bg-tertiary border border-border-secondary rounded-lg text-text-primary focus:outline-none" disabled>
                      <option>English</option>
                    </select>
                  </div>
                </div>
              </Card>
            </ComingSoonOverlay>
          </TabPanel>

          {/* RPC - Fully Functional */}
          <TabPanel value="rpc" activeValue={activeTab}>
            <RPCSettings />
          </TabPanel>

          {/* Security */}
          <TabPanel value="security" activeValue={activeTab}>
            <ComingSoonOverlay>
              <Card variant="default" padding="md" className="mb-4">
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <Badge variant="default" size="xs">Disabled</Badge>
                </CardHeader>
                <p className="text-xs text-text-secondary mb-4">
                  Protect your account with an additional layer of security.
                </p>
                <Button variant="secondary" size="sm" disabled>Setup 2FA</Button>
              </Card>

              <Card variant="default" padding="md" className="mb-4">
                <CardHeader>
                  <CardTitle>Active Sessions</CardTitle>
                </CardHeader>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary">
                    <div>
                      <div className="text-sm text-text-primary">Current Session</div>
                      <div className="text-xs text-text-muted">This device</div>
                    </div>
                    <Badge size="xs" variant="success">Current</Badge>
                  </div>
                </div>
              </Card>

              <Card variant="default" padding="md">
                <CardHeader>
                  <CardTitle>Danger Zone</CardTitle>
                </CardHeader>
                <p className="text-xs text-text-secondary mb-4">
                  Permanently delete your account and all associated data.
                </p>
                <Button variant="danger" size="sm" disabled>Delete Account</Button>
              </Card>
            </ComingSoonOverlay>
          </TabPanel>

          {/* Notifications */}
          <TabPanel value="notifications" activeValue={activeTab}>
            <ComingSoonOverlay>
              <Card variant="default" padding="md">
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                </CardHeader>
                <div className="space-y-4">
                  {[
                    { label: "Transaction confirmations", description: "Get notified when transactions complete" },
                    { label: "Whale activity alerts", description: "Large movement notifications" },
                    { label: "Referral earnings", description: "When you earn affiliate commissions" },
                    { label: "Badge purchases", description: "NFT badge mint confirmations" },
                    { label: "Marketing emails", description: "Product updates and announcements" },
                  ].map((pref, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-text-primary">{pref.label}</div>
                        <div className="text-xs text-text-muted">{pref.description}</div>
                      </div>
                      <button className="relative w-11 h-6 rounded-full bg-bg-tertiary cursor-not-allowed" disabled>
                        <span className="absolute top-1 translate-x-1 w-4 h-4 rounded-full bg-white/50" />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            </ComingSoonOverlay>
          </TabPanel>

          {/* Privacy */}
          <TabPanel value="privacy" activeValue={activeTab}>
            <ComingSoonOverlay>
              <Card variant="default" padding="md" className="mb-4">
                <CardHeader>
                  <CardTitle>Data Sharing</CardTitle>
                </CardHeader>
                <div className="space-y-4">
                  {[
                    { label: "Analytics", description: "Help improve Whale Suite with anonymous usage data" },
                    { label: "Public profile", description: "Allow others to see your badge and achievements" },
                    { label: "Leaderboard participation", description: "Appear on public leaderboards" },
                  ].map((pref, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-text-primary">{pref.label}</div>
                        <div className="text-xs text-text-muted">{pref.description}</div>
                      </div>
                      <button className="relative w-11 h-6 rounded-full bg-bg-tertiary cursor-not-allowed" disabled>
                        <span className="absolute top-1 translate-x-1 w-4 h-4 rounded-full bg-white/50" />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card variant="default" padding="md">
                <CardHeader>
                  <CardTitle>Export Your Data</CardTitle>
                </CardHeader>
                <p className="text-xs text-text-secondary mb-4">
                  Download a copy of all your data including transaction history, settings, and profile information.
                </p>
                <Button variant="secondary" size="sm" disabled>Request Data Export</Button>
              </Card>
            </ComingSoonOverlay>
          </TabPanel>
        </div>
      </div>
    </div>
  );
}
