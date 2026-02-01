'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useNetwork } from '@/hooks/useNetwork';

interface JoinStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  description?: string;
}

interface JoinChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelName: string;
  tierName: string;
  steps: JoinStep[];
  currentStep: number;
  loading: boolean;
  error: string | null;
  success: boolean;
  anonId: string | null;
  txSignature: string | null;
  onNavigate?: () => void;
}

export function JoinChannelModal({
  isOpen,
  onClose,
  channelName,
  tierName,
  steps,
  currentStep,
  loading,
  error,
  success,
  anonId,
  txSignature,
  onNavigate,
}: JoinChannelModalProps) {
  const { network } = useNetwork();

  const progress = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;

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

          {/* Modal - centered with higher z-index */}
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
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">
                      {success ? 'Joined Successfully!' : error ? 'Join Failed' : 'Joining Channel'}
                    </h2>
                    <p className="text-sm text-text-muted mt-1">
                      {channelName} ({tierName}+ required)
                    </p>
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
                    className="h-full bg-gradient-to-r from-neon-green to-neon-cyan"
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

                {/* Success message */}
                {success && anonId && (
                  <div className="mt-4 p-4 rounded-lg bg-neon-green/10 border border-neon-green/30">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-neon-green/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neon-green">Welcome to {channelName}!</p>
                        <p className="text-xs text-text-muted mt-0.5">
                          Your anonymous ID: <span className="text-neon-cyan font-mono">{anonId}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Transaction link */}
                {txSignature && (
                  <div className="mt-4 text-center">
                    <a
                      href={`https://explorer.solana.com/tx/${txSignature}?cluster=${network}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-neon-cyan hover:underline"
                    >
                      View grant_access transaction
                    </a>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 pt-0">
                {success ? (
                  <button
                    onClick={onNavigate}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary font-medium hover:shadow-glow-sm transition-shadow"
                  >
                    Enter Channel
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
                      INCO FHE verification in progress...
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

export default JoinChannelModal;
