/**
 * Transfer Service
 * - Standard SOL transfers
 * - Private transfers (Light Protocol integration placeholder)
 * - Transaction building and signing
 */

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

export type TransferType = 'standard' | 'private' | 'hidden_amount';

export interface TransferParams {
  from: string;
  to: string;
  amount: number; // in SOL
  type: TransferType;
  memo?: string;
}

export interface TransferResult {
  signature: string;
  success: boolean;
  error?: string;
  fee: number;
  type: TransferType;
}

export interface TransferEstimate {
  fee: number;
  estimatedTime: number; // in seconds
  privacyLevel: 'none' | 'partial' | 'full';
}

class TransferService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(HELIUS_RPC, 'confirmed');
  }

  /**
   * Estimate transfer fees and details
   */
  async estimateTransfer(params: TransferParams): Promise<TransferEstimate> {
    const baseFee = 0.000005; // ~5000 lamports

    switch (params.type) {
      case 'standard':
        return {
          fee: baseFee,
          estimatedTime: 1,
          privacyLevel: 'none',
        };
      case 'private':
        return {
          fee: baseFee * 10, // Higher fee for private transfers
          estimatedTime: 5,
          privacyLevel: 'partial', // Sender anonymous
        };
      case 'hidden_amount':
        return {
          fee: baseFee * 20, // Highest fee
          estimatedTime: 10,
          privacyLevel: 'full', // Amount + sender hidden
        };
      default:
        return {
          fee: baseFee,
          estimatedTime: 1,
          privacyLevel: 'none',
        };
    }
  }

  /**
   * Build a standard transfer transaction
   */
  async buildStandardTransfer(
    from: PublicKey,
    to: PublicKey,
    amount: number
  ): Promise<Transaction> {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from,
        toPubkey: to,
        lamports: Math.floor(amount * LAMPORTS_PER_SOL),
      })
    );

    const { blockhash, lastValidBlockHeight } =
      await this.connection.getLatestBlockhash('confirmed');

    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = from;

    return transaction;
  }

  /**
   * Execute a standard SOL transfer
   */
  async executeStandardTransfer(
    params: TransferParams,
    signTransaction: (tx: Transaction) => Promise<Transaction>
  ): Promise<TransferResult> {
    try {
      const fromPubkey = new PublicKey(params.from);
      const toPubkey = new PublicKey(params.to);

      // Build transaction
      const transaction = await this.buildStandardTransfer(
        fromPubkey,
        toPubkey,
        params.amount
      );

      // Sign transaction
      const signedTransaction = await signTransaction(transaction);

      // Send transaction
      const signature = await this.connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        }
      );

      // Confirm transaction
      const confirmation = await this.connection.confirmTransaction(
        signature,
        'confirmed'
      );

      if (confirmation.value.err) {
        return {
          signature,
          success: false,
          error: 'Transaction failed on chain',
          fee: 0.000005,
          type: 'standard',
        };
      }

      return {
        signature,
        success: true,
        fee: 0.000005,
        type: 'standard',
      };
    } catch (error) {
      console.error('Transfer error:', error);
      return {
        signature: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fee: 0,
        type: 'standard',
      };
    }
  }

  /**
   * Execute a private transfer (Light Protocol placeholder)
   * In production, this would use Light Protocol or similar privacy solution
   */
  async executePrivateTransfer(
    params: TransferParams,
    signTransaction: (tx: Transaction) => Promise<Transaction>
  ): Promise<TransferResult> {
    // TODO: Integrate with Light Protocol for true private transfers
    // For now, we execute as standard transfer with a note
    console.log('Private transfer requested - using standard transfer as placeholder');

    return this.executeStandardTransfer(params, signTransaction);
  }

  /**
   * Execute transfer based on type
   */
  async executeTransfer(
    params: TransferParams,
    signTransaction: (tx: Transaction) => Promise<Transaction>
  ): Promise<TransferResult> {
    switch (params.type) {
      case 'standard':
        return this.executeStandardTransfer(params, signTransaction);
      case 'private':
      case 'hidden_amount':
        return this.executePrivateTransfer(params, signTransaction);
      default:
        return this.executeStandardTransfer(params, signTransaction);
    }
  }

  /**
   * Validate recipient address
   */
  isValidAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get recent transfers for a wallet
   */
  async getRecentTransfers(walletAddress: string, limit: number = 10) {
    try {
      const publicKey = new PublicKey(walletAddress);
      const signatures = await this.connection.getSignaturesForAddress(
        publicKey,
        { limit }
      );

      return signatures.map((sig) => ({
        signature: sig.signature,
        slot: sig.slot,
        timestamp: sig.blockTime,
        error: sig.err,
        memo: sig.memo,
      }));
    } catch (error) {
      console.error('Error fetching recent transfers:', error);
      return [];
    }
  }

  /**
   * Get connection instance
   */
  getConnection(): Connection {
    return this.connection;
  }
}

// Export singleton instance
export const transferService = new TransferService();
export default transferService;
