'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { TIER_INFO, type RevealStep } from '@/hooks/useRevealBadge';
import { Shield, ExternalLink, Sparkles } from 'lucide-react';

interface RevealBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  badgeId: string;
  steps: RevealStep[];
  currentStep: number;
  loading: boolean;
  error: string | null;
  success: boolean;
  revealedTier: number | null;
  txSignature: string | null;
}

export function RevealBadgeModal({
  isOpen,
  onClose,
  badgeId,
  steps,
  currentStep,
  loading,
  error,
  success,
  revealedTier,
  txSignature,
}: RevealBadgeModalProps) {
  const progress = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;
  const tierInfo = revealedTier ? TIER_INFO[revealedTier] : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
            onClick={!loading ? onClose : undefined}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-md">
              <div className="bg-bg-secondary rounded-2xl border border-border-primary shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-border-primary">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-neon-cyan/20 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-neon-cyan" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-text-primary">
                          {success ? 'Badge Revealed!' : error ? 'Reveal Failed' : 'Revealing Badge'}
                        </h2>
                        <p className="text-sm text-text-muted">
                          Badge #{badgeId.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    {!loading && (
                      <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {loading && (
                  <div className="h-1 bg-bg-tertiary">
                    <motion.div
                      className="h-full bg-gradient-to-r from-neon-cyan to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  {/* Steps */}
                  <div className="space-y-4">
                    {steps.map((step, index) => (
                      <div key={step.id} className="flex items-start gap-3">
                        {/* Step indicator */}
                        <div className="flex-shrink-0 mt-0.5">
                          {step.status === 'completed' ? (
                            <div className="w-6 h-6 rounded-full bg-neon-green/20 flex items-center justify-center">
                              <svg className="w-4 h-4 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : step.status === 'active' ? (
                            <div className="w-6 h-6 rounded-full bg-neon-cyan/20 flex items-center justify-center">
                              <div className="w-3 h-3 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />
                            </div>
                          ) : step.status === 'error' ? (
                            <div className="w-6 h-6 rounded-full bg-error/20 flex items-center justify-center">
                              <svg className="w-4 h-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-bg-tertiary flex items-center justify-center">
                              <span className="text-xs text-text-muted">{index + 1}</span>
                            </div>
                          )}
                        </div>

                        {/* Step content */}
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            step.status === 'completed' ? 'text-neon-green' :
                            step.status === 'active' ? 'text-neon-cyan' :
                            step.status === 'error' ? 'text-error' :
                            'text-text-muted'
                          }`}>
                            {step.label}
                          </p>
                          {step.description && (
                            <p className="text-xs text-text-muted mt-0.5">{step.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Error message */}
                  {error && (
                    <div className="mt-4 p-3 rounded-lg bg-error/10 border border-error/30">
                      <p className="text-sm text-error">{error}</p>
                    </div>
                  )}

                  {/* Success message with revealed tier */}
                  {success && tierInfo && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-6"
                    >
                      <div
                        className="p-6 rounded-xl border-2"
                        style={{
                          backgroundColor: `${tierInfo.hex}10`,
                          borderColor: `${tierInfo.hex}40`,
                        }}
                      >
                        <div className="flex flex-col items-center text-center">
                          {/* Tier Icon */}
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className={`w-20 h-20 rounded-2xl flex items-center justify-center text-5xl shadow-lg bg-gradient-to-br ${tierInfo.color} mb-4`}
                            style={{ boxShadow: `0 8px 32px ${tierInfo.hex}40` }}
                          >
                            {tierInfo.icon}
                          </motion.div>

                          {/* Tier Name */}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="w-5 h-5" style={{ color: tierInfo.hex }} />
                              <h3 className="text-2xl font-bold" style={{ color: tierInfo.hex }}>
                                {tierInfo.name} Badge
                              </h3>
                              <Sparkles className="w-5 h-5" style={{ color: tierInfo.hex }} />
                            </div>
                            <p className="text-sm text-text-secondary">
                              Your badge tier has been revealed via FHE decryption!
                            </p>
                          </motion.div>

                          {/* Benefits */}
                          <div className="flex flex-wrap justify-center gap-2 mt-4">
                            <span
                              className="px-3 py-1 rounded-full text-xs font-medium"
                              style={{ backgroundColor: `${tierInfo.hex}20`, color: tierInfo.hex }}
                            >
                              {[1, 1.25, 1.5, 1.75, 2][revealedTier! - 1]}x Multiplier
                            </span>
                            <span
                              className="px-3 py-1 rounded-full text-xs font-medium"
                              style={{ backgroundColor: `${tierInfo.hex}20`, color: tierInfo.hex }}
                            >
                              {[5, 10, 15, 20, 25][revealedTier! - 1]}% Commission
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Transaction link */}
                  {txSignature && (
                    <div className="mt-4 text-center">
                      <a
                        href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-neon-cyan hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View grant_access transaction
                      </a>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-6 pt-0">
                  {success ? (
                    <button
                      onClick={onClose}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-neon-cyan to-purple-500 text-bg-primary font-medium hover:shadow-glow-sm transition-shadow"
                    >
                      Done
                    </button>
                  ) : error ? (
                    <button
                      onClick={onClose}
                      className="w-full py-3 rounded-xl bg-bg-tertiary text-text-primary font-medium hover:bg-bg-elevated transition-colors"
                    >
                      Close
                    </button>
                  ) : loading ? (
                    <div className="text-center">
                      <p className="text-xs text-text-muted">
                        INCO FHE decryption in progress...
                      </p>
                    </div>
                  ) : null}
                </div>

                {/* INCO badge */}
                <div className="px-6 pb-4">
                  <div className="flex items-center justify-center gap-2 text-xs text-text-muted">
                    <span className="w-4 h-4 rounded bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-[8px] font-bold text-white">
                      I
                    </span>
                    <span>Secured by INCO FHE</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default RevealBadgeModal;
