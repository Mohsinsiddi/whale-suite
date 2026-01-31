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

const features = [
  {
    icon: <RocketIcon />,
    title: "Gasless Token Launch",
    description: "Create tokens on Solana without paying gas fees. 100% anonymous via Anoncoin.",
    tag: "Anoncoin",
    highlight: true,
  },
  {
    icon: <LockIcon />,
    title: "Private Swaps",
    description: "Swap tokens with hidden amounts using Darklake's ZK-powered liquidity pools.",
    tag: "Darklake",
    highlight: true,
  },
  {
    icon: <ShieldIcon />,
    title: "Hidden Balance",
    description: "Shield your SOL holdings from prying eyes with Privacy Cash. Your wealth stays private.",
    tag: "ZK Proofs",
  },
  {
    icon: <WalletIcon />,
    title: "Private Transfers",
    description: "Send funds via ShadowWire without revealing amounts or identity. True transfer privacy.",
    tag: "Bulletproofs",
  },
  {
    icon: <SwapIcon />,
    title: "Anonymous Predictions",
    description: "Place predictions on PNP Exchange without exposing your wallet size.",
    tag: "P2P Markets",
  },
  {
    icon: <ChartIcon />,
    title: "Whale Intelligence",
    description: "Track what other whales are doing while staying anonymous yourself.",
    tag: "Helius",
  },
];

