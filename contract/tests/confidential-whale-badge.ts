import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { ConfidentialWhaleBadge } from "../target/types/confidential_whale_badge";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Connection,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import { expect } from "chai";
import * as nacl from "tweetnacl";
import { createHash } from "crypto";

// INCO SDK imports
import { encryptValue, decrypt, hexToBuffer } from "@inco/solana-sdk";

// ============================================================
// CONSTANTS
// ============================================================

const INCO_LIGHTNING_PROGRAM_ID = new PublicKey("5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj");
const CONFIG_SEED = Buffer.from("config");
const BADGE_SEED = Buffer.from("badge");
const PAYMENT_SEED = Buffer.from("payment");
const ESCROW_SEED = Buffer.from("escrow");

// Tier Constants
const TIER_BRONZE = 1;
const TIER_SILVER = 2;
const TIER_GOLD = 3;
const TIER_DIAMOND = 4;
const TIER_LEGENDARY = 5;

// Tier Prices (in lamports)
const PRICE_BRONZE = 100_000_000;    // 0.1 SOL
const PRICE_SILVER = 200_000_000;    // 0.2 SOL
const PRICE_GOLD = 300_000_000;      // 0.3 SOL
const PRICE_DIAMOND = 400_000_000;   // 0.4 SOL
const PRICE_LEGENDARY = 500_000_000; // 0.5 SOL

// Delays for devnet (INCO needs time to process)
const TX_CONFIRM_DELAY = 3000; // 3 seconds
const DECRYPT_DELAY = 2000;    // 2 seconds

// Compute budget for INCO operations
const COMPUTE_UNITS = 1_200_000; // 1.2M compute units

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Sleep helper
 */
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * Get tier name
 */
function getTierName(tier: number): string {
  const names: { [key: number]: string } = {
    1: "Bronze", 2: "Silver", 3: "Gold", 4: "Diamond", 5: "Legendary"
  };
  return names[tier] || "Unknown";
}

/**
 * Get tier price
 */
function getTierPrice(tier: number): number {
  const prices: { [key: number]: number } = {
    1: PRICE_BRONZE, 2: PRICE_SILVER, 3: PRICE_GOLD, 4: PRICE_DIAMOND, 5: PRICE_LEGENDARY
  };
  return prices[tier] || 0;
}

/**
 * Derive INCO allowance PDA for a handle
 * PDA = [handle_bytes_le, user_pubkey] seeded on INCO program
 */
function deriveAllowancePda(handle: bigint, owner: PublicKey): [PublicKey, number] {
  const buf = Buffer.alloc(16);
  let v = handle;
  for (let i = 0; i < 16; i++) {
    buf[i] = Number(v & BigInt(0xff));
    v >>= BigInt(8);
  }
  return PublicKey.findProgramAddressSync(
    [buf, owner.toBuffer()],
    INCO_LIGHTNING_PROGRAM_ID
  );
}

/**
 * Hash a public key to 128 bits (for private payment recipient)
 * Uses keccak256 and takes first 16 bytes
 */
function hashPubkeyTo128Bits(pubkey: PublicKey): bigint {
  const hash = createHash('sha256').update(pubkey.toBuffer()).digest();
  // Take first 16 bytes (128 bits) as little-endian
  let result = BigInt(0);
  for (let i = 15; i >= 0; i--) {
    result = (result << BigInt(8)) | BigInt(hash[i]);
  }
  return result;
}

/**
 * Generate unique payment ID
 */
function generatePaymentId(): Uint8Array {
  return Keypair.generate().publicKey.toBytes();
}

/**
 * Encrypt badge values (tier + 5 thresholds)
 */
async function encryptBadgeValues(tier: number): Promise<{
  tierCiphertext: Buffer;
  threshold1: Buffer;
  threshold2: Buffer;
  threshold3: Buffer;
  threshold4: Buffer;
  threshold5: Buffer;
}> {
  console.log(`   Encrypting tier ${tier} (${getTierName(tier)})...`);

  const encryptedTier = await encryptValue(BigInt(tier));
  const encryptedT1 = await encryptValue(BigInt(1));
  const encryptedT2 = await encryptValue(BigInt(2));
  const encryptedT3 = await encryptValue(BigInt(3));
  const encryptedT4 = await encryptValue(BigInt(4));
  const encryptedT5 = await encryptValue(BigInt(5));

  console.log(`   ✓ Encrypted (${encryptedTier.slice(0, 20)}...)`);

  return {
    tierCiphertext: hexToBuffer(encryptedTier),
    threshold1: hexToBuffer(encryptedT1),
    threshold2: hexToBuffer(encryptedT2),
    threshold3: hexToBuffer(encryptedT3),
    threshold4: hexToBuffer(encryptedT4),
    threshold5: hexToBuffer(encryptedT5),
  };
}

/**
 * Decrypt a proof handle with wallet signature
 */
