/**
 * Central Token Configuration
 * Consistent token metadata (logo, name, symbol, decimals) across the app
 * Used by: Jupiter Swap, ShadowWire Deposit/Withdraw, Multi-Send
 */

export interface TokenMetadata {
  symbol: string;
  name: string;
  icon: string;
  mint: string;
  decimals: number;
  logoURI: string;
  // Feature flags
  swapEnabled?: boolean;      // Available in Jupiter swap
  shadowWireEnabled?: boolean; // Available in ShadowWire deposit/withdraw
  multiSendEnabled?: boolean;  // Available in multi-send
}

// Token mint addresses (from ShadowWire SDK + popular tokens)
export const TOKEN_MINTS = {
  // Native
  SOL: 'So11111111111111111111111111111111111111112',
  WSOL: 'So11111111111111111111111111111111111111112', // Wrapped SOL (same mint as SOL)
  // Stablecoins
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  USD1: 'USD1ttGY1N17NEEHLmELoaybftRBUSErhqYiQzvEmuB', // World Liberty Financial USD
  // Meme coins
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  // DeFi
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  JTO: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
  // ShadowWire SDK supported tokens
  RADR: 'CzFvsLdUazabdiu9TYXujj4EY495fG7VgJJ3vQs6bonk',
  WLFI: 'WLFinEv6ypjkczcS83FZqFpgFZYwQXutRbxGe7oC16g',
} as const;

// Comprehensive token metadata with logos and feature flags
export const TOKENS: Record<string, TokenMetadata> = {
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    icon: '◎',
    mint: TOKEN_MINTS.SOL,
    decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    swapEnabled: true,
    shadowWireEnabled: true,
    multiSendEnabled: true,
  },
  WSOL: {
    symbol: 'WSOL',
    name: 'Wrapped SOL',
    icon: '◎',
    mint: TOKEN_MINTS.WSOL,
    decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    swapEnabled: true,       // Only for Jupiter swap
    shadowWireEnabled: false,
    multiSendEnabled: false,
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    icon: '$',
    mint: TOKEN_MINTS.USDC,
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    swapEnabled: true,
    shadowWireEnabled: true,
    multiSendEnabled: true,
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    icon: '₮',
    mint: TOKEN_MINTS.USDT,
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg',
    swapEnabled: true,
    shadowWireEnabled: false, // Not in ShadowWire SDK
    multiSendEnabled: true,
  },
  USD1: {
    symbol: 'USD1',
    name: 'World Liberty Financial USD',
    icon: '💵',
    mint: TOKEN_MINTS.USD1,
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/worldliberty/usd1-metadata/refs/heads/main/logo.png',
    swapEnabled: true,
    shadowWireEnabled: true,
    multiSendEnabled: true,
  },
  BONK: {
    symbol: 'BONK',
    name: 'Bonk',
    icon: '🐕',
    mint: TOKEN_MINTS.BONK,
    decimals: 5,
    logoURI: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
    swapEnabled: true,
    shadowWireEnabled: true,
    multiSendEnabled: true,
  },
  WIF: {
    symbol: 'WIF',
    name: 'dogwifhat',
    icon: '🎩',
    mint: TOKEN_MINTS.WIF,
    decimals: 6,
    logoURI: 'https://dd.dexscreener.com/ds-data/tokens/solana/EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm.png',
    swapEnabled: true,
    shadowWireEnabled: false,
    multiSendEnabled: false,
  },
  JUP: {
    symbol: 'JUP',
    name: 'Jupiter',
    icon: '♃',
    mint: TOKEN_MINTS.JUP,
    decimals: 6,
    logoURI: 'https://static.jup.ag/jup/icon.png',
    swapEnabled: true,
    shadowWireEnabled: false,
    multiSendEnabled: false,
  },
  JTO: {
    symbol: 'JTO',
    name: 'Jito',
    icon: '⚡',
    mint: TOKEN_MINTS.JTO,
    decimals: 9,
    logoURI: 'https://metadata.jito.network/token/jto/image',
    swapEnabled: true,
    shadowWireEnabled: false,
    multiSendEnabled: false,
  },
  RADR: {
    symbol: 'RADR',
    name: 'Radr',
    icon: '📡',
    mint: TOKEN_MINTS.RADR,
    decimals: 9,
    logoURI: 'https://purple-binding-tarsier-43.mypinata.cloud/ipfs/bafybeihonwaxpjnk6jlzd2uujz2puur7dlbacq3k2s66lsnkip2auegx54',
    swapEnabled: true,
    shadowWireEnabled: true, // ShadowWire native token
    multiSendEnabled: true,
  },
  WLFI: {
    symbol: 'WLFI',
    name: 'World Liberty Financial',
    icon: '🗽',
    mint: TOKEN_MINTS.WLFI,
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/worldliberty/usd1-metadata/refs/heads/main/wlfi-logo.png',
    swapEnabled: true,
    shadowWireEnabled: true,
    multiSendEnabled: true,
  },
};