const stats = [
  { value: "5+", label: "Privacy SDKs" },
  { value: "22", label: "Tokens Supported" },
  { value: "100%", label: "Anonymous" },
  { value: "Live", label: "Mainnet" },
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
            Privacy-first trading tools for Solana whales. Hide your balance,
            transfer privately, and trade without being watched.
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
              Get Started Free
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
              Learn More
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
                Privacy Where It Matters
              </span>
            </h2>
            <p className="text-base text-text-secondary max-w-lg mx-auto">
              Professional-grade tools for serious traders who value their privacy
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
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

                {/* Highlight badge for new features */}
                {feature.highlight && (
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
                    className={feature.highlight ? 'text-neon-green mb-5' : 'text-neon-green mb-5'}
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

      {/* Powered By - Bounty Sponsors Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-bg-secondary/30" />
        <div className="max-w-6xl mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 text-xs font-medium bg-neon-green/10 border border-neon-green/30 rounded-full text-neon-green">
              <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
              Solana Privacy Hack 2026
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
              Powered By Industry Leaders
            </h3>
            <p className="text-sm text-text-muted max-w-lg mx-auto">
              Built with the best privacy infrastructure on Solana
            </p>
          </motion.div>

          {/* Featured Bounty Sponsors - Large Cards */}
          <div className="grid md:grid-cols-2 gap-5 mb-6">
            {/* Anoncoin */}
            <motion.a
              href="https://anoncoin.it"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
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
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-warning/20 text-warning rounded-full">BOUNTY</span>
                  </div>
                  <p className="text-xs text-text-secondary mb-2">Launch tokens without gas fees. 100% anonymous token creation on Solana mainnet.</p>
                  <div className="flex items-center gap-3 text-[10px] text-text-muted">
                    <span className="flex items-center gap-1"><CheckBadge className="text-neon-green" /> No Gas</span>
                    <span className="flex items-center gap-1"><CheckBadge className="text-neon-green" /> Anonymous</span>
                    <span className="flex items-center gap-1"><CheckBadge className="text-neon-green" /> Mainnet</span>
                  </div>
                </div>
              </div>
            </motion.a>

            {/* Privacy Cash */}
            <motion.a
              href="https://privacycash.io"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group p-5 rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border-2 border-purple-500/40 hover:border-purple-500/70 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <ShieldIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h4 className="text-lg font-bold text-text-primary group-hover:text-purple-400 transition-colors">Privacy Cash</h4>
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-purple-500/20 text-purple-400 rounded-full">ZK PROOFS</span>
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-warning/20 text-warning rounded-full">$2.5K BOUNTY</span>
                  </div>
                  <p className="text-xs text-text-secondary mb-2">Hide your SOL balance with zero-knowledge proofs. Complete financial privacy on Solana.</p>
                  <div className="flex items-center gap-3 text-[10px] text-text-muted">
                    <span className="flex items-center gap-1"><CheckBadge className="text-purple-400" /> Hidden Balance</span>
                    <span className="flex items-center gap-1"><CheckBadge className="text-purple-400" /> ZK Proofs</span>
                  </div>
                </div>
              </div>
            </motion.a>

            {/* ShadowWire / Radr Labs */}
            <motion.a
              href="https://radr.dev"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group p-5 rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border-2 border-blue-500/40 hover:border-blue-500/70 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <WalletIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h4 className="text-lg font-bold text-text-primary group-hover:text-blue-400 transition-colors">ShadowWire</h4>
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-blue-500/20 text-blue-400 rounded-full">BULLETPROOFS</span>
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-warning/20 text-warning rounded-full">BOUNTY</span>
                  </div>
                  <p className="text-xs text-text-secondary mb-2">Private transfers with hidden amounts. Powered by Radr Labs bulletproof technology.</p>
                  <div className="flex items-center gap-3 text-[10px] text-text-muted">
                    <span className="flex items-center gap-1"><CheckBadge className="text-blue-400" /> Hidden Amounts</span>
                    <span className="flex items-center gap-1"><CheckBadge className="text-blue-400" /> Radr Labs</span>
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
                  <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
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
                    <span className="flex items-center gap-1"><CheckBadge className="text-amber-400" /> ZK Swap</span>
                  </div>
                </div>
              </div>
            </motion.a>
          </div>

          {/* Other Bounty Sponsors - Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* PNP Exchange */}
            <motion.a
              href="https://pnp.exchange"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              whileHover={{ scale: 1.03, y: -3 }}
              className="group p-4 rounded-xl bg-bg-tertiary/50 border border-pink-500/30 hover:border-pink-500/60 transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                  <ChartIcon />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <h4 className="font-semibold text-text-primary group-hover:text-pink-400 transition-colors text-sm">PNP Exchange</h4>
                  </div>
                  <p className="text-[9px] text-warning">BOUNTY</p>
                </div>
              </div>
              <p className="text-[10px] text-text-secondary">Anonymous prediction markets</p>
            </motion.a>

            {/* Helius */}
            <motion.a
              href="https://helius.dev"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.03, y: -3 }}
              className="group p-4 rounded-xl bg-bg-tertiary/50 border border-orange-500/30 hover:border-orange-500/60 transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <BoltIcon />
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary group-hover:text-orange-400 transition-colors text-sm">Helius</h4>
                  <p className="text-[9px] text-warning">SPONSOR</p>
                </div>
              </div>
              <p className="text-[10px] text-text-secondary">RPC & whale intelligence</p>
            </motion.a>

            {/* Light Protocol */}
            <motion.a
              href="https://lightprotocol.com"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25 }}
              whileHover={{ scale: 1.03, y: -3 }}
              className="group p-4 rounded-xl bg-bg-tertiary/50 border border-yellow-500/30 hover:border-yellow-500/60 transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <BoltIcon />
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary group-hover:text-yellow-400 transition-colors text-sm">Light Protocol</h4>
                  <p className="text-[9px] text-warning">MAIN SPONSOR</p>
                </div>
              </div>
              <p className="text-[10px] text-text-secondary">ZK state compression</p>
            </motion.a>

            {/* Jupiter */}
            <motion.a
              href="https://jup.ag"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.03, y: -3 }}
              className="group p-4 rounded-xl bg-bg-tertiary/50 border border-emerald-500/30 hover:border-emerald-500/60 transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <SwapIcon />
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary group-hover:text-emerald-400 transition-colors text-sm">Jupiter</h4>
                  <p className="text-[9px] text-text-muted">ECOSYSTEM</p>
                </div>
              </div>
              <p className="text-[10px] text-text-secondary">Best swap rates on Solana</p>
            </motion.a>
          </div>

          {/* Darklake - At end */}
          <motion.a
            href="https://darklake.fi"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35 }}
            whileHover={{ scale: 1.01, y: -5 }}
            className="group block p-5 rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border-2 border-neon-cyan/40 hover:border-neon-cyan/70 hover:shadow-[0_0_30px_rgba(0,212,255,0.2)] transition-all"
          >
            <div className="flex flex-col md:flex-row items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-neon-cyan/20 flex items-center justify-center flex-shrink-0">
                <LockIcon />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <h4 className="text-lg font-bold text-text-primary group-hover:text-neon-cyan transition-colors">Darklake</h4>
                  <span className="px-2 py-0.5 text-[9px] font-bold bg-neon-cyan/20 text-neon-cyan rounded-full">ZK SWAPS</span>
                  <span className="px-2 py-0.5 text-[9px] font-bold bg-warning/20 text-warning rounded-full">BOUNTY</span>
                </div>
                <p className="text-xs text-text-secondary mb-2">Private token swaps with hidden amounts. Zero-knowledge proofs keep your trade sizes confidential.</p>
                <div className="flex items-center gap-3 text-[10px] text-text-muted">
                  <span className="flex items-center gap-1"><CheckBadge className="text-neon-cyan" /> Hidden Amounts</span>
                  <span className="flex items-center gap-1"><CheckBadge className="text-neon-cyan" /> ZK Proofs</span>
                  <span className="flex items-center gap-1"><CheckBadge className="text-neon-cyan" /> Deep Liquidity</span>
                </div>
              </div>
            </div>
          </motion.a>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="py-16 relative">
        <div className="absolute inset-0 bg-bg-secondary/50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,136,0.05),transparent_70%)]" />

        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "$1M+", label: "Trading Volume" },
              { value: "500+", label: "Active Whales" },
              { value: "10K+", label: "Transactions" },
              { value: "99.9%", label: "Uptime" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-text-secondary">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32 relative">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent">
                Choose Your Power Level
              </span>
            </h2>
            <p className="text-base text-text-secondary">From ghost to legendary whale</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Free */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -10 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-primary hover:border-neon-green/30 transition-all"
            >
              <div className="text-sm text-neon-green font-semibold uppercase tracking-wider mb-4">Free</div>
              <div className="text-4xl font-black text-text-primary mb-2">$0</div>
              <div className="text-sm text-text-muted mb-6">Forever</div>
              <ul className="space-y-3 mb-6">
                {["10 transactions/month", "Basic privacy features", "Privacy score tracking", "30-day free trial"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-text-secondary">
                    <span className="text-neon-green text-lg">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard"
                className="block w-full py-3 text-base font-semibold border-2 border-neon-green/50 text-neon-green rounded-xl hover:bg-neon-green/10 hover:border-neon-green transition-all text-center"
              >
                Start Free
              </Link>
            </motion.div>

            {/* Premium - Featured */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="relative p-6 rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border-2 border-neon-green shadow-glow-sm"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-bold bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary rounded-full">
                MOST POPULAR
              </div>
              <div className="text-sm text-neon-green font-semibold uppercase tracking-wider mb-4">Premium</div>
              <div className="text-4xl font-black text-text-primary mb-2">0.1 SOL</div>
              <div className="text-sm text-text-muted mb-6">Per Month</div>
              <ul className="space-y-3 mb-6">
                {["Unlimited transactions", "All privacy features", "Whale intelligence feed", "Priority support", "Badge discount 50%"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-text-secondary">
                    <span className="text-neon-green text-lg">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard"
                className="block w-full py-3 text-base font-semibold bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary rounded-xl hover:shadow-glow-md transition-all text-center"
              >
                Go Premium
              </Link>
            </motion.div>

            {/* Gold Badge */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -10 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-primary hover:border-neon-green/30 transition-all"
            >
              <div className="text-sm text-neon-green font-semibold uppercase tracking-wider mb-4">Gold Badge</div>
              <div className="text-4xl font-black text-text-primary mb-2">5 SOL</div>
              <div className="text-sm text-text-muted mb-6">One-time + 1 Year</div>
              <ul className="space-y-3 mb-6">
                {["Lifetime badge NFT", "1 year premium access", "Exclusive whale club", "Custom themes", "Priority features"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-text-secondary">
                    <span className="text-neon-green text-lg">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard"
                className="block w-full py-3 text-base font-semibold bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary rounded-xl hover:shadow-glow-md transition-all text-center"
              >
                Claim Badge
              </Link>
            </motion.div>
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
              Ready to Become a{" "}
              <motion.span
                className="text-neon-green inline-block"
                animate={{ textShadow: ["0 0 20px #00ff88", "0 0 50px #00ff88", "0 0 20px #00ff88"] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Phantom
              </motion.span>
              ?
            </h2>
            <p className="text-base md:text-lg text-text-secondary mb-10 max-w-lg mx-auto">
              Join the elite traders who value privacy. Your movements should be yours alone.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-3 px-10 py-4 text-lg font-semibold bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary rounded-2xl hover:shadow-glow-lg transition-all"
              >
                Launch App
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <ArrowRightIcon />
                </motion.span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
