/**
 * Confidential Whale Badge - Crypto Helpers
 *
 * Functions for INCO encryption/decryption operations.
 * Uses the correct INCO SDK imports for browser compatibility.
 */

import { PublicKey } from "@solana/web3.js";
import { encryptValue } from "@inco/solana-sdk/encryption";
import { hexToBuffer } from "@inco/solana-sdk/utils";
import { decrypt } from "@inco/solana-sdk/attested-decrypt";

// ============================================
// HASHING (Browser-compatible)
// ============================================

/**
 * Hash a public key to 128 bits for INCO encryption
 * Uses Web Crypto API for browser compatibility
 *
 * Uses SHA256 and takes first 16 bytes as little-endian u128
 */
export async function hashPubkeyTo128Bits(pubkey: PublicKey): Promise<bigint> {
  // Convert Buffer to Uint8Array for Web Crypto API
  const pubkeyBytes = new Uint8Array(pubkey.toBuffer());
  const hashBuffer = await crypto.subtle.digest("SHA-256", pubkeyBytes);
  const hashArray = new Uint8Array(hashBuffer);

  let result = BigInt(0);
  for (let i = 15; i >= 0; i--) {
    result = (result << BigInt(8)) | BigInt(hashArray[i]);
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
  const hash = await hashPubkeyTo128Bits(pubkey);
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
  const senderHash = await hashPubkeyTo128Bits(senderPubkey);
  const recipientHash = await hashPubkeyTo128Bits(recipientPubkey);

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
 * Decrypt an INCO proof handle using wallet adapter signMessage
 *
 * @param handle - The u128 handle value
 * @param address - The public key with decrypt permission
 * @param signMessage - Function to sign a message (from wallet adapter)
 * @returns Object with plaintext and isTrue boolean
 */
export async function decryptProof(
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

/**
 * Decrypt multiple INCO proof handles at once
 *
 * @param handles - Array of u128 handle values
 * @param address - The public key with decrypt permission
 * @param signMessage - Function to sign a message (from wallet adapter)
 * @returns Array of plaintexts or null on error
 */
export async function decryptMultipleProofs(
  handles: (bigint | string)[],
  address: PublicKey,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
): Promise<string[] | null> {
  try {
    const handleStrs = handles.map(h => h.toString());

    const result = await decrypt(handleStrs, {
      address,
      signMessage,
    });

    return result.plaintexts;
  } catch (error) {
    console.error("Decrypt failed:", error);
    return null;
  }
}

// ============================================
// RE-EXPORTS for convenience
// ============================================

export { encryptValue, hexToBuffer, decrypt };