// Get token list as array
export const TOKEN_LIST = Object.values(TOKENS);

// Filtered token lists by feature
export const SWAP_TOKENS = TOKEN_LIST.filter(t => t.swapEnabled);
export const SHADOWWIRE_POOL_TOKENS = TOKEN_LIST.filter(t => t.shadowWireEnabled);
export const MULTI_SEND_TOKEN_LIST = TOKEN_LIST.filter(t => t.multiSendEnabled);

// Type definitions
export type TokenSymbol = keyof typeof TOKEN_MINTS;
export type ShadowWireTokenSymbol = 'SOL' | 'USDC' | 'USD1' | 'BONK' | 'RADR' | 'WLFI';
export type MultiSendTokenSymbol = 'SOL' | 'USDC' | 'USDT' | 'USD1' | 'BONK' | 'RADR' | 'WLFI';

// Legacy exports for compatibility
export const MULTI_SEND_TOKENS = ['SOL', 'USDC', 'USDT', 'USD1'] as const;
export const SHADOWWIRE_TOKENS = ['SOL', 'USDC', 'USD1', 'BONK', 'RADR', 'WLFI'] as const;

// ShadowWire minimum amounts (in token units, not smallest units)
// From @radr/shadowwire SDK TOKEN_MINIMUMS (tokens not listed use DEFAULT)
// SDK DEFAULT = 10^13 smallest units
export const SHADOWWIRE_MINIMUMS: Record<string, number> = {
  SOL: 0.1,           // 100000000 lamports
  USDC: 5,            // 5000000 (6 decimals)
  USD1: 5,            // 5000000 (6 decimals)
  WLFI: 10,           // 10000000 (6 decimals)
  BONK: 100000000,    // DEFAULT: 10^13 / 10^5 = 100M BONK
  RADR: 10000,        // DEFAULT: 10^13 / 10^9 = 10K RADR
  DEFAULT: 100000000, // Fallback for unknown tokens
};

// ShadowWire fees (percentage)
export const SHADOWWIRE_FEES: Record<string, number> = {
  SOL: 0.5,
  RADR: 0.3,
  DEFAULT: 1,
};

// Get minimum amount for a token
export function getShadowWireMinimum(symbol: string): number {
  return SHADOWWIRE_MINIMUMS[symbol.toUpperCase()] || SHADOWWIRE_MINIMUMS.DEFAULT;
}

// Get fee percentage for a token
export function getShadowWireFee(symbol: string): number {
  return SHADOWWIRE_FEES[symbol.toUpperCase()] || SHADOWWIRE_FEES.DEFAULT;
}

// Get token metadata by symbol
export function getTokenBySymbol(symbol: string): TokenMetadata | undefined {
  return TOKENS[symbol.toUpperCase()];
}

// Get token metadata by mint address
export function getTokenByMint(mint: string): TokenMetadata | undefined {
  return Object.values(TOKENS).find(t => t.mint.toLowerCase() === mint.toLowerCase());
}

// Get token logo URL
export function getTokenLogo(symbolOrMint: string): string {
  const token = getTokenBySymbol(symbolOrMint) || getTokenByMint(symbolOrMint);
  return token?.logoURI || '';
}

// Get token decimals
export function getTokenDecimals(symbolOrMint: string): number {
  const token = getTokenBySymbol(symbolOrMint) || getTokenByMint(symbolOrMint);
  return token?.decimals || 6;
}

export default TOKENS;

// =============================================================================
// PRIVACY CASH TOKEN CONFIGURATION
// Separate from ShadowWire to avoid breaking existing functionality
// Based on Privacy Cash SDK: SOL, USDC, USDT, ZEC, ORE, STORE
// =============================================================================

