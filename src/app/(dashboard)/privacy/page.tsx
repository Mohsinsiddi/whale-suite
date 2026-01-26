"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { usePrivacyCash } from "@/hooks";
import { useAuth } from "@/lib/privy/hooks";
import { useWalletBalance } from "@/hooks/useWalletBalance";

type TabType = "deposit" | "withdraw";

export default function PrivacyCashPage() {
  const { walletAddress, authenticated } = useAuth();
  const { balance: walletBalance, loading: balanceLoading } = useWalletBalance(walletAddress);
  const {
    privateBalance,
    loading,
    error,
    result,
    initialized,
    deposit,
    withdraw,
    initialize,
    reset,
    validateWithdrawal,
    calculateReceiveAmount,
    fees,
  } = usePrivacyCash();

  const [initLoading, setInitLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>("deposit");
  const [amount, setAmount] = useState("");
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [progressSteps] = useState([
    "Initializing encryption...",
    "Generating ZK proof...",
    "Awaiting signature...",
    "Submitting to relayer...",
    "Confirming on-chain...",
  ]);

  // Handle transaction result
  useEffect(() => {
    if (result) {
      setShowProgressModal(false);
      if (result.success) {
        setShowSuccessModal(true);
        setAmount("");
      }
    }
  }, [result]);

  const handleAmountChange = (value: string) => {
    // Only allow valid number input
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const getMaxAmount = () => {
    if (activeTab === "deposit") {
      // Leave some SOL for network fees
      return walletBalance > 0.01 ? (walletBalance - 0.01).toFixed(4) : "0";
    }
    // For withdrawal, user can enter their full balance - we deduct fee from what they receive
    const balance = privateBalance?.balance || 0;
    return balance > 0 ? balance.toFixed(4) : "0";
  };

  // Get validation state for current amount
  const getValidationMessage = (): string | null => {
    if (!amount || parseFloat(amount) <= 0) return null;

    if (activeTab === "withdraw") {
      const validation = validateWithdrawal(parseFloat(amount));
      if (!validation.valid) {
        return validation.error || "Validation failed";
      }
    } else {
      // Deposit validation - use lamports to avoid floating point issues
      const LAMPORTS_PER_SOL = 1_000_000_000;
      const amountNum = parseFloat(amount);
      const amountLamports = Math.round(amountNum * LAMPORTS_PER_SOL);
      const reserveForFees = Math.round(0.01 * LAMPORTS_PER_SOL); // 0.01 SOL for network fees
      const walletLamports = Math.round(walletBalance * LAMPORTS_PER_SOL);
      const maxDepositLamports = walletLamports - reserveForFees;

      if (amountNum < fees.MIN_DEPOSIT) {
        return `Minimum deposit is ${fees.MIN_DEPOSIT} SOL`;
      }
      if (amountLamports > maxDepositLamports) {
        return `Insufficient wallet balance. Max: ${(maxDepositLamports / LAMPORTS_PER_SOL).toFixed(4)} SOL`;
      }
    }
    return null;
  };

  const validationMessage = getValidationMessage();

  const handleMax = () => {
    setAmount(getMaxAmount());
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    reset();
    setShowProgressModal(true);
    setProgressStep(0);

    // Progress through steps as SDK processes
    const advanceStep = () => {
      setProgressStep((prev) => Math.min(prev + 1, progressSteps.length - 1));
    };

    try {
      // Initialize if needed (step 0)
      if (!initialized) {
        await initialize();
      }
      advanceStep(); // Step 1: ZK proof generation

      // Start a timer for progress feedback during long ZK proof generation
      const proofTimer = setTimeout(advanceStep, 3000); // Step 2 after 3s
      const sigTimer = setTimeout(advanceStep, 6000); // Step 3 after 6s

      if (activeTab === "deposit") {
        await deposit(parseFloat(amount));
      } else {
        await withdraw(parseFloat(amount));
      }

      clearTimeout(proofTimer);
      clearTimeout(sigTimer);
      setProgressStep(progressSteps.length - 1); // Final step
    } catch (err) {
      console.error("Transaction error:", err);
    }
  };

  // Initialize encryption service when user wants to interact
  const handleInitialize = async () => {
    if (initialized) return;
    setInitLoading(true);
    try {
      await initialize();
    } finally {
      setInitLoading(false);
    }
  };

  const canSubmit =
    authenticated &&
    amount &&
    parseFloat(amount) > 0 &&
    !loading &&
    !validationMessage;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">Privacy Cash</h1>
        <p className="text-sm text-text-secondary">
          Shield your SOL balance from public view
        </p>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="default" padding="md">
          <div className="flex items-center gap-2 mb-2">
            <WalletIcon className="w-4 h-4 text-text-muted" />
            <span className="text-xs text-text-muted">Public Balance</span>
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {balanceLoading ? "..." : `${walletBalance.toFixed(4)} SOL`}
          </div>
          <div className="text-xs text-text-secondary">
            {balanceLoading ? "" : `$${(walletBalance * 150).toFixed(2)}`}
          </div>
        </Card>

        <Card variant="glow" padding="md">
          <div className="flex items-center gap-2 mb-2">
            <ShieldIcon className="w-4 h-4 text-neon-green" />
            <span className="text-xs text-text-muted">Hidden Balance</span>
          </div>
          {initialized ? (
            <>
              <div className="text-2xl font-bold text-neon-green">
                {privateBalance ? `${privateBalance.balance.toFixed(4)} SOL` : "0.0000 SOL"}
              </div>
              <div className="text-xs text-text-secondary">
                {privateBalance ? `$${(privateBalance.balance * 150).toFixed(2)}` : "$0.00"}
              </div>
              {privateBalance && privateBalance.balance > 0 && privateBalance.balance <= fees.WITHDRAWAL_FEE && (
                <div className="text-xs text-warning mt-1">
                  ⚠️ Below withdrawal fee
                </div>
              )}
              {privateBalance && privateBalance.balance > fees.WITHDRAWAL_FEE && (
                <div className="text-xs text-text-muted mt-1">
                  After fee you receive: {calculateReceiveAmount(privateBalance.balance).toFixed(4)} SOL
                </div>
              )}
            </>
          ) : (
            <button
              onClick={handleInitialize}
              disabled={initLoading || !authenticated}
              className="text-sm text-neon-green hover:text-neon-green/80 transition-colors underline"
            >
              {initLoading ? "Signing..." : "Click to reveal (requires signature)"}
            </button>
          )}
        </Card>

        <Card variant="default" padding="md">
          <div className="flex items-center gap-2 mb-2">
            <LockIcon className="w-4 h-4 text-text-muted" />
            <span className="text-xs text-text-muted">Protection Status</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm" dot>
              Active
            </Badge>
          </div>
          <div className="text-xs text-text-secondary mt-1">
            ZK-protected shielded pool
          </div>
        </Card>
      </div>

      {/* Main Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deposit/Withdraw Card */}
        <div className="lg:col-span-2">
          <Card variant="elevated" padding="lg">
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab("deposit")}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "deposit"
                    ? "bg-neon-green/10 text-neon-green border border-neon-green/30"
                    : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <DepositIcon />
                  Deposit
                </div>
              </button>
              <button
                onClick={() => setActiveTab("withdraw")}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "withdraw"
                    ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30"
                    : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <WithdrawIcon />
                  Withdraw
                </div>
              </button>
            </div>

            {/* Description */}
            <div className="mb-6 p-3 rounded-lg bg-bg-tertiary border border-border-secondary">
              <p className="text-xs text-text-secondary">
                {activeTab === "deposit" ? (
                  <>
                    <span className="text-neon-green font-medium">Shield your SOL</span> by
                    depositing into the privacy pool. Your balance will be hidden from
                    public view on the blockchain.
                  </>
                ) : (
                  <>
                    <span className="text-neon-cyan font-medium">Unshield your SOL</span> by
                    withdrawing from the privacy pool. Funds will be returned to your
                    public wallet.
                  </>
                )}
              </p>
            </div>

            {/* Amount Input */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-text-secondary">
                    {activeTab === "withdraw" ? "Amount to Withdraw (SOL)" : "Amount to Deposit (SOL)"}
                  </label>
                  <button
                    onClick={handleMax}
                    className="text-xs text-neon-green hover:text-neon-green/80 transition-colors"
                  >
                    Max: {getMaxAmount()} SOL
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 text-lg bg-bg-secondary border border-border-secondary rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-green transition-colors"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="text-sm text-text-muted">SOL</span>
                  </div>
                </div>
              </div>

              {/* Fee Breakdown */}
              <div className="space-y-2 p-3 rounded-lg bg-bg-tertiary border border-border-secondary">
                {activeTab === "withdraw" ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">You Withdraw</span>
                      <span className="text-sm font-medium text-text-primary">
                        {amount && parseFloat(amount) > 0 ? parseFloat(amount).toFixed(4) : "0.0000"} SOL
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">Relay Fee</span>
                      <span className="text-xs text-error">
                        -{fees.WITHDRAWAL_FEE.toFixed(4)} SOL
                      </span>
                    </div>
                    <div className="border-t border-border-secondary pt-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-text-primary">You Receive</span>
                        <span className="text-sm font-bold text-neon-green">
                          {amount && parseFloat(amount) > 0
                            ? calculateReceiveAmount(parseFloat(amount)).toFixed(4)
                            : "0.0000"} SOL
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">Deposit Amount</span>
                      <span className="text-sm font-medium text-neon-green">
                        {amount && parseFloat(amount) > 0 ? parseFloat(amount).toFixed(4) : "0.0000"} SOL
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">Protocol Fee</span>
                      <span className="text-xs text-neon-green">Free</span>
                    </div>
                  </>
                )}
              </div>

              {/* Validation Warning */}
              {validationMessage && (
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                  <p className="text-xs text-warning">{validationMessage}</p>
                </div>
              )}

              {/* Error Display */}
              {error && !validationMessage && (
                <div className="p-3 rounded-lg bg-error/10 border border-error/30">
                  <p className="text-xs text-error">{error}</p>
                </div>
              )}

              {/* Dust Warning - Balance too low to withdraw */}
              {activeTab === "withdraw" && initialized && (privateBalance?.balance || 0) > 0 && (privateBalance?.balance || 0) <= fees.WITHDRAWAL_FEE && (
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                  <p className="text-xs text-warning">
                    <strong>Balance too low to withdraw.</strong> You have {privateBalance?.balance.toFixed(4)} SOL but the withdrawal fee is {fees.WITHDRAWAL_FEE} SOL.
                    Deposit at least {(fees.WITHDRAWAL_FEE + 0.001).toFixed(3)} SOL more to withdraw.
                  </p>
                </div>
              )}

              {/* Min Balance Warning for Withdraw */}
              {activeTab === "withdraw" && initialized && (privateBalance?.balance || 0) > fees.WITHDRAWAL_FEE && (privateBalance?.balance || 0) < fees.RECOMMENDED_MIN_BALANCE && (
                <div className="p-3 rounded-lg bg-info/10 border border-info/30">
                  <p className="text-xs text-info">
                    Tip: You can withdraw your full balance of {(privateBalance?.balance || 0).toFixed(4)} SOL and receive {calculateReceiveAmount(privateBalance?.balance || 0).toFixed(4)} SOL after relay fee.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                fullWidth
                size="lg"
                onClick={handleSubmit}
                disabled={!canSubmit}
                loading={loading}
              >
                {activeTab === "deposit" ? "Shield SOL" : "Unshield SOL"}
              </Button>
            </div>
          </Card>
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
          <Card variant="default" padding="md">
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              How It Works
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-neon-green/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-neon-green">1</span>
                </div>
                <p className="text-xs text-text-secondary">
                  Deposit SOL into the shielded pool
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-neon-green/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-neon-green">2</span>
                </div>
                <p className="text-xs text-text-secondary">
                  Your balance is hidden using ZK proofs
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-neon-green/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-neon-green">3</span>
                </div>
                <p className="text-xs text-text-secondary">
                  Withdraw anytime without revealing history
                </p>
              </div>
            </div>
          </Card>

          <Card variant="default" padding="md">
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              Privacy Benefits
            </h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-xs text-text-secondary">
                <CheckIcon className="w-3 h-3 text-neon-green" />
                Balance hidden from explorers
              </li>
              <li className="flex items-center gap-2 text-xs text-text-secondary">
                <CheckIcon className="w-3 h-3 text-neon-green" />
                Transaction history obscured
              </li>
              <li className="flex items-center gap-2 text-xs text-text-secondary">
                <CheckIcon className="w-3 h-3 text-neon-green" />
                No front-running possible
              </li>
              <li className="flex items-center gap-2 text-xs text-text-secondary">
                <CheckIcon className="w-3 h-3 text-neon-green" />
                Whale activity concealed
              </li>
            </ul>
          </Card>

          <Card variant="default" padding="md">
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              Fee Structure
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Deposit Fee</span>
                <span className="text-neon-green">Free</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Withdrawal Fee</span>
                <span className="text-text-secondary">~{fees.WITHDRAWAL_FEE} SOL (relay)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Min Deposit</span>
                <span className="text-text-secondary">{fees.MIN_DEPOSIT} SOL</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Recommended Min</span>
                <span className="text-neon-green">{fees.RECOMMENDED_MIN_BALANCE} SOL</span>
              </div>
            </div>
          </Card>

          <Card variant="default" padding="md">
            <div className="flex items-center gap-2 mb-2">
              <InfoIcon className="w-4 h-4 text-warning" />
              <h3 className="text-sm font-semibold text-text-primary">Note</h3>
            </div>
            <p className="text-xs text-text-secondary">
              Privacy operations may take longer than standard transactions due to
              ZK proof generation. Please be patient during processing.
            </p>
          </Card>
        </div>
      </div>

      {/* Progress Modal */}
      <Modal
        isOpen={showProgressModal}
        onClose={() => {}}
        title={activeTab === "deposit" ? "Shielding SOL" : "Unshielding SOL"}
        description="Please wait while we process your transaction"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex justify-center py-4">
            <div className="w-16 h-16 rounded-full border-4 border-bg-tertiary border-t-neon-green animate-spin" />
          </div>
          <div className="space-y-2">
            {progressSteps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 text-sm ${
                  index <= progressStep ? "text-neon-green" : "text-text-muted"
                }`}
              >
                {index < progressStep ? (
                  <CheckIcon className="w-4 h-4" />
                ) : index === progressStep ? (
                  <div className="w-4 h-4 rounded-full border-2 border-neon-green border-t-transparent animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-text-muted" />
                )}
                {step}
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Transaction Successful!"
        description={`Your SOL has been ${activeTab === "deposit" ? "shielded" : "unshielded"}`}
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex justify-center py-4">
            <div className="w-16 h-16 rounded-full bg-neon-green/10 flex items-center justify-center">
              <CheckIcon className="w-8 h-8 text-neon-green" />
            </div>
          </div>
          <div className="space-y-2 text-center">
            <p className="text-lg font-semibold text-text-primary">
              {result?.amount} SOL
            </p>
            {result?.signature && (
              <a
                href={`https://solscan.io/tx/${result.signature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-neon-green hover:underline"
              >
                View on Solscan
              </a>
            )}
          </div>
          <Button fullWidth onClick={() => setShowSuccessModal(false)}>
            Done
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// Icons
const WalletIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
    />
  </svg>
);

const ShieldIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
    />
  </svg>
);

const LockIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
    />
  </svg>
);

const DepositIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"
    />
  </svg>
);

const WithdrawIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
    />
  </svg>
);

const CheckIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

const InfoIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
    />
  </svg>
);
