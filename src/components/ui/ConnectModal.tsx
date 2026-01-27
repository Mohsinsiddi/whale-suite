"use client";

import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/lib/privy/hooks";

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConnectModal({ isOpen, onClose }: ConnectModalProps) {
  const { login, isLoading } = useAuth();

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleEscape]);

  const handleConnect = () => {
    login();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-modal-in">
        {/* Glow effects */}
        <div className="absolute -inset-1 bg-gradient-to-r from-neon-green via-neon-cyan to-neon-green rounded-2xl blur-xl opacity-30 animate-pulse" />

        <div className="relative bg-bg-secondary border border-neon-green/30 rounded-2xl overflow-hidden">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-bg-tertiary border border-border-secondary hover:border-neon-green/50 transition-colors"
          >
            <CloseIcon className="w-4 h-4 text-text-muted" />
          </button>

          {/* Animated header */}
          <div className="relative h-32 bg-gradient-to-br from-neon-green/20 via-bg-tertiary to-neon-cyan/20 overflow-hidden">
            {/* Animated grid */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: `linear-gradient(rgba(0,255,136,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.1) 1px, transparent 1px)`,
                backgroundSize: '30px 30px',
                animation: 'grid-move 20s linear infinite',
              }} />
            </div>

            {/* Floating whale */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="absolute inset-0 blur-2xl bg-neon-green/30 rounded-full animate-pulse" />
                <span className="relative text-6xl animate-bounce" style={{ animationDuration: '2s' }}>🐋</span>
              </div>
            </div>

            {/* Particle effects */}
            <div className="absolute top-4 left-8 w-2 h-2 bg-neon-green rounded-full animate-ping" style={{ animationDelay: '0s' }} />
            <div className="absolute top-12 right-12 w-1.5 h-1.5 bg-neon-cyan rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
            <div className="absolute bottom-8 left-16 w-1 h-1 bg-neon-green rounded-full animate-ping" style={{ animationDelay: '1s' }} />
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-text-primary mb-2">
                Enter the <span className="text-neon-green">Shadows</span>
              </h2>
              <p className="text-sm text-text-secondary">
                Connect your wallet to start trading privately
              </p>
            </div>

            {/* Main connect button */}
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="relative w-full p-4 rounded-xl overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {/* Button glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-neon-green via-neon-cyan to-neon-green opacity-100 group-hover:opacity-90 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-r from-neon-green via-neon-cyan to-neon-green blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />

              <span className="relative flex items-center justify-center gap-2 font-bold text-bg-primary">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <WalletIcon className="w-5 h-5" />
                    Connect Wallet
                  </>
                )}
              </span>
            </button>

            {/* Wallet icons */}
            <div className="flex items-center justify-center gap-6 mb-6">
              {[
                { icon: "👻", name: "Phantom" },
                { icon: "🔆", name: "Solflare" },
                { icon: "🎒", name: "Backpack" },
              ].map((wallet) => (
                <button
                  key={wallet.name}
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-bg-tertiary transition-colors disabled:opacity-50"
                >
                  <span className="text-2xl">{wallet.icon}</span>
                  <span className="text-[10px] text-text-muted">{wallet.name}</span>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-secondary" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-xs text-text-muted bg-bg-secondary">
                  or sign in with
                </span>
              </div>
            </div>

            {/* Social login */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { icon: "G", name: "Google" },
                { icon: "𝕏", name: "Twitter" },
                { icon: "✉", name: "Email" },
              ].map((social) => (
                <button
                  key={social.name}
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl bg-bg-tertiary border border-border-secondary hover:border-neon-green/40 transition-all disabled:opacity-50"
                >
                  <span className="text-lg font-bold text-text-secondary">{social.icon}</span>
                  <span className="text-[10px] text-text-muted">{social.name}</span>
                </button>
              ))}
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-bg-tertiary/50 mb-4">
              {[
                { icon: "🔒", label: "Private", desc: "ZK Proofs" },
                { icon: "⚡", label: "Fast", desc: "Instant" },
                { icon: "🛡️", label: "Secure", desc: "Non-custodial" },
              ].map((feature) => (
                <div key={feature.label} className="text-center">
                  <span className="text-lg">{feature.icon}</span>
                  <div className="text-xs font-medium text-text-primary">{feature.label}</div>
                  <div className="text-[10px] text-text-muted">{feature.desc}</div>
                </div>
              ))}
            </div>

            {/* Terms */}
            <p className="text-center text-[10px] text-text-muted">
              By connecting, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof window === "undefined") return null;

  return createPortal(modalContent, document.body);
}

// Icons
const CloseIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const WalletIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
  </svg>
);
