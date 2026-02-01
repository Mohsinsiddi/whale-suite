/**
 * Jupiter Swap API Service
 * - Best swap routes via Jupiter Swap API v1
 * - Transaction building and execution
 * - Requires API key from https://portal.jup.ag
 *
 * API Docs: https://dev.jup.ag/docs/swap-api
 */

import {
  VersionedTransaction,
  Connection,
} from '@solana/web3.js';
import { heliusService } from './helius';

// Jupiter API endpoints
const JUPITER_SWAP_API = 'https://api.jup.ag/swap/v1';
const JUPITER_PRICE_API = 'https://api.jup.ag/price/v2';
const JUPITER_API_KEY = process.env.NEXT_PUBLIC_JUPITER_API_KEY || '';
const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com';

// Headers for Jupiter API
const getJupiterHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  ...(JUPITER_API_KEY ? { 'x-api-key': JUPITER_API_KEY } : {}),
});

// Common token mints (Mainnet)
export const TOKEN_MINTS = {
  SOL: 'So11111111111111111111111111111111111111112', // Wrapped SOL
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  USD1: 'USD1ttGY1N17NEEHLmELoaybftRBUSErhqYiQzvEmuB', // World Liberty Financial USD
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
};

// Quote Response from Jupiter
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
    feeAmount?: string;
    feeMint?: string;
  };
  percent: number;
}

// Swap Response with transaction
export interface SwapResponse {
  swapTransaction: string; // Base64 encoded transaction
  lastValidBlockHeight?: number;
  prioritizationFeeLamports?: number;
}

// For backwards compatibility with useSwap hook
export interface UltraOrderResponse {
  requestId: string;
  transaction: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
}

