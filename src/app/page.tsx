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

const UsersIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
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

const features = [
  {
    icon: <ShieldIcon />,
    title: "Hidden Balance",
    description: "Shield your SOL holdings from prying eyes with Privacy Cash. Your wealth stays private.",
    bounty: "$15K",
  },
  {
    icon: <WalletIcon />,
    title: "Private Transfers",
    description: "Send funds via ShadowWire without revealing amounts or identity. True transfer privacy.",
    bounty: "$15K",
  },
  {
    icon: <SwapIcon />,
    title: "Anonymous Betting",
    description: "Place predictions on PNP Exchange without exposing your wallet size.",
    bounty: "$2.5K",
  },
  {
    icon: <ChartIcon />,
    title: "Whale Intelligence",
    description: "Track what other whales are doing while staying anonymous yourself.",
    bounty: null,
  },
  {
    icon: <UsersIcon />,
    title: "Best Swap Rates",
    description: "Integrated Jupiter for optimal token swaps with multi-wallet strategies.",
    bounty: null,
  },
  {
    icon: <BoltIcon />,
    title: "Lightning Fast",
    description: "Powered by Helius RPC for instant transaction processing. No delays.",
    bounty: null,
  },
];

const stats = [
  { value: "$32K+", label: "Bounty Pool" },
  { value: "5", label: "Privacy SDKs" },
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
                className="group p-6 rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-primary hover:border-neon-green/40 hover:shadow-glow-sm transition-all duration-300 relative overflow-hidden"
              >
                {/* Bounty badge */}
                {feature.bounty && (
                  <div className="absolute top-4 right-4 px-2 py-1 text-[10px] font-bold bg-neon-green/20 text-neon-green rounded-full">
                    {feature.bounty} Bounty
                  </div>
                )}

                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-neon-green/5 to-neon-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity" />

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
