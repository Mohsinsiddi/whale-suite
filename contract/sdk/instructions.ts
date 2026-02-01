/**
 * Confidential Whale Badge - Instruction Builders
 *
 * UI-specific helpers for building transactions.
 * Uses Anchor for account fetching and proper INCO encryption.
 */

import {
  PublicKey,
  SystemProgram,
  Connection,
  TransactionInstruction,
  Transaction,
  ComputeBudgetProgram,
  type Transaction as SolanaTransaction,
} from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import {
  PROGRAM_ID,
  INCO_PROGRAM_ID,
  deriveConfigPda,
  deriveBadgePda,
  TIER_PRICES,
  TIER_NAMES,
  TIER_COLORS,
  TIER_ICONS,
} from "./constants";
import { encryptBadgeValues } from "./crypto";
import IDL from "./confidential_whale_badge.json";

// ============================================
// INSTRUCTION DISCRIMINATORS (from IDL)
// ============================================

export const INSTRUCTION_DISCRIMINATORS = {
  // Badge management
  initialize: Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]),
  claimBadge: Buffer.from([111, 30, 18, 17, 228, 252, 239, 102]),
  closeBadge: Buffer.from([53, 17, 191, 97, 1, 236, 38, 61]),
  upgradeTier: Buffer.from([122, 56, 170, 60, 252, 234, 190, 51]),
  grantAccess: Buffer.from([66, 88, 87, 113, 39, 22, 27, 165]),
  transferBadge: Buffer.from([151, 130, 63, 40, 9, 1, 250, 77]),
  revokeBadge: Buffer.from([108, 171, 101, 185, 99, 36, 98, 112]),
  updatePrices: Buffer.from([62, 161, 234, 136, 106, 26, 18, 160]),
  // Private Payment
  createPrivatePayment: Buffer.from([191, 66, 187, 101, 85, 215, 55, 104]),
  claimPayment: Buffer.from([69, 112, 250, 167, 37, 156, 200, 30]),
  finalizeClaim: Buffer.from([86, 162, 202, 241, 136, 125, 52, 149]),
  cancelPayment: Buffer.from([217, 129, 71, 37, 216, 193, 38, 33]),
} as const;

// ============================================
// SERIALIZATION HELPERS
// ============================================

function serializeBytes(buffer: Buffer): Buffer {
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32LE(buffer.length, 0);
  return Buffer.concat([lengthBuffer, buffer]);
}

function readU128(data: Buffer, offset: number): string {
  let result = BigInt(0);
  for (let i = 15; i >= 0; i--) {
    result = (result << BigInt(8)) | BigInt(data[offset + i]);
  }
  return result.toString();
}

// ============================================
// ANCHOR PROGRAM HELPER
// ============================================

/**
 * Create an Anchor Program instance for the Confidential Whale Badge contract
 * Uses a read-only provider (no wallet needed for fetching)
 */
