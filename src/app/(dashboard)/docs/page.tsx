"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import {
  POINT_ACTIONS,
  BADGE_TIERS,
  SDK_REGISTRY,
  PRIVACY_SCORE_CONFIG,
  type PointAction,
  type BadgeTier,
  type SdkId,
} from "@/lib/points/config";

// Icons
const BookIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const ShieldIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const ChipIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
  </svg>
);

const TrophyIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const ChevronIcon = ({ className, expanded }: { className?: string; expanded?: boolean }) => (
  <svg
    className={`${className} transition-transform ${expanded ? "rotate-180" : ""}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

// Tabs
const tabs = [
  { id: "overview", label: "Overview", icon: <BookIcon className="w-4 h-4" /> },
  { id: "stealth", label: "Stealth Rating", icon: <ShieldIcon className="w-4 h-4" /> },
  { id: "points", label: "Points System", icon: <StarIcon className="w-4 h-4" /> },
  { id: "sdks", label: "SDK Integrations", icon: <ChipIcon className="w-4 h-4" /> },
  { id: "badges", label: "Badge Tiers", icon: <TrophyIcon className="w-4 h-4" /> },
];

// Privacy weight to label
function getPrivacyLabel(weight: number): { label: string; color: string } {
  if (weight === 0) return { label: "None", color: "text-text-muted" };
  if (weight <= 1) return { label: "Low", color: "text-yellow-400" };
  if (weight <= 2) return { label: "Medium", color: "text-orange-400" };
  if (weight <= 3) return { label: "Good", color: "text-blue-400" };
  if (weight <= 4) return { label: "High", color: "text-purple-400" };
  return { label: "Maximum", color: "text-neon-green" };
}

// Expandable section
function ExpandableSection({
  title,
  children,
  defaultExpanded = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-border-secondary rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-bg-tertiary/50 hover:bg-bg-tertiary transition-colors"
      >
        <span className="font-medium text-text-primary">{title}</span>
        <ChevronIcon className="w-5 h-5 text-text-muted" expanded={expanded} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-bg-secondary/30">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Action row
function ActionRow({ action, config }: { action: string; config: typeof POINT_ACTIONS[PointAction] }) {
  const privacy = getPrivacyLabel(config.privacyWeight);

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-bg-tertiary/30 transition-colors">
      <div className="flex-1">
        <p className="text-sm font-medium text-text-primary">{config.description}</p>
        <p className="text-xs text-text-muted font-mono">{action}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-bold text-neon-green">{config.basePoints} pts</p>
          {config.volumeMultiplier && (
            <p className="text-[10px] text-text-muted">+volume bonus</p>
          )}
        </div>
        <div className={`text-xs font-medium ${privacy.color}`}>{privacy.label}</div>
      </div>
    </div>
  );
}

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  // Group actions by SDK
  const actionsByCategory = Object.entries(POINT_ACTIONS).reduce((acc, [action, config]) => {
    const category = config.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push({ action, config });
    return acc;
  }, {} as Record<string, Array<{ action: string; config: typeof POINT_ACTIONS[PointAction] }>>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neon-green via-neon-cyan to-neon-green flex items-center justify-center shadow-lg shadow-neon-green/20">
          <BookIcon className="w-6 h-6 text-bg-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Documentation</h1>
          <p className="text-sm text-text-muted">Points System & SDK Integrations</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-neon-green/20 text-neon-green border border-neon-green/30"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary border border-transparent"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <Card variant="default" padding="lg">
              <CardHeader>
                <CardTitle>Welcome to Whale Suite</CardTitle>
              </CardHeader>
              <div className="space-y-4 mt-4">
                <p className="text-text-secondary">
                  Whale Suite is a privacy-first trading platform for Solana. We integrate the best
                  privacy SDKs to help you trade like a ghost.
                </p>

                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 rounded-xl bg-bg-tertiary/50 border border-border-secondary">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldIcon className="w-5 h-5 text-neon-green" />
                      <h3 className="font-semibold text-text-primary">Stealth Rating</h3>
                    </div>
                    <p className="text-sm text-text-muted">
                      Score from 0-1000 measuring your privacy level. Higher = more anonymous.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-bg-tertiary/50 border border-border-secondary">
                    <div className="flex items-center gap-2 mb-2">
                      <StarIcon className="w-5 h-5 text-neon-cyan" />
                      <h3 className="font-semibold text-text-primary">Points System</h3>
                    </div>
                    <p className="text-sm text-text-muted">
                      Earn points for every action. Climb the leaderboard and unlock rewards.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neon-green/10 border border-neon-green/30 mt-6">
                  <p className="text-sm text-neon-green">
                    <strong>Key Principle:</strong> Privacy-focused actions earn BOTH higher points
                    AND increase your Stealth Rating.
                  </p>
                </div>
              </div>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card variant="default" padding="md" className="text-center">
                <p className="text-3xl font-bold text-neon-green">
                  {Object.keys(POINT_ACTIONS).length}
                </p>
                <p className="text-xs text-text-muted mt-1">Rewarded Actions</p>
              </Card>
              <Card variant="default" padding="md" className="text-center">
                <p className="text-3xl font-bold text-neon-cyan">
                  {Object.keys(SDK_REGISTRY).length}
                </p>
                <p className="text-xs text-text-muted mt-1">SDK Integrations</p>
              </Card>
              <Card variant="default" padding="md" className="text-center">
                <p className="text-3xl font-bold text-purple-400">
                  {Object.keys(BADGE_TIERS).length - 1}
                </p>
                <p className="text-xs text-text-muted mt-1">Badge Tiers</p>
              </Card>
              <Card variant="default" padding="md" className="text-center">
                <p className="text-3xl font-bold text-amber-400">1000</p>
                <p className="text-xs text-text-muted mt-1">Max Stealth</p>
              </Card>
            </div>
          </motion.div>
        )}

        {activeTab === "stealth" && (
          <motion.div
            key="stealth"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <Card variant="default" padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldIcon className="w-5 h-5 text-neon-green" />
                  Stealth Rating Breakdown
                </CardTitle>
              </CardHeader>
              <div className="mt-4 space-y-4">
                <p className="text-text-secondary">
                  Your Stealth Rating measures how invisible you are on the Solana blockchain.
                  Max score is <strong className="text-neon-green">1000</strong>.
                </p>

                <div className="space-y-3 mt-6">
                  {Object.entries(PRIVACY_SCORE_CONFIG.weights).map(([key, config]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 rounded-xl bg-bg-tertiary/50 border border-border-secondary"
                    >
                      <div>
                        <p className="font-medium text-text-primary capitalize">
                          {key.replace(/([A-Z])/g, " $1")}
                        </p>
                        <p className="text-xs text-text-muted">{config.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-neon-green">Max {config.max}</p>
                        {"pointsEach" in config && (
                          <p className="text-[10px] text-text-muted">
                            {config.pointsEach} pts each
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Badge Privacy Bonuses */}
            <Card variant="default" padding="lg">
              <CardHeader>
                <CardTitle>Badge Privacy Bonuses</CardTitle>
              </CardHeader>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(Object.entries(BADGE_TIERS) as [BadgeTier, typeof BADGE_TIERS[BadgeTier]][]).map(
                  ([tier, config]) => (
                    <div
                      key={tier}
                      className="p-3 rounded-xl bg-bg-tertiary/50 border border-border-secondary text-center"
                      style={{ borderColor: tier !== "none" ? config.color + "40" : undefined }}
                    >
                      <p
                        className="font-semibold capitalize"
                        style={{ color: tier !== "none" ? config.color : undefined }}
                      >
                        {tier}
                      </p>
                      <p className="text-lg font-bold text-neon-green mt-1">
                        +{config.privacyBonus}
                      </p>
                    </div>
                  )
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === "points" && (
          <motion.div
            key="points"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <Card variant="default" padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StarIcon className="w-5 h-5 text-neon-cyan" />
                  All Point Actions
                </CardTitle>
              </CardHeader>
              <div className="mt-4 space-y-4">
                {Object.entries(actionsByCategory).map(([category, actions]) => (
                  <ExpandableSection
                    key={category}
                    title={
                      SDK_REGISTRY[category as SdkId]?.name ||
                      category.charAt(0).toUpperCase() + category.slice(1)
                    }
                    defaultExpanded={category === "privacy-cash"}
                  >
                    <div className="space-y-1">
                      {actions.map(({ action, config }) => (
                        <ActionRow key={action} action={action} config={config} />
                      ))}
                    </div>
                  </ExpandableSection>
                ))}
              </div>
            </Card>

            {/* Multipliers */}
            <Card variant="default" padding="lg">
              <CardHeader>
                <CardTitle>Point Multipliers by Badge</CardTitle>
              </CardHeader>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-secondary">
                      <th className="text-left py-2 text-text-muted font-medium">Badge</th>
                      <th className="text-right py-2 text-text-muted font-medium">Multiplier</th>
                      <th className="text-right py-2 text-text-muted font-medium">100 Base →</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.entries(BADGE_TIERS) as [BadgeTier, typeof BADGE_TIERS[BadgeTier]][]).map(
                      ([tier, config]) => (
                        <tr key={tier} className="border-b border-border-secondary/50">
                          <td
                            className="py-2 font-medium capitalize"
                            style={{ color: tier !== "none" ? config.color : undefined }}
                          >
                            {config.name}
                          </td>
                          <td className="py-2 text-right">{config.multiplier}x</td>
                          <td className="py-2 text-right font-bold text-neon-green">
                            {Math.floor(100 * config.multiplier)} pts
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === "sdks" && (
          <motion.div
            key="sdks"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {(Object.entries(SDK_REGISTRY) as [SdkId, typeof SDK_REGISTRY[SdkId]][]).map(
              ([sdkId, sdk]) => (
                <Card key={sdkId} variant="default" padding="md">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-text-primary">{sdk.name}</h3>
                        {sdk.bounty && (
                          <Badge variant="warning" size="sm">
                            {sdk.bounty}
                          </Badge>
                        )}
                        <Badge
                          variant={
                            sdk.privacyLevel === "maximum" || sdk.privacyLevel === "high"
                              ? "success"
                              : sdk.privacyLevel === "medium"
                              ? "info"
                              : "default"
                          }
                          size="sm"
                        >
                          {sdk.privacyLevel}
                        </Badge>
                      </div>
                      <p className="text-sm text-text-secondary mb-2">{sdk.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {sdk.features.map((feature) => (
                          <span
                            key={feature}
                            className="px-2 py-0.5 text-[10px] bg-bg-tertiary rounded-full text-text-muted"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                    <a
                      href={sdk.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-neon-cyan hover:underline flex-shrink-0"
                    >
                      Visit →
                    </a>
                  </div>
                </Card>
              )
            )}
          </motion.div>
        )}

        {activeTab === "badges" && (
          <motion.div
            key="badges"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {(Object.entries(BADGE_TIERS) as [BadgeTier, typeof BADGE_TIERS[BadgeTier]][])
              .filter(([tier]) => tier !== "none")
              .map(([tier, config]) => (
                <Card
                  key={tier}
                  variant="default"
                  padding="md"
                  className="border-l-4"
                  style={{ borderLeftColor: config.color }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: config.color }}>
                        {config.name}
                      </h3>
                      <p className="text-sm text-text-secondary mb-3">{config.description}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-2 rounded-lg bg-bg-tertiary/50">
                          <p className="text-xs text-text-muted">Price</p>
                          <p className="font-bold text-text-primary">{"price" in config ? config.price : 0} SOL</p>
                        </div>
                        <div className="p-2 rounded-lg bg-bg-tertiary/50">
                          <p className="text-xs text-text-muted">Multiplier</p>
                          <p className="font-bold text-neon-green">{config.multiplier}x</p>
                        </div>
                        <div className="p-2 rounded-lg bg-bg-tertiary/50">
                          <p className="text-xs text-text-muted">Affiliate</p>
                          <p className="font-bold text-neon-cyan">
                            {(config.affiliateRate * 100).toFixed(0)}%
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-bg-tertiary/50">
                          <p className="text-xs text-text-muted">Privacy Bonus</p>
                          <p className="font-bold text-purple-400">+{config.privacyBonus}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
