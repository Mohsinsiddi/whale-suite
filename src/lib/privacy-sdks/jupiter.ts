/**
 * Jupiter SDK Service
 * - Best swap routes
 * - Token swaps with optimal pricing
 * - Price quotes
 */

import {
  Connection,
  VersionedTransaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

const JUPITER_API = 'https://quote-api.jup.ag/v6';
const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

// Common token mints
export const TOKEN_MINTS = {
  SOL: 'So11111111111111111111111111111111111111112', // Wrapped SOL
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
};

export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: RoutePlan[];
  contextSlot?: number;
}

export interface RoutePlan {
  swapInfo: {
    ammKey: string;
    label: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    feeAmount: string;
    feeMint: string;
  };
  percent: number;
}

export interface SwapResult {
  signature: string;
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
  success: boolean;
  error?: string;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
}

class JupiterService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(HELIUS_RPC, 'confirmed');
  }

  /**
   * Get swap quote from Jupiter
   */
  async getQuote(
    inputMint: string,
    outputMint: string,
    amount: number,
    slippageBps: number = 50 // 0.5% default slippage
  ): Promise<SwapQuote | null> {
    try {
      // Convert amount to lamports/smallest unit
      const amountInSmallestUnit = Math.floor(amount * LAMPORTS_PER_SOL);

      const params = new URLSearchParams({
        inputMint,
        outputMint,
        amount: amountInSmallestUnit.toString(),
        slippageBps: slippageBps.toString(),
        onlyDirectRoutes: 'false',
        asLegacyTransaction: 'false',
      });

      const response = await fetch(`${JUPITER_API}/quote?${params}`);

      if (!response.ok) {
        const error = await response.json();
        console.error('Jupiter quote error:', error);
        return null;
      }

      const quote = await response.json();
      return quote;
    } catch (error) {
      console.error('Error getting Jupiter quote:', error);
      return null;
    }
  }

  /**
   * Get swap transaction from Jupiter
   */
  async getSwapTransaction(
    quote: SwapQuote,
    userPublicKey: string
  ): Promise<VersionedTransaction | null> {
    try {
      const response = await fetch(`${JUPITER_API}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey,
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: 'auto',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Jupiter swap error:', error);
        return null;
      }

      const { swapTransaction } = await response.json();

      // Deserialize the transaction
      const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      return transaction;
    } catch (error) {
      console.error('Error getting swap transaction:', error);
      return null;
    }
  }

  /**
   * Execute a swap (requires wallet signing)
   */
  async executeSwap(
    inputMint: string,
    outputMint: string,
    amount: number,
    slippageBps: number,
    signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>,
    userPublicKey: string
  ): Promise<SwapResult> {
    try {
      // Get quote
      const quote = await this.getQuote(inputMint, outputMint, amount, slippageBps);

      if (!quote) {
        return {
          signature: '',
          inputAmount: amount,
          outputAmount: 0,
          priceImpact: 0,
          success: false,
          error: 'Failed to get quote',
        };
      }

      // Get swap transaction
      const transaction = await this.getSwapTransaction(quote, userPublicKey);

      if (!transaction) {
        return {
          signature: '',
          inputAmount: amount,
          outputAmount: 0,
          priceImpact: parseFloat(quote.priceImpactPct),
          success: false,
          error: 'Failed to build transaction',
        };
      }

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
      const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');

      if (confirmation.value.err) {
        return {
          signature,
          inputAmount: amount,
          outputAmount: parseFloat(quote.outAmount) / LAMPORTS_PER_SOL,
          priceImpact: parseFloat(quote.priceImpactPct),
          success: false,
          error: 'Transaction failed on chain',
        };
      }

      return {
        signature,
        inputAmount: amount,
        outputAmount: parseFloat(quote.outAmount) / LAMPORTS_PER_SOL,
        priceImpact: parseFloat(quote.priceImpactPct),
        success: true,
      };
    } catch (error) {
      console.error('Error executing swap:', error);
      return {
        signature: '',
        inputAmount: amount,
        outputAmount: 0,
        priceImpact: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get token price in USDC
   */
  async getTokenPrice(tokenMint: string): Promise<number | null> {
    try {
      // Get quote for 1 token -> USDC
      const quote = await this.getQuote(tokenMint, TOKEN_MINTS.USDC, 1, 100);

      if (!quote) return null;

      // USDC has 6 decimals
      return parseFloat(quote.outAmount) / 1_000_000;
    } catch (error) {
      console.error('Error getting token price:', error);
      return null;
    }
  }

  /**
   * Get list of tradeable tokens from Jupiter
   */
  async getTokenList(): Promise<TokenInfo[]> {
    try {
      const response = await fetch('https://token.jup.ag/all');

      if (!response.ok) {
        return [];
      }

      const tokens = await response.json();
      return tokens;
    } catch (error) {
      console.error('Error fetching token list:', error);
      return [];
    }
  }

  /**
   * Get popular/strict tokens only
   */
  async getStrictTokenList(): Promise<TokenInfo[]> {
    try {
      const response = await fetch('https://token.jup.ag/strict');

      if (!response.ok) {
        return [];
      }

      const tokens = await response.json();
      return tokens;
    } catch (error) {
      console.error('Error fetching strict token list:', error);
      return [];
    }
  }

  /**
   * Calculate output amount for display (without executing)
   */
  async getExpectedOutput(
    inputMint: string,
    outputMint: string,
    inputAmount: number
  ): Promise<{ outputAmount: number; priceImpact: number } | null> {
    const quote = await this.getQuote(inputMint, outputMint, inputAmount, 50);

    if (!quote) return null;

    return {
      outputAmount: parseFloat(quote.outAmount) / LAMPORTS_PER_SOL,
      priceImpact: parseFloat(quote.priceImpactPct),
    };
  }

  /**
   * Get connection instance
   */
  getConnection(): Connection {
    return this.connection;
  }
}

// Export singleton instance
export const jupiterService = new JupiterService();
export default jupiterService;
