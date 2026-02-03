'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  getTxTypeInfo,
  getSourceInfo,
  getProgramLabel,
  APP_ACTIVITY_TYPES,
  APP_SDK_LABELS,
  PRIVACY_PROGRAMS,
} from '@/lib/constants/programs';

// Types
export type RPCProvider = 'helius' | 'quicknode';

export interface TokenAsset {
  id: string;
  mint: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  usdValue: number;
  price: number;
  logoURI?: string;
  pnl24h: number; // Always positive 15-25%
  pnlAllTime: number; // Always positive 15-25%
  isNative?: boolean;
}

export interface NFTAsset {
  id: string;
  mint: string;
  name: string;
  image: string;
  collection?: {
    name: string;
    verified: boolean;
  };
  floorPrice?: number;
  attributes?: Array<{ trait_type: string; value: string }>;
}

export interface Transaction {
  signature: string;
  type: string;
  typeLabel: string;
  typeIcon: string;
  typeColor: string;
  source?: string;
  sourceLabel?: string;
  sourceColor?: string;
  programId?: string;
  programLabel?: string;
  programCategory?: string;
  timestamp: number;
  amount?: number;
  token?: string;
  tokenSymbol?: string;
  fee: number;
  status: 'success' | 'failed';
  description: string;
  // Direction - outgoing (user initiated), incoming (received), or self (internal)
  direction: 'outgoing' | 'incoming' | 'self';
  feePayer?: string;
  // Swap specific
  swapIn?: { symbol: string; amount: number; mint: string };
  swapOut?: { symbol: string; amount: number; mint: string };
  // NFT specific
  nftName?: string;
  nftImage?: string;
}

export interface PortfolioStats {
  totalValue: number;
  pnl24h: number;
  pnl24hPercent: number;
  pnlAllTime: number;
  pnlAllTimePercent: number;
  tokenCount: number;
  nftCount: number;
}

export interface GlobalStats {
  totalUsers: number;
  totalVolume: number;
  activeWallets24h: number;
  transactionsToday: number;
}

// RPC Configuration
const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY || '';
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const HELIUS_API = 'https://api.helius.xyz/v0';
const QUICKNODE_RPC = process.env.NEXT_PUBLIC_QUICKNODE_RPC_MAINNET || 'https://api.mainnet-beta.solana.com';
const JUPITER_PRICE_API = 'https://price.jup.ag/v6/price';
const JUPITER_TOKEN_LIST = 'https://token.jup.ag/strict';

// Token metadata cache
let tokenMetadataCache: Map<string, { symbol: string; name: string; logoURI?: string }> | null = null;

// Generate consistent "random" P&L based on address (always positive 15-25%)
const generatePnL = (seed: string, offset: number = 0): number => {
  let hash = 0;
  const str = seed + offset.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // Return 15-25%
  return 15 + Math.abs(hash % 11);
};

// Token Program ID
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

/**
 * Main Portfolio Hook
 */
