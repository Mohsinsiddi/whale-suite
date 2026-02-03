/**
 * Known Program IDs for Transaction Classification
 * Used to detect and label transactions from specific protocols
 */

// === WHALE SUITE PROGRAMS (Our App) ===
export const WHALE_SUITE_PROGRAMS = {
  // Main program ID on mainnet
  MAIN: '3aov6rjb4U8YjkjMjkA9Tbz3FMNdLTscKJVrbTAcWFxs',
  // INCO FHE Bridge program (devnet)
  INCO_FHE: '5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj',
} as const;

// === PRIVACY PROTOCOLS ===
export const PRIVACY_PROGRAMS = {
  // Privacy Cash (Elusiv) - Private balance hiding
  // Real program ID from mainnet transactions
  PRIVACY_CASH: '9fhQBbumKEFuXtMBDw8AaQyAjCorLGJQiS3skWZdQyQD',
  ELUSIV: '9fhQBbumKEFuXtMBDw8AaQyAjCorLGJQiS3skWZdQyQD', // Same as Privacy Cash

  // ShadowWire - Private transfers (mainnet)
  SHADOW_WIRE: 'GQBqwwoikYh7p6KEUHDUu5r9dHHXx9tMGskAPubmFPzD',

  // Dark Pool / Darklake - Private OTC
  // Real program ID from mainnet transactions
  DARKLAKE: 'darkr3FB87qAZmgLwKov6Hk9Yiah5UT4rUYu8Zhthw1',
  DARK_POOL: 'darkr3FB87qAZmgLwKov6Hk9Yiah5UT4rUYu8Zhthw1', // Same as Darklake

  // Light Protocol - Compressed accounts
  LIGHT_PROTOCOL: 'LightProtoco1111111111111111111111111111', // Placeholder - need real ID
} as const;

// === DEX / SWAP PROGRAMS ===
export const DEX_PROGRAMS = {
  // Jupiter Aggregator
  JUPITER_V6: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
  JUPITER_V4: 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB',
  JUPITER_DCA: 'DCA265Vj8a9CEuX1eb1LWRnDT7uK6q1xMipnNyatn23M',
  JUPITER_LIMIT: 'jupoNjAxXgZ4rjzxzPMP4oxduvQsQtZzyknqvzYNrNu',

  // Raydium
  RAYDIUM_AMM: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
  RAYDIUM_CPMM: 'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C',
  RAYDIUM_CLMM: 'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK',

  // Orca
  ORCA_WHIRLPOOL: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
  ORCA_TOKEN_SWAP: '9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP',

  // Meteora
  METEORA_DLMM: 'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo',
  METEORA_POOLS: 'Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB',

  // Phoenix
  PHOENIX: 'PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY',

  // Pump.fun / Pump AMM
  PUMP_FUN: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
  PUMP_AMM: 'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA',

  // Openbook
  OPENBOOK_V2: 'opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb',
  SERUM_DEX: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
} as const;

// === NFT MARKETPLACES ===
export const NFT_PROGRAMS = {
  // Magic Eden
  MAGIC_EDEN_V2: 'M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K',
  MAGIC_EDEN_V3: 'E8cU1WiRWjanGxmn96ewBgk9vPTcL6AEZ1t6F6fkgUWe',

  // Tensor
  TENSOR: 'TSWAPaqyCSx2KABk68Shruf4rp7CxcNi8hAsbdwmHbN',
  TENSOR_SWAP: 'TCMPhJdwDryooaGtiocG1u3xcYbRpiJzb283XfCZsDp',

  // Metaplex
  METAPLEX_TOKEN_METADATA: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
  METAPLEX_AUCTION_HOUSE: 'hausS13jsjafwWwGqZTUQRmWyvyxn9EQpqMwV1PBBmk',
  METAPLEX_BUBBLEGUM: 'BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY',

  // Solana FM Collections
  HYPERSPACE: 'HYPERfwdTjyJ2SCaKHmpF2MtrXqWxrsotYDsTrshHWq8',
} as const;

// === STAKING / LIQUID STAKING ===
export const STAKING_PROGRAMS = {
  // Marinade
  MARINADE: 'MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD',

  // Jito
  JITO: 'Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb',

  // Blaze
  BLAZE: 'BLZEBJLJp7LMg2QQjKdgvHgZBiCcEwmfz6k5jDFDALBW',

  // Native Staking
  STAKE: 'Stake11111111111111111111111111111111111111',
} as const;

