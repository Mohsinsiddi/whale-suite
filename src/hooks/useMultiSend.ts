'use client';

import { useState, useCallback } from 'react';
import { useShadowWire } from './useShadowWire';
import { useTokenPrices } from './useTokenPrices';
import { useNetwork } from './useNetwork';
import { type ShadowWireTokenSymbol } from '@/lib/tokens';

// All supported tokens for multi-send (must be ShadowWire enabled)
export type TokenType = ShadowWireTokenSymbol;

export interface MultiSendRecipient {
  id: string;
  address: string;
  amount: string;
  usdValue: number;
  status: 'pending' | 'success' | 'failed';
  signature?: string;
  error?: string;
}

export type MultiSendPhase =
  | 'idle'
  | 'initializing'
  | 'generating_proofs'
  | 'building_transactions'
  | 'signing'
  | 'submitting'
  | 'complete';

export interface MultiSendProgress {
  phase: MultiSendPhase;
  phaseLabel: string;
  total: number;
  completed: number;
  failed: number;
  current: number;
  currentRecipient?: MultiSendRecipient;
  batchId?: string;
}

export interface MultiSendResult {
  success: boolean;
  batchId?: string;
  completedCount: number;
  failedCount: number;
  recipients: MultiSendRecipient[];
}

export function useMultiSend() {
  const {
    shieldedBalance,
    fetchShieldedBalance,
    loading: shadowWireLoading,
    batchTransfer,
    signAllTransactions,
    getMinimumAmount, // SDK's minimum amount function
  } = useShadowWire();

  const { getPrice, getUSDValue } = useTokenPrices();
  const { network } = useNetwork();

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<MultiSendProgress | null>(null);
  const [result, setResult] = useState<MultiSendResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Shielded balance in SOL (for backward compatibility)
  const shieldedBalanceSOL = shieldedBalance?.available ? shieldedBalance.available / 1e9 : 0;

  /**
   * Create a multi-send batch in the database
   */
  const createBatch = useCallback(async (
    wallet: string,
    recipients: MultiSendRecipient[],
    token: TokenType,
    transferType: 'internal' | 'external'
  ): Promise<string | null> => {
    try {
      const tokenPrice = getPrice(token);

      const response = await fetch('/api/multi-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet,
          network,
          token,
          tokenPrice,
          transferType,
          recipients: recipients.map(r => ({
            address: r.address,
            amount: parseFloat(r.amount),
            usdValue: r.usdValue,
          })),
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to create batch');
      }

      return data.batch.id;
    } catch (err) {
      console.error('[MultiSend] Failed to create batch:', err);
      return null;
    }
  }, [network, getPrice]);

  /**
   * Update batch progress in the database
   */
  const updateBatchProgress = useCallback(async (
    batchId: string,
    recipientIndex: number,
    status: 'success' | 'failed',
    signature?: string,
    errorMessage?: string
  ) => {
    try {
      await fetch('/api/multi-send', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          recipientIndex,
          status,
          signature,
          error: errorMessage,
        }),
      });
    } catch (err) {
      console.error('[MultiSend] Failed to update batch:', err);
    }
  }, []);

  /**
   * Execute multi-send transfers with optimized batch flow:
   * 1. Generate all proofs upfront
   * 2. Build all transactions
   * 3. Sign ALL at once (single wallet prompt)
   * 4. Submit all to network
   */
  const executeMultiSend = useCallback(async (
    wallet: string,
    recipients: MultiSendRecipient[],
    token: TokenType = 'SOL',
    transferType: 'internal' | 'external' = 'internal',
    onProgress?: (progress: MultiSendProgress) => void
  ): Promise<MultiSendResult> => {
    setLoading(true);
    setError(null);
    setResult(null);

    const updatedRecipients = [...recipients];

    try {
      // Create batch in database first
      const batchId = await createBatch(wallet, recipients, token, transferType);

      // Helper to update progress
      const updateProgress = (phase: MultiSendPhase, phaseLabel: string, current: number, completed = 0, failed = 0) => {
        const prog: MultiSendProgress = {
          phase,
          phaseLabel,
          total: recipients.length,
          completed,
          failed,
          current,
          currentRecipient: recipients[current],
          batchId: batchId || undefined,
        };
        setProgress(prog);
        onProgress?.(prog);
      };

      // Use the optimized batch transfer
      updateProgress('initializing', 'Initializing ZK environment...', 0);

      const batchResult = await batchTransfer({
        sender: wallet,
        transfers: recipients.map(r => ({
          recipient: r.address,
          amount: parseFloat(r.amount),
        })),
        token, // Pass the actual token (ShadowWireTokenSymbol)
        type: transferType,
        signAllTransactions, // Sign all at once!
        onProgress: (phaseLabel, current) => {
          // Map SDK progress to our phases
          let phase: MultiSendPhase = 'generating_proofs';
          if (phaseLabel.includes('Initializing')) phase = 'initializing';
          else if (phaseLabel.includes('proof')) phase = 'generating_proofs';
          else if (phaseLabel.includes('Building')) phase = 'building_transactions';
          else if (phaseLabel.includes('Signing')) phase = 'signing';
          else if (phaseLabel.includes('Submitting') || phaseLabel.includes('Confirmed')) phase = 'submitting';

          updateProgress(phase, phaseLabel, current, 0, 0);
        },
      });

      // Update recipients with results
      for (let i = 0; i < batchResult.results.length; i++) {
        const res = batchResult.results[i];
        updatedRecipients[i] = {
          ...updatedRecipients[i],
          status: res.signature ? 'success' : 'failed',
          signature: res.signature,
          error: res.error,
        };

        // Update database for each result
        if (batchId) {
          await updateBatchProgress(
            batchId,
            i,
            res.signature ? 'success' : 'failed',
            res.signature,
            res.error
          );
        }
      }

      // Final progress
      updateProgress('complete', 'Complete!', recipients.length, batchResult.totalCompleted, batchResult.totalFailed);

      // Refresh shielded balance for the token that was transferred
      await fetchShieldedBalance(token);

      const finalResult: MultiSendResult = {
        success: batchResult.success,
        batchId: batchId || undefined,
        completedCount: batchResult.totalCompleted,
        failedCount: batchResult.totalFailed,
        recipients: updatedRecipients,
      };
      setResult(finalResult);

      return finalResult;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Multi-send failed';
      setError(errorMsg);

      return {
        success: false,
        completedCount: 0,
        failedCount: recipients.length,
        recipients: updatedRecipients.map(r => ({ ...r, status: 'failed' as const, error: errorMsg })),
      };
    } finally {
      setLoading(false);
    }
  }, [
    createBatch,
    batchTransfer,
    signAllTransactions,
    updateBatchProgress,
    fetchShieldedBalance,
  ]);

  /**
   * Validate recipients list
   * Note: Only shows error messages for actual invalid data, not for empty fields
   * @param recipients - List of recipients to validate
   * @param token - Token symbol
   * @param poolBalance - Actual pool balance from transfer page (required for accurate validation)
   */
  const validateRecipients = useCallback((
    recipients: MultiSendRecipient[],
    token: TokenType = 'SOL',
    poolBalance: number = 0 // Pass actual pool balance from transfer page
  ): { valid: boolean; error?: string; totalAmount: number; totalUsd: number } => {
    if (recipients.length === 0) {
      return { valid: false, error: 'Add at least one recipient', totalAmount: 0, totalUsd: 0 };
    }

    if (recipients.length > 10) {
      return { valid: false, error: 'Maximum 10 recipients per batch', totalAmount: 0, totalUsd: 0 };
    }

    let totalAmount = 0;
    let totalUsd = 0;
    let hasEmptyFields = false;

    for (let i = 0; i < recipients.length; i++) {
      const r = recipients[i];

      // Check for empty fields (don't show error, just mark invalid)
      if (!r.address || !r.amount) {
        hasEmptyFields = true;
        continue; // Skip validation for empty fields but continue to calculate totals
      }

      // Validate address (only if user has started typing)
      if (r.address.length > 0 && r.address.length < 32) {
        return { valid: false, error: `Invalid address for recipient ${i + 1}`, totalAmount: 0, totalUsd: 0 };
      }

      // Validate amount
      const amount = parseFloat(r.amount);
      if (r.amount && (isNaN(amount) || amount <= 0)) {
        return { valid: false, error: `Invalid amount for recipient ${i + 1}`, totalAmount: 0, totalUsd: 0 };
      }

      // Minimum amount check using SDK's actual minimums for the token
      const minAmount = getMinimumAmount(token);
      if (amount > 0 && amount < minAmount) {
        return { valid: false, error: `Minimum ${minAmount.toLocaleString()} ${token} per transfer (recipient ${i + 1})`, totalAmount: 0, totalUsd: 0 };
      }

      if (!isNaN(amount) && amount > 0) {
        totalAmount += amount;
        totalUsd += getUSDValue(amount, token);
      }
    }

    // If any fields are empty, form is not valid but don't show error
    if (hasEmptyFields) {
      return { valid: false, totalAmount, totalUsd };
    }

    // Check if total exceeds shielded balance (use passed poolBalance for accuracy)
    if (totalAmount > poolBalance) {
      return {
        valid: false,
        error: `Total ${totalAmount.toFixed(4)} ${token} exceeds shielded balance of ${poolBalance.toFixed(4)} ${token}`,
        totalAmount,
        totalUsd,
      };
    }

    return { valid: true, totalAmount, totalUsd };
  }, [getUSDValue, getMinimumAmount]);

  /**
   * Calculate USD value for an amount
   */
  const calculateUsdValue = useCallback((amount: string, token: TokenType = 'SOL'): number => {
    const numAmount = parseFloat(amount) || 0;
    return getUSDValue(numAmount, token);
  }, [getUSDValue]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setLoading(false);
    setProgress(null);
    setResult(null);
    setError(null);
  }, []);

  return {
    // State
    loading: loading || shadowWireLoading,
    progress,
    result,
    error,
    shieldedBalanceSOL,

    // Actions
    executeMultiSend,
    validateRecipients,
    calculateUsdValue,
    fetchShieldedBalance,
    reset,

    // Utilities
    getPrice,
  };
}

export default useMultiSend;