export function usePortfolio(walletAddress: string | null) {
  const [provider, setProvider] = useState<RPCProvider>('helius');
  const [tokens, setTokens] = useState<TokenAsset[]>([]);
  const [nfts, setNfts] = useState<NFTAsset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false); // Provider switching state
  const [error, setError] = useState<string | null>(null);
  const [ping, setPing] = useState<number | null>(null);
  const prevProvider = useRef<RPCProvider>(provider);

  // Pagination state
  const [tokenPage, setTokenPage] = useState(1);
  const [nftPage, setNftPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);

  const TOKENS_PER_PAGE = 10;
  const NFTS_PER_PAGE = 8;
  const ACTIVITY_PER_PAGE = 10; // Show 10 transactions per page, paginated
  const TX_FETCH_LIMIT = 100; // Fetch 100 at a time from API

  // Track if there are more transactions to load from API
  const [hasMoreTxFromAPI, setHasMoreTxFromAPI] = useState(true);
  const [loadingMoreTx, setLoadingMoreTx] = useState(false);

  // Get RPC URL based on provider
  const rpcUrl = useMemo(() => {
    return provider === 'helius' ? HELIUS_RPC : QUICKNODE_RPC;
  }, [provider]);

  // Get connection
  const connection = useMemo(() => {
    return new Connection(rpcUrl, 'confirmed');
  }, [rpcUrl]);

  // Test RPC ping
  const testPing = useCallback(async () => {
    const start = performance.now();
    try {
      await connection.getSlot();
      const end = performance.now();
      setPing(Math.round(end - start));
    } catch {
      setPing(-1);
    }
  }, [connection]);

  // Fetch token metadata from Jupiter token list
  const fetchTokenMetadata = useCallback(async (): Promise<Map<string, { symbol: string; name: string; logoURI?: string }>> => {
    // Return cached data if available
    if (tokenMetadataCache) return tokenMetadataCache;

    try {
      const response = await fetch(JUPITER_TOKEN_LIST);
      if (!response.ok) return new Map();

      const tokens: Array<{ address: string; symbol: string; name: string; logoURI?: string }> = await response.json();
      const cache = new Map<string, { symbol: string; name: string; logoURI?: string }>();

      tokens.forEach(token => {
        cache.set(token.address, {
          symbol: token.symbol,
          name: token.name,
          logoURI: token.logoURI,
        });
      });

      tokenMetadataCache = cache;
      return cache;
    } catch (err) {
      console.error('Error fetching token metadata:', err);
      return new Map();
    }
  }, []);

  // Fetch token prices from Jupiter
  const fetchPrices = useCallback(async (mints: string[]): Promise<Record<string, number>> => {
    if (mints.length === 0) return {};

    try {
      // Add SOL to the list
      const allMints = ['So11111111111111111111111111111111111111112', ...mints];
      const uniqueMints = Array.from(new Set(allMints));

      const response = await fetch(`${JUPITER_PRICE_API}?ids=${uniqueMints.join(',')}`);
      if (!response.ok) return {};

      const data = await response.json();
      const prices: Record<string, number> = {};

      // Map prices
      if (data.data) {
        Object.entries(data.data).forEach(([mint, info]: [string, unknown]) => {
          const priceInfo = info as { price?: number };
          if (priceInfo.price) {
            prices[mint] = priceInfo.price;
          }
        });
      }

      return prices;
    } catch (err) {
      console.error('Error fetching prices:', err);
      return {};
    }
  }, []);

  // Fetch assets using Helius DAS API
  const fetchAssetsHelius = useCallback(async (wallet: string, page: number = 1) => {
    const response = await fetch(HELIUS_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'portfolio',
        method: 'getAssetsByOwner',
        params: {
          ownerAddress: wallet,
          page,
          limit: 100,
          displayOptions: {
            showFungible: true,
            showNativeBalance: true,
            showCollectionMetadata: true,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Helius API error: ${response.status}`);
    }

    const data = await response.json();
    return data.result;
  }, []);

  // Fetch assets using QuickNode RPC
  const fetchAssetsQuickNode = useCallback(async (wallet: string) => {
    const pubkey = new PublicKey(wallet);

    // Get SOL balance
    const solBalance = await connection.getBalance(pubkey);

    // Get token accounts
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
      programId: TOKEN_PROGRAM_ID,
    });

    return {
      solBalance: solBalance / LAMPORTS_PER_SOL,
      tokenAccounts: tokenAccounts.value,
    };
  }, [connection]);

  // Fetch activity from our database
  const fetchAppActivity = useCallback(async (wallet: string): Promise<Map<string, {
    type: string;
    sdk: string;
    amount: number;
    token: string;
    metadata?: Record<string, unknown>;
  }>> => {
    try {
      const response = await fetch(`/api/activity/user?wallet=${wallet}&limit=50`);
      if (!response.ok) return new Map();

      const data = await response.json();
      const activityMap = new Map();

      if (data.activity && Array.isArray(data.activity)) {
        data.activity.forEach((item: {
          signature: string;
          type: string;
          sdk: string;
          amount: number;
          token: string;
          metadata?: Record<string, unknown>;
        }) => {
          if (item.signature) {
            activityMap.set(item.signature, {
              type: item.type,
              sdk: item.sdk,
              amount: item.amount,
              token: item.token,
              metadata: item.metadata,
            });
          }
        });
      }

      return activityMap;
    } catch (err) {
      console.error('Error fetching app activity:', err);
      return new Map();
    }
  }, []);

  // Fetch transaction history with enhanced parsing
  const fetchTransactions = useCallback(async (
    wallet: string,
    limit: number = 100,
    before?: string // Cursor for pagination
  ): Promise<{ txs: Transaction[]; hasMore: boolean }> => {
    try {
      // Build URL with optional cursor
      let url = `${HELIUS_API}/addresses/${wallet}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}`;
      if (before) {
        url += `&before=${before}`;
      }

      // Fetch both Helius transactions and our app activity in parallel
      const [heliusResponse, appActivity] = await Promise.all([
        fetch(url),
        before ? Promise.resolve(new Map()) : fetchAppActivity(wallet), // Only fetch app activity on first load
      ]);

      if (!heliusResponse.ok) return { txs: [], hasMore: false };

      const rawTxs = await heliusResponse.json();
      const hasMore = rawTxs.length >= limit; // If we got full page, there's likely more

      const parsedTxs: Transaction[] = rawTxs.map((tx: {
        signature: string;
        type: string;
        source?: string;
        timestamp: number;
        fee: number;
        feePayer?: string;
        transactionError?: unknown;
        nativeTransfers?: Array<{ amount: number; fromUserAccount?: string; toUserAccount?: string }>;
        tokenTransfers?: Array<{
          mint: string;
          fromUserAccount?: string;
          toUserAccount?: string;
          tokenAmount: number;
          tokenStandard?: string;
        }>;
        description?: string;
        accountData?: Array<{ account: string; nativeBalanceChange?: number }>;
        instructions?: Array<{ programId: string; data?: string }>;
        events?: {
          swap?: {
            nativeInput?: { amount: number };
            nativeOutput?: { amount: number };
            tokenInputs?: Array<{ mint: string; tokenAmount: number; userAccount?: string }>;
            tokenOutputs?: Array<{ mint: string; tokenAmount: number; userAccount?: string }>;
            innerSwaps?: Array<{
              tokenInputs?: Array<{ mint: string; tokenAmount: number }>;
              tokenOutputs?: Array<{ mint: string; tokenAmount: number }>;
              programInfo?: { source?: string };
            }>;
          };
          nft?: {
            description?: string;
            amount?: number;
            buyer?: string;
            seller?: string;
            nfts?: Array<{ mint: string; tokenStandard?: string }>;
          };
        };
      }) => {
        // Check if we have app activity for this transaction
        const dbActivity = appActivity.get(tx.signature);

        // Get type info - prefer our app activity types
        let typeInfo = getTxTypeInfo(tx.type || 'UNKNOWN');
        let customType: string | undefined;
        let customSource: { name: string; color: string } | undefined;

        // If we have app activity, use our labels
        if (dbActivity) {
          const appType = APP_ACTIVITY_TYPES[dbActivity.type];
          if (appType) {
            typeInfo = appType;
            customType = dbActivity.type;
          }
          const sdkInfo = APP_SDK_LABELS[dbActivity.sdk];
          if (sdkInfo) {
            customSource = { name: sdkInfo.name, color: sdkInfo.color };
          }
        }

        // Get source info if available
        const sourceInfo = customSource || (tx.source ? getSourceInfo(tx.source) : null);

        // Check for program IDs in instructions - detect privacy protocols
        let programInfo: { name: string; category: string; icon?: string; color?: string } | null = null;
        let detectedPrivacyProgram = false;

        if (tx.instructions && tx.instructions.length > 0) {
          // Find the most relevant program (skip system programs)
          for (const ix of tx.instructions) {
            // Check for privacy programs first
            if (ix.programId === PRIVACY_PROGRAMS.PRIVACY_CASH) {
              programInfo = { name: 'Privacy Cash', category: 'privacy', icon: '🔒', color: '#00ff88' };
              detectedPrivacyProgram = true;
              // Override type if UNKNOWN
              if (tx.type === 'UNKNOWN' && !dbActivity) {
                typeInfo = { label: 'Privacy Transaction', icon: '🔒', color: '#00ff88' };
              }
              break;
            } else if (ix.programId === PRIVACY_PROGRAMS.SHADOW_WIRE) {
              programInfo = { name: 'ShadowWire', category: 'privacy', icon: '👻', color: '#8b5cf6' };
              detectedPrivacyProgram = true;
              if (tx.type === 'UNKNOWN' && !dbActivity) {
                typeInfo = { label: 'Shadow Transfer', icon: '👻', color: '#8b5cf6' };
              }
              break;
            } else if (ix.programId === PRIVACY_PROGRAMS.DARKLAKE) {
              programInfo = { name: 'Darklake', category: 'privacy', icon: '🌑', color: '#6366f1' };
              detectedPrivacyProgram = true;
              if (tx.type === 'UNKNOWN' && !dbActivity) {
                typeInfo = { label: 'Dark Pool', icon: '🌑', color: '#6366f1' };
              }
              break;
            }

            const label = getProgramLabel(ix.programId);
            if (label && label.category !== 'system') {
              programInfo = label;
              break;
            }
          }
        }

        // Calculate amount from transfers or app activity
        let amount: number | undefined = dbActivity?.amount;
        let tokenSymbol: string | undefined = dbActivity?.token;

        // Handle swap events
        let swapIn: { symbol: string; amount: number; mint: string } | undefined;
        let swapOut: { symbol: string; amount: number; mint: string } | undefined;

        if (tx.events?.swap) {
          const swap = tx.events.swap;

          // Input
          if (swap.nativeInput?.amount) {
            swapIn = {
              symbol: 'SOL',
              amount: swap.nativeInput.amount / LAMPORTS_PER_SOL,
              mint: 'So11111111111111111111111111111111111111112',
            };
          } else if (swap.tokenInputs?.[0]) {
            const input = swap.tokenInputs[0];
            swapIn = {
              symbol: input.mint.slice(0, 4).toUpperCase(),
              amount: input.tokenAmount,
              mint: input.mint,
            };
          }

          // Output
          if (swap.nativeOutput?.amount) {
            swapOut = {
              symbol: 'SOL',
              amount: swap.nativeOutput.amount / LAMPORTS_PER_SOL,
              mint: 'So11111111111111111111111111111111111111112',
            };
          } else if (swap.tokenOutputs?.[0]) {
            const output = swap.tokenOutputs[0];
            swapOut = {
              symbol: output.mint.slice(0, 4).toUpperCase(),
              amount: output.tokenAmount,
              mint: output.mint,
            };
          }
        }

        // Use swap metadata from our DB if available
        if (dbActivity?.metadata) {
          const meta = dbActivity.metadata as Record<string, unknown>;
          if (meta.fromToken && meta.toToken) {
            swapIn = {
              symbol: meta.fromToken as string,
              amount: meta.amount as number || amount || 0,
              mint: '',
            };
            swapOut = {
              symbol: meta.toToken as string,
              amount: meta.toAmount as number || 0,
              mint: '',
            };
          }
        }

        // Handle native transfers if no amount yet
        if (!amount && tx.nativeTransfers?.[0]) {
          const transfer = tx.nativeTransfers[0];
          amount = transfer.amount / LAMPORTS_PER_SOL;
          tokenSymbol = 'SOL';
        }

        // Handle token transfers
        if (!amount && tx.tokenTransfers?.[0]) {
          const transfer = tx.tokenTransfers[0];
          amount = transfer.tokenAmount;
          tokenSymbol = transfer.mint.slice(0, 4).toUpperCase();
        }

        // Build description
        let description = tx.description || '';
        if (dbActivity && dbActivity.type) {
          // Use descriptive text based on app activity
          const activityType = APP_ACTIVITY_TYPES[dbActivity.type];
          if (activityType) {
            description = `${activityType.label} - ${amount?.toFixed(4) || ''} ${tokenSymbol || ''}`.trim();
          }
        } else if (!description && swapIn && swapOut) {
          description = `Swapped ${swapIn.amount.toFixed(4)} ${swapIn.symbol} → ${swapOut.amount.toFixed(4)} ${swapOut.symbol}`;
        } else if (!description && detectedPrivacyProgram) {
          description = `${programInfo?.name || 'Privacy'} transaction`;
        } else if (!description && tx.type === 'TRANSFER' && amount) {
          description = `Transferred ${amount.toFixed(4)} ${tokenSymbol || 'tokens'}`;
        } else if (!description) {
          description = typeInfo.label;
        }

        // NFT info
        let nftName: string | undefined;
        if (tx.events?.nft?.nfts?.[0]) {
          nftName = tx.events.nft.description?.split(' ')[0] || 'NFT';
        }

        // Determine transaction direction
        let direction: 'outgoing' | 'incoming' | 'self' = 'self';
        const isFeePayer = tx.feePayer?.toLowerCase() === wallet.toLowerCase();

        // Check native transfers for direction
        if (tx.nativeTransfers && tx.nativeTransfers.length > 0) {
          const hasIncoming = tx.nativeTransfers.some(
            t => t.toUserAccount?.toLowerCase() === wallet.toLowerCase() &&
                 t.fromUserAccount?.toLowerCase() !== wallet.toLowerCase()
          );
          const hasOutgoing = tx.nativeTransfers.some(
            t => t.fromUserAccount?.toLowerCase() === wallet.toLowerCase() &&
                 t.toUserAccount?.toLowerCase() !== wallet.toLowerCase()
          );

          if (hasIncoming && !hasOutgoing) direction = 'incoming';
          else if (hasOutgoing) direction = 'outgoing';
        }

        // Check token transfers for direction
        if (direction === 'self' && tx.tokenTransfers && tx.tokenTransfers.length > 0) {
          const hasIncoming = tx.tokenTransfers.some(
            t => t.toUserAccount?.toLowerCase() === wallet.toLowerCase() &&
                 t.fromUserAccount?.toLowerCase() !== wallet.toLowerCase()
          );
          const hasOutgoing = tx.tokenTransfers.some(
            t => t.fromUserAccount?.toLowerCase() === wallet.toLowerCase() &&
                 t.toUserAccount?.toLowerCase() !== wallet.toLowerCase()
          );

          if (hasIncoming && !hasOutgoing) direction = 'incoming';
          else if (hasOutgoing) direction = 'outgoing';
        }

        // Swaps are typically "self" unless it's a direct swap output
        if (tx.events?.swap) {
          direction = 'self';
        }

        // If user is fee payer and direction is still self, it's likely outgoing
        if (isFeePayer && direction === 'self' && tx.type !== 'SWAP') {
          direction = 'outgoing';
        }

        return {
          signature: tx.signature,
          type: customType || tx.type || 'UNKNOWN',
          typeLabel: typeInfo.label,
          typeIcon: typeInfo.icon,
          typeColor: typeInfo.color,
          source: tx.source,
          sourceLabel: sourceInfo?.name,
          sourceColor: sourceInfo?.color,
          programId: tx.instructions?.[0]?.programId,
          programLabel: programInfo?.name,
          programCategory: programInfo?.category,
          timestamp: tx.timestamp,
          fee: tx.fee / LAMPORTS_PER_SOL,
          status: tx.transactionError ? 'failed' as const : 'success' as const,
          amount,
          tokenSymbol,
          description,
          direction,
          feePayer: tx.feePayer,
          swapIn,
          swapOut,
          nftName,
        };
      });

      return { txs: parsedTxs, hasMore };
    } catch (err) {
      console.error('Error fetching transactions:', err);
      return { txs: [], hasMore: false };
    }
  }, [fetchAppActivity]);

  // Main fetch function
  const fetchPortfolio = useCallback(async (resetPagination: boolean = true) => {
    if (!walletAddress) {
      setTokens([]);
      setNfts([]);
      setTransactions([]);
      return;
    }

    setLoading(true);
    setError(null);

    if (resetPagination) {
      setTokenPage(1);
      setNftPage(1);
    }

    try {
      // Test ping
      await testPing();

      let fetchedTokens: TokenAsset[] = [];
      const fetchedNfts: NFTAsset[] = [];

      if (provider === 'helius') {
        // Use Helius DAS API
        const result = await fetchAssetsHelius(walletAddress);

        if (result?.items) {
          // Separate tokens and NFTs
          const tokenMints: string[] = [];

          result.items.forEach((item: {
            id: string;
            interface: string;
            content?: {
              metadata?: { name?: string; symbol?: string };
              links?: { image?: string };
              files?: Array<{ uri?: string }>;
            };
            token_info?: {
              balance?: number;
              decimals?: number;
              price_info?: { price_per_token?: number };
              symbol?: string;
            };
            grouping?: Array<{ group_value?: string; collection_metadata?: { name?: string } }>;
            authorities?: Array<{ scopes?: string[] }>;
          }) => {
            if (item.interface === 'FungibleToken' || item.interface === 'FungibleAsset') {
              // Token
              const balance = item.token_info?.balance || 0;
              const decimals = item.token_info?.decimals || 0;
              const uiBalance = balance / Math.pow(10, decimals);

              if (uiBalance > 0) {
                tokenMints.push(item.id);

                const pnl24h = generatePnL(item.id, 1);
                const pnlAllTime = generatePnL(item.id, 2);

                fetchedTokens.push({
                  id: item.id,
                  mint: item.id,
                  symbol: item.token_info?.symbol || item.content?.metadata?.symbol || 'UNKNOWN',
                  name: item.content?.metadata?.name || 'Unknown Token',
                  balance: uiBalance,
                  decimals,
                  usdValue: 0, // Will be filled after price fetch
                  price: item.token_info?.price_info?.price_per_token || 0,
                  logoURI: item.content?.links?.image,
                  pnl24h,
                  pnlAllTime,
                });
              }
            } else if (item.interface === 'V1_NFT' || item.interface === 'ProgrammableNFT') {
              // NFT
              fetchedNfts.push({
                id: item.id,
                mint: item.id,
                name: item.content?.metadata?.name || 'Unknown NFT',
                image: item.content?.links?.image || item.content?.files?.[0]?.uri || '',
                collection: item.grouping?.[0] ? {
                  name: item.grouping[0].collection_metadata?.name || item.grouping[0].group_value || 'Unknown Collection',
                  verified: item.authorities?.some(a => a.scopes?.includes('full')) || false,
                } : undefined,
                floorPrice: Math.random() * 5 + 0.5, // Mock floor price 0.5-5.5 SOL
              });
            }
          });

          // Fetch prices and update tokens
          const prices = await fetchPrices(tokenMints);
          fetchedTokens = fetchedTokens.map(token => {
            const price = prices[token.mint] || token.price;
            return {
              ...token,
              price,
              usdValue: token.balance * price,
            };
          });

          // Add native SOL if present
          if (result.nativeBalance) {
            const solBalance = result.nativeBalance.lamports / LAMPORTS_PER_SOL;
            const solPrice = prices['So11111111111111111111111111111111111111112'] || 150;

            fetchedTokens.unshift({
              id: 'native-sol',
              mint: 'So11111111111111111111111111111111111111112',
              symbol: 'SOL',
              name: 'Solana',
              balance: solBalance,
              decimals: 9,
              usdValue: solBalance * solPrice,
              price: solPrice,
              logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
              pnl24h: generatePnL('SOL', 1),
              pnlAllTime: generatePnL('SOL', 2),
              isNative: true,
            });
          }
        }
      } else {
        // Use QuickNode RPC
        const { solBalance, tokenAccounts } = await fetchAssetsQuickNode(walletAddress);

        // Get token mints for price fetch
        const tokenMints = tokenAccounts.map(acc => acc.account.data.parsed.info.mint);

        // Fetch prices and metadata in parallel
        const [prices, metadata] = await Promise.all([
          fetchPrices(tokenMints),
          fetchTokenMetadata(),
        ]);

        // Add SOL
        const solPrice = prices['So11111111111111111111111111111111111111112'] || 150;
        fetchedTokens.push({
          id: 'native-sol',
          mint: 'So11111111111111111111111111111111111111112',
          symbol: 'SOL',
          name: 'Solana',
          balance: solBalance,
          decimals: 9,
          usdValue: solBalance * solPrice,
          price: solPrice,
          logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
          pnl24h: generatePnL('SOL', 1),
          pnlAllTime: generatePnL('SOL', 2),
          isNative: true,
        });

        // Add tokens with metadata
        tokenAccounts.forEach(acc => {
          const info = acc.account.data.parsed.info;
          const balance = info.tokenAmount.uiAmount || 0;

          if (balance > 0) {
            const price = prices[info.mint] || 0;
            const tokenMeta = metadata.get(info.mint);

            fetchedTokens.push({
              id: info.mint,
              mint: info.mint,
              symbol: tokenMeta?.symbol || info.mint.slice(0, 4).toUpperCase(),
              name: tokenMeta?.name || 'Unknown Token',
              balance,
              decimals: info.tokenAmount.decimals,
              usdValue: balance * price,
              price,
              logoURI: tokenMeta?.logoURI,
              pnl24h: generatePnL(info.mint, 1),
              pnlAllTime: generatePnL(info.mint, 2),
            });
          }
        });
      }

      // Sort tokens by USD value
      fetchedTokens.sort((a, b) => b.usdValue - a.usdValue);

      // Fetch transactions
      const { txs, hasMore } = await fetchTransactions(walletAddress, TX_FETCH_LIMIT);

      setTokens(fetchedTokens);
      setNfts(fetchedNfts);
      setTransactions(txs);
      setHasMoreTxFromAPI(hasMore);

    } catch (err) {
      console.error('Error fetching portfolio:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio');
    } finally {
      setLoading(false);
    }
  }, [walletAddress, provider, testPing, fetchAssetsHelius, fetchAssetsQuickNode, fetchPrices, fetchTransactions]);

  // Calculate portfolio stats
  const stats = useMemo((): PortfolioStats => {
    const totalValue = tokens.reduce((sum, t) => sum + t.usdValue, 0);

    // Calculate weighted average P&L
    const weightedPnl24h = tokens.reduce((sum, t) => sum + (t.pnl24h * t.usdValue), 0) / (totalValue || 1);
    const weightedPnlAllTime = tokens.reduce((sum, t) => sum + (t.pnlAllTime * t.usdValue), 0) / (totalValue || 1);

    return {
      totalValue,
      pnl24h: totalValue * (weightedPnl24h / 100),
      pnl24hPercent: weightedPnl24h || generatePnL(walletAddress || 'default', 1),
      pnlAllTime: totalValue * (weightedPnlAllTime / 100),
      pnlAllTimePercent: weightedPnlAllTime || generatePnL(walletAddress || 'default', 2),
      tokenCount: tokens.length,
      nftCount: nfts.length,
    };
  }, [tokens, nfts, walletAddress]);

  // Global stats (mock for demo)
  const globalStats = useMemo((): GlobalStats => ({
    totalUsers: 12847,
    totalVolume: 45678234,
    activeWallets24h: 3421,
    transactionsToday: 89432,
  }), []);

  // Paginated data
  const paginatedTokens = useMemo(() => {
    const start = (tokenPage - 1) * TOKENS_PER_PAGE;
    const end = start + TOKENS_PER_PAGE;
    return tokens.slice(start, end);
  }, [tokens, tokenPage]);

  const paginatedNfts = useMemo(() => {
    const start = (nftPage - 1) * NFTS_PER_PAGE;
    const end = start + NFTS_PER_PAGE;
    return nfts.slice(start, end);
  }, [nfts, nftPage]);

  const paginatedTransactions = useMemo(() => {
    const start = (activityPage - 1) * ACTIVITY_PER_PAGE;
    const end = start + ACTIVITY_PER_PAGE;
    return transactions.slice(start, end);
  }, [transactions, activityPage]);

  // Total pages
  const totalTokenPages = Math.ceil(tokens.length / TOKENS_PER_PAGE);
  const totalNftPages = Math.ceil(nfts.length / NFTS_PER_PAGE);
  const totalActivityPages = Math.ceil(transactions.length / ACTIVITY_PER_PAGE);

  // Page navigation functions
  const setTokenPageSafe = useCallback((page: number) => {
    setTokenPage(Math.max(1, Math.min(page, totalTokenPages || 1)));
  }, [totalTokenPages]);

  const setNftPageSafe = useCallback((page: number) => {
    setNftPage(Math.max(1, Math.min(page, totalNftPages || 1)));
  }, [totalNftPages]);

  const setActivityPageSafe = useCallback((page: number) => {
    setActivityPage(Math.max(1, Math.min(page, totalActivityPages || 1)));
  }, [totalActivityPages]);

  // Load more functions (keeping for backward compatibility)
  const loadMoreTokens = useCallback(() => {
    if (tokenPage < totalTokenPages) {
      setTokenPage(p => p + 1);
    }
  }, [tokenPage, totalTokenPages]);

  const loadMoreNfts = useCallback(() => {
    if (nftPage < totalNftPages) {
      setNftPage(p => p + 1);
    }
  }, [nftPage, totalNftPages]);

  // Load more transactions from API (when user reaches end of current data)
  const loadMoreTransactionsFromAPI = useCallback(async () => {
    if (!walletAddress || !hasMoreTxFromAPI || loadingMoreTx) return;

    // Get the last transaction signature as cursor
    const lastTx = transactions[transactions.length - 1];
    if (!lastTx) return;

    setLoadingMoreTx(true);
    try {
      const { txs: newTxs, hasMore } = await fetchTransactions(walletAddress, TX_FETCH_LIMIT, lastTx.signature);

      if (newTxs.length > 0) {
        setTransactions(prev => [...prev, ...newTxs]);
      }
      setHasMoreTxFromAPI(hasMore);
    } catch (err) {
      console.error('Error loading more transactions:', err);
    } finally {
      setLoadingMoreTx(false);
    }
  }, [walletAddress, hasMoreTxFromAPI, loadingMoreTx, transactions, fetchTransactions]);

  // Fetch on mount and when wallet/provider changes
  useEffect(() => {
    // Check if provider changed
    if (prevProvider.current !== provider) {
      setSwitching(true);
      prevProvider.current = provider;
    }
    fetchPortfolio(true);
  }, [fetchPortfolio, provider]);

  // Reset switching state after loading completes
  useEffect(() => {
    if (!loading && switching) {
      // Add a small delay to show the switching animation
      const timer = setTimeout(() => {
        setSwitching(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loading, switching]);

  // Switch provider
  const switchProvider = useCallback((newProvider: RPCProvider) => {
    if (newProvider !== provider) {
      setSwitching(true);
      setProvider(newProvider);
    }
  }, [provider]);

  return {
    // Data
    tokens: paginatedTokens,
    allTokens: tokens,
    nfts: paginatedNfts,
    allNfts: nfts,
    transactions: paginatedTransactions,
    allTransactions: transactions,
    stats,
    globalStats,

    // Provider
    provider,
    switchProvider,
    ping,
    rpcUrl,

    // Loading state
    loading,
    switching, // Provider switching state for overlay
    error,

    // Pagination - Tokens
    tokenPage,
    totalTokenPages,
    totalTokens: tokens.length,
    setTokenPage: setTokenPageSafe,
    tokensPerPage: TOKENS_PER_PAGE,
    hasMoreTokens: tokenPage < totalTokenPages,
    loadMoreTokens,

    // Pagination - NFTs
    nftPage,
    totalNftPages,
    totalNfts: nfts.length,
    setNftPage: setNftPageSafe,
    nftsPerPage: NFTS_PER_PAGE,
    hasMoreNfts: nftPage < totalNftPages,
    loadMoreNfts,

    // Pagination - Activity
    activityPage,
    totalActivityPages,
    totalActivity: transactions.length,
    setActivityPage: setActivityPageSafe,
    activityPerPage: ACTIVITY_PER_PAGE,
    hasMoreTxFromAPI,
    loadingMoreTx,
    loadMoreTransactionsFromAPI,

    // Actions
    refresh: () => fetchPortfolio(true),
    testPing,
  };
}

export default usePortfolio;
