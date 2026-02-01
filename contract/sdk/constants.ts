/**
 * Confidential Whale Badge - SDK Constants
 *
 * Use these constants in your UI for program integration.
 */

import { PublicKey } from "@solana/web3.js";

// ============================================
// PROGRAM IDs
// ============================================

/** Main program ID (Devnet) */
export const PROGRAM_ID = new PublicKey("3aov6rjb4U8YjkjMjkA9Tbz3FMNdLTscKJVrbTAcWFxs");

/** INCO Lightning program ID */
export const INCO_PROGRAM_ID = new PublicKey("5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj");

// ============================================
// PDA SEEDS
// ============================================

export const CONFIG_SEED = Buffer.from("config");
export const BADGE_SEED = Buffer.from("badge");
export const PAYMENT_SEED = Buffer.from("payment");
export const ESCROW_SEED = Buffer.from("escrow");

// ============================================
// BADGE TIER CONSTANTS
// ============================================

export const TIER_BRONZE = 1;
export const TIER_SILVER = 2;
export const TIER_GOLD = 3;
export const TIER_DIAMOND = 4;
export const TIER_LEGENDARY = 5;

/** Tier prices in lamports */
export const TIER_PRICES: Record<number, number> = {
  [TIER_BRONZE]: 100_000_000,      // 0.1 SOL
  [TIER_SILVER]: 200_000_000,      // 0.2 SOL
  [TIER_GOLD]: 300_000_000,        // 0.3 SOL
  [TIER_DIAMOND]: 400_000_000,     // 0.4 SOL
  [TIER_LEGENDARY]: 500_000_000,   // 0.5 SOL
};

/** Tier names */
export const TIER_NAMES: Record<number, string> = {
  [TIER_BRONZE]: "Bronze",
  [TIER_SILVER]: "Silver",
  [TIER_GOLD]: "Gold",
  [TIER_DIAMOND]: "Diamond",
  [TIER_LEGENDARY]: "Legendary",
};

/** Tier icons */
export const TIER_ICONS: Record<number, string> = {
  [TIER_BRONZE]: "🥉",
  [TIER_SILVER]: "🥈",
  [TIER_GOLD]: "🥇",
  [TIER_DIAMOND]: "💎",
  [TIER_LEGENDARY]: "👑",
};

/** Tier colors (hex) */
export const TIER_COLORS: Record<number, string> = {
  [TIER_BRONZE]: "#CD7F32",
  [TIER_SILVER]: "#C0C0C0",
  [TIER_GOLD]: "#FFD700",
  [TIER_DIAMOND]: "#B9F2FF",
  [TIER_LEGENDARY]: "#FF00FF",
};

/** Tier gradient classes for Tailwind */
export const TIER_GRADIENTS: Record<number, string> = {
  [TIER_BRONZE]: "from-amber-600 to-amber-400",
  [TIER_SILVER]: "from-gray-400 to-gray-200",
  [TIER_GOLD]: "from-yellow-500 to-yellow-300",
  [TIER_DIAMOND]: "from-cyan-400 to-blue-300",
  [TIER_LEGENDARY]: "from-purple-500 to-pink-400",
};

// ============================================
// PAYMENT DEFAULTS
// ============================================

/** Default payment expiry in seconds (7 days) */
export const DEFAULT_PAYMENT_EXPIRY = 7 * 24 * 60 * 60; // 604800 seconds

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Derive Config PDA
 */
export function deriveConfigPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([CONFIG_SEED], PROGRAM_ID);
}

/**
 * Derive Badge PDA for a user with multi-badge support
 * Seeds: ["badge", user_pubkey, badge_id_le_bytes]
 *
 * @param userPubkey - User's public key
 * @param badgeId - Badge ID (default 0 for first badge)
 */
export function deriveBadgePda(userPubkey: PublicKey, badgeId: bigint = BigInt(0)): [PublicKey, number] {
  const badgeIdBuffer = Buffer.alloc(8);
  badgeIdBuffer.writeBigUInt64LE(badgeId);
  return PublicKey.findProgramAddressSync(
    [BADGE_SEED, userPubkey.toBuffer(), badgeIdBuffer],
    PROGRAM_ID
  );
}

/**
 * Derive Payment PDA
 */
