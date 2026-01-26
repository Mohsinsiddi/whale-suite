"use client";

import { useState } from "react";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import { TabPanel } from "@/components/ui/Tabs";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: "General" },
    { id: "security", label: "Security" },
    { id: "notifications", label: "Notifications" },
    { id: "privacy", label: "Privacy" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary">Manage your account preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs Navigation */}
        <div className="lg:w-48">
          <div className="flex lg:flex-col gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? "bg-neon-green/10 text-neon-green"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-2xl">
          {/* General */}
          <TabPanel value="general" activeValue={activeTab}>
            <Card variant="default" padding="md" className="mb-4">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <div className="space-y-4">
                <Input label="Display Name" defaultValue="Whale #999" />
                <Input label="Email" type="email" placeholder="your@email.com" />
                <Button size="sm">Save Changes</Button>
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
                    <button className="px-4 py-2 text-sm rounded-lg bg-neon-green/10 text-neon-green border border-neon-green/30">
                      Dark
                    </button>
                    <button className="px-4 py-2 text-sm rounded-lg bg-bg-tertiary text-text-muted border border-border-secondary">
                      Darker
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">Language</label>
                  <select className="w-full px-3 py-2 text-sm bg-bg-tertiary border border-border-secondary rounded-lg text-text-primary focus:outline-none focus:border-neon-green">
                    <option>English</option>
                    <option>Spanish</option>
                    <option>Chinese</option>
                  </select>
                </div>
              </div>
            </Card>
          </TabPanel>

          {/* Security */}
          <TabPanel value="security" activeValue={activeTab}>
            <Card variant="default" padding="md" className="mb-4">
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <Badge variant="success" size="xs">Enabled</Badge>
              </CardHeader>
              <p className="text-xs text-text-secondary mb-4">
                Protect your account with an additional layer of security.
              </p>
              <Button variant="secondary" size="sm">Manage 2FA</Button>
            </Card>

            <Card variant="default" padding="md" className="mb-4">
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
              </CardHeader>
              <div className="space-y-3">
                {[
                  { device: "Chrome on MacOS", location: "San Francisco, US", current: true },
                  { device: "Safari on iPhone", location: "San Francisco, US", current: false },
                ].map((session, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary">
                    <div>
                      <div className="text-sm text-text-primary">{session.device}</div>
                      <div className="text-xs text-text-muted">{session.location}</div>
                    </div>
                    {session.current ? (
                      <Badge size="xs" variant="success">Current</Badge>
                    ) : (
                      <Button variant="ghost" size="xs">Revoke</Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <Card variant="default" padding="md">
              <CardHeader>
                <CardTitle>Danger Zone</CardTitle>
              </CardHeader>
              <p className="text-xs text-text-secondary mb-4">
                Permanently delete your account and all associated data.
              </p>
              <Button variant="danger" size="sm">Delete Account</Button>
            </Card>
          </TabPanel>

          {/* Notifications */}
          <TabPanel value="notifications" activeValue={activeTab}>
            <Card variant="default" padding="md">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <div className="space-y-4">
                {[
                  { label: "Transaction confirmations", description: "Get notified when transactions complete", enabled: true },
                  { label: "Whale activity alerts", description: "Large movement notifications", enabled: true },
                  { label: "Referral earnings", description: "When you earn affiliate commissions", enabled: true },
                  { label: "Badge purchases", description: "NFT badge mint confirmations", enabled: true },
                  { label: "Marketing emails", description: "Product updates and announcements", enabled: false },
                ].map((pref, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-text-primary">{pref.label}</div>
                      <div className="text-xs text-text-muted">{pref.description}</div>
                    </div>
                    <button
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        pref.enabled ? "bg-neon-green" : "bg-bg-tertiary"
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          pref.enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </TabPanel>

          {/* Privacy */}
          <TabPanel value="privacy" activeValue={activeTab}>
            <Card variant="default" padding="md" className="mb-4">
              <CardHeader>
                <CardTitle>Data Sharing</CardTitle>
              </CardHeader>
              <div className="space-y-4">
                {[
                  { label: "Analytics", description: "Help improve Whale Suite with anonymous usage data", enabled: true },
                  { label: "Public profile", description: "Allow others to see your badge and achievements", enabled: false },
                  { label: "Leaderboard participation", description: "Appear on public leaderboards", enabled: false },
                ].map((pref, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-text-primary">{pref.label}</div>
                      <div className="text-xs text-text-muted">{pref.description}</div>
                    </div>
                    <button
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        pref.enabled ? "bg-neon-green" : "bg-bg-tertiary"
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          pref.enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
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
              <Button variant="secondary" size="sm">Request Data Export</Button>
            </Card>
          </TabPanel>
        </div>
      </div>
    </div>
  );
}
