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
export const PROGRAM_ID = new PublicKey("XPbon4Sw7hDArH49W8JNf5LK9nNTvowpRqWDHM2hMLD");

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
export const TIER_PRICES = {
  [TIER_BRONZE]: 100_000_000,      // 0.1 SOL
  [TIER_SILVER]: 200_000_000,      // 0.2 SOL
  [TIER_GOLD]: 300_000_000,        // 0.3 SOL
  [TIER_DIAMOND]: 400_000_000,     // 0.4 SOL
  [TIER_LEGENDARY]: 500_000_000,   // 0.5 SOL
};

/** Tier names */
export const TIER_NAMES = {
  [TIER_BRONZE]: "Bronze",
  [TIER_SILVER]: "Silver",
  [TIER_GOLD]: "Gold",
  [TIER_DIAMOND]: "Diamond",
  [TIER_LEGENDARY]: "Legendary",
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
 * Derive Badge PDA for a user
 */
export function deriveBadgePda(userPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [BADGE_SEED, userPubkey.toBuffer()],
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
