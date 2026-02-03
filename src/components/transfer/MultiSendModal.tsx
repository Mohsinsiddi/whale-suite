'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Modal, { SuccessModal, TransactionModal } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useMultiSend, type MultiSendRecipient, type TokenType } from '@/hooks/useMultiSend';
import { useAuth } from '@/lib/privy/hooks';
import { MULTI_SEND_TOKEN_LIST, type TokenMetadata } from '@/lib/tokens';

interface MultiSendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Supported tokens - all tokens with multiSendEnabled flag
const TOKENS: (TokenMetadata & { symbol: TokenType })[] = MULTI_SEND_TOKEN_LIST as (TokenMetadata & { symbol: TokenType })[];

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

export function MultiSendModal({ isOpen, onClose }: MultiSendModalProps) {
  const { walletAddress } = useAuth();
  const {
    loading,
    progress,
    result,
    error,
    shieldedBalanceSOL,
    executeMultiSend,
    validateRecipients,
    calculateUsdValue,
    fetchShieldedBalance,
    reset,
    getPrice,
  } = useMultiSend();

  // State
  const [recipients, setRecipients] = useState<MultiSendRecipient[]>([
    { id: generateId(), address: '', amount: '', usdValue: 0, status: 'pending' },
  ]);
  const [selectedToken, setSelectedToken] = useState<TokenType>('SOL');
  const [transferType, setTransferType] = useState<'internal' | 'external'>('internal');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Fetch shielded balance on mount
  useEffect(() => {
    if (isOpen && walletAddress) {
      fetchShieldedBalance();
    }
  }, [isOpen, walletAddress, fetchShieldedBalance]);

  // Calculate totals
  const { valid, error: validationError, totalAmount, totalUsd } = useMemo(() => {
    return validateRecipients(recipients, selectedToken);
  }, [recipients, selectedToken, validateRecipients]);

  // Token price
  const tokenPrice = useMemo(() => getPrice(selectedToken), [selectedToken, getPrice]);

  // Add recipient
  const addRecipient = useCallback(() => {
    if (recipients.length >= 10) return;
    setRecipients(prev => [
      ...prev,
      { id: generateId(), address: '', amount: '', usdValue: 0, status: 'pending' },
    ]);
  }, [recipients.length]);

  // Remove recipient
  const removeRecipient = useCallback((id: string) => {
    if (recipients.length <= 1) return;
    setRecipients(prev => prev.filter(r => r.id !== id));
  }, [recipients.length]);

  // Update recipient
  const updateRecipient = useCallback((id: string, field: 'address' | 'amount', value: string) => {
    setRecipients(prev =>
      prev.map(r => {
        if (r.id !== id) return r;
        if (field === 'amount') {
          return {
            ...r,
            amount: value,
            usdValue: calculateUsdValue(value, selectedToken),
          };
        }
        return { ...r, [field]: value };
      })
    );
  }, [selectedToken, calculateUsdValue]);

  // Handle token change
  const handleTokenChange = useCallback((token: TokenType) => {
    setSelectedToken(token);
    // Recalculate USD values
    setRecipients(prev =>
      prev.map(r => ({
        ...r,
        usdValue: calculateUsdValue(r.amount, token),
      }))
    );
  }, [calculateUsdValue]);

  // Handle execute
  const handleExecute = async () => {
    if (!walletAddress || !valid) return;

    setIsExecuting(true);

    await executeMultiSend(
      walletAddress,
      recipients,
      selectedToken,
      transferType,
      (progress) => {
        // Progress updates handled via hook state
        console.log('[MultiSend] Progress:', progress);
      }
    );

    setIsExecuting(false);
    setShowSuccess(true);
  };

  // Handle close
  const handleClose = () => {
    if (loading || isExecuting) return;
    reset();
    setRecipients([{ id: generateId(), address: '', amount: '', usdValue: 0, status: 'pending' }]);
    setShowSuccess(false);
    onClose();
  };

  // Handle success close
  const handleSuccessClose = () => {
    setShowSuccess(false);
    handleClose();
  };

  // Build transaction steps for TransactionModal
  const getTransactionSteps = useCallback((): { label: string; status: 'pending' | 'active' | 'completed'; description: string }[] => {
    const currentPhase = progress?.phase || 'initializing';
    const currentIdx = progress?.current || 0;
    const phases = ['initializing', 'generating_proofs', 'building_transactions', 'signing', 'submitting'];
    const currentPhaseIndex = phases.indexOf(currentPhase);

    const getStatus = (phaseIndex: number): 'pending' | 'active' | 'completed' => {
      if (currentPhase === 'complete') return 'completed';
      if (phaseIndex < currentPhaseIndex) return 'completed';
      if (phaseIndex === currentPhaseIndex) return 'active';
      return 'pending';
    };

    return [
      {
        label: 'Initializing ZK Environment',
        status: getStatus(0),
        description: 'Loading WebAssembly cryptographic modules...',
      },
      {
        label: `Generating Bulletproof ZK Proofs (${Math.min(currentIdx + 1, recipients.length)}/${recipients.length})`,
        status: getStatus(1),
        description: `Creating ${recipients.length} ZK proofs to hide transaction amounts. ~30-45 sec per recipient.`,
      },
      {
        label: 'Building Transactions',
        status: getStatus(2),
        description: `Preparing ${recipients.length} private transactions...`,
      },
      {
        label: 'Signing with Wallet',
        status: getStatus(3),
        description: 'Please approve the transactions in your wallet...',
      },
      {
        label: 'Broadcasting to ShadowWire',
        status: getStatus(4),
        description: `Submitting ${recipients.length} private transactions to network...`,
      },
    ];
  }, [progress, recipients.length]);

  // Get current step index for TransactionModal
  const getCurrentStepIndex = useCallback((): number => {
    const phases = ['initializing', 'generating_proofs', 'building_transactions', 'signing', 'submitting', 'complete'];
    const currentPhase = progress?.phase || 'initializing';
    const idx = phases.indexOf(currentPhase);
    return idx >= 0 ? Math.min(idx, 4) : 0;
  }, [progress]);

  // Render progress view using TransactionModal
  if (isExecuting || progress) {
    const currentPhase = progress?.phase || 'initializing';
    const currentIdx = progress?.current || 0;

    return (
      <>
        <TransactionModal
          isOpen={isOpen}
          onClose={() => {}}
          title={`Multi-Send to ${recipients.length} Recipients`}
          steps={getTransactionSteps()}
          currentStep={getCurrentStepIndex()}
        />

        {/* Recipient Progress Overlay - shows alongside TransactionModal */}
        {currentPhase !== 'complete' && (
          <div className="fixed bottom-4 right-4 z-[60] w-80 max-h-64 overflow-hidden rounded-xl bg-bg-secondary/95 backdrop-blur-sm border border-border-primary shadow-2xl animate-fade-in">
            <div className="p-3 border-b border-border-secondary">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neon-green">
                  📋 Recipients ({progress?.completed || 0}/{recipients.length})
                </span>
                <span className="text-[10px] text-text-muted">
                  {currentPhase === 'generating_proofs' && `Proof ${currentIdx + 1}/${recipients.length}`}
                </span>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto p-2 space-y-1.5">
              {recipients.map((r, index) => {
                const isCurrentRecipient = currentPhase === 'generating_proofs' && index === currentIdx;

                return (
                  <div
                    key={r.id}
                    className={`p-2 rounded-lg border transition-all text-xs ${
                      r.status === 'success'
                        ? 'bg-success/10 border-success/30'
                        : r.status === 'failed'
                        ? 'bg-error/10 border-error/30'
                        : isCurrentRecipient
                        ? 'bg-neon-green/10 border-neon-green/50'
                        : 'bg-bg-tertiary/50 border-border-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium ${
                          r.status === 'success'
                            ? 'bg-success text-bg-primary'
                            : r.status === 'failed'
                            ? 'bg-error text-white'
                            : isCurrentRecipient
                            ? 'bg-neon-green/20 text-neon-green animate-pulse'
                            : 'bg-bg-elevated text-text-muted'
                        }`}>
                          {r.status === 'success' ? '✓' : r.status === 'failed' ? '✗' : index + 1}
                        </div>
                        <span className="font-mono text-text-secondary">
                          {r.address.slice(0, 6)}...{r.address.slice(-4)}
                        </span>
                      </div>
                      <span className="text-text-muted">
                        {r.amount} {selectedToken}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </>
    );
  }

  // Success modal
  if (showSuccess && result) {
    return (
      <SuccessModal
        isOpen={isOpen}
        onClose={handleSuccessClose}
        title="Multi-Send Complete!"
        message={
          result.failedCount === 0
            ? `Successfully sent ${selectedToken} to ${result.completedCount} recipients`
            : `Sent to ${result.completedCount} recipients, ${result.failedCount} failed`
        }
        txSignature={result.recipients.find(r => r.signature)?.signature || ''}
      />
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Multi-Send" size="lg">
      <div className="space-y-5 py-2">
        {/* Shielded Balance */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-neon-green/10 to-neon-cyan/10 border border-neon-green/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldIcon className="w-4 h-4 text-neon-green" />
              <span className="text-xs font-medium text-neon-green">ShadowWire Pool Balance</span>
            </div>
            <span className="text-sm font-bold text-text-primary">
              {shieldedBalanceSOL.toFixed(4)} SOL
            </span>
          </div>
        </div>

        {/* Token Selector */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-2">
            Select Token
          </label>
          <div className="flex flex-wrap gap-2">
            {TOKENS.map(token => (
              <button
                key={token.symbol}
                onClick={() => handleTokenChange(token.symbol)}
                className={`px-3 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                  selectedToken === token.symbol
                    ? 'bg-neon-green/10 border-neon-green text-neon-green'
                    : 'bg-bg-tertiary border-border-secondary text-text-secondary hover:border-border-primary'
                }`}
              >
                <div className="flex-shrink-0">
                  {token.logoURI ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={token.logoURI}
                      alt={token.symbol}
                      className="w-5 h-5 rounded-full ring-1 ring-white/10"
                    />
                  ) : (
                    <span className="text-sm">{token.icon}</span>
                  )}
                </div>
                <span className="text-xs font-medium">{token.symbol}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-text-muted mt-2">
            Price: ${tokenPrice.toFixed(tokenPrice < 0.01 ? 6 : 2)} per {selectedToken}
          </p>
        </div>

        {/* Transfer Type */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-2">
            Privacy Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTransferType('internal')}
              className={`p-3 rounded-lg border transition-all ${
                transferType === 'internal'
                  ? 'bg-neon-green/10 border-neon-green text-neon-green'
                  : 'bg-bg-tertiary border-border-secondary text-text-secondary hover:border-border-primary'
              }`}
            >
              <div className="text-xs font-medium">Hidden Amount</div>
              <div className="text-[10px] opacity-70 mt-0.5">Amount hidden via ZK</div>
            </button>
            <button
              onClick={() => setTransferType('external')}
              className={`p-3 rounded-lg border transition-all ${
                transferType === 'external'
                  ? 'bg-neon-cyan/10 border-neon-cyan text-neon-cyan'
                  : 'bg-bg-tertiary border-border-secondary text-text-secondary hover:border-border-primary'
              }`}
            >
              <div className="text-xs font-medium">Anonymous Sender</div>
              <div className="text-[10px] opacity-70 mt-0.5">Your identity hidden</div>
            </button>
          </div>
        </div>

        {/* Recipients */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-text-secondary">
              Recipients ({recipients.length}/10)
            </label>
            <button
              onClick={addRecipient}
              disabled={recipients.length >= 10}
              className="text-xs text-neon-green hover:text-neon-cyan disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              + Add Recipient
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {recipients.map((recipient, index) => (
              <div
                key={recipient.id}
                className="p-3 rounded-lg bg-bg-tertiary border border-border-secondary"
              >
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-bg-elevated flex items-center justify-center text-xs font-medium text-text-muted flex-shrink-0 mt-1.5">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      placeholder="Wallet address"
                      value={recipient.address}
                      onChange={(e) => updateRecipient(recipient.id, 'address', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border-secondary text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-green font-mono"
                    />
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          placeholder="Amount"
                          value={recipient.amount}
                          onChange={(e) => updateRecipient(recipient.id, 'amount', e.target.value)}
                          min="0.1"
                          step="0.1"
                          className="w-full px-3 py-2 pr-16 rounded-lg bg-bg-elevated border border-border-secondary text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-green"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">
                          {selectedToken}
                        </span>
                      </div>
                      <div className="px-3 py-2 rounded-lg bg-bg-elevated border border-border-secondary text-sm text-text-secondary min-w-[90px] text-center">
                        ${recipient.usdValue > 0
                          ? recipient.usdValue < 0.01
                            ? recipient.usdValue.toFixed(6)
                            : recipient.usdValue.toFixed(2)
                          : '0.00'
                        }
                      </div>
                    </div>
                  </div>
                  {recipients.length > 1 && (
                    <button
                      onClick={() => removeRecipient(recipient.id)}
                      className="p-1.5 rounded-lg hover:bg-error/10 text-text-muted hover:text-error transition-colors flex-shrink-0"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="p-3 rounded-xl bg-bg-tertiary border border-border-secondary">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted">Total Amount</span>
            <span className="text-sm font-bold text-text-primary">
              {totalAmount < 1000 ? totalAmount.toFixed(4) : totalAmount.toLocaleString()} {selectedToken}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">Total USD Value</span>
            <span className="text-sm font-bold text-neon-green">
              ${totalUsd > 0
                ? totalUsd < 0.01
                  ? totalUsd.toFixed(6)
                  : totalUsd.toFixed(2)
                : '0.00'
              }
            </span>
          </div>
        </div>

        {/* Error */}
        {(validationError || error) && (
          <div className="p-3 rounded-xl bg-error/10 border border-error/20">
            <p className="text-xs text-error">{validationError || error}</p>
          </div>
        )}

        {/* ZK Info */}
        <div className="p-3 rounded-xl bg-neon-green/5 border border-neon-green/20">
          <div className="flex items-start gap-2">
            <InfoIcon className="w-4 h-4 text-neon-green mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-neon-green font-medium">Sequential ZK Transfers</p>
              <p className="text-xs text-text-secondary mt-1">
                Each transfer generates a unique Bulletproof ZK proof (~30-45 seconds per transfer).
                Total time: ~{recipients.length * 40} seconds.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="ghost" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleExecute}
            disabled={!valid || loading}
            loading={loading}
            className="flex-1"
          >
            Send to {recipients.length} Recipients
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Icons
const ShieldIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const XIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const InfoIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
);

export default MultiSendModal;
