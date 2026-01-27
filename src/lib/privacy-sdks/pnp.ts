/**
 * PNP Exchange Service
 * Prediction Markets SDK Integration for Anonymous Betting
 * Bounty: $2,500
 *
 * Note: SDK is loaded dynamically at runtime to avoid build-time anchor issues
 */

import { PublicKey } from "@solana/web3.js";

// RPC URL - use Helius for better performance
const RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC_URL ||
                process.env.NEXT_PUBLIC_SOLANA_RPC ||
                "https://api.mainnet-beta.solana.com";

export interface PNPMarket {
  id: string;
  publicKey: string;
  question: string;
  yesPrice: number;
  noPrice: number;
  yesTokenMint: string;
  noTokenMint: string;
  collateralToken: string;
  volume: number;
  liquidity: number;
  endDate: Date;
  resolved: boolean;
  winningToken: "yes" | "no" | null;
  creator: string;
  image?: string | null;
}

export interface UserPosition {
  marketId: string;
  yesBalance: number;
  noBalance: number;
  collateralBalance: number;
}

export interface TradeParams {
  marketPubkey: string;
  side: "yes" | "no";
  amount: number; // in USDC
  minimumOut?: number;
}

export interface TradeResult {
  signature: string;
  tokensReceived: number;
  success: boolean;
  error?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMarketMeta = any;

class PNPService {
  private client: AnyClient | null = null;
  private readOnlyClient: AnyClient | null = null;
  private sdkModule: typeof import("pnp-sdk") | null = null;

  /**
   * Dynamically import the PNP SDK at runtime
   */
  private async loadSDK(): Promise<typeof import("pnp-sdk")> {
    if (!this.sdkModule) {
      // Dynamic import - only loads at runtime, not build time
      this.sdkModule = await import(/* webpackIgnore: true */ "pnp-sdk");
    }
    return this.sdkModule;
  }

  /**
   * Initialize a read-only client (no wallet needed)
   */
  async getReadOnlyClient(): Promise<AnyClient> {
    if (!this.readOnlyClient) {
      const sdk = await this.loadSDK();
      this.readOnlyClient = new sdk.PNPClient(RPC_URL);
    }
    return this.readOnlyClient;
  }

  /**
   * Initialize client with wallet for trading
   */
  async initWithWallet(privateKey: Uint8Array): Promise<AnyClient> {
    const sdk = await this.loadSDK();
    this.client = new sdk.PNPClient(RPC_URL, privateKey);
    return this.client;
  }

  /**
   * Fetch all prediction markets
   */
  async fetchMarkets(): Promise<PNPMarket[]> {
    try {
      const client = await this.getReadOnlyClient();
      const response = await client.fetchMarkets();

      if (!response?.data) {
        return [];
      }

      // Get metadata for all markets in batch
      const marketAddresses = response.data.map((m: { publicKey: string }) => m.publicKey);
      const metadataMap: Map<string, AnyMarketMeta> = new Map();

      try {
        const metadata = await client.getMarketMetaBatch(marketAddresses);
        metadata.forEach((m: AnyMarketMeta) => {
          metadataMap.set(m.market, m);
        });
      } catch (e) {
        console.warn("Failed to fetch market metadata batch:", e);
      }

      // Transform to our format
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const markets: PNPMarket[] = response.data.map((item: any) => {
        const account = item.account;
        const meta = metadataMap.get(item.publicKey);

        // Calculate prices from minted supply
        const yesMinted = Number(account.yes_token_supply_minted);
        const noMinted = Number(account.no_token_supply_minted);
        const total = yesMinted + noMinted;

        // Price = share of total (inverted because more minted = lower price)
        const yesShare = total > 0 ? noMinted / total : 0.5;
        const noShare = total > 0 ? yesMinted / total : 0.5;

        // Parse winning token
        let winningToken: "yes" | "no" | null = null;
        if (account.winning_token_id !== null && account.winning_token_id !== "none") {
          if (typeof account.winning_token_id === "object" && account.winning_token_id !== null) {
            if ("yes" in account.winning_token_id) winningToken = "yes";
            else if ("no" in account.winning_token_id) winningToken = "no";
          } else if (account.winning_token_id === 0 || account.winning_token_id === "yes") {
            winningToken = "yes";
          } else if (account.winning_token_id === 1 || account.winning_token_id === "no") {
            winningToken = "no";
          }
        }

        return {
          id: String(account.id),
          publicKey: item.publicKey,
          question: account.question,
          yesPrice: yesShare,
          noPrice: noShare,
          yesTokenMint: String(account.yes_token_mint),
          noTokenMint: String(account.no_token_mint),
          collateralToken: String(account.collateral_token),
          volume: meta?.market_volume || 0,
          liquidity: Number(account.market_reserves) / 1e6, // Convert from raw to USDC
          endDate: new Date(Number(account.end_time) * 1000),
          resolved: account.resolved,
          winningToken,
          creator: String(account.creator),
          image: meta?.image || null,
        };
      });

      // Sort by volume (most active first)
      return markets.sort((a, b) => b.volume - a.volume);
    } catch (error) {
      console.error("Failed to fetch markets:", error);
      throw error;
    }
  }

