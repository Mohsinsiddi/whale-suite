/**
 * Confidential Whale Badge - SDK
 *
 * Single source of truth for UI integration with the Confidential Whale Badge program.
 * All encryption/decryption uses INCO SDK.
 *
 * @example
 * ```typescript
 * import {
 *   PROGRAM_ID,
 *   INCO_PROGRAM_ID,
 *   deriveBadgePda,
 *   encryptBadgeValues,
 *   decryptProof,
 *   buildClaimBadgeTransaction,
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
  TIER_ICONS,
  TIER_COLORS,
  TIER_GRADIENTS,
  // Privacy-first design
  PRIVACY_DESIGN,
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
  getTierInfo,
  getAllTiers,
  getExpectedProofResults,
  generatePaymentId,
} from "./constants";

// Export crypto helpers (INCO encryption/decryption)
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
  decryptMultipleProofs,
  // Raw INCO SDK re-exports
  encryptValue,
  hexToBuffer,
  decrypt,
} from "./crypto";

// Export instruction builders and transaction helpers
export {
  // Instruction discriminators
  INSTRUCTION_DISCRIMINATORS,
  // Instruction builders
  buildClaimBadgeInstruction,
  buildUpgradeTierInstruction,
  buildCloseBadgeInstruction,
  // Account data types
  type ConfigAccountData,
  type BadgeAccountData,
  // Account fetchers
  fetchConfigAccount,
  fetchBadgeAccount,
  // Transaction builders
  type ClaimBadgeParams,
  type UpgradeTierParams,
  type CloseBadgeParams,
  buildClaimBadgeTransaction,
  buildUpgradeTierTransaction,
  buildCloseBadgeTransaction,
  // Display helpers
  getTierDisplayInfo,
  getAllTiersForDisplay,
  PRIVACY_INFO,
} from "./instructions";
