"use client";

import { useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";

const walletOptions = [
  { id: "phantom", name: "Phantom", icon: "👻", popular: true },
  { id: "solflare", name: "Solflare", icon: "🔆", popular: false },
  { id: "backpack", name: "Backpack", icon: "🎒", popular: false },
];

const socialOptions = [
  { id: "google", name: "Google", icon: "G" },
  { id: "twitter", name: "Twitter", icon: "𝕏" },
  { id: "email", name: "Email", icon: "✉" },
];

export default function ConnectPage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const handleConnect = (walletId: string) => {
    setSelectedWallet(walletId);
    setIsConnecting(true);
    // Simulate connection
    setTimeout(() => {
      setIsConnecting(false);
      // Would redirect to dashboard on success
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-bg-primary">
        <div className="absolute inset-0 bg-gradient-radial opacity-30" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <span className="text-2xl">🐋</span>
          <span className="font-bold text-xl bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent">
            WHALE SUITE
          </span>
        </Link>

        <Card variant="glow" padding="lg">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-text-primary mb-1">Connect Wallet</h1>
            <p className="text-sm text-text-secondary">
              Choose your preferred method to continue
            </p>
          </div>

          {/* Wallet Options */}
          <div className="space-y-2 mb-6">
            {walletOptions.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleConnect(wallet.id)}
                disabled={isConnecting}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  selectedWallet === wallet.id && isConnecting
                    ? "bg-neon-green/10 border-neon-green"
                    : "bg-bg-tertiary border-border-secondary hover:border-neon-green/40"
                }`}
              >
                <span className="text-2xl">{wallet.icon}</span>
                <span className="flex-1 text-left">
                  <span className="text-sm font-medium text-text-primary">{wallet.name}</span>
                  {wallet.popular && (
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold bg-neon-green/20 text-neon-green rounded">
                      POPULAR
                    </span>
                  )}
                </span>
                {selectedWallet === wallet.id && isConnecting ? (
                  <div className="w-5 h-5 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ChevronRightIcon />
                )}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-secondary" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs text-text-muted bg-bg-tertiary">
                or continue with
              </span>
            </div>
          </div>

          {/* Social Options */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {socialOptions.map((social) => (
              <button
                key={social.id}
                onClick={() => handleConnect(social.id)}
                disabled={isConnecting}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-bg-tertiary border border-border-secondary hover:border-neon-green/40 transition-all"
              >
                <span className="text-lg font-bold text-text-secondary">{social.icon}</span>
                <span className="text-xs text-text-muted">{social.name}</span>
              </button>
            ))}
          </div>

          {/* Terms */}
          <p className="text-center text-xs text-text-muted">
            By connecting, you agree to our{" "}
            <Link href="/terms" className="text-neon-green hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-neon-green hover:underline">
              Privacy Policy
            </Link>
          </p>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: "🔒", label: "Private" },
            { icon: "⚡", label: "Fast" },
            { icon: "🛡️", label: "Secure" },
          ].map((feature, i) => (
            <div key={i} className="p-3">
              <div className="text-xl mb-1">{feature.icon}</div>
              <div className="text-xs text-text-muted">{feature.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const ChevronRightIcon = () => (
  <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);
