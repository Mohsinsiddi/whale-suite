"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
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
import { WalletMismatchBanner } from "@/components/ui/WalletMismatchBanner";

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

const HeartIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const RocketIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
  </svg>
);

const QuestionIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Main Tabs
const tabs = [
  { id: "overview", label: "Overview", icon: <BookIcon className="w-4 h-4" /> },
  { id: "features", label: "Features", icon: <RocketIcon className="w-4 h-4" /> },
  { id: "rewards", label: "Points & Rewards", icon: <StarIcon className="w-4 h-4" /> },
  { id: "partners", label: "SDK Partners", icon: <ChipIcon className="w-4 h-4" /> },
  { id: "faq", label: "FAQ", icon: <QuestionIcon className="w-4 h-4" /> },
  { id: "business", label: "About", icon: <HeartIcon className="w-4 h-4" /> },
];

// FAQ Data
const faqCategories = [
  {
    id: "general",
    title: "General",
    icon: "🏠",
    questions: [
      {
        q: "What is Whale Suite?",
        a: "Whale Suite is a privacy-first trading platform for Solana. It integrates multiple privacy SDKs (Light Protocol, ShadowWire, Darklake, etc.) into one unified interface, allowing you to shield balances, send private transfers, swap tokens anonymously, and more."
      },
      {
        q: "Is Whale Suite free to use?",
        a: "Yes! Whale Suite charges ZERO platform fees. You only pay the underlying SDK protocol fees (like Light Protocol network fees or Solana transaction fees). This is our commitment to making privacy accessible to everyone."
      },
      {
        q: "Which networks are supported?",
        a: "We support both Solana Mainnet and Devnet. Some features like Privacy Cash, Jupiter Swap, and Private Swap are Mainnet-only, while features like Dark Pool and Confidential Channels are currently Devnet-only (testing phase). You can switch networks using the network toggle in the sidebar."
      },
      {
        q: "Do I need to create an account?",
        a: "No traditional account needed. Simply connect your Solana wallet (Phantom, Solflare, etc.) via Privy and you're ready to go. Your wallet IS your account."
      },
    ]
  },
  {
    id: "privacy",
    title: "Privacy Tools",
    icon: "🛡️",
    questions: [
      {
        q: "How does Privacy Cash work?",
        a: "Privacy Cash uses Light Protocol's ZK compression to shield your SOL balance. When you deposit, your SOL is converted to a private balance that's invisible on-chain. Only you can see your shielded balance - it appears as '0' to blockchain explorers."
      },
      {
        q: "What is Ghost Send (ShadowWire)?",
        a: "Ghost Send uses ShadowWire's Bulletproof ZK proofs to hide transfer amounts. When you send SOL, the recipient receives it but the exact amount is hidden on-chain. Perfect for private payments without revealing how much you're sending."
      },
      {
        q: "What's the difference between Jupiter Swap and Private Swap?",
        a: "Jupiter Swap gives you the best rates across all DEXs but transactions are public. Private Swap uses Darklake's ZK AMM to hide your swap amounts - slightly higher fees but maximum privacy. Use Jupiter for casual swaps, Private Swap when you don't want others to see your trading activity."
      },
      {
        q: "Are my transactions truly private?",
        a: "Yes, when using privacy tools. Privacy Cash shields your balance using ZK compression, Ghost Send hides transfer amounts with Bulletproof proofs, and Private Swap uses ZK proofs to hide swap amounts. Regular Jupiter swaps are public. Always check the 'Privacy Level' indicator on each feature."
      },
      {
        q: "What is Dark Pool?",
        a: "Dark Pool is our experimental private swap feature on Devnet. It's a testing ground for new ZK swap technologies before they go to Mainnet. Use it to preview upcoming privacy features and provide feedback."
      },
    ]
  },
  {
    id: "confidential",
    title: "Confidential Channels (INCO FHE)",
    icon: "🔐",
    questions: [
      {
        q: "What are Confidential Channels?",
        a: "Confidential Channels are exclusive chat rooms accessible only to badge holders of specific tiers. The unique part? Your badge tier is verified using Fully Homomorphic Encryption (FHE) - meaning the system verifies you qualify WITHOUT ever knowing your exact badge tier or wallet address."
      },
      {
        q: "How does FHE verification work?",
        a: "When you mint a badge, an encrypted proof of your tier is created using INCO Lightning. When you request channel access, INCO's covalidator network verifies your eligibility by computing on the encrypted data - they never see your actual tier, just a yes/no result. It's like a bouncer checking your ID without seeing your name."
      },
      {
        q: "What is an Anonymous Channel ID?",
        a: "When you join a channel, you get a unique pseudonymous ID (like 'Brave-Dolphin-7842') instead of your wallet address. This lets you participate in discussions without revealing your identity. Your reputation builds on this anon ID across all channels."
      },
      {
        q: "Why are Diamond and Legendary channels 'Coming Soon'?",
        a: "Diamond Den and Legendary Lounge are Mainnet-exclusive premium channels. They require INCO FHE integration on Mainnet, which is still being deployed. Bronze, Silver, and Gold channels are available now on Devnet."
      },
      {
        q: "What is Private Payments?",
        a: "Private Payments is powered by Dark Pool on Devnet. It allows you to make payments with hidden amounts to other users. This feature uses the same ZK technology as Dark Pool swaps but for direct transfers."
      },
    ]
  },
  {
    id: "badges",
    title: "NFT Badges & Rewards",
    icon: "🎖️",
    questions: [
      {
        q: "What are NFT Badges?",
        a: "NFT Badges are on-chain proof of your Whale Suite tier. They come in 5 levels: Bronze, Silver, Gold, Diamond, and Legendary. Each badge is a real NFT you can view on Solscan, trade on marketplaces, or show off in your wallet."
      },
      {
        q: "What benefits do badges provide?",
        a: "Badges give you: 1) Point multipliers (1.5x to 3x) for faster leaderboard climbing, 2) Access to tier-exclusive Confidential Channels, 3) Affiliate commission eligibility (10-25%), and 4) Future premium features access."
      },
      {
        q: "How do points work?",
        a: "You earn points for every privacy action: depositing to Privacy Cash (+10), sending Ghost transfers (+25), swapping (+5-15), joining channels (+20), etc. Points determine your leaderboard rank. Badge holders get multipliers on all points earned."
      },
      {
        q: "What is Stealth Rating?",
        a: "Stealth Rating (0-1000) measures how 'invisible' you are on-chain. It's calculated from your privacy actions: shielded balance ratio, private transfer count, swap privacy usage, etc. Higher rating = more anonymous = more whale-like behavior."
      },
      {
        q: "How does the affiliate program work?",
        a: "Badge holders can earn 10-25% commission on referred users' badge purchases. The program is coming to Mainnet - current Devnet users will get early access. Higher badge tiers = higher commission rates."
      },
    ]
  },
  {
    id: "trading",
    title: "Trading & Launch",
    icon: "💱",
    questions: [
      {
        q: "How do PNP Markets work?",
        a: "PNP Markets are prediction markets where you bet on real-world outcomes. Buy YES or NO shares on events like 'SOL above $200 by end of month'. If you're right, you profit. PNP uses a constant-product market maker for fair pricing."
      },
      {
        q: "What is the Token Launcher?",
        a: "Token Launcher lets you create and launch tokens anonymously using the Anoncoin Protocol. Features include: gasless launches, automatic bonding curves, liquidity locking on Raydium, and hidden creator identity. Perfect for fair launches without doxxing yourself."
      },
      {
        q: "What is Multi-Send / Batch Send?",
        a: "Multi-Send lets you send tokens to many recipients in a single transaction. Instead of 100 separate transactions, you do one. Great for airdrops, payroll, or team distributions. Available in Ghost Send with privacy-preserved amounts."
      },
      {
        q: "What's the $10K bounty on Token Launcher?",
        a: "Several features have hackathon bounties from SDK sponsors. The $10K bounty means Anoncoin Protocol is offering prizes for best implementations. Similarly, Starpay offers $3.5K for Virtual Cards integration. These are hackathon incentives, not user rewards."
      },
    ]
  },
  {
    id: "technical",
    title: "Technical",
    icon: "⚙️",
    questions: [
      {
        q: "Which wallets are supported?",
        a: "We support all major Solana wallets via Privy: Phantom, Solflare, Backpack, Glow, and more. You can also use email login with an embedded wallet if you don't have a Solana wallet yet."
      },
      {
        q: "How many transaction popups will I see?",
        a: "We minimize popups - most actions require only 1 approval. Some complex flows like claiming channel access need 2 (one for the transaction, one for decrypt permission). We show the expected popup count on each feature."
      },
      {
        q: "Are the smart contracts audited?",
        a: "We use official, audited SDKs from Light Protocol, ShadowWire, Jupiter, etc. Our own contracts are deployed on Devnet for testing. Full audits will be completed before Mainnet launch of Whale Suite specific contracts."
      },
      {
        q: "What RPC do you use?",
        a: "We use Helius as our primary RPC provider - they're a hackathon sponsor and provide reliable, fast infrastructure. You can see your connection ping in the network toggle."
      },
      {
        q: "Can I export my data?",
        a: "Your transaction history and points are stored off-chain in our database. On-chain data is always accessible via your wallet. We plan to add CSV export for transaction history in a future update."
      },
    ]
  },
];