export function getProgram(connection: Connection): Program {
  // Create a read-only provider (no wallet needed for account fetching)
  const provider = new AnchorProvider(
    connection,
    // Dummy wallet for read-only operations
    {
      publicKey: PublicKey.default,
      signTransaction: async <T extends SolanaTransaction>(tx: T): Promise<T> => tx,
      signAllTransactions: async <T extends SolanaTransaction>(txs: T[]): Promise<T[]> => txs,
    } as never,
    { commitment: "confirmed" }
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Program(IDL as any, provider);
}

// ============================================
// INSTRUCTION BUILDERS
// ============================================

/**
 * Build the claimBadge instruction
 * Multi-badge support: Each badge has a unique badge_id
 */
export function buildClaimBadgeInstruction(
  userPubkey: PublicKey,
  treasuryPubkey: PublicKey,
  configPda: PublicKey,
  badgePda: PublicKey,
  badgeId: bigint,
  requestedTier: number,
  encryptedTierCiphertext: Buffer,
  encryptedThreshold1: Buffer,
  encryptedThreshold2: Buffer,
  encryptedThreshold3: Buffer,
  encryptedThreshold4: Buffer,
  encryptedThreshold5: Buffer
): TransactionInstruction {
  const badgeIdBuffer = Buffer.alloc(8);
  badgeIdBuffer.writeBigUInt64LE(badgeId);

  const data = Buffer.concat([
    INSTRUCTION_DISCRIMINATORS.claimBadge,
    badgeIdBuffer, // u64 badge_id
    Buffer.from([requestedTier]), // u8 tier
    serializeBytes(encryptedTierCiphertext),
    serializeBytes(encryptedThreshold1),
    serializeBytes(encryptedThreshold2),
    serializeBytes(encryptedThreshold3),
    serializeBytes(encryptedThreshold4),
    serializeBytes(encryptedThreshold5),
  ]);

  return new TransactionInstruction({
    keys: [
      { pubkey: userPubkey, isSigner: true, isWritable: true },
      { pubkey: treasuryPubkey, isSigner: false, isWritable: true },
      { pubkey: configPda, isSigner: false, isWritable: true },
      { pubkey: badgePda, isSigner: false, isWritable: true },
      { pubkey: INCO_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data,
  });
}

/**
 * Build the upgradeTier instruction
 * Multi-badge support: Requires badge_id to identify which badge to upgrade
 */
export function buildUpgradeTierInstruction(
  userPubkey: PublicKey,
  treasuryPubkey: PublicKey,
  configPda: PublicKey,
  badgePda: PublicKey,
  badgeId: bigint,
  newTier: number,
  encryptedTierCiphertext: Buffer,
  encryptedThreshold1: Buffer,
  encryptedThreshold2: Buffer,
  encryptedThreshold3: Buffer,
  encryptedThreshold4: Buffer,
  encryptedThreshold5: Buffer
): TransactionInstruction {
  const badgeIdBuffer = Buffer.alloc(8);
  badgeIdBuffer.writeBigUInt64LE(badgeId);

  const data = Buffer.concat([
    INSTRUCTION_DISCRIMINATORS.upgradeTier,
    badgeIdBuffer, // u64 badge_id
    Buffer.from([newTier]), // u8 new_tier
    serializeBytes(encryptedTierCiphertext),
    serializeBytes(encryptedThreshold1),
    serializeBytes(encryptedThreshold2),
    serializeBytes(encryptedThreshold3),
    serializeBytes(encryptedThreshold4),
    serializeBytes(encryptedThreshold5),
  ]);

  return new TransactionInstruction({
    keys: [
      { pubkey: userPubkey, isSigner: true, isWritable: true },
      { pubkey: treasuryPubkey, isSigner: false, isWritable: true },
      { pubkey: configPda, isSigner: false, isWritable: false },
      { pubkey: badgePda, isSigner: false, isWritable: true },
      { pubkey: INCO_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data,
  });
}

/**
 * Build the closeBadge instruction
 * Closes the badge account and returns rent to owner
 */
export function buildCloseBadgeInstruction(
  ownerPubkey: PublicKey,
  badgePda: PublicKey
): TransactionInstruction {
  const data = INSTRUCTION_DISCRIMINATORS.closeBadge;

  return new TransactionInstruction({
    keys: [
      { pubkey: ownerPubkey, isSigner: true, isWritable: true },
      { pubkey: badgePda, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data,
  });
}

// ============================================
// ACCOUNT DATA TYPES
// ============================================

export interface ConfigAccountData {
  admin: PublicKey;
  treasury: PublicKey;
  totalBadges: number;
  nextBadgeId: bigint;
  isInitialized: boolean;
  bump: number;
  priceBronze: number;
  priceSilver: number;
  priceGold: number;
  priceDiamond: number;
  priceLegendary: number;
}

/**
 * Badge account data parsed from on-chain state
 *
 * PRIVACY NOTE: tier and amountPaid are NOT stored on-chain!
 * Only encrypted INCO handles are stored.
 */
export interface BadgeAccountData {
  bump: number;
  badgeId: bigint;
  owner: PublicKey;
  encryptedTier: string; // INCO handle (u128)
  proofBronze: string; // INCO handle (u128)
  proofSilver: string; // INCO handle (u128)
  proofGold: string; // INCO handle (u128)
  proofDiamond: string; // INCO handle (u128)
  proofLegendary: string; // INCO handle (u128)
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
}

// ============================================
// ACCOUNT FETCHERS (using Anchor)
// ============================================

/**
 * Fetch config account data using Anchor
 */
export async function fetchConfigAccount(
  connection: Connection,
  configPda?: PublicKey
): Promise<ConfigAccountData | null> {
  try {
    const program = getProgram(connection);
    const [pda] = configPda ? [configPda, 0] : deriveConfigPda();

    // Use Anchor's account fetcher - automatically deserializes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const account = await (program.account as any).config.fetch(pda);
    if (!account) return null;

    return {
      admin: account.admin,
      treasury: account.treasury,
      totalBadges: Number(account.totalBadges),
      nextBadgeId: BigInt(account.nextBadgeId?.toString() || "0"),
      isInitialized: account.isInitialized,
      bump: account.bump,
      priceBronze: Number(account.priceBronze),
      priceSilver: Number(account.priceSilver),
      priceGold: Number(account.priceGold),
      priceDiamond: Number(account.priceDiamond),
      priceLegendary: Number(account.priceLegendary),
    };
  } catch (error) {
    console.error("Failed to fetch config account:", error);
    return null;
  }
}

/**
 * Fetch badge account data using Anchor
 *
 * IDL Layout (ConfidentialBadge):
 * - bump: u8
 * - badge_id: u64 (unique identifier for multi-badge support)
 * - owner: Pubkey
 * - encrypted_tier: u128
 * - proof_bronze: u128
 * - proof_silver: u128
 * - proof_gold: u128
 * - proof_diamond: u128
 * - proof_legendary: u128
 * - created_at: i64
 * - updated_at: i64
 * - is_active: bool
 */
export async function fetchBadgeAccount(
  connection: Connection,
  badgePda: PublicKey
): Promise<BadgeAccountData | null> {
  try {
    const program = getProgram(connection);

    // Use Anchor's account fetcher - automatically deserializes based on IDL
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const account = await (program.account as any).confidentialBadge.fetch(badgePda);
    if (!account) return null;

    // Convert BN to string for u128 values
    const encryptedTier = account.encryptedTier.toString();
    const proofBronze = account.proofBronze.toString();
    const proofSilver = account.proofSilver.toString();
    const proofGold = account.proofGold.toString();
    const proofDiamond = account.proofDiamond.toString();
    const proofLegendary = account.proofLegendary.toString();

    // Check validity - badge is active if has valid owner and proofs
    const hasValidOwner = !account.owner.equals(PublicKey.default);
    const hasValidProofs = encryptedTier !== "0" && proofBronze !== "0";
    const isActive = account.isActive || (hasValidOwner && hasValidProofs);

    return {
      bump: account.bump,
      badgeId: BigInt(account.badgeId?.toString() || "0"),
      owner: account.owner,
      encryptedTier,
      proofBronze,
      proofSilver,
      proofGold,
      proofDiamond,
      proofLegendary,
      createdAt: Number(account.createdAt),
      updatedAt: Number(account.updatedAt),
      isActive,
    };
  } catch (error) {
    // Only log unexpected errors (not "Account does not exist" which is expected during badge scanning)
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (!errorMsg.includes('Account does not exist') && !errorMsg.includes('could not find')) {
      console.error("Failed to fetch badge account:", error);
    }
    return null;
  }
}

// ============================================
// TRANSACTION BUILDERS
// ============================================

export interface ClaimBadgeParams {
  connection: Connection;
  userPubkey: PublicKey;
  tier: number;
  treasuryPubkey?: PublicKey;
}

/**
 * Build a complete claim badge transaction with INCO encryption
 */
export async function buildClaimBadgeTransaction({
  connection,
  userPubkey,
  tier,
  treasuryPubkey,
}: ClaimBadgeParams): Promise<{
  transaction: Transaction;
  badgePda: PublicKey;
  badgeId: bigint;
  tierPrice: number;
}> {
  const [configPda] = deriveConfigPda();

  // Fetch config to get treasury and next badge ID
  const config = await fetchConfigAccount(connection, configPda);
  if (!config) {
    throw new Error("Contract config not initialized. Please contact support.");
  }

  const badgeId = config.nextBadgeId;
  const [badgePda] = deriveBadgePda(userPubkey, badgeId);

  const treasury = treasuryPubkey || config.treasury;

  const tierPrices: Record<number, number> = {
    1: config.priceBronze || TIER_PRICES[1],
    2: config.priceSilver || TIER_PRICES[2],
    3: config.priceGold || TIER_PRICES[3],
    4: config.priceDiamond || TIER_PRICES[4],
    5: config.priceLegendary || TIER_PRICES[5],
  };
  const tierPrice = tierPrices[tier] || 0;

  // Use proper INCO encryption
  const encrypted = await encryptBadgeValues(tier);

  const ix = buildClaimBadgeInstruction(
    userPubkey,
    treasury,
    configPda,
    badgePda,
    badgeId,
    tier,
    encrypted.tierCiphertext,
    encrypted.threshold1,
    encrypted.threshold2,
    encrypted.threshold3,
    encrypted.threshold4,
    encrypted.threshold5
  );

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();

  // INCO operations are very expensive - need 1.4M compute units
  const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: 1_400_000,
  });

  const transaction = new Transaction({
    feePayer: userPubkey,
    blockhash,
    lastValidBlockHeight,
  })
    .add(computeBudgetIx)
    .add(ix);

  return { transaction, badgePda, badgeId, tierPrice };
}

export interface UpgradeTierParams {
  connection: Connection;
  userPubkey: PublicKey;
  badgeId: bigint;
  newTier: number;
  treasuryPubkey?: PublicKey;
}

/**
 * Build a complete upgrade tier transaction with INCO encryption
 */
export async function buildUpgradeTierTransaction({
  connection,
  userPubkey,
  badgeId,
  newTier,
  treasuryPubkey,
}: UpgradeTierParams): Promise<{
  transaction: Transaction;
  badgePda: PublicKey;
  tierPrice: number;
}> {
  const [configPda] = deriveConfigPda();
  const [badgePda] = deriveBadgePda(userPubkey, badgeId);

  const config = await fetchConfigAccount(connection, configPda);
  if (!config) {
    throw new Error("Contract config not initialized. Please contact support.");
  }

  const treasury = treasuryPubkey || config.treasury;

  const tierPrices: Record<number, number> = {
    1: config.priceBronze || TIER_PRICES[1],
    2: config.priceSilver || TIER_PRICES[2],
    3: config.priceGold || TIER_PRICES[3],
    4: config.priceDiamond || TIER_PRICES[4],
    5: config.priceLegendary || TIER_PRICES[5],
  };
  const tierPrice = tierPrices[newTier] || 0;

  // Use proper INCO encryption
  const encrypted = await encryptBadgeValues(newTier);

  const ix = buildUpgradeTierInstruction(
    userPubkey,
    treasury,
    configPda,
    badgePda,
    badgeId,
    newTier,
    encrypted.tierCiphertext,
    encrypted.threshold1,
    encrypted.threshold2,
    encrypted.threshold3,
    encrypted.threshold4,
    encrypted.threshold5
  );

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();

  // INCO operations are very expensive - need 1.4M compute units
  const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: 1_400_000,
  });

  const transaction = new Transaction({
    feePayer: userPubkey,
    blockhash,
    lastValidBlockHeight,
  })
    .add(computeBudgetIx)
    .add(ix);

  return { transaction, badgePda, tierPrice };
}

export interface CloseBadgeParams {
  connection: Connection;
  ownerPubkey: PublicKey;
  badgeId: bigint;
}

/**
 * Build a complete close badge transaction
 */
export async function buildCloseBadgeTransaction({
  connection,
  ownerPubkey,
  badgeId,
}: CloseBadgeParams): Promise<{
  transaction: Transaction;
  badgePda: PublicKey;
}> {
  const [badgePda] = deriveBadgePda(ownerPubkey, badgeId);

  const ix = buildCloseBadgeInstruction(ownerPubkey, badgePda);

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();
  const transaction = new Transaction({
    feePayer: ownerPubkey,
    blockhash,
    lastValidBlockHeight,
  }).add(ix);

  return { transaction, badgePda };
}

// ============================================
// TIER DISPLAY HELPERS
// ============================================

/**
 * Get tier display info
 */
export function getTierDisplayInfo(tier: number): {
  name: string;
  color: string;
  icon: string;
  price: number;
  priceSOL: string;
} {
  return {
    name: TIER_NAMES[tier] || "Unknown",
    color: TIER_COLORS[tier] || "#888888",
    icon: TIER_ICONS[tier] || "❓",
    price: TIER_PRICES[tier] || 0,
    priceSOL: `${(TIER_PRICES[tier] || 0) / 1_000_000_000} SOL`,
  };
}

/**
 * Get all tiers for display in UI
 */
export function getAllTiersForDisplay(): Array<{
  tier: number;
  name: string;
  color: string;
  icon: string;
  price: number;
  priceSOL: string;
}> {
  return [1, 2, 3, 4, 5].map((tier) => ({
    tier,
    ...getTierDisplayInfo(tier),
  }));
}

/**
 * Privacy-first badge verification info
 */
export const PRIVACY_INFO = {
  message:
    "All 5 proof handles are non-zero. Observer cannot determine tier from on-chain data.",
  decryptRequired:
    "Wallet signature required to decrypt and verify tier proofs.",
  tierProofs: {
    bronze: "proof_bronze: tier >= 1",
    silver: "proof_silver: tier >= 2",
    gold: "proof_gold: tier >= 3",
    diamond: "proof_diamond: tier >= 4",
    legendary: "proof_legendary: tier >= 5",
  },
};
