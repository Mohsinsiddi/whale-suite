import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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
  },
  {
    icon: <WalletIcon />,
    title: "Private Transfers",
    description: "Send funds via ShadowWire without revealing amounts or identity. True transfer privacy.",
  },
  {
    icon: <SwapIcon />,
    title: "Anonymous Betting",
    description: "Place predictions on PNP Exchange without exposing your wallet size.",
  },
  {
    icon: <ChartIcon />,
    title: "Whale Intelligence",
    description: "Track what other whales are doing while staying anonymous yourself.",
  },
  {
    icon: <UsersIcon />,
    title: "Best Swap Rates",
    description: "Integrated Jupiter for optimal token swaps with multi-wallet strategies.",
  },
  {
    icon: <BoltIcon />,
    title: "Lightning Fast",
    description: "Powered by Helius RPC for instant transaction processing. No delays.",
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
    <div className="min-h-screen">
      <Header variant="landing" />

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center text-center px-4 pt-14">
        <div className="max-w-3xl mx-auto animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 text-xs font-medium bg-neon-green/10 border border-neon-green/30 rounded-full text-neon-green animate-pulse">
            <span className="w-1.5 h-1.5 bg-neon-green rounded-full" />
            Solana Privacy Hack 2026
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-[1.1]">
            <span className="bg-gradient-to-r from-white via-neon-green to-neon-cyan bg-clip-text text-transparent">
              Trade Like a Ghost.
            </span>
            <br />
            <span className="text-text-primary">Think Like a </span>
            <span className="text-neon-green animate-pulse">Whale.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-sm md:text-base text-text-secondary mb-8 max-w-xl mx-auto">
            Privacy-first trading tools for Solana whales. Hide your balance,
            transfer privately, and trade without being watched.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary rounded-lg hover:shadow-glow-md hover:-translate-y-0.5 transition-all text-center"
            >
              Get Started Free
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold border border-neon-green text-neon-green rounded-lg hover:bg-neon-green/10 transition-all text-center"
            >
              Learn More
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-bg-secondary/50 backdrop-blur-sm border border-border-primary hover:border-neon-green/30 transition-colors"
              >
                <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-xs text-text-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-gradient-to-b from-bg-primary to-bg-secondary">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              <span className="bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent">
                Privacy Where It Matters
              </span>
            </h2>
            <p className="text-sm text-text-secondary max-w-lg mx-auto">
              Professional-grade tools for serious traders
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group p-5 rounded-xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-primary hover:border-neon-green/40 hover:-translate-y-1 hover:shadow-glow-sm transition-all duration-300"
              >
                <div className="text-neon-green mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-2 group-hover:text-neon-green transition-colors">
                  {feature.title}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="py-12 bg-bg-secondary">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "$1M+", label: "Trading Volume" },
              { value: "500+", label: "Active Whales" },
              { value: "10K+", label: "Transactions" },
              { value: "99.9%", label: "Uptime" },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-text-secondary">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-24 bg-gradient-to-b from-bg-secondary to-bg-primary">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              <span className="bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent">
                Choose Your Power Level
              </span>
            </h2>
            <p className="text-sm text-text-secondary">From ghost to legendary whale</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {/* Free */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-primary hover:border-neon-green/30 transition-colors">
              <div className="text-xs text-neon-green font-semibold uppercase tracking-wider mb-3">Free</div>
              <div className="text-3xl font-black text-text-primary mb-1">$0</div>
              <div className="text-xs text-text-muted mb-5">Forever</div>
              <ul className="space-y-2.5 mb-5">
                {["10 transactions/month", "Basic privacy features", "Privacy score tracking", "30-day free trial"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                    <span className="text-neon-green">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard"
                className="block w-full py-2 text-sm font-semibold border border-neon-green text-neon-green rounded-lg hover:bg-neon-green/10 transition-colors text-center"
              >
                Start Free
              </Link>
            </div>

            {/* Premium - Featured */}
            <div className="relative p-5 rounded-xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border-2 border-neon-green shadow-glow-sm scale-[1.02]">
              <div className="absolute -top-2.5 right-4 px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary rounded-full">
                POPULAR
              </div>
              <div className="text-xs text-neon-green font-semibold uppercase tracking-wider mb-3">Premium</div>
              <div className="text-3xl font-black text-text-primary mb-1">0.1 SOL</div>
              <div className="text-xs text-text-muted mb-5">Per Month</div>
              <ul className="space-y-2.5 mb-5">
                {["Unlimited transactions", "All privacy features", "Whale intelligence feed", "Priority support", "Badge discount 50%"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                    <span className="text-neon-green">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard"
                className="block w-full py-2 text-sm font-semibold bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary rounded-lg hover:shadow-glow-md transition-all text-center"
              >
                Go Premium
              </Link>
            </div>

            {/* Gold Badge */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-primary hover:border-neon-green/30 transition-colors">
              <div className="text-xs text-neon-green font-semibold uppercase tracking-wider mb-3">Gold Badge</div>
              <div className="text-3xl font-black text-text-primary mb-1">5 SOL</div>
              <div className="text-xs text-text-muted mb-5">One-time + 1 Year</div>
              <ul className="space-y-2.5 mb-5">
                {["Lifetime badge NFT", "1 year premium access", "Exclusive whale club", "Custom themes", "Priority features"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                    <span className="text-neon-green">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard"
                className="block w-full py-2 text-sm font-semibold bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary rounded-lg hover:shadow-glow-md transition-all text-center"
              >
                Claim Badge
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial opacity-50" />

        <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-2xl md:text-4xl font-black mb-4">
            Ready to Become a{" "}
            <span className="text-neon-green animate-pulse">Phantom</span>?
          </h2>
          <p className="text-sm text-text-secondary mb-8 max-w-lg mx-auto">
            Join the elite traders who value privacy. Your movements should be yours alone.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3 text-sm font-semibold bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary rounded-xl hover:shadow-glow-md hover:-translate-y-0.5 transition-all"
          >
            Launch App
            <ArrowRightIcon />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