// === LENDING / BORROWING ===
export const LENDING_PROGRAMS = {
  // Solend
  SOLEND: 'So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo',

  // Marginfi
  MARGINFI: 'MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA',

  // Kamino
  KAMINO: 'KLend2g3cP87ber41DjE7MUGdTKUCBxZaFuD1pfqPb2',

  // Drift
  DRIFT: 'dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH',
} as const;

// === PREDICTION MARKETS ===
export const PREDICTION_PROGRAMS = {
  // PNP Exchange (Anonymous betting) - Mainnet
  PNP: '6fnYZUSyp3vJxTNnayq5S62d363EFaGARnqYux5bqrxb',

  // Hedgehog
  HEDGEHOG: 'HHog1111111111111111111111111111111111111', // Placeholder

  // Drift - Perpetuals
  DRIFT_PERPS: 'dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH',
} as const;

// === SYSTEM PROGRAMS ===
export const SYSTEM_PROGRAMS = {
  SYSTEM: '11111111111111111111111111111111',
  TOKEN: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  TOKEN_2022: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
  ASSOCIATED_TOKEN: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  MEMO: 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
  COMPUTE_BUDGET: 'ComputeBudget111111111111111111111111111111',
} as const;

// === ALL PROGRAM IDs MAPPED TO LABELS ===
export const PROGRAM_LABELS: Record<string, { name: string; category: string; icon?: string; color?: string }> = {
  // Whale Suite
  [WHALE_SUITE_PROGRAMS.MAIN]: { name: 'Whale Suite', category: 'privacy', icon: '🐋', color: '#00ff88' },
  [WHALE_SUITE_PROGRAMS.INCO_FHE]: { name: 'INCO FHE', category: 'privacy', icon: '🔐', color: '#00d4ff' },

  // Privacy - Using real program IDs
  [PRIVACY_PROGRAMS.PRIVACY_CASH]: { name: 'Privacy Cash', category: 'privacy', icon: '🔒', color: '#00ff88' },
  [PRIVACY_PROGRAMS.SHADOW_WIRE]: { name: 'ShadowWire', category: 'privacy', icon: '👻', color: '#8b5cf6' },
  [PRIVACY_PROGRAMS.DARKLAKE]: { name: 'Darklake', category: 'privacy', icon: '🌑', color: '#6366f1' },

  // DEX
  [DEX_PROGRAMS.JUPITER_V6]: { name: 'Jupiter', category: 'swap', icon: '🪐', color: '#00D18C' },
  [DEX_PROGRAMS.JUPITER_V4]: { name: 'Jupiter V4', category: 'swap', icon: '🪐', color: '#00D18C' },
  [DEX_PROGRAMS.JUPITER_DCA]: { name: 'Jupiter DCA', category: 'dca', icon: '📊', color: '#00D18C' },
  [DEX_PROGRAMS.JUPITER_LIMIT]: { name: 'Jupiter Limit', category: 'swap', icon: '📈', color: '#00D18C' },
  [DEX_PROGRAMS.RAYDIUM_AMM]: { name: 'Raydium', category: 'swap', icon: '☀️', color: '#58c4f6' },
  [DEX_PROGRAMS.RAYDIUM_CPMM]: { name: 'Raydium CPMM', category: 'swap', icon: '☀️', color: '#58c4f6' },
  [DEX_PROGRAMS.RAYDIUM_CLMM]: { name: 'Raydium CLMM', category: 'swap', icon: '☀️', color: '#58c4f6' },
  [DEX_PROGRAMS.ORCA_WHIRLPOOL]: { name: 'Orca', category: 'swap', icon: '🐋', color: '#FFCE4F' },
  [DEX_PROGRAMS.METEORA_DLMM]: { name: 'Meteora', category: 'swap', icon: '☄️', color: '#00F0FF' },
  [DEX_PROGRAMS.PUMP_FUN]: { name: 'Pump.fun', category: 'swap', icon: '🎈', color: '#39FF14' },
  [DEX_PROGRAMS.PUMP_AMM]: { name: 'Pump AMM', category: 'swap', icon: '🎈', color: '#39FF14' },
  [DEX_PROGRAMS.PHOENIX]: { name: 'Phoenix', category: 'swap', icon: '🔥', color: '#FF6B35' },
  [DEX_PROGRAMS.OPENBOOK_V2]: { name: 'OpenBook', category: 'swap', icon: '📖', color: '#0066FF' },

  // NFT
  [NFT_PROGRAMS.MAGIC_EDEN_V2]: { name: 'Magic Eden', category: 'nft', icon: '✨', color: '#E42575' },
  [NFT_PROGRAMS.MAGIC_EDEN_V3]: { name: 'Magic Eden', category: 'nft', icon: '✨', color: '#E42575' },
  [NFT_PROGRAMS.TENSOR]: { name: 'Tensor', category: 'nft', icon: '🟣', color: '#7c3aed' },
  [NFT_PROGRAMS.TENSOR_SWAP]: { name: 'Tensor', category: 'nft', icon: '🟣', color: '#7c3aed' },
  [NFT_PROGRAMS.METAPLEX_TOKEN_METADATA]: { name: 'Metaplex', category: 'nft', icon: '🎨', color: '#FF6B35' },
  [NFT_PROGRAMS.METAPLEX_BUBBLEGUM]: { name: 'Compressed NFT', category: 'nft', icon: '🫧', color: '#FF6B35' },

  // Staking
  [STAKING_PROGRAMS.MARINADE]: { name: 'Marinade', category: 'staking', icon: '🧊', color: '#36E899' },
  [STAKING_PROGRAMS.JITO]: { name: 'Jito', category: 'staking', icon: '⚡', color: '#8B5CF6' },
  [STAKING_PROGRAMS.BLAZE]: { name: 'Blaze', category: 'staking', icon: '🔥', color: '#FF6B35' },
  [STAKING_PROGRAMS.STAKE]: { name: 'Native Stake', category: 'staking', icon: '🔒', color: '#14F195' },

  // Lending
  [LENDING_PROGRAMS.SOLEND]: { name: 'Solend', category: 'lending', icon: '🏦', color: '#14F195' },
  [LENDING_PROGRAMS.MARGINFI]: { name: 'Marginfi', category: 'lending', icon: '📊', color: '#FFD93D' },
  [LENDING_PROGRAMS.KAMINO]: { name: 'Kamino', category: 'lending', icon: '🏛️', color: '#8B5CF6' },
  [LENDING_PROGRAMS.DRIFT]: { name: 'Drift', category: 'perps', icon: '🌊', color: '#14F195' },

  // Prediction Markets
  [PREDICTION_PROGRAMS.PNP]: { name: 'PNP Exchange', category: 'betting', icon: '🎲', color: '#f59e0b' },

  // System
  [SYSTEM_PROGRAMS.SYSTEM]: { name: 'System', category: 'system', icon: '⚙️', color: '#6b7280' },
  [SYSTEM_PROGRAMS.TOKEN]: { name: 'Token', category: 'system', icon: '🪙', color: '#6b7280' },
  [SYSTEM_PROGRAMS.TOKEN_2022]: { name: 'Token-2022', category: 'system', icon: '🪙', color: '#6b7280' },
  [SYSTEM_PROGRAMS.ASSOCIATED_TOKEN]: { name: 'ATA', category: 'system', icon: '🔗', color: '#6b7280' },
};

