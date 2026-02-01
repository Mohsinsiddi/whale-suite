/**
 * Darklake ZK-AMM Service
 * Private swaps on Solana using zero-knowledge proofs
 *
 * Features:
 * - Blind Slippage Pools: Trade amounts hidden until settlement
 * - MEV Resistance: Frontrunning protection via encrypted commitments
 * - Two-step swap: Commit → Settle with Groth16 proofs
 *
 * SDK: @darklakefi/ts-sdk-on-chain
 * Docs: https://darklake.fi
 */

import { DarklakeSDK } from '@darklakefi/ts-sdk-on-chain';
import BN from 'bn.js';
import {
  Connection,
  PublicKey,
  VersionedTransaction,
  Transaction,
} from '@solana/web3.js';

const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

// SOL mint addresses - exported for UI usage
// Native SOL mint (for Darklake SDK - triggers auto-wrap)
export const NATIVE_SOL_MINT = 'So11111111111111111111111111111111111111111';
// Wrapped SOL mint (used directly without auto-wrap)
export const WSOL_MINT = 'So11111111111111111111111111111111111111112';

/**
 * Check if mint is SOL (native or wrapped)
 */
export function isSolMint(mint: string): boolean {
  return mint === NATIVE_SOL_MINT || mint === WSOL_MINT;
}

/**
 * Normalize SOL mint for Darklake SDK
 * - Native SOL mint: SDK auto-wraps user's native SOL
 * - WSOL mint: SDK uses existing WSOL tokens directly
 *
 * NOTE: Most Darklake pools use native SOL mint internally.
 * If user has WSOL, they should use WSOL option to swap directly.
 * If user has native SOL, they should use SOL option for auto-wrap.
 */
function normalizeForDarklake(mint: string): string {
  // Pass through as-is - let SDK handle the mint
  // Native SOL: SDK auto-wraps
  // WSOL: SDK uses directly (if pool supports)
  return mint;
}

/**
 * Result of a private swap operation
 */
export interface PrivateSwapResult {
  success: boolean;
  signature?: string;
  orderKey?: string;
  error?: string;
  inputAmount: number;
  outputAmount: number;
  priceImpact?: number;
}

/**
 * Quote for a private swap
 */
export interface PrivateSwapQuote {
  inputMint: string;
  outputMint: string;
  inputAmount: number;
  expectedOutput: number;
  minOutput: number;
  priceImpact: number;
  fee: number;
  route?: string;
}

/**
 * Order status from Darklake
 */
export interface DarklakeOrder {
  orderKey: string;
  owner: string;
  inputMint: string;
  outputMint: string;
  inputAmount: string;
  minOutput: string;
  status: 'pending' | 'settled' | 'cancelled';
  createdAt?: number;
}

/**
 * Swap step information for UI progress
 */
export interface SwapStep {
  step: 'commit' | 'settle';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  signature?: string;
  error?: string;
}

/**
 * Transaction signer function type
 */
export type TransactionSigner = (
  tx: Transaction | VersionedTransaction
) => Promise<Transaction | VersionedTransaction>;

/**
 * Callback data passed after commit phase completes
 * Used to save order to DB for recovery if settle fails
 */
export interface CommitCompleteData {
  orderKey: string;
  inputMint: string;
  outputMint: string;
  inputAmount: number;
  minOutputAmount: number;
  salt: Uint8Array;
  commitSignature: string;
}

/**
 * Map Darklake errors to user-friendly messages
 */
function mapErrorToUserMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    if (msg.includes('insufficient') || msg.includes('balance')) {
      return 'Insufficient balance for this swap.';
    }
    if (msg.includes('slippage') || msg.includes('price')) {
      return 'Price moved too much. Try increasing slippage tolerance.';
    }
    if (msg.includes('pool') && msg.includes('not found')) {
      return 'Trading pair not available on Darklake.';
    }
    if (msg.includes('timeout') || msg.includes('network')) {
      return 'Network error. Please try again.';
    }
    if (msg.includes('user rejected') || msg.includes('cancelled')) {
      return 'Transaction was cancelled.';
    }
    if (msg.includes('order') && msg.includes('not found')) {
      return 'Order not found. It may have already been settled.';
    }

    return error.message;
  }

  return 'An unknown error occurred during the swap.';
}

/**
 * Darklake Service
 * Wrapper around the @darklakefi/ts-sdk-on-chain SDK for private swaps
 */
class DarklakeService {
  private sdk: DarklakeSDK | null = null;
  private connection: Connection;
  private initialized: boolean = false;

