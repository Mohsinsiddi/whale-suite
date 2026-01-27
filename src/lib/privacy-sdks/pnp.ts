/**
 * PNP Exchange Service
 * Prediction Markets SDK Integration
 * Supports both V2 AMM and V3 P2P Markets
 *
 * Features:
 * - V2 AMM Markets (liquidity pools)
 * - V3 P2P Markets (peer-to-peer)
 * - Twitter-linked markets (auto settlement)
 * - YouTube-linked markets (auto settlement)
 * - Custom Oracle markets (manual settlement)
 * - Full trading, redemption, and refund support
 *
 * Bounty: $2,500
 *
 * Note: Uses direct proxy API calls for read operations to avoid
 * IDL compatibility issues with pnp-sdk npm package.
 */

import { PublicKey, Connection } from "@solana/web3.js";

// RPC URL - mainnet
const RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC_URL ||
                process.env.NEXT_PUBLIC_SOLANA_RPC ||
                "https://api.mainnet-beta.solana.com";

// PNP Proxy API URL - use local Next.js API route to avoid CORS
// The local route proxies to https://proxyserver-production-f61b.up.railway.app
const PROXY_BASE_URL = "/api/pnp";

// USDC Mint on mainnet
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

// ============ Types ============

export type MarketType = "v2" | "p2p";
export type MarketSource = "general" | "twitter" | "youtube" | "custom_oracle";
export type SettlementType = "like_count" | "retweet_count" | "reply_count" | "view_count" | "follower_count";
export type Comparator = "greater_than" | "less_than" | "equal_to" | "greater_than_or_equal" | "less_than_or_equal";

export interface PNPMarket {
  id: string;
  publicKey: string;
  question: string;
  marketType: MarketType;
  marketSource?: MarketSource;
  yesPrice: number;
  noPrice: number;
  yesMultiplier: number;
  noMultiplier: number;
  yesTokenMint: string;
  noTokenMint: string;
  collateralToken: string;
  marketReserves: number;
  volume: number; // Trading volume (alias for marketReserves)
  liquidity: number; // Pool liquidity (alias for marketReserves)
  endDate: Date;
  resolved: boolean;
  resolvable: boolean;
  winningToken: "yes" | "no" | null;
  creator: string;
  // Social media specific
  tweetId?: string;
  youtubeVideoId?: string;
  // Custom oracle specific
  oracleWallet?: string;
}

export interface MarketPriceData {
  yesPrice: number;
  noPrice: number;
  yesMultiplier: number;
  noMultiplier: number;
  marketReserves: number;
  yesTokenSupply: number;
  noTokenSupply: number;
}

export interface UserPosition {
  marketId: string;
  yesBalance: number;
  noBalance: number;
  collateralBalance: number;
}

// ============ Create Market Params ============

export interface CreateV2MarketParams {
  question: string;
  initialLiquidity: bigint; // in base units (1 USDC = 1_000_000)
  endTime: bigint; // Unix timestamp in seconds
  baseMint?: PublicKey; // defaults to USDC
}

export interface CreateP2PMarketParams {
  question: string;
  side: "yes" | "no";
  initialAmount: bigint; // in base units
  creatorSideCap: bigint; // max amount for creator's side
  endTime: bigint;
  collateralTokenMint?: PublicKey; // defaults to USDC
}

export interface CreateTwitterMarketParams {
  tweetId: string;
  question: string;
  initialLiquidity: bigint;
  endTime: bigint;
  settlementType: SettlementType;
  targetValue: bigint;
  comparator: Comparator;
  baseMint?: PublicKey;
}

export interface CreateP2PTwitterMarketParams {
  tweetId: string;
  question: string;
  side: "yes" | "no";
  initialAmount: bigint;
  creatorSideCap: bigint;
  endTime: bigint;
  settlementType: SettlementType;
  targetValue: bigint;
  comparator: Comparator;
  collateralTokenMint?: PublicKey;
}

export interface CreateYoutubeMarketParams {
  videoId: string;
  question: string;
  initialLiquidity: bigint;
  endTime: bigint;
  settlementType: "view_count" | "like_count";
  targetValue: bigint;
  comparator: Comparator;
  baseMint?: PublicKey;
}

export interface CreateP2PYoutubeMarketParams {
  videoId: string;
  question: string;
  side: "yes" | "no";
  initialAmount: bigint;
  creatorSideCap: bigint;
  endTime: bigint;
  settlementType: "view_count" | "like_count";
  targetValue: bigint;
  comparator: Comparator;
  collateralTokenMint?: PublicKey;
}

export interface CreateCustomOracleMarketParams {
  question: string;
  initialLiquidity: bigint;
  endTime: bigint;
  oracleWallet: PublicKey; // Wallet that can resolve the market
  baseMint?: PublicKey;
}

// ============ Trade Params ============

export interface TradeParams {
  marketPubkey: string;
  side: "yes" | "no";
  amount: number; // in USDC for V2, base units for P2P
}

export interface BuyOutcomeParams {
  marketPubkey: string;
  outcome: "YES" | "NO";
  usdcAmount: number;
}

// ============ Results ============

