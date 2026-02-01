"use client";

import { useAuth } from "@/lib/privy/hooks";

interface ConnectPromptProps {
  title?: string;
  description?: string;
  compact?: boolean;
}

export default function ConnectPrompt({
  title = "Connect Wallet",
  description = "Connect your wallet to view your balances and data",
  compact = false
}: ConnectPromptProps) {
  const { login } = useAuth();

  if (compact) {
    return (
      <button
        onClick={() => login()}
        className="flex items-center gap-2 text-xs text-text-muted hover:text-neon-green transition-colors group"
      >
        <span className="w-4 h-4 rounded-full border border-dashed border-text-muted group-hover:border-neon-green flex items-center justify-center">
          <span className="text-[10px]">+</span>
        </span>
        <span>Connect to view</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-bg-tertiary border border-border-primary flex items-center justify-center mb-3">
        <WalletIcon className="w-5 h-5 text-text-muted" />
      </div>
      <h3 className="text-sm font-medium text-text-primary mb-1">{title}</h3>
      <p className="text-xs text-text-muted mb-4 max-w-[200px]">{description}</p>
      <button
        onClick={() => login()}
        className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary rounded-lg hover:shadow-glow-sm transition-all"
      >
        Connect Wallet
      </button>
    </div>
  );
}

// Inline balance placeholder for cards
export function BalancePlaceholder({ onClick }: { onClick?: () => void }) {
  const { login } = useAuth();

  return (
    <button
      onClick={onClick || (() => login())}
      className="text-lg font-bold text-text-muted hover:text-neon-green transition-colors"
    >
      ••••••
    </button>
  );
}

const WalletIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
  </svg>
);
