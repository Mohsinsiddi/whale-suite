'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { Shield, AlertTriangle, ExternalLink, Check } from 'lucide-react';

interface TermsAcceptanceModalProps {
  isOpen: boolean;
  onAccept: () => Promise<void>;
  isLoading?: boolean;
}

export default function TermsAcceptanceModal({
  isOpen,
  onAccept,
  isLoading = false,
}: TermsAcceptanceModalProps) {
  const [accepted, setAccepted] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-bg-secondary border border-border-primary rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border-primary bg-gradient-to-r from-neon-green/10 to-neon-cyan/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-neon-green" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">Welcome to Whale Suite</h2>
              <p className="text-text-muted text-sm">One-time acceptance required</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Warning Banner */}
          <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-warning font-medium text-sm">Pre-Beta Warning</p>
                <p className="text-text-secondary text-xs leading-relaxed">
                  This app is in <strong>pre-beta stage</strong> and was created for hackathon purposes.
                  Please <strong>do not use large amounts of funds</strong>. Start with small amounts
                  to test functionality.
                </p>
              </div>
            </div>
          </div>

          {/* Key Points */}
          <div className="space-y-3">
            <p className="text-text-secondary text-sm">By using Whale Suite, you acknowledge:</p>
            <ul className="space-y-2 text-xs text-text-muted">
              <li className="flex items-start gap-2">
                <span className="text-neon-green mt-0.5">•</span>
                <span>This is experimental software on Solana mainnet</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neon-green mt-0.5">•</span>
                <span>Cryptocurrency transactions are irreversible</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neon-green mt-0.5">•</span>
                <span>Third-party services (StarPay, Jupiter, Darklake) have their own terms</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neon-green mt-0.5">•</span>
                <span>You are responsible for securing your wallet and funds</span>
              </li>
            </ul>
          </div>

          {/* Read Full Terms Link */}
          <Link
            href="/terms"
            target="_blank"
            className="flex items-center gap-2 text-neon-cyan text-sm hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Read full Terms & Conditions
          </Link>

          {/* Acceptance Checkbox */}
          <label className="flex items-start gap-3 p-3 rounded-lg bg-bg-tertiary/50 border border-border-primary cursor-pointer hover:border-neon-green/30 transition-colors">
            <div className="relative flex items-center justify-center mt-0.5">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                accepted
                  ? 'bg-neon-green border-neon-green'
                  : 'border-text-muted bg-transparent'
              }`}>
                {accepted && <Check className="w-3 h-3 text-bg-primary" />}
              </div>
            </div>
            <span className="text-text-secondary text-sm leading-relaxed">
              I understand the risks and agree to the{' '}
              <Link href="/terms" target="_blank" className="text-neon-green hover:underline">
                Terms & Conditions
              </Link>
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-primary bg-bg-tertiary/30">
          <Button
            variant="primary"
            className="w-full"
            disabled={!accepted || isLoading}
            onClick={onAccept}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />
                Accepting...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Accept & Continue
              </>
            )}
          </Button>
          <p className="text-center text-text-muted text-xs mt-3">
            This is a one-time process
          </p>
        </div>
      </div>
    </div>
  );
}