  constructor() {
    this.connection = new Connection(HELIUS_RPC, 'confirmed');
  }

  /**
   * Initialize the Darklake SDK
   * Must be called before any swap operations
   */
  async initialize(): Promise<boolean> {
    if (this.initialized && this.sdk) {
      return true;
    }

    try {
      // Initialize SDK for mainnet
      this.sdk = new DarklakeSDK(
        HELIUS_RPC,
        'confirmed',
        false, // isDevnet = false for mainnet
        'whale-suit', // App label (max 10 chars)
        'WHALE001' // Ref code (max 20 chars)
      );

      this.initialized = true;
      console.log('[Darklake] SDK initialized successfully');
      return true;
    } catch (error) {
      console.error('[Darklake] Failed to initialize SDK:', error);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Check if SDK is initialized
   */
  isInitialized(): boolean {
    return this.initialized && this.sdk !== null;
  }

  /**
   * Get quote for a private swap using SDK's quote function
   * Returns actual expected output and fee from on-chain pool state
   */
  async getQuote(
    inputMint: string,
    outputMint: string,
    inputAmount: number,
    slippageBps: number = 100 // 1% default
  ): Promise<PrivateSwapQuote | null> {
    if (!this.sdk) {
      console.error('[Darklake] SDK not initialized');
      return null;
    }

    try {
      // Convert WSOL to native SOL for Darklake SDK
      const nativeInputMint = normalizeForDarklake(inputMint);
      const nativeOutputMint = normalizeForDarklake(outputMint);

      // Get quote from SDK (handles loadPool internally)
      const quote = await this.sdk.quote(
        new PublicKey(nativeInputMint),
        new PublicKey(nativeOutputMint),
        new BN(inputAmount)
      );

      // SDK Quote structure:
      // - inAmount: Input after fees deducted
      // - outAmount: Expected output (excluding token transfer fees)
      // - feeAmount: Total exchange fee
      // - feePct: Fee percentage where 1,000,000 = 100%

      const expectedOutput = quote.outAmount.toNumber();
      const feeAmount = quote.feeAmount.toNumber();
      const feePct = quote.feePct.toNumber() / 10000; // Convert to percentage (1000000 = 100%)

      // Calculate min output with slippage
      const minOutput = expectedOutput * (1 - slippageBps / 10000);

      // Estimate price impact (rough calculation)
      const priceImpact = inputAmount > 0 ? (feeAmount / inputAmount) * 100 : 0;

      console.log('[Darklake] Quote:', {
        inputAmount,
        expectedOutput,
        feeAmount,
        feePct: `${feePct}%`,
        minOutput,
      });

      return {
        inputMint,
        outputMint,
        inputAmount,
        expectedOutput,
        minOutput,
        priceImpact,
        fee: feeAmount,
        route: `Darklake ZK-AMM (${feePct.toFixed(2)}% fee)`,
      };
    } catch (error) {
      console.error('[Darklake] Error getting quote:', error);

      // Return null if pool doesn't exist or other error
      if (error instanceof Error) {
        if (error.message.includes('Pool not found') || error.message.includes('Account does not exist')) {
          console.log('[Darklake] Pool not available for this pair');
        }
      }
      return null;
    }
  }

  /**
   * Execute a private swap using the two-step commit-settle flow
   *
   * Step 1 (Commit): Create encrypted order on-chain
   * Step 2 (Settle): Execute swap with ZK proof verification
   *
   * @param inputMint - Token to sell
   * @param outputMint - Token to buy
   * @param inputAmount - Amount in smallest units (lamports/base units)
   * @param minOutputAmount - Minimum acceptable output
   * @param walletAddress - User's wallet public key
   * @param signTransaction - Function to sign transactions
   * @param onStepUpdate - Callback for progress updates
   * @param onCommitComplete - Callback after commit succeeds (for saving order to DB)
   */
  async executePrivateSwap(
    inputMint: string,
    outputMint: string,
    inputAmount: number,
    minOutputAmount: number,
    walletAddress: string,
    signTransaction: TransactionSigner,
    onStepUpdate?: (step: SwapStep) => void,
    onCommitComplete?: (data: CommitCompleteData) => Promise<void>
  ): Promise<PrivateSwapResult> {
    if (!this.sdk) {
      return {
        success: false,
        error: 'Darklake SDK not initialized. Please try again.',
        inputAmount,
        outputAmount: 0,
      };
    }

    try {
      // ═══════════════════════════════════════════════════════════════
      // STEP 1: CREATE SWAP ORDER (Commit Phase)
      // - Generates encrypted commitment
      // - Trade intent is hidden from MEV bots
      // ═══════════════════════════════════════════════════════════════
      onStepUpdate?.({
        step: 'commit',
        status: 'processing',
      });

      // Convert WSOL to native SOL for Darklake SDK auto-wrapping
      const nativeInputMint = normalizeForDarklake(inputMint);
      const nativeOutputMint = normalizeForDarklake(outputMint);

      console.log('[Darklake] Step 1: Creating swap order...');
      console.log('[Darklake] Input:', nativeInputMint, 'Amount:', inputAmount);
      console.log('[Darklake] Output:', nativeOutputMint, 'MinOut:', minOutputAmount);

      const { tx: swapTx, orderKey, minOut, salt } = await this.sdk.swapTx(
        new PublicKey(nativeInputMint),
        new PublicKey(nativeOutputMint),
        new BN(inputAmount),
        new BN(minOutputAmount),
        new PublicKey(walletAddress)
      );

      // Sign the commit transaction
      const signedSwapTx = await signTransaction(swapTx);

      // Send commit transaction
      const swapSignature = await this.connection.sendRawTransaction(
        signedSwapTx.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        }
      );

      console.log('[Darklake] Commit tx sent:', swapSignature);

      // Wait for confirmation
      const swapConfirmation = await this.connection.confirmTransaction(
        swapSignature,
        'confirmed'
      );

      if (swapConfirmation.value.err) {
        onStepUpdate?.({
          step: 'commit',
          status: 'failed',
          error: 'Commit transaction failed on-chain',
        });
        return {
          success: false,
          error: 'Failed to create swap order. Please try again.',
          inputAmount,
          outputAmount: 0,
        };
      }

      onStepUpdate?.({
        step: 'commit',
        status: 'completed',
        signature: swapSignature,
      });

      console.log('[Darklake] Commit confirmed. OrderKey:', orderKey.toString());

      // Save order to DB for recovery if settle fails or user closes page
      if (onCommitComplete) {
        try {
          await onCommitComplete({
            orderKey: orderKey.toString(),
            inputMint,
            outputMint,
            inputAmount,
            minOutputAmount,
            salt,
            commitSignature: swapSignature,
          });
          console.log('[Darklake] Order saved to DB for recovery');
        } catch (saveError) {
          console.warn('[Darklake] Failed to save order to DB:', saveError);
          // Continue with settle even if DB save fails
        }
      }

      // Small delay before settlement
      await new Promise((r) => setTimeout(r, 1000));

      // ═══════════════════════════════════════════════════════════════
      // STEP 2: FINALIZE/SETTLE (Proof Phase)
      // - Groth16 ZK proof verifies trade validity
      // - Swap executes at committed parameters
      // ═══════════════════════════════════════════════════════════════
      onStepUpdate?.({
        step: 'settle',
        status: 'processing',
      });

      console.log('[Darklake] Step 2: Finalizing swap...');
      console.log('[Darklake] OrderKey:', orderKey.toString());
      console.log('[Darklake] MinOut:', minOut.toString());

      let finalizeTxResult;
      try {
        finalizeTxResult = await this.sdk.finalizeTx(
          orderKey,
          true, // Unwrap WSOL to native SOL
          minOut,
          salt
        );
        console.log('[Darklake] FinalizeTx built successfully');
      } catch (finalizeError) {
        console.error('[Darklake] Failed to build finalize tx:', finalizeError);
        // Return with commit signature so user can track/recover
        return {
          success: false,
          signature: swapSignature,
          orderKey: orderKey.toString(),
          error: `Commit succeeded but settle failed to build: ${finalizeError instanceof Error ? finalizeError.message : 'Unknown error'}. Your funds are in order ${orderKey.toString()}`,
          inputAmount,
          outputAmount: 0,
        };
      }

      const { tx: finalizeTx } = finalizeTxResult;

      // Sign the finalize transaction
      console.log('[Darklake] Requesting signature for finalize tx...');
      let signedFinalizeTx;
      try {
        signedFinalizeTx = await signTransaction(finalizeTx);
        console.log('[Darklake] Finalize tx signed successfully');
      } catch (signError) {
        console.error('[Darklake] User rejected or failed to sign finalize:', signError);
        return {
          success: false,
          signature: swapSignature,
          orderKey: orderKey.toString(),
          error: `Commit succeeded but you didn't sign the settle transaction. Your funds are in order ${orderKey.toString()}. Please try settling again.`,
          inputAmount,
          outputAmount: 0,
        };
      }

      // Send finalize transaction
      const finalizeSignature = await this.connection.sendRawTransaction(
        signedFinalizeTx.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        }
      );

      console.log('[Darklake] Finalize tx sent:', finalizeSignature);

      // Wait for confirmation
      const finalizeConfirmation = await this.connection.confirmTransaction(
        finalizeSignature,
        'confirmed'
      );

      if (finalizeConfirmation.value.err) {
        onStepUpdate?.({
          step: 'settle',
          status: 'failed',
          error: 'Settlement transaction failed on-chain',
        });
        return {
          success: false,
          signature: swapSignature,
          orderKey: orderKey.toString(),
          error: 'Swap settlement failed. Your order may need manual settlement.',
          inputAmount,
          outputAmount: 0,
        };
      }

      onStepUpdate?.({
        step: 'settle',
        status: 'completed',
        signature: finalizeSignature,
      });

      console.log('[Darklake] Swap completed successfully!');

      return {
        success: true,
        signature: finalizeSignature,
        orderKey: orderKey.toString(),
        inputAmount,
        outputAmount: minOutputAmount, // Actual output may be higher
      };
    } catch (error) {
      console.error('[Darklake] Swap error:', error);

      return {
        success: false,
        error: mapErrorToUserMessage(error),
        inputAmount,
        outputAmount: 0,
      };
    }
  }

