"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { TransactionModal, SuccessModal } from "@/components/ui/Modal";
import { usePrivacyCash, usePoints } from "@/hooks";
import { useWalletBalances } from "@/hooks/useHelius";
import { useAuth } from "@/lib/privy/hooks";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useNetwork } from "@/hooks/useNetwork";
import { PointsEarned } from "@/components/leaderboard";
import LearnMoreLink from "@/components/ui/LearnMoreLink";
import { WalletMismatchBanner } from "@/components/ui/WalletMismatchBanner";
import {
  PRIVACY_CASH_TOKENS,
  type PrivacyCashTokenSymbol,
} from "@/lib/privacy-sdks/privacy-cash";

type TabType = "deposit" | "withdraw";

export default function PrivacyCashPage() {
  const { walletAddress, authenticated } = useAuth();
  const { balance: walletBalance, loading: balanceLoading } = useWalletBalance(walletAddress);
  const { balances: walletBalances, loading: tokenBalancesLoading } = useWalletBalances(walletAddress);
  const {
    privateBalance,
    privateBalances,
    selectedToken,
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
    setSelectedToken,
    fetchPrivateBalance,
    getSelectedTokenFees,
  } = usePrivacyCash();
  const { awardPoints } = usePoints();
  const { network } = useNetwork();

  // Get current token info
  const currentToken = useMemo(() =>
    PRIVACY_CASH_TOKENS.find(t => t.symbol === selectedToken) || PRIVACY_CASH_TOKENS[0],
    [selectedToken]
  );
  const tokenFees = useMemo(() => getSelectedTokenFees(), [getSelectedTokenFees]);

  // Get wallet balance for selected token
  const getTokenWalletBalance = useCallback((tokenSymbol: PrivacyCashTokenSymbol): number => {
    if (tokenSymbol === 'SOL') {
      return walletBalance;
    }
    // Find token in wallet balances
    const tokenConfig = PRIVACY_CASH_TOKENS.find(t => t.symbol === tokenSymbol);
    if (!tokenConfig || !walletBalances?.tokens) return 0;

    const token = walletBalances.tokens.find(
      t => t.mint.toLowerCase() === tokenConfig.mint.toLowerCase()
    );
    return token?.uiAmount || 0;
  }, [walletBalance, walletBalances]);

  // Current token wallet balance
  const currentTokenWalletBalance = useMemo(() => {
    return getTokenWalletBalance(selectedToken);
  }, [selectedToken, getTokenWalletBalance]);

  // Token balance loading state
  const [lastFetchedToken, setLastFetchedToken] = useState<PrivacyCashTokenSymbol>('SOL');
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);

  // Handle token change
  const handleTokenChange = useCallback(async (token: PrivacyCashTokenSymbol) => {
    if (token === selectedToken) return;
    setSelectedToken(token);
    setAmount(""); // Reset amount when changing tokens

    // Fetch balance for new token if initialized
    if (initialized) {
      setIsBalanceLoading(true);
      await fetchPrivateBalance(token);
      setLastFetchedToken(token);
      setIsBalanceLoading(false);
    }
  }, [selectedToken, setSelectedToken, initialized, fetchPrivateBalance]);

  // Update lastFetchedToken when initialized
  useEffect(() => {
    if (initialized && selectedToken !== lastFetchedToken) {
      setLastFetchedToken(selectedToken);
    }
  }, [initialized, selectedToken, lastFetchedToken]);

  const [initLoading, setInitLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>("deposit");
  const [amount, setAmount] = useState("");
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [progressStep, setProgressStep] = useState(0);

  // Track the operation type when transaction starts (not affected by tab switches)
  const [pendingOperationType, setPendingOperationType] = useState<TabType | null>(null);

  // Track last operation for success modal
  const [lastOperation, setLastOperation] = useState<{
    type: 'deposit' | 'withdraw';
    amount: string;
    signature: string;
  } | null>(null);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);

  const getStepStatus = (stepIndex: number): "pending" | "active" | "completed" => {
    if (progressStep > stepIndex) return "completed";
    if (progressStep === stepIndex) return "active";
    return "pending";
  };

  const progressSteps = [
    {
      label: "Initializing Encryption",
      status: getStepStatus(0),
      description: "Setting up secure cryptographic environment..."
    },
    {
      label: "Generating ZK Proof",
      status: getStepStatus(1),
      description: "Creating zero-knowledge proof for privacy. This may take 30-60 seconds..."
    },
    {
      label: "Awaiting Signature",
      status: getStepStatus(2),
      description: "Please approve the transaction in your wallet..."
    },
    {
      label: "Submitting to Relayer",
      status: getStepStatus(3),
      description: "Sending encrypted transaction to privacy relayer..."
    },
    {
      label: "Confirming on Chain",
      status: getStepStatus(4),
      description: "Waiting for blockchain confirmation..."
    },
  ];

  // Handle transaction result
  useEffect(() => {
    if (result && pendingOperationType) {
      setShowProgressModal(false);
      if (result.success) {
        setLastOperation({
          type: pendingOperationType,
          amount: result.amount?.toString() || amount,
          signature: result.signature || '',
        });

        // Award points for privacy operation
        const operationAmount = result.amount || parseFloat(amount) || 0;
        const action = pendingOperationType === 'deposit' ? 'privacy_deposit' : 'privacy_withdraw';
        awardPoints(action, {
          txSignature: result.signature,
          amount: operationAmount,
          network,
        }).then((pointsResult) => {
          if (pointsResult) {
            setPointsEarned(pointsResult.totalAwarded);
          }
        }).catch((err) => {
          console.error('Failed to award points:', err);
        });

        setShowSuccessModal(true);
        setAmount("");
      }
      setPendingOperationType(null);
    }
  }, [result, pendingOperationType, amount, awardPoints, network]);

  const handleAmountChange = (value: string) => {
    // Only allow valid number input
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  // Reserve for Solana transaction fees (only for SOL deposits)
  const FEE_RESERVE = selectedToken === 'SOL' ? 0.05 : 0;

  const getMaxAmount = () => {
    if (activeTab === "deposit") {
      // Leave SOL for network fees (0.05 SOL for multiple transactions)
      const maxDeposit = currentTokenWalletBalance - FEE_RESERVE;
      return maxDeposit > 0 ? maxDeposit.toFixed(currentToken.decimals > 6 ? 6 : 4) : "0";
    }
    // For withdrawal, user can enter their full balance - we deduct fee from what they receive
    const balance = privateBalances[selectedToken]?.balance || privateBalance?.balance || 0;
    return balance > 0 ? balance.toFixed(currentToken.decimals > 6 ? 6 : 4) : "0";
  };

  // Get validation state for current amount
  const getValidationMessage = (): string | null => {
    if (!amount || parseFloat(amount) <= 0) return null;

    if (activeTab === "withdraw") {
      const validation = validateWithdrawal(parseFloat(amount), selectedToken);
      if (!validation.valid) {
        return validation.error || "Validation failed";
      }
    } else {
      // Deposit validation - compare as formatted strings to avoid floating point issues
      const amountNum = parseFloat(amount);
      const maxDeposit = currentTokenWalletBalance - FEE_RESERVE;

      if (amountNum < tokenFees.MIN_DEPOSIT) {
        return `Minimum deposit is ${tokenFees.MIN_DEPOSIT} ${selectedToken}`;
      }
      // Compare formatted values to avoid floating point precision issues
      const decimals = currentToken.decimals > 6 ? 6 : 4;
      const amountFormatted = amountNum.toFixed(decimals);
      const maxFormatted = maxDeposit.toFixed(decimals);
      if (parseFloat(amountFormatted) > parseFloat(maxFormatted)) {
        return `Insufficient wallet balance. Max: ${maxFormatted} ${selectedToken}`;
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
    setPendingOperationType(activeTab); // Capture operation type before it can change
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
        await deposit(parseFloat(amount), selectedToken);
      } else {
        await withdraw(parseFloat(amount), undefined, selectedToken);
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
      <WalletMismatchBanner />

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Privacy Cash</h1>
          <p className="text-sm text-text-secondary">
            Shield your SOL balance from public view
          </p>
        </div>
        <LearnMoreLink section="privacy">How it works</LearnMoreLink>
      </div>

      {/* Token Selector */}
      <div className="p-4 rounded-xl bg-bg-tertiary border border-border-secondary">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-text-primary">Select Asset</span>
          <span className="text-xs text-text-muted">{PRIVACY_CASH_TOKENS.length} supported</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRIVACY_CASH_TOKENS.map((token) => (
            <button
              key={token.symbol}
              onClick={() => handleTokenChange(token.symbol as PrivacyCashTokenSymbol)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                selectedToken === token.symbol
                  ? 'bg-neon-green/20 border-neon-green text-neon-green'
                  : 'bg-bg-elevated/50 border-border-secondary text-text-secondary hover:border-neon-green/50 hover:text-text-primary'
              }`}
            >
              {token.logoURI ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={token.logoURI} alt={token.symbol} className="w-5 h-5 rounded-full" />
              ) : (
                <span className="text-base">{token.icon}</span>
              )}
              {token.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="default" padding="md">
          <div className="flex items-center gap-2 mb-2">
            <WalletIcon className="w-4 h-4 text-text-muted" />
            <span className="text-xs text-text-muted">Public {selectedToken} Balance</span>
          </div>
          <div className="flex items-center gap-2">
            {currentToken.logoURI ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentToken.logoURI} alt={selectedToken} className="w-6 h-6 rounded-full" />
            ) : (
              <span className="text-xl">{currentToken.icon}</span>
            )}
            <div className="text-2xl font-bold text-text-primary">
              {balanceLoading || tokenBalancesLoading ? "..." : `${currentTokenWalletBalance.toFixed(currentToken.decimals > 6 ? 6 : 4)}`}
            </div>
          </div>
          <div className="text-xs text-text-secondary mt-1">
            {currentToken.name}
          </div>
        </Card>

        <Card variant="glow" padding="md">
          <div className="flex items-center gap-2 mb-2">
            <ShieldIcon className="w-4 h-4 text-neon-green" />
            <span className="text-xs text-text-muted">Hidden {selectedToken} Balance</span>
          </div>
          {initialized ? (
            <>
              <div className="flex items-center gap-2">
                {currentToken.logoURI ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentToken.logoURI} alt={selectedToken} className="w-6 h-6 rounded-full" />
                ) : (
                  <span className="text-xl">{currentToken.icon}</span>
                )}
                <div className="text-2xl font-bold text-neon-green">
                  {isBalanceLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
                      <span className="text-text-muted text-base">Loading...</span>
                    </span>
                  ) : (
                    (privateBalances[selectedToken]?.balance || privateBalance?.balance || 0).toFixed(currentToken.decimals > 6 ? 6 : 4)
                  )}
                </div>
              </div>
              <div className="text-xs text-text-secondary mt-1">
                Shielded in privacy pool
              </div>
              {(() => {
                const balance = privateBalances[selectedToken]?.balance || privateBalance?.balance || 0;
                if (balance > 0 && balance <= tokenFees.WITHDRAWAL_FEE) {
                  return (
                    <div className="text-xs text-warning mt-1">
                      ⚠️ Below withdrawal fee ({tokenFees.WITHDRAWAL_FEE} {selectedToken})
                    </div>
                  );
                }
                if (balance > tokenFees.WITHDRAWAL_FEE) {
                  return (
                    <div className="text-xs text-text-muted mt-1">
                      After fee: {calculateReceiveAmount(balance, selectedToken).toFixed(currentToken.decimals > 6 ? 6 : 4)} {selectedToken}
                    </div>
                  );
                }
                return null;
              })()}
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

            {/* Selected Token Display */}
            <div className="mb-4 p-3 rounded-xl bg-bg-tertiary border border-neon-green/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {currentToken.logoURI ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentToken.logoURI} alt={selectedToken} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center text-bg-primary font-bold text-lg">
                      {currentToken.icon}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-text-primary">{currentToken.name}</div>
                    <div className="text-xs text-text-muted">{selectedToken}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-neon-green">
                    {activeTab === "deposit"
                      ? `${currentTokenWalletBalance.toFixed(currentToken.decimals > 6 ? 6 : 4)} available`
                      : `${(privateBalances[selectedToken]?.balance || 0).toFixed(currentToken.decimals > 6 ? 6 : 4)} shielded`
                    }
                  </div>
                  <div className="text-xs text-text-muted">
                    {activeTab === "deposit" ? "in wallet" : "in pool"}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6 p-3 rounded-lg bg-bg-tertiary border border-border-secondary">
              <p className="text-xs text-text-secondary">
                {activeTab === "deposit" ? (
                  <>
                    <span className="text-neon-green font-medium">Shield your {selectedToken}</span> by
                    depositing into the privacy pool. Your balance will be hidden from
                    public view on the blockchain.
                  </>
                ) : (
                  <>
                    <span className="text-neon-cyan font-medium">Unshield your {selectedToken}</span> by
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
                    {activeTab === "withdraw" ? `Amount to Withdraw (${selectedToken})` : `Amount to Deposit (${selectedToken})`}
                  </label>
                  <button
                    onClick={handleMax}
                    className="text-xs text-neon-green hover:text-neon-green/80 transition-colors"
                  >
                    Max: {getMaxAmount()} {selectedToken}
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
                    {currentToken.logoURI && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={currentToken.logoURI} alt={selectedToken} className="w-5 h-5 rounded-full" />
                    )}
                    <span className="text-sm text-text-muted">{selectedToken}</span>
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
                        {amount && parseFloat(amount) > 0 ? parseFloat(amount).toFixed(currentToken.decimals > 6 ? 6 : 4) : "0.0000"} {selectedToken}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">Relay Fee</span>
                      <span className="text-xs text-error">
                        -{tokenFees.WITHDRAWAL_FEE} {selectedToken}
                      </span>
                    </div>
                    <div className="border-t border-border-secondary pt-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-text-primary">You Receive</span>
                        <span className="text-sm font-bold text-neon-green">
                          {amount && parseFloat(amount) > 0
                            ? calculateReceiveAmount(parseFloat(amount), selectedToken).toFixed(currentToken.decimals > 6 ? 6 : 4)
                            : "0.0000"} {selectedToken}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">Deposit Amount</span>
                      <span className="text-sm font-medium text-neon-green">
                        {amount && parseFloat(amount) > 0 ? parseFloat(amount).toFixed(currentToken.decimals > 6 ? 6 : 4) : "0.0000"} {selectedToken}
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
              {(() => {
                const balance = privateBalances[selectedToken]?.balance || privateBalance?.balance || 0;
                if (activeTab === "withdraw" && initialized && balance > 0 && balance <= tokenFees.WITHDRAWAL_FEE) {
                  return (
                    <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                      <p className="text-xs text-warning">
                        <strong>Balance too low to withdraw.</strong> You have {balance.toFixed(currentToken.decimals > 6 ? 6 : 4)} {selectedToken} but the withdrawal fee is {tokenFees.WITHDRAWAL_FEE} {selectedToken}.
                        Deposit more to withdraw.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Min Balance Warning for Withdraw */}
              {(() => {
                const balance = privateBalances[selectedToken]?.balance || privateBalance?.balance || 0;
                if (activeTab === "withdraw" && initialized && balance > tokenFees.WITHDRAWAL_FEE && balance < tokenFees.RECOMMENDED_MIN_BALANCE) {
                  return (
                    <div className="p-3 rounded-lg bg-info/10 border border-info/30">
                      <p className="text-xs text-info">
                        Tip: You can withdraw your full balance of {balance.toFixed(currentToken.decimals > 6 ? 6 : 4)} {selectedToken} and receive {calculateReceiveAmount(balance, selectedToken).toFixed(currentToken.decimals > 6 ? 6 : 4)} {selectedToken} after relay fee.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Submit Button */}
              <Button
                fullWidth
                size="lg"
                onClick={handleSubmit}
                disabled={!canSubmit}
                loading={loading}
              >
                {activeTab === "deposit" ? `Shield ${selectedToken}` : `Unshield ${selectedToken}`}
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
              Fee Structure ({selectedToken})
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Deposit Fee</span>
                <span className="text-neon-green">Free</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Withdrawal Fee</span>
                <span className="text-text-secondary">~{tokenFees.WITHDRAWAL_FEE} {selectedToken}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Min Deposit</span>
                <span className="text-text-secondary">{tokenFees.MIN_DEPOSIT} {selectedToken}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Recommended Min</span>
                <span className="text-neon-green">{tokenFees.RECOMMENDED_MIN_BALANCE} {selectedToken}</span>
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
      <TransactionModal
        isOpen={showProgressModal}
        onClose={() => {}}
        title={activeTab === "deposit" ? `Shielding ${selectedToken}...` : `Unshielding ${selectedToken}...`}
        steps={progressSteps}
        currentStep={progressStep}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setLastOperation(null);
          setPointsEarned(null);
        }}
        title={lastOperation?.type === "deposit" ? `${selectedToken} Shielded!` : `${selectedToken} Unshielded!`}
        message={
          lastOperation?.type === "deposit"
            ? `Successfully shielded ${lastOperation?.amount || ''} ${selectedToken} into privacy pool`
            : `Successfully unshielded ${lastOperation?.amount || ''} ${selectedToken} to your wallet`
        }
        txSignature={lastOperation?.signature || result?.signature || ""}
        actions={pointsEarned ? <PointsEarned points={pointsEarned} action="Privacy" /> : undefined}
      />
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