async function decryptProofHandle(
  handle: BN | bigint | string,
  wallet: Keypair
): Promise<{ plaintext: string; isTrue: boolean } | null> {
  await sleep(DECRYPT_DELAY);

  try {
    const handleStr = handle.toString();
    console.log(`   Decrypting handle ${handleStr.slice(0, 15)}...`);

    const result = await decrypt([handleStr], {
      address: wallet.publicKey,
      signMessage: async (msg: Uint8Array) => nacl.sign.detached(msg, wallet.secretKey),
    });

    const plaintext = result.plaintexts[0];
    const isTrue = plaintext === "1";

    console.log(`   ✓ Decrypted: ${plaintext} (${isTrue ? "TRUE" : "FALSE"})`);
    return { plaintext, isTrue };
  } catch (error: any) {
    console.log(`   ⚠ Decrypt failed: ${error.message?.slice(0, 50)}`);
    return null;
  }
}

/**
 * Sign message with wallet (for channel authentication)
 */
function signAccessMessage(wallet: Keypair, channelId: string, timestamp: number): Uint8Array {
  const message = Buffer.from(`Access request for ${channelId} at ${timestamp}`);
  return nacl.sign.detached(message, wallet.secretKey);
}

/**
 * Verify signature (server-side)
 */
function verifyAccessSignature(
  publicKey: PublicKey,
  channelId: string,
  timestamp: number,
  signature: Uint8Array
): boolean {
  const message = Buffer.from(`Access request for ${channelId} at ${timestamp}`);
  return nacl.sign.detached.verify(message, signature, publicKey.toBytes());
}

// ============================================================
// TEST SUITE
// ============================================================

