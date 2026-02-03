'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { PublicKey, VersionedTransaction } from '@solana/web3.js';
import { useWallets, useSignMessage, useSignTransaction } from '@privy-io/react-auth/solana';
import {
  privacyCashService,
  PrivacyAction,
  PrivacyTxResult,
  PrivateBalance,
  PrivateBalances,
  PRIVACY_FEES,
  getTokenFees,
  ValidationResult,
  PRIVACY_CASH_TOKENS,
  type PrivacyCashTokenSymbol,
} from '@/lib/privacy-sdks/privacy-cash';

export interface PrivacyCashState {
  privateBalance: PrivateBalance | null;
  privateBalances: PrivateBalances; // All token balances
  selectedToken: PrivacyCashTokenSymbol;
  loading: boolean;
  error: string | null;
  result: PrivacyTxResult | null;
  initialized: boolean;
}

// Re-export for convenience
export { PRIVACY_CASH_TOKENS, type PrivacyCashTokenSymbol };

export function usePrivacyCash() {
  const { wallets } = useWallets();
  const { signMessage: privySignMessage } = useSignMessage();
  const { signTransaction: privySignTransaction } = useSignTransaction();

  // Get primary wallet
  const wallet = wallets?.[0] || null;
  const walletAddress = wallet?.address || null;

  // Memoize publicKey to prevent unnecessary re-renders
  const publicKey = useMemo(
    () => (walletAddress ? new PublicKey(walletAddress) : null),
    [walletAddress]
  );

  // Track if we've initialized encryption for the current wallet
  const encryptionInitialized = useRef(false);
  const currentWallet = useRef<string | null>(null);

  const [state, setState] = useState<PrivacyCashState>({
    privateBalance: null,
    privateBalances: {},
    selectedToken: 'SOL',
    loading: false,
    error: null,
    result: null,
    initialized: false,
  });

  /**
   * Set the selected token
   */
  const setSelectedToken = useCallback((token: PrivacyCashTokenSymbol) => {
    setState(prev => ({ ...prev, selectedToken: token }));
  }, []);

  /**
   * Wrapper for signMessage that works with Privacy Cash SDK
   */
  const signMessage = useCallback(async (message: Uint8Array): Promise<Uint8Array> => {
    if (!wallet || !walletAddress) {
      throw new Error('Wallet not connected');
    }

    const result = await privySignMessage({
      message,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      wallet: wallet as any, // Privy ConnectedStandardSolanaWallet type
    });

    // Privy returns { signature: Uint8Array }
    return result.signature;
  }, [wallet, walletAddress, privySignMessage]);

  /**
   * Wrapper for signTransaction that works with Privacy Cash SDK
   */
  const signTransaction = useCallback(async (tx: VersionedTransaction): Promise<VersionedTransaction> => {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }

    // Serialize the versioned transaction
    const serializedTx = tx.serialize();

    // Sign with Privy
    const result = await privySignTransaction({
      transaction: serializedTx,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      wallet: wallet as any, // Privy ConnectedStandardSolanaWallet type
    });

    // Privy returns { signedTransaction: Uint8Array }
    return VersionedTransaction.deserialize(result.signedTransaction);
  }, [wallet, privySignTransaction]);

  /**
   * Fetch private balance for selected token (or specified token)
   */
  const fetchPrivateBalance = useCallback(async (tokenSymbol?: PrivacyCashTokenSymbol) => {
    if (!publicKey || !walletAddress) return;

    const token = tokenSymbol || state.selectedToken;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const balance = await privacyCashService.getPrivateBalance(publicKey, signMessage, token);
      encryptionInitialized.current = true;
      currentWallet.current = walletAddress;

      setState((prev) => ({
        ...prev,
        privateBalance: balance,
        privateBalances: {
          ...prev.privateBalances,
          [token]: balance,
        },
        loading: false,
        initialized: true,
      }));

      return balance;
    } catch (error) {
      console.error(`Error fetching private ${token} balance:`, error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch balance',
        initialized: false,
      }));
      return null;
    }
  }, [publicKey, walletAddress, signMessage, state.selectedToken]);

  /**
   * Fetch all private balances for all supported tokens
   */
  const fetchAllPrivateBalances = useCallback(async () => {
    if (!publicKey || !walletAddress) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const balances = await privacyCashService.getAllPrivateBalances(publicKey, signMessage);
      encryptionInitialized.current = true;
      currentWallet.current = walletAddress;

      // Get the balance for currently selected token
      const currentBalance = balances[state.selectedToken] || null;

      setState((prev) => ({
        ...prev,
        privateBalance: currentBalance,
        privateBalances: balances,
        loading: false,
        initialized: true,
      }));

      return balances;
    } catch (error) {
      console.error('Error fetching all private balances:', error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch balances',
        initialized: false,
      }));
      return null;
    }
  }, [publicKey, walletAddress, signMessage, state.selectedToken]);

  // Reset state when wallet changes
  useEffect(() => {
    if (walletAddress !== currentWallet.current) {
      encryptionInitialized.current = false;
      setState((prev) => ({
        ...prev,
        privateBalance: null,
        initialized: false,
        error: null,
        result: null,
      }));
    }
  }, [walletAddress]);

  /**
   * Initialize encryption service (requires signature)
   * Call this before any operations that need private balance
   */
  const initialize = useCallback(async () => {
    if (!publicKey) {
      setState((prev) => ({ ...prev, error: 'Wallet not connected' }));
      return false;
    }

    if (encryptionInitialized.current && currentWallet.current === walletAddress) {
      return true;
    }

    try {
      await fetchPrivateBalance();
      return true;
    } catch (error) {
      console.error('Initialization error:', error);
      return false;
    }
  }, [publicKey, walletAddress, fetchPrivateBalance]);

  /**
   * Deposit token into privacy pool
   */
  const deposit = useCallback(
    async (amount: number, tokenSymbol?: PrivacyCashTokenSymbol) => {
      if (!publicKey || !walletAddress) {
        setState((prev) => ({ ...prev, error: 'Wallet not connected. Please connect your wallet first.' }));
        return null;
      }

      const token = tokenSymbol || state.selectedToken;

      setState((prev) => ({ ...prev, loading: true, error: null, result: null }));

      try {
        const result = await privacyCashService.deposit(
          publicKey,
          amount,
          signMessage,
          signTransaction,
          token
        );

        const newBalance: PrivateBalance | null = result.newPrivateBalance !== undefined
          ? {
              balance: result.newPrivateBalance,
              baseUnits: result.newPrivateBalance * Math.pow(10, PRIVACY_CASH_TOKENS.find(t => t.symbol === token)?.decimals || 9),
              lastUpdated: Date.now(),
              token,
            }
          : null;

        setState((prev) => ({
          ...prev,
          loading: false,
          result,
          privateBalance: newBalance || prev.privateBalance,
          privateBalances: newBalance
            ? { ...prev.privateBalances, [token]: newBalance }
            : prev.privateBalances,
        }));

        return result;
      } catch (error) {
        let errorMessage = error instanceof Error ? error.message : 'Deposit failed';
        console.error(`Privacy ${token} deposit error:`, error);

        // Provide better error messages for common errors
        if (errorMessage.includes('block height exceeded') || errorMessage.includes('has expired')) {
          errorMessage = 'Transaction expired. Please try again - ZK proof generation took too long.';
        } else if (errorMessage.includes('response not ok')) {
          errorMessage = 'Relayer error. Please try again in a moment.';
        }

        const result: PrivacyTxResult = {
          success: false,
          error: errorMessage,
          action: 'deposit',
          amount,
        };

        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
          result,
        }));

        return result;
      }
    },
    [publicKey, walletAddress, signMessage, signTransaction, state.selectedToken]
  );

  /**
   * Validate withdrawal before attempting
   * @param amountFromBalance - Amount to withdraw FROM private balance
   * @param tokenSymbol - Token to validate for
   */
  const validateWithdrawal = useCallback(
    (amountFromBalance: number, tokenSymbol?: PrivacyCashTokenSymbol): ValidationResult => {
      const token = tokenSymbol || state.selectedToken;
      const balance = state.privateBalances[token]?.balance || state.privateBalance?.balance || 0;
      return privacyCashService.validateWithdrawal(amountFromBalance, balance, token);
    },
    [state.privateBalance, state.privateBalances, state.selectedToken]
  );

  /**
   * Get maximum withdrawable amount (full balance)
   */
  const getMaxWithdrawable = useCallback((tokenSymbol?: PrivacyCashTokenSymbol): number => {
    const token = tokenSymbol || state.selectedToken;
    const balance = state.privateBalances[token]?.balance || state.privateBalance?.balance || 0;
    return privacyCashService.getMaxWithdrawable(balance);
  }, [state.privateBalance, state.privateBalances, state.selectedToken]);

  /**
   * Calculate what user will receive after fee
   */
  const calculateReceiveAmount = useCallback((amountFromBalance: number, tokenSymbol?: PrivacyCashTokenSymbol): number => {
    const token = tokenSymbol || state.selectedToken;
    return privacyCashService.calculateReceiveAmount(amountFromBalance, token);
  }, [state.selectedToken]);

  /**
   * Check if balance is withdrawable
   */
  const canWithdrawBalance = useCallback((tokenSymbol?: PrivacyCashTokenSymbol): boolean => {
    const token = tokenSymbol || state.selectedToken;
    const balance = state.privateBalances[token]?.balance || state.privateBalance?.balance || 0;
    return privacyCashService.canWithdraw(balance, token);
  }, [state.privateBalance, state.privateBalances, state.selectedToken]);

  /**
   * Get fees for selected token
   */
  const getSelectedTokenFees = useCallback((tokenSymbol?: PrivacyCashTokenSymbol) => {
    const token = tokenSymbol || state.selectedToken;
    return getTokenFees(token);
  }, [state.selectedToken]);

  /**
   * Withdraw token from privacy pool
   */
  const withdraw = useCallback(
    async (amount: number, recipientAddress?: string, tokenSymbol?: PrivacyCashTokenSymbol) => {
      if (!publicKey || !walletAddress) {
        setState((prev) => ({ ...prev, error: 'Wallet not connected. Please connect your wallet first.' }));
        return null;
      }

      const token = tokenSymbol || state.selectedToken;
      const tokenFees = getTokenFees(token);

      // Validate before proceeding
      const balance = state.privateBalances[token]?.balance || state.privateBalance?.balance || 0;
      const validation = privacyCashService.validateWithdrawal(amount, balance, token);

      if (!validation.valid) {
        const result: PrivacyTxResult = {
          success: false,
          error: validation.error,
          action: 'withdraw',
          amount,
        };
        setState((prev) => ({
          ...prev,
          error: validation.error || 'Validation failed',
          result,
        }));
        return result;
      }

      setState((prev) => ({ ...prev, loading: true, error: null, result: null }));

      try {
        // Default recipient is the connected wallet
        const recipient = recipientAddress || walletAddress;

        const result = await privacyCashService.withdraw(
          publicKey,
          amount,
          recipient,
          signMessage,
          token
        );

        const newBalance: PrivateBalance | null = result.newPrivateBalance !== undefined
          ? {
              balance: result.newPrivateBalance,
              baseUnits: result.newPrivateBalance * Math.pow(10, PRIVACY_CASH_TOKENS.find(t => t.symbol === token)?.decimals || 9),
              lastUpdated: Date.now(),
              token,
            }
          : null;

        setState((prev) => ({
          ...prev,
          loading: false,
          result,
          privateBalance: newBalance || prev.privateBalance,
          privateBalances: newBalance
            ? { ...prev.privateBalances, [token]: newBalance }
            : prev.privateBalances,
        }));

        return result;
      } catch (error) {
        let errorMessage = error instanceof Error ? error.message : 'Withdrawal failed';

        // Provide better error messages for common SDK errors
        if (errorMessage.includes('No enough balance')) {
          errorMessage = `Insufficient private balance. You need at least ${(amount + tokenFees.WITHDRAWAL_FEE).toFixed(4)} ${token} (amount + ${tokenFees.WITHDRAWAL_FEE} fee).`;
        } else if (errorMessage.includes('block height exceeded') || errorMessage.includes('has expired')) {
          errorMessage = 'Transaction expired. Please try again - ZK proof generation took too long.';
        } else if (errorMessage.includes('response not ok')) {
          errorMessage = 'Relayer error. Please try again in a moment.';
        }

        console.error(`Privacy ${token} withdraw error:`, error);

        const result: PrivacyTxResult = {
          success: false,
          error: errorMessage,
          action: 'withdraw',
          amount,
        };

        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
          result,
        }));

        return result;
      }
    },
    [publicKey, walletAddress, signMessage, state.privateBalance, state.privateBalances, state.selectedToken]
  );

  /**
   * Estimate fee for an action
   */
  const estimateFee = useCallback((action: PrivacyAction) => {
    return privacyCashService.estimateFee(action);
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      loading: false,
      error: null,
      result: null,
    }));
  }, []);

  /**
   * Clear cache (useful for debugging)
   */
  const clearCache = useCallback(() => {
    privacyCashService.clearCache();
    encryptionInitialized.current = false;
    setState({
      privateBalance: null,
      privateBalances: {},
      selectedToken: 'SOL',
      loading: false,
      error: null,
      result: null,
      initialized: false,
    });
  }, []);

  return {
    ...state,
    publicKey,
    walletAddress,
    deposit,
    withdraw,
    estimateFee,
    fetchPrivateBalance,
    fetchAllPrivateBalances,
    initialize,
    reset,
    clearCache,
    // Token selection
    setSelectedToken,
    getSelectedTokenFees,
    // Validation helpers
    validateWithdrawal,
    getMaxWithdrawable,
    calculateReceiveAmount,
    canWithdrawBalance,
    // Fee constants
    fees: PRIVACY_FEES,
  };
}

export default usePrivacyCash;
