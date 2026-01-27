"use client";

import { ReactNode, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showClose?: boolean;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  showClose = true,
  closeOnOverlay = true,
  closeOnEscape = true,
}: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) {
        onClose();
      }
    },
    [onClose, closeOnEscape]
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

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-4xl",
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={closeOnOverlay ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className={`
          relative w-full ${sizes[size]}
          bg-gradient-to-br from-bg-secondary to-bg-tertiary
          border border-border-primary
          rounded-2xl shadow-2xl
          animate-modal-in
          max-h-[90vh] overflow-hidden flex flex-col
        `}
      >
        {/* Glow effect */}
        <div className="absolute -inset-px bg-gradient-to-r from-neon-green/20 to-neon-cyan/20 rounded-2xl blur-sm -z-10" />

        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-start justify-between p-4 border-b border-border-secondary">
            <div>
              {title && (
                <h2 className="text-base font-semibold text-text-primary">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs text-text-secondary mt-0.5">
                  {description}
                </p>
              )}
            </div>
            {showClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
              >
                <CloseIcon />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );

  if (typeof window === "undefined") return null;

  return createPortal(modalContent, document.body);
}

// Transaction Modal with progress
interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  steps: { label: string; status: "pending" | "active" | "completed" | "error"; description?: string }[];
  currentStep: number;
  error?: string;
}

