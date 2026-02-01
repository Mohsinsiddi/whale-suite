"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input, { AmountInput } from "@/components/ui/Input";
import Tabs, { TabPanel } from "@/components/ui/Tabs";
import { TransactionModal, SuccessModal } from "@/components/ui/Modal";
import { useTransfer, useWalletBalance, useShadowWire, usePoints } from "@/hooks";
import { useWalletBalances } from "@/hooks/useHelius";
import { useMultiSend, type MultiSendRecipient, type TokenType } from "@/hooks/useMultiSend";
import { useAuth } from "@/lib/privy/hooks";
import { useNetwork } from "@/hooks/useNetwork";
import { TransferType } from "@/lib/privacy-sdks";
import { PointsEarned } from "@/components/leaderboard";
import LearnMoreLink from "@/components/ui/LearnMoreLink";
import {
  SHADOWWIRE_POOL_TOKENS,
  TOKEN_MINTS,
  getTokenDecimals,
  type ShadowWireTokenSymbol,
} from "@/lib/tokens";

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

export default function TransferPage() {
  const { walletAddress } = useAuth();
  const { balance, loading: balanceLoading } = useWalletBalance(walletAddress);
  const { balances: walletBalances, loading: tokenBalancesLoading } = useWalletBalances(walletAddress);
  const {
    executeTransfer,
    estimateTransfer,
    validateAddress,
    loading: transferLoading,
    result: transferResult,
    error: transferError,
    reset: resetTransfer,
  } = useTransfer();

  // ShadowWire hook for private transfers
  const {
    internalTransfer,
    externalTransfer,
    deposit: shadowWireDeposit,
    withdraw: shadowWireWithdraw,
    shieldedBalance,
    fetchShieldedBalance,
    loading: shadowWireLoading,
    result: shadowWireResult,
    error: shadowWireError,
    calculateFee: shadowWireCalculateFee,
    getMinimumAmount: shadowWireMinAmount,
    initialize: initShadowWire,
    initialized: shadowWireInitialized,
    wasmSupported,
    reset: resetShadowWire,
  } = useShadowWire();
  const { awardPoints } = usePoints();
  const { network } = useNetwork();

  // Multi-send hook
  const {
    loading: multiSendLoading,
    progress: multiSendProgress,
    result: multiSendResult,
    error: multiSendError,
    executeMultiSend,
    validateRecipients,
    calculateUsdValue,
    reset: resetMultiSend,
    getPrice,
  } = useMultiSend();

  const [activeTab, setActiveTab] = useState("private");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [showTxModal, setShowTxModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [privateTransferType, setPrivateTransferType] = useState<"internal" | "external">("internal");
  const [depositAmount, setDepositAmount] = useState("");
  const [showDepositSection, setShowDepositSection] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showWithdrawSection, setShowWithdrawSection] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [poolToken, setPoolToken] = useState<ShadowWireTokenSymbol>('SOL'); // Selected token for deposit/withdraw
  const [lastFetchedToken, setLastFetchedToken] = useState<ShadowWireTokenSymbol>('SOL'); // Track which token's balance is loaded
  const [isBalanceLoading, setIsBalanceLoading] = useState(false); // Loading state for balance fetch

  // Minimum transfer amount for the selected token (used in private transfers)
  const MIN_TRANSFER_AMOUNT = useMemo(() => shadowWireMinAmount(poolToken), [poolToken, shadowWireMinAmount]);

  // Multi-send state
  const [multiSendRecipients, setMultiSendRecipients] = useState<MultiSendRecipient[]>([
    { id: generateId(), address: '', amount: '', usdValue: 0, status: 'pending' },
  ]);
  const [multiSendToken, setMultiSendToken] = useState<TokenType>('SOL');
  const [multiSendType, setMultiSendType] = useState<'internal' | 'external'>('internal');
  const [isMultiSendExecuting, setIsMultiSendExecuting] = useState(false);
  const [showMultiSendSuccess, setShowMultiSendSuccess] = useState(false);

  // Track last operation for success modal
  const [lastOperation, setLastOperation] = useState<{
    type: 'deposit' | 'withdraw' | 'transfer';
    amount: string;
    signature: string;
    token: string;
  } | null>(null);

  // Track current operation type for modal
  const [currentOperation, setCurrentOperation] = useState<'deposit' | 'withdraw' | 'transfer'>('transfer');
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);

  // Get wallet balance for selected pool token
  const getTokenWalletBalance = useCallback((tokenSymbol: ShadowWireTokenSymbol): number => {
    if (tokenSymbol === 'SOL') {
      return balance;
    }
    // Find token in wallet balances
    const tokenMint = TOKEN_MINTS[tokenSymbol as keyof typeof TOKEN_MINTS];
    if (!tokenMint || !walletBalances?.tokens) return 0;

    const token = walletBalances.tokens.find(
      t => t.mint.toLowerCase() === tokenMint.toLowerCase()
    );
    return token?.uiAmount || 0;
  }, [balance, walletBalances]);

  // Current pool token wallet balance
  const poolTokenWalletBalance = useMemo(() => {
    return getTokenWalletBalance(poolToken);
  }, [poolToken, getTokenWalletBalance]);

  // Fetch shielded balance when wallet/tab/token changes
  useEffect(() => {
    if (walletAddress && (activeTab === "private" || activeTab === "multi")) {
      // Set loading state when token changes
      if (poolToken !== lastFetchedToken) {
        setIsBalanceLoading(true);
      }
      // Fetch balance for the selected pool token
      fetchShieldedBalance(poolToken).then(() => {
        setLastFetchedToken(poolToken);
        setIsBalanceLoading(false);
      });
    }
  }, [walletAddress, activeTab, poolToken, fetchShieldedBalance, lastFetchedToken]);

  // Keep multiSendToken in sync with poolToken (Multi-Send uses the pool's selected token)
  useEffect(() => {
    if (activeTab === 'multi' && multiSendToken !== poolToken) {
      setMultiSendToken(poolToken as TokenType);
      // Recalculate USD values for recipients when token changes
      setMultiSendRecipients(prev =>
        prev.map(r => ({
          ...r,
          usdValue: calculateUsdValue(r.amount, poolToken as TokenType),
        }))
      );
    }
  }, [activeTab, poolToken, multiSendToken, calculateUsdValue]);

  // Shielded balance for selected token (convert from smallest units)
  // Only show balance when it matches the currently selected token to avoid race conditions
  const shieldedPoolBalance = useMemo(() => {
    // Don't show stale balance from a different token
    if (poolToken !== lastFetchedToken || isBalanceLoading) return 0;
    if (!shieldedBalance?.available) return 0;
    const decimals = getTokenDecimals(poolToken);
    return shieldedBalance.available / Math.pow(10, decimals);
  }, [shieldedBalance, poolToken, lastFetchedToken, isBalanceLoading]);

  // Combined loading state
  const isLoading = transferLoading || shadowWireLoading;

  // Combined error state
  const combinedError = activeTab === "private" ? shadowWireError : transferError;

  // Combined result
  const combinedResult = activeTab === "private" ? shadowWireResult : transferResult;

  const tabs = [
    { id: "private", label: "Single Send", icon: <GhostIcon /> },
    { id: "multi", label: "Multi-Send", icon: <MultiSendIcon /> },
    { id: "standard", label: "Standard", icon: <TransferIcon /> },
  ];

  // Multi-send validation - pass actual shieldedPoolBalance for accurate validation
  const multiSendValidation = useMemo(() => {
    return validateRecipients(multiSendRecipients, multiSendToken, shieldedPoolBalance);
  }, [multiSendRecipients, multiSendToken, shieldedPoolBalance, validateRecipients]);

  // Token price for multi-send
  const multiSendTokenPrice = useMemo(() => getPrice(multiSendToken), [multiSendToken, getPrice]);

  // Add multi-send recipient
  const addMultiSendRecipient = useCallback(() => {
    if (multiSendRecipients.length >= 10) return;
    setMultiSendRecipients(prev => [
      ...prev,
      { id: generateId(), address: '', amount: '', usdValue: 0, status: 'pending' },
    ]);
  }, [multiSendRecipients.length]);

  // Remove multi-send recipient
  const removeMultiSendRecipient = useCallback((id: string) => {
    if (multiSendRecipients.length <= 1) return;
    setMultiSendRecipients(prev => prev.filter(r => r.id !== id));
  }, [multiSendRecipients.length]);

  // Update multi-send recipient
  const updateMultiSendRecipient = useCallback((id: string, field: 'address' | 'amount', value: string) => {
    setMultiSendRecipients(prev =>
      prev.map(r => {
        if (r.id !== id) return r;
        if (field === 'amount') {
          return {
            ...r,
            amount: value,
            usdValue: calculateUsdValue(value, multiSendToken),
          };
        }
        return { ...r, [field]: value };
      })
    );
  }, [multiSendToken, calculateUsdValue]);

  // Execute multi-send
  const handleMultiSendExecute = async () => {
    if (!walletAddress || !multiSendValidation.valid) return;

    setIsMultiSendExecuting(true);

    const result = await executeMultiSend(
      walletAddress,
      multiSendRecipients,
      multiSendToken,
      multiSendType
    );

    setIsMultiSendExecuting(false);
    setShowMultiSendSuccess(true);

    // Refresh the transfer page's pool balance after multi-send
    // (useMultiSend has its own isolated state, so we need to refresh here too)
    if (result && result.completedCount > 0) {
      setTimeout(() => fetchShieldedBalance(poolToken), 2000);
    }
  };

  // Reset multi-send
  const handleMultiSendReset = () => {
    setMultiSendRecipients([{ id: generateId(), address: '', amount: '', usdValue: 0, status: 'pending' }]);
    setShowMultiSendSuccess(false);
    resetMultiSend();
  };

  // Handle pool token change from the pool card - sync both pool token and multi-send token
  const handlePoolTokenChange = useCallback((token: ShadowWireTokenSymbol) => {
    setPoolToken(token);
    // If on multi-send tab, also sync multi-send token
    if (activeTab === 'multi') {
      setMultiSendToken(token as TokenType);
      // Recalculate USD values for multi-send recipients
      setMultiSendRecipients(prev =>
        prev.map(r => ({
          ...r,
          usdValue: calculateUsdValue(r.amount, token as TokenType),
        }))
      );
    }
  }, [activeTab, calculateUsdValue]);

  // Validate recipient on change
  useEffect(() => {
    if (recipient && !validateAddress(recipient)) {
      setRecipientError("Invalid Solana address");
    } else {
      setRecipientError(null);
    }
  }, [recipient, validateAddress]);

  // Estimate fee when amount/type changes
  useEffect(() => {
    if (amount && recipient && validateAddress(recipient)) {
      const type: TransferType = activeTab === "private" ? "private" : "standard";
      estimateTransfer(recipient, parseFloat(amount), type);
    }
  }, [amount, recipient, activeTab, estimateTransfer, validateAddress]);

  // Validate deposit amount (use SDK minimums)
  useEffect(() => {
    const depositValue = parseFloat(depositAmount);
    const minDeposit = shadowWireMinAmount(poolToken); // Use SDK's actual minimum
    if (!depositAmount || depositAmount === "") {
      setDepositError(null);
    } else if (isNaN(depositValue) || depositValue <= 0) {
      setDepositError("Please enter a valid amount");
    } else if (depositValue < minDeposit) {
      setDepositError(`Minimum deposit is ${minDeposit.toLocaleString()} ${poolToken} (anti-spam)`);
    } else if (depositValue > poolTokenWalletBalance) {
      setDepositError(`Insufficient ${poolToken} balance`);
    } else {
      setDepositError(null);
    }
  }, [depositAmount, poolToken, poolTokenWalletBalance, shadowWireMinAmount]);

  // Validate transfer amount for private transfers
  useEffect(() => {
    const amountValue = parseFloat(amount);
    if (!amount || amount === "" || activeTab !== "private") {
      setAmountError(null);
    } else if (isNaN(amountValue) || amountValue <= 0) {
      setAmountError("Please enter a valid amount");
    } else if (amountValue < MIN_TRANSFER_AMOUNT) {
      setAmountError(`Minimum transfer is ${MIN_TRANSFER_AMOUNT.toLocaleString()} ${poolToken}`);
    } else if (amountValue > shieldedPoolBalance) {
      setAmountError(`Insufficient shielded balance. You have ${shieldedPoolBalance.toFixed(4)} ${poolToken} in pool.`);
    } else {
      setAmountError(null);
    }
  }, [amount, activeTab, shieldedPoolBalance, MIN_TRANSFER_AMOUNT, poolToken]);

  // Validate withdraw amount (use SDK minimums)
  useEffect(() => {
    const withdrawValue = parseFloat(withdrawAmount);
    const minWithdraw = shadowWireMinAmount(poolToken); // Use SDK's actual minimum
    if (!withdrawAmount || withdrawAmount === "") {
      setWithdrawError(null);
    } else if (isNaN(withdrawValue) || withdrawValue <= 0) {
      setWithdrawError("Please enter a valid amount");
    } else if (withdrawValue < minWithdraw) {
      setWithdrawError(`Minimum withdraw is ${minWithdraw.toLocaleString()} ${poolToken}`);
    } else if (withdrawValue > shieldedPoolBalance) {
      setWithdrawError(`Insufficient shielded balance. You have ${shieldedPoolBalance.toFixed(4)} ${poolToken}`);
    } else {
      setWithdrawError(null);
    }
  }, [withdrawAmount, shieldedPoolBalance, poolToken, shadowWireMinAmount]);

  const getStepStatus = (stepIndex: number): "pending" | "active" | "completed" => {
    if (currentStep > stepIndex) return "completed";
    if (currentStep === stepIndex) return "active";
    return "pending";
  };

  const txSteps = activeTab === "private"
    ? [
        {
          label: "Initializing ZK Environment",
          status: getStepStatus(0),
          description: "Loading WebAssembly cryptographic modules..."
        },
        {
          label: "Generating Bulletproof ZK Proof",
          status: getStepStatus(1),
          description: "Creating cryptographic proof to hide your transaction amount. This takes 30-45 seconds."
        },
        {
          label: "Broadcasting to ShadowWire",
          status: getStepStatus(2),
          description: "Submitting your private transaction to the network..."
        },
      ]
    : [
        {
          label: "Building Transaction",
          status: getStepStatus(0),
          description: "Preparing transaction data..."
        },
        {
          label: "Signing with Wallet",
          status: getStepStatus(1),
          description: "Please approve the transaction in your wallet..."
        },
        {
          label: "Confirming on Chain",
          status: getStepStatus(2),
          description: "Waiting for blockchain confirmation..."
        },
      ];

  // Steps for deposit/withdraw operations
  const depositWithdrawSteps = [
    {
      label: "Preparing Transaction",
      status: getStepStatus(0),
      description: "Building pool transaction..."
    },
    {
      label: "Signing Transaction",
      status: getStepStatus(1),
      description: "Please approve in your wallet..."
    },
    {
      label: "Confirming on Chain",
      status: getStepStatus(2),
      description: "Finalizing your transaction..."
    },
  ];

  const handleSend = async () => {
    if (!amount || !recipient || recipientError) return;

    const amountValue = parseFloat(amount);

    // Validate for private transfers
    if (activeTab === "private") {
      if (amountValue < MIN_TRANSFER_AMOUNT) {
        setAmountError(`Minimum transfer is ${MIN_TRANSFER_AMOUNT.toLocaleString()} ${poolToken}`);
        return;
      }

      if (amountValue > shieldedPoolBalance) {
        setAmountError(`Insufficient shielded balance. Please deposit at least ${amountValue.toFixed(4)} ${poolToken} to the pool first.`);
        return;
      }
    }

    setCurrentOperation('transfer');
    setShowTxModal(true);
    setCurrentStep(0);

    if (activeTab === "private") {
      // Private transfer using ShadowWire SDK
      // Step 1: Initialize ZK proofs
      await new Promise((r) => setTimeout(r, 300));

      // Initialize WASM if needed
      if (!shadowWireInitialized) {
        const initialized = await initShadowWire();
        if (!initialized) {
          setShowTxModal(false);
          return;
        }
      }

      setCurrentStep(1);
      // Step 2: Generate proof and execute transfer
      await new Promise((r) => setTimeout(r, 200));

      let result;
      if (privateTransferType === "internal") {
        // Internal transfer: amount hidden via Bulletproofs
        result = await internalTransfer(recipient, parseFloat(amount), poolToken);
      } else {
        // External transfer: sender anonymous
        result = await externalTransfer(recipient, parseFloat(amount), poolToken);
      }

      setCurrentStep(2);
      await new Promise((r) => setTimeout(r, 300));

      setShowTxModal(false);

      if (result?.success) {
        setLastOperation({
          type: 'transfer',
          amount: amount,
          signature: result.signature || '',
          token: poolToken,
        });

        // Award points for shadow transfer
        try {
          const pointsResult = await awardPoints('shadow_transfer', {
            txSignature: result.signature,
            transferType: privateTransferType,
            amount: parseFloat(amount),
            token: poolToken,
            network,
          });
          if (pointsResult) {
            setPointsEarned(pointsResult.totalAwarded);
          }
        } catch (err) {
          console.error('Failed to award points:', err);
        }

        setShowSuccessModal(true);
        // Refresh shielded balance after transfer
        setTimeout(() => fetchShieldedBalance(poolToken), 2000);
      }
    } else {
      // Standard transfer
      // Step 1: Preparing
      await new Promise((r) => setTimeout(r, 500));
      setCurrentStep(1);

      // Step 2: Execute transfer
      const type: TransferType = "standard";
      const result = await executeTransfer(recipient, parseFloat(amount), type);

      setCurrentStep(2);
      await new Promise((r) => setTimeout(r, 500));

      setShowTxModal(false);

      if (result?.success) {
        // Award points for standard transfer
        try {
          const pointsResult = await awardPoints('standard_transfer', {
            txSignature: result.signature,
            amount: parseFloat(amount),
            token: poolToken,
            network,
          });
          if (pointsResult) {
            setPointsEarned(pointsResult.totalAwarded);
          }
        } catch (err) {
          console.error('Failed to award points:', err);
        }

        setShowSuccessModal(true);
      }
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setAmount("");
    setRecipient("");
    setDepositAmount("");
    setWithdrawAmount("");
    setDepositError(null);
    setWithdrawError(null);
    setAmountError(null);
    setLastOperation(null);
    setPointsEarned(null);
    resetTransfer();
    resetShadowWire();
    // Refresh shielded balance after successful operation
    if (walletAddress) {
      fetchShieldedBalance(poolToken);
    }
  };

  // Handle deposit to shielded pool
  const handleDeposit = async () => {
    const depositValue = parseFloat(depositAmount);
    const minDeposit = shadowWireMinAmount(poolToken); // Use SDK minimum

    // Validate before proceeding
    if (!depositAmount || isNaN(depositValue) || depositValue <= 0) {
      setDepositError("Please enter a valid amount");
      return;
    }

    if (depositValue < minDeposit) {
      setDepositError(`Minimum deposit is ${minDeposit.toLocaleString()} ${poolToken} (anti-spam protection)`);
      return;
    }

    if (depositValue > poolTokenWalletBalance) {
      setDepositError(`Insufficient ${poolToken} wallet balance`);
      return;
    }

    setCurrentOperation('deposit');
    setShowTxModal(true);
    setCurrentStep(0);

    // Step 1: Preparing deposit
    await new Promise((r) => setTimeout(r, 300));
    setCurrentStep(1);

    // Step 2: Execute deposit with selected token
    const result = await shadowWireDeposit(parseFloat(depositAmount), poolToken);

    setCurrentStep(2);
    await new Promise((r) => setTimeout(r, 300));

    setShowTxModal(false);

    if (result?.success) {
      // Set last operation for success modal
      setLastOperation({
        type: 'deposit',
        amount: depositAmount,
        signature: result.signature || '',
        token: poolToken,
      });

      // Award points for privacy deposit (Note: Using shadow_transfer action since it's privacy-related)
      try {
        const pointsResult = await awardPoints('privacy_deposit', {
          txSignature: result.signature,
          amount: parseFloat(depositAmount),
          token: poolToken,
          network,
        });
        if (pointsResult) {
          setPointsEarned(pointsResult.totalAwarded);
        }
      } catch (err) {
        console.error('Failed to award points:', err);
      }

      setShowSuccessModal(true);
      setDepositAmount("");
      setShowDepositSection(false);
      // Refresh shielded balance after a short delay for API indexing
      setTimeout(() => fetchShieldedBalance(poolToken), 2000);
    }
  };

  // Handle withdraw from shielded pool
  const handleWithdraw = async () => {
    const withdrawValue = parseFloat(withdrawAmount);
    const minWithdraw = shadowWireMinAmount(poolToken); // Use SDK minimum

    // Validate before proceeding
    if (!withdrawAmount || isNaN(withdrawValue) || withdrawValue <= 0) {
      setWithdrawError("Please enter a valid amount");
      return;
    }

    if (withdrawValue < minWithdraw) {
      setWithdrawError(`Minimum withdraw is ${minWithdraw.toLocaleString()} ${poolToken}`);
      return;
    }

    if (withdrawValue > shieldedPoolBalance) {
      setWithdrawError(`Insufficient shielded balance. You have ${shieldedPoolBalance.toFixed(4)} ${poolToken}`);
      return;
    }

    setCurrentOperation('withdraw');
    setShowTxModal(true);
    setCurrentStep(0);

    // Step 1: Preparing withdrawal
    await new Promise((r) => setTimeout(r, 300));
    setCurrentStep(1);

    // Step 2: Execute withdraw with selected token
    const result = await shadowWireWithdraw(withdrawValue, poolToken);

    setCurrentStep(2);
    await new Promise((r) => setTimeout(r, 300));

    setShowTxModal(false);

    if (result?.success) {
      // Set last operation for success modal
      setLastOperation({
        type: 'withdraw',
        amount: withdrawAmount,
        signature: result.signature || '',
        token: poolToken,
      });

      // Award points for privacy withdrawal
      try {
        const pointsResult = await awardPoints('privacy_withdraw', {
          txSignature: result.signature,
          amount: parseFloat(withdrawAmount),
          token: poolToken,
          network,
        });
        if (pointsResult) {
          setPointsEarned(pointsResult.totalAwarded);
        }
      } catch (err) {
        console.error('Failed to award points:', err);
      }

      setShowSuccessModal(true);
      setWithdrawAmount("");
      setShowWithdrawSection(false);
      // Refresh shielded balance after a short delay for API indexing
      setTimeout(() => fetchShieldedBalance(poolToken), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Ghost Send</h1>
          <p className="text-sm text-text-secondary">Send funds privately via ShadowWire</p>
        </div>
        <LearnMoreLink section="ghost-send">How it works</LearnMoreLink>
      </div>

      {/* USD1 Featured Token Banner */}
      <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-neon-green/5 via-neon-cyan/5 to-neon-green/5 border border-neon-green/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💵</span>
            <div>
              <div className="text-sm font-semibold text-text-primary">USD1 Stablecoin Support</div>
              <div className="text-xs text-text-secondary">Transfer World Liberty Financial USD privately</div>
            </div>
          </div>
          <button
            onClick={() => handlePoolTokenChange('USD1')}
            className="px-4 py-2 rounded-lg bg-neon-green/10 border border-neon-green/30 text-neon-green text-sm font-medium hover:bg-neon-green/20 transition-all"
          >
            Select USD1 →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transfer Form */}
        <div className="lg:col-span-2">
          <Card variant="default" padding="lg">
            {/* Shared Pool Management - Shows for Private & Multi-Send tabs */}
            {(activeTab === "private" || activeTab === "multi") && (
              <div className="mb-6 pb-6 border-b border-border-secondary">
                {/* WASM Support Warning */}
                {!wasmSupported && (
                  <div className="p-3 rounded-xl bg-warning/10 border border-warning/20 mb-4">
                    <p className="text-xs text-warning">
                      Your browser does not support WebAssembly. Private transfers require a modern browser.
                    </p>
                  </div>
                )}

                {/* Shielded Balance Card */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-neon-green/10 to-neon-cyan/10 border border-neon-green/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ShieldIcon className="w-5 h-5 text-neon-green" />
                      <span className="text-sm font-medium text-neon-green">ShadowWire Shielded Pool</span>
                    </div>
                    <button
                      onClick={() => fetchShieldedBalance(poolToken)}
                      className="p-1.5 rounded-lg hover:bg-neon-green/10 text-text-muted hover:text-neon-green transition-colors"
                      title="Refresh balance"
                    >
                      <RefreshIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Token Selector - Always visible */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {SHADOWWIRE_POOL_TOKENS.slice(0, 6).map(token => (
                      <button
                        key={token.symbol}
                        onClick={() => handlePoolTokenChange(token.symbol as ShadowWireTokenSymbol)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          poolToken === token.symbol
                            ? 'bg-neon-green/20 border-neon-green text-neon-green'
                            : 'bg-bg-elevated/50 border-border-secondary text-text-secondary hover:border-neon-green/50 hover:text-text-primary'
                        }`}
                      >
                        {token.logoURI ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={token.logoURI} alt={token.symbol} className="w-4 h-4 rounded-full" />
                        ) : (
                          <span>{token.icon}</span>
                        )}
                        {token.symbol}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-text-primary">
                        {isBalanceLoading || poolToken !== lastFetchedToken ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
                            <span className="text-text-muted text-base">Loading...</span>
                          </span>
                        ) : (
                          <>{shieldedPoolBalance.toFixed(4)} <span className="text-sm sm:text-base text-text-secondary">{poolToken}</span></>
                        )}
                      </div>
                      <div className="text-xs text-text-muted mt-1">Available for private transfers</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowDepositSection(!showDepositSection);
                          if (showWithdrawSection) setShowWithdrawSection(false);
                        }}
                        className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          showDepositSection
                            ? 'bg-neon-green text-bg-primary shadow-lg shadow-neon-green/20'
                            : 'bg-neon-green/20 text-neon-green hover:bg-neon-green/30'
                        }`}
                      >
                        + Deposit
                      </button>
                      <button
                        onClick={() => {
                          setShowWithdrawSection(!showWithdrawSection);
                          if (showDepositSection) setShowDepositSection(false);
                        }}
                        disabled={shieldedPoolBalance === 0}
                        className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          showWithdrawSection
                            ? 'bg-neon-cyan text-bg-primary shadow-lg shadow-neon-cyan/20'
                            : 'bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                      >
                        - Withdraw
                      </button>
                    </div>
                  </div>

                  {shieldedPoolBalance === 0 && !showDepositSection && (
                    <p className="text-xs text-warning mt-3 p-2 rounded-lg bg-warning/10">
                      Deposit {poolToken} to start making private transfers
                    </p>
                  )}
                </div>

                {/* Deposit Section */}
                {showDepositSection && (
                  <div className={`mt-4 p-3 sm:p-4 rounded-xl bg-bg-tertiary border space-y-3 ${
                    depositError ? 'border-error/50' : 'border-neon-green/30'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-sm font-medium text-text-primary">Deposit {poolToken} to Pool</span>
                      <span className="text-xs text-text-muted">
                        Wallet: {tokenBalancesLoading ? '...' : poolTokenWalletBalance.toFixed(4)} {poolToken}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          placeholder={`Min ${shadowWireMinAmount(poolToken)} ${poolToken}`}
                          min={shadowWireMinAmount(poolToken)}
                          step="0.1"
                          className={`w-full px-3 sm:px-4 py-2.5 pr-20 rounded-lg bg-bg-elevated border text-sm text-text-primary placeholder:text-text-muted focus:outline-none ${
                            depositError
                              ? 'border-error/50 focus:border-error'
                              : 'border-border-secondary focus:border-neon-green'
                          }`}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              // For SOL, leave some for fees
                              const feeBuffer = poolToken === 'SOL' ? 0.005 : 0;
                              const maxDeposit = Math.max(0, poolTokenWalletBalance - feeBuffer);
                              if (maxDeposit >= shadowWireMinAmount(poolToken)) {
                                setDepositAmount(maxDeposit.toFixed(4));
                              } else {
                                setDepositAmount(poolTokenWalletBalance.toFixed(4));
                              }
                            }}
                            className="px-2 py-0.5 text-xs font-medium text-neon-green hover:bg-neon-green/10 rounded transition-colors"
                          >
                            MAX
                          </button>
                          <span className="text-xs text-text-muted">{poolToken}</span>
                        </div>
                      </div>
                      <Button
                        onClick={handleDeposit}
                        disabled={!!depositError || !depositAmount || shadowWireLoading}
                        loading={shadowWireLoading}
                        className="w-full sm:w-auto"
                      >
                        Deposit
                      </Button>
                    </div>
                    {depositError ? (
                      <p className="text-xs text-error">{depositError}</p>
                    ) : (
                      <p className="text-xs text-text-muted">
                        Min: {shadowWireMinAmount(poolToken)} {poolToken} • Balance reflects in ~30-60s
                      </p>
                    )}
                  </div>
                )}

                {/* Withdraw Section */}
                {showWithdrawSection && (
                  <div className={`mt-4 p-3 sm:p-4 rounded-xl bg-bg-tertiary border space-y-3 ${
                    withdrawError ? 'border-error/50' : 'border-neon-cyan/30'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-sm font-medium text-text-primary">Withdraw {poolToken} from Pool</span>
                      <span className="text-xs text-text-muted">
                        Available: {shieldedPoolBalance.toFixed(4)} {poolToken}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder={`Min ${shadowWireMinAmount(poolToken)} ${poolToken}`}
                          min={shadowWireMinAmount(poolToken)}
                          max={shieldedPoolBalance}
                          step="0.1"
                          className={`w-full px-3 sm:px-4 py-2.5 pr-20 rounded-lg bg-bg-elevated border text-sm text-text-primary placeholder:text-text-muted focus:outline-none ${
                            withdrawError
                              ? 'border-error/50 focus:border-error'
                              : 'border-border-secondary focus:border-neon-cyan'
                          }`}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setWithdrawAmount(shieldedPoolBalance.toFixed(4))}
                            className="px-2 py-0.5 text-xs font-medium text-neon-cyan hover:bg-neon-cyan/10 rounded transition-colors"
                          >
                            MAX
                          </button>
                          <span className="text-xs text-text-muted">{poolToken}</span>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={handleWithdraw}
                        disabled={!!withdrawError || !withdrawAmount || shadowWireLoading}
                        loading={shadowWireLoading}
                        className="w-full sm:w-auto"
                      >
                        Withdraw
                      </Button>
                    </div>
                    {withdrawError ? (
                      <p className="text-xs text-error">{withdrawError}</p>
                    ) : (
                      <p className="text-xs text-text-muted">
                        Withdraw to your public wallet • Balance reflects in ~30-60s
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={setActiveTab}
              variant="pills"
              size="sm"
            />

            <TabPanel value="private" activeValue={activeTab} className="mt-6">
              <div className="space-y-5">
                {/* Sending Token Display */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Sending Token
                  </label>
                  <div className="p-2.5 sm:p-3 rounded-xl bg-bg-tertiary border border-neon-green/30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        {(() => {
                          const tokenData = SHADOWWIRE_POOL_TOKENS.find(t => t.symbol === poolToken);
                          return tokenData?.logoURI ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={tokenData.logoURI} alt={poolToken} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center text-bg-primary font-bold text-base sm:text-lg">
                              {poolToken.charAt(0)}
                            </div>
                          );
                        })()}
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-text-primary">
                            {SHADOWWIRE_POOL_TOKENS.find(t => t.symbol === poolToken)?.name || poolToken}
                          </div>
                          <div className="text-[10px] sm:text-xs text-text-muted">
                            {poolToken} • From Shielded Pool
                          </div>
                        </div>
                      </div>
                      <div className="text-left sm:text-right pl-10 sm:pl-0">
                        <div className="text-xs sm:text-sm font-medium text-neon-green">
                          {isBalanceLoading ? '...' : `${shieldedPoolBalance.toFixed(4)} ${poolToken}`}
                        </div>
                        <div className="text-[10px] sm:text-xs text-text-muted">Pool Balance</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Privacy Type Selector */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Privacy Type
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    <button
                      onClick={() => setPrivateTransferType("internal")}
                      className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all ${
                        privateTransferType === "internal"
                          ? "bg-neon-green/10 border-neon-green text-neon-green"
                          : "bg-bg-tertiary border-border-secondary text-text-secondary hover:border-border-primary"
                      }`}
                    >
                      <div className="text-[10px] sm:text-xs font-medium mb-0.5">Hidden Amount</div>
                      <div className="text-[9px] sm:text-[10px] opacity-70 leading-tight">Amount hidden via ZK</div>
                    </button>
                    <button
                      onClick={() => setPrivateTransferType("external")}
                      className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all ${
                        privateTransferType === "external"
                          ? "bg-neon-cyan/10 border-neon-cyan text-neon-cyan"
                          : "bg-bg-tertiary border-border-secondary text-text-secondary hover:border-border-primary"
                      }`}
                    >
                      <div className="text-[10px] sm:text-xs font-medium mb-0.5">Anonymous Sender</div>
                      <div className="text-[9px] sm:text-[10px] opacity-70 leading-tight">Your identity is hidden</div>
                    </button>
                  </div>
                </div>

                {/* Recipient */}
                <Input
                  label="Recipient Address"
                  placeholder="Enter Solana address"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  error={recipientError || undefined}
                />

                {/* Amount */}
                <div>
                  <AmountInput
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    balance={`Pool: ${shieldedPoolBalance.toFixed(4)} ${poolToken}`}
                    onMaxClick={() => setAmount(shieldedPoolBalance.toFixed(4))}
                    error={amountError || undefined}
                  />
                  {!amountError && parseFloat(amount) > 0 && (
                    <p className="text-[10px] text-text-muted mt-1">
                      Transfers use your shielded {poolToken} pool balance, not public wallet.
                    </p>
                  )}
                </div>

                {/* Privacy Info */}
                <div className={`p-3 rounded-xl ${
                  privateTransferType === "internal"
                    ? "bg-neon-green/5 border border-neon-green/20"
                    : "bg-neon-cyan/5 border border-neon-cyan/20"
                }`}>
                  <div className="flex items-start gap-2">
                    <ShieldIcon className={`w-4 h-4 mt-0.5 ${
                      privateTransferType === "internal" ? "text-neon-green" : "text-neon-cyan"
                    }`} />
                    <div>
                      <p className={`text-xs font-medium mb-1 ${
                        privateTransferType === "internal" ? "text-neon-green" : "text-neon-cyan"
                      }`}>
                        {privateTransferType === "internal" ? "Hidden Amount Transfer" : "Anonymous Transfer"}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {privateTransferType === "internal"
                          ? "Amount is hidden using Bulletproof zero-knowledge proofs. Only you and the recipient will know the amount."
                          : "Your sender identity is hidden. The recipient receives funds from the ShadowWire pool without knowing who sent them."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fee Estimate - Same structure as Multi-Send */}
                <div className="space-y-2 pt-2 border-t border-border-secondary">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-text-muted">Amount</span>
                    <span className="text-text-primary font-medium">
                      {amount ? parseFloat(amount).toFixed(4) : '0.0000'} {poolToken}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-text-muted">Estimated Fee ({(shadowWireCalculateFee(1, poolToken).feePercentage * 100).toFixed(2)}%)</span>
                    <span className="text-text-secondary">
                      ~{amount ? shadowWireCalculateFee(parseFloat(amount) || 0, poolToken).fee.toFixed(6) : '0.000000'} {poolToken}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-text-muted">Total (incl. fees)</span>
                    <span className="text-neon-green font-bold">
                      ~{amount ? (parseFloat(amount) + shadowWireCalculateFee(parseFloat(amount) || 0, poolToken).fee).toFixed(4) : '0.0000'} {poolToken}
                    </span>
                  </div>
                </div>

                {/* Error Display */}
                {combinedError && (
                  <div className="p-3 rounded-xl bg-error/10 border border-error/20">
                    <p className="text-xs text-error">{combinedError}</p>
                  </div>
                )}

                <Button
                  fullWidth
                  onClick={handleSend}
                  disabled={
                    !amount ||
                    !recipient ||
                    !!recipientError ||
                    !!amountError ||
                    isLoading ||
                    parseFloat(amount) < MIN_TRANSFER_AMOUNT ||
                    parseFloat(amount) > shieldedPoolBalance ||
                    !wasmSupported ||
                    isBalanceLoading
                  }
                  loading={shadowWireLoading}
                >
                  {shadowWireLoading ? 'Generating ZK Proof...' : `Send ${privateTransferType === "internal" ? "with Hidden Amount" : "Anonymously"}`}
                </Button>

                {/* ZK Time Estimate & Info */}
                <div className="p-2.5 rounded-lg bg-bg-tertiary border border-border-secondary">
                  <div className="flex items-center gap-2 text-[10px] text-text-muted">
                    <span>⏱</span>
                    <span>ZK proof generation takes ~30-45 seconds • Creates 2 transactions (proof + transfer)</span>
                  </div>
                </div>
              </div>
            </TabPanel>

            {/* Multi-Send Tab */}
            <TabPanel value="multi" activeValue={activeTab} className="mt-6">
              {/* Multi-Send Progress View */}
              {(isMultiSendExecuting || multiSendProgress) && !showMultiSendSuccess ? (
                <MultiSendProgressView
                  progress={multiSendProgress}
                  recipients={multiSendRecipients}
                  token={multiSendToken}
                />
              ) : showMultiSendSuccess && multiSendResult ? (
                <MultiSendSuccessView
                  result={multiSendResult}
                  token={multiSendToken}
                  onClose={handleMultiSendReset}
                />
              ) : (
                <div className="space-y-4 sm:space-y-5">
                  {/* Sending Token Display - same as Single Send */}
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">
                      Sending Token
                    </label>
                    <div className="p-2.5 sm:p-3 rounded-xl bg-bg-tertiary border border-neon-green/30">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          {(() => {
                            const tokenData = SHADOWWIRE_POOL_TOKENS.find(t => t.symbol === multiSendToken);
                            return tokenData?.logoURI ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={tokenData.logoURI} alt={multiSendToken} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" />
                            ) : (
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center text-bg-primary font-bold text-base sm:text-lg">
                                {multiSendToken.charAt(0)}
                              </div>
                            );
                          })()}
                          <div>
                            <div className="text-xs sm:text-sm font-medium text-text-primary">
                              {SHADOWWIRE_POOL_TOKENS.find(t => t.symbol === multiSendToken)?.name || multiSendToken}
                            </div>
                            <div className="text-[10px] sm:text-xs text-text-muted">
                              {multiSendToken} • ${multiSendTokenPrice.toFixed(2)}/token
                            </div>
                          </div>
                        </div>
                        <div className="text-left sm:text-right pl-10 sm:pl-0">
                          <div className="text-xs sm:text-sm font-medium text-neon-green">
                            {isBalanceLoading ? '...' : `${shieldedPoolBalance.toFixed(4)} ${multiSendToken}`}
                          </div>
                          <div className="text-[10px] sm:text-xs text-text-muted">Pool Balance</div>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] sm:text-xs text-text-muted mt-1.5 sm:mt-2">
                      Token is selected from the pool card above
                    </p>
                  </div>

                  {/* Privacy Type */}
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5 sm:mb-2">
                      Privacy Type
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                      <button
                        onClick={() => setMultiSendType('internal')}
                        className={`p-2 sm:p-3 rounded-lg border transition-all ${
                          multiSendType === 'internal'
                            ? 'bg-neon-green/10 border-neon-green text-neon-green'
                            : 'bg-bg-tertiary border-border-secondary text-text-secondary hover:border-border-primary'
                        }`}
                      >
                        <div className="text-[10px] sm:text-xs font-medium">Hidden Amount</div>
                        <div className="text-[9px] sm:text-[10px] opacity-70 mt-0.5 leading-tight">Amount hidden via ZK</div>
                      </button>
                      <button
                        onClick={() => setMultiSendType('external')}
                        className={`p-2 sm:p-3 rounded-lg border transition-all ${
                          multiSendType === 'external'
                            ? 'bg-neon-cyan/10 border-neon-cyan text-neon-cyan'
                            : 'bg-bg-tertiary border-border-secondary text-text-secondary hover:border-border-primary'
                        }`}
                      >
                        <div className="text-[10px] sm:text-xs font-medium">Anonymous Sender</div>
                        <div className="text-[9px] sm:text-[10px] opacity-70 mt-0.5 leading-tight">Your identity hidden</div>
                      </button>
                    </div>
                  </div>

                  {/* Recipients List */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-text-secondary">
                        Recipients ({multiSendRecipients.length}/10)
                      </label>
                      <button
                        onClick={addMultiSendRecipient}
                        disabled={multiSendRecipients.length >= 10}
                        className="text-xs text-neon-green hover:text-neon-cyan disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        + Add Recipient
                      </button>
                    </div>

                    <div className="space-y-2 max-h-64 sm:max-h-72 overflow-y-auto pr-1">
                      {multiSendRecipients.map((r, index) => (
                        <div
                          key={r.id}
                          className="p-2.5 sm:p-3 rounded-lg bg-bg-tertiary border border-border-secondary"
                        >
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-bg-elevated flex items-center justify-center text-[10px] sm:text-xs font-medium text-text-muted flex-shrink-0 mt-1.5">
                              {index + 1}
                            </div>
                            <div className="flex-1 space-y-2 min-w-0">
                              <input
                                type="text"
                                placeholder="Wallet address"
                                value={r.address}
                                onChange={(e) => updateMultiSendRecipient(r.id, 'address', e.target.value)}
                                className="w-full px-2.5 sm:px-3 py-2 rounded-lg bg-bg-elevated border border-border-secondary text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-green font-mono truncate"
                              />
                              <div className="flex flex-col xs:flex-row gap-2">
                                <div className="flex-1 relative">
                                  <input
                                    type="number"
                                    placeholder="Amount"
                                    value={r.amount}
                                    onChange={(e) => updateMultiSendRecipient(r.id, 'amount', e.target.value)}
                                    min="0.1"
                                    step="0.1"
                                    className="w-full px-2.5 sm:px-3 py-2 pr-14 sm:pr-16 rounded-lg bg-bg-elevated border border-border-secondary text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-green"
                                  />
                                  <span className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs text-text-muted">
                                    {multiSendToken}
                                  </span>
                                </div>
                                <div className="px-2.5 sm:px-3 py-2 rounded-lg bg-bg-elevated border border-border-secondary text-xs sm:text-sm text-text-secondary min-w-[70px] sm:min-w-[80px] text-center">
                                  ${r.usdValue.toFixed(2)}
                                </div>
                              </div>
                            </div>
                            {multiSendRecipients.length > 1 && (
                              <button
                                onClick={() => removeMultiSendRecipient(r.id)}
                                className="p-1 sm:p-1.5 rounded-lg hover:bg-error/10 text-text-muted hover:text-error transition-colors flex-shrink-0"
                              >
                                <XIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Privacy Info - Same as Single Send */}
                  <div className={`p-3 rounded-xl ${
                    multiSendType === "internal"
                      ? "bg-neon-green/5 border border-neon-green/20"
                      : "bg-neon-cyan/5 border border-neon-cyan/20"
                  }`}>
                    <div className="flex items-start gap-2">
                      <ShieldIcon className={`w-4 h-4 mt-0.5 ${
                        multiSendType === "internal" ? "text-neon-green" : "text-neon-cyan"
                      }`} />
                      <div>
                        <p className={`text-xs font-medium mb-1 ${
                          multiSendType === "internal" ? "text-neon-green" : "text-neon-cyan"
                        }`}>
                          {multiSendType === "internal" ? "Hidden Amount Transfer" : "Anonymous Transfer"}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {multiSendType === "internal"
                            ? "Amount is hidden using Bulletproof zero-knowledge proofs. Only you and recipients will know the amounts."
                            : "Your sender identity is hidden. Recipients receive funds from the ShadowWire pool without knowing who sent them."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Totals & Fees - Styled like Single Send */}
                  <div className="space-y-2 pt-2 border-t border-border-secondary">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-muted">Total Amount</span>
                      <span className="text-text-primary font-medium">
                        {multiSendValidation.totalAmount.toFixed(4)} {multiSendToken}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-muted">Estimated Fee ({(shadowWireCalculateFee(1, multiSendToken as ShadowWireTokenSymbol).feePercentage * 100).toFixed(2)}%)</span>
                      <span className="text-text-secondary">
                        ~{shadowWireCalculateFee(multiSendValidation.totalAmount, multiSendToken as ShadowWireTokenSymbol).fee.toFixed(6)} {multiSendToken}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-muted">Total (incl. fees)</span>
                      <span className="text-neon-green font-bold">
                        ~{(multiSendValidation.totalAmount + shadowWireCalculateFee(multiSendValidation.totalAmount, multiSendToken as ShadowWireTokenSymbol).fee).toFixed(4)} {multiSendToken}
                        <span className="text-text-muted font-normal ml-1">(${multiSendValidation.totalUsd.toFixed(2)})</span>
                      </span>
                    </div>
                  </div>

                  {/* Error */}
                  {(multiSendValidation.error || multiSendError) && (
                    <div className="p-3 rounded-xl bg-error/10 border border-error/20">
                      <p className="text-xs text-error">{multiSendValidation.error || multiSendError}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <Button
                    fullWidth
                    onClick={handleMultiSendExecute}
                    disabled={!multiSendValidation.valid || multiSendLoading || isBalanceLoading}
                    loading={multiSendLoading}
                  >
                    {multiSendLoading ? 'Generating ZK Proofs...' : `Send ${multiSendType === "internal" ? "with Hidden Amount" : "Anonymously"} to ${multiSendRecipients.length} Recipient${multiSendRecipients.length > 1 ? 's' : ''}`}
                  </Button>

                  {/* ZK Time Estimate & Info */}
                  <div className="p-2.5 sm:p-3 rounded-lg bg-bg-tertiary border border-border-secondary space-y-1.5 sm:space-y-2">
                    <div className="flex items-start gap-2 text-[10px] sm:text-xs text-text-secondary">
                      <span className="text-neon-green flex-shrink-0">⏱</span>
                      <span>
                        Est. ~{Math.ceil(multiSendRecipients.length * 45 / 60)} min ({multiSendRecipients.length} × 30-45s per ZK proof)
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-[10px] sm:text-xs text-text-muted">
                      <span className="flex-shrink-0">📝</span>
                      <span>
                        2 transactions per transfer (ZK proof + transfer)
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-[10px] sm:text-xs text-text-muted">
                      <span className="flex-shrink-0">🔄</span>
                      <span>
                        Sequential execution for pool consistency
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </TabPanel>

            <TabPanel value="standard" activeValue={activeTab} className="mt-6">
              <div className="space-y-4 sm:space-y-5">
                {/* From Wallet */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    From Wallet
                  </label>
                  <div className="p-2.5 sm:p-3 rounded-xl bg-bg-tertiary border border-border-secondary">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-teal flex items-center justify-center text-bg-primary font-bold text-xs sm:text-sm">
                          W
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-text-primary">Connected Wallet</div>
                          <div className="text-[10px] sm:text-xs text-text-muted font-mono">
                            {walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : 'Not connected'}
                          </div>
                        </div>
                      </div>
                      <div className="text-left sm:text-right pl-9 sm:pl-0">
                        <div className="text-xs sm:text-sm font-medium text-neon-cyan">
                          {balanceLoading ? '...' : `${balance.toFixed(4)} SOL`}
                        </div>
                        <div className="text-[10px] sm:text-xs text-text-muted">Available</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recipient */}
                <Input
                  label="Recipient Address"
                  placeholder="Enter Solana address"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  error={recipientError || undefined}
                />

                {/* Amount */}
                <AmountInput
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  balance={`${balance.toFixed(4)} SOL`}
                  onMaxClick={() => setAmount(Math.max(0, balance - 0.00001).toFixed(4))}
                />

                {/* Standard Info */}
                <div className="p-3 rounded-xl bg-neon-cyan/5 border border-neon-cyan/20">
                  <div className="flex items-start gap-2">
                    <TransferIcon className="w-4 h-4 text-neon-cyan mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-neon-cyan mb-1">Standard Transfer</p>
                      <p className="text-xs text-text-secondary">
                        Fast and cheap transfer. Transaction details are public on the blockchain.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fee Estimate */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-muted">Network Fee</span>
                  <span className="text-text-secondary">~0.000005 SOL</span>
                </div>

                {/* Error Display */}
                {transferError && (
                  <div className="p-3 rounded-xl bg-error/10 border border-error/20">
                    <p className="text-xs text-error">{transferError}</p>
                  </div>
                )}

                <Button
                  fullWidth
                  variant="secondary"
                  onClick={handleSend}
                  disabled={!amount || !recipient || !!recipientError || transferLoading || parseFloat(amount) > balance}
                  loading={transferLoading}
                >
                  {transferLoading ? 'Sending...' : 'Send SOL'}
                </Button>
              </div>
            </TabPanel>
          </Card>
        </div>

        {/* Sidebar - Hidden on mobile */}
        <div className="hidden lg:block space-y-4">
          {/* Recent Transfers */}
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>Recent Transfers</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              {[
                { to: "0x7c1d...2e5f", amount: "50 SOL", time: "2h ago", type: "private" },
                { to: "0x9a3b...1c4d", amount: "25 SOL", time: "1d ago", type: "internal" },
                { to: "0x2d5e...9f1a", amount: "100 SOL", time: "3d ago", type: "private" },
              ].map((tx, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-bg-tertiary hover:bg-bg-elevated transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-text-secondary">{tx.to}</span>
                    <Badge size="xs" variant={tx.type === "private" ? "default" : "cyan"}>
                      {tx.type}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">{tx.amount}</span>
                    <span className="text-xs text-text-muted">{tx.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Privacy Tips */}
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>Privacy Tips</CardTitle>
            </CardHeader>
            <div className="space-y-3 text-xs text-text-secondary">
              <div className="flex gap-2">
                <span className="text-neon-green">•</span>
                <p>Use different vaults for different purposes</p>
              </div>
              <div className="flex gap-2">
                <span className="text-neon-green">•</span>
                <p>Wait random intervals between transfers</p>
              </div>
              <div className="flex gap-2">
                <span className="text-neon-green">•</span>
                <p>Split large amounts into smaller transfers</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Transaction Progress Modal */}
      <TransactionModal
        isOpen={showTxModal}
        onClose={() => setShowTxModal(false)}
        title={
          currentOperation === 'deposit' ? 'Depositing to Pool...' :
          currentOperation === 'withdraw' ? 'Withdrawing from Pool...' :
          activeTab === 'private' ? 'Private Transfer in Progress...' : 'Sending...'
        }
        steps={currentOperation === 'transfer' ? txSteps : depositWithdrawSteps}
        currentStep={currentStep}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        title={
          lastOperation?.type === 'deposit' ? 'Deposit Complete!' :
          lastOperation?.type === 'withdraw' ? 'Withdrawal Complete!' :
          'Transfer Complete!'
        }
        message={
          lastOperation?.type === 'deposit'
            ? `Successfully deposited ${lastOperation.amount} ${lastOperation.token} to shielded pool`
            : lastOperation?.type === 'withdraw'
            ? `Successfully withdrew ${lastOperation.amount} ${lastOperation.token} from shielded pool`
            : `Successfully sent ${lastOperation?.amount || amount} SOL ${activeTab === 'private' ? (privateTransferType === 'internal' ? 'with hidden amount' : 'anonymously') : ''}`
        }
        txSignature={lastOperation?.signature || combinedResult?.signature || ''}
        actions={pointsEarned ? <PointsEarned points={pointsEarned} action="Transfer" /> : undefined}
      />

    </div>
  );
}

// Multi-Send Progress View Component
function MultiSendProgressView({
  progress,
  recipients,
  token,
}: {
  progress: ReturnType<typeof useMultiSend>['progress'];
  recipients: MultiSendRecipient[];
  token: TokenType;
}) {
  const currentPhase = progress?.phase || 'initializing';

  const phaseLabels: Record<string, { icon: string; color: string }> = {
    idle: { icon: '⏸', color: 'text-text-muted' },
    initializing: { icon: '⚡', color: 'text-neon-cyan' },
    generating_proofs: { icon: '🔐', color: 'text-neon-green' },
    building_transactions: { icon: '🔨', color: 'text-neon-cyan' },
    signing: { icon: '✍️', color: 'text-warning' },
    submitting: { icon: '📡', color: 'text-neon-green' },
    complete: { icon: '✅', color: 'text-success' },
  };

  const phaseInfo = phaseLabels[currentPhase] || phaseLabels.initializing;

  return (
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
            <>Please approve in your wallet</>
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
                <div className={`w-4 h-0.5 ${isComplete ? 'bg-success' : 'bg-bg-tertiary'}`} />
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
                    {r.amount} {token} (${r.usdValue.toFixed(2)})
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
        </div>
      )}
    </div>
  );
}

// Multi-Send Success View Component
function MultiSendSuccessView({
  result,
  token,
  onClose,
}: {
  result: ReturnType<typeof useMultiSend>['result'];
  token: TokenType;
  onClose: () => void;
}) {
  if (!result) return null;

  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-success/20 to-neon-green/20 flex items-center justify-center">
          <span className="text-4xl">🎉</span>
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2">
          Multi-Send Complete!
        </h3>
        <p className="text-sm text-text-secondary">
          {result.failedCount === 0
            ? `Successfully sent ${token} to ${result.completedCount} recipients`
            : `Sent to ${result.completedCount} recipients, ${result.failedCount} failed`}
        </p>
      </div>

      {/* Results summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-center">
          <div className="text-2xl font-bold text-success">{result.completedCount}</div>
          <div className="text-xs text-text-secondary">Successful</div>
        </div>
        <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-center">
          <div className="text-2xl font-bold text-error">{result.failedCount}</div>
          <div className="text-xs text-text-secondary">Failed</div>
        </div>
      </div>

      {/* Recipients with results */}
      <div className="max-h-48 overflow-y-auto space-y-2">
        {result.recipients.map((r, index) => (
          <div
            key={r.id}
            className={`p-3 rounded-lg border ${
              r.status === 'success'
                ? 'bg-success/10 border-success/30'
                : 'bg-error/10 border-error/30'
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
                    {r.amount} {token}
                  </div>
                </div>
              </div>
              {r.status === 'success' && r.signature && (
                <a
                  href={`https://solscan.io/tx/${r.signature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-neon-cyan hover:underline"
                >
                  View →
                </a>
              )}
              {r.status === 'failed' && (
                <span className="text-xs text-error">{r.error || 'Failed'}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button fullWidth onClick={onClose}>
        Done
      </Button>
    </div>
  );
}

// Icons
const GhostIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
  </svg>
);

const TransferIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
  </svg>
);

const ShieldIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const MultiSendIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
);

const XIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const RefreshIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);