  /**
   * Settle a pending order that was committed but not finalized
   * Used to resume orders after page refresh or if settle step failed
   *
   * @param orderKey - The order key from the commit transaction
   * @param minOutputAmount - Minimum acceptable output
   * @param salt - The salt used in the commit (stored as Uint8Array)
   * @param signTransaction - Function to sign transactions
   * @param onStepUpdate - Callback for progress updates
   */
  async settlePendingOrder(
    orderKey: string,
    minOutputAmount: number,
    salt: Uint8Array,
    signTransaction: TransactionSigner,
    onStepUpdate?: (step: SwapStep) => void
  ): Promise<PrivateSwapResult> {
    if (!this.sdk) {
      return {
        success: false,
        error: 'Darklake SDK not initialized. Please try again.',
        inputAmount: 0,
        outputAmount: 0,
      };
    }

    try {
      onStepUpdate?.({
        step: 'settle',
        status: 'processing',
      });

      console.log('[Darklake] Settling pending order:', orderKey);
      console.log('[Darklake] MinOutput:', minOutputAmount);

      // Build finalize transaction
      let finalizeTxResult;
      try {
        finalizeTxResult = await this.sdk.finalizeTx(
          new PublicKey(orderKey),
          true, // Unwrap WSOL to native SOL
          new BN(minOutputAmount),
          salt
        );
        console.log('[Darklake] FinalizeTx built successfully for pending order');
      } catch (finalizeError) {
        console.error('[Darklake] Failed to build finalize tx for pending order:', finalizeError);
        onStepUpdate?.({
          step: 'settle',
          status: 'failed',
          error: finalizeError instanceof Error ? finalizeError.message : 'Failed to build settle transaction',
        });
        return {
          success: false,
          orderKey,
          error: `Failed to build settle transaction: ${finalizeError instanceof Error ? finalizeError.message : 'Unknown error'}. Order may already be settled or expired.`,
          inputAmount: 0,
          outputAmount: 0,
        };
      }

      const { tx: finalizeTx } = finalizeTxResult;

      // Sign the finalize transaction
      console.log('[Darklake] Requesting signature for pending order finalize tx...');
      let signedFinalizeTx;
      try {
        signedFinalizeTx = await signTransaction(finalizeTx);
        console.log('[Darklake] Finalize tx signed successfully');
      } catch (signError) {
        console.error('[Darklake] User rejected or failed to sign finalize:', signError);
        onStepUpdate?.({
          step: 'settle',
          status: 'failed',
          error: 'Transaction signature rejected',
        });
        return {
          success: false,
          orderKey,
          error: 'You cancelled the settle transaction. Your order is still pending.',
          inputAmount: 0,
          outputAmount: 0,
        };
      }

      // Send finalize transaction
      const finalizeSignature = await this.connection.sendRawTransaction(
        signedFinalizeTx.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        }
      );

      console.log('[Darklake] Finalize tx sent for pending order:', finalizeSignature);

      // Wait for confirmation
      const finalizeConfirmation = await this.connection.confirmTransaction(
        finalizeSignature,
        'confirmed'
      );

      if (finalizeConfirmation.value.err) {
        onStepUpdate?.({
          step: 'settle',
          status: 'failed',
          error: 'Settlement transaction failed on-chain',
        });
        return {
          success: false,
          signature: finalizeSignature,
          orderKey,
          error: 'Settlement failed on-chain. Order may have expired.',
          inputAmount: 0,
          outputAmount: 0,
        };
      }

      onStepUpdate?.({
        step: 'settle',
        status: 'completed',
        signature: finalizeSignature,
      });

      console.log('[Darklake] Pending order settled successfully!');

      return {
        success: true,
        signature: finalizeSignature,
        orderKey,
        inputAmount: 0, // Unknown for resumed orders
        outputAmount: minOutputAmount,
      };
    } catch (error) {
      console.error('[Darklake] Settle pending order error:', error);

      onStepUpdate?.({
        step: 'settle',
        status: 'failed',
        error: mapErrorToUserMessage(error),
      });

      return {
        success: false,
        orderKey,
        error: mapErrorToUserMessage(error),
        inputAmount: 0,
        outputAmount: 0,
      };
    }
  }

  /**
   * Get order status
   */
  async getOrder(walletAddress: string): Promise<DarklakeOrder | null> {
    if (!this.sdk) {
      return null;
    }

    try {
      const order = await this.sdk.getOrder(new PublicKey(walletAddress));
      if (!order) return null;

      // Cast to any since Darklake SDK types may vary
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orderData = order as any;

      return {
        orderKey: orderData.orderKey?.toString() || orderData.key?.toString() || '',
        owner: walletAddress,
        inputMint: orderData.inputMint?.toString() || orderData.tokenIn?.toString() || '',
        outputMint: orderData.outputMint?.toString() || orderData.tokenOut?.toString() || '',
        inputAmount: orderData.inputAmount?.toString() || orderData.amountIn?.toString() || '0',
        minOutput: orderData.minOutput?.toString() || orderData.minAmountOut?.toString() || '0',
        status: 'pending',
      };
    } catch (error) {
      console.error('[Darklake] Error getting order:', error);
      return null;
    }
  }

  /**
   * Check if an order is still pending on-chain
   * Returns true if order exists and can be settled
   * Returns false if order is already settled/expired (account closed)
   */
  async isOrderPending(orderKey: string): Promise<boolean> {
    if (!this.sdk) {
      return false;
    }

    try {
      // Try to fetch the order account
      const accountInfo = await this.connection.getAccountInfo(new PublicKey(orderKey));

      // If account exists and has data, order is still pending
      if (accountInfo && accountInfo.data.length > 0) {
        console.log('[Darklake] Order is still pending:', orderKey);
        return true;
      }

      // Account doesn't exist = order settled or expired
      console.log('[Darklake] Order already settled or expired:', orderKey);
      return false;
    } catch (error) {
      console.error('[Darklake] Error checking order status:', error);
      // If we can't check, assume it might still be valid
      return true;
    }
  }

  /**
   * Check if a trading pair is available on Darklake
   */
  async isPairAvailable(tokenA: string, tokenB: string): Promise<boolean> {
    if (!this.sdk) {
      return false;
    }

    try {
      // Convert WSOL to native SOL
      const nativeTokenA = normalizeForDarklake(tokenA);
      const nativeTokenB = normalizeForDarklake(tokenB);
      await this.sdk.loadPool(new PublicKey(nativeTokenA), new PublicKey(nativeTokenB));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get supported token pairs
   * Note: Darklake pools are permissionless, so this is a best-effort list
   */
  getSupportedPairs(): Array<{ tokenA: string; tokenB: string; name: string }> {
    // Common pairs that are likely to have liquidity
    // Note: SOL is represented as native mint So1111...1111 (not WSOL)
    // SDK auto-handles WSOL wrapping
    return [
      {
        tokenA: 'So11111111111111111111111111111111111111111', // SOL (native)
        tokenB: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        name: 'SOL/USDC',
      },
      {
        tokenA: 'So11111111111111111111111111111111111111111', // SOL (native)
        tokenB: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
        name: 'SOL/USDT',
      },
    ];
  }

  /**
   * Get token decimals for supported tokens
   */
  getTokenDecimals(mint: string): number {
    const decimals: Record<string, number> = {
      'So11111111111111111111111111111111111111111': 9,  // SOL
      'So11111111111111111111111111111111111111112': 9,  // WSOL
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 6, // USDC
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 6, // USDT
    };
    return decimals[mint] ?? 9;
  }
}

// Export singleton instance
export const darklakeService = new DarklakeService();
export default darklakeService;
