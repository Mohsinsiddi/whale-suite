/**
 * ShadowWire SDK Service
 * Private transfers on Solana using Bulletproof zero-knowledge proofs
 *
 * Provides:
 * - Internal transfers (amount hidden via ZK proofs)
 * - External transfers (sender anonymous)
 * - Deposit/withdraw to shielded pool
 *
 * Bounty: $15,000 (Radr Labs)
 * SDK: @radr/shadowwire
 * GitHub: radrdotfun/ShadowWire
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
      // Convert SOL to lamports (smallest unit)
      const amountLamports = TokenUtils.toSmallestUnit(amount, token);

      console.log('[ShadowWire] Depositing:', { wallet, amount, amountLamports, token });

      // Get unsigned transaction from API
      const response: DepositResponse = await this.client.deposit({
        wallet,
        amount: amountLamports,
        token_mint: token === 'SOL' ? undefined : token,
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
      // Convert SOL to lamports (smallest unit)
      const amountLamports = TokenUtils.toSmallestUnit(amount, token);

      console.log('[ShadowWire] Withdrawing:', { wallet, amount, amountLamports, token });

      const response: WithdrawResponse = await this.client.withdraw({
        wallet,
        amount: amountLamports,
        token_mint: token === 'SOL' ? undefined : token,
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