export function TransactionModal({
  isOpen,
  onClose,
  title,
  steps,
  currentStep,
  error,
}: TransactionModalProps) {
  const progress = ((currentStep + 1) / steps.length) * 100;
  const activeStep = steps[currentStep];
  const isZKStep = activeStep?.label?.toLowerCase().includes('proof') ||
                   activeStep?.label?.toLowerCase().includes('bulletproof') ||
                   activeStep?.label?.toLowerCase().includes('zk');

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" closeOnOverlay={false} showClose={false}>
      <div className="space-y-5">
        {/* Header with animation */}
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 rounded-full border-2 border-neon-green/20 animate-pulse" />
            <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-neon-green border-r-neon-cyan animate-spin" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-3 rounded-full border border-transparent border-t-neon-cyan animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />

            {/* Center icon */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 flex items-center justify-center">
              {isZKStep ? (
                <ZKProofIcon className="w-6 h-6 text-neon-green" />
              ) : (
                <SpinnerIcon className="w-6 h-6 text-neon-green animate-spin" />
              )}
            </div>
          </div>

          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          {isZKStep && (
            <p className="text-xs text-neon-cyan mt-1 animate-pulse">
              Generating zero-knowledge proof • 30-45 seconds
            </p>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-text-muted">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="relative h-2 bg-bg-primary rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-green via-neon-cyan to-neon-green rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundSize: '200% 100%', animation: 'shimmer 2s linear infinite' }}
            />
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-green to-neon-cyan rounded-full blur-md opacity-50 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`
                relative flex items-start gap-3 p-3 rounded-xl transition-all duration-500
                ${step.status === "active" ? "bg-gradient-to-r from-neon-green/10 to-neon-cyan/5 border border-neon-green/30 shadow-lg shadow-neon-green/5" : ""}
                ${step.status === "completed" ? "bg-bg-tertiary/50" : ""}
                ${step.status === "pending" ? "opacity-40" : ""}
                ${step.status === "error" ? "bg-error/10 border border-error/30" : ""}
              `}
            >
              {/* Step number/icon */}
              <div className={`
                flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                ${step.status === "completed" ? "bg-neon-green text-bg-primary" : ""}
                ${step.status === "active" ? "bg-neon-green/20 text-neon-green border border-neon-green/50" : ""}
                ${step.status === "pending" ? "bg-bg-tertiary text-text-muted border border-border-secondary" : ""}
                ${step.status === "error" ? "bg-error text-white" : ""}
              `}>
                {step.status === "completed" && <CheckIcon className="w-4 h-4" />}
                {step.status === "active" && <SpinnerIcon className="w-4 h-4 animate-spin" />}
                {step.status === "pending" && <span>{index + 1}</span>}
                {step.status === "error" && <ErrorIcon className="w-4 h-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${
                  step.status === "active" ? "text-neon-green" :
                  step.status === "completed" ? "text-text-secondary" : "text-text-muted"
                }`}>
                  {step.label}
                </div>
                {step.status === "active" && step.description && (
                  <p className="text-xs text-text-muted mt-0.5 animate-fade-in">
                    {step.description}
                  </p>
                )}
                {step.status === "active" && isZKStep && index === currentStep && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-[10px] text-neon-cyan">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
                      Computing Bulletproof range proof...
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-text-muted">
                      <LockIcon className="w-3 h-3" />
                      Your transaction amount will be cryptographically hidden
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info box for ZK proofs */}
        {isZKStep && (
          <div className="p-3 rounded-xl bg-gradient-to-r from-neon-green/5 to-neon-cyan/5 border border-neon-green/20">
            <div className="flex items-start gap-2">
              <ShieldLockIcon className="w-4 h-4 text-neon-green mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-neon-green">Privacy in Progress</p>
                <p className="text-[10px] text-text-muted mt-0.5">
                  Bulletproof ZK proofs ensure your transaction amount remains completely private on-chain.
                  This computation happens locally in your browser.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-error/10 border border-error/30">
            <p className="text-xs text-error">{error}</p>
          </div>
        )}

        {/* Cancel hint */}
        <p className="text-center text-[10px] text-text-muted">
          Please do not close this window
        </p>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </Modal>
  );
}

// Success Modal
interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  txSignature?: string;
  actions?: ReactNode;
}

// Helper to parse transaction signatures (handles "TX1:... TX2:..." format)
function parseSignatures(signature: string): { label: string; sig: string }[] {
  if (!signature) return [];

  // Check if it contains multiple transactions (TX1:, TX2:, etc.)
  if (signature.includes('TX1:') || signature.includes('TX2:')) {
    const signatures: { label: string; sig: string }[] = [];

    // Extract TX1
    const tx1Match = signature.match(/TX1:([A-Za-z0-9]+)/);
    if (tx1Match) {
      signatures.push({ label: 'Transaction 1', sig: tx1Match[1] });
    }

    // Extract TX2
    const tx2Match = signature.match(/TX2:([A-Za-z0-9]+)/);
    if (tx2Match) {
      signatures.push({ label: 'Transaction 2', sig: tx2Match[1] });
    }

    return signatures;
  }

  // Single signature
  return [{ label: 'Transaction', sig: signature }];
}

export function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  txSignature,
  actions,
}: SuccessModalProps) {
  const signatures = parseSignatures(txSignature || '');

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center py-4">
        {/* Success animation */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neon-green/20 flex items-center justify-center animate-success-bounce">
          <CheckIcon className="w-8 h-8 text-neon-green" />
        </div>

        <h3 className="text-lg font-semibold text-text-primary mb-1">{title}</h3>
        <p className="text-sm text-text-secondary mb-4">{message}</p>

        {signatures.length > 0 && (
          <div className="space-y-2 mb-4">
            {signatures.map((tx, index) => (
              <a
                key={index}
                href={`https://solscan.io/tx/${tx.sig}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 text-xs text-neon-cyan hover:underline"
              >
                {signatures.length > 1 && <span className="text-text-muted">{tx.label}:</span>}
                <span className="font-mono">{tx.sig.slice(0, 8)}...{tx.sig.slice(-8)}</span>
                <ExternalLinkIcon className="w-3 h-3" />
              </a>
            ))}
          </div>
        )}

        {actions || (
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary text-sm font-semibold rounded-lg hover:shadow-glow-sm transition-all"
          >
            Done
          </button>
        )}
      </div>
    </Modal>
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

const SpinnerIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

// CircleIcon removed - was unused

const ErrorIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ExternalLinkIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const ZKProofIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611l-4.819.855a6.025 6.025 0 01-6.632 0l-4.82-.855c-1.715-.293-2.298-2.379-1.066-3.611L5 14.5" />
  </svg>
);

const LockIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const ShieldLockIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);
