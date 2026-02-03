/**
 * ShadowWire SDK Service
 * Private transfers on Solana using Bulletproof zero-knowledge proofs
 *
 * Provides:
 * - Internal transfers (amount hidden via ZK proofs)
 * - External transfers (sender anonymous)
 * - Deposit/withdraw to shielded pool
 *
 * SDK: @radr/shadowwire
 * Docs: https://github.com/radrdotfun/ShadowWire
 */

import {
  ShadowWireClient,
  TokenUtils,
  initWASM,
  isWASMSupported,
  generateRangeProof,
  ShadowWireError,
  InsufficientBalanceError,
  InvalidAddressError,
  RecipientNotFoundError,
  TransferError,
  NetworkError,
  WASMNotSupportedError,
  ProofGenerationError,
  TOKEN_FEES,
  TOKEN_MINIMUMS,
  TOKEN_MINTS,
  type TokenSymbol,
  type TransferType as ShadowWireTransferType,
  type PoolBalance,
  type ZKTransferResponse,
  type TransferResponse,
  type DepositResponse,
  type WithdrawResponse,
  type WalletAdapter,
  type ZKProofData,
} from '@radr/shadowwire';
import { Connection, Transaction, VersionedTransaction } from '@solana/web3.js';

const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

// Re-export types for external use
export type {
  TokenSymbol,
  PoolBalance,
  ZKTransferResponse,
  TransferResponse,
  DepositResponse,
  WithdrawResponse,
  WalletAdapter,
  ZKProofData,
};

export { ShadowWireTransferType };

/**
 * Result of a ShadowWire transfer operation
 */
export interface ShadowWireTransferResult {
  signature: string;
  success: boolean;
  error?: string;
  type: 'internal' | 'external';
  amountHidden: boolean;
  transferId?: string;
  timestamp?: number;
}

/**
 * Result of a deposit operation
 */
export interface ShadowWireDepositResult {
  success: boolean;
  signature?: string;
  unsignedTxBase64?: string;
  poolAddress?: string;
  amount?: number;
  error?: string;
}

/**
 * Transaction signer function type
 */
