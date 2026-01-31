/**
 * Confidential Whale Badge - Crypto Helpers
 *
 * Functions for INCO encryption/decryption operations.
 */

import { PublicKey, Keypair } from "@solana/web3.js";
import { encryptValue, decrypt, hexToBuffer } from "@inco/solana-sdk";
import { createHash } from "crypto";
import * as nacl from "tweetnacl";

// ============================================
// HASHING
// ============================================

/**
 * Hash a public key to 128 bits for INCO encryption
 *
 * Uses SHA256 and takes first 16 bytes as little-endian u128
 */
export function hashPubkeyTo128Bits(pubkey: PublicKey): bigint {
  const hash = createHash("sha256").update(pubkey.toBuffer()).digest();
  let result = BigInt(0);
  for (let i = 15; i >= 0; i--) {
    result = (result << BigInt(8)) | BigInt(hash[i]);
  }
  return result;
}

// ============================================
// ENCRYPTION
// ============================================

/**
 * Encrypt a value for INCO
 *
 * @param value - The value to encrypt (bigint)
 * @returns Buffer ready to send to program
 */
export async function encryptForInco(value: bigint): Promise<Buffer> {
  const encrypted = await encryptValue(value);
  return hexToBuffer(encrypted);
}

/**
 * Encrypt a public key hash for INCO
 *
 * @param pubkey - The public key to encrypt
 * @returns Buffer ready to send to program
 */
export async function encryptPubkeyHash(pubkey: PublicKey): Promise<Buffer> {
  const hash = hashPubkeyTo128Bits(pubkey);
  return encryptForInco(hash);
}

/**
 * Encrypt badge tier values (tier + 5 thresholds)
 *
 * @param tier - The tier value (1-5)
 * @returns Object with all encrypted buffers
 */
export async function encryptBadgeValues(tier: number): Promise<{
  tierCiphertext: Buffer;
  threshold1: Buffer;
  threshold2: Buffer;
  threshold3: Buffer;
  threshold4: Buffer;
  threshold5: Buffer;
}> {
  const [tierCiphertext, threshold1, threshold2, threshold3, threshold4, threshold5] =
    await Promise.all([
      encryptForInco(BigInt(tier)),
      encryptForInco(BigInt(1)),
      encryptForInco(BigInt(2)),
      encryptForInco(BigInt(3)),
      encryptForInco(BigInt(4)),
      encryptForInco(BigInt(5)),
    ]);

  return {
    tierCiphertext,
    threshold1,
    threshold2,
    threshold3,
    threshold4,
    threshold5,
  };
}

/**
 * Encrypt all private payment data
 *
 * @param senderPubkey - Sender's public key
 * @param recipientPubkey - Recipient's public key
 * @param amount - Amount in lamports
 * @returns Object with all encrypted buffers
 */
export async function encryptPaymentData(
  senderPubkey: PublicKey,
  recipientPubkey: PublicKey,
  amount: number | bigint
): Promise<{
  encryptedSender: Buffer;
  encryptedRecipient: Buffer;
  encryptedAmount: Buffer;
}> {
  const senderHash = hashPubkeyTo128Bits(senderPubkey);
  const recipientHash = hashPubkeyTo128Bits(recipientPubkey);

  const [encryptedSender, encryptedRecipient, encryptedAmount] = await Promise.all([
    encryptForInco(senderHash),
    encryptForInco(recipientHash),
    encryptForInco(BigInt(amount)),
  ]);

  return {
    encryptedSender,
    encryptedRecipient,
    encryptedAmount,
  };
}

// ============================================
// DECRYPTION
// ============================================

/**
 * Decrypt an INCO proof handle
 *
 * @param handle - The u128 handle value
 * @param wallet - The wallet with decrypt permission
 * @returns Object with plaintext and isTrue boolean
 */
export async function decryptProof(
  handle: bigint | string,
  wallet: Keypair
): Promise<{ plaintext: string; isTrue: boolean } | null> {
  try {
    const handleStr = handle.toString();

    const result = await decrypt([handleStr], {
      address: wallet.publicKey,
      signMessage: async (msg: Uint8Array) => nacl.sign.detached(msg, wallet.secretKey),
    });

    const plaintext = result.plaintexts[0];
    const isTrue = plaintext === "1";

    return { plaintext, isTrue };
  } catch (error) {
    console.error("Decrypt failed:", error);
    return null;
  }
}

/**
 * Decrypt with a custom sign function (for wallet adapters)
 *
 * @param handle - The u128 handle value
 * @param address - The public key with decrypt permission
 * @param signMessage - Function to sign a message
 * @returns Object with plaintext and isTrue boolean
 */
export async function decryptProofWithSigner(
  handle: bigint | string,
  address: PublicKey,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
): Promise<{ plaintext: string; isTrue: boolean } | null> {
  try {
    const handleStr = handle.toString();

    const result = await decrypt([handleStr], {
      address,
      signMessage,
    });

    const plaintext = result.plaintexts[0];
    const isTrue = plaintext === "1";

    return { plaintext, isTrue };
  } catch (error) {
    console.error("Decrypt failed:", error);
    return null;
  }
}

// ============================================
// SIGNATURE HELPERS
// ============================================

/**
 * Sign an access request message
 *
 * @param wallet - The wallet to sign with
 * @param channelId - The channel being accessed
 * @param timestamp - Unix timestamp
 * @returns The signature bytes
 */
export function signAccessMessage(
  wallet: Keypair,
  channelId: string,
  timestamp: number
): Uint8Array {
  const message = Buffer.from(`Access request for ${channelId} at ${timestamp}`);
  return nacl.sign.detached(message, wallet.secretKey);
}

/**
 * Verify an access request signature
 *
 * @param publicKey - The expected signer
 * @param channelId - The channel being accessed
 * @param timestamp - Unix timestamp
 * @param signature - The signature to verify
 * @returns True if valid
 */
export function verifyAccessSignature(
  publicKey: PublicKey,
  channelId: string,
  timestamp: number,
  signature: Uint8Array
): boolean {
  const message = Buffer.from(`Access request for ${channelId} at ${timestamp}`);
  return nacl.sign.detached.verify(message, signature, publicKey.toBytes());
}
