"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/lib/privy/hooks";
import Button from "@/components/ui/Button";
import WhaleLogo from "@/components/ui/WhaleLogo";

/**
 * DashboardGate - Shows connect screen if not authenticated
 * Once connected, renders children (actual dashboard)
 */
export default function DashboardGate({ children }: { children: React.ReactNode }) {
  const { authenticated, ready, login } = useAuth();

  // Still initializing Privy
  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="relative">
          {/* Outer pulse */}
          <motion.div
            className="absolute -inset-4 sm:-inset-6 rounded-full border-2 border-neon-green/20"
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Spinning ring */}
          <motion.div
            className="absolute -inset-3 sm:-inset-4 rounded-full border-2 border-transparent border-t-neon-green border-r-neon-cyan"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />
          {/* Inner spinning ring (reverse) */}
          <motion.div
            className="absolute -inset-1.5 sm:-inset-2 rounded-full border border-transparent border-t-neon-cyan/60"
            animate={{ rotate: -360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
          {/* Logo - responsive */}
          <WhaleLogo size="md" showText={false} animated={true} className="sm:hidden" />
          <WhaleLogo size="lg" showText={false} animated={true} className="hidden sm:flex" />
        </div>
        <p className="text-sm text-text-muted flex items-center gap-2">
          <motion.span
            className="w-2 h-2 rounded-full bg-neon-green"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          Initializing...
        </p>
      </div>
    );
  }

  // Not authenticated - show connect screen
  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="max-w-md w-full mx-auto text-center p-8">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 border border-neon-green/30 flex items-center justify-center mb-4">
              <span className="text-5xl">🐋</span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              Whale Suite
            </h1>
            <p className="text-sm text-text-secondary">
              Privacy-first trading platform for Solana
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <FeatureCard icon="🛡️" label="Privacy Cash" desc="Hidden balances" />
            <FeatureCard icon="👻" label="ShadowWire" desc="Private transfers" />
            <FeatureCard icon="💱" label="Jupiter Swap" desc="Best rates" />
            <FeatureCard icon="🎲" label="PNP Markets" desc="Predictions" />
          </div>

          {/* Connect Button */}
          <Button
            variant="primary"
            size="lg"
            className="w-full mb-4"
            onClick={() => login()}
          >
            <WalletIcon className="w-5 h-5 mr-2" />
            Connect Wallet to Continue
          </Button>

          {/* Supported Wallets */}
          <div className="flex items-center justify-center gap-6 mb-4">
            <WalletBadge name="Phantom" icon={<PhantomIcon />} />
            <WalletBadge name="Solflare" icon={<SolflareIcon />} />
            <WalletBadge name="Backpack" icon={<BackpackIcon />} />
          </div>

          <p className="text-xs text-text-muted">
            Connect your wallet to access all features and view your balances
          </p>
        </div>
      </div>
    );
  }

  // Authenticated - render dashboard
  return <>{children}</>;
}

// Feature Card
function FeatureCard({ icon, label, desc }: { icon: string; label: string; desc: string }) {
  return (
    <div className="p-4 rounded-xl bg-bg-tertiary border border-border-secondary">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-sm font-medium text-text-primary">{label}</div>
      <div className="text-xs text-neon-green">{desc}</div>
    </div>
  );
}

// Wallet Badge
function WalletBadge({ name, icon }: { name: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-8 h-8">{icon}</div>
      <span className="text-[10px] text-text-muted">{name}</span>
    </div>
  );
}

// Icons
const WalletIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
  </svg>
);

const PhantomIcon = () => (
  <svg viewBox="0 0 128 128" fill="none" className="w-full h-full">
    <circle cx="64" cy="64" r="64" fill="url(#phantom-g)"/>
    <path d="M110.584 64.914H99.142C99.142 41.765 80.173 23 56.772 23C33.661 23 14.872 41.306 14.412 64.058C13.936 87.505 35.85 108 59.585 108H62.606C83.426 108 103.616 93.7 109.379 73.832C110.034 71.577 110.584 69.24 110.584 66.904V64.914ZM41.916 67.863C41.916 71.656 38.814 74.731 34.988 74.731C31.163 74.731 28.061 71.656 28.061 67.863V57.613C28.061 53.819 31.163 50.744 34.988 50.744C38.814 50.744 41.916 53.819 41.916 57.613V67.863ZM65.468 67.863C65.468 71.656 62.366 74.731 58.54 74.731C54.715 74.731 51.613 71.656 51.613 67.863V57.613C51.613 53.819 54.715 50.744 58.54 50.744C62.366 50.744 65.468 53.819 65.468 57.613V67.863Z" fill="white"/>
    <defs><linearGradient id="phantom-g" x1="64" y1="0" x2="64" y2="128"><stop stopColor="#534BB1"/><stop offset="1" stopColor="#551BF9"/></linearGradient></defs>
  </svg>
);

const SolflareIcon = () => (
  <svg viewBox="0 0 128 128" fill="none" className="w-full h-full">
    <circle cx="64" cy="64" r="64" fill="url(#solflare-g)"/>
    <path d="M92.5 45L64 64L35.5 45L64 26L92.5 45Z" fill="white"/>
    <path d="M92.5 83L64 102L35.5 83L64 64L92.5 83Z" fill="white" fillOpacity="0.6"/>
    <path d="M35.5 45L64 64L35.5 83V45Z" fill="white" fillOpacity="0.8"/>
    <path d="M92.5 45V83L64 64L92.5 45Z" fill="white" fillOpacity="0.4"/>
    <defs><linearGradient id="solflare-g" x1="0" y1="0" x2="128" y2="128"><stop stopColor="#FC8C2C"/><stop offset="1" stopColor="#FCD22C"/></linearGradient></defs>
  </svg>
);

const BackpackIcon = () => (
  <svg viewBox="0 0 128 128" fill="none" className="w-full h-full">
    <circle cx="64" cy="64" r="64" fill="url(#backpack-g)"/>
    <rect x="40" y="35" width="48" height="58" rx="8" fill="white"/>
    <rect x="48" y="28" width="32" height="14" rx="4" fill="white"/>
    <rect x="52" y="55" width="24" height="4" rx="2" fill="#E33E3F"/>
    <rect x="52" y="65" width="24" height="4" rx="2" fill="#E33E3F"/>
    <defs><linearGradient id="backpack-g" x1="0" y1="0" x2="128" y2="128"><stop stopColor="#E33E3F"/><stop offset="1" stopColor="#CC2B2B"/></linearGradient></defs>
  </svg>
);