export interface TradeResult {
  signature: string;
  tokensReceived: number;
  success: boolean;
  error?: string;
}

export interface CreateMarketResult {
  signature: string;
  market: string;
  yesTokenMint?: string;
  noTokenMint?: string;
  success: boolean;
  error?: string;
}

export interface SettlementCriteria {
  settlementType: SettlementType;
  targetValue: bigint;
  comparator: Comparator;
  tweetId?: string;
  youtubeVideoId?: string;
}

export interface SettlementData {
  currentValue: number;
  targetValue: number;
  comparator: string;
  wouldResolveYes: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PNPClientType = any;

// ============ Proxy API Response Types ============

interface ProxyMarketAddressesResponse {
  success: boolean;
  data: {
    count: number;
    addresses: string[];
  };
}

interface ProxyMarketResponse {
  success: boolean;
  data: {
    address: string;
    account: {
      id?: number;
      question: string;
      yes_token_mint: string;
      no_token_mint: string;
      collateral_token: string;
      creator: string;
      end_time: string | number;
      resolved: boolean;
      resolvable: boolean;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      winning_token_id: any; // Can be null, "yes", "no", "none", or object variants
      market_reserves?: string | number;
      yes_supply?: string | number;
      no_supply?: string | number;
    };
  };
}

// ProxyBatchDataResponse - reserved for future batch endpoint usage
// interface ProxyBatchDataResponse {
//   success: boolean;
//   data: {
//     markets: Array<{
//       address: string;
//       account: ProxyMarketResponse["data"]["account"];
//     }>;
//   };
// }

// ============ Service ============

class PNPService {
  private client: PNPClientType | null = null;
  private connection: Connection;
  private sdkInitialized: boolean = false;
  private sdkInitError: Error | null = null;

  constructor() {
    this.connection = new Connection(RPC_URL);
  }