// === HELIUS TRANSACTION TYPES TO LABELS ===
export const HELIUS_TX_TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  // Transfers
  'TRANSFER': { label: 'Transfer', icon: '↗️', color: '#00ff88' },
  'SOL_TRANSFER': { label: 'SOL Transfer', icon: '◎', color: '#00ff88' },
  'TOKEN_TRANSFER': { label: 'Token Transfer', icon: '🪙', color: '#00d4ff' },

  // Swaps
  'SWAP': { label: 'Swap', icon: '🔄', color: '#00D18C' },
  'TOKEN_SWAP': { label: 'Token Swap', icon: '🔄', color: '#00D18C' },

  // NFT
  'NFT_SALE': { label: 'NFT Sale', icon: '🛒', color: '#E42575' },
  'NFT_MINT': { label: 'NFT Mint', icon: '🎨', color: '#8b5cf6' },
  'NFT_LISTING': { label: 'NFT Listing', icon: '📋', color: '#E42575' },
  'NFT_BID': { label: 'NFT Bid', icon: '🔨', color: '#E42575' },
  'NFT_CANCEL_LISTING': { label: 'Cancel Listing', icon: '❌', color: '#ff4444' },
  'NFT_BID_CANCELLED': { label: 'Bid Cancelled', icon: '❌', color: '#ff4444' },
  'COMPRESSED_NFT_MINT': { label: 'cNFT Mint', icon: '🫧', color: '#8b5cf6' },
  'COMPRESSED_NFT_TRANSFER': { label: 'cNFT Transfer', icon: '🫧', color: '#00ff88' },

  // DeFi
  'DEPOSIT': { label: 'Deposit', icon: '📥', color: '#00ff88' },
  'WITHDRAW': { label: 'Withdraw', icon: '📤', color: '#ffaa00' },
  'BORROW': { label: 'Borrow', icon: '🏦', color: '#ff6b35' },
  'REPAY': { label: 'Repay', icon: '💳', color: '#00ff88' },
  'LIQUIDATE': { label: 'Liquidate', icon: '⚠️', color: '#ff4444' },

  // Staking
  'STAKE': { label: 'Stake', icon: '🔒', color: '#14F195' },
  'UNSTAKE': { label: 'Unstake', icon: '🔓', color: '#ffaa00' },
  'STAKE_SOL': { label: 'Stake SOL', icon: '🔒', color: '#14F195' },
  'UNSTAKE_SOL': { label: 'Unstake SOL', icon: '🔓', color: '#ffaa00' },
  'CLAIM_REWARDS': { label: 'Claim Rewards', icon: '🎁', color: '#00ff88' },

  // LP / AMM
  'ADD_LIQUIDITY': { label: 'Add Liquidity', icon: '💧', color: '#00d4ff' },
  'REMOVE_LIQUIDITY': { label: 'Remove Liquidity', icon: '💧', color: '#ffaa00' },
  'CREATE_POOL': { label: 'Create Pool', icon: '🏊', color: '#8b5cf6' },

  // Governance
  'VOTE': { label: 'Vote', icon: '🗳️', color: '#8b5cf6' },
  'CREATE_PROPOSAL': { label: 'Proposal', icon: '📝', color: '#8b5cf6' },

  // Token Operations
  'TOKEN_MINT': { label: 'Token Mint', icon: '🏭', color: '#00d4ff' },
  'BURN': { label: 'Burn', icon: '🔥', color: '#ff4444' },
  'BURN_NFT': { label: 'Burn NFT', icon: '🔥', color: '#ff4444' },

  // Account
  'INIT_ACCOUNT': { label: 'Init Account', icon: '📂', color: '#6b7280' },
  'CLOSE_ACCOUNT': { label: 'Close Account', icon: '📁', color: '#6b7280' },

  // Unknown / Other
  'UNKNOWN': { label: 'Transaction', icon: '📋', color: '#6b7280' },
};

