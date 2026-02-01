"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNetwork, FEATURE_NETWORK_SUPPORT, type NetworkType, type FeatureKey } from "@/hooks/useNetwork";
import { Connection } from "@solana/web3.js";

interface NetworkSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NetworkSelectModal({ isOpen, onClose }: NetworkSelectModalProps) {
  const {
    network,
    switchNetwork,
    isSwitching: contextSwitching,
    switchProgress: contextProgress,
  } = useNetwork();

  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>(network);
  const [mainnetPing, setMainnetPing] = useState<number | null>(null);
  const [devnetPing, setDevnetPing] = useState<number | null>(null);
  const [pingLoading, setPingLoading] = useState(true);

  // Use context switching state
  const isSwitching = contextSwitching;
  const switchProgress = contextProgress;

  // Measure RPC ping
  const measurePing = useCallback(async (rpcUrl: string): Promise<number> => {
    try {
      const connection = new Connection(rpcUrl, 'confirmed');
      const start = performance.now();
      await connection.getSlot();
      const end = performance.now();
      return Math.round(end - start);
    } catch {
      return -1; // Error
    }
  }, []);

  // Reset selected network when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedNetwork(network);
    }
  }, [isOpen, network]);

  // Fetch pings on mount
  useEffect(() => {
    if (!isOpen) return;

    const fetchPings = async () => {
      setPingLoading(true);
      const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;

      const mainnetUrl = apiKey
        ? `https://mainnet.helius-rpc.com/?api-key=${apiKey}`
        : 'https://api.mainnet-beta.solana.com';
      const devnetUrl = apiKey
        ? `https://devnet.helius-rpc.com/?api-key=${apiKey}`
        : 'https://api.devnet.solana.com';

      const [mainnet, devnet] = await Promise.all([
        measurePing(mainnetUrl),
        measurePing(devnetUrl),
      ]);

      setMainnetPing(mainnet);
      setDevnetPing(devnet);
      setPingLoading(false);
    };

    fetchPings();
  }, [isOpen, measurePing]);

  // Handle network switch - uses context's switchNetwork
  const handleNetworkSwitch = async () => {
    if (selectedNetwork === network) {
      onClose();
      return;
    }

    // Use context's switchNetwork which handles progress internally
    await switchNetwork(selectedNetwork);
    onClose();
  };

  // Get features for each network
  const getNetworkFeatures = (net: NetworkType) => {
    return Object.entries(FEATURE_NETWORK_SUPPORT)
      .filter(([, value]) => value[net])
      .map(([key, value]) => ({ key: key as FeatureKey, label: value.label }));
  };

  const mainnetFeatures = getNetworkFeatures('mainnet');
  const devnetFeatures = getNetworkFeatures('devnet');

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSwitching) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isSwitching, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay with blur */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={!isSwitching ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-primary rounded-2xl shadow-2xl animate-modal-in overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -inset-px bg-gradient-to-r from-neon-green/20 via-neon-cyan/10 to-neon-green/20 rounded-2xl blur-sm -z-10" />

        {/* Header */}
        <div className="relative px-6 py-5 border-b border-border-secondary">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <NetworkIcon className="w-5 h-5 text-neon-green" />
                Select Network
              </h2>
              <p className="text-xs text-text-muted mt-1">
                Choose your Solana network environment
              </p>
            </div>
            {!isSwitching && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all"
              >
                <CloseIcon />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {isSwitching ? (
          <div className="px-6 py-8">
            {/* Switching Animation */}
            <div className="text-center mb-6">
              <div className="relative w-20 h-20 mx-auto mb-4">
                {/* Outer rotating rings */}
                <div className="absolute inset-0 rounded-full border-2 border-neon-green/20 animate-pulse" />
                <div
                  className="absolute inset-1 rounded-full border-2 border-transparent border-t-neon-green border-r-neon-cyan animate-spin"
                  style={{ animationDuration: "1.5s" }}
                />
                <div
                  className="absolute inset-3 rounded-full border border-transparent border-t-neon-cyan animate-spin"
                  style={{ animationDuration: "1s", animationDirection: "reverse" }}
                />

                {/* Center icon */}
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 flex items-center justify-center">
                  <SwitchIcon className="w-6 h-6 text-neon-green" />
                </div>
              </div>

              <h3 className="text-base font-semibold text-text-primary">
                Switching to {selectedNetwork === "mainnet" ? "Mainnet" : "Devnet"}
              </h3>
              <p className="text-xs text-text-muted mt-1">Please wait...</p>
            </div>

            {/* Progress bar */}
            <div className="space-y-3">
              <div className="relative h-3 bg-bg-primary rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-green via-neon-cyan to-neon-green rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${switchProgress}%`,
                    backgroundSize: "200% 100%",
                    animation: "shimmer 2s linear infinite",
                  }}
                />
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-green to-neon-cyan rounded-full blur-md opacity-50 transition-all duration-300"
                  style={{ width: `${switchProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Progress</span>
                <span className="text-neon-green font-medium">{switchProgress}%</span>
              </div>
            </div>

            {/* Status steps */}
            <div className="mt-6 space-y-2">
              {[
                { threshold: 15, label: "Disconnecting from current RPC" },
                { threshold: 35, label: "Connecting to new network" },
                { threshold: 55, label: "Verifying connection" },
                { threshold: 75, label: "Syncing wallet state" },
                { threshold: 90, label: "Refreshing balances" },
              ].map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 text-xs transition-all duration-300 ${
                    switchProgress >= step.threshold
                      ? "text-neon-green"
                      : "text-text-muted/50"
                  }`}
                >
                  {switchProgress >= step.threshold ? (
                    <CheckIcon className="w-3.5 h-3.5" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-current" />
                  )}
                  <span>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            {/* Network Options */}
            <div className="grid grid-cols-2 gap-4">
              {/* Mainnet Card */}
              <NetworkCard
                type="mainnet"
                isSelected={selectedNetwork === "mainnet"}
                isCurrent={network === "mainnet"}
                ping={mainnetPing}
                pingLoading={pingLoading}
                features={mainnetFeatures}
                onClick={() => setSelectedNetwork("mainnet")}
              />

              {/* Devnet Card */}
              <NetworkCard
                type="devnet"
                isSelected={selectedNetwork === "devnet"}
                isCurrent={network === "devnet"}
                ping={devnetPing}
                pingLoading={pingLoading}
                features={devnetFeatures}
                onClick={() => setSelectedNetwork("devnet")}
              />
            </div>

            {/* Feature Comparison */}
            <div className="p-4 rounded-xl bg-bg-elevated/50 border border-border-secondary">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                Available Features on {selectedNetwork === "mainnet" ? "Mainnet" : "Devnet"}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {(selectedNetwork === "mainnet" ? mainnetFeatures : devnetFeatures).map(
                  (feature) => (
                    <span
                      key={feature.key}
                      className={`text-[10px] px-2 py-1 rounded-full ${
                        selectedNetwork === "mainnet"
                          ? "bg-neon-green/10 text-neon-green border border-neon-green/20"
                          : "bg-warning/10 text-warning border border-warning/20"
                      }`}
                    >
                      {feature.label}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Warning for devnet */}
            {selectedNetwork === "devnet" && (
              <div className="p-3 rounded-xl bg-warning/5 border border-warning/20">
                <div className="flex items-start gap-2">
                  <WarningIcon className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-warning">Devnet Mode</p>
                    <p className="text-[10px] text-text-muted mt-0.5">
                      Devnet uses test tokens with no real value. Perfect for testing new features.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {!isSwitching && (
          <div className="px-6 py-4 border-t border-border-secondary bg-bg-primary/30">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 text-sm font-medium text-text-secondary bg-bg-tertiary border border-border-primary rounded-lg hover:bg-bg-elevated hover:text-text-primary transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleNetworkSwitch}
                className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all ${
                  selectedNetwork === network
                    ? "bg-bg-tertiary text-text-muted cursor-not-allowed"
                    : "bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary hover:shadow-glow-sm"
                }`}
                disabled={selectedNetwork === network}
              >
                {selectedNetwork === network ? "Current Network" : "Switch Network"}
              </button>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes shimmer {
            0% {
              background-position: 200% 0;
            }
            100% {
              background-position: -200% 0;
            }
          }
        `}</style>
      </div>
    </div>
  );

  if (typeof window === "undefined") return null;

  return createPortal(modalContent, document.body);
}

// Network Card Component
function NetworkCard({
  type,
  isSelected,
  isCurrent,
  ping,
  pingLoading,
  features,
  onClick,
}: {
  type: NetworkType;
  isSelected: boolean;
  isCurrent: boolean;
  ping: number | null;
  pingLoading: boolean;
  features: { key: FeatureKey; label: string }[];
  onClick: () => void;
}) {
  const isMainnet = type === "mainnet";

  return (
    <button
      onClick={onClick}
      className={`relative p-4 rounded-xl text-left transition-all duration-300 ${
        isSelected
          ? isMainnet
            ? "bg-neon-green/10 border-2 border-neon-green shadow-lg shadow-neon-green/10"
            : "bg-warning/10 border-2 border-warning shadow-lg shadow-warning/10"
          : "bg-bg-tertiary border-2 border-border-primary hover:border-border-secondary"
      }`}
    >
      {/* Current indicator */}
      {isCurrent && (
        <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-bg-secondary border border-border-primary rounded-full">
          Current
        </div>
      )}

      {/* Network icon and name */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isMainnet
              ? "bg-gradient-to-br from-neon-green/20 to-neon-cyan/20"
              : "bg-gradient-to-br from-warning/20 to-orange-500/20"
          }`}
        >
          {isMainnet ? (
            <MainnetIcon className="w-5 h-5 text-neon-green" />
          ) : (
            <DevnetIcon className="w-5 h-5 text-warning" />
          )}
        </div>
        <div>
          <p
            className={`font-semibold ${
              isSelected
                ? isMainnet
                  ? "text-neon-green"
                  : "text-warning"
                : "text-text-primary"
            }`}
          >
            {isMainnet ? "Mainnet" : "Devnet"}
          </p>
          <p className="text-[10px] text-text-muted">
            {isMainnet ? "Production" : "Testing"}
          </p>
        </div>
      </div>

      {/* Ping indicator */}
      <div className="flex items-center gap-2 mb-3">
        <SignalIcon
          className={`w-3.5 h-3.5 ${
            pingLoading
              ? "text-text-muted animate-pulse"
              : ping === null || ping < 0
              ? "text-error"
              : ping < 200
              ? "text-neon-green"
              : ping < 500
              ? "text-warning"
              : "text-error"
          }`}
        />
        <span className="text-xs text-text-muted">
          {pingLoading ? (
            "Checking..."
          ) : ping === null || ping < 0 ? (
            <span className="text-error">Error</span>
          ) : (
            <>
              <span
                className={
                  ping < 200
                    ? "text-neon-green"
                    : ping < 500
                    ? "text-warning"
                    : "text-error"
                }
              >
                {ping}ms
              </span>
              <span className="text-text-muted/50 ml-1">
                {ping < 200 ? "Excellent" : ping < 500 ? "Good" : "Slow"}
              </span>
            </>
          )}
        </span>
      </div>

      {/* Feature count */}
      <div className="text-[10px] text-text-muted">
        <span className={isMainnet ? "text-neon-green" : "text-warning"}>
          {features.length}
        </span>{" "}
        features available
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div
          className={`absolute bottom-3 right-3 w-5 h-5 rounded-full flex items-center justify-center ${
            isMainnet ? "bg-neon-green" : "bg-warning"
          }`}
        >
          <CheckIcon className="w-3 h-3 text-bg-primary" />
        </div>
      )}
    </button>
  );
}

// Icons
const CloseIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CheckIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const NetworkIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
    />
  </svg>
);

const SwitchIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
    />
  </svg>
);

const MainnetIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
    />
  </svg>
);

const DevnetIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611l-4.819.855a6.025 6.025 0 01-6.632 0l-4.82-.855c-1.715-.293-2.298-2.379-1.066-3.611L5 14.5"
    />
  </svg>
);

const SignalIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
    />
  </svg>
);

const WarningIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
    />
  </svg>
);
