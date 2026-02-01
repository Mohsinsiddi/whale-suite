'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Modal, { SuccessModal } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useMultiSend, type MultiSendRecipient, type TokenType } from '@/hooks/useMultiSend';
import { useAuth } from '@/lib/privy/hooks';
import { TOKENS as TOKEN_CONFIG, type TokenMetadata } from '@/lib/tokens';

interface MultiSendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Supported tokens with full metadata
const TOKENS: (TokenMetadata & { symbol: TokenType })[] = [
  TOKEN_CONFIG.SOL as TokenMetadata & { symbol: TokenType },
  TOKEN_CONFIG.USDC as TokenMetadata & { symbol: TokenType },
  TOKEN_CONFIG.USDT as TokenMetadata & { symbol: TokenType },
  TOKEN_CONFIG.USD1 as TokenMetadata & { symbol: TokenType },
];

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

  // Phase labels for display
  const phaseLabels: Record<string, { icon: string; color: string }> = {
    idle: { icon: '⏸', color: 'text-text-muted' },
    initializing: { icon: '⚡', color: 'text-neon-cyan' },
    generating_proofs: { icon: '🔐', color: 'text-neon-green' },
    building_transactions: { icon: '🔨', color: 'text-neon-cyan' },
    signing: { icon: '✍️', color: 'text-warning' },
    submitting: { icon: '📡', color: 'text-neon-green' },
    complete: { icon: '✅', color: 'text-success' },
  };

  // Render progress view
  if (isExecuting || progress) {
    const currentPhase = progress?.phase || 'initializing';
    const phaseInfo = phaseLabels[currentPhase] || phaseLabels.initializing;

    return (
      <Modal isOpen={isOpen} onClose={() => {}} title="Multi-Send in Progress" size="lg">
        <div className="space-y-6 py-4">
          {/* Phase indicator */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 flex items-center justify-center">
              {currentPhase === 'complete' ? (
                <span className="text-3xl">✅</span>
              ) : (
                <div className="w-12 h-12 rounded-full border-4 border-neon-green/30 border-t-neon-green animate-spin" />
              )}
            </div>
            <h3 className={`text-lg font-semibold ${phaseInfo.color}`}>
              {progress?.phaseLabel || 'Initializing...'}
            </h3>
            <p className="text-sm text-text-secondary mt-1">
              {currentPhase === 'generating_proofs' && (
                <>Generating ZK proofs for all {recipients.length} recipients</>
              )}
              {currentPhase === 'signing' && (
                <>Please approve in your wallet (single prompt for all)</>
              )}
              {currentPhase === 'submitting' && (
                <>Broadcasting transactions to network...</>
              )}
              {currentPhase === 'complete' && (
                <>All transactions processed!</>
              )}
            </p>
          </div>

          {/* Phase steps */}
          <div className="flex justify-center gap-2">
            {['initializing', 'generating_proofs', 'building_transactions', 'signing', 'submitting'].map((phase, i) => {
              const phases = ['initializing', 'generating_proofs', 'building_transactions', 'signing', 'submitting'];
              const currentIndex = phases.indexOf(currentPhase);
              const isComplete = i < currentIndex || currentPhase === 'complete';
              const isCurrent = phase === currentPhase;

              return (
                <div key={phase} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      isComplete
                        ? 'bg-success text-bg-primary'
                        : isCurrent
                        ? 'bg-neon-green/20 text-neon-green border-2 border-neon-green'
                        : 'bg-bg-tertiary text-text-muted'
                    }`}
                  >
                    {isComplete ? '✓' : i + 1}
                  </div>
                  {i < 4 && (
                    <div className={`w-6 h-0.5 ${isComplete ? 'bg-success' : 'bg-bg-tertiary'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="relative h-2 bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-green to-neon-cyan transition-all duration-300"
              style={{
                width: `${((progress?.current || 0) / Math.max(progress?.total || 1, 1)) * 100}%`,
              }}
            />
          </div>

          {/* Recipients list with status */}
          <div className="max-h-48 overflow-y-auto space-y-2">
            {recipients.map((r, index) => (
              <div
                key={r.id}
                className={`p-3 rounded-lg border ${
                  r.status === 'success'
                    ? 'bg-success/10 border-success/30'
                    : r.status === 'failed'
                    ? 'bg-error/10 border-error/30'
                    : 'bg-bg-tertiary border-border-secondary'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium bg-bg-elevated">
                      {index + 1}
                    </div>
                    <div>
                      <span className="text-sm font-mono text-text-primary">
                        {r.address.slice(0, 8)}...{r.address.slice(-4)}
                      </span>
                      <div className="text-xs text-text-muted">
                        {r.amount} {selectedToken} (${r.usdValue.toFixed(2)})
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.status === 'success' && (
                      <Badge size="xs" variant="success">Done</Badge>
                    )}
                    {r.status === 'failed' && (
                      <Badge size="xs" variant="error">Failed</Badge>
                    )}
                    {r.status === 'pending' && (
                      <Badge size="xs" variant="default">Pending</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Status summary */}
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-text-secondary">{progress?.completed || 0} Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-error" />
              <span className="text-text-secondary">{progress?.failed || 0} Failed</span>
            </div>
          </div>

          {/* Time estimate */}
          {currentPhase === 'generating_proofs' && (
            <div className="text-center text-xs text-text-muted">
              Estimated time: ~{Math.ceil(recipients.length * 40 / 60)} minutes
              (proofs generated in parallel where possible)
            </div>
          )}
        </div>
      </Modal>
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
          <div className="grid grid-cols-4 gap-2">
            {TOKENS.map(token => (
              <button
                key={token.symbol}
                onClick={() => handleTokenChange(token.symbol)}
                className={`p-2.5 rounded-lg border text-center transition-all ${
                  selectedToken === token.symbol
                    ? 'bg-neon-green/10 border-neon-green text-neon-green'
                    : 'bg-bg-tertiary border-border-secondary text-text-secondary hover:border-border-primary'
                }`}
              >
                <div className="flex justify-center mb-1">
                  {token.logoURI ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={token.logoURI}
                      alt={token.symbol}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <span className="text-lg">{token.icon}</span>
                  )}
                </div>
                <div className="text-xs font-medium">{token.symbol}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-text-muted mt-2">
            Price: ${tokenPrice.toFixed(2)} per {selectedToken}
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
                      <div className="px-3 py-2 rounded-lg bg-bg-elevated border border-border-secondary text-sm text-text-secondary min-w-[80px] text-center">
                        ${recipient.usdValue.toFixed(2)}
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
              {totalAmount.toFixed(4)} {selectedToken}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">Total USD Value</span>
            <span className="text-sm font-bold text-neon-green">
              ${totalUsd.toFixed(2)}
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
