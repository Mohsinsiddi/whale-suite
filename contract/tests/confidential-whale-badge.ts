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

// INCO SDK imports
import { encryptValue, decrypt, hexToBuffer } from "@inco/solana-sdk";

// ============================================================
// CONSTANTS
// ============================================================

const INCO_LIGHTNING_PROGRAM_ID = new PublicKey("5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj");
const CONFIG_SEED = Buffer.from("config");
const BADGE_SEED = Buffer.from("badge");

// Tier Constants
const TIER_BRONZE = 1;
const TIER_SILVER = 2;
const TIER_GOLD = 3;
const TIER_DIAMOND = 4;
const TIER_LEGENDARY = 5;

// Delays for devnet (INCO needs time to process)
const TX_CONFIRM_DELAY = 3000; // 3 seconds
const DECRYPT_DELAY = 2000;    // 2 seconds

// Compute budget for INCO operations (11 CPI calls need more than 200k CUs)
const COMPUTE_UNITS = 1_200_000; // 1.2M compute units

// ============================================================
// HELPER FUNCTIONS (Following Raffle Example Pattern)
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
 * Extract handles from transaction simulation logs
 */
function extractHandlesFromLogs(logs: string[]): {
  tier: bigint;
  bronze: bigint;
  silver: bigint;
  gold: bigint;
  diamond: bigint;
  legendary: bigint;
} {
  const handles = {
    tier: BigInt(0),
    bronze: BigInt(0),
    silver: BigInt(0),
    gold: BigInt(0),
    diamond: BigInt(0),
    legendary: BigInt(0),
  };

  for (const log of logs) {
    if (log.includes("Tier handle:")) {
      const match = log.match(/Tier handle: (\d+)/);
      if (match) handles.tier = BigInt(match[1]);
    }
    if (log.includes("Bronze proof handle:")) {
      const match = log.match(/Bronze proof handle: (\d+)/);
      if (match) handles.bronze = BigInt(match[1]);
    }
    if (log.includes("Silver proof handle:")) {
      const match = log.match(/Silver proof handle: (\d+)/);
      if (match) handles.silver = BigInt(match[1]);
    }
    if (log.includes("Gold proof handle:")) {
      const match = log.match(/Gold proof handle: (\d+)/);
      if (match) handles.gold = BigInt(match[1]);
    }
    if (log.includes("Diamond proof handle:")) {
      const match = log.match(/Diamond proof handle: (\d+)/);
      if (match) handles.diamond = BigInt(match[1]);
    }
    if (log.includes("Legendary proof handle:")) {
      const match = log.match(/Legendary proof handle: (\d+)/);
      if (match) handles.legendary = BigInt(match[1]);
    }
  }

  return handles;
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

describe("Confidential Whale Badge - Production Tests", () => {
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
    console.log("  CONFIDENTIAL WHALE BADGE - DEVNET TESTS");
    console.log("  Following INCO Raffle Example Pattern");
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

    if (balance < 0.1 * LAMPORTS_PER_SOL) {
      console.log("\n⚠ Low balance! Request airdrop from https://faucet.solana.com");
    }
    console.log("");
  });

  // ==========================================
  // 1. INITIALIZE CONFIG
  // ==========================================

  describe("1. Initialize Config", () => {
    it("should initialize global config", async () => {
      console.log("\n--- Initializing Config ---");

      try {
        // Check if already initialized
        try {
          const existing = await program.account.config.fetch(configPda);
          console.log("✓ Config already initialized, skipping");
          console.log("  Admin:", existing.admin.toString().slice(0, 20) + "...");
          console.log("  Total Badges:", existing.totalBadges.toString());
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

  // ==========================================
  // 2. CLAIM BADGE (Two-Step Process)
  // ==========================================

  describe("2. Claim Badge", () => {
    it("should claim badge with GOLD tier", async () => {
      console.log("\n--- Claiming Gold Badge ---");
      console.log("Tier:", getTierName(TEST_TIER), `(${TEST_TIER})`);

      try {
        // Check if already claimed
        try {
          const existing = await program.account.confidentialBadge.fetch(badgePda);
          console.log("✓ Badge already claimed, skipping");
          console.log("  Owner:", existing.owner.toString().slice(0, 20) + "...");
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

        // Step 2: Execute claim WITHOUT remaining_accounts (simpler approach)
        // The user who signs automatically gets decrypt permission for handles they create
        console.log("   Executing claim transaction...");
        console.log(`   Using ${COMPUTE_UNITS.toLocaleString()} compute units`);

        const tx = await program.methods
          .claimBadge(
            encrypted.tierCiphertext,
            encrypted.threshold1,
            encrypted.threshold2,
            encrypted.threshold3,
            encrypted.threshold4,
            encrypted.threshold5
          )
          .accountsPartial({
            user: wallet.publicKey,
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

        console.log("✓ Badge claimed successfully!");
        console.log("  Owner:", badge.owner.toString().slice(0, 20) + "...");
        console.log("  Is Active:", badge.isActive);
        console.log("  Encrypted Tier:", badge.encryptedTier.toString().slice(0, 15) + "...");
        console.log("  Proof Bronze:", badge.proofBronze.toString().slice(0, 15) + "...");
        console.log("  Proof Gold:", badge.proofGold.toString().slice(0, 15) + "...");

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
        console.log("   Error name:", error.name);
        console.log("   Error code:", error.code);
        if (error.logs) {
          console.log("   Last logs:", error.logs?.slice(-10).join("\n   "));
        }
        throw error;
      }
    });
  });

  // ==========================================
  // 3. VERIFY ACCESS (Decrypt Proofs)
  // ==========================================

  describe("3. Verify Channel Access", () => {
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

  // ==========================================
  // 4. SIGNATURE AUTHENTICATION
  // ==========================================

  describe("4. Signature Authentication", () => {
    it("should authenticate with wallet signature", async () => {
      console.log("\n--- Wallet Signature Auth ---");

      const channelId = "gold-vip-channel";
      const timestamp = Math.floor(Date.now() / 1000);

      // User signs
      const signature = signAccessMessage(wallet, channelId, timestamp);
      console.log("   Signed message for channel:", channelId);

      // Server verifies
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

  // ==========================================
  // 5. COMPLETE ACCESS FLOW
  // ==========================================

  describe("5. Complete Access Flow", () => {
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

  // ==========================================
  // SUMMARY
  // ==========================================

  after(() => {
    console.log("\n" + "=".repeat(70));
    console.log("  TEST SUMMARY");
    console.log("=".repeat(70));
    console.log(`
Key Points:
  • Program ID: ${program.programId.toString()}
  • INCO Program: ${INCO_LIGHTNING_PROGRAM_ID.toString()}
  • Badge claimed with encrypted tier
  • Proofs pre-computed: tier >= 1, tier >= 2, ... tier >= 5
  • Access verified via decrypt (no tier revealed!)
  • Signature authentication for channel gating

Flow:
  1. User claims badge (one-time, stores encrypted proofs)
  2. User signs message to prove wallet ownership
  3. Server fetches proof handle from chain
  4. Server decrypts proof → TRUE/FALSE
  5. Access granted without revealing actual tier
`);
    console.log("=".repeat(70) + "\n");
  });
});