  /**
   * Fetch JSON from proxy API
   */
  private async proxyFetch<T>(endpoint: string): Promise<T> {
    const url = `${PROXY_BASE_URL}${endpoint}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Proxy API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Try to initialize SDK client (may fail due to IDL issues)
   * Returns true if successful, false otherwise
   */
  async tryInitSDK(privateKey?: Uint8Array | string): Promise<boolean> {
    if (this.sdkInitialized) return true;
    if (this.sdkInitError) return false;

    try {
      const sdk = await import("pnp-sdk");
      if (privateKey) {
        this.client = new sdk.PNPClient(RPC_URL, privateKey);
      } else {
        this.client = new sdk.PNPClient(RPC_URL);
      }
      this.sdkInitialized = true;
      return true;
    } catch (error) {
      console.warn("PNP SDK initialization failed (IDL compatibility issue), using proxy API only:", error);
      this.sdkInitError = error instanceof Error ? error : new Error(String(error));
      return false;
    }
  }

  /**
   * Initialize client with wallet for write operations
   */
  async initWithWallet(privateKey: Uint8Array | string): Promise<PNPClientType | null> {
    const success = await this.tryInitSDK(privateKey);
    return success ? this.client : null;
  }

  /**
   * Get the write client (must be initialized first)
   */
  getWriteClient(): PNPClientType | null {
    return this.client;
  }

  /**
   * Check if SDK is available for write operations
   */
  isSDKAvailable(): boolean {
    return this.sdkInitialized && this.client !== null;
  }

  // ============ V2 AMM Markets ============

  /**
   * Fetch V2 AMM markets using proxy API
   * @param limit - Max number of markets to fetch (default 50)
   * @param offset - Starting index for pagination (default 0)
   */
  async fetchV2Markets(limit: number = 50, offset: number = 0): Promise<PNPMarket[]> {
    try {
      // First get market addresses from proxy
      const addressResponse = await this.proxyFetch<ProxyMarketAddressesResponse>(
        "/market-oracle/market-addresses"
      );

      if (!addressResponse?.success || !addressResponse.data?.addresses) {
        return [];
      }

      // Apply pagination to addresses
      const allAddresses = addressResponse.data.addresses;
      const addresses = allAddresses.slice(offset, offset + limit);

      if (addresses.length === 0) {
        return [];
      }

      // Fetch market details in parallel batches
      const markets: PNPMarket[] = [];
      const batchSize = 10; // Smaller batch for parallel requests

      for (let i = 0; i < addresses.length; i += batchSize) {
        const batch = addresses.slice(i, i + batchSize);
        const batchMarkets = await Promise.all(
          batch.map(async (address) => {
            try {
              return await this.fetchMarketFromProxy(address, "v2");
            } catch (e) {
              console.warn(`Failed to fetch market ${address}:`, e);
              return null;
            }
          })
        );
        markets.push(...batchMarkets.filter((m): m is PNPMarket => m !== null));
      }

      return markets.sort((a, b) => b.marketReserves - a.marketReserves);
    } catch (error) {
      console.error("Failed to fetch V2 markets:", error);
      throw error;
    }
  }

  /**
   * Create a placeholder market from address (when full data unavailable)
   */
  private createPlaceholderMarket(address: string, type: MarketType): PNPMarket {
    return {
      id: address,
      publicKey: address,
      question: `Market ${address.slice(0, 8)}...${address.slice(-4)}`,
      marketType: type,
      yesPrice: 0.5,
      noPrice: 0.5,
      yesMultiplier: 2,
      noMultiplier: 2,
      yesTokenMint: "",
      noTokenMint: "",
      collateralToken: "",
      marketReserves: 0,
      volume: 0,
      liquidity: 0,
      endDate: new Date(),
      resolved: false,
      resolvable: false,
      winningToken: null,
      creator: "",
    };
  }

  /**
   * Fetch single market from proxy API
   */
  private async fetchMarketFromProxy(address: string, type: MarketType): Promise<PNPMarket | null> {
    try {
      const response = await this.proxyFetch<ProxyMarketResponse>(
        `/market-oracle/market/${encodeURIComponent(address)}`
      );

      // Check for valid response - it might have account or different structure
      if (!response?.success) {
        // Return placeholder with address if API fails
        return this.createPlaceholderMarket(address, type);
      }

      const data = response.data;

      // Handle P2P response format (has category, reasoning fields)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((data as any)?.category || (data as any)?.reasoning) {
        // This is a P2P market with resolution data - create placeholder
        const market = this.createPlaceholderMarket(address, type);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        market.resolvable = (data as any)?.resolvable ?? false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const reasoning = (data as any)?.reasoning || "";
        // Try to extract question from reasoning
        if (reasoning.includes("The question asks")) {
          const match = reasoning.match(/The question asks about ([^.]+)/);
          if (match) {
            market.question = match[1].slice(0, 100);
          }
        }
        return market;
      }

      // Handle V2 response format with account data
      if (!data?.account) {
        return this.createPlaceholderMarket(address, type);
      }

      const { account } = data;

      // Parse winning token
      let winningToken: "yes" | "no" | null = null;
      if (account.winning_token_id !== null && account.winning_token_id !== "none") {
        if (typeof account.winning_token_id === "object") {
          if ("yes" in account.winning_token_id) winningToken = "yes";
          else if ("no" in account.winning_token_id) winningToken = "no";
        } else if (account.winning_token_id === "yes") {
          winningToken = "yes";
        } else if (account.winning_token_id === "no") {
          winningToken = "no";
        }
      }

      // Parse reserves
      const reserves = Number(account.market_reserves || 0) / 1e6;

      // Calculate prices from supply ratios if available
      const yesSupply = Number(account.yes_supply || 0);
      const noSupply = Number(account.no_supply || 0);
      const totalSupply = yesSupply + noSupply;

      let yesPrice = 0.5;
      let noPrice = 0.5;

      if (totalSupply > 0) {
        yesPrice = noSupply / totalSupply;
        noPrice = yesSupply / totalSupply;
      }

      const yesMultiplier = yesPrice > 0 ? 1 / yesPrice : 2;
      const noMultiplier = noPrice > 0 ? 1 / noPrice : 2;

      return {
        id: String(account.id || address),
        publicKey: address,
        question: account.question || `Market ${address.slice(0, 8)}...`,
        marketType: type,
        yesPrice,
        noPrice,
        yesMultiplier,
        noMultiplier,
        yesTokenMint: String(account.yes_token_mint || ""),
        noTokenMint: String(account.no_token_mint || ""),
        collateralToken: String(account.collateral_token || ""),
        marketReserves: reserves,
        volume: reserves,
        liquidity: reserves,
        endDate: new Date(Number(account.end_time || 0) * 1000),
        resolved: account.resolved || false,
        resolvable: account.resolvable || false,
        winningToken,
        creator: String(account.creator || ""),
      };
    } catch (error) {
      console.error(`Failed to fetch market ${address}:`, error);
      // Return placeholder on error
      return this.createPlaceholderMarket(address, type);
    }
  }

  /**
   * Fetch V2 market addresses from proxy
   */
  async fetchV2MarketAddresses(): Promise<string[]> {
    try {
      const response = await this.proxyFetch<ProxyMarketAddressesResponse>(
        "/market-oracle/market-addresses"
      );
      return response?.data?.addresses || [];
    } catch (error) {
      console.error("Failed to fetch V2 market addresses:", error);
      return [];
    }
  }

  /**
   * Get real-time V2 market prices (uses proxy API)
   */
  async getMarketPriceV2(marketAddress: string): Promise<MarketPriceData> {
    try {
      const response = await this.proxyFetch<ProxyMarketResponse>(
        `/market-oracle/market/${encodeURIComponent(marketAddress)}`
      );

      if (!response?.success || !response.data?.account) {
        throw new Error("Failed to fetch market price data");
      }

      const { account } = response.data;

      const yesSupply = Number(account.yes_supply || 0);
      const noSupply = Number(account.no_supply || 0);
      const totalSupply = yesSupply + noSupply;
      const reserves = Number(account.market_reserves || 0) / 1e6;

      let yesPrice = 0.5;
      let noPrice = 0.5;

      if (totalSupply > 0) {
        yesPrice = noSupply / totalSupply;
        noPrice = yesSupply / totalSupply;
      }

      return {
        yesPrice,
        noPrice,
        yesMultiplier: yesPrice > 0 ? 1 / yesPrice : 2,
        noMultiplier: noPrice > 0 ? 1 / noPrice : 2,
        marketReserves: reserves,
        yesTokenSupply: yesSupply,
        noTokenSupply: noSupply,
      };
    } catch (error) {
      console.error("Failed to get market price:", error);
      throw error;
    }
  }

  /**
   * Create V2 AMM market (general)
   * Requires SDK to be initialized with wallet
   */
  async createV2Market(params: CreateV2MarketParams): Promise<CreateMarketResult> {
    if (!this.isSDKAvailable()) {
      return {
        signature: "",
        market: "",
        success: false,
        error: "SDK not available. Trading requires SDK initialization which may have IDL compatibility issues.",
      };
    }

    if (!this.client?.market) {
      return { signature: "", market: "", success: false, error: "Client not initialized with wallet" };
    }

    try {
      const result = await this.client.market.createMarket({
        question: params.question,
        initialLiquidity: params.initialLiquidity,
        endTime: params.endTime,
        baseMint: params.baseMint || USDC_MINT,
      });

      return {
        signature: result.signature,
        market: result.market.toBase58(),
        success: true,
      };
    } catch (error) {
      console.error("Failed to create V2 market:", error);
      return {
        signature: "",
        market: "",
        success: false,
        error: error instanceof Error ? error.message : "Failed to create market",
      };
    }
  }

  /**
   * Create V2 Twitter-linked market
   * Auto-settles based on tweet metrics (likes, retweets, etc.)
   */
  async createTwitterMarket(params: CreateTwitterMarketParams): Promise<CreateMarketResult> {
    if (!this.client) {
      return { signature: "", market: "", success: false, error: "Client not initialized with wallet" };
    }

    try {
      const result = await this.client.createMarketTwitter({
        tweetId: params.tweetId,
        question: params.question,
        initialLiquidity: params.initialLiquidity,
        endTime: params.endTime,
        settlementType: params.settlementType,
        targetValue: params.targetValue,
        comparator: params.comparator,
        baseMint: params.baseMint || USDC_MINT,
      });

      return {
        signature: result.signature,
        market: typeof result.market === "string" ? result.market : result.market.toBase58(),
        success: true,
      };
    } catch (error) {
      console.error("Failed to create Twitter market:", error);
      return {
        signature: "",
        market: "",
        success: false,
        error: error instanceof Error ? error.message : "Failed to create Twitter market",
      };
    }
  }

  /**
   * Create V2 YouTube-linked market
   * Auto-settles based on video metrics (views, likes)
   */
  async createYoutubeMarket(params: CreateYoutubeMarketParams): Promise<CreateMarketResult> {
    if (!this.client) {
      return { signature: "", market: "", success: false, error: "Client not initialized with wallet" };
    }

    try {
      const result = await this.client.createMarketYoutube({
        videoId: params.videoId,
        question: params.question,
        initialLiquidity: params.initialLiquidity,
        endTime: params.endTime,
        settlementType: params.settlementType,
        targetValue: params.targetValue,
        comparator: params.comparator,
        baseMint: params.baseMint || USDC_MINT,
      });

      return {
        signature: result.signature,
        market: typeof result.market === "string" ? result.market : result.market.toBase58(),
        success: true,
      };
    } catch (error) {
      console.error("Failed to create YouTube market:", error);
      return {
        signature: "",
        market: "",
        success: false,
        error: error instanceof Error ? error.message : "Failed to create YouTube market",
      };
    }
  }

  /**
   * Create V2 Custom Oracle market
   * Resolved manually by specified oracle wallet
   */
  async createCustomOracleMarket(params: CreateCustomOracleMarketParams): Promise<CreateMarketResult> {
    if (!this.client) {
      return { signature: "", market: "", success: false, error: "Client not initialized with wallet" };
    }

    try {
      const result = await this.client.createMarketWithCustomOracle({
        question: params.question,
        initialLiquidity: params.initialLiquidity,
        endTime: params.endTime,
        oracleWallet: params.oracleWallet,
        baseMint: params.baseMint || USDC_MINT,
      });

      return {
        signature: result.signature,
        market: typeof result.market === "string" ? result.market : result.market.toBase58(),
        success: true,
      };
    } catch (error) {
      console.error("Failed to create Custom Oracle market:", error);
      return {
        signature: "",
        market: "",
        success: false,
        error: error instanceof Error ? error.message : "Failed to create Custom Oracle market",
      };
    }
  }

  /**
   * Buy tokens on V2 AMM market
   * Requires SDK to be initialized with wallet
   */
  async buyTokensV2(params: TradeParams): Promise<TradeResult> {
    if (!this.isSDKAvailable()) {
      return {
        signature: "",
        tokensReceived: 0,
        success: false,
        error: "Trading requires SDK initialization. The SDK may have IDL compatibility issues with this npm version.",
      };
    }

    if (!this.client?.trading) {
      return { signature: "", tokensReceived: 0, success: false, error: "Client not initialized with wallet" };
    }

    try {
      const result = await this.client.trading.buyTokensUsdc({
        market: new PublicKey(params.marketPubkey),
        buyYesToken: params.side === "yes",
        amountUsdc: params.amount,
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
   * Sell tokens on V2 AMM market
   * Requires SDK to be initialized with wallet
   */
  async sellTokensV2(params: TradeParams & { tokenAmount: number }): Promise<TradeResult> {
    if (!this.isSDKAvailable()) {
      return {
        signature: "",
        tokensReceived: 0,
        success: false,
        error: "Trading requires SDK initialization. The SDK may have IDL compatibility issues with this npm version.",
      };
    }

    if (!this.client?.trading) {
      return { signature: "", tokensReceived: 0, success: false, error: "Client not initialized with wallet" };
    }

    try {
      const result = await this.client.trading.sellOutcome({
        market: new PublicKey(params.marketPubkey),
        outcome: params.side.toUpperCase(),
        tokenAmount: params.tokenAmount,
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
   * Buy outcome tokens on V2 market (alternative trading method)
   * Requires SDK to be initialized with wallet
   */
  async buyOutcome(params: BuyOutcomeParams): Promise<TradeResult> {
    if (!this.isSDKAvailable()) {
      return {
        signature: "",
        tokensReceived: 0,
        success: false,
        error: "Trading requires SDK initialization. The SDK may have IDL compatibility issues with this npm version.",
      };
    }

    if (!this.client?.trading) {
      return { signature: "", tokensReceived: 0, success: false, error: "Client not initialized with wallet" };
    }

    try {
      const result = await this.client.trading.buyOutcome({
        market: new PublicKey(params.marketPubkey),
        outcome: params.outcome,
        usdcAmount: params.usdcAmount,
      });

      return {
        signature: result.signature,
        tokensReceived: result.tokensReceived,
        success: true,
      };
    } catch (error) {
      console.error("Failed to buy outcome:", error);
      return {
        signature: "",
        tokensReceived: 0,
        success: false,
        error: error instanceof Error ? error.message : "Trade failed",
      };
    }
  }

  // ============ V3 P2P Markets ============

  /**
   * Fetch P2P market addresses from proxy
   */
  async fetchP2PMarketAddresses(): Promise<string[]> {
    try {
      const response = await this.proxyFetch<ProxyMarketAddressesResponse>(
        "/market-oracle/v3-market-addresses"
      );
      return response?.data?.addresses || [];
    } catch (error) {
      console.error("Failed to fetch P2P market addresses:", error);
      return [];
    }
  }

  /**
   * Fetch P2P markets with details using proxy API
   * @param limit - Max number of markets to fetch (default 20)
   * @param offset - Starting index for pagination (default 0)
   */
  async fetchP2PMarkets(limit: number = 20, offset: number = 0): Promise<PNPMarket[]> {
    try {
      const allAddresses = await this.fetchP2PMarketAddresses();
      const addresses = allAddresses.slice(offset, offset + limit);

      if (addresses.length === 0) {
        return [];
      }

      const markets: PNPMarket[] = [];
      const batchSize = 10;

      for (let i = 0; i < addresses.length; i += batchSize) {
        const batch = addresses.slice(i, i + batchSize);
        const batchMarkets = await Promise.all(
          batch.map(async (address) => {
            try {
              return await this.fetchMarketFromProxy(address, "p2p");
            } catch (e) {
              console.warn(`Failed to fetch P2P market ${address}:`, e);
              return null;
            }
          })
        );
        markets.push(...batchMarkets.filter((m): m is PNPMarket => m !== null));
      }

      return markets;
    } catch (error) {
      console.error("Failed to fetch P2P markets:", error);
      return [];
    }
  }

  /**
   * Create P2P market (general)
   */
  async createP2PMarket(params: CreateP2PMarketParams): Promise<CreateMarketResult> {
    if (!this.client) {
      return { signature: "", market: "", success: false, error: "Client not initialized with wallet" };
    }

    try {
      const result = await this.client.createP2PMarketGeneral({
        question: params.question,
        side: params.side,
        initialAmount: params.initialAmount,
        creatorSideCap: params.creatorSideCap,
        endTime: params.endTime,
        collateralTokenMint: params.collateralTokenMint || USDC_MINT,
      });

      return {
        signature: result.signature,
        market: typeof result.market === "string" ? result.market : result.market.toBase58(),
        yesTokenMint: result.yesTokenMint,
        noTokenMint: result.noTokenMint,
        success: true,
      };
    } catch (error) {
      console.error("Failed to create P2P market:", error);
      return {
        signature: "",
        market: "",
        success: false,
        error: error instanceof Error ? error.message : "Failed to create market",
      };
    }
  }

  /**
   * Create P2P Twitter-linked market
   * Auto-settles based on tweet metrics
   */
  async createP2PTwitterMarket(params: CreateP2PTwitterMarketParams): Promise<CreateMarketResult> {
    if (!this.client) {
      return { signature: "", market: "", success: false, error: "Client not initialized with wallet" };
    }

    try {
      const result = await this.client.createP2PMarketTwitter({
        tweetId: params.tweetId,
        question: params.question,
        side: params.side,
        initialAmount: params.initialAmount,
        creatorSideCap: params.creatorSideCap,
        endTime: params.endTime,
        settlementType: params.settlementType,
        targetValue: params.targetValue,
        comparator: params.comparator,
        collateralTokenMint: params.collateralTokenMint || USDC_MINT,
      });

      return {
        signature: result.signature,
        market: typeof result.market === "string" ? result.market : result.market.toBase58(),
        yesTokenMint: result.yesTokenMint,
        noTokenMint: result.noTokenMint,
        success: true,
      };
    } catch (error) {
      console.error("Failed to create P2P Twitter market:", error);
      return {
        signature: "",
        market: "",
        success: false,
        error: error instanceof Error ? error.message : "Failed to create P2P Twitter market",
      };
    }
  }

  /**
   * Create P2P YouTube-linked market
   * Auto-settles based on video metrics
   */
  async createP2PYoutubeMarket(params: CreateP2PYoutubeMarketParams): Promise<CreateMarketResult> {
    if (!this.client) {
      return { signature: "", market: "", success: false, error: "Client not initialized with wallet" };
    }

    try {
      const result = await this.client.createP2PMarketYoutube({
        videoId: params.videoId,
        question: params.question,
        side: params.side,
        initialAmount: params.initialAmount,
        creatorSideCap: params.creatorSideCap,
        endTime: params.endTime,
        settlementType: params.settlementType,
        targetValue: params.targetValue,
        comparator: params.comparator,
        collateralTokenMint: params.collateralTokenMint || USDC_MINT,
      });

      return {
        signature: result.signature,
        market: typeof result.market === "string" ? result.market : result.market.toBase58(),
        yesTokenMint: result.yesTokenMint,
        noTokenMint: result.noTokenMint,
        success: true,
      };
    } catch (error) {
      console.error("Failed to create P2P YouTube market:", error);
      return {
        signature: "",
        market: "",
        success: false,
        error: error instanceof Error ? error.message : "Failed to create P2P YouTube market",
      };
    }
  }

  /**
   * Trade on P2P market
   */
  async tradeP2PMarket(params: TradeParams & { amountBaseUnits: bigint }): Promise<TradeResult> {
    if (!this.client) {
      return { signature: "", tokensReceived: 0, success: false, error: "Client not initialized with wallet" };
    }

    try {
      const result = await this.client.tradeP2PMarket({
        market: new PublicKey(params.marketPubkey),
        side: params.side,
        amount: params.amountBaseUnits,
      });

      return {
        signature: result.signature,
        tokensReceived: 0, // P2P trades don't return token count
        success: true,
      };
    } catch (error) {
      console.error("Failed to trade P2P:", error);
      return {
        signature: "",
        tokensReceived: 0,
        success: false,
        error: error instanceof Error ? error.message : "Trade failed",
      };
    }
  }

  // ============ Common Methods ============

  /**
   * Get total market counts (for pagination)
   */
  async getMarketCounts(): Promise<{ v2: number; p2p: number; total: number }> {
    try {
      const [v2Response, p2pResponse] = await Promise.all([
        this.proxyFetch<ProxyMarketAddressesResponse>("/market-oracle/market-addresses"),
        this.proxyFetch<ProxyMarketAddressesResponse>("/market-oracle/v3-market-addresses"),
      ]);

      const v2Count = v2Response?.data?.count || 0;
      const p2pCount = p2pResponse?.data?.count || 0;

      return {
        v2: v2Count,
        p2p: p2pCount,
        total: v2Count + p2pCount,
      };
    } catch (error) {
      console.error("Failed to get market counts:", error);
      return { v2: 0, p2p: 0, total: 0 };
    }
  }

  /**
   * Fetch markets with pagination (V2 + P2P combined)
   * @param limit - Max number of markets to fetch (default 30)
   * @param offset - Starting index for pagination (default 0)
   */
  async fetchAllMarkets(limit: number = 30, offset: number = 0): Promise<PNPMarket[]> {
    try {
      // Fetch both types with proportional limits
      const v2Limit = Math.ceil(limit * 0.7); // 70% V2
      const p2pLimit = Math.floor(limit * 0.3); // 30% P2P

      const [v2Markets, p2pMarkets] = await Promise.all([
        this.fetchV2Markets(v2Limit, offset),
        this.fetchP2PMarkets(p2pLimit, Math.floor(offset * 0.3)),
      ]);

      return [...v2Markets, ...p2pMarkets].sort((a, b) => b.marketReserves - a.marketReserves);
    } catch (error) {
      console.error("Failed to fetch all markets:", error);
      return [];
    }
  }

  /**
   * Fetch single market by address using proxy API
   */
  async fetchMarket(marketAddress: string): Promise<PNPMarket | null> {
    try {
      // Check if it's a V2 or P2P market by checking both lists
      const [v2Addresses, p2pAddresses] = await Promise.all([
        this.fetchV2MarketAddresses(),
        this.fetchP2PMarketAddresses(),
      ]);

      const isV2 = v2Addresses.includes(marketAddress);
      const isP2P = p2pAddresses.includes(marketAddress);
      const marketType: MarketType = isV2 ? "v2" : isP2P ? "p2p" : "v2"; // Default to v2

      return await this.fetchMarketFromProxy(marketAddress, marketType);
    } catch (error) {
      console.error("Failed to fetch market:", error);
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
      const result = await this.client.redeemPosition(new PublicKey(marketAddress));

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
   * Claim refund for V2 market
   */
  async claimV2Refund(marketAddress: string): Promise<{ signature: string; success: boolean; error?: string }> {
    if (!this.client) {
      return { signature: "", success: false, error: "Client not initialized with wallet" };
    }

    try {
      const result = await this.client.claimMarketRefund(new PublicKey(marketAddress));

      return {
        signature: result.signature,
        success: true,
      };
    } catch (error) {
      console.error("Failed to claim V2 refund:", error);
      return {
        signature: "",
        success: false,
        error: error instanceof Error ? error.message : "Refund failed",
      };
    }
  }

  /**
   * Claim refund for P2P market
   */
  async claimP2PRefund(marketAddress: string): Promise<{ signature: string; success: boolean; error?: string }> {
    if (!this.client) {
      return { signature: "", success: false, error: "Client not initialized with wallet" };
    }

    try {
      const result = await this.client.claimP2PMarketRefund(new PublicKey(marketAddress));

      return {
        signature: result.signature,
        success: true,
      };
    } catch (error) {
      console.error("Failed to claim P2P refund:", error);
      return {
        signature: "",
        success: false,
        error: error instanceof Error ? error.message : "Refund failed",
      };
    }
  }

  // ============ Custom Oracle Functions ============

  /**
   * Set market as resolvable (oracle only)
   * Must wait 15-minute buffer period after end time before calling
   */
  async setMarketResolvable(marketAddress: string): Promise<{ signature: string; success: boolean; error?: string }> {
    if (!this.client) {
      return { signature: "", success: false, error: "Client not initialized with wallet" };
    }

    try {
      const result = await this.client.setMarketResolvable(new PublicKey(marketAddress));

      return {
        signature: result.signature,
        success: true,
      };
    } catch (error) {
      console.error("Failed to set market resolvable:", error);
      return {
        signature: "",
        success: false,
        error: error instanceof Error ? error.message : "Failed to set resolvable",
      };
    }
  }

  /**
   * Settle market with winning outcome (oracle only)
   */
  async settleMarket(
    marketAddress: string,
    winningOutcome: "yes" | "no"
  ): Promise<{ signature: string; success: boolean; error?: string }> {
    if (!this.client) {
      return { signature: "", success: false, error: "Client not initialized with wallet" };
    }

    try {
      const result = await this.client.settleMarket({
        market: new PublicKey(marketAddress),
        winningOutcome,
      });

      return {
        signature: result.signature,
        success: true,
      };
    } catch (error) {
      console.error("Failed to settle market:", error);
      return {
        signature: "",
        success: false,
        error: error instanceof Error ? error.message : "Failed to settle market",
      };
    }
  }

  // ============ Settlement Data Functions ============

  /**
   * Fetch settlement criteria from proxy API (for Twitter/YouTube markets)
   */
  async fetchSettlementCriteria(marketAddress: string): Promise<SettlementCriteria | null> {
    try {
      const response = await this.proxyFetch<{
        success: boolean;
        data: SettlementCriteria;
      }>(`/market-oracle/market/${encodeURIComponent(marketAddress)}`);

      if (!response?.success || !response.data) {
        return null;
      }

      return response.data;
    } catch (error) {
      console.error("Failed to fetch settlement criteria:", error);
      return null;
    }
  }

  /**
   * Get settlement criteria from proxy API
   */
  async getSettlementCriteria(marketAddress: string): Promise<SettlementCriteria | null> {
    return this.fetchSettlementCriteria(marketAddress);
  }

  /**
   * Fetch current settlement data (current metrics vs target)
   */
  async fetchSettlementData(marketAddress: string): Promise<SettlementData | null> {
    try {
      const response = await this.proxyFetch<{
        success: boolean;
        data: SettlementData;
      }>(`/market-oracle/market/${encodeURIComponent(marketAddress)}/settlement-data`);

      if (!response?.success || !response.data) {
        return null;
      }

      return {
        currentValue: response.data.currentValue,
        targetValue: response.data.targetValue,
        comparator: response.data.comparator,
        wouldResolveYes: response.data.wouldResolveYes,
      };
    } catch (error) {
      console.error("Failed to fetch settlement data:", error);
      return null;
    }
  }

  // ============ Token Mint Utilities ============

  /**
   * Get YES/NO token mints for a market from market data
   */
  async deriveTokenMints(marketAddress: string): Promise<{ yesTokenMint: string; noTokenMint: string } | null> {
    try {
      const market = await this.fetchMarket(marketAddress);
      if (!market) return null;

      return {
        yesTokenMint: market.yesTokenMint,
        noTokenMint: market.noTokenMint,
      };
    } catch (error) {
      console.error("Failed to derive token mints:", error);
      return null;
    }
  }

  /**
   * Fetch token mints from market account via proxy
   */
  async fetchTokenMints(marketAddress: string): Promise<{ yesTokenMint: string; noTokenMint: string } | null> {
    return this.deriveTokenMints(marketAddress);
  }

  // ============ Backward Compatibility Aliases ============

  /**
   * Alias for fetchAllMarkets (backward compatibility)
   * @param limit - Max number of markets (default 30)
   */
  async fetchMarkets(limit: number = 30): Promise<PNPMarket[]> {
    return this.fetchAllMarkets(limit, 0);
  }

  /**
   * Alias for buyTokensV2 (backward compatibility)
   */
  async buyTokens(params: TradeParams): Promise<TradeResult> {
    return this.buyTokensV2(params);
  }

  /**
   * Alias for sellTokensV2 (backward compatibility)
   */
  async sellTokens(params: TradeParams & { tokenAmount: number }): Promise<TradeResult> {
    return this.sellTokensV2(params);
  }

  /**
   * Alias for getMarketPriceV2 (backward compatibility)
   */
  async getPrices(marketAddress: string): Promise<MarketPriceData> {
    return this.getMarketPriceV2(marketAddress);
  }

  // ============ Utilities ============

  /**
   * Check if market is active
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

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    if (amount >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(1)}M`;
    } else if (amount >= 1_000) {
      return `$${(amount / 1_000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(2)}`;
  }

