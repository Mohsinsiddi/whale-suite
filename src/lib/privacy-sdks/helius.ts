/**
 * Helius SDK Service
 * - Real-time balance fetching
 * - Transaction history
 * - Whale activity monitoring
 * - Enhanced RPC endpoints
 */

import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const HELIUS_API = `https://api.helius.xyz/v0`;

export interface TokenBalance {
  mint: string;
  amount: number;
  decimals: number;
  uiAmount: number;
  symbol?: string;
  name?: string;
  logoURI?: string;
}

export interface WalletBalances {
  sol: number;
  tokens: TokenBalance[];
  totalUsdValue?: number;
}

export interface TransactionInfo {
  signature: string;
  slot: number;
  timestamp: number;
  type: string;
  description: string;
  fee: number;
  status: 'success' | 'failed';
  nativeTransfers?: {
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
  }[];
  tokenTransfers?: {
    fromUserAccount: string;
    toUserAccount: string;
    mint: string;
    amount: number;
  }[];
}

export interface WhaleActivity {
  signature: string;
  timestamp: number;
  type: 'large_transfer' | 'swap' | 'nft_trade' | 'defi_action';
  wallet: string;
  amount: number;
  token?: string;
  description: string;
}

class HeliusService {
  private connection: Connection;
  private apiKey: string;

  constructor() {
    this.apiKey = HELIUS_API_KEY || '';
    this.connection = new Connection(HELIUS_RPC, 'confirmed');
  }

  /**
   * Get SOL balance for a wallet
   */
  async getSOLBalance(walletAddress: string): Promise<number> {
    try {
      const publicKey = new PublicKey(walletAddress);
      const balance = await this.connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error fetching SOL balance:', error);
      throw error;
    }
  }

  /**
   * Get all token balances for a wallet using Helius API
   */
  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    try {
      const response = await fetch(
        `${HELIUS_API}/addresses/${walletAddress}/balances?api-key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Helius API error: ${response.status}`);
      }

      const data = await response.json();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.tokens?.map((token: any) => ({
        mint: token.mint,
        amount: token.amount,
        decimals: token.decimals,
        uiAmount: token.amount / Math.pow(10, token.decimals),
        symbol: token.symbol,
        name: token.name,
        logoURI: token.logoURI,
      })) || [];
    } catch (error) {
      console.error('Error fetching token balances:', error);
      return [];
    }
  }

  /**
   * Get complete wallet balances (SOL + tokens)
   */
  async getWalletBalances(walletAddress: string): Promise<WalletBalances> {
    const [sol, tokens] = await Promise.all([
      this.getSOLBalance(walletAddress),
      this.getTokenBalances(walletAddress),
    ]);

    return {
      sol,
      tokens,
    };
  }

  /**
   * Get parsed transaction history using Helius Enhanced API
   */
  async getTransactionHistory(
    walletAddress: string,
    limit: number = 50
  ): Promise<TransactionInfo[]> {
    try {
      const response = await fetch(
        `${HELIUS_API}/addresses/${walletAddress}/transactions?api-key=${this.apiKey}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`Helius API error: ${response.status}`);
      }

      const transactions = await response.json();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return transactions.map((tx: any) => ({
        signature: tx.signature,
        slot: tx.slot,
        timestamp: tx.timestamp,
        type: tx.type,
        description: tx.description || this.getTransactionDescription(tx),
        fee: tx.fee / LAMPORTS_PER_SOL,
        status: tx.transactionError ? 'failed' : 'success',
        nativeTransfers: tx.nativeTransfers,
        tokenTransfers: tx.tokenTransfers,
      }));
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }

  /**
   * Monitor large transactions (whale activity)
   */
  async getWhaleActivity(minAmountSOL: number = 100): Promise<WhaleActivity[]> {
    // This would typically use Helius webhooks in production
    // For now, we'll fetch recent large transactions
    try {
      const response = await fetch(
        `${HELIUS_API}/transactions?api-key=${this.apiKey}&type=TRANSFER`
      );

      if (!response.ok) {
        return [];
      }

      const transactions = await response.json();

      return transactions
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((tx: any) => {
          const amount = tx.nativeTransfers?.[0]?.amount || 0;
          return amount / LAMPORTS_PER_SOL >= minAmountSOL;
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((tx: any) => ({
          signature: tx.signature,
          timestamp: tx.timestamp,
          type: 'large_transfer' as const,
          wallet: tx.feePayer,
          amount: (tx.nativeTransfers?.[0]?.amount || 0) / LAMPORTS_PER_SOL,
          description: `Large transfer of ${((tx.nativeTransfers?.[0]?.amount || 0) / LAMPORTS_PER_SOL).toFixed(2)} SOL`,
        }));
    } catch (error) {
      console.error('Error fetching whale activity:', error);
      return [];
    }
  }

  /**
   * Subscribe to wallet changes using websocket (for real-time updates)
   */
  subscribeToWallet(
    walletAddress: string,
    callback: (data: { balance: number; timestamp: number }) => void
  ): () => void {
    const publicKey = new PublicKey(walletAddress);

    const subscriptionId = this.connection.onAccountChange(
      publicKey,
      (accountInfo) => {
        callback({
          balance: accountInfo.lamports / LAMPORTS_PER_SOL,
          timestamp: Date.now(),
        });
      },
      'confirmed'
    );

    // Return unsubscribe function
    return () => {
      this.connection.removeAccountChangeListener(subscriptionId);
    };
  }

  /**
   * Get human-readable transaction description
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getTransactionDescription(tx: any): string {
    if (tx.nativeTransfers?.length > 0) {
      const transfer = tx.nativeTransfers[0];
      const amount = transfer.amount / LAMPORTS_PER_SOL;
      return `Transferred ${amount.toFixed(4)} SOL`;
    }
    if (tx.tokenTransfers?.length > 0) {
      return `Token transfer`;
    }
    return tx.type || 'Unknown transaction';
  }

  /**
   * Get connection instance for direct RPC calls
   */
  getConnection(): Connection {
    return this.connection;
  }
}

// Export singleton instance
export const heliusService = new HeliusService();
export default heliusService;
