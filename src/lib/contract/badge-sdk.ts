'use client';

/**
 * Confidential Whale Badge SDK Wrapper
 *
 * Re-exports from the canonical SDK at @/contract/sdk
 * This file exists for backward compatibility with existing UI imports.
 */

// Re-export everything from the canonical SDK
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
  // Crypto (INCO encryption/decryption)
  hashPubkeyTo128Bits,
  encryptForInco,
  encryptPubkeyHash,
  encryptBadgeValues,
  encryptPaymentData,
  decryptProof,
  decryptMultipleProofs,
  encryptValue,
  hexToBuffer,
  decrypt,
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
  // IDL
  IDL,
} from '@/contract/sdk';

// Backward compatibility aliases
export { TIER_PRICES as TIER_PRICES_LAMPORTS } from '@/contract/sdk';