  /**
   * Format price as percentage
   */
  formatPercent(price: number): string {
    return `${(price * 100).toFixed(1)}%`;
  }

  /**
   * Format multiplier
   */
  formatMultiplier(multiplier: number): string {
    return `${multiplier.toFixed(2)}x`;
  }

  /**
   * Format volume for display
   */
  formatVolume(volume: number): string {
    return this.formatCurrency(volume);
  }

  /**
   * Format liquidity for display
   */
  formatLiquidity(liquidity: number): string {
    return this.formatCurrency(liquidity);
  }

  /**
   * Get user positions (placeholder - would need token balance checks)
   */
  async getUserPositions(walletAddress: string): Promise<UserPosition[]> {
    // TODO: Implement by checking token balances for each market's YES/NO tokens
    console.log("getUserPositions called for:", walletAddress);
    return [];
  }

  /**
   * Check if market is a Twitter market
   */
  isTwitterMarket(market: PNPMarket): boolean {
    return market.marketSource === "twitter" || !!market.tweetId;
  }

  /**
   * Check if market is a YouTube market
   */
  isYoutubeMarket(market: PNPMarket): boolean {
    return market.marketSource === "youtube" || !!market.youtubeVideoId;
  }

  /**
   * Check if market has custom oracle
   */
  isCustomOracleMarket(market: PNPMarket): boolean {
    return market.marketSource === "custom_oracle" || !!market.oracleWallet;
  }

