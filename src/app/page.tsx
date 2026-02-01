"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { WhaleLogoHero } from "@/components/ui/WhaleLogo";

// Animated background whale
function FloatingWhale({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.svg
      viewBox="0 0 64 64"
      className={className}
      initial={{ opacity: 0, x: -50 }}
      animate={{
        opacity: [0.1, 0.2, 0.1],
        x: [0, 30, 0],
        y: [0, -15, 0],
      }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <path
        d="M8 32 C8 24 14 16 28 14 C36 13 44 14 50 18 C54 20 56 24 56 30 C56 36 54 42 48 46 C42 50 32 52 24 50 C16 48 10 44 8 38 C7 36 8 34 8 32Z"
        fill="currentColor"
      />
      <path
        d="M8 32 C4 28 2 24 2 22 C4 24 6 26 8 28 L8 32Z M8 32 C4 36 2 40 2 42 C4 40 6 38 8 36 L8 32Z"
        fill="currentColor"
      />
      <path
        d="M32 14 C34 14 38 10 40 8 C40 10 38 14 36 16 C34 18 32 18 32 16 L32 14Z"
        fill="currentColor"
      />
    </motion.svg>
  );
}

// Feature Icons
const ShieldIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const WalletIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const SwapIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
  </svg>
);

const BoltIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const CheckBadge = ({ className = "" }: { className?: string }) => (
  <svg className={`w-3.5 h-3.5 ${className}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const RocketIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const ChannelsIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
  </svg>
);

const CardIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const features = [
  {
    icon: <RocketIcon />,
    title: "Gasless Token Launch",
    description: "Create tokens on Solana without paying gas fees. 100% anonymous creator identity via Anoncoin Protocol.",
    tag: "Anoncoin",
    highlight: true,
    bounty: "$10K",
  },
  {
    icon: <LockIcon />,
    title: "Private Swaps",
    description: "Swap tokens with hidden amounts using Darklake's ZK-powered liquidity pools. Your trade sizes stay secret.",
    tag: "Darklake",
    highlight: true,
  },
  {
    icon: <ShieldIcon />,
    title: "Privacy Cash",
    description: "Shield your SOL holdings from prying eyes with ZK compression. Your balance becomes invisible on-chain.",
    tag: "Light Protocol",
    bounty: "$2.5K",
  },
  {
    icon: <WalletIcon />,
    title: "Ghost Send",
    description: "Send funds via ShadowWire without revealing amounts. Bulletproof ZK proofs keep transfers private.",
    tag: "ShadowWire",
  },
  {
    icon: <ChannelsIcon />,
    title: "Confidential Channels",
    description: "Join exclusive tier-based chat rooms. Badge verification uses FHE - your tier stays encrypted.",
    tag: "INCO FHE",
    highlight: true,
  },
  {
    icon: <SwapIcon />,
    title: "Jupiter Integration",
    description: "Access best swap rates across all Solana DEXs. Public swaps with maximum capital efficiency.",
    tag: "Jupiter",
  },
  {
    icon: <ChartIcon />,
    title: "PNP Markets",
    description: "Trade on prediction markets with privacy. Take YES/NO positions on real-world events.",
    tag: "PNP Exchange",
  },
  {
    icon: <CardIcon />,
    title: "Virtual Cards",
    description: "Anonymous virtual debit cards funded by crypto. Spend anywhere cards are accepted.",
    tag: "Starpay",
    bounty: "$3.5K",
  },
  {
    icon: <UsersIcon />,
    title: "Multi-Send",
    description: "Send tokens to hundreds of recipients in one transaction. Perfect for airdrops and payroll.",
    tag: "Batch",
  },
];

const stats = [
  { value: "7+", label: "Privacy SDKs" },
  { value: "22", label: "Tokens Supported" },
  { value: "0%", label: "Platform Fee" },
  { value: "Live", label: "Mainnet Ready" },
];

// Badge tiers for pricing
const badgeTiers = [
  { name: "Bronze", price: "0.5", color: "from-amber-600 to-amber-400", multiplier: "1.5x" },
  { name: "Silver", price: "2", color: "from-gray-400 to-gray-200", multiplier: "1.75x" },
  { name: "Gold", price: "5", color: "from-yellow-500 to-yellow-300", multiplier: "2x", popular: true },
  { name: "Diamond", price: "10", color: "from-cyan-400 to-blue-300", multiplier: "2.5x" },
  { name: "Legendary", price: "25", color: "from-purple-500 to-pink-400", multiplier: "3x" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-bg-primary via-bg-secondary to-bg-primary" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,255,136,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(0,212,255,0.08),transparent_50%)]" />

        {/* Floating whales in background */}
        <FloatingWhale className="absolute top-1/4 left-10 w-32 h-32 text-neon-green/5" delay={0} />
        <FloatingWhale className="absolute top-1/2 right-20 w-24 h-24 text-neon-cyan/5" delay={2} />
        <FloatingWhale className="absolute bottom-1/4 left-1/3 w-20 h-20 text-neon-green/5" delay={4} />
      </div>

      <Header variant="landing" />

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center text-center px-4 pt-14 relative">
        <div className="max-w-4xl mx-auto">
          {/* Animated Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-8"
          >
            <WhaleLogoHero />
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-xs font-medium bg-neon-green/10 border border-neon-green/30 rounded-full text-neon-green"
          >
            <motion.span
              className="w-2 h-2 bg-neon-green rounded-full"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            Solana Privacy Hack 2026
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-[1.1]"
          >
            <span className="bg-gradient-to-r from-white via-neon-green to-neon-cyan bg-clip-text text-transparent">
              Trade Like a Ghost.
            </span>
            <br />
            <span className="text-text-primary">Think Like a </span>
            <motion.span
              className="text-neon-green inline-block"
              animate={{ textShadow: ["0 0 20px #00ff88", "0 0 40px #00ff88", "0 0 20px #00ff88"] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Whale.
            </motion.span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-base md:text-lg text-text-secondary mb-10 max-w-xl mx-auto"
          >
            Privacy-first trading platform for Solana. Shield balances, transfer privately,
            swap anonymously, and join exclusive whale communities - all in one place.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link
              href="/dashboard"
              className="group w-full sm:w-auto px-8 py-3 text-base font-semibold bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary rounded-xl hover:shadow-glow-md hover:-translate-y-1 transition-all text-center flex items-center justify-center gap-2"
            >
              Launch App - It&apos;s Free
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <ArrowRightIcon />
              </motion.span>
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-3 text-base font-semibold border-2 border-neon-green/50 text-neon-green rounded-xl hover:bg-neon-green/10 hover:border-neon-green transition-all text-center"
            >
              Explore Features
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05, y: -5 }}
                className="p-4 rounded-xl bg-bg-secondary/50 backdrop-blur-sm border border-border-primary hover:border-neon-green/40 transition-all cursor-default"
              >
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-text-muted">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-neon-green/30 flex items-start justify-center p-2">
            <motion.div
              className="w-1.5 h-3 bg-neon-green rounded-full"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg-secondary/80 to-transparent" />

        <div className="max-w-6xl mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent">
                Complete Privacy Toolkit
              </span>
            </h2>
            <p className="text-base text-text-secondary max-w-lg mx-auto">
              9 privacy tools powered by 7+ SDKs. Everything you need to trade invisibly on Solana.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`group p-6 rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border transition-all duration-300 relative overflow-hidden ${
                  feature.highlight
                    ? 'border-neon-green/50 shadow-glow-sm hover:shadow-glow-md'
                    : 'border-border-primary hover:border-neon-green/40 hover:shadow-glow-sm'
                }`}
              >
                {/* Feature tag */}
                {feature.tag && (
                  <div className={`absolute top-4 right-4 px-2 py-1 text-[10px] font-medium rounded-full border ${
                    feature.highlight
                      ? 'bg-neon-green/20 text-neon-green border-neon-green/40'
                      : 'bg-neon-green/10 text-neon-green/80 border-neon-green/20'
                  }`}>
                    {feature.tag}
                  </div>
                )}

                {/* Bounty badge */}
                {feature.bounty && (
                  <div className="absolute top-4 left-4 px-2 py-0.5 text-[9px] font-bold bg-warning/20 text-warning rounded-full border border-warning/30 uppercase tracking-wider">
                    {feature.bounty}
                  </div>
                )}

                {/* Highlight badge for new features */}
                {feature.highlight && !feature.bounty && (
                  <div className="absolute top-4 left-4 px-2 py-0.5 text-[9px] font-bold bg-neon-cyan/20 text-neon-cyan rounded-full border border-neon-cyan/30 uppercase tracking-wider">
                    New
                  </div>
                )}

                {/* Hover glow */}
                <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity ${
                  feature.highlight
                    ? 'from-neon-green/10 to-neon-cyan/10'
                    : 'from-neon-green/5 to-neon-cyan/5'
                }`} />

                <div className="relative">
                  <motion.div
                    className="text-neon-green mb-5"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className="text-lg font-semibold text-text-primary mb-3 group-hover:text-neon-green transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* INCO FHE Section - New */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-blue-500/5" />
        <div className="max-w-6xl mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 text-xs font-medium bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-400">
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              Powered by INCO Network
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
                Fully Homomorphic Encryption
              </span>
            </h2>
            <p className="text-base text-text-secondary max-w-2xl mx-auto">
              The most advanced privacy technology in blockchain. Compute on encrypted data without ever decrypting it.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "🔐",
                title: "Encrypted Verification",
                description: "Your badge tier is verified on encrypted data. The system never sees your actual tier level - only a yes/no result."
              },
              {
                icon: "🎭",
                title: "Anonymous Identity",
                description: "Get a unique pseudonymous ID for each channel. Participate without revealing your wallet or holdings."
              },
              {
                icon: "💬",
                title: "Exclusive Communities",
                description: "Join tier-gated channels from Bronze to Legendary. Network with whales while maintaining privacy."
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/30 hover:border-purple-500/50 transition-all"
              >
                <span className="text-4xl mb-4 block">{item.icon}</span>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{item.title}</h3>
                <p className="text-sm text-text-secondary">{item.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8 p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-center"
          >
            <p className="text-sm text-purple-300">
              <strong>How it works:</strong> INCO&apos;s covalidator network performs verification on encrypted data using TFHE (Threshold Fully Homomorphic Encryption).
              Your badge proof is encrypted client-side and verified without ever being decrypted.
            </p>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-bg-secondary/30" />
        <div className="max-w-6xl mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="text-base text-text-secondary max-w-lg mx-auto">
              Get started in minutes. No account needed - just connect your wallet.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Connect Wallet", desc: "Link your Phantom, Solflare, or any Solana wallet via Privy." },
              { step: "2", title: "Choose Network", desc: "Switch between Mainnet for production or Devnet for testing." },
              { step: "3", title: "Shield & Trade", desc: "Use privacy tools to hide balances, swap privately, and more." },
              { step: "4", title: "Earn Points", desc: "Every action earns points. Climb the leaderboard and unlock rewards." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center text-bg-primary font-bold text-lg">
                  {item.step}
                </div>
                <h3 className="font-semibold text-text-primary mb-2">{item.title}</h3>
                <p className="text-sm text-text-muted">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Powered By - SDK Partners Section */}
      <section className="py-20 relative">
        <div className="max-w-6xl mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 text-xs font-medium bg-neon-green/10 border border-neon-green/30 rounded-full text-neon-green">
              <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
              Hackathon Sponsors & Partners
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
              Powered By Industry Leaders
            </h3>
            <p className="text-sm text-text-muted max-w-lg mx-auto">
              Built with the best privacy infrastructure on Solana
            </p>
          </motion.div>

          {/* Featured Sponsors - Large Cards */}
          <div className="grid md:grid-cols-2 gap-5 mb-6">
            {/* Light Protocol */}
            <motion.a
              href="https://lightprotocol.com"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group p-5 rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border-2 border-yellow-500/40 hover:border-yellow-500/70 hover:shadow-[0_0_30px_rgba(234,179,8,0.2)] transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <BoltIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h4 className="text-lg font-bold text-text-primary group-hover:text-yellow-400 transition-colors">Light Protocol</h4>
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-yellow-500/20 text-yellow-400 rounded-full">MAIN SPONSOR</span>
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-warning/20 text-warning rounded-full">$2.5K BOUNTY</span>
                  </div>
                  <p className="text-xs text-text-secondary mb-2">ZK state compression for Solana. Powers Privacy Cash with compressed accounts and ZK proofs.</p>
                  <div className="flex items-center gap-3 text-[10px] text-text-muted">
                    <span className="flex items-center gap-1"><CheckBadge className="text-yellow-400" /> ZK Compression</span>
                    <span className="flex items-center gap-1"><CheckBadge className="text-yellow-400" /> Privacy Cash</span>
                  </div>
                </div>
              </div>
            </motion.a>

            {/* INCO Network */}
            <motion.a
              href="https://inco.network"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group p-5 rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border-2 border-purple-500/40 hover:border-purple-500/70 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0 text-3xl">
                  🔐
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h4 className="text-lg font-bold text-text-primary group-hover:text-purple-400 transition-colors">INCO Network</h4>
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-purple-500/20 text-purple-400 rounded-full">FHE</span>
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-warning/20 text-warning rounded-full">SPONSOR</span>
                  </div>
                  <p className="text-xs text-text-secondary mb-2">Fully Homomorphic Encryption for confidential computing. Powers encrypted badge verification.</p>
                  <div className="flex items-center gap-3 text-[10px] text-text-muted">
                    <span className="flex items-center gap-1"><CheckBadge className="text-purple-400" /> Encrypted Proofs</span>
                    <span className="flex items-center gap-1"><CheckBadge className="text-purple-400" /> Channels</span>
                  </div>
                </div>
              </div>
            </motion.a>

            {/* Anoncoin */}
            <motion.a
              href="https://anoncoin.it"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group p-5 rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border-2 border-neon-green/40 hover:border-neon-green/70 hover:shadow-glow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-neon-green/20 flex items-center justify-center flex-shrink-0">
                  <RocketIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h4 className="text-lg font-bold text-text-primary group-hover:text-neon-green transition-colors">Anoncoin</h4>
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-neon-cyan/20 text-neon-cyan rounded-full">GASLESS</span>
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-warning/20 text-warning rounded-full">$10K BOUNTY</span>
                  </div>
                  <p className="text-xs text-text-secondary mb-2">Launch tokens without gas fees. 100% anonymous token creation on Solana mainnet.</p>
                  <div className="flex items-center gap-3 text-[10px] text-text-muted">
                    <span className="flex items-center gap-1"><CheckBadge className="text-neon-green" /> No Gas</span>
                    <span className="flex items-center gap-1"><CheckBadge className="text-neon-green" /> Anonymous</span>
                  </div>
                </div>
              </div>
            </motion.a>

            {/* Starpay */}
            <motion.a
              href="https://starpay.finance"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group p-5 rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border-2 border-amber-500/40 hover:border-amber-500/70 hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <CardIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h4 className="text-lg font-bold text-text-primary group-hover:text-amber-400 transition-colors">Starpay</h4>
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-500/20 text-amber-400 rounded-full">VIRTUAL CARDS</span>
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-warning/20 text-warning rounded-full">$3.5K BOUNTY</span>
                  </div>
                  <p className="text-xs text-text-secondary mb-2">Anonymous virtual cards for crypto spending. Privacy-first payment infrastructure.</p>
                  <div className="flex items-center gap-3 text-[10px] text-text-muted">
                    <span className="flex items-center gap-1"><CheckBadge className="text-amber-400" /> Virtual Cards</span>
                    <span className="flex items-center gap-1"><CheckBadge className="text-amber-400" /> Anonymous</span>
                  </div>
                </div>
              </div>
            </motion.a>
          </div>

          {/* Other SDK Partners - Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { name: "ShadowWire", desc: "Bulletproof transfers", color: "blue", tag: "RADR" },
              { name: "Darklake", desc: "ZK private swaps", color: "cyan", tag: "BOUNTY" },
              { name: "Jupiter", desc: "DEX aggregation", color: "emerald", tag: "ECOSYSTEM" },
              { name: "PNP Exchange", desc: "Prediction markets", color: "pink", tag: "BOUNTY" },
              { name: "Helius", desc: "RPC & webhooks", color: "orange", tag: "SPONSOR" },
            ].map((sdk, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.03, y: -3 }}
                className={`group p-4 rounded-xl bg-bg-tertiary/50 border border-${sdk.color}-500/30 hover:border-${sdk.color}-500/60 transition-all`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-text-primary text-sm">{sdk.name}</h4>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${sdk.tag === 'BOUNTY' ? 'bg-warning/20 text-warning' : 'bg-text-muted/20 text-text-muted'}`}>
                    {sdk.tag}
                  </span>
                </div>
                <p className="text-[10px] text-text-secondary">{sdk.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Network Availability Section */}
      <section className="py-16 relative">
        <div className="absolute inset-0 bg-bg-secondary/50" />
        <div className="max-w-4xl mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h3 className="text-xl font-bold text-text-primary mb-2">Network Availability</h3>
            <p className="text-sm text-text-muted">Switch between networks based on your needs</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Mainnet */}
            <div className="p-6 rounded-2xl bg-neon-green/5 border border-neon-green/30">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-3 h-3 bg-neon-green rounded-full animate-pulse" />
                <h4 className="font-bold text-neon-green">Mainnet (Production)</h4>
              </div>
              <ul className="space-y-2 text-sm text-text-secondary">
                {["Privacy Cash (Light Protocol)", "Ghost Send (ShadowWire)", "Jupiter Swaps", "Private Swap (Darklake)", "Virtual Cards (Starpay)", "Token Launcher (Anoncoin)"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckBadge className="text-neon-green" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Devnet */}
            <div className="p-6 rounded-2xl bg-warning/5 border border-warning/30">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-3 h-3 bg-warning rounded-full animate-pulse" />
                <h4 className="font-bold text-warning">Devnet (Testing)</h4>
              </div>
              <ul className="space-y-2 text-sm text-text-secondary">
                {["Dark Pool (Beta swaps)", "Confidential Badge (INCO FHE)", "Private Payments", "Encrypted Channel Access", "All Mainnet features (test mode)"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckBadge className="text-warning" />
                    {f}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-text-muted mt-4">* Features in beta testing before mainnet launch</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Updated with all badge tiers */}
      <section id="pricing" className="py-20 md:py-32 relative">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent">
                NFT Badge Tiers
              </span>
            </h2>
            <p className="text-base text-text-secondary max-w-lg mx-auto">
              Mint a badge NFT to unlock point multipliers, exclusive channels, and affiliate commissions
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-neon-green/10 border border-neon-green/30 rounded-full">
              <span className="text-neon-green font-semibold">Platform is 100% FREE</span>
              <span className="text-text-muted text-sm">• Badges are optional upgrades</span>
            </div>
          </motion.div>

          {/* Badge Tier Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {badgeTiers.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -10, scale: 1.05 }}
                className={`relative p-4 rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border transition-all ${
                  tier.popular
                    ? 'border-neon-green shadow-glow-sm'
                    : 'border-border-primary hover:border-neon-green/30'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[9px] font-bold bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary rounded-full">
                    POPULAR
                  </div>
                )}
                <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br ${tier.color} flex items-center justify-center text-bg-primary font-bold text-lg shadow-lg`}>
                  {tier.name[0]}
                </div>
                <h3 className="text-center font-bold text-text-primary mb-1">{tier.name}</h3>
                <p className="text-center text-2xl font-black text-neon-green mb-1">{tier.price} SOL</p>
                <p className="text-center text-xs text-neon-cyan font-semibold">{tier.multiplier} Points</p>
                <div className="mt-3 pt-3 border-t border-border-primary">
                  <ul className="space-y-1 text-[10px] text-text-muted">
                    <li>✓ 1 Year Premium</li>
                    <li>✓ Channel Access</li>
                    <li>✓ NFT Badge</li>
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Free Tier Highlight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto p-6 rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-primary"
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 flex items-center justify-center text-3xl">
                  🆓
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-bold text-text-primary mb-2">Start Free Forever</h3>
                <p className="text-sm text-text-secondary mb-3">
                  All core privacy features are completely free. No account needed, no subscription required.
                  Just connect your wallet and start using Privacy Cash, Ghost Send, Jupiter Swaps, and more.
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {["Privacy Cash", "Ghost Send", "Jupiter", "PNP Markets", "Whale Intel"].map((f) => (
                    <span key={f} className="px-2 py-1 text-xs bg-neon-green/10 text-neon-green rounded-full">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              <Link
                href="/dashboard"
                className="flex-shrink-0 px-6 py-3 text-sm font-semibold bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary rounded-xl hover:shadow-glow-md transition-all"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg-secondary/50 to-transparent" />
        <div className="max-w-4xl mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h3 className="text-xl font-bold text-text-primary mb-2">Built for Security</h3>
            <p className="text-sm text-text-muted">Your keys, your crypto. We never have custody.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "🔐", title: "Non-Custodial", desc: "All operations via your wallet" },
              { icon: "✅", title: "Audited SDKs", desc: "Using verified protocols" },
              { icon: "🌐", title: "Open Protocols", desc: "Transparent infrastructure" },
              { icon: "⚡", title: "Helius RPC", desc: "Enterprise-grade reliability" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-xl bg-bg-tertiary/50 border border-border-primary text-center"
              >
                <span className="text-2xl mb-2 block">{item.icon}</span>
                <h4 className="font-semibold text-text-primary text-sm mb-1">{item.title}</h4>
                <p className="text-xs text-text-muted">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,255,136,0.15),transparent_60%)]" />

        <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-black mb-6">
              Ready to Become{" "}
              <motion.span
                className="text-neon-green inline-block"
                animate={{ textShadow: ["0 0 20px #00ff88", "0 0 50px #00ff88", "0 0 20px #00ff88"] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Invisible
              </motion.span>
              ?
            </h2>
            <p className="text-base md:text-lg text-text-secondary mb-10 max-w-lg mx-auto">
              Join thousands of whales who value their privacy. Your movements should be yours alone.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-3 px-10 py-4 text-lg font-semibold bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary rounded-2xl hover:shadow-glow-lg transition-all"
              >
                Launch App - Free
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <ArrowRightIcon />
                </motion.span>
              </Link>
            </motion.div>
            <p className="mt-6 text-sm text-text-muted">
              No account needed • Connect any Solana wallet • Start in seconds
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