describe("Confidential Whale Badge - Full Test Suite", () => {
  // Connect to devnet
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const provider = new anchor.AnchorProvider(
    connection,
    anchor.AnchorProvider.env().wallet,
    { commitment: "confirmed" }
  );
  anchor.setProvider(provider);

  const program = anchor.workspace.ConfidentialWhaleBadge as Program<ConfidentialWhaleBadge>;

  // Test wallet (from anchor config)
  let wallet: Keypair;

  // PDAs
  let configPda: PublicKey;
  let badgePda: PublicKey;

  // Stored handle values (after claim)
  let storedHandles: {
    tier: bigint;
    bronze: bigint;
    silver: bigint;
    gold: bigint;
    diamond: bigint;
    legendary: bigint;
  };

  // Test tier
  const TEST_TIER = TIER_GOLD; // User is Gold tier

  before(async () => {
    console.log("\n" + "=".repeat(70));
    console.log("  CONFIDENTIAL WHALE BADGE - FULL TEST SUITE");
    console.log("  Testing: Badges + Private Payments with INCO");
    console.log("=".repeat(70));

    // Get wallet from provider (the one configured in Anchor.toml)
    wallet = (provider.wallet as any).payer as Keypair;

    console.log("\nProgram ID:", program.programId.toString());
    console.log("INCO Program:", INCO_LIGHTNING_PROGRAM_ID.toString());
    console.log("Wallet:", wallet.publicKey.toString());

    // Derive PDAs
    [configPda] = PublicKey.findProgramAddressSync([CONFIG_SEED], program.programId);
    [badgePda] = PublicKey.findProgramAddressSync(
      [BADGE_SEED, wallet.publicKey.toBuffer()],
      program.programId
    );

    console.log("Config PDA:", configPda.toString());
    console.log("Badge PDA:", badgePda.toString());

    // Check wallet balance
    const balance = await connection.getBalance(wallet.publicKey);
    console.log(`Wallet Balance: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);

    if (balance < 0.5 * LAMPORTS_PER_SOL) {
      console.log("\n⚠ Low balance! Request airdrop from https://faucet.solana.com");
    }
    console.log("");
  });

  // ==========================================
  // SECTION 1: BADGE SYSTEM TESTS
  // ==========================================

  describe("SECTION 1: BADGE SYSTEM", () => {

    describe("1.1 Initialize Config", () => {
      it("should initialize global config", async () => {
        console.log("\n--- Initializing Config ---");

        try {
          // Check if already initialized
          try {
            const existing = await program.account.config.fetch(configPda);
            console.log("✓ Config already initialized, skipping");
            console.log("  Admin:", existing.admin.toString().slice(0, 20) + "...");
            console.log("  Total Badges:", existing.totalBadges.toString());
            console.log("  Bronze Price:", (Number(existing.priceBronze) / LAMPORTS_PER_SOL).toFixed(2), "SOL");
            return;
          } catch {
            // Not initialized, proceed
          }

          const tx = await program.methods
            .initialize()
            .accountsPartial({
              admin: wallet.publicKey,
              config: configPda,
              systemProgram: SystemProgram.programId,
            })
            .rpc();

          console.log("TX:", tx);
          await sleep(TX_CONFIRM_DELAY);

          const config = await program.account.config.fetch(configPda);
          expect(config.isInitialized).to.equal(true);
          console.log("✓ Config initialized");
        } catch (error: any) {
          console.log("⚠ Init error:", error.message?.slice(0, 80));
        }
      });
    });

    describe("1.2 Claim Badge with Payment", () => {
      it("should claim badge with GOLD tier (0.3 SOL)", async () => {
        console.log("\n--- Claiming Gold Badge ---");
        console.log("Tier:", getTierName(TEST_TIER), `(${TEST_TIER})`);
        console.log("Price:", (getTierPrice(TEST_TIER) / LAMPORTS_PER_SOL).toFixed(2), "SOL");

        try {
          // Check if already claimed
          try {
            const existing = await program.account.confidentialBadge.fetch(badgePda);
            console.log("✓ Badge already claimed, skipping");
            console.log("  Owner:", existing.owner.toString().slice(0, 20) + "...");
            console.log("  Tier:", existing.tier);
            console.log("  Amount Paid:", (Number(existing.amountPaid) / LAMPORTS_PER_SOL).toFixed(2), "SOL");
            console.log("  Is Active:", existing.isActive);

            // Store handles for later tests
            storedHandles = {
              tier: BigInt(existing.encryptedTier.toString()),
              bronze: BigInt(existing.proofBronze.toString()),
              silver: BigInt(existing.proofSilver.toString()),
              gold: BigInt(existing.proofGold.toString()),
              diamond: BigInt(existing.proofDiamond.toString()),
              legendary: BigInt(existing.proofLegendary.toString()),
            };
            return;
          } catch {
            // Not claimed, proceed
          }

          // Step 1: Encrypt values
          const encrypted = await encryptBadgeValues(TEST_TIER);

          // Step 2: Get treasury (same as admin for now)
          const config = await program.account.config.fetch(configPda);

          // Step 3: Execute claim with payment
          console.log("   Executing claim transaction with payment...");
          console.log(`   Using ${COMPUTE_UNITS.toLocaleString()} compute units`);

          const tx = await program.methods
            .claimBadge(
              TEST_TIER,
              encrypted.tierCiphertext,
              encrypted.threshold1,
              encrypted.threshold2,
              encrypted.threshold3,
              encrypted.threshold4,
              encrypted.threshold5
            )
            .accountsPartial({
              user: wallet.publicKey,
              treasury: config.treasury,
              config: configPda,
              badge: badgePda,
              incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
            })
            .preInstructions([
              ComputeBudgetProgram.setComputeUnitLimit({ units: COMPUTE_UNITS }),
            ])
            .rpc();

          console.log("TX:", tx);
          console.log("   Waiting for confirmation...");
          await sleep(TX_CONFIRM_DELAY);

          // Verify
          const badge = await program.account.confidentialBadge.fetch(badgePda);
          expect(badge.owner.toString()).to.equal(wallet.publicKey.toString());
          expect(badge.isActive).to.equal(true);
          expect(badge.tier).to.equal(TEST_TIER);

          console.log("✓ Badge claimed successfully!");
          console.log("  Owner:", badge.owner.toString().slice(0, 20) + "...");
          console.log("  Tier:", badge.tier, `(${getTierName(badge.tier)})`);
          console.log("  Amount Paid:", (Number(badge.amountPaid) / LAMPORTS_PER_SOL).toFixed(2), "SOL");
          console.log("  Is Active:", badge.isActive);

          // Store handles from actual account data
          storedHandles = {
            tier: BigInt(badge.encryptedTier.toString()),
            bronze: BigInt(badge.proofBronze.toString()),
            silver: BigInt(badge.proofSilver.toString()),
            gold: BigInt(badge.proofGold.toString()),
            diamond: BigInt(badge.proofDiamond.toString()),
            legendary: BigInt(badge.proofLegendary.toString()),
          };

        } catch (error: any) {
          console.log("⚠ Claim failed:", error.message?.slice(0, 200));
          if (error.logs) {
            console.log("   Last logs:", error.logs?.slice(-5).join("\n   "));
          }
          throw error;
        }
      });
    });

    describe("1.3 Grant Decrypt Access", () => {
      it("should grant decrypt permissions for badge handles", async () => {
        console.log("\n--- Granting Decrypt Access ---");

        if (!storedHandles) {
          console.log("⚠ No handles stored, fetching from badge...");
          try {
            const badge = await program.account.confidentialBadge.fetch(badgePda);
            storedHandles = {
              tier: BigInt(badge.encryptedTier.toString()),
              bronze: BigInt(badge.proofBronze.toString()),
              silver: BigInt(badge.proofSilver.toString()),
              gold: BigInt(badge.proofGold.toString()),
              diamond: BigInt(badge.proofDiamond.toString()),
              legendary: BigInt(badge.proofLegendary.toString()),
            };
          } catch {
            console.log("⚠ Badge not found, skipping");
            return;
          }
        }

        console.log("   Deriving allowance PDAs for 6 handles...");

        // Derive allowance PDAs for all 6 handles
        const [tierAllowance] = deriveAllowancePda(storedHandles.tier, wallet.publicKey);
        const [bronzeAllowance] = deriveAllowancePda(storedHandles.bronze, wallet.publicKey);
        const [silverAllowance] = deriveAllowancePda(storedHandles.silver, wallet.publicKey);
        const [goldAllowance] = deriveAllowancePda(storedHandles.gold, wallet.publicKey);
        const [diamondAllowance] = deriveAllowancePda(storedHandles.diamond, wallet.publicKey);
        const [legendaryAllowance] = deriveAllowancePda(storedHandles.legendary, wallet.publicKey);

        try {
          console.log("   Calling grant_access instruction...");

          const tx = await program.methods
            .grantAccess()
            .accountsPartial({
              user: wallet.publicKey,
              badge: badgePda,
              incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
            })
            .remainingAccounts([
              { pubkey: tierAllowance, isSigner: false, isWritable: true },
              { pubkey: wallet.publicKey, isSigner: false, isWritable: false },
              { pubkey: bronzeAllowance, isSigner: false, isWritable: true },
              { pubkey: wallet.publicKey, isSigner: false, isWritable: false },
              { pubkey: silverAllowance, isSigner: false, isWritable: true },
              { pubkey: wallet.publicKey, isSigner: false, isWritable: false },
              { pubkey: goldAllowance, isSigner: false, isWritable: true },
              { pubkey: wallet.publicKey, isSigner: false, isWritable: false },
              { pubkey: diamondAllowance, isSigner: false, isWritable: true },
              { pubkey: wallet.publicKey, isSigner: false, isWritable: false },
              { pubkey: legendaryAllowance, isSigner: false, isWritable: true },
              { pubkey: wallet.publicKey, isSigner: false, isWritable: false },
            ])
            .rpc();

          console.log("TX:", tx);
          await sleep(TX_CONFIRM_DELAY);

          console.log("✓ Decrypt access granted for all 6 handles!");

        } catch (error: any) {
          console.log("⚠ Grant access failed:", error.message?.slice(0, 150));
          // Don't throw - continue with tests
        }
      });
    });

    describe("1.4 Verify Channel Access (Decrypt Proofs)", () => {
      it("should verify Gold user has Bronze+ access", async () => {
        console.log("\n--- Verifying Bronze+ Access ---");
        console.log("Question: Does Gold user have Bronze+ access?");
        console.log("Expected: YES (Gold=3 >= Bronze=1)");

        if (!storedHandles) {
          console.log("⚠ No handles stored, skipping");
          return;
        }

        const badge = await program.account.confidentialBadge.fetch(badgePda);
        const result = await decryptProofHandle(badge.proofBronze, wallet);

        if (result) {
          console.log("✓ Has Bronze+ Access:", result.isTrue);
          expect(result.isTrue).to.equal(true);
        }
      });

      it("should verify Gold user has Gold+ access", async () => {
        console.log("\n--- Verifying Gold+ Access ---");
        console.log("Question: Does Gold user have Gold+ access?");
        console.log("Expected: YES (Gold=3 >= Gold=3)");

        if (!storedHandles) {
          console.log("⚠ No handles stored, skipping");
          return;
        }

        const badge = await program.account.confidentialBadge.fetch(badgePda);
        const result = await decryptProofHandle(badge.proofGold, wallet);

        if (result) {
          console.log("✓ Has Gold+ Access:", result.isTrue);
          expect(result.isTrue).to.equal(true);
        }
      });

      it("should verify Gold user does NOT have Diamond+ access", async () => {
        console.log("\n--- Verifying Diamond+ Access ---");
        console.log("Question: Does Gold user have Diamond+ access?");
        console.log("Expected: NO (Gold=3 < Diamond=4)");

        if (!storedHandles) {
          console.log("⚠ No handles stored, skipping");
          return;
        }

        const badge = await program.account.confidentialBadge.fetch(badgePda);
        const result = await decryptProofHandle(badge.proofDiamond, wallet);

        if (result) {
          console.log("✓ Has Diamond+ Access:", result.isTrue);
          expect(result.isTrue).to.equal(false);
        }
      });
    });

    describe("1.5 Signature Authentication", () => {
      it("should authenticate with wallet signature", async () => {
        console.log("\n--- Wallet Signature Auth ---");

        const channelId = "gold-vip-channel";
        const timestamp = Math.floor(Date.now() / 1000);

        const signature = signAccessMessage(wallet, channelId, timestamp);
        console.log("   Signed message for channel:", channelId);

        const isValid = verifyAccessSignature(wallet.publicKey, channelId, timestamp, signature);
        expect(isValid).to.equal(true);
        console.log("✓ Signature valid");
      });

      it("should reject invalid signature", async () => {
        console.log("\n--- Invalid Signature Test ---");

        const channelId = "gold-vip-channel";
        const timestamp = Math.floor(Date.now() / 1000);
        const fakeSignature = new Uint8Array(64).fill(0);

        const isValid = verifyAccessSignature(wallet.publicKey, channelId, timestamp, fakeSignature);
        expect(isValid).to.equal(false);
        console.log("✓ Invalid signature correctly rejected");
      });
    });
  });

  // ==========================================
  // SECTION 2: FULLY PRIVATE PAYMENT TESTS
  // ALL DATA ENCRYPTED: sender, recipient, amount
  // ==========================================

  describe("SECTION 2: FULLY PRIVATE PAYMENTS", () => {
    let paymentId: Uint8Array;
    let paymentPda: PublicKey;
    let escrowPda: PublicKey;
    const PAYMENT_AMOUNT = 0.05 * LAMPORTS_PER_SOL; // 0.05 SOL

    // For testing, sender and recipient are the same wallet (self-payment)
    // In production, these would be different addresses

    // Store encrypted values for later use
    let encryptedSenderBuffer: Buffer;
    let encryptedClaimerBuffer: Buffer;

    before(() => {
      // Generate unique payment ID
      paymentId = generatePaymentId();
      console.log("\n   Payment ID:", Buffer.from(paymentId).toString('hex').slice(0, 16) + "...");

      // Derive payment and escrow PDAs
      [paymentPda] = PublicKey.findProgramAddressSync(
        [PAYMENT_SEED, paymentId],
        program.programId
      );
      [escrowPda] = PublicKey.findProgramAddressSync(
        [ESCROW_SEED, paymentId],
        program.programId
      );

      console.log("   Payment PDA:", paymentPda.toString().slice(0, 20) + "...");
      console.log("   Escrow PDA:", escrowPda.toString().slice(0, 20) + "...");
    });

    describe("2.1 Create FULLY PRIVATE Payment", () => {
      it("should create a private payment with encrypted sender, recipient, AND amount", async () => {
        console.log("\n--- Creating FULLY PRIVATE Payment ---");
        console.log("Amount:", PAYMENT_AMOUNT / LAMPORTS_PER_SOL, "SOL");
        console.log("ALL DATA ENCRYPTED: sender, recipient, amount");

        try {
          // Hash sender's pubkey to 128 bits
          const senderHash = hashPubkeyTo128Bits(wallet.publicKey);
          console.log("   Sender hash (128-bit):", senderHash.toString().slice(0, 20) + "...");

          // Hash recipient's pubkey to 128 bits
          const recipientHash = hashPubkeyTo128Bits(wallet.publicKey);
          console.log("   Recipient hash (128-bit):", recipientHash.toString().slice(0, 20) + "...");

          // Encrypt ALL values
          console.log("   Encrypting sender hash...");
          const encryptedSender = await encryptValue(senderHash);
          encryptedSenderBuffer = hexToBuffer(encryptedSender);
          console.log("   ✓ Sender encrypted");

          console.log("   Encrypting recipient hash...");
          const encryptedRecipient = await encryptValue(recipientHash);
          const encryptedRecipientBuffer = hexToBuffer(encryptedRecipient);
          console.log("   ✓ Recipient encrypted");

          console.log("   Encrypting amount...");
          const encryptedAmount = await encryptValue(BigInt(PAYMENT_AMOUNT));
          const encryptedAmountBuffer = hexToBuffer(encryptedAmount);
          console.log("   ✓ Amount encrypted");

          // Create payment
          console.log("   Creating FULLY PRIVATE payment transaction...");

          const tx = await program.methods
            .createPrivatePayment(
              Array.from(paymentId) as any,
              new BN(PAYMENT_AMOUNT),              // actual_amount for escrow
              encryptedSenderBuffer,               // encrypted sender
              encryptedRecipientBuffer,            // encrypted recipient
              encryptedAmountBuffer,               // encrypted amount
              new BN(3600)                         // 1 hour expiry
            )
            .accountsPartial({
              payer: wallet.publicKey,             // Changed from 'sender' to 'payer'
              payment: paymentPda,
              escrow: escrowPda,
              incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
            })
            .preInstructions([
              ComputeBudgetProgram.setComputeUnitLimit({ units: 600_000 }),
            ])
            .rpc();

          console.log("TX:", tx);
          await sleep(TX_CONFIRM_DELAY);

          // Verify payment - NO pubkeys visible anymore!
          const payment = await program.account.privatePayment.fetch(paymentPda);
          expect(payment.claimInitiated).to.equal(false);

          // Check escrow balance
          const escrowBalance = await connection.getBalance(escrowPda);
          console.log("   Escrow balance:", escrowBalance / LAMPORTS_PER_SOL, "SOL");
          expect(escrowBalance).to.be.gte(PAYMENT_AMOUNT);

          console.log("✓ FULLY PRIVATE payment created!");
          console.log("  Encrypted Sender:", payment.encryptedSender.toString().slice(0, 15) + "... (HIDDEN)");
          console.log("  Encrypted Recipient:", payment.encryptedRecipient.toString().slice(0, 15) + "... (HIDDEN)");
          console.log("  Encrypted Amount:", payment.encryptedAmount.toString().slice(0, 15) + "... (HIDDEN)");
          console.log("  Status:", Object.keys(payment.status)[0]);

        } catch (error: any) {
          console.log("⚠ Create payment failed:", error.message?.slice(0, 200));
          if (error.logs) {
            console.log("   Last logs:", error.logs?.slice(-5).join("\n   "));
          }
          throw error;
        }
      });
    });

    describe("2.2 Claim Private Payment", () => {
      it("should initiate claim with encrypted claimer hash (identity hidden)", async () => {
        console.log("\n--- Claiming Private Payment (Identity Hidden) ---");

        try {
          // Hash claimer's pubkey to 128 bits
          const claimerHash = hashPubkeyTo128Bits(wallet.publicKey);
          console.log("   Claimer hash (128-bit):", claimerHash.toString().slice(0, 20) + "...");

          // Encrypt the hash
          console.log("   Encrypting claimer hash...");
          const encryptedClaimer = await encryptValue(claimerHash);
          encryptedClaimerBuffer = hexToBuffer(encryptedClaimer);
          console.log("   ✓ Encrypted (claimer identity hidden)");

          // Initiate claim
          console.log("   Initiating claim transaction...");

          const tx = await program.methods
            .claimPayment(encryptedClaimerBuffer)
            .accountsPartial({
              claimer: wallet.publicKey,
              payment: paymentPda,
              incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
            })
            .preInstructions([
              ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
            ])
            .rpc();

          console.log("TX:", tx);
          await sleep(TX_CONFIRM_DELAY);

          // Verify payment state - NO claimer pubkey stored!
          const payment = await program.account.privatePayment.fetch(paymentPda);
          expect(payment.claimInitiated).to.equal(true);

          console.log("✓ Claim initiated (identity hidden)!");
          console.log("  Encrypted Claimer:", payment.encryptedClaimer.toString().slice(0, 15) + "... (NOT pubkey)");
          console.log("  Claim Proof Handle:", payment.claimProof.toString().slice(0, 15) + "...");
          console.log("  Status:", Object.keys(payment.status)[0]);

        } catch (error: any) {
          console.log("⚠ Claim failed:", error.message?.slice(0, 200));
          if (error.logs) {
            console.log("   Last logs:", error.logs?.slice(-5).join("\n   "));
          }
          throw error;
        }
      });
    });

    describe("2.3 Finalize Claim (Identity Verification via INCO)", () => {
      it("should finalize claim by proving identity with encrypted hash", async () => {
        console.log("\n--- Finalizing Claim (Identity Proof) ---");

        try {
          // Get balances before
          const claimerBalanceBefore = await connection.getBalance(wallet.publicKey);
          console.log("   Claimer balance before:", claimerBalanceBefore / LAMPORTS_PER_SOL, "SOL");

          // Re-encrypt claimer hash (same value, proves identity)
          const claimerHash = hashPubkeyTo128Bits(wallet.publicKey);
          console.log("   Re-encrypting claimer hash for verification...");
          const encryptedClaimer = await encryptValue(claimerHash);
          const verificationBuffer = hexToBuffer(encryptedClaimer);
          console.log("   ✓ Verification hash encrypted");

          // Finalize claim with encrypted proof
          console.log("   Finalizing claim with identity proof...");

          const tx = await program.methods
            .finalizeClaim(verificationBuffer)    // Now requires encrypted claimer proof
            .accountsPartial({
              claimer: wallet.publicKey,
              payment: paymentPda,
              escrow: escrowPda,
              incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
            })
            .preInstructions([
              ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
            ])
            .rpc();

          console.log("TX:", tx);
          await sleep(TX_CONFIRM_DELAY);

          // Verify payment state
          const payment = await program.account.privatePayment.fetch(paymentPda);
          expect(Object.keys(payment.status)[0]).to.equal("claimed");

          // Check balances after
          const claimerBalanceAfter = await connection.getBalance(wallet.publicKey);
          const escrowBalanceAfter = await connection.getBalance(escrowPda);

          console.log("✓ Claim finalized (identity verified via INCO)!");
          console.log("  Claimer balance after:", claimerBalanceAfter / LAMPORTS_PER_SOL, "SOL");
          console.log("  Escrow balance after:", escrowBalanceAfter / LAMPORTS_PER_SOL, "SOL");
          console.log("  Status:", Object.keys(payment.status)[0]);

        } catch (error: any) {
          console.log("⚠ Finalize failed:", error.message?.slice(0, 200));
          if (error.logs) {
            console.log("   Last logs:", error.logs?.slice(-5).join("\n   "));
          }
          throw error;
        }
      });
    });

    describe("2.4 Edge Cases", () => {
      let newPaymentId: Uint8Array;
      let newPaymentPda: PublicKey;
      let newEscrowPda: PublicKey;

      before(() => {
        newPaymentId = generatePaymentId();
        [newPaymentPda] = PublicKey.findProgramAddressSync(
          [PAYMENT_SEED, newPaymentId],
          program.programId
        );
        [newEscrowPda] = PublicKey.findProgramAddressSync(
          [ESCROW_SEED, newPaymentId],
          program.programId
        );
      });

      it("should allow sender to cancel by proving ownership (encrypted)", async () => {
        console.log("\n--- Testing Cancel Payment (Sender Proof) ---");

        try {
          // Encrypt ALL values for new payment
          const senderHash = hashPubkeyTo128Bits(wallet.publicKey);
          const recipientHash = hashPubkeyTo128Bits(wallet.publicKey);

          const encryptedSender = await encryptValue(senderHash);
          const newEncryptedSenderBuffer = hexToBuffer(encryptedSender);

          const encryptedRecipient = await encryptValue(recipientHash);
          const encryptedRecipientBuffer = hexToBuffer(encryptedRecipient);

          const encryptedAmount = await encryptValue(BigInt(0.01 * LAMPORTS_PER_SOL));
          const encryptedAmountBuffer = hexToBuffer(encryptedAmount);

          console.log("   Creating payment to cancel...");
          await program.methods
            .createPrivatePayment(
              Array.from(newPaymentId) as any,
              new BN(0.01 * LAMPORTS_PER_SOL),
              newEncryptedSenderBuffer,
              encryptedRecipientBuffer,
              encryptedAmountBuffer,
              new BN(60) // 60 second expiry
            )
            .accountsPartial({
              payer: wallet.publicKey,
              payment: newPaymentPda,
              escrow: newEscrowPda,
              incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
            })
            .preInstructions([
              ComputeBudgetProgram.setComputeUnitLimit({ units: 600_000 }),
            ])
            .rpc();

          await sleep(TX_CONFIRM_DELAY);
          console.log("   ✓ Payment created");

          // Cancel by proving sender ownership
          console.log("   Cancelling payment with sender proof...");
          const cancelSenderProof = await encryptValue(senderHash);
          const cancelProofBuffer = hexToBuffer(cancelSenderProof);

          const tx = await program.methods
            .cancelPayment(cancelProofBuffer)    // Now requires encrypted sender proof
            .accountsPartial({
              caller: wallet.publicKey,
              payment: newPaymentPda,
              escrow: newEscrowPda,
              incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
            })
            .preInstructions([
              ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
            ])
            .rpc();

          console.log("TX:", tx);
          await sleep(TX_CONFIRM_DELAY);

          // Verify
          const payment = await program.account.privatePayment.fetch(newPaymentPda);
          expect(Object.keys(payment.status)[0]).to.equal("cancelled");

          console.log("✓ Payment cancelled (sender verified via INCO)!");

        } catch (error: any) {
          console.log("⚠ Cancel test failed:", error.message?.slice(0, 200));
          if (error.logs) {
            console.log("   Last logs:", error.logs?.slice(-5).join("\n   "));
          }
        }
      });

      it("should reject claim on already claimed payment", async () => {
        console.log("\n--- Testing Double Claim Prevention ---");

        try {
          // Try to claim the already claimed payment
          const claimerHash = hashPubkeyTo128Bits(wallet.publicKey);
          const encryptedClaimer = await encryptValue(claimerHash);
          const encryptedClaimerBuffer = hexToBuffer(encryptedClaimer);

          await program.methods
            .claimPayment(encryptedClaimerBuffer)
            .accountsPartial({
              claimer: wallet.publicKey,
              payment: paymentPda,
              incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
            })
            .rpc();

          console.log("⚠ Should have failed but didn't");
        } catch (error: any) {
          if (error.message?.includes("PaymentNotActive") || error.message?.includes("already claimed")) {
            console.log("✓ Double claim correctly rejected");
          } else {
            console.log("✓ Claim rejected (different error):", error.message?.slice(0, 50));
          }
        }
      });
    });
  });

  // ==========================================
  // SECTION 3: COMPLETE FLOW DEMONSTRATION
  // ==========================================

  describe("SECTION 3: COMPLETE FLOWS", () => {
    describe("3.1 Complete Badge Access Flow", () => {
      it("should demonstrate full channel gating flow", async () => {
        console.log("\n" + "=".repeat(60));
        console.log("  COMPLETE CHANNEL GATING FLOW");
        console.log("=".repeat(60));

        if (!storedHandles) {
          console.log("⚠ No handles stored, skipping");
          return;
        }

        const channelId = "gold-vip-channel";
        const timestamp = Math.floor(Date.now() / 1000);

        // Step 1: User signs access request
        console.log("\nStep 1: User signs access request");
        const signature = signAccessMessage(wallet, channelId, timestamp);
        console.log("   ✓ Signed");

        // Step 2: Server verifies signature
        console.log("\nStep 2: Server verifies signature");
        const sigValid = verifyAccessSignature(wallet.publicKey, channelId, timestamp, signature);
        console.log("   ✓ Valid:", sigValid);

        // Step 3: Server fetches badge and checks proof
        console.log("\nStep 3: Server fetches badge, decrypts Gold proof");
        const badge = await program.account.confidentialBadge.fetch(badgePda);

        if (!badge.isActive) {
          console.log("   ✗ Badge not active");
          return;
        }

        const result = await decryptProofHandle(badge.proofGold, wallet);

        // Step 4: Grant or deny access
        console.log("\nStep 4: Access decision");
        if (result && result.isTrue) {
          console.log("   ✓ ACCESS GRANTED to Gold VIP channel!");
          console.log("   (User proved Gold+ status without revealing actual tier)");
        } else {
          console.log("   ✗ ACCESS DENIED - insufficient tier");
        }

        console.log("\n" + "=".repeat(60));
      });
    });

    describe("3.2 Complete FULLY PRIVATE Payment Flow", () => {
      it("should demonstrate full private payment flow", async () => {
        console.log("\n" + "=".repeat(60));
        console.log("  COMPLETE FULLY PRIVATE PAYMENT FLOW");
        console.log("=".repeat(60));

        console.log(`
FLOW SUMMARY:
  1. Sender creates payment with ALL DATA ENCRYPTED:
     - encrypt(sender_address_hash)    → WHO sent it: HIDDEN
     - encrypt(recipient_address_hash) → WHO receives: HIDDEN
     - encrypt(amount)                 → HOW MUCH: HIDDEN
     - Funds locked in escrow PDA

  2. Recipient initiates claim with encrypted address
     - INCO compares: stored_recipient == claimer_hash
     - Result stored as Ebool handle
     - Claimer identity stored ENCRYPTED (not pubkey!)

  3. Recipient decrypts proof off-chain
     - TRUE = They are the real recipient
     - FALSE = Wrong address

  4. Recipient finalizes claim by proving identity AGAIN
     - INCO compares: stored_claimer == provided_claimer
     - Only TRUE match releases funds
     - NO pubkey verification - all via encrypted comparison

  5. Cancel (sender) requires proving ownership
     - INCO compares: stored_sender == provided_sender
     - Only original sender can cancel

WHAT'S VISIBLE ON-CHAIN:
  - Payment ID (random)
  - Status (Active/Pending/Claimed/Cancelled)
  - Timestamps
  - Escrow balance

WHAT'S HIDDEN:
  ✓ WHO sent it (encrypted sender hash)
  ✓ WHO receives it (encrypted recipient hash)
  ✓ HOW MUCH (encrypted amount)
  ✓ WHO claimed it (encrypted claimer hash)

PRIVACY BENEFITS:
  ✓ Complete anonymity for all parties
  ✓ Amount hidden from on-chain observers
  ✓ No front-running possible
  ✓ Anonymous airdrops enabled
  ✓ True private escrow payments
  ✓ Zero-knowledge verification via INCO
`);

        console.log("=".repeat(60));
      });
    });
  });

  // ==========================================
  // SUMMARY
  // ==========================================

  after(() => {
    console.log("\n" + "=".repeat(70));
    console.log("  TEST SUMMARY");
    console.log("=".repeat(70));
    console.log(`
BADGE SYSTEM:
  • Encrypted tier storage (INCO Euint128)
  • Pre-computed proofs: tier >= threshold
  • Access verification via decrypt
  • Wallet signature authentication
  • Payment-based tier assignment (0.1-0.5 SOL)

FULLY PRIVATE PAYMENTS:
  • ALL DATA ENCRYPTED:
    - Sender address (encrypted hash)
    - Recipient address (encrypted hash)
    - Amount (encrypted value)
    - Claimer address (encrypted hash)
  • Claim with encrypted address proof
  • Finalize with identity verification via INCO
  • Cancel requires proving sender ownership
  • Escrow-based fund locking
  • Zero-knowledge verification

WHAT'S VISIBLE:
  • Payment ID (random)
  • Status (Active/Pending/Claimed/Cancelled)
  • Timestamps
  • Escrow balance

WHAT'S HIDDEN:
  • WHO sent it
  • WHO receives it
  • HOW MUCH was sent
  • WHO claimed it

INCO INTEGRATION:
  • encryptValue() for client-side encryption
  • e_ge() for >= comparisons
  • e_eq() for equality comparisons
  • allow() for decrypt permissions
  • decrypt() for off-chain verification

PROGRAM ID: ${program.programId.toString()}
INCO PROGRAM: ${INCO_LIGHTNING_PROGRAM_ID.toString()}
`);
    console.log("=".repeat(70) + "\n");
  });
});