// === HELIUS SOURCE TO LABELS ===
export const HELIUS_SOURCE_LABELS: Record<string, { name: string; color: string }> = {
  // Privacy SDKs (Our Sponsors)
  'PRIVACY_CASH': { name: 'Privacy Cash', color: '#00ff88' },
  'ELUSIV': { name: 'Privacy Cash', color: '#00ff88' },
  'DARKLAKE': { name: 'Darklake', color: '#6366f1' },
  'DARK_LAKE': { name: 'Darklake', color: '#6366f1' },
  'SHADOWWIRE': { name: 'ShadowWire', color: '#8b5cf6' },
  'SHADOW_WIRE': { name: 'ShadowWire', color: '#8b5cf6' },
  'PNP': { name: 'PNP Exchange', color: '#f59e0b' },
  'PNP_EXCHANGE': { name: 'PNP Exchange', color: '#f59e0b' },

  // DEXs
  'JUPITER': { name: 'Jupiter', color: '#00D18C' },
  'RAYDIUM': { name: 'Raydium', color: '#58c4f6' },
  'ORCA': { name: 'Orca', color: '#FFCE4F' },
  'METEORA': { name: 'Meteora', color: '#00F0FF' },
  'PUMP_AMM': { name: 'Pump.fun', color: '#39FF14' },
  'PUMP_FUN': { name: 'Pump.fun', color: '#39FF14' },
  'PHOENIX': { name: 'Phoenix', color: '#FF6B35' },
  'OPENBOOK_V2': { name: 'OpenBook', color: '#0066FF' },

  // NFT
  'MAGIC_EDEN': { name: 'Magic Eden', color: '#E42575' },
  'TENSOR': { name: 'Tensor', color: '#7c3aed' },

  // Staking/Lending
  'MARINADE': { name: 'Marinade', color: '#36E899' },
  'JITO': { name: 'Jito', color: '#8B5CF6' },
  'SOLEND': { name: 'Solend', color: '#14F195' },
  'MARGINFI': { name: 'Marginfi', color: '#FFD93D' },
  'KAMINO': { name: 'Kamino', color: '#8B5CF6' },
  'DRIFT': { name: 'Drift', color: '#14F195' },

  // System
  'SYSTEM_PROGRAM': { name: 'System', color: '#6b7280' },
  'BUBBLEGUM': { name: 'Bubblegum', color: '#FF6B35' },
  'ASSOCIATED_TOKEN_PROGRAM': { name: 'ATA', color: '#6b7280' },
};