  /**
   * Check if market can be settled (past buffer period)
   * Custom oracle markets have 15-minute buffer after end time
   */
  canBeSettled(market: PNPMarket): boolean {
    if (market.resolved) return false;
    const bufferMs = 15 * 60 * 1000; // 15 minutes
    const settleTime = new Date(market.endDate.getTime() + bufferMs);
    return new Date() >= settleTime;
  }

  /**
   * Get time until market can be settled
   */
  getTimeUntilSettlement(market: PNPMarket): number {
    const bufferMs = 15 * 60 * 1000; // 15 minutes
    const settleTime = new Date(market.endDate.getTime() + bufferMs);
    return Math.max(0, settleTime.getTime() - Date.now());
  }

  /**
   * Get Twitter URL from tweet ID
   */
  getTweetUrl(tweetId: string): string {
    return `https://twitter.com/i/status/${tweetId}`;
  }

  /**
   * Get YouTube URL from video ID
   */
  getYoutubeUrl(videoId: string): string {
    return `https://youtube.com/watch?v=${videoId}`;
  }

  /**
   * Format settlement type for display
   */
  formatSettlementType(type: SettlementType): string {
    const labels: Record<SettlementType, string> = {
      like_count: "Likes",
      retweet_count: "Retweets",
      reply_count: "Replies",
      view_count: "Views",
      follower_count: "Followers",
    };
    return labels[type] || type;
  }

  /**
   * Format comparator for display
   */
  formatComparator(comparator: Comparator): string {
    const labels: Record<Comparator, string> = {
      greater_than: ">",
      less_than: "<",
      equal_to: "=",
      greater_than_or_equal: "≥",
      less_than_or_equal: "≤",
    };
    return labels[comparator] || comparator;
  }

  /**
   * Convert amount to base units (USDC has 6 decimals)
   */
  toBaseUnits(amount: number, decimals: number = 6): bigint {
    return BigInt(Math.floor(amount * Math.pow(10, decimals)));
  }

  /**
   * Convert base units to decimal amount
   */
  fromBaseUnits(amount: bigint | number, decimals: number = 6): number {
    return Number(amount) / Math.pow(10, decimals);
  }

  /**
   * Get Solscan URL for transaction
   */
  getSolscanTxUrl(signature: string): string {
    return `https://solscan.io/tx/${signature}`;
  }

  /**
   * Get Solscan URL for account
   */
  getSolscanAccountUrl(address: string): string {
    return `https://solscan.io/account/${address}`;
  }
}

export const pnpService = new PNPService();