export interface UltraExecuteResponse {
  status: 'Success' | 'Failed' | 'Pending';
  signature?: string;
  error?: string;
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
    this.connection = new Connection(SOLANA_RPC, 'confirmed');
  }

  /**
   * Get swap quote from Jupiter
   * @param amount - Amount in human-readable units (e.g., 1.5 for 1.5 tokens)
   * @param inputDecimals - Decimals for input token (default 9 for SOL)
   */
  async getQuote(
    inputMint: string,
    outputMint: string,
    amount: number,
    slippageBps: number = 50,
    inputDecimals: number = 9
  ): Promise<SwapQuote | null> {
    try {
      // Convert amount to smallest unit based on token decimals
      const amountInSmallestUnit = Math.floor(amount * Math.pow(10, inputDecimals));

      const url = `${JUPITER_SWAP_API}/quote` +
        `?inputMint=${inputMint}` +
        `&outputMint=${outputMint}` +
        `&amount=${amountInSmallestUnit}` +
        `&slippageBps=${slippageBps}`;

      const response = await fetch(url, {
        headers: getJupiterHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error('Jupiter API key invalid or missing. Get one at https://portal.jup.ag');
          return null;
        }
        const error = await response.json().catch(() => ({}));
        console.error('Jupiter quote error:', error);
        return null;
      }

      return await response.json();
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
  ): Promise<SwapResponse | null> {
    try {
      const response = await fetch(`${JUPITER_SWAP_API}/swap`, {
        method: 'POST',
        headers: getJupiterHeaders(),
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey,
          dynamicComputeUnitLimit: true,
          dynamicSlippage: true,
          prioritizationFeeLamports: 'auto',
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('Jupiter swap error:', error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting swap transaction:', error);
      return null;
    }
  }

  /**
   * Get order (quote + transaction) - compatible with useSwap hook
   */
  async getOrder(
    inputMint: string,
    outputMint: string,
    amount: number,
    takerWallet: string
  ): Promise<UltraOrderResponse | null> {
    try {
      // Get quote first
      const quote = await this.getQuote(inputMint, outputMint, amount);
      if (!quote) return null;

      // Get swap transaction
      const swapResponse = await this.getSwapTransaction(quote, takerWallet);
      if (!swapResponse) return null;

      // Return in UltraOrderResponse format for compatibility
      return {
        requestId: `${Date.now()}`, // Generate a request ID
        transaction: swapResponse.swapTransaction,
        inputMint: quote.inputMint,
        outputMint: quote.outputMint,
        inAmount: quote.inAmount,
        outAmount: quote.outAmount,
        otherAmountThreshold: quote.otherAmountThreshold,
        swapMode: quote.swapMode,
        slippageBps: quote.slippageBps,
        priceImpactPct: quote.priceImpactPct,
      };
    } catch (error) {
      console.error('Error getting Jupiter order:', error);
      return null;
    }
  }

  /**
   * Execute a swap
   * 1. Fetch token decimals
   * 2. Get quote
   * 3. Get swap transaction
   * 4. Sign transaction with wallet
   * 5. Send to network
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
      // Step 1: Fetch token decimals
      const [inputDecimals, outputDecimals] = await Promise.all([
        heliusService.getTokenDecimals(inputMint),
        heliusService.getTokenDecimals(outputMint),
      ]);

      // Step 2: Get quote with correct decimals
      const quote = await this.getQuote(inputMint, outputMint, amount, slippageBps, inputDecimals);
      if (!quote) {
        return {
          signature: '',
          inputAmount: amount,
          outputAmount: 0,
          priceImpact: 0,
          success: false,
          error: 'Failed to get swap quote. Jupiter may be unavailable.',
        };
      }

      // Step 2: Get swap transaction
      const swapResponse = await this.getSwapTransaction(quote, userPublicKey);
      if (!swapResponse) {
        return {
          signature: '',
          inputAmount: amount,
          outputAmount: 0,
          priceImpact: parseFloat(quote.priceImpactPct || '0'),
          success: false,
          error: 'Failed to build swap transaction.',
        };
      }

      // Step 3: Deserialize and sign transaction
      const transactionBuffer = Buffer.from(swapResponse.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(transactionBuffer);
      const signedTransaction = await signTransaction(transaction);

      // Step 4: Send transaction
      const rawTransaction = signedTransaction.serialize();
      const signature = await this.connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 3,
      });

      // Wait for confirmation
      const confirmation = await this.connection.confirmTransaction(
        {
          signature,
          blockhash: transaction.message.recentBlockhash,
          lastValidBlockHeight: swapResponse.lastValidBlockHeight || (await this.connection.getBlockHeight()) + 150,
        },
        'confirmed'
      );

      if (confirmation.value.err) {
        return {
          signature,
          inputAmount: amount,
          outputAmount: 0,
          priceImpact: parseFloat(quote.priceImpactPct || '0'),
          success: false,
          error: 'Transaction failed on-chain.',
        };
      }

      return {
        signature,
        inputAmount: amount,
        outputAmount: parseFloat(quote.outAmount) / Math.pow(10, outputDecimals),
        priceImpact: parseFloat(quote.priceImpactPct || '0'),
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
   * Get expected output for display (quote without executing)
   * Automatically fetches token decimals from blockchain
   */
  async getExpectedOutput(
    inputMint: string,
    outputMint: string,
    inputAmount: number
  ): Promise<{ outputAmount: number; priceImpact: number; outAmountRaw: string; inputDecimals: number; outputDecimals: number } | null> {
    // Fetch token decimals from blockchain
    const [inputDecimals, outputDecimals] = await Promise.all([
      heliusService.getTokenDecimals(inputMint),
      heliusService.getTokenDecimals(outputMint),
    ]);

    const quote = await this.getQuote(inputMint, outputMint, inputAmount, 50, inputDecimals);
    if (!quote) return null;

    return {
      outputAmount: parseFloat(quote.outAmount), // Raw amount in smallest units
      priceImpact: parseFloat(quote.priceImpactPct || '0'),
      outAmountRaw: quote.outAmount,
      inputDecimals,
      outputDecimals,
    };
  }

  /**
   * Get token price in USDC using Jupiter Price API
   */
  async getTokenPrice(tokenMint: string): Promise<number | null> {
    try {
      const response = await fetch(
        `${JUPITER_PRICE_API}?ids=${tokenMint}`,
        { headers: getJupiterHeaders() }
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data.data?.[tokenMint]?.price || null;
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
      const response = await fetch('https://tokens.jup.ag/tokens?tags=verified');

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
      const response = await fetch('https://tokens.jup.ag/tokens?tags=strict');

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
   * Search for token metadata via Jupiter Search API
   */
  async searchToken(query: string): Promise<TokenInfo | null> {
    try {
      const response = await fetch(
        `${JUPITER_SWAP_API.replace('/swap/v1', '/ultra/v1')}/search?query=${encodeURIComponent(query)}`,
        { headers: getJupiterHeaders() }
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data?.[0] || null;
    } catch (error) {
      console.error('Error searching token:', error);
      return null;
    }
  }

  /**
   * Get multiple token metadata
   */
  async getTokensMetadata(mints: string[]): Promise<Record<string, TokenInfo>> {
    const results: Record<string, TokenInfo> = {};

    // Fetch in parallel with batching
    const batchSize = 5;
    for (let i = 0; i < mints.length; i += batchSize) {
      const batch = mints.slice(i, i + batchSize);
      const promises = batch.map(async (mint) => {
        const token = await this.searchToken(mint);
        if (token) {
          results[mint] = token;
        }
      });
      await Promise.all(promises);
    }

    return results;
  }
}

// Export singleton instance
export const jupiterService = new JupiterService();
export default jupiterService;
