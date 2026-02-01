'use client';

/**
 * Confidential Whale Badge SDK Wrapper
 *
 * Provides typed access to the badge contract for the UI
 */

import { PublicKey, SystemProgram, Connection, TransactionInstruction, Transaction } from '@solana/web3.js';

// ============================================
// PROGRAM IDs (Devnet)
// ============================================

export const PROGRAM_ID = new PublicKey('XPbon4Sw7hDArH49W8JNf5LK9nNTvowpRqWDHM2hMLD');
export const INCO_PROGRAM_ID = new PublicKey('5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj');

// ============================================
// PDA SEEDS
// ============================================

const CONFIG_SEED = Buffer.from('config');
const BADGE_SEED = Buffer.from('badge');

// ============================================
// TIER PRICES (in lamports)
// ============================================

export const TIER_PRICES_LAMPORTS = {
  1: 100_000_000,   // 0.1 SOL
  2: 200_000_000,   // 0.2 SOL
  3: 300_000_000,   // 0.3 SOL
  4: 400_000_000,   // 0.4 SOL
  5: 500_000_000,   // 0.5 SOL
};

// ============================================
// PDA DERIVATION
// ============================================

export function deriveConfigPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([CONFIG_SEED], PROGRAM_ID);
}

export function deriveBadgePda(userPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [BADGE_SEED, userPubkey.toBuffer()],
    PROGRAM_ID
  );
}

// ============================================
// ENCRYPTION HELPERS
// ============================================

/**
 * Encrypt badge values for INCO
 * Creates encrypted ciphertext for the tier and threshold comparisons
 */
export async function encryptBadgeValues(tier: number): Promise<{
  tierCiphertext: Buffer;
  threshold1: Buffer;
  threshold2: Buffer;
  threshold3: Buffer;
  threshold4: Buffer;
  threshold5: Buffer;
}> {
  // Create deterministic encrypted values based on tier
  // In production with INCO SDK, this would use real encryption
  const createCiphertext = (value: number): Buffer => {
    const buffer = Buffer.alloc(48);
    // Write value at start for reconstruction
    buffer.writeUInt32LE(value, 0);
    // Fill rest with deterministic but unique bytes
    for (let i = 4; i < 48; i++) {
      buffer[i] = (value * 17 + i * 31) % 256;
    }
    return buffer;
  };

  return {
    tierCiphertext: createCiphertext(tier),
    threshold1: createCiphertext(1),
    threshold2: createCiphertext(2),
    threshold3: createCiphertext(3),
    threshold4: createCiphertext(4),
    threshold5: createCiphertext(5),
  };
}

// ============================================
// INSTRUCTION BUILDERS
// ============================================

// ClaimBadge instruction discriminator (from IDL)
const CLAIM_BADGE_DISCRIMINATOR = Buffer.from([111, 30, 18, 17, 228, 252, 239, 102]);

/**
 * Build the claimBadge instruction manually
 * This avoids needing the full Anchor Program with typed IDL
 */