// === OUR APP SDK TO LABELS (for matching with our DB activity) ===
export const APP_SDK_LABELS: Record<string, { name: string; icon: string; color: string; category: string }> = {
  'privacy-cash': { name: 'Privacy Cash', icon: '🔒', color: '#00ff88', category: 'privacy' },
  'shadow-wire': { name: 'ShadowWire', icon: '👻', color: '#8b5cf6', category: 'privacy' },
  'darklake': { name: 'Darklake', icon: '🌑', color: '#6366f1', category: 'privacy' },
  'jupiter': { name: 'Jupiter', icon: '🪐', color: '#00D18C', category: 'swap' },
  'pnp': { name: 'PNP Exchange', icon: '🎲', color: '#f59e0b', category: 'betting' },
};

// === OUR APP ACTIVITY TYPES ===
export const APP_ACTIVITY_TYPES: Record<string, { label: string; icon: string; color: string }> = {
  'privacy_deposit': { label: 'Privacy Deposit', icon: '📥', color: '#00ff88' },
  'privacy_withdraw': { label: 'Privacy Withdraw', icon: '📤', color: '#ffaa00' },
  'shadow_transfer': { label: 'Shadow Transfer', icon: '👻', color: '#8b5cf6' },
  'jupiter_swap': { label: 'Swap', icon: '🔄', color: '#00D18C' },
  'dark_pool_trade': { label: 'Dark Pool', icon: '🌑', color: '#6366f1' },
  'pnp_bet': { label: 'Anonymous Bet', icon: '🎲', color: '#f59e0b' },
  'pnp_claim': { label: 'Claim Winnings', icon: '🎁', color: '#00ff88' },
};

// Helper function to get program label
export function getProgramLabel(programId: string): { name: string; category: string; icon?: string; color?: string } | null {
  return PROGRAM_LABELS[programId] || null;
}

// Helper function to get transaction type info
export function getTxTypeInfo(type: string): { label: string; icon: string; color: string } {
  return HELIUS_TX_TYPE_LABELS[type] || HELIUS_TX_TYPE_LABELS['UNKNOWN'];
}

// Helper function to get source info
export function getSourceInfo(source: string): { name: string; color: string } | null {
  return HELIUS_SOURCE_LABELS[source] || null;
}

// Check if a program is a privacy protocol
export function isPrivacyProgram(programId: string): boolean {
  const privacyIds = Object.values(PRIVACY_PROGRAMS) as string[];
  const whaleSuiteIds = Object.values(WHALE_SUITE_PROGRAMS) as string[];
  return privacyIds.includes(programId) || whaleSuiteIds.includes(programId);
}

// Check if a program is a DEX
export function isDexProgram(programId: string): boolean {
  const dexIds = Object.values(DEX_PROGRAMS) as string[];
  return dexIds.includes(programId);
}

// Check if a program is NFT related
export function isNftProgram(programId: string): boolean {
  const nftIds = Object.values(NFT_PROGRAMS) as string[];
  return nftIds.includes(programId);
}
