'use client';

import { useState } from "react";
import Link from "next/link";
import { Heart, Copy, Check } from "lucide-react";

// Donation addresses
const DONATION_ADDRESSES = {
  SOL: '3jnUmfGewsmm9V8p8iVU3wS2TtPoX3oAUjemWLiBmp4G',
  ETH: '0x1E677331F7F33E9cb645Ab7c528B688048C0E86D',
};

export default function Footer() {
  return (
    <footer className="border-t border-border-primary bg-bg-secondary">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <span className="text-lg">🐋</span>
              <span className="font-bold text-base bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent">
                WHALE SUITE
              </span>
            </Link>
            <p className="text-xs text-text-muted leading-relaxed">
              Privacy-first trading tools for Solana whales. Built for Solana Privacy Hack 2026.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold text-neon-green uppercase tracking-wider mb-3">
              Product
            </h4>
            <div className="space-y-2">
              <FooterLink href="#features">Features</FooterLink>
              <FooterLink href="#pricing">Pricing</FooterLink>
              <FooterLink href="/docs">Documentation</FooterLink>
              <FooterLink href="/docs/api">API</FooterLink>
            </div>
          </div>

          {/* Privacy SDKs */}
          <div>
            <h4 className="text-xs font-semibold text-neon-green uppercase tracking-wider mb-3">
              Privacy SDKs
            </h4>
            <div className="space-y-2">
              <FooterLink href="#">Privacy Cash</FooterLink>
              <FooterLink href="#">ShadowWire</FooterLink>
              <FooterLink href="#">PNP Exchange</FooterLink>
              <FooterLink href="#">Helius RPC</FooterLink>
            </div>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-xs font-semibold text-neon-green uppercase tracking-wider mb-3">
              Connect
            </h4>
            <div className="space-y-2">
              <FooterLink href="#">Twitter</FooterLink>
              <FooterLink href="#">Discord</FooterLink>
              <FooterLink href="#">GitHub</FooterLink>
              <FooterLink href="#">Telegram</FooterLink>
            </div>
          </div>
        </div>

        {/* Donate Section */}
        <div className="mb-8 p-4 rounded-xl bg-bg-tertiary/50 border border-border-primary">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-error" />
              <h4 className="text-sm font-semibold text-text-primary">Donate to the Project</h4>
            </div>
            <Link
              href="/donate"
              className="text-xs text-neon-green hover:underline"
            >
              View all options →
            </Link>
          </div>
          <p className="text-xs text-text-muted mb-4">
            If you find Whale Suite useful, consider donating to support development. Every contribution helps!
          </p>
          <div className="space-y-3">
            <DonationAddress label="SOL" address={DONATION_ADDRESSES.SOL} />
            <DonationAddress label="ETH" address={DONATION_ADDRESSES.ETH} />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border-primary to-transparent mb-6" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-text-muted">
            © 2026 Whale Trading Suite. Built with privacy in mind.
          </p>
          <div className="flex items-center gap-4">
            <FooterLink href="/privacy" small>Privacy Policy</FooterLink>
            <FooterLink href="/terms" small>Terms of Service</FooterLink>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
  small = false,
}: {
  href: string;
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block text-text-secondary hover:text-neon-green transition-colors ${
        small ? "text-xs" : "text-sm"
      }`}
    >
      {children}
    </Link>
  );
}

function DonationAddress({ label, address }: { label: string; address: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const truncated = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-bg-elevated/50">
      <div className="flex items-center gap-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
          label === 'SOL'
            ? 'bg-gradient-to-r from-[#9945FF]/20 to-[#14F195]/20 text-[#14F195]'
            : 'bg-[#627EEA]/20 text-[#627EEA]'
        }`}>
          {label}
        </span>
        <span className="text-xs text-text-muted font-mono">{truncated}</span>
      </div>
      <button
        onClick={handleCopy}
        className="p-1.5 rounded-md hover:bg-bg-tertiary transition-colors group"
        title={copied ? 'Copied!' : 'Copy address'}
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-success" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-text-muted group-hover:text-neon-green" />
        )}
      </button>
    </div>
  );
}
