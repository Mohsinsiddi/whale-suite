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
  steps: { label: string; status: "pending" | "active" | "completed" | "error" }[];
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" closeOnOverlay={false}>
      <div className="space-y-4">
        {/* Progress bar */}
        <div className="relative h-1.5 bg-bg-primary rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-green to-neon-cyan rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-green to-neon-cyan rounded-full blur-sm opacity-50 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`
                flex items-center gap-3 p-2.5 rounded-lg transition-all duration-300
                ${step.status === "active" ? "bg-neon-green/10 border border-neon-green/30" : ""}
                ${step.status === "completed" ? "opacity-60" : ""}
                ${step.status === "error" ? "bg-error/10 border border-error/30" : ""}
              `}
            >
              <div className="flex-shrink-0">
                {step.status === "completed" && <CheckIcon className="w-4 h-4 text-neon-green" />}
                {step.status === "active" && <SpinnerIcon className="w-4 h-4 text-neon-green animate-spin" />}
                {step.status === "pending" && <CircleIcon className="w-4 h-4 text-text-muted" />}
                {step.status === "error" && <ErrorIcon className="w-4 h-4 text-error" />}
              </div>
              <span
                className={`text-sm ${
                  step.status === "active" ? "text-neon-green font-medium" : "text-text-secondary"
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-error/10 border border-error/30">
            <p className="text-xs text-error">{error}</p>
          </div>
        )}
      </div>
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

const CircleIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <circle cx="12" cy="12" r="10" strokeWidth={2} />
  </svg>
);

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
