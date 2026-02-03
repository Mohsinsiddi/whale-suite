'use client';

import { useWalletMismatch } from '@/hooks/useWalletMismatch';
import { useAuth } from '@/lib/privy/hooks';

interface WalletMismatchBannerProps {
  className?: string;
  compact?: boolean;
}

/**
 * Reusable banner to show when Phantom wallet has changed since initial auth.
 * App data syncs automatically, but suggests disconnecting/relogin for fresh auth session.
 */
export function WalletMismatchBanner({ className = '', compact = false }: WalletMismatchBannerProps) {
  const { isMismatch, phantomWallet, clearMismatch } = useWalletMismatch();
  const { logout } = useAuth();

  if (!isMismatch) return null;

  const shortPhantom = phantomWallet
    ? `${phantomWallet.slice(0, 4)}...${phantomWallet.slice(-4)}`
    : '';

  const handleDisconnect = async () => {
    clearMismatch();
    await logout();
  };

  if (compact) {
    return (
      <div className={`p-3 rounded-lg bg-warning/10 border border-warning/30 ${className}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <AlertIcon className="w-4 h-4 text-warning flex-shrink-0" />
            <p className="text-xs text-warning truncate">
              Using <span className="font-mono text-neon-cyan">({shortPhantom})</span> — disconnect & relogin
            </p>
          </div>
          <button
            onClick={handleDisconnect}
            className="px-2 py-1 text-[10px] font-semibold bg-warning text-bg-primary rounded hover:bg-warning/90 transition-all whitespace-nowrap"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl bg-warning/10 border border-warning/30 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
            <AlertIcon className="w-5 h-5 text-warning" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-warning text-sm">Wallet Changed</p>
            <p className="text-text-muted text-xs truncate">
              Now using <span className="font-mono text-neon-cyan">{shortPhantom}</span>
              <span className="hidden sm:inline"> — data synced</span>
            </p>
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          className="px-4 py-2 text-sm font-semibold bg-warning text-bg-primary rounded-lg hover:bg-warning/90 transition-all sm:flex-shrink-0"
        >
          Disconnect & Relogin
        </button>
      </div>
      <p className="text-xs text-text-muted mt-2 sm:ml-12">
        App data synced to new wallet. For secure transactions, disconnect and login again.
      </p>
    </div>
  );
}

// Also export a hook-based check for conditional rendering
export function useHasWalletMismatch() {
  const { isMismatch } = useWalletMismatch();
  return isMismatch;
}

const AlertIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

export default WalletMismatchBanner;
