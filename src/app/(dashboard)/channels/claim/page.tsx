'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/privy/hooks';
import { useNetwork } from '@/hooks/useNetwork';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { useClaimBadge } from '@/hooks/useClaimBadge';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletMismatchBanner } from "@/components/ui/WalletMismatchBanner";

type ClaimStep = 'select' | 'confirm' | 'processing' | 'grant-access' | 'success' | 'error';

interface TierOption {
  tier: number;
  name: string;
  icon: string;
  color: string;
  price: number;
  priceSOL: string;
}

export default function ClaimBadgePage() {
  const router = useRouter();
  const { walletAddress, authenticated } = useAuth();
  const { network } = useNetwork();
  const { balance, loading: balanceLoading } = useWalletBalance(walletAddress);
  const {
    error: claimError,
    txSignature,
    claimBadge,
    checkExistingBadge,
    getTierInfo,
    getAllTiers,
    getTierPrice,
    reset: resetClaim,
  } = useClaimBadge();

  const [step, setStep] = useState<ClaimStep>('select');
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [existingBadge, setExistingBadge] = useState<boolean>(false);
  const [checkingBadge, setCheckingBadge] = useState<boolean>(true);
  const [tiers, setTiers] = useState<TierOption[]>([]);

  // Load tier options
  useEffect(() => {
    setTiers(getAllTiers());
  }, [getAllTiers]);

  // Check if user already has a badge
  useEffect(() => {
    const check = async () => {
      setCheckingBadge(true);
      try {
        const hasBadge = await checkExistingBadge();
        setExistingBadge(hasBadge);
      } finally {
        setCheckingBadge(false);
      }
    };
    if (walletAddress) {
      check();
    } else {
      setCheckingBadge(false);
    }
  }, [walletAddress, checkExistingBadge]);

  // Handle tier selection
  const handleSelectTier = (tier: number) => {
    setSelectedTier(tier);
    setStep('confirm');
  };

  // Handle claim badge
  const handleClaimBadge = async () => {
    if (!walletAddress || !selectedTier) {
      return;
    }

    const priceSOL = getTierPrice(selectedTier);

    // Check balance
    if (balance < priceSOL) {
      setStep('error');
      return;
    }

    setStep('processing');
    resetClaim();

    const result = await claimBadge(selectedTier);

    if (result.success) {
      setStep('success');
    } else {
      setStep('error');
    }
  };

  // Redirect if not authenticated
  if (!authenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Connect Wallet</h1>
          <p className="text-text-muted">Please connect your wallet to claim a badge</p>
        </div>
      </div>
    );
  }

  // Show loading while checking existing badge
  if (checkingBadge) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted">Checking badge status...</p>
        </div>
      </div>
    );
  }

  // Already has badge
  if (existingBadge) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Badge Already Claimed</h1>
          <p className="text-text-muted mb-6">You already have a Confidential Whale Badge</p>
          <button
            onClick={() => router.push('/channels')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary font-medium"
          >
            Go to Channels
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <WalletMismatchBanner />

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Claim Your Whale Badge</h1>
        <p className="text-text-muted">
          Privacy-first badges with INCO FHE encryption • Tier verified on-chain
        </p>
        {network === 'devnet' && (
          <span className="inline-block mt-2 px-3 py-1 rounded-full bg-warning/10 text-warning text-xs">
            Devnet Mode
          </span>
        )}
      </div>

      {/* Step: Select Tier */}
      <AnimatePresence mode="wait">
        {step === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Balance */}
            <div className="mb-6 p-4 rounded-xl bg-bg-tertiary border border-border-primary">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Your Balance</span>
                {balanceLoading ? (
                  <span className="text-text-muted animate-pulse">Loading...</span>
                ) : (
                  <span className="text-xl font-bold text-neon-green">{balance.toFixed(4)} SOL</span>
                )}
              </div>
            </div>

            {/* Tier Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tiers.map((tier) => {
                const canAfford = balance >= tier.price / LAMPORTS_PER_SOL;

                return (
                  <motion.div
                    key={tier.tier}
                    whileHover={{ scale: canAfford ? 1.02 : 1 }}
                    whileTap={{ scale: canAfford ? 0.98 : 1 }}
                    onClick={() => canAfford && handleSelectTier(tier.tier)}
                    className={`relative p-6 rounded-xl border cursor-pointer transition-all ${
                      canAfford
                        ? 'bg-bg-tertiary border-border-primary hover:border-neon-green hover:shadow-glow-sm'
                        : 'bg-bg-tertiary/50 border-border-secondary opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="text-center">
                      <span className="text-4xl block mb-2">{tier.icon}</span>
                      <h3 className="text-lg font-bold text-text-primary">{tier.name}</h3>
                      <div className="mt-2">
                        <span className="text-2xl font-black text-neon-green">{tier.priceSOL}</span>
                      </div>
                      {!canAfford && (
                        <p className="text-xs text-error mt-2">Insufficient balance</p>
                      )}
                    </div>

                    {/* Tier benefits */}
                    <div className="mt-4 pt-4 border-t border-border-secondary text-xs text-text-muted">
                      <p>Access to {tier.name}+ channels</p>
                      <p>INCO encrypted proofs</p>
                      <p>Privacy-first verification</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Info */}
            <div className="mt-6 p-4 rounded-xl bg-bg-secondary border border-border-secondary">
              <h4 className="font-medium text-text-primary mb-2">Privacy-First Design</h4>
              <ul className="text-xs text-text-muted space-y-1">
                <li>• Your tier is NOT stored in plain text on-chain</li>
                <li>• All 5 proof handles are non-zero (prevents tier inference)</li>
                <li>• Only wallet-signed decryption reveals your tier</li>
                <li>• Observers cannot determine your badge tier</li>
              </ul>
            </div>
          </motion.div>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && selectedTier && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md mx-auto"
          >
            <div className="p-6 rounded-xl bg-bg-tertiary border border-border-primary">
              <div className="text-center mb-6">
                <span className="text-5xl block mb-3">{getTierInfo(selectedTier).icon}</span>
                <h2 className="text-2xl font-bold text-text-primary">{getTierInfo(selectedTier).name} Badge</h2>
                <p className="text-3xl font-black text-neon-green mt-2">{getTierInfo(selectedTier).priceSOL}</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Price</span>
                  <span className="text-text-primary">{getTierInfo(selectedTier).priceSOL}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Network</span>
                  <span className={network === 'devnet' ? 'text-warning' : 'text-neon-green'}>
                    {network === 'devnet' ? 'Devnet' : 'Mainnet'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Channel Access</span>
                  <span className="text-text-primary">{selectedTier} tier{selectedTier > 1 ? 's' : ''}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('select')}
                  className="flex-1 px-4 py-3 rounded-xl border border-border-primary text-text-secondary hover:bg-bg-elevated"
                >
                  Back
                </button>
                <button
                  onClick={handleClaimBadge}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary font-medium"
                >
                  Confirm & Pay
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md mx-auto"
          >
            <div className="p-8 rounded-xl bg-bg-tertiary border border-border-primary text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-neon-green/30 border-t-neon-green animate-spin" />
              <h2 className="text-xl font-bold text-text-primary mb-2">Claiming Badge...</h2>
              <p className="text-text-muted text-sm">
                Please confirm the transaction in your wallet
              </p>

              <div className="mt-6 space-y-2 text-xs text-text-muted">
                <div className="flex items-center gap-2 justify-center">
                  <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                  Encrypting tier with INCO FHE
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                  Creating proof handles (all non-zero)
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <span className="w-2 h-2 rounded-full bg-text-muted animate-pulse" />
                  Storing on Solana {network}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-md mx-auto"
          >
            <div className="p-8 rounded-xl bg-bg-tertiary border border-neon-green/30 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Badge Claimed!</h2>
              <p className="text-text-muted mb-6">
                Your {selectedTier && getTierInfo(selectedTier).name} Whale Badge is now active
              </p>

              {txSignature && (
                <a
                  href={`https://explorer.solana.com/tx/${txSignature}?cluster=${network}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mb-6 text-xs text-neon-cyan hover:underline"
                >
                  View on Explorer →
                </a>
              )}

              <button
                onClick={() => router.push('/channels')}
                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary font-medium"
              >
                Enter Channels
              </button>
            </div>
          </motion.div>
        )}

        {/* Step: Error */}
        {step === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md mx-auto"
          >
            <div className="p-8 rounded-xl bg-bg-tertiary border border-error/30 text-center">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-xl font-bold text-text-primary mb-2">Claim Failed</h2>
              <p className="text-error text-sm mb-6">{claimError || 'Transaction failed'}</p>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('select')}
                  className="flex-1 px-4 py-3 rounded-xl border border-border-primary text-text-secondary hover:bg-bg-elevated"
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.push('/channels')}
                  className="flex-1 px-4 py-3 rounded-xl bg-bg-elevated text-text-primary"
                >
                  Go Back
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