  /**
   * Fetch a single market by address
   */
  async fetchMarket(marketAddress: string): Promise<PNPMarket | null> {
    try {
      const client = await this.getReadOnlyClient();
      const marketPubkey = new PublicKey(marketAddress);
      const result = await client.fetchMarket(marketPubkey);

      if (!result) return null;

      const account = result.account;

      // Get metadata
      let meta: AnyMarketMeta | null = null;
      try {
        meta = await client.getMarketMeta(marketAddress);
      } catch (e) {
        console.warn("Failed to fetch market metadata:", e);
      }

      // Calculate prices
      const yesMinted = Number(account.yes_token_supply_minted);
      const noMinted = Number(account.no_token_supply_minted);
      const total = yesMinted + noMinted;
      const yesShare = total > 0 ? noMinted / total : 0.5;
      const noShare = total > 0 ? yesMinted / total : 0.5;

      // Parse winning token
      let winningToken: "yes" | "no" | null = null;
      if (account.winning_token_id !== null && account.winning_token_id !== "none") {
        if (typeof account.winning_token_id === "object" && account.winning_token_id !== null) {
          if ("yes" in account.winning_token_id) winningToken = "yes";
          else if ("no" in account.winning_token_id) winningToken = "no";
        }
      }

      return {
        id: String(account.id),
        publicKey: marketAddress,
        question: account.question,
        yesPrice: yesShare,
        noPrice: noShare,
        yesTokenMint: String(account.yes_token_mint),
        noTokenMint: String(account.no_token_mint),
        collateralToken: String(account.collateral_token),
        volume: meta?.market_volume || 0,
        liquidity: Number(account.market_reserves) / 1e6,
        endDate: new Date(Number(account.end_time) * 1000),
        resolved: account.resolved,
        winningToken,
        creator: String(account.creator),
        image: meta?.image || null,
      };
    } catch (error) {
      console.error("Failed to fetch market:", error);
      return null;
    }
  }

  /**
   * Get user's positions in a market
   */
  async getUserPositions(marketAddress: string): Promise<UserPosition | null> {
    if (!this.client || !this.client.trading) {
      return null;
    }

    try {
      const marketPubkey = new PublicKey(marketAddress);
      const balances = await this.client.trading.getBalances(marketPubkey);

      return {
        marketId: marketAddress,
        yesBalance: Number(balances.yes.uiAmount || 0),
        noBalance: Number(balances.no.uiAmount || 0),
        collateralBalance: Number(balances.collateral.uiAmount || 0),
      };
    } catch (error) {
      console.error("Failed to get user positions:", error);
      return null;
    }
  }

  /**
   * Buy YES or NO tokens
   */
  async buyTokens(params: TradeParams): Promise<TradeResult> {
    if (!this.client || !this.client.trading) {
      return {
        signature: "",
        tokensReceived: 0,
        success: false,
        error: "Client not initialized with wallet",
      };
    }

    try {
      const marketPubkey = new PublicKey(params.marketPubkey);
      const result = await this.client.trading.buyTokensUsdc({
        market: marketPubkey,
        buyYesToken: params.side === "yes",
        amountUsdc: params.amount,
        minimumOut: params.minimumOut ? BigInt(Math.floor(params.minimumOut * 1e6)) : undefined,
      });

      return {
        signature: result.signature,
        tokensReceived: result.tokensReceived,
        success: true,
      };
    } catch (error) {
      console.error("Failed to buy tokens:", error);
      return {
        signature: "",
        tokensReceived: 0,
        success: false,
        error: error instanceof Error ? error.message : "Trade failed",
      };
    }
  }