export function derivePaymentPda(paymentId: Uint8Array): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [PAYMENT_SEED, paymentId],
    PROGRAM_ID
  );
}

/**
 * Derive Escrow PDA
 */
export function deriveEscrowPda(paymentId: Uint8Array): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [ESCROW_SEED, paymentId],
    PROGRAM_ID
  );
}

/**
 * Derive INCO Allowance PDA for a handle
 */
export function deriveAllowancePda(handle: bigint, owner: PublicKey): [PublicKey, number] {
  const buf = Buffer.alloc(16);
  let v = handle;
  for (let i = 0; i < 16; i++) {
    buf[i] = Number(v & BigInt(0xff));
    v >>= BigInt(8);
  }
  return PublicKey.findProgramAddressSync(
    [buf, owner.toBuffer()],
    INCO_PROGRAM_ID
  );
}

/**
 * Get tier price in lamports
 */
export function getTierPrice(tier: number): number {
  return TIER_PRICES[tier] || 0;
}

/**
 * Get tier name
 */
export function getTierName(tier: number): string {
  return TIER_NAMES[tier] || "Unknown";
}

/**
 * Generate random payment ID (32 bytes)
 */
export function generatePaymentId(): Uint8Array {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Get full tier info for display
 */
export function getTierInfo(tier: number): {
  tier: number;
  name: string;
  icon: string;
  color: string;
  gradient: string;
  price: number;
  priceSOL: string;
} {
  return {
    tier,
    name: TIER_NAMES[tier] || "Unknown",
    icon: TIER_ICONS[tier] || "❓",
    color: TIER_COLORS[tier] || "#888888",
    gradient: TIER_GRADIENTS[tier] || "from-gray-500 to-gray-400",
    price: TIER_PRICES[tier] || 0,
    priceSOL: `${(TIER_PRICES[tier] || 0) / 1_000_000_000} SOL`,
  };
}

/**
 * Get all tiers for display
 */
export function getAllTiers() {
  return [TIER_BRONZE, TIER_SILVER, TIER_GOLD, TIER_DIAMOND, TIER_LEGENDARY].map(getTierInfo);
}

// ============================================
// PRIVACY-FIRST DESIGN
// ============================================

/**
 * PRIVACY-FIRST BADGE DESIGN
 *
 * The badge tier is NEVER stored in plain text on-chain!
 * Only encrypted INCO handles are stored:
 *
 * - encrypted_tier: INCO u128 handle (encrypted tier value)
 * - proof_bronze: INCO u128 handle (tier >= 1)
 * - proof_silver: INCO u128 handle (tier >= 2)
 * - proof_gold: INCO u128 handle (tier >= 3)
 * - proof_diamond: INCO u128 handle (tier >= 4)
 * - proof_legendary: INCO u128 handle (tier >= 5)
 *
 * CRITICAL: ALL 5 proof handles are ALWAYS non-zero for EVERY tier.
 * This prevents observers from determining tier by checking which
 * handles are zero vs non-zero.
 *
 * To verify tier access:
 * 1. User signs message with wallet
 * 2. INCO decrypts the relevant proof handle
 * 3. Result: "1" (TRUE) or "0" (FALSE)
 *
 * Example decrypt results for each tier:
 * - Bronze:    [TRUE, FALSE, FALSE, FALSE, FALSE]
 * - Silver:    [TRUE, TRUE, FALSE, FALSE, FALSE]
 * - Gold:      [TRUE, TRUE, TRUE, FALSE, FALSE]
 * - Diamond:   [TRUE, TRUE, TRUE, TRUE, FALSE]
 * - Legendary: [TRUE, TRUE, TRUE, TRUE, TRUE]
 */
export const PRIVACY_DESIGN = {
  tierStoredOnChain: false,
  allHandlesNonZero: true,
  decryptRequiresSignature: true,
  observerCanDetermineTier: false,
};

/**
 * Get expected decrypt results for a tier
 */
export function getExpectedProofResults(tier: number): {
  bronze: boolean;
  silver: boolean;
  gold: boolean;
  diamond: boolean;
  legendary: boolean;
} {
  return {
    bronze: tier >= TIER_BRONZE,
    silver: tier >= TIER_SILVER,
    gold: tier >= TIER_GOLD,
    diamond: tier >= TIER_DIAMOND,
    legendary: tier >= TIER_LEGENDARY,
  };
}