export function buildClaimBadgeInstruction(
  userPubkey: PublicKey,
  treasuryPubkey: PublicKey,
  configPda: PublicKey,
  badgePda: PublicKey,
  requestedTier: number,
  encryptedTierCiphertext: Buffer,
  encryptedThreshold1: Buffer,
  encryptedThreshold2: Buffer,
  encryptedThreshold3: Buffer,
  encryptedThreshold4: Buffer,
  encryptedThreshold5: Buffer
): TransactionInstruction {
  // Build instruction data
  const data = Buffer.concat([
    CLAIM_BADGE_DISCRIMINATOR,
    Buffer.from([requestedTier]), // u8 tier
    // Borsh serialize bytes: 4-byte length prefix + data
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

function serializeBytes(buffer: Buffer): Buffer {
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32LE(buffer.length, 0);
  return Buffer.concat([lengthBuffer, buffer]);
}

// ============================================
// ACCOUNT FETCHERS
// ============================================

export interface ConfigAccountData {
  admin: PublicKey;
  treasury: PublicKey;
  totalBadges: number;
  isInitialized: boolean;
  bump: number;
  priceBronze: number;
  priceSilver: number;
  priceGold: number;
  priceDiamond: number;
  priceLegendary: number;
}

/**
 * Fetch config account data to get the treasury address
 * Returns null if config doesn't exist
 */
export async function fetchConfigAccount(
  connection: Connection,
  configPda?: PublicKey
): Promise<ConfigAccountData | null> {
  try {
    const [pda] = configPda ? [configPda, 0] : deriveConfigPda();
    const accountInfo = await connection.getAccountInfo(pda);
    if (!accountInfo) return null;

    // Parse account data (skip 8-byte discriminator)
    const data = accountInfo.data.slice(8);

    // Parse fields based on Config layout:
    // admin: Pubkey (32 bytes)
    // treasury: Pubkey (32 bytes)
    // total_badges: u64 (8 bytes)
    // is_initialized: bool (1 byte)
    // bump: u8 (1 byte)
    // price_bronze: u64 (8 bytes)
    // price_silver: u64 (8 bytes)
    // price_gold: u64 (8 bytes)
    // price_diamond: u64 (8 bytes)
    // price_legendary: u64 (8 bytes)

    const admin = new PublicKey(data.slice(0, 32));
    const treasury = new PublicKey(data.slice(32, 64));
    const totalBadges = Number(data.readBigUInt64LE(64));
    const isInitialized = data[72] === 1;
    const bump = data[73];
    const priceBronze = Number(data.readBigUInt64LE(74));
    const priceSilver = Number(data.readBigUInt64LE(82));
    const priceGold = Number(data.readBigUInt64LE(90));
    const priceDiamond = Number(data.readBigUInt64LE(98));
    const priceLegendary = Number(data.readBigUInt64LE(106));

    return {
      admin,
      treasury,
      totalBadges,
      isInitialized,
      bump,
      priceBronze,
      priceSilver,
      priceGold,
      priceDiamond,
      priceLegendary,
    };
  } catch (error) {
    console.error('Failed to fetch config account:', error);
    return null;
  }
}

// ============================================
// TRANSACTION BUILDER
// ============================================

export interface ClaimBadgeParams {
  connection: Connection;
  userPubkey: PublicKey;
  tier: number;
  treasuryPubkey?: PublicKey;
}

/**
 * Build a complete claim badge transaction
 */
export async function buildClaimBadgeTransaction({
  connection,
  userPubkey,
  tier,
  treasuryPubkey,
}: ClaimBadgeParams): Promise<{
  transaction: Transaction;
  badgePda: PublicKey;
  tierPrice: number;
}> {
  // Derive PDAs
  const [configPda] = deriveConfigPda();
  const [badgePda] = deriveBadgePda(userPubkey);

  // Fetch config to get the correct treasury address
  const config = await fetchConfigAccount(connection, configPda);
  if (!config) {
    throw new Error('Contract config not initialized. Please contact support.');
  }

  // Use treasury from config (required for authorization)
  const treasury = treasuryPubkey || config.treasury;

  // Get tier price from config (or use defaults)
  const tierPrices = {
    1: config.priceBronze || TIER_PRICES_LAMPORTS[1],
    2: config.priceSilver || TIER_PRICES_LAMPORTS[2],
    3: config.priceGold || TIER_PRICES_LAMPORTS[3],
    4: config.priceDiamond || TIER_PRICES_LAMPORTS[4],
    5: config.priceLegendary || TIER_PRICES_LAMPORTS[5],
  };
  const tierPrice = tierPrices[tier as keyof typeof tierPrices] || 0;

  console.log('Config loaded:', {
    treasury: treasury.toBase58(),
    tierPrice,
    totalBadges: config.totalBadges,
  });

  // Encrypt values
  const encrypted = await encryptBadgeValues(tier);

  // Build instruction
  const ix = buildClaimBadgeInstruction(
    userPubkey,
    treasury,
    configPda,
    badgePda,
    tier,
    encrypted.tierCiphertext,
    encrypted.threshold1,
    encrypted.threshold2,
    encrypted.threshold3,
    encrypted.threshold4,
    encrypted.threshold5
  );

  // Create transaction
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  const transaction = new Transaction({
    feePayer: userPubkey,
    blockhash,
    lastValidBlockHeight,
  }).add(ix);

  return { transaction, badgePda, tierPrice };
}

/**
 * Badge account data parsed from on-chain state
 *
 * PRIVACY NOTE: tier and amountPaid are NOT stored on-chain!
 * Only encrypted INCO handles are stored. To know the tier,
 * the user must decrypt the proof handles via INCO.
 */
export interface BadgeAccountData {
  bump: number;
  owner: PublicKey;
  // PRIVACY: No tier or amountPaid - those would leak privacy!
  encryptedTier: string;  // INCO handle (u128)
  proofBronze: string;    // INCO handle (u128)
  proofSilver: string;    // INCO handle (u128)
  proofGold: string;      // INCO handle (u128)
  proofDiamond: string;   // INCO handle (u128)
  proofLegendary: string; // INCO handle (u128)
  createdAt: number;      // Unix timestamp
  updatedAt: number;      // Unix timestamp
  isActive: boolean;
}

/**
 * Fetch badge account data
 * Returns null if badge doesn't exist
 *
 * PRIVACY: The badge account ONLY contains encrypted INCO handles.
 * To verify the tier, user must decrypt the proof handles via INCO SDK.
 *
 * Account layout (after 8-byte discriminator):
 * - bump: u8 (1 byte)
 * - owner: Pubkey (32 bytes)
 * - encrypted_tier: u128 (16 bytes)
 * - proof_bronze: u128 (16 bytes)
 * - proof_silver: u128 (16 bytes)
 * - proof_gold: u128 (16 bytes)
 * - proof_diamond: u128 (16 bytes)
 * - proof_legendary: u128 (16 bytes)
 * - created_at: i64 (8 bytes)
 * - updated_at: i64 (8 bytes)
 * - is_active: bool (1 byte)
 */
export async function fetchBadgeAccount(
  connection: Connection,
  badgePda: PublicKey
): Promise<BadgeAccountData | null> {
  try {
    const accountInfo = await connection.getAccountInfo(badgePda);
    if (!accountInfo) return null;

    // Parse account data (skip 8-byte discriminator)
    const data = accountInfo.data.slice(8);

    // Parse fields based on NEW privacy-first layout
    const bump = data[0];
    const owner = new PublicKey(data.slice(1, 33));

    // Read u128 handles (16 bytes each) - NO tier/amountPaid stored!
    const encryptedTier = readU128(data, 33);
    const proofBronze = readU128(data, 49);
    const proofSilver = readU128(data, 65);
    const proofGold = readU128(data, 81);
    const proofDiamond = readU128(data, 97);
    const proofLegendary = readU128(data, 113);

    // Timestamps and status
    const createdAt = Number(data.readBigInt64LE(129));
    const updatedAt = Number(data.readBigInt64LE(137));
    const isActive = data[145] === 1;

    return {
      bump,
      owner,
      encryptedTier,
      proofBronze,
      proofSilver,
      proofGold,
      proofDiamond,
      proofLegendary,
      createdAt,
      updatedAt,
      isActive,
    };
  } catch (error) {
    console.error('Failed to fetch badge account:', error);
    return null;
  }
}

function readU128(data: Buffer, offset: number): string {
  // Read 16 bytes as little-endian u128
  let result = BigInt(0);
  for (let i = 15; i >= 0; i--) {
    result = (result << BigInt(8)) | BigInt(data[offset + i]);
  }
  return result.toString();
}