  /**
   * Sell YES or NO tokens
   */
  async sellTokens(params: {
    marketPubkey: string;
    side: "yes" | "no";
    amount: number; // amount of tokens to sell
  }): Promise<TradeResult> {
    if (!this.client || !this.client.trading) {
      return {
        signature: "",
        tokensReceived: 0,
        success: false,
        error: "Client not initialized with wallet",
      };
    }

    try {
      const marketPubkey = new PublicKey(params.marketPubkey);
      const amountBaseUnits = BigInt(Math.floor(params.amount * 1e6));

      const result = await this.client.trading.sellTokensBase({
        market: marketPubkey,
        burnYesToken: params.side === "yes",
        amountBaseUnits,
      });

      return {
        signature: result.signature,
        tokensReceived: result.usdcReceived,
        success: true,
      };
    } catch (error) {
      console.error("Failed to sell tokens:", error);
      return {
        signature: "",
        tokensReceived: 0,
        success: false,
        error: error instanceof Error ? error.message : "Trade failed",
      };
    }
  }

  /**
   * Get current prices for a market
   */
  async getPrices(marketAddress: string): Promise<{ yesPrice: number; noPrice: number } | null> {
    try {
      const client = await this.getReadOnlyClient();
      const marketPubkey = new PublicKey(marketAddress);

      if (!client.trading) {
        // Fetch market and calculate prices manually
        const market = await this.fetchMarket(marketAddress);
        if (market) {
          return { yesPrice: market.yesPrice, noPrice: market.noPrice };
        }
        return null;
      }

      const prices = await client.trading.getPrices(marketPubkey);

      return {
        yesPrice: prices.yesShare,
        noPrice: prices.noShare,
      };
    } catch (error) {
      console.error("Failed to get prices:", error);
      return null;
    }
  }

  /**
   * Redeem winning position after market resolution
   */
  async redeemPosition(marketAddress: string): Promise<{ signature: string; success: boolean; error?: string }> {
    if (!this.client) {
      return { signature: "", success: false, error: "Client not initialized with wallet" };
    }

    try {
      const marketPubkey = new PublicKey(marketAddress);
      const result = await this.client.redeemPosition(marketPubkey);

      return {
        signature: result.signature || "",
        success: true,
      };
    } catch (error) {
      console.error("Failed to redeem position:", error);
      return {
        signature: "",
        success: false,
        error: error instanceof Error ? error.message : "Redeem failed",
      };
    }
  }

  /**
   * Format volume for display
   */
  formatVolume(volume: number): string {
    if (volume >= 1_000_000) {
      return `$${(volume / 1_000_000).toFixed(1)}M`;
    } else if (volume >= 1_000) {
      return `$${(volume / 1_000).toFixed(1)}K`;
    }
    return `$${volume.toFixed(0)}`;
  }

  /**
   * Format liquidity for display
   */
  formatLiquidity(liquidity: number): string {
    if (liquidity >= 1_000_000) {
      return `$${(liquidity / 1_000_000).toFixed(1)}M`;
    } else if (liquidity >= 1_000) {
      return `$${(liquidity / 1_000).toFixed(1)}K`;
    }
    return `$${liquidity.toFixed(0)}`;
  }

  /**
   * Check if market is still active (not ended and not resolved)
   */
  isMarketActive(market: PNPMarket): boolean {
    return !market.resolved && market.endDate > new Date();
  }

  /**
   * Get market status
   */
  getMarketStatus(market: PNPMarket): "active" | "ended" | "resolved" {
    if (market.resolved) return "resolved";
    if (market.endDate <= new Date()) return "ended";
    return "active";
  }
}

export const pnpService = new PNPService();