export interface PrivacyCashToken {
  symbol: string;
  name: string;
  icon: string;
  mint: string;
  decimals: number;
  logoURI: string;
  // Privacy Cash specific
  unitsPerToken: number;  // SDK's units_per_token value
  prefix: string;         // SDK's storage prefix
  withdrawalFee: number;  // Withdrawal fee in token units (relay fee)
  minDeposit: number;     // Minimum deposit amount
  minWithdrawal: number;  // Minimum withdrawal amount
}

export const PRIVACY_CASH_TOKENS: PrivacyCashToken[] = [
  {
    symbol: 'SOL',
    name: 'Solana',
    icon: '◎',
    mint: 'So11111111111111111111111111111111111111112',
    decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    unitsPerToken: 1e9,
    prefix: '',
    withdrawalFee: 0.006,    // ~6,000,000 lamports relay fee
    minDeposit: 0.001,
    minWithdrawal: 0.007,    // Must be > fee to receive something
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    icon: '$',
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    unitsPerToken: 1e6,
    prefix: 'usdc_',
    withdrawalFee: 1,        // 1 USDC relay fee
    minDeposit: 0.01,
    minWithdrawal: 1.01,
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    icon: '₮',
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg',
    unitsPerToken: 1e6,
    prefix: 'usdt_',
    withdrawalFee: 1,        // 1 USDT relay fee
    minDeposit: 0.01,
    minWithdrawal: 1.01,
  },
  {
    symbol: 'ZEC',
    name: 'Zcash (Wormhole)',
    icon: '🔐',
    mint: 'A7bdiYdS5GjqGFtxf17ppRHtDKPkkRqbKtR27dxvQXaS',
    decimals: 8,
    logoURI: '', // Use icon fallback - Wormhole ZEC logo not reliably available
    unitsPerToken: 1e8,
    prefix: 'zec_',
    withdrawalFee: 0.0001,   // Small ZEC fee
    minDeposit: 0.0001,
    minWithdrawal: 0.0002,
  },
  {
    symbol: 'ORE',
    name: 'Ore',
    icon: '⛏️',
    mint: 'oreoU2P8bN6jkk3jbaiVxYnG1dCXcYxwhwyK9jSybcp',
    decimals: 11,
    logoURI: '', // Use icon fallback
    unitsPerToken: 1e11,
    prefix: 'ore_',
    withdrawalFee: 0.01,     // 0.01 ORE fee
    minDeposit: 0.001,
    minWithdrawal: 0.011,
  },
  {
    symbol: 'STORE',
    name: 'Store Protocol',
    icon: '🏪',
    mint: 'sTorERYB6xAZ1SSbwpK3zoK2EEwbBrc7TZAzg1uCGiH',
    decimals: 11,
    logoURI: '', // Use icon fallback
    unitsPerToken: 1e11,
    prefix: 'store_',
    withdrawalFee: 0.01,     // 0.01 STORE fee
    minDeposit: 0.001,
    minWithdrawal: 0.011,
  },
];

// Privacy Cash token types
export type PrivacyCashTokenSymbol = 'SOL' | 'USDC' | 'USDT' | 'ZEC' | 'ORE' | 'STORE';

// Get Privacy Cash token by symbol
export function getPrivacyCashToken(symbol: string): PrivacyCashToken | undefined {
  return PRIVACY_CASH_TOKENS.find(t => t.symbol.toUpperCase() === symbol.toUpperCase());
}

// Get Privacy Cash token by mint
export function getPrivacyCashTokenByMint(mint: string): PrivacyCashToken | undefined {
  return PRIVACY_CASH_TOKENS.find(t => t.mint.toLowerCase() === mint.toLowerCase());
}

// Get withdrawal fee for a Privacy Cash token
export function getPrivacyCashWithdrawalFee(symbol: string): number {
  const token = getPrivacyCashToken(symbol);
  return token?.withdrawalFee || 0.006; // Default to SOL fee
}

// Get minimum deposit for a Privacy Cash token
export function getPrivacyCashMinDeposit(symbol: string): number {
  const token = getPrivacyCashToken(symbol);
  return token?.minDeposit || 0.001;
}

// Get minimum withdrawal for a Privacy Cash token
export function getPrivacyCashMinWithdrawal(symbol: string): number {
  const token = getPrivacyCashToken(symbol);
  return token?.minWithdrawal || 0.007;
}
