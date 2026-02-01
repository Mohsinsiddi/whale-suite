"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/privy/hooks";
import Button from "./Button";

interface WelcomeModalProps {
  onClose: () => void;
  onConnect: () => void;
}

export default function WelcomeModal({ onClose, onConnect }: WelcomeModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { login, authenticated } = useAuth();

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  // Close modal if user becomes authenticated
  useEffect(() => {
    if (authenticated) {
      setIsVisible(false);
      setTimeout(onClose, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const handleConnect = () => {
    login();
    onConnect();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md mx-4 bg-bg-secondary border border-border-primary rounded-2xl shadow-2xl transition-all duration-200 ${
          isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
        >
          <CloseIcon className="w-4 h-4 text-text-muted" />
        </button>

        {/* Content */}
        <div className="p-6 text-center">
          {/* Logo Animation */}
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 border border-neon-green/30 flex items-center justify-center animate-pulse">
              <span className="text-4xl">🐋</span>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-text-primary mb-2">
            Welcome to Whale Suite
          </h2>
          <p className="text-sm text-text-secondary mb-6">
            Privacy-first trading platform for Solana whales
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <FeatureItem icon="🛡️" label="Privacy Cash" desc="Hidden balances" />
            <FeatureItem icon="👻" label="ShadowWire" desc="Private transfers" />
            <FeatureItem icon="💱" label="Jupiter Swap" desc="Best rates" />
            <FeatureItem icon="🎲" label="PNP Markets" desc="Predictions" />
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleConnect}
            >
              <WalletIcon className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
            <button
              onClick={handleClose}
              className="w-full py-2 text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              Explore without connecting
            </button>
          </div>

          {/* Supported Wallets */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <PhantomIcon className="w-6 h-6 opacity-50 hover:opacity-100 transition-opacity" />
            <SolflareIcon className="w-6 h-6 opacity-50 hover:opacity-100 transition-opacity" />
            <BackpackIcon className="w-6 h-6 opacity-50 hover:opacity-100 transition-opacity" />
          </div>

          {/* Privacy Notice */}
          <p className="mt-3 text-[10px] text-text-muted">
            Connect to view your balances and access all privacy features.
          </p>
        </div>
      </div>
    </div>
  );
}

// Feature Item
function FeatureItem({ icon, label, desc }: { icon: string; label: string; desc?: string }) {
  return (
    <div className="p-3 rounded-xl bg-bg-tertiary border border-border-secondary">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xs font-medium text-text-primary">{label}</div>
      {desc && (
        <div className="text-[10px] text-text-muted">{desc}</div>
      )}
    </div>
  );
}

// Icons
const CloseIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const WalletIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
  </svg>
);

// Phantom Wallet Icon
const PhantomIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 128 128" fill="none">
    <circle cx="64" cy="64" r="64" fill="url(#phantom-gradient)"/>
    <path d="M110.584 64.9142H99.142C99.142 41.7651 80.173 23 56.7724 23C33.6612 23 14.8716 41.3057 14.4118 64.0583C13.9361 87.5047 35.8504 108 59.5845 108H62.6064C83.4256 108 103.616 93.7004 109.379 73.8323C110.034 71.5765 110.584 69.2405 110.584 66.9044C110.584 65.8443 110.584 64.9142 110.584 64.9142ZM41.9158 67.8631C41.9158 71.6564 38.8143 74.7314 34.9884 74.7314C31.1625 74.7314 28.061 71.6564 28.061 67.8631V57.6127C28.061 53.8193 31.1625 50.7444 34.9884 50.7444C38.8143 50.7444 41.9158 53.8193 41.9158 57.6127V67.8631ZM65.4678 67.8631C65.4678 71.6564 62.3663 74.7314 58.5404 74.7314C54.7145 74.7314 51.613 71.6564 51.613 67.8631V57.6127C51.613 53.8193 54.7145 50.7444 58.5404 50.7444C62.3663 50.7444 65.4678 53.8193 65.4678 57.6127V67.8631Z" fill="white"/>
    <defs>
      <linearGradient id="phantom-gradient" x1="64" y1="0" x2="64" y2="128" gradientUnits="userSpaceOnUse">
        <stop stopColor="#534BB1"/>
        <stop offset="1" stopColor="#551BF9"/>
      </linearGradient>
    </defs>
  </svg>
);

// Solflare Wallet Icon
const SolflareIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 128 128" fill="none">
    <circle cx="64" cy="64" r="64" fill="url(#solflare-gradient)"/>
    <path d="M92.5 45L64 64L35.5 45L64 26L92.5 45Z" fill="white"/>
    <path d="M92.5 83L64 102L35.5 83L64 64L92.5 83Z" fill="white" fillOpacity="0.6"/>
    <path d="M35.5 45L64 64L35.5 83V45Z" fill="white" fillOpacity="0.8"/>
    <path d="M92.5 45V83L64 64L92.5 45Z" fill="white" fillOpacity="0.4"/>
    <defs>
      <linearGradient id="solflare-gradient" x1="0" y1="0" x2="128" y2="128" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FC8C2C"/>
        <stop offset="1" stopColor="#FCD22C"/>
      </linearGradient>
    </defs>
  </svg>
);

// Backpack Wallet Icon
const BackpackIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 128 128" fill="none">
    <circle cx="64" cy="64" r="64" fill="url(#backpack-gradient)"/>
    <rect x="40" y="35" width="48" height="58" rx="8" fill="white"/>
    <rect x="48" y="28" width="32" height="14" rx="4" fill="white"/>
    <rect x="52" y="55" width="24" height="4" rx="2" fill="#E33E3F"/>
    <rect x="52" y="65" width="24" height="4" rx="2" fill="#E33E3F"/>
    <defs>
      <linearGradient id="backpack-gradient" x1="0" y1="0" x2="128" y2="128" gradientUnits="userSpaceOnUse">
        <stop stopColor="#E33E3F"/>
        <stop offset="1" stopColor="#CC2B2B"/>
      </linearGradient>
    </defs>
  </svg>
);

// Hook to manage welcome modal state
export function useWelcomeModal() {
  const [showModal, setShowModal] = useState(false);
  const { authenticated, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;

    // Check if this is first visit and user is not authenticated
    const hasSeenWelcome = localStorage.getItem('whale-suite-welcome-seen');

    if (!hasSeenWelcome && !authenticated) {
      setShowModal(true);
    }
  }, [ready, authenticated]);

  const closeModal = () => {
    localStorage.setItem('whale-suite-welcome-seen', 'true');
    setShowModal(false);
  };

  const resetWelcome = () => {
    localStorage.removeItem('whale-suite-welcome-seen');
  };

  return {
    showModal,
    closeModal,
    resetWelcome,
  };
}
