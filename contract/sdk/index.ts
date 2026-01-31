/**
 * Confidential Whale Badge - SDK
 *
 * Complete SDK for UI integration with the Confidential Whale Badge program.
 *
 * @example
 * ```typescript
 * import {
 *   PROGRAM_ID,
 *   INCO_PROGRAM_ID,
 *   deriveBadgePda,
 *   encryptBadgeValues,
 *   decryptProof,
 * } from "@/contract/sdk";
 * ```
 */

// Export IDL
export { default as IDL } from "./confidential_whale_badge.json";

// Export TypeScript types
export * from "./confidential_whale_badge";

// Export constants and PDA helpers
export {
  // Program IDs
  PROGRAM_ID,
  INCO_PROGRAM_ID,
  // Seeds
  CONFIG_SEED,
  BADGE_SEED,
  PAYMENT_SEED,
  ESCROW_SEED,
  // Tier constants
  TIER_BRONZE,
  TIER_SILVER,
  TIER_GOLD,
  TIER_DIAMOND,
  TIER_LEGENDARY,
  TIER_PRICES,
  TIER_NAMES,
  // Defaults
  DEFAULT_PAYMENT_EXPIRY,
  // PDA derivation
  deriveConfigPda,
  deriveBadgePda,
  derivePaymentPda,
  deriveEscrowPda,
  deriveAllowancePda,
  // Helpers
  getTierPrice,
  getTierName,
  generatePaymentId,
} from "./constants";

// Export crypto helpers
export {
  // Hashing
  hashPubkeyTo128Bits,
  // Encryption
  encryptForInco,
  encryptPubkeyHash,
  encryptBadgeValues,
  encryptPaymentData,
  // Decryption
  decryptProof,
  decryptProofWithSigner,
  // Signatures
  signAccessMessage,
  verifyAccessSignature,
} from "./crypto";
