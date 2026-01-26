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

export interface TokenMetadata {
  mint: string;
  decimals: number;
  symbol?: string;
  name?: string;
  logoURI?: string;
}

// Cache for token metadata to avoid repeated API calls
const tokenMetadataCache: Map<string, TokenMetadata> = new Map();

// Known token decimals (fallback)
const KNOWN_DECIMALS: Record<string, number> = {
  'So11111111111111111111111111111111111111112': 9, // SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 6, // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 6, // USDT
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 5, // BONK
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 6, // JUP
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': 6, // WIF
};

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

  /**
   * Get token metadata (decimals, symbol, name) from blockchain
   * Uses Helius DAS API for accurate on-chain data
   */
  async getTokenMetadata(mintAddress: string): Promise<TokenMetadata | null> {
    // Check cache first
    if (tokenMetadataCache.has(mintAddress)) {
      return tokenMetadataCache.get(mintAddress)!;
    }

    // Check known decimals fallback
    if (KNOWN_DECIMALS[mintAddress] !== undefined) {
      const metadata: TokenMetadata = {
        mint: mintAddress,
        decimals: KNOWN_DECIMALS[mintAddress],
      };
      tokenMetadataCache.set(mintAddress, metadata);
      return metadata;
    }

    try {
      // Use Helius DAS API to get asset info
      const response = await fetch(HELIUS_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'get-asset',
          method: 'getAsset',
          params: { id: mintAddress },
        }),
      });

      if (!response.ok) {
        throw new Error(`Helius API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.result) {
        const asset = data.result;
        const metadata: TokenMetadata = {
          mint: mintAddress,
          decimals: asset.token_info?.decimals ?? 9,
          symbol: asset.token_info?.symbol || asset.content?.metadata?.symbol,
          name: asset.content?.metadata?.name,
          logoURI: asset.content?.links?.image || asset.content?.files?.[0]?.uri,
        };
        tokenMetadataCache.set(mintAddress, metadata);
        return metadata;
      }

      // Fallback: try to get mint info directly from RPC
      return await this.getMintInfoFromRPC(mintAddress);
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      // Fallback: try to get mint info directly from RPC
      return await this.getMintInfoFromRPC(mintAddress);
    }
  }

  /**
   * Fallback: Get mint info directly from Solana RPC
   */
  private async getMintInfoFromRPC(mintAddress: string): Promise<TokenMetadata | null> {
    try {
      const mintPubkey = new PublicKey(mintAddress);
      const mintInfo = await this.connection.getParsedAccountInfo(mintPubkey);

      if (mintInfo.value?.data && 'parsed' in mintInfo.value.data) {
        const parsedData = mintInfo.value.data.parsed;
        if (parsedData.type === 'mint') {
          const metadata: TokenMetadata = {
            mint: mintAddress,
            decimals: parsedData.info.decimals,
          };
          tokenMetadataCache.set(mintAddress, metadata);
          return metadata;
        }
      }

      return null;
    } catch (error) {
      console.error('Error fetching mint info from RPC:', error);
      return null;
    }
  }

  /**
   * Get decimals for a token mint (convenience method)
   */
  async getTokenDecimals(mintAddress: string): Promise<number> {
    // Check known decimals first (fast path)
    if (KNOWN_DECIMALS[mintAddress] !== undefined) {
      return KNOWN_DECIMALS[mintAddress];
    }

    const metadata = await this.getTokenMetadata(mintAddress);
    return metadata?.decimals ?? 9; // Default to 9 if unknown
  }

  /**
   * Get multiple token metadata at once
   */
  async getMultipleTokenMetadata(mintAddresses: string[]): Promise<Map<string, TokenMetadata>> {
    const results = new Map<string, TokenMetadata>();

    // Filter out already cached
    const uncached = mintAddresses.filter(mint => !tokenMetadataCache.has(mint));

    // Add cached results
    for (const mint of mintAddresses) {
      if (tokenMetadataCache.has(mint)) {
        results.set(mint, tokenMetadataCache.get(mint)!);
      }
    }

    // Fetch uncached in parallel
    if (uncached.length > 0) {
      const promises = uncached.map(mint => this.getTokenMetadata(mint));
      const fetched = await Promise.all(promises);

      for (let i = 0; i < uncached.length; i++) {
        if (fetched[i]) {
          results.set(uncached[i], fetched[i]!);
        }
      }
    }

    return results;
  }
}

// Export singleton instance
export const heliusService = new HeliusService();
export default heliusService;