// Feature Categories (nested tabs)
const featureCategories = [
  { id: "privacy", label: "Privacy Tools", icon: "🛡️" },
  { id: "confidential", label: "Confidential", icon: "🔐" },
  { id: "trading", label: "Trading", icon: "💱" },
  { id: "predictions", label: "Predictions", icon: "🎲" },
  { id: "analytics", label: "Analytics", icon: "📊" },
  { id: "launch", label: "Launch", icon: "🚀" },
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

// Feature Card Component
function FeatureCard({
  icon,
  title,
  subtitle,
  description,
  privacyLevel,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  network,
  stats,
  steps,
  useCases,
  points,
  badge,
}: {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  privacyLevel: string;
  network: string;
  stats: { popups: number | string; gas: string; fee: string };
  steps: string[];
  useCases: string[];
  points: string;
  badge?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const privacyColor =
    privacyLevel === "Maximum" ? "text-neon-green" :
    privacyLevel === "High" ? "text-neon-cyan" :
    privacyLevel === "Medium" ? "text-yellow-400" : "text-text-muted";

  return (
    <Card variant="default" padding="md" className="hover:border-border-focus transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-bg-tertiary flex items-center justify-center text-2xl flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-text-primary">{title}</h3>
            <span className="text-xs text-text-muted">• {subtitle}</span>
            {badge && <Badge variant="warning" size="xs">{badge}</Badge>}
          </div>
          <p className="text-sm text-text-secondary mt-1">{description}</p>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-3 mt-3 text-xs">
            <span className="px-2 py-1 rounded bg-bg-tertiary">
              <span className="text-text-muted">Popups:</span> <span className="text-text-primary font-medium">{stats.popups}</span>
            </span>
            <span className="px-2 py-1 rounded bg-bg-tertiary">
              <span className="text-text-muted">Gas:</span> <span className="text-text-primary font-medium">{stats.gas}</span>
            </span>
            <span className="px-2 py-1 rounded bg-bg-tertiary">
              <span className="text-text-muted">Fee:</span> <span className="text-neon-green font-medium">{stats.fee}</span>
            </span>
            <span className={`px-2 py-1 rounded bg-bg-tertiary ${privacyColor}`}>
              {privacyLevel} Privacy
            </span>
            <span className="px-2 py-1 rounded bg-bg-tertiary text-neon-cyan">{points}</span>
          </div>

          {/* Expand/Collapse */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 text-xs text-text-muted hover:text-neon-green transition-colors flex items-center gap-1"
          >
            {expanded ? "Hide details" : "Show steps & use cases"}
            <ChevronIcon className="w-3 h-3" expanded={expanded} />
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase mb-2">Steps</p>
                    <ol className="space-y-1">
                      {steps.map((step, i) => (
                        <li key={i} className="text-xs text-text-secondary flex gap-2">
                          <span className="text-neon-green font-bold">{i + 1}.</span> {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase mb-2">Use Cases</p>
                    <ul className="space-y-1">
                      {useCases.map((uc, i) => (
                        <li key={i} className="text-xs text-text-secondary">• {uc}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
}

// Valid section IDs for deep linking
const VALID_SECTIONS = {
  // Main tabs
  overview: { tab: "overview" },
  features: { tab: "features" },
  rewards: { tab: "rewards" },
  partners: { tab: "partners" },
  business: { tab: "business" },
  // Feature categories (will also set tab to "features")
  privacy: { tab: "features", category: "privacy" },
  confidential: { tab: "features", category: "confidential" },
  trading: { tab: "features", category: "trading" },
  predictions: { tab: "features", category: "predictions" },
  analytics: { tab: "features", category: "analytics" },
  launch: { tab: "features", category: "launch" },
  // Aliases for convenience
  "inco": { tab: "features", category: "confidential" },
  "fhe": { tab: "features", category: "confidential" },
  "channels": { tab: "features", category: "confidential" },
  "swap": { tab: "features", category: "trading" },
  "jupiter": { tab: "features", category: "trading" },
  "darklake": { tab: "features", category: "trading" },
  "pnp": { tab: "features", category: "predictions" },
  "markets": { tab: "features", category: "predictions" },
  "shadowwire": { tab: "features", category: "privacy" },
  "ghost-send": { tab: "features", category: "privacy" },
  "transfer": { tab: "features", category: "privacy" },
  "anoncoin": { tab: "features", category: "launch" },
  "token-launch": { tab: "features", category: "launch" },
  "points": { tab: "rewards" },
  "badges": { tab: "rewards" },
  "stealth": { tab: "rewards" },
  "sdk": { tab: "partners" },
  "faq": { tab: "faq" },
  "help": { tab: "faq" },
  "questions": { tab: "faq" },
  "about": { tab: "business" },
} as const;

export default function DocsPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [featureCategory, setFeatureCategory] = useState("privacy");

  // Handle deep linking via URL params (?section=privacy)
  const handleDeepLink = useCallback(() => {
    const section = searchParams.get("section");
    if (section && section in VALID_SECTIONS) {
      const config = VALID_SECTIONS[section as keyof typeof VALID_SECTIONS];
      setActiveTab(config.tab);
      if ("category" in config && config.category) {
        setFeatureCategory(config.category);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    handleDeepLink();
  }, [handleDeepLink]);

  // Update URL when tab changes (for shareable links)
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    // Update URL without navigation
    const url = new URL(window.location.href);
    url.searchParams.set("section", tabId);
    window.history.replaceState({}, "", url.toString());
  }, []);

  const handleCategoryChange = useCallback((categoryId: string) => {
    setFeatureCategory(categoryId);
    // Update URL without navigation
    const url = new URL(window.location.href);
    url.searchParams.set("section", categoryId);
    window.history.replaceState({}, "", url.toString());
  }, []);

  // Group actions by SDK
  const actionsByCategory = Object.entries(POINT_ACTIONS).reduce((acc, [action, config]) => {
    const category = config.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push({ action, config });
    return acc;
  }, {} as Record<string, Array<{ action: string; config: typeof POINT_ACTIONS[PointAction] }>>);

  return (
    <div className="space-y-6">
      <WalletMismatchBanner />

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
            onClick={() => handleTabChange(tab.id)}
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


        {activeTab === "features" && (
          <motion.div
            key="features"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Category Tabs */}
            <div className="flex gap-2 p-1 bg-bg-tertiary rounded-xl overflow-x-auto">
              {featureCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    featureCategory === cat.id
                      ? "bg-bg-primary text-neon-green shadow-sm"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Fee Banner */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-neon-green/10 border border-neon-green/30">
              <div className="flex items-center gap-3">
                <span className="text-xl">💰</span>
                <div>
                  <p className="text-sm font-semibold text-neon-green">Whale Suite Fee: 0%</p>
                  <p className="text-xs text-text-muted">Only SDK protocol fees apply</p>
                </div>
              </div>
              <Badge variant="success" size="sm">Free Forever</Badge>
            </div>

            {/* PRIVACY TOOLS */}
            {featureCategory === "privacy" && (
              <div className="space-y-4">
                <FeatureCard
                  icon="🛡️"
                  title="Privacy Cash"
                  subtitle="Light Protocol (Main Sponsor)"
                  description="Shield your SOL balance using ZK compression. Balance becomes invisible on-chain. Powered by Light Protocol's ZK state compression."
                  privacyLevel="Maximum"
                  network="Mainnet"
                  stats={{ popups: 1, gas: "~0.001 SOL", fee: "0%" }}
                  steps={[
                    "Navigate to Privacy Cash",
                    "Enter amount to shield",
                    "Click 'Shield SOL'",
                    "Approve transaction (1 popup)",
                    "Done! Balance is now hidden"
                  ]}
                  useCases={["Hide large balances", "Whale protection", "Treasury privacy"]}
                  points="+10 pts per deposit"
                  badge="$2.5K Bounty"
                />
                <FeatureCard
                  icon="👻"
                  title="Ghost Send"
                  subtitle="ShadowWire (RADR)"
                  description="Send SOL privately with hidden amounts using Bulletproof ZK proofs. Powered by ShadowWire's stealth protocol."
                  privacyLevel="High"
                  network="Mainnet"
                  stats={{ popups: 1, gas: "~0.002 SOL", fee: "0%" }}
                  steps={[
                    "Shield SOL to your pool first",
                    "Go to Transfer tab",
                    "Enter recipient address",
                    "Enter amount",
                    "Approve transaction (1 popup)",
                    "Amount hidden on-chain!"
                  ]}
                  useCases={["Private payments", "Anonymous gifts", "Salary privacy", "Multi-send"]}
                  points="+25 pts per transfer"
                  badge="Bounty"
                />
              </div>
            )}

            {/* CONFIDENTIAL COMPUTING - INCO FHE */}
            {featureCategory === "confidential" && (
              <div className="space-y-4">
                {/* INCO Overview Banner */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-blue-500/20 border border-purple-500/30">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">🔐</span>
                    <div>
                      <h3 className="font-bold text-text-primary mb-1">INCO FHE - Fully Homomorphic Encryption</h3>
                      <p className="text-sm text-text-secondary">
                        Whale Suite integrates with INCO Network to provide <strong className="text-purple-400">confidential computing</strong> on Solana.
                        INCO enables encrypted on-chain data that can be computed on without ever being decrypted.
                      </p>
                    </div>
                  </div>
                </div>

                <FeatureCard
                  icon="🎫"
                  title="Confidential Channels"
                  subtitle="INCO FHE + Solana"
                  description="Access exclusive tier-based channels using encrypted badge verification. Your badge tier proof is encrypted and verified on-chain without revealing your exact holdings or identity."
                  privacyLevel="Maximum"
                  network="Devnet"
                  stats={{ popups: 2, gas: "~0.003 SOL", fee: "0%" }}
                  steps={[
                    "Mint a badge NFT (Bronze, Silver, Gold, etc.)",
                    "Navigate to Channels page",
                    "Click 'Claim Access' on your tier's channel",
                    "Grant INCO decrypt permission (1 popup)",
                    "Encrypted proof verified on INCO network",
                    "Receive anonymous ID for channel access!"
                  ]}
                  useCases={["Exclusive whale communities", "Anonymous tier verification", "Private group access", "Confidential memberships"]}
                  points="+20 pts per channel join"
                  badge="INCO FHE"
                />

                <FeatureCard
                  icon="🔒"
                  title="Encrypted Tier Proofs"
                  subtitle="Zero-Knowledge Verification"
                  description="Badge tier verification happens entirely on encrypted data. The INCO covalidator network verifies your proof without ever knowing your wallet address or exact tier level."
                  privacyLevel="Maximum"
                  network="Devnet"
                  stats={{ popups: 1, gas: "~0.001 SOL", fee: "0%" }}
                  steps={[
                    "Badge PDA contains encrypted tier proof",
                    "INCO Lightning creates encrypted handle",
                    "Proof submitted to INCO covalidator network",
                    "Verification happens on encrypted data",
                    "Only boolean result revealed (eligible/not eligible)"
                  ]}
                  useCases={["Confidential badge verification", "Hidden tier levels", "Private eligibility checks"]}
                  points="Included in channel access"
                />

                <FeatureCard
                  icon="🆔"
                  title="Anonymous Channel IDs"
                  subtitle="Pseudonymous Participation"
                  description="Each channel membership gets a unique anonymous ID. Participate in exclusive communities without revealing your wallet or badge details to other members."
                  privacyLevel="High"
                  network="Devnet"
                  stats={{ popups: 0, gas: "None after join", fee: "0%" }}
                  steps={[
                    "Successfully join a channel",
                    "System generates unique anon ID",
                    "ID format: adjective-animal-number",
                    "Use this ID in channel interactions",
                    "Your wallet remains private"
                  ]}
                  useCases={["Anonymous whale discussions", "Private trading signals", "Pseudonymous reputation building"]}
                  points="Earn by participation"
                />

                {/* Benefits Section */}
                <Card variant="default" padding="lg" className="border-l-4 border-l-purple-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">💡</span>
                      Why INCO FHE Matters
                    </CardTitle>
                  </CardHeader>
                  <div className="mt-4 space-y-4">
                    <p className="text-text-secondary">
                      Fully Homomorphic Encryption (FHE) allows computation on encrypted data without decryption.
                      This enables powerful new use cases for blockchain privacy:
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                        <h4 className="font-semibold text-purple-400 mb-2">For Users</h4>
                        <ul className="text-sm text-text-secondary space-y-1">
                          <li>• Badge tier remains confidential</li>
                          <li>• Wallet address never exposed</li>
                          <li>• Anonymous participation in channels</li>
                          <li>• Verifiable without revealing data</li>
                        </ul>
                      </div>
                      <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
                        <h4 className="font-semibold text-indigo-400 mb-2">For Projects</h4>
                        <ul className="text-sm text-text-secondary space-y-1">
                          <li>• Token-gated access without doxxing</li>
                          <li>• Confidential airdrops & rewards</li>
                          <li>• Private voting & governance</li>
                          <li>• Encrypted analytics & metrics</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* How It Works */}
                <Card variant="default" padding="lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">⚙️</span>
                      How INCO Integration Works
                    </CardTitle>
                  </CardHeader>
                  <div className="mt-4 space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-bg-tertiary/50">
                        <span className="text-lg font-bold text-neon-green">1</span>
                        <div>
                          <h4 className="font-semibold text-text-primary">Badge Minting</h4>
                          <p className="text-sm text-text-secondary">
                            When you mint a badge NFT, the smart contract also creates an encrypted proof of your tier
                            using INCO Lightning. This proof is stored on-chain but encrypted.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-bg-tertiary/50">
                        <span className="text-lg font-bold text-neon-green">2</span>
                        <div>
                          <h4 className="font-semibold text-text-primary">Access Request</h4>
                          <p className="text-sm text-text-secondary">
                            When you request channel access, you sign a transaction that grants INCO the
                            permission to decrypt and verify your proof.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-bg-tertiary/50">
                        <span className="text-lg font-bold text-neon-green">3</span>
                        <div>
                          <h4 className="font-semibold text-text-primary">Encrypted Verification</h4>
                          <p className="text-sm text-text-secondary">
                            INCO&apos;s covalidator network performs the verification on encrypted data.
                            The computation happens without ever exposing your actual tier level.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-bg-tertiary/50">
                        <span className="text-lg font-bold text-neon-green">4</span>
                        <div>
                          <h4 className="font-semibold text-text-primary">Result Callback</h4>
                          <p className="text-sm text-text-secondary">
                            Only the boolean result (eligible/not eligible) is returned to Solana.
                            You get access without anyone knowing your exact badge tier.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Tech Specs */}
                <Card variant="default" padding="lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ChipIcon className="w-5 h-5 text-neon-cyan" />
                      Technical Details
                    </CardTitle>
                  </CardHeader>
                  <div className="mt-4">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-bg-tertiary/50 border border-border-secondary">
                        <p className="text-xs text-text-muted">INCO Program</p>
                        <p className="text-sm font-mono text-text-primary break-all">INCO Lightning</p>
                      </div>
                      <div className="p-3 rounded-xl bg-bg-tertiary/50 border border-border-secondary">
                        <p className="text-xs text-text-muted">Network</p>
                        <p className="text-sm font-mono text-text-primary">Solana Devnet</p>
                      </div>
                      <div className="p-3 rounded-xl bg-bg-tertiary/50 border border-border-secondary">
                        <p className="text-xs text-text-muted">Encryption</p>
                        <p className="text-sm font-mono text-text-primary">FHE (TFHE)</p>
                      </div>
                      <div className="p-3 rounded-xl bg-bg-tertiary/50 border border-border-secondary">
                        <p className="text-xs text-text-muted">Covalidator</p>
                        <p className="text-sm font-mono text-text-primary">INCO Alpha Network</p>
                      </div>
                    </div>
                    <div className="mt-4 p-3 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30">
                      <p className="text-sm text-neon-cyan">
                        <strong>Mainnet Ready:</strong> Diamond and Legendary tier channels will be available
                        on mainnet with full INCO FHE integration. Early adopters get exclusive benefits!
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* TRADING */}
            {featureCategory === "trading" && (
              <div className="space-y-4">
                <FeatureCard
                  icon="💱"
                  title="Jupiter Swap"
                  subtitle="Best Rates"
                  description="Swap any token with best rates across all Solana DEXs. Public transaction."
                  privacyLevel="Public"
                  network="Mainnet"
                  stats={{ popups: 1, gas: "~0.0001 SOL", fee: "0%" }}
                  steps={[
                    "Select 'From' token",
                    "Select 'To' token",
                    "Enter amount",
                    "Review rate & slippage",
                    "Click Swap → Approve (1 popup)",
                    "Tokens received!"
                  ]}
                  useCases={["Token trading", "Portfolio rebalancing", "Stablecoin conversion"]}
                  points="+5 pts per swap"
                />
                <FeatureCard
                  icon="🔐"
                  title="Private Swap"
                  subtitle="Darklake ZK AMM"
                  description="Swap tokens privately with hidden amounts using ZK proofs. First ZK-native AMM on Solana."
                  privacyLevel="Maximum"
                  network="Mainnet"
                  stats={{ popups: 1, gas: "~0.002 SOL", fee: "~0.3%" }}
                  steps={[
                    "Select token pair",
                    "Enter swap amount",
                    "ZK proof generates automatically",
                    "Click Swap → Approve (1 popup)",
                    "Private swap complete!"
                  ]}
                  useCases={["Whale trades", "Hide trading patterns", "Private accumulation"]}
                  points="+15 pts per swap"
                  badge="Bounty"
                />
                <FeatureCard
                  icon="🌙"
                  title="Dark Pool"
                  subtitle="Beta Testing"
                  description="Experimental ZK swap feature. Test on devnet before mainnet launch."
                  privacyLevel="High"
                  network="Devnet"
                  stats={{ popups: 1, gas: "Free (devnet)", fee: "0%" }}
                  steps={[
                    "Switch to Devnet network",
                    "Get test tokens from faucet",
                    "Navigate to Dark Pool",
                    "Test private swaps"
                  ]}
                  useCases={["Beta testing", "Feature preview"]}
                  points="No points (devnet)"
                  badge="Beta"
                />
              </div>
            )}

            {/* PREDICTIONS */}
            {featureCategory === "predictions" && (
              <div className="space-y-4">
                <FeatureCard
                  icon="🎲"
                  title="PNP Markets"
                  subtitle="PNP Exchange"
                  description="Trade on prediction markets anonymously. Take YES/NO positions on real-world events with privacy-preserving bets."
                  privacyLevel="Medium"
                  network="Mainnet"
                  stats={{ popups: 1, gas: "~0.0001 SOL", fee: "2% on wins" }}
                  steps={[
                    "Browse active markets",
                    "Select a prediction",
                    "Choose YES or NO",
                    "Enter stake amount",
                    "Place Bet → Approve (1 popup)",
                    "Claim winnings if correct!"
                  ]}
                  useCases={["Price predictions", "Event betting", "Portfolio hedging"]}
                  points="+8 pts per bet"
                  badge="Bounty"
                />
              </div>
            )}

            {/* ANALYTICS */}
            {featureCategory === "analytics" && (
              <div className="space-y-4">
                <FeatureCard
                  icon="🐋"
                  title="Whale Intelligence"
                  subtitle="Powered by Helius"
                  description="Monitor platform activity, leaderboards, and flow analysis. Real-time data powered by Helius RPC & webhooks."
                  privacyLevel="Public"
                  network="All"
                  stats={{ popups: 0, gas: "None", fee: "Free" }}
                  steps={[
                    "Navigate to Whale Intelligence",
                    "View live activity feed",
                    "Check leaderboard rankings",
                    "Analyze deposit/withdrawal flows"
                  ]}
                  useCases={["Market monitoring", "Competitive tracking", "Flow analysis"]}
                  points="Earn by activity"
                  badge="Sponsor"
                />
                <FeatureCard
                  icon="💳"
                  title="Virtual Cards"
                  subtitle="Starpay"
                  description="Virtual debit cards funded by crypto. Anonymous spending anywhere cards are accepted."
                  privacyLevel="High"
                  network="Coming Soon"
                  stats={{ popups: "-", gas: "-", fee: "-" }}
                  steps={[
                    "Feature in development",
                    "Powered by Starpay Protocol",
                    "Anonymous card generation",
                    "Coming soon!"
                  ]}
                  useCases={["Anonymous spending", "Online payments", "Crypto to fiat"]}
                  points="Coming Soon"
                  badge="$3.5K Bounty"
                />
                <FeatureCard
                  icon="📊"
                  title="Portfolio Tracker"
                  subtitle="Cross-Wallet View"
                  description="Track your portfolio across all wallets. View balances, history, and performance."
                  privacyLevel="Public"
                  network="All"
                  stats={{ popups: 0, gas: "None", fee: "Free" }}
                  steps={[
                    "Navigate to Portfolio",
                    "Connect wallets",
                    "View combined balances",
                    "Track performance history"
                  ]}
                  useCases={["Portfolio tracking", "Multi-wallet management", "Performance analysis"]}
                  points="View only"
                />
              </div>
            )}

            {/* LAUNCH */}
            {featureCategory === "launch" && (
              <div className="space-y-4">
                <FeatureCard
                  icon="🚀"
                  title="Token Launcher"
                  subtitle="Anoncoin Protocol"
                  description="Launch tokens gaslessly with anonymous creator identity. Includes bonding curve, liquidity lock, and fair launch mechanics."
                  privacyLevel="High"
                  network="Mainnet"
                  stats={{ popups: 1, gas: "Gasless", fee: "1% on trades" }}
                  steps={[
                    "Configure token (name, symbol, supply)",
                    "Upload token image & metadata",
                    "Set initial price curve",
                    "Launch gaslessly → Sign (1 popup)",
                    "Liquidity auto-locks on Raydium",
                    "Share & promote your token!"
                  ]}
                  useCases={["Anonymous launches", "Fair token launches", "Meme coins", "Community tokens"]}
                  points="+50 pts per launch"
                  badge="$10K Bounty"
                />
                <FeatureCard
                  icon="📨"
                  title="Batch Send"
                  subtitle="Multi-Recipient Transfers"
                  description="Send tokens to multiple recipients in a single transaction. Save gas and time."
                  privacyLevel="High"
                  network="Mainnet"
                  stats={{ popups: 1, gas: "~0.005 SOL", fee: "0%" }}
                  steps={[
                    "Go to Ghost Send → Multi-Send",
                    "Add recipient addresses",
                    "Enter amounts for each",
                    "Review total amount",
                    "Approve single transaction (1 popup)",
                    "All transfers complete!"
                  ]}
                  useCases={["Airdrops", "Payroll", "Team payments", "Distribution events"]}
                  points="+25 pts per batch"
                />
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "rewards" && (
          <motion.div
            key="rewards"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Stealth Rating */}
            <Card variant="default" padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldIcon className="w-5 h-5 text-neon-green" />
                  Stealth Rating (0-1000)
                </CardTitle>
              </CardHeader>
              <div className="mt-4 space-y-4">
                <p className="text-text-secondary">
                  Your privacy score. Higher = more invisible on the blockchain.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {Object.entries(PRIVACY_SCORE_CONFIG.weights).map(([key, config]) => (
                    <div key={key} className="p-3 rounded-xl bg-bg-tertiary/50 border border-border-secondary">
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-text-primary capitalize text-sm">
                          {key.replace(/([A-Z])/g, " $1")}
                        </p>
                        <p className="text-sm font-bold text-neon-green">+{config.max}</p>
                      </div>
                      <p className="text-xs text-text-muted mt-1">{config.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Points System */}
            <Card variant="default" padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StarIcon className="w-5 h-5 text-neon-cyan" />
                  Points by Action
                </CardTitle>
              </CardHeader>
              <div className="mt-4 space-y-3">
                {Object.entries(actionsByCategory).map(([category, actions]) => (
                  <ExpandableSection
                    key={category}
                    title={SDK_REGISTRY[category as SdkId]?.name || category}
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

            {/* Badge Multipliers */}
            <Card variant="default" padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrophyIcon className="w-5 h-5 text-yellow-400" />
                  Badge Multipliers
                </CardTitle>
              </CardHeader>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(Object.entries(BADGE_TIERS) as [BadgeTier, typeof BADGE_TIERS[BadgeTier]][])
                  .filter(([tier]) => tier !== "none")
                  .map(([tier, config]) => (
                    <div
                      key={tier}
                      className="p-3 rounded-xl bg-bg-tertiary/50 border border-border-secondary text-center"
                      style={{ borderColor: config.color + "40" }}
                    >
                      <p className="font-semibold" style={{ color: config.color }}>{config.name}</p>
                      <p className="text-xl font-bold text-text-primary mt-1">{config.multiplier}x</p>
                      <p className="text-[10px] text-text-muted">points multiplier</p>
                    </div>
                  ))}
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === "partners" && (
          <motion.div
            key="partners"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <p className="text-text-secondary mb-4">
              Whale Suite integrates with the best privacy infrastructure on Solana:
            </p>
            {(Object.entries(SDK_REGISTRY) as [SdkId, typeof SDK_REGISTRY[SdkId]][]).map(
              ([sdkId, sdk]) => (
                <Card key={sdkId} variant="default" padding="md">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-text-primary">{sdk.name}</h3>
                        {sdk.bounty && <Badge variant="warning" size="sm">{sdk.bounty}</Badge>}
                        <Badge
                          variant={sdk.privacyLevel === "maximum" || sdk.privacyLevel === "high" ? "success" : sdk.privacyLevel === "medium" ? "info" : "default"}
                          size="sm"
                        >
                          {sdk.privacyLevel}
                        </Badge>
                      </div>
                      <p className="text-sm text-text-secondary mb-2">{sdk.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {sdk.features.map((feature) => (
                          <span key={feature} className="px-2 py-0.5 text-[10px] bg-bg-tertiary rounded-full text-text-muted">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                    <a href={sdk.website} target="_blank" rel="noopener noreferrer" className="text-xs text-neon-cyan hover:underline">
                      Visit →
                    </a>
                  </div>
                </Card>
              )
            )}
          </motion.div>
        )}

        {activeTab === "faq" && (
          <motion.div
            key="faq"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* FAQ Header */}
            <Card variant="glow" padding="lg">
              <div className="text-center">
                <QuestionIcon className="w-12 h-12 mx-auto text-neon-green mb-3" />
                <h2 className="text-xl font-bold text-text-primary mb-2">Frequently Asked Questions</h2>
                <p className="text-text-secondary max-w-lg mx-auto">
                  Everything you need to know about Whale Suite, privacy tools, badges, and more.
                </p>
              </div>
            </Card>

            {/* FAQ Categories */}
            <div className="space-y-4">
              {faqCategories.map((category) => (
                <Card key={category.id} variant="default" padding="lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{category.icon}</span>
                      {category.title}
                    </CardTitle>
                  </CardHeader>
                  <div className="mt-4 space-y-2">
                    {category.questions.map((qa, idx) => (
                      <ExpandableSection key={idx} title={qa.q}>
                        <p className="text-sm text-text-secondary leading-relaxed">{qa.a}</p>
                      </ExpandableSection>
                    ))}
                  </div>
                </Card>
              ))}
            </div>

            {/* Still Have Questions */}
            <Card variant="default" padding="lg" className="border-l-4 border-l-neon-cyan">
              <div className="flex items-start gap-4">
                <span className="text-3xl">💬</span>
                <div>
                  <h3 className="font-bold text-text-primary mb-2">Still Have Questions?</h3>
                  <p className="text-sm text-text-secondary mb-3">
                    Can&apos;t find what you&apos;re looking for? Our community is here to help.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href="https://twitter.com/whalesuite"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-sm font-medium bg-bg-tertiary rounded-lg text-text-secondary hover:text-neon-cyan transition-colors"
                    >
                      Twitter / X
                    </a>
                    <a
                      href="https://discord.gg/whalesuite"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-sm font-medium bg-bg-tertiary rounded-lg text-text-secondary hover:text-neon-cyan transition-colors"
                    >
                      Discord
                    </a>
                    <a
                      href="https://t.me/whalesuite"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-sm font-medium bg-bg-tertiary rounded-lg text-text-secondary hover:text-neon-cyan transition-colors"
                    >
                      Telegram
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === "business" && (
          <motion.div
            key="business"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Mission Statement */}
            <Card variant="glow" padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HeartIcon className="w-5 h-5 text-pink-500" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <div className="mt-4 space-y-4">
                <p className="text-lg text-text-primary">
                  Privacy is a fundamental right, not a luxury.
                </p>
                <p className="text-text-secondary">
                  Whale Suite exists to make blockchain privacy accessible to everyone. We believe that
                  financial privacy should be easy to use, affordable, and available to all Solana users -
                  not just technical experts or wealthy traders.
                </p>
              </div>
            </Card>

            {/* Free for Everyone */}
            <Card variant="default" padding="lg" className="border-l-4 border-l-neon-green">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🆓</span>
                  Free to Use
                </CardTitle>
                <Badge variant="success" size="sm">No Platform Fees</Badge>
              </CardHeader>
              <div className="mt-4 space-y-4">
                <p className="text-text-secondary">
                  <strong className="text-neon-green">Whale Suite charges ZERO fees</strong> for using our platform.
                  This is our initial launch version, and we want as many users as possible to experience
                  true blockchain privacy.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 rounded-xl bg-neon-green/10 border border-neon-green/30">
                    <h4 className="font-semibold text-neon-green mb-2">What&apos;s Free</h4>
                    <ul className="text-sm text-text-secondary space-y-1">
                      <li>✓ Privacy Cash shielding</li>
                      <li>✓ ShadowWire transfers</li>
                      <li>✓ Jupiter swaps</li>
                      <li>✓ Private swaps</li>
                      <li>✓ All platform features</li>
                      <li>✓ Leaderboard & points</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl bg-bg-tertiary/50 border border-border-secondary">
                    <h4 className="font-semibold text-text-primary mb-2">Only SDK Fees Apply</h4>
                    <ul className="text-sm text-text-secondary space-y-1">
                      <li>• Light Protocol fees (~0.001 SOL)</li>
                      <li>• ShadowWire network fees</li>
                      <li>• Jupiter swap fees</li>
                      <li>• Darklake pool fees</li>
                      <li>• Standard Solana tx fees</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>

            {/* Revenue Model */}
            <Card variant="default" padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">💎</span>
                  Future Sustainability
                </CardTitle>
              </CardHeader>
              <div className="mt-4 space-y-4">
                <p className="text-text-secondary">
                  While the platform is currently free, we&apos;re building towards a sustainable future.
                  Our potential revenue streams:
                </p>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-bg-tertiary/50 border border-border-secondary">
                    <h4 className="font-semibold text-text-primary mb-1">NFT Badges</h4>
                    <p className="text-sm text-text-secondary">
                      Premium badge tiers unlock multipliers, exclusive features, and affiliate commissions.
                      Badge holders directly support platform development.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-bg-tertiary/50 border border-border-secondary">
                    <h4 className="font-semibold text-text-primary mb-1">Affiliate Program</h4>
                    <p className="text-sm text-text-secondary">
                      Badge holders earn 10-25% commission on referrals, creating a community-driven
                      growth model.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-bg-tertiary/50 border border-border-secondary">
                    <h4 className="font-semibold text-text-primary mb-1">Premium Features (Future)</h4>
                    <p className="text-sm text-text-secondary">
                      Advanced analytics, custom alerts, priority support, and institutional-grade
                      features may be introduced as premium options.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* For Investors */}
            <Card variant="default" padding="lg" className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🤝</span>
                  For Investors & Partners
                </CardTitle>
              </CardHeader>
              <div className="mt-4 space-y-4">
                <p className="text-text-secondary">
                  Whale Suite is built for the Solana Privacy Hack 2026. We&apos;re actively seeking
                  partnerships and investment discussions to scale the platform.
                </p>
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                  <h4 className="font-semibold text-purple-400 mb-2">What We Offer</h4>
                  <ul className="text-sm text-text-secondary space-y-1">
                    <li>• First-mover advantage in Solana privacy infrastructure</li>
                    <li>• Integration with 5+ leading privacy SDKs</li>
                    <li>• Gamified user acquisition through points & badges</li>
                    <li>• Community-driven growth via affiliate system</li>
                    <li>• Proven tech stack ready for scale</li>
                  </ul>
                </div>
                <p className="text-sm text-text-muted">
                  Interested in partnering? Reach out to discuss opportunities.
                </p>
              </div>
            </Card>

            {/* SDK Partners */}
            <Card variant="default" padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🔗</span>
                  Our SDK Partners
                </CardTitle>
              </CardHeader>
              <div className="mt-4">
                <p className="text-text-secondary mb-4">
                  Whale Suite integrates with the best privacy infrastructure on Solana:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { name: "Light Protocol", desc: "ZK Compression" },
                    { name: "ShadowWire", desc: "Bulletproof Transfers" },
                    { name: "Jupiter", desc: "DEX Aggregation" },
                    { name: "Darklake", desc: "ZK AMM" },
                    { name: "PNP Protocol", desc: "Prediction Markets" },
                    { name: "Helius", desc: "RPC & Webhooks" },
                    { name: "INCO Network", desc: "FHE Confidential" },
                  ].map(sdk => (
                    <div key={sdk.name} className="p-3 rounded-xl bg-bg-tertiary/50 border border-border-secondary text-center">
                      <p className="font-semibold text-text-primary text-sm">{sdk.name}</p>
                      <p className="text-xs text-text-muted">{sdk.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Open Source */}
            <Card variant="default" padding="lg" className="border-l-4 border-l-neon-cyan">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🌐</span>
                  Transparency & Trust
                </CardTitle>
              </CardHeader>
              <div className="mt-4 space-y-4">
                <p className="text-text-secondary">
                  We believe in transparency. Our platform is built on open protocols and verified
                  smart contracts. All SDK integrations use official, audited libraries.
                </p>
                <div className="p-3 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30">
                  <p className="text-sm text-neon-cyan">
                    <strong>Trust Model:</strong> We never have custody of your funds. All operations
                    are executed directly through audited SDK protocols. Your keys, your crypto.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
