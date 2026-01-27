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

import { PublicKey, Connection, Transaction, VersionedTransaction } from "@solana/web3.js";

// RPC URL - mainnet
const RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC_URL ||
                process.env.NEXT_PUBLIC_SOLANA_RPC ||
                "https://api.mainnet-beta.solana.com";

// PNP Proxy API URL - use local Next.js API route to avoid CORS
// The local route proxies to https://proxyserver-production-f61b.up.railway.app
const PROXY_BASE_URL = "/api/pnp";

// USDC Mint on mainnet
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

/**
 * Transaction signer function type (same pattern as ShadowWire)
 */
export type TransactionSigner = (tx: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>;

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
    this.connection = new Connection(RPC_URL, "confirmed");
  }

  /**
   * Sign and send transaction directly (ShadowWire pattern)
   * This bypasses SDK's internal send and uses direct sendRawTransaction
   */
  private async signAndSendTransaction(
    tx: Transaction | VersionedTransaction,
    signTransaction: TransactionSigner
  ): Promise<string> {
    console.log("[PNP] Signing transaction...");

    // Sign the transaction
    const signedTx = await signTransaction(tx);

    console.log("[PNP] Transaction signed, sending raw transaction...");

    // Serialize the signed transaction
    const serialized = signedTx.serialize();

    // Send directly with skipPreflight to avoid simulation issues
    const signature = await this.connection.sendRawTransaction(serialized, {
      skipPreflight: true,
      preflightCommitment: "confirmed",
      maxRetries: 3,
    });

    console.log("[PNP] Transaction sent! Signature:", signature);

    // Confirm the transaction
    const confirmation = await this.connection.confirmTransaction(signature, "confirmed");

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }

    console.log("[PNP] Transaction confirmed!");
    return signature;
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

  // ============ SDK-based Market Fetching (Recommended) ============

  /**
   * Fetch ALL markets directly from chain using SDK
   * This is the recommended method - returns all markets with full data including creator
   * @returns All markets with creator info for filtering
   */
  async fetchAllMarketsFromSDK(): Promise<PNPMarket[]> {
    try {
      console.log("[PNP] Fetching all markets from SDK...");

      // Import and create a read-only client
      const { PNPClient } = await import("pnp-sdk");
      const readClient = new PNPClient(RPC_URL);

      // Fetch all markets from chain
      const response = await readClient.fetchMarkets();

      if (!response?.data) {
        console.warn("[PNP] No markets data from SDK");
        return [];
      }

      console.log(`[PNP] Fetched ${response.count} markets from SDK`);

      // Transform SDK response to our PNPMarket format
      const markets: PNPMarket[] = response.data.map((item) => {
        const account = item.account;

        // Parse winning token
        let winningToken: "yes" | "no" | null = null;
        if (account.winning_token_id !== null && account.winning_token_id !== "none") {
          if (typeof account.winning_token_id === "object") {
            if ("yes" in (account.winning_token_id as Record<string, unknown>)) winningToken = "yes";
            else if ("no" in (account.winning_token_id as Record<string, unknown>)) winningToken = "no";
          } else if (account.winning_token_id === "yes") {
            winningToken = "yes";
          } else if (account.winning_token_id === "no") {
            winningToken = "no";
          }
        }

        // Parse reserves and calculate prices
        const reserves = Number(account.market_reserves || 0) / 1e6;
        const yesSupply = Number(account.yes_token_supply_minted || 0);
        const noSupply = Number(account.no_token_supply_minted || 0);
        const totalSupply = yesSupply + noSupply;

        let yesPrice = 0.5;
        let noPrice = 0.5;
        if (totalSupply > 0) {
          yesPrice = noSupply / totalSupply;
          noPrice = yesSupply / totalSupply;
        }

        // Get creator as string (handle PublicKey objects)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const creatorVal = account.creator as any;
        const creatorStr = typeof creatorVal === "string"
          ? creatorVal
          : creatorVal?.toBase58?.() || creatorVal?.toString?.() || String(creatorVal || "");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pubKeyVal = item.publicKey as any;
        const publicKeyStr = typeof pubKeyVal === "string"
          ? pubKeyVal
          : pubKeyVal?.toBase58?.() || pubKeyVal?.toString?.() || String(pubKeyVal || "");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const yesTokenVal = account.yes_token_mint as any;
        const yesTokenStr = typeof yesTokenVal === "string"
          ? yesTokenVal
          : yesTokenVal?.toBase58?.() || yesTokenVal?.toString?.() || "";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const noTokenVal = account.no_token_mint as any;
        const noTokenStr = typeof noTokenVal === "string"
          ? noTokenVal
          : noTokenVal?.toBase58?.() || noTokenVal?.toString?.() || "";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const collateralVal = account.collateral_token as any;
        const collateralStr = typeof collateralVal === "string"
          ? collateralVal
          : collateralVal?.toBase58?.() || collateralVal?.toString?.() || "";

        return {
          id: String(account.id || publicKeyStr),
          publicKey: publicKeyStr,
          question: account.question || "",
          marketType: "v2" as MarketType,
          yesPrice,
          noPrice,
          yesMultiplier: yesPrice > 0 ? 1 / yesPrice : 2,
          noMultiplier: noPrice > 0 ? 1 / noPrice : 2,
          yesTokenMint: yesTokenStr,
          noTokenMint: noTokenStr,
          collateralToken: collateralStr,
          marketReserves: reserves,
          volume: reserves,
          liquidity: reserves,
          endDate: new Date(Number(account.end_time || 0) * 1000),
          resolved: account.resolved || false,
          resolvable: account.resolvable || false,
          winningToken,
          creator: creatorStr,
        };
      });

      // Sort by reserves (highest first)
      return markets.sort((a, b) => b.marketReserves - a.marketReserves);
    } catch (error) {
      console.error("[PNP] Failed to fetch markets from SDK:", error);
      throw error;
    }
  }

  /**
   * Fetch markets by creator wallet address
   * @param creatorWallet - Wallet address to filter by
   * @returns Markets created by the specified wallet
   */
  async fetchMarketsByCreator(creatorWallet: string): Promise<PNPMarket[]> {
    try {
      const allMarkets = await this.fetchAllMarketsFromSDK();
      return allMarkets.filter(m => m.creator === creatorWallet);
    } catch (error) {
      console.error("[PNP] Failed to fetch markets by creator:", error);
      return [];
    }
  }

  /**
   * Fetch only active markets (not resolved, not ended)
   * @returns Active markets only
   */
  async fetchActiveMarkets(): Promise<PNPMarket[]> {
    try {
      const allMarkets = await this.fetchAllMarketsFromSDK();
      const now = new Date();
      return allMarkets.filter(m => !m.resolved && m.endDate > now);
    } catch (error) {
      console.error("[PNP] Failed to fetch active markets:", error);
      return [];
    }
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
   * Create V2 market with direct signing (ShadowWire pattern)
   * Uses TransactionSigner and direct sendRawTransaction
   * @param params - Market creation parameters
   * @param walletAddress - Wallet address for the signer
   * @param signTransaction - Function to sign the transaction
   */
  async createV2MarketDirect(
    params: CreateV2MarketParams,
    walletAddress: string,
    signTransaction: TransactionSigner
  ): Promise<CreateMarketResult> {
    try {
      console.log("[PNP] Creating V2 market with direct signing...");

      // Import SDK modules
      const { Client, MarketModule } = await import("pnp-sdk");

      // Create base client
      const baseClient = new Client({ rpcUrl: RPC_URL });

      // Variable to capture the signature
      let capturedSignature: string | null = null;

      // Create a signer that captures the transaction and sends it directly
      const directSigner = {
        publicKey: new PublicKey(walletAddress),
        signTransaction: async (tx: Transaction | VersionedTransaction) => {
          console.log("[PNP] Captured transaction, signing and sending directly...");

          // Sign the transaction
          const signedTx = await signTransaction(tx);

          // Send directly
          const serialized = signedTx.serialize();
          capturedSignature = await this.connection.sendRawTransaction(serialized, {
            skipPreflight: true,
            preflightCommitment: "confirmed",
            maxRetries: 3,
          });

          console.log("[PNP] Direct send complete, signature:", capturedSignature);

          // Return the signed tx (SDK expects it but we already sent)
          return signedTx;
        },
        signAllTransactions: async (txs: (Transaction | VersionedTransaction)[]) => {
          const signed = [];
          for (const tx of txs) {
            signed.push(await directSigner.signTransaction(tx));
          }
          return signed;
        },
      };

      // Create MarketModule with our direct signer
      const market = new MarketModule(baseClient, directSigner);

      // Call createMarket - our signer will intercept and send directly
      // SDK may throw after our send (it tries to send again), but we already succeeded
      let result;
      try {
        result = await market.createMarket({
          question: params.question,
          initialLiquidity: params.initialLiquidity,
          endTime: params.endTime,
          baseMint: params.baseMint || USDC_MINT,
        });
      } catch (sdkError) {
        // SDK failed to send (we already sent successfully)
        // If we have a captured signature, the tx was successful
        if (capturedSignature) {
          console.log("[PNP] SDK threw error but we already sent tx:", capturedSignature);
          // Confirm our transaction
          console.log("[PNP] Confirming transaction...");
          const confirmation = await this.connection.confirmTransaction(capturedSignature, "confirmed");
          if (confirmation.value.err) {
            return {
              signature: capturedSignature,
              market: "",
              success: false,
              error: `Transaction failed on chain: ${JSON.stringify(confirmation.value.err)}`,
            };
          }
          console.log("[PNP] Transaction confirmed!");
          return {
            signature: capturedSignature,
            market: "", // We don't have market address from SDK, but tx succeeded
            success: true,
          };
        }
        // No captured signature means we failed before sending
        throw sdkError;
      }

      // Use our captured signature if available, otherwise use SDK's
      const finalSignature = capturedSignature || result.signature;

      // Confirm the transaction if we sent it directly
      if (capturedSignature) {
        console.log("[PNP] Confirming transaction...");
        const confirmation = await this.connection.confirmTransaction(capturedSignature, "confirmed");
        if (confirmation.value.err) {
          return {
            signature: capturedSignature,
            market: "",
            success: false,
            error: `Transaction failed on chain: ${JSON.stringify(confirmation.value.err)}`,
          };
        }
        console.log("[PNP] Transaction confirmed!");
      }

      return {
        signature: finalSignature || "",
        market: typeof result.market === "string" ? result.market : result.market.toBase58(),
        success: true,
      };
    } catch (error) {
      console.error("[PNP] Failed to create V2 market:", error);
      return {
        signature: "",
        market: "",
        success: false,
        error: error instanceof Error ? error.message : "Failed to create market",
      };
    }
  }

  /**
   * Create P2P market with direct signing (ShadowWire pattern)
   * Note: P2P uses same pattern as V2 for now
   */
  async createP2PMarketDirect(
    params: CreateP2PMarketParams,
    walletAddress: string,
    signTransaction: TransactionSigner
  ): Promise<CreateMarketResult> {
    // P2P markets use same direct signing pattern as V2
    // Convert P2P params to work with MarketModule
    return this.createV2MarketDirect(
      {
        question: params.question,
        initialLiquidity: params.initialAmount,
        endTime: params.endTime,
        baseMint: params.collateralTokenMint,
      },
      walletAddress,
      signTransaction
    );
  }

  /**
   * Buy tokens with manual instruction building
   * Fixes SDK bug where Associated Token Program is passed instead of Token Program
   */
  async buyTokensDirect(
    marketAddress: string,
    side: "yes" | "no",
    amountUsdc: number,
    walletAddress: string,
    signTransaction: TransactionSigner
  ): Promise<TradeResult> {
    try {
      console.log("[PNP] Buying tokens with manual instruction build (SDK bug workaround)...");
      console.log("[PNP] Market:", marketAddress);
      console.log("[PNP] Side:", side, "Amount:", amountUsdc, "USDC");

      const {
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
        getAssociatedTokenAddressSync,
        createAssociatedTokenAccountInstruction,
        getMint,
      } = await import("@solana/spl-token");
      const {
        SystemProgram,
        TransactionMessage,
        VersionedTransaction,
        ComputeBudgetProgram,
        TransactionInstruction,
      } = await import("@solana/web3.js");

      const buyer = new PublicKey(walletAddress);
      const market = new PublicKey(marketAddress);

      // Fetch market account data directly
      const marketAccountInfo = await this.connection.getAccountInfo(market);
      if (!marketAccountInfo) {
        throw new Error("Market not found");
      }

      // Use SDK to decode the market account with full data including creator_fee_treasury
      const { Client, TradingModule } = await import("pnp-sdk");
      const baseClient = new Client({ rpcUrl: RPC_URL });
      const dummySigner = {
        publicKey: buyer,
        signTransaction: async (tx: Transaction | VersionedTransaction) => tx,
        signAllTransactions: async (txs: (Transaction | VersionedTransaction)[]) => txs,
      };
      const tradingModule = new TradingModule(baseClient, dummySigner);

      // Use decodeMarketAny to get full market data including creator_fee_treasury
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawMarketData = (tradingModule as any).decodeMarketAny(marketAccountInfo.data);

      if (!rawMarketData) {
        throw new Error("Failed to decode market data");
      }

      // Check if market is tradable
      const nowSec = Math.floor(Date.now() / 1000);
      const endTimeHex = rawMarketData.end_time || rawMarketData.endTime;
      const endTime = typeof endTimeHex === 'string' ? parseInt(endTimeHex, 16) : Number(endTimeHex);
      if (rawMarketData.resolved || nowSec >= endTime) {
        throw new Error("Market not tradable: " + (rawMarketData.resolved ? "resolved" : "ended"));
      }

      // Get PDAs and accounts from decoded data
      const yesTokenMint = new PublicKey(rawMarketData.yes_token_mint || rawMarketData.yesTokenMint);
      const noTokenMint = new PublicKey(rawMarketData.no_token_mint || rawMarketData.noTokenMint);
      const collateralMint = new PublicKey(rawMarketData.collateral_token || rawMarketData.collateralToken);
      const marketCreator = new PublicKey(rawMarketData.creator);
      const creatorFeeTreasury = new PublicKey(rawMarketData.creator_fee_treasury || rawMarketData.creatorFeeTreasury);

      console.log("[PNP] creator_fee_treasury:", creatorFeeTreasury.toBase58());

      // Get global config PDA
      const PNP_PROGRAM_ID = new PublicKey("6fnYZUSyp3vJxTNnayq5S62d363EFaGARnqYux5bqrxb");
      const [globalConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from("global_config")],
        PNP_PROGRAM_ID
      );

      // Fetch global config to get admin
      const globalConfigInfo = await this.connection.getAccountInfo(globalConfig);
      if (!globalConfigInfo) throw new Error("Global config not found");

      // Parse admin from global config (first 32 bytes after 8-byte discriminator)
      const adminBytes = globalConfigInfo.data.slice(8, 40);
      const admin = new PublicKey(adminBytes);

      // Get token program (check if using Token-2022)
      const yesMintInfo = await this.connection.getAccountInfo(yesTokenMint);
      const tokenProgramId = yesMintInfo?.owner || TOKEN_PROGRAM_ID;

      // Derive ATAs
      const buyerYesTokenAccount = getAssociatedTokenAddressSync(yesTokenMint, buyer, false, tokenProgramId);
      const buyerNoTokenAccount = getAssociatedTokenAddressSync(noTokenMint, buyer, false, tokenProgramId);
      const buyerCollateralTokenAccount = getAssociatedTokenAddressSync(collateralMint, buyer, false, tokenProgramId);
      const adminCollateralTokenAccount = getAssociatedTokenAddressSync(collateralMint, admin, false, tokenProgramId);
      const marketReserveVault = getAssociatedTokenAddressSync(collateralMint, market, true, tokenProgramId);

      // Get collateral mint info for decimals
      const collateralMintInfo = await getMint(this.connection, collateralMint, "confirmed", tokenProgramId);
      const decimals = collateralMintInfo.decimals;

      // Convert USDC amount to base units
      const amountBaseUnits = BigInt(Math.floor(amountUsdc * Math.pow(10, decimals)));
      console.log("[PNP] Amount in base units:", amountBaseUnits.toString());

      // Check balance
      const balanceInfo = await this.connection.getTokenAccountBalance(buyerCollateralTokenAccount).catch(() => null);
      if (!balanceInfo) {
        throw new Error("Buyer USDC token account not found. Please fund with USDC first.");
      }
      const balance = BigInt(balanceInfo.value.amount);
      if (balance < amountBaseUnits) {
        throw new Error(`Insufficient USDC balance: have ${balanceInfo.value.uiAmountString}, need ${amountUsdc}`);
      }

      // Build pre-instructions for creating ATAs if needed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const preIxs: any[] = [];
      const createAtaIfNeeded = async (ata: PublicKey, owner: PublicKey, mint: PublicKey) => {
        const info = await this.connection.getAccountInfo(ata);
        if (!info) {
          preIxs.push(
            createAssociatedTokenAccountInstruction(
              buyer, // payer
              ata,
              owner,
              mint,
              tokenProgramId,
              ASSOCIATED_TOKEN_PROGRAM_ID
            )
          );
        }
      };

      await createAtaIfNeeded(buyerYesTokenAccount, buyer, yesTokenMint);
      await createAtaIfNeeded(buyerNoTokenAccount, buyer, noTokenMint);
      await createAtaIfNeeded(marketReserveVault, market, collateralMint);

      // Build mint_decision_tokens instruction manually with CORRECT account order
      // The SDK bug: it puts associated_token_program where token_program_decision should be
      // Fix: Pass token_program TWICE (for both token_program and token_program_decision)
      // Discriminator = sha256("global:mint_decision_tokens")[0..8]
      const mintDecisionTokensDiscriminator = Buffer.from([226, 180, 53, 125, 168, 69, 114, 25]);

      // Encode args: amount (u64), buy_yes_token (bool), minimum_out (u64)
      const amountBuffer = Buffer.alloc(8);
      amountBuffer.writeBigUInt64LE(amountBaseUnits);
      const buyYesTokenByte = Buffer.from([side === "yes" ? 1 : 0]);
      const minimumOutBuffer = Buffer.alloc(8);
      minimumOutBuffer.writeBigUInt64LE(BigInt(0));

      const instructionData = Buffer.concat([
        mintDecisionTokensDiscriminator,
        amountBuffer,
        buyYesTokenByte,
        minimumOutBuffer,
      ]);

      // Account metas in CORRECT order based on on-chain program
      // Admin needs to be writable for fee collection
      const accountMetas = [
        { pubkey: buyer, isSigner: true, isWritable: true },
        { pubkey: admin, isSigner: false, isWritable: true },
        { pubkey: marketCreator, isSigner: false, isWritable: true },
        { pubkey: market, isSigner: false, isWritable: true },
        { pubkey: globalConfig, isSigner: false, isWritable: false },
        { pubkey: yesTokenMint, isSigner: false, isWritable: true },
        { pubkey: noTokenMint, isSigner: false, isWritable: true },
        { pubkey: buyerYesTokenAccount, isSigner: false, isWritable: true },
        { pubkey: buyerNoTokenAccount, isSigner: false, isWritable: true },
        { pubkey: marketReserveVault, isSigner: false, isWritable: true },
        { pubkey: collateralMint, isSigner: false, isWritable: true },
        { pubkey: buyerCollateralTokenAccount, isSigner: false, isWritable: true },
        { pubkey: adminCollateralTokenAccount, isSigner: false, isWritable: true },
        { pubkey: creatorFeeTreasury, isSigner: false, isWritable: true },
        // FIX: token_program for collateral operations
        { pubkey: tokenProgramId, isSigner: false, isWritable: false },
        // FIX: token_program_decision for decision token operations (YES/NO tokens)
        // This was incorrectly set to ASSOCIATED_TOKEN_PROGRAM_ID by SDK
        { pubkey: tokenProgramId, isSigner: false, isWritable: false },
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ];

      const mintIx = new TransactionInstruction({
        programId: PNP_PROGRAM_ID,
        keys: accountMetas,
        data: instructionData,
      });

      // Add compute budget
      const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({ units: 600000 });

      // Build transaction
      const latestBlockhash = await this.connection.getLatestBlockhash("confirmed");
      const message = new TransactionMessage({
        payerKey: buyer,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: [computeBudgetIx, ...preIxs, mintIx],
      }).compileToV0Message();

      const tx = new VersionedTransaction(message);

      // Sign and send
      console.log("[PNP] Signing transaction...");
      const signedTx = await signTransaction(tx);

      console.log("[PNP] Sending transaction...");
      const signature = await this.connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3,
      });

      console.log("[PNP] Transaction sent! Signature:", signature);

      // Wait for confirmation
      console.log("[PNP] Confirming transaction...");
      const confirmation = await this.connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      }, "confirmed");

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      console.log("[PNP] Trade successful!");

      return {
        signature,
        tokensReceived: Number(amountBaseUnits) / Math.pow(10, decimals), // Approximate
        success: true,
      };
    } catch (error) {
      console.error("[PNP] Failed to buy tokens:", error);
      const errorMsg = error instanceof Error ? error.message : "Trade failed";

      if (errorMsg.includes("Market not tradable")) {
        return {
          signature: "",
          tokensReceived: 0,
          success: false,
          error: "Market has ended or is resolved",
        };
      }
      if (errorMsg.includes("Insufficient")) {
        return {
          signature: "",
          tokensReceived: 0,
          success: false,
          error: errorMsg,
        };
      }

      return {
        signature: "",
        tokensReceived: 0,
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Sell tokens with direct signing (ShadowWire pattern)
   * Burns decision tokens and receives USDC back
   */
  async sellTokensDirect(
    marketAddress: string,
    side: "yes" | "no",
    tokenAmount: number,
    walletAddress: string,
    signTransaction: TransactionSigner
  ): Promise<TradeResult> {
    try {
      console.log("[PNP] Selling tokens with SDK signing...");
      console.log("[PNP] Market:", marketAddress);
      console.log("[PNP] Side:", side, "Amount:", tokenAmount, "tokens");

      const { Client, TradingModule } = await import("pnp-sdk");
      const baseClient = new Client({ rpcUrl: RPC_URL });

      // Create a signer that signs with Privy and lets SDK send
      const sdkSigner = {
        publicKey: new PublicKey(walletAddress),
        signTransaction: async (tx: Transaction | VersionedTransaction) => {
          console.log("[PNP] Signing sell transaction with Privy...");
          const signedTx = await signTransaction(tx);
          console.log("[PNP] Transaction signed successfully");
          return signedTx;
        },
        signAllTransactions: async (txs: (Transaction | VersionedTransaction)[]) => {
          console.log("[PNP] Signing", txs.length, "transactions...");
          const signed = [];
          for (const tx of txs) {
            signed.push(await sdkSigner.signTransaction(tx));
          }
          return signed;
        },
      };

      const trading = new TradingModule(baseClient, sdkSigner);

      // Use sellTokensBase which uses burnDecisionTokensDerived
      console.log("[PNP] Calling trading.sellTokensBase...");
      const result = await trading.sellTokensBase({
        market: new PublicKey(marketAddress),
        burnYesToken: side === "yes",
        amountBaseUnits: BigInt(Math.floor(tokenAmount * 1e6)),
      });

      console.log("[PNP] Sell complete! Signature:", result.signature);
      console.log("[PNP] USDC received:", result.usdcReceived || 0);

      return {
        signature: result.signature || "",
        tokensReceived: result.usdcReceived || 0,
        success: true,
      };
    } catch (error) {
      console.error("[PNP] Failed to sell tokens:", error);
      const errorMsg = error instanceof Error ? error.message : "Sell failed";

      // Check for common errors
      if (errorMsg.includes("Market not tradable")) {
        return {
          signature: "",
          tokensReceived: 0,
          success: false,
          error: "Market has ended or is resolved",
        };
      }
      if (errorMsg.includes("Insufficient") || errorMsg.includes("balance")) {
        return {
          signature: "",
          tokensReceived: 0,
          success: false,
          error: "Insufficient token balance",
        };
      }

      return {
        signature: "",
        tokensReceived: 0,
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Get minimum trade amount for a market
   * Returns minimum USDC amount to prevent dust trades
   */
  getMinimumTradeAmount(marketLiquidity: number): number {
    // Minimum 0.01 USDC or 1% of liquidity, whichever is higher
    const minFromLiquidity = marketLiquidity * 0.01;
    return Math.max(0.01, minFromLiquidity);
  }

  /**
   * Redeem position with direct signing (ShadowWire pattern)
   */
  async redeemPositionDirect(
    marketAddress: string,
    walletAddress: string,
    signTransaction: TransactionSigner
  ): Promise<{ signature: string; success: boolean; error?: string }> {
    try {
      console.log("[PNP] Redeeming position with direct signing...");

      const { Client, RedemptionModule } = await import("pnp-sdk");
      const baseClient = new Client({ rpcUrl: RPC_URL });

      let capturedSignature: string | null = null;

      const directSigner = {
        publicKey: new PublicKey(walletAddress),
        signTransaction: async (tx: Transaction | VersionedTransaction) => {
          console.log("[PNP] Captured redeem transaction, signing and sending directly...");

          const signedTx = await signTransaction(tx);
          const serialized = signedTx.serialize();

          capturedSignature = await this.connection.sendRawTransaction(serialized, {
            skipPreflight: true,
            preflightCommitment: "confirmed",
            maxRetries: 3,
          });

          console.log("[PNP] Redeem direct send complete, signature:", capturedSignature);
          return signedTx;
        },
        signAllTransactions: async (txs: (Transaction | VersionedTransaction)[]) => {
          const signed = [];
          for (const tx of txs) {
            signed.push(await directSigner.signTransaction(tx));
          }
          return signed;
        },
      };

      const redemption = new RedemptionModule(baseClient, directSigner);

      // SDK may throw after our send, but we already succeeded
      let result;
      try {
        result = await redemption.redeemPosition({
          market: new PublicKey(marketAddress),
          position: new PublicKey(walletAddress),
          amount: BigInt(0), // 0 = redeem all
        });
      } catch (sdkError) {
        // SDK failed but we may have already sent successfully
        if (capturedSignature) {
          console.log("[PNP] SDK threw error but we already sent tx:", capturedSignature);
          console.log("[PNP] Confirming redeem transaction...");
          const confirmation = await this.connection.confirmTransaction(capturedSignature, "confirmed");
          if (confirmation.value.err) {
            return {
              signature: capturedSignature,
              success: false,
              error: `Transaction failed on chain: ${JSON.stringify(confirmation.value.err)}`,
            };
          }
          console.log("[PNP] Redeem confirmed!");
          return {
            signature: capturedSignature,
            success: true,
          };
        }
        throw sdkError;
      }

      const finalSignature = capturedSignature || result.signature;

      if (capturedSignature) {
        console.log("[PNP] Confirming redeem transaction...");
        const confirmation = await this.connection.confirmTransaction(capturedSignature, "confirmed");
        if (confirmation.value.err) {
          return {
            signature: capturedSignature,
            success: false,
            error: `Transaction failed on chain: ${JSON.stringify(confirmation.value.err)}`,
          };
        }
        console.log("[PNP] Redeem confirmed!");
      }

      return {
        signature: finalSignature || "",
        success: true,
      };
    } catch (error) {
      console.error("[PNP] Failed to redeem position:", error);
      return {
        signature: "",
        success: false,
        error: error instanceof Error ? error.message : "Redeem failed",
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
