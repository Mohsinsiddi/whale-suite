'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/privy/hooks';
import { useNetwork } from '@/hooks/useNetwork';
import { TransactionModal, SuccessModal } from '@/components/ui/Modal';
import { WalletMismatchBanner } from "@/components/ui/WalletMismatchBanner";
import WhaleLogo from "@/components/ui/WhaleLogo";

interface Payment {
  id: string;
  paymentId: string;
  paymentAccountAddress: string;
  escrowAccountAddress: string;
  escrowAmount: number;
  status: 'active' | 'pending' | 'claimed' | 'cancelled' | 'expired';
  expiresAt: string;
  claimedAt?: string;
  createTxSignature: string;
  claimTxSignature?: string;
  finalizeTxSignature?: string;
  cancelTxSignature?: string;
  memo?: string;
  createdAt: string;
}

const EXPIRY_OPTIONS = [
  { value: 1, label: '1 Day' },
  { value: 3, label: '3 Days' },
  { value: 7, label: '7 Days' },
  { value: 14, label: '14 Days' },
  { value: 30, label: '30 Days' },
];

export default function PrivatePaymentsPage() {
  const { wallet, walletAddress, authenticated } = useAuth();
  const { switchNetwork, isFeatureAvailable } = useNetwork();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'create' | 'sent' | 'claim'>('create');

  // Create payment form
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [expiryDays, setExpiryDays] = useState(7);
  const [memo, setMemo] = useState('');
  const [creating, setCreating] = useState(false);

  // Claim payment form
  const [claimPaymentId, setClaimPaymentId] = useState('');
  const [claiming, setClaiming] = useState(false);

  // Progress & Success modals
  const [txProgress, setTxProgress] = useState<{ steps: { label: string; status: 'pending' | 'active' | 'completed' | 'error' }[]; currentStep: number } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{ signature: string; message: string } | null>(null);

  // Check if feature available
  const isAvailable = isFeatureAvailable('private-payments');

  // Fetch payments
  const fetchPayments = useCallback(async () => {
    if (!walletAddress) return;

    try {
      const res = await fetch(`/api/payments/private?wallet=${walletAddress}`);
      const data = await res.json();
      if (data.success) {
        setPayments(data.payments);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (isAvailable) {
      fetchPayments();
    }
  }, [fetchPayments, isAvailable]);

  // Create payment
  const handleCreatePayment = async () => {
    if (!wallet || !walletAddress || !recipient || !amount) return;

    setCreating(true);
    setTxProgress({
      steps: [
        { label: 'Encrypting payment data', status: 'pending' },
        { label: 'Building transaction', status: 'pending' },
        { label: 'Awaiting signature', status: 'pending' },
        { label: 'Confirming on-chain', status: 'pending' },
        { label: 'Saving payment', status: 'pending' },
      ],
      currentStep: 0,
    });

    try {
      // Step 1: Encrypt
      setTxProgress(p => p ? { ...p, steps: p.steps.map((s, i) => i === 0 ? { ...s, status: 'active' } : s) } : null);
      await new Promise(r => setTimeout(r, 1000));
      setTxProgress(p => p ? { ...p, steps: p.steps.map((s, i) => i === 0 ? { ...s, status: 'completed' } : s), currentStep: 1 } : null);

      // Step 2: Build TX
      setTxProgress(p => p ? { ...p, steps: p.steps.map((s, i) => i === 1 ? { ...s, status: 'active' } : s) } : null);
      await new Promise(r => setTimeout(r, 800));
      setTxProgress(p => p ? { ...p, steps: p.steps.map((s, i) => i === 1 ? { ...s, status: 'completed' } : s), currentStep: 2 } : null);

      // Step 3: Sign
      setTxProgress(p => p ? { ...p, steps: p.steps.map((s, i) => i === 2 ? { ...s, status: 'active' } : s) } : null);
      await new Promise(r => setTimeout(r, 1500));
      const mockSignature = 'mock_payment_' + Math.random().toString(36).substring(7);
      const mockPaymentId = 'pay_' + Math.random().toString(36).substring(2, 15);
      setTxProgress(p => p ? { ...p, steps: p.steps.map((s, i) => i === 2 ? { ...s, status: 'completed' } : s), currentStep: 3 } : null);

      // Step 4: Confirm
      setTxProgress(p => p ? { ...p, steps: p.steps.map((s, i) => i === 3 ? { ...s, status: 'active' } : s) } : null);
      await new Promise(r => setTimeout(r, 2000));
      setTxProgress(p => p ? { ...p, steps: p.steps.map((s, i) => i === 3 ? { ...s, status: 'completed' } : s), currentStep: 4 } : null);

      // Step 5: Save
      setTxProgress(p => p ? { ...p, steps: p.steps.map((s, i) => i === 4 ? { ...s, status: 'active' } : s) } : null);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);

      const res = await fetch('/api/payments/private', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: walletAddress,
          paymentId: mockPaymentId,
          txSignature: mockSignature,
          paymentAccountAddress: 'pay_acc_' + mockPaymentId,
          escrowAccountAddress: 'escrow_' + mockPaymentId,
          escrowAmount: parseFloat(amount) * 1e9,
          expiresAt: expiresAt.toISOString(),
          memo,
        }),
      });

      const paymentResult = await res.json();
      if (!paymentResult.success) throw new Error('Failed to record payment');
      setTxProgress(p => p ? { ...p, steps: p.steps.map((s, i) => i === 4 ? { ...s, status: 'completed' } : s) } : null);

      // Success
      await new Promise(r => setTimeout(r, 500));
      setTxProgress(null);
      setSuccessData({
        signature: mockSignature,
        message: `Payment created! Share Payment ID: ${mockPaymentId}`,
      });
      setShowSuccess(true);

      // Reset form
      setRecipient('');
      setAmount('');
      setMemo('');

      // Refresh payments
      await fetchPayments();
    } catch (error) {
      console.error('Failed to create payment:', error);
      setTxProgress(null);
    } finally {
      setCreating(false);
    }
  };

  // Claim payment
  const handleClaimPayment = async () => {
    if (!wallet || !walletAddress || !claimPaymentId) return;

    setClaiming(true);
    setTxProgress({
      steps: [
        { label: 'Fetching payment data', status: 'pending' },
        { label: 'Encrypting identity', status: 'pending' },
        { label: 'Initiating claim', status: 'pending' },
        { label: 'Verifying proof', status: 'pending' },
        { label: 'Releasing funds', status: 'pending' },
      ],
      currentStep: 0,
    });

    try {
      // Steps...
      for (let i = 0; i < 5; i++) {
        setTxProgress(p => p ? { ...p, steps: p.steps.map((s, j) => j === i ? { ...s, status: 'active' } : s), currentStep: i } : null);
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 500));
        setTxProgress(p => p ? { ...p, steps: p.steps.map((s, j) => j === i ? { ...s, status: 'completed' } : s) } : null);
      }

      const mockSignature = 'claim_' + Math.random().toString(36).substring(7);

      setTxProgress(null);
      setSuccessData({
        signature: mockSignature,
        message: 'Payment claimed successfully! Funds have been transferred to your wallet.',
      });
      setShowSuccess(true);

      setClaimPaymentId('');
    } catch (error) {
      console.error('Failed to claim payment:', error);
      setTxProgress(null);
    } finally {
      setClaiming(false);
    }
  };

  // Cancel payment
  const handleCancelPayment = async (payment: Payment) => {
    if (!wallet || !walletAddress) return;

    try {
      const mockSignature = 'cancel_' + Math.random().toString(36).substring(7);

      await fetch(`/api/payments/private/${payment.paymentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          txSignature: mockSignature,
        }),
      });

      await fetchPayments();

      setSuccessData({
        signature: mockSignature,
        message: 'Payment cancelled. Funds have been returned to your wallet.',
      });
      setShowSuccess(true);
    } catch (error) {
      console.error('Failed to cancel payment:', error);
    }
  };

  // Render not authenticated
  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Connect Wallet</h2>
          <p className="text-text-muted">Connect your wallet to access private payments</p>
        </div>
      </div>
    );
  }

  // Render not on devnet
  if (!isAvailable) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Devnet Only</h2>
          <p className="text-text-secondary mb-6">
            Private payments are currently available on Devnet only. Switch networks to access this feature.
          </p>
          <button
            onClick={() => switchNetwork('devnet')}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary font-bold hover:shadow-glow-md transition-all"
          >
            Switch to Devnet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <WalletMismatchBanner />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold text-text-primary">Private Payments</h1>
          <span className="px-2 py-1 rounded-lg bg-neon-cyan/20 text-neon-cyan text-xs font-bold">FHE</span>
          <span className="px-2 py-1 rounded-lg bg-warning/20 text-warning text-xs font-bold">Coming Soon</span>
        </div>
        <p className="text-text-secondary">
          Send and receive payments with complete privacy. Sender, recipient, and amount are all encrypted using INCO FHE.
        </p>
      </div>

      {/* Coming Soon Banner */}
      <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-warning/20 via-warning/10 to-warning/20 border border-warning/40">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🚧</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-warning mb-0.5">In Development - Coming Soon</h3>
            <p className="text-xs text-text-secondary">
              Private Payments using INCO FHE encryption is currently under development on devnet.
              Full functionality will be available soon.
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mb-8 p-4 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔐</span>
          <div>
            <h3 className="font-bold text-text-primary mb-1">Complete Unlinkability</h3>
            <p className="text-sm text-text-secondary">
              Observer cannot link sender to recipient even with on-chain data. All payment details are encrypted via INCO FHE.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'create', label: 'Create Payment', icon: '💸' },
          { id: 'sent', label: 'Sent Payments', icon: '📤' },
          { id: 'claim', label: 'Claim Payment', icon: '📥' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-neon-green/10 text-neon-green border border-neon-green/30'
                : 'bg-bg-tertiary text-text-secondary hover:text-text-primary border border-transparent'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Create Payment Tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 rounded-2xl bg-bg-tertiary border border-border-primary"
          >
            <h2 className="text-xl font-bold text-text-primary mb-6">Create Private Payment</h2>

            <div className="space-y-4">
              {/* Recipient */}
              <div>
                <label className="block text-sm text-text-muted mb-2">Recipient Address</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  placeholder="Enter Solana address..."
                  className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border-primary text-text-primary placeholder-text-muted focus:border-neon-green focus:outline-none transition-colors"
                />
                <p className="text-xs text-text-muted mt-1">
                  🔒 Recipient address will be encrypted on-chain
                </p>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm text-text-muted mb-2">Amount (SOL)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border-primary text-text-primary placeholder-text-muted focus:border-neon-green focus:outline-none transition-colors"
                />
                <p className="text-xs text-text-muted mt-1">
                  🔒 Amount will be encrypted (escrow balance visible)
                </p>
              </div>

              {/* Expiry */}
              <div>
                <label className="block text-sm text-text-muted mb-2">Expiry</label>
                <div className="flex gap-2">
                  {EXPIRY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setExpiryDays(opt.value)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        expiryDays === opt.value
                          ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                          : 'bg-bg-secondary text-text-secondary hover:text-text-primary border border-border-secondary'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Memo */}
              <div>
                <label className="block text-sm text-text-muted mb-2">Memo (Optional)</label>
                <input
                  type="text"
                  value={memo}
                  onChange={e => setMemo(e.target.value)}
                  placeholder="What's this payment for?"
                  className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border-primary text-text-primary placeholder-text-muted focus:border-neon-green focus:outline-none transition-colors"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleCreatePayment}
                disabled={!recipient || !amount || creating}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary font-bold text-lg hover:shadow-glow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Private Payment'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Sent Payments Tab */}
        {activeTab === 'sent' && (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="relative">
                  {/* Spinning ring */}
                  <motion.div
                    className="absolute -inset-3 rounded-full border-2 border-transparent border-t-neon-green border-r-neon-cyan"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                  />
                  {/* Inner spinning ring (reverse) */}
                  <motion.div
                    className="absolute -inset-1.5 rounded-full border border-transparent border-t-neon-cyan/60"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                  {/* Logo */}
                  <WhaleLogo size="sm" showText={false} animated={true} />
                </div>
                <p className="text-xs text-text-muted">Loading payments...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="p-12 rounded-2xl bg-bg-tertiary border border-border-primary text-center">
                <div className="text-4xl mb-3">📤</div>
                <p className="text-text-muted">No payments sent yet</p>
              </div>
            ) : (
              payments.map(payment => (
                <div
                  key={payment.id}
                  className="p-4 rounded-xl bg-bg-tertiary border border-border-primary"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs text-text-muted">Payment ID</p>
                      <p className="font-mono text-sm text-text-primary">{payment.paymentId}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      payment.status === 'active' ? 'bg-neon-green/20 text-neon-green' :
                      payment.status === 'pending' ? 'bg-warning/20 text-warning' :
                      payment.status === 'claimed' ? 'bg-neon-cyan/20 text-neon-cyan' :
                      payment.status === 'cancelled' ? 'bg-error/20 text-error' :
                      'bg-text-muted/20 text-text-muted'
                    }`}>
                      {payment.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-text-muted">Amount</p>
                      <p className="font-bold text-text-primary">{(payment.escrowAmount / 1e9).toFixed(4)} SOL</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Expires</p>
                      <p className="text-sm text-text-secondary">
                        {new Date(payment.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {payment.memo && (
                    <p className="text-sm text-text-muted mb-3">📝 {payment.memo}</p>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(payment.paymentId)}
                      className="flex-1 py-2 rounded-lg bg-bg-secondary text-text-secondary hover:text-text-primary text-sm transition-colors"
                    >
                      📋 Copy Payment ID
                    </button>
                    {payment.status === 'active' && new Date(payment.expiresAt) < new Date() && (
                      <button
                        onClick={() => handleCancelPayment(payment)}
                        className="flex-1 py-2 rounded-lg bg-error/10 text-error hover:bg-error/20 text-sm transition-colors"
                      >
                        Cancel & Refund
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* Claim Payment Tab */}
        {activeTab === 'claim' && (
          <motion.div
            key="claim"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 rounded-2xl bg-bg-tertiary border border-border-primary"
          >
            <h2 className="text-xl font-bold text-text-primary mb-6">Claim Payment</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-2">Payment ID</label>
                <input
                  type="text"
                  value={claimPaymentId}
                  onChange={e => setClaimPaymentId(e.target.value)}
                  placeholder="Enter Payment ID from sender..."
                  className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border-primary text-text-primary placeholder-text-muted focus:border-neon-green focus:outline-none transition-colors"
                />
              </div>

              <div className="p-4 rounded-xl bg-neon-green/5 border border-neon-green/20">
                <h4 className="font-medium text-text-primary mb-2">How it works:</h4>
                <ol className="text-sm text-text-secondary space-y-1 list-decimal list-inside">
                  <li>Enter the Payment ID shared by the sender</li>
                  <li>Your identity will be encrypted and verified</li>
                  <li>INCO proves you&apos;re the intended recipient (without revealing identity)</li>
                  <li>Funds are released from escrow to your wallet</li>
                </ol>
              </div>

              <button
                onClick={handleClaimPayment}
                disabled={!claimPaymentId || claiming}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-green text-bg-primary font-bold text-lg hover:shadow-glow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {claiming ? 'Claiming...' : 'Claim Payment'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Modal */}
      {txProgress && (
        <TransactionModal
          isOpen={true}
          title={activeTab === 'create' ? 'Creating Payment' : 'Claiming Payment'}
          steps={txProgress.steps}
          currentStep={txProgress.currentStep}
          onClose={() => setTxProgress(null)}
        />
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccess}
        title="Success!"
        message={successData?.message || ''}
        txSignature={successData?.signature}
        onClose={() => {
          setShowSuccess(false);
          setSuccessData(null);
        }}
      />
    </div>
  );
}