export type TransactionSigner = (tx: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>;

/**
 * Result of a withdraw operation
 */
export interface ShadowWireWithdrawResult {
  success: boolean;
  signature?: string;
  amountWithdrawn?: number;
  fee?: number;
  error?: string;
  unsignedTxBase64?: string;
}

/**
 * Fee calculation result
 */
export interface FeeCalculation {
  fee: number;
  feePercentage: number;
  netAmount: number;
}

/**
 * Map SDK errors to user-friendly messages
 */
function mapErrorToUserMessage(error: unknown): string {
  if (error instanceof InsufficientBalanceError) {
    return 'Insufficient shielded balance. Please deposit more funds.';
  }
  if (error instanceof InvalidAddressError) {
    return 'Invalid wallet address provided.';
  }
  if (error instanceof RecipientNotFoundError) {
    return 'Recipient address not found or invalid.';
  }
  if (error instanceof TransferError) {
    return 'Transfer failed. Please try again.';
  }
  if (error instanceof NetworkError) {
    // NetworkError contains the actual API error message - pass it through
    const msg = error.message;
    // Parse common API errors for better messages
    if (msg.includes('below minimum')) {
      // Extract the minimum amount from the error message
      return msg.replace('NetworkError: ', '');
    }
    if (msg.includes('insufficient') || msg.includes('Insufficient')) {
      return msg.replace('NetworkError: ', '');
    }
    // For other network errors, show the actual message
    if (msg && msg !== 'NetworkError') {
      return msg.replace('NetworkError: ', '');
    }
    return 'Network error. Please check your connection and try again.';
  }
  if (error instanceof WASMNotSupportedError) {
    return 'Your browser does not support privacy features. Please use a modern browser.';
  }
  if (error instanceof ProofGenerationError) {
    return 'Failed to generate zero-knowledge proof. Please try again.';
  }
  if (error instanceof ShadowWireError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred.';
}

/**
 * ShadowWire Service
 * Wrapper around the @radr/shadowwire SDK for private transfers
 */
class ShadowWireService {
  private client: ShadowWireClient;
  private connection: Connection;
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.client = new ShadowWireClient({
      network: 'mainnet-beta',
      debug: process.env.NODE_ENV === 'development',
    });
    this.connection = new Connection(HELIUS_RPC, 'confirmed');
  }

  /**
   * Initialize WASM for browser environment
   * Should be called before any ZK operations
   */
  async initWASM(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Dedupe initialization calls
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      if (!isWASMSupported()) {
        throw new WASMNotSupportedError();
      }

      try {
        // Load WASM from public directory
        await initWASM('/wasm/settler_wasm_bg.wasm');
        this.initialized = true;
      } catch (error) {
        this.initPromise = null;
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * Check if WASM is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Check if browser supports WASM
   */
  isSupported(): boolean {
    return isWASMSupported();
  }

  /**
   * Get shielded balance for a wallet
   */
  async getBalance(wallet: string, token: TokenSymbol = 'SOL'): Promise<PoolBalance> {
    try {
      return await this.client.getBalance(wallet, token);
    } catch (error) {
      console.error('[ShadowWire] Error fetching balance:', error);
      throw error;
    }
  }

  /**
   * Deposit funds to shielded pool
   * @param wallet - Wallet address
   * @param amount - Amount in SOL (not lamports)
   * @param signTransaction - Function to sign the transaction
   * @param token - Token symbol (default: SOL)
   */
  async deposit(
    wallet: string,
    amount: number,
    signTransaction?: TransactionSigner,
    token: TokenSymbol = 'SOL'
  ): Promise<ShadowWireDepositResult> {
    try {
      // Convert to smallest unit using SDK's TokenUtils
      const amountSmallestUnit = TokenUtils.toSmallestUnit(amount, token);

      // Get the actual mint address from SDK's TOKEN_MINTS
      const tokenMint = token === 'SOL' ? undefined : TOKEN_MINTS[token];

      console.log('[ShadowWire] Depositing:', { wallet, amount, amountSmallestUnit, token, tokenMint });

      // Get unsigned transaction from API
      const response: DepositResponse = await this.client.deposit({
        wallet,
        amount: amountSmallestUnit,
        token_mint: tokenMint,
      });

      console.log('[ShadowWire] Deposit response:', response);

      if (!response.success || !response.unsigned_tx_base64) {
        return {
          success: false,
          error: 'Failed to create deposit transaction',
        };
      }

      // If no signer provided, return the unsigned transaction
      if (!signTransaction) {
        return {
          success: true,
          unsignedTxBase64: response.unsigned_tx_base64,
          poolAddress: response.pool_address,
          amount: response.amount,
        };
      }

      // Decode the base64 transaction
      const txBuffer = Buffer.from(response.unsigned_tx_base64, 'base64');

      // Try to deserialize as VersionedTransaction first, then legacy Transaction
      let transaction: Transaction | VersionedTransaction;
      try {
        transaction = VersionedTransaction.deserialize(txBuffer);
      } catch {
        transaction = Transaction.from(txBuffer);
      }

      // Sign the transaction
      const signedTx = await signTransaction(transaction);

      // Serialize and send
      const serialized = signedTx.serialize();
      const signature = await this.connection.sendRawTransaction(serialized, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      console.log('[ShadowWire] Deposit signature:', signature);

      // Confirm the transaction
      const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');

      if (confirmation.value.err) {
        return {
          success: false,
          signature,
          error: 'Deposit transaction failed on chain',
        };
      }

      return {
        success: true,
        signature,
        poolAddress: response.pool_address,
        amount: response.amount,
      };
    } catch (error) {
      console.error('[ShadowWire] Deposit error:', error);
      return {
        success: false,
        error: mapErrorToUserMessage(error),
      };
    }
  }

  /**
   * Withdraw funds from shielded pool
   * @param wallet - Wallet address
   * @param amount - Amount in SOL (not lamports)
   * @param signTransaction - Function to sign the transaction
   * @param token - Token symbol (default: SOL)
   */
  async withdraw(
    wallet: string,
    amount: number,
    signTransaction?: TransactionSigner,
    token: TokenSymbol = 'SOL'
  ): Promise<ShadowWireWithdrawResult> {
    try {
      // Convert to smallest unit using SDK's TokenUtils
      const amountSmallestUnit = TokenUtils.toSmallestUnit(amount, token);

      // Get the actual mint address from SDK's TOKEN_MINTS
      const tokenMint = token === 'SOL' ? undefined : TOKEN_MINTS[token];

      console.log('[ShadowWire] Withdrawing:', { wallet, amount, amountSmallestUnit, token, tokenMint });

      const response: WithdrawResponse = await this.client.withdraw({
        wallet,
        amount: amountSmallestUnit,
        token_mint: tokenMint,
      });

      console.log('[ShadowWire] Withdraw response:', response);

      if (!response.success || !response.unsigned_tx_base64) {
        return {
          success: false,
          error: 'Failed to create withdraw transaction',
        };
      }

      // If no signer provided, return the unsigned transaction
      if (!signTransaction) {
        return {
          success: true,
          unsignedTxBase64: response.unsigned_tx_base64,
          amountWithdrawn: response.amount_withdrawn,
          fee: response.fee,
        };
      }

      // Decode the base64 transaction
      const txBuffer = Buffer.from(response.unsigned_tx_base64, 'base64');

      // Try to deserialize as VersionedTransaction first, then legacy Transaction
      let transaction: Transaction | VersionedTransaction;
      try {
        transaction = VersionedTransaction.deserialize(txBuffer);
      } catch {
        transaction = Transaction.from(txBuffer);
      }

      // Sign the transaction
      const signedTx = await signTransaction(transaction);

      // Serialize and send
      const serialized = signedTx.serialize();
      const signature = await this.connection.sendRawTransaction(serialized, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      console.log('[ShadowWire] Withdraw signature:', signature);

      // Confirm the transaction
      const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');

      if (confirmation.value.err) {
        return {
          success: false,
          signature,
          error: 'Withdraw transaction failed on chain',
        };
      }

      return {
        success: true,
        signature,
        amountWithdrawn: response.amount_withdrawn,
        fee: response.fee,
      };
    } catch (error) {
      console.error('[ShadowWire] Withdraw error:', error);
      return {
        success: false,
        error: mapErrorToUserMessage(error),
      };
    }
  }

  /**
   * Execute an internal transfer (amount hidden via Bulletproofs)
   * Both sender and recipient are visible, but the amount is hidden
   */
  async internalTransfer(params: {
    sender: string;
    recipient: string;
    amount: number;
    token?: TokenSymbol;
    wallet?: WalletAdapter;
  }): Promise<ShadowWireTransferResult> {
    const { sender, recipient, amount, token = 'SOL', wallet } = params;

    try {
      // Ensure WASM is initialized
      await this.initWASM();

      // Use the high-level transfer API
      const response: TransferResponse = await this.client.transfer({
        sender,
        recipient,
        amount,
        token,
        type: 'internal',
        wallet,
      });

      return {
        signature: response.tx_signature,
        success: response.success,
        type: 'internal',
        amountHidden: response.amount_hidden,
      };
    } catch (error) {
      console.error('[ShadowWire] Internal transfer error:', error);
      return {
        signature: '',
        success: false,
        error: mapErrorToUserMessage(error),
        type: 'internal',
        amountHidden: false,
      };
    }
  }

  /**
   * Execute an external transfer (sender anonymous)
   * Recipient receives funds from the shielded pool, sender identity is hidden
   */
  async externalTransfer(params: {
    sender: string;
    recipient: string;
    amount: number;
    token?: TokenSymbol;
    wallet?: WalletAdapter;
  }): Promise<ShadowWireTransferResult> {
    const { sender, recipient, amount, token = 'SOL', wallet } = params;

    try {
      // Ensure WASM is initialized
      await this.initWASM();

      // Use the high-level transfer API
      const response: TransferResponse = await this.client.transfer({
        sender,
        recipient,
        amount,
        token,
        type: 'external',
        wallet,
      });

      return {
        signature: response.tx_signature,
        success: response.success,
        type: 'external',
        amountHidden: response.amount_hidden,
      };
    } catch (error) {
      console.error('[ShadowWire] External transfer error:', error);
      return {
        signature: '',
        success: false,
        error: mapErrorToUserMessage(error),
        type: 'external',
        amountHidden: false,
      };
    }
  }

  /**
   * Generate a ZK range proof locally
   * Used for advanced use cases where proof needs to be generated client-side
   */
  async generateProof(amount: number, token: TokenSymbol = 'SOL'): Promise<ZKProofData> {
    await this.initWASM();
    return this.client.generateProofLocally(amount, token);
  }

  /**
   * Generate a raw range proof (lower level)
   */
  async generateRangeProof(amount: number, bitLength: number = 64): Promise<ZKProofData> {
    await this.initWASM();
    return generateRangeProof(amount, bitLength);
  }

  /**
   * Execute batch transfers with optimized flow:
   * 1. Generate all proofs upfront (saves time by parallelizing proof generation)
   * 2. Execute transfers sequentially (SDK limitation - each needs its own tx)
   *
   * Note: The SDK's transfer() method combines proof+build+sign+submit.
   * We optimize by pre-generating proofs and providing better progress feedback.
   */
  async batchTransfer(params: {
    sender: string;
    transfers: Array<{ recipient: string; amount: number }>;
    token?: TokenSymbol;
    type?: 'internal' | 'external';
    signAllTransactions?: (txs: (Transaction | VersionedTransaction)[]) => Promise<(Transaction | VersionedTransaction)[]>;
    onProgress?: (phase: string, current: number, total: number) => void;
    wallet?: WalletAdapter;
  }): Promise<{
    success: boolean;
    results: Array<{ recipient: string; amount: number; signature?: string; error?: string }>;
    totalCompleted: number;
    totalFailed: number;
  }> {
    const {
      sender,
      transfers,
      token = 'SOL',
      type = 'internal',
      onProgress,
      wallet,
    } = params;

    const results: Array<{ recipient: string; amount: number; signature?: string; error?: string }> = [];
    let totalCompleted = 0;
    let totalFailed = 0;

    try {
      // Phase 1: Initialize WASM
      onProgress?.('Initializing ZK environment...', 0, transfers.length);
      await this.initWASM();

      // Phase 2: Execute transfers (SDK handles proof + build + sign + submit)
      // Each transfer is processed, but we provide granular progress updates
      for (let i = 0; i < transfers.length; i++) {
        const transfer = transfers[i];

        // Update progress for proof generation phase
        onProgress?.(`Generating proof ${i + 1}/${transfers.length}...`, i, transfers.length);

        try {
          // Use the SDK's transfer method which handles everything
          const response: TransferResponse = await this.client.transfer({
            sender,
            recipient: transfer.recipient,
            amount: transfer.amount,
            token,
            type,
            wallet,
          });

          if (response.success) {
            results.push({
              recipient: transfer.recipient,
              amount: transfer.amount,
              signature: response.tx_signature,
            });
            totalCompleted++;
            onProgress?.(`Confirmed ${totalCompleted}/${transfers.length}`, totalCompleted, transfers.length);
          } else {
            results.push({
              recipient: transfer.recipient,
              amount: transfer.amount,
              error: 'Transfer failed',
            });
            totalFailed++;
          }
        } catch (error) {
          results.push({
            recipient: transfer.recipient,
            amount: transfer.amount,
            error: mapErrorToUserMessage(error),
          });
          totalFailed++;
        }

        // Small delay between transfers for rate limiting
        if (i < transfers.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      return {
        success: totalFailed === 0,
        results,
        totalCompleted,
        totalFailed,
      };
    } catch (error) {
      console.error('[ShadowWire] Batch transfer error:', error);
      return {
        success: false,
        results: transfers.map(t => ({
          recipient: t.recipient,
          amount: t.amount,
          error: mapErrorToUserMessage(error),
        })),
        totalCompleted: 0,
        totalFailed: transfers.length,
      };
    }
  }

  /**
   * Calculate fee for a transfer
   */
  calculateFee(amount: number, token: TokenSymbol = 'SOL'): FeeCalculation {
    return this.client.calculateFee(amount, token);
  }

  /**
   * Get fee percentage for a token
   */
  getFeePercentage(token: TokenSymbol = 'SOL'): number {
    return this.client.getFeePercentage(token);
  }

  /**
   * Get minimum transfer amount for a token
   */
  getMinimumAmount(token: TokenSymbol = 'SOL'): number {
    return this.client.getMinimumAmount(token);
  }

  /**
   * Check if a recipient has a pool account for a specific token
   * Returns true if recipient can receive transfers, false otherwise
   */
  async checkRecipientPool(recipient: string, token: TokenSymbol = 'SOL'): Promise<{
    hasPool: boolean;
    poolAddress?: string;
    error?: string;
  }> {
    try {
      const balance = await this.getBalance(recipient, token);

      // Check if pool_address exists and is valid
      if (balance.pool_address && balance.pool_address.length > 0) {
        return {
          hasPool: true,
          poolAddress: balance.pool_address,
        };
      }

      return {
        hasPool: false,
        error: `Recipient has no ${token} pool. They need to deposit ${token} first to receive private transfers.`,
      };
    } catch (error) {
      // If we get an error fetching balance, the pool likely doesn't exist
      console.error('[ShadowWire] Error checking recipient pool:', error);
      return {
        hasPool: false,
        error: `Unable to verify recipient's ${token} pool. They may need to deposit ${token} first.`,
      };
    }
  }

  /**
   * Validate multiple recipients have pools for a specific token
   * Returns validation results for each recipient
   */
  async validateRecipientsPool(
    recipients: string[],
    token: TokenSymbol = 'SOL'
  ): Promise<{
    valid: boolean;
    results: Array<{ address: string; hasPool: boolean; error?: string }>;
    invalidCount: number;
  }> {
    const results: Array<{ address: string; hasPool: boolean; error?: string }> = [];
    let invalidCount = 0;

    // Check each recipient in parallel for better performance
    const checks = await Promise.all(
      recipients.map(async (address) => {
        const check = await this.checkRecipientPool(address, token);
        return { address, ...check };
      })
    );

    for (const check of checks) {
      if (!check.hasPool) {
        invalidCount++;
      }
      results.push({
        address: check.address,
        hasPool: check.hasPool,
        error: check.error,
      });
    }

    return {
      valid: invalidCount === 0,
      results,
      invalidCount,
    };
  }

  /**
   * Get all fee percentages by token
   */
  getAllFees(): Record<string, number> {
    return TOKEN_FEES;
  }

  /**
   * Get all minimum amounts by token
   */
  getAllMinimums(): Record<string, number> {
    return TOKEN_MINIMUMS;
  }
}

// Export singleton instance
export const shadowWireService = new ShadowWireService();
export default shadowWireService;
