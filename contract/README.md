# Confidential Whale Badge - Smart Contract

> Privacy-First Badge & Payment System using INCO FHE on Solana

---

## Quick Reference

| Item | Value |
|------|-------|
| **Program ID** | `XPbon4Sw7hDArH49W8JNf5LK9nNTvowpRqWDHM2hMLD` |
| **INCO Program ID** | `5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj` |
| **Network** | Solana Devnet |
| **IDL Location** | `target/idl/confidential_whale_badge.json` |
| **Keypair Location** | `target/deploy/confidential_whale_badge-keypair.json` |

---

## File Locations for UI Integration

```
contract/
├── target/
│   ├── idl/
│   │   └── confidential_whale_badge.json    # ← IDL for Anchor client
│   ├── deploy/
│   │   └── confidential_whale_badge-keypair.json  # ← Program keypair
│   └── types/
│       └── confidential_whale_badge.ts      # ← TypeScript types
├── programs/
│   └── confidential-whale-badge/
│       └── src/
│           ├── lib.rs                       # ← Main program entry
│           ├── instructions/                # ← All instruction handlers
│           ├── state/                       # ← Account structures
│           ├── error.rs                     # ← Custom errors
│           └── constants.rs                 # ← PDA seeds & constants
└── tests/
    └── confidential-whale-badge.ts          # ← Test examples
```

---

## UI Integration Guide

### 1. Install Dependencies

```bash
npm install @coral-xyz/anchor @solana/web3.js @inco/solana-sdk
```

### 2. Import IDL and Setup Program

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Connection } from "@solana/web3.js";

// Import IDL (copy from target/idl/confidential_whale_badge.json)
import IDL from "./idl/confidential_whale_badge.json";

// Program IDs
const PROGRAM_ID = new PublicKey("XPbon4Sw7hDArH49W8JNf5LK9nNTvowpRqWDHM2hMLD");
const INCO_PROGRAM_ID = new PublicKey("5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj");

// Setup connection and program
const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
const program = new Program(IDL, PROGRAM_ID, provider);
```

### 3. INCO SDK for Encryption

```typescript
import { encryptValue, decrypt, hexToBuffer } from "@inco/solana-sdk";
import { createHash } from "crypto";

// Hash pubkey to 128 bits (for private payments)
function hashPubkeyTo128Bits(pubkey: PublicKey): bigint {
  const hash = createHash('sha256').update(pubkey.toBuffer()).digest();
  let result = BigInt(0);
  for (let i = 15; i >= 0; i--) {
    result = (result << BigInt(8)) | BigInt(hash[i]);
  }
  return result;
}

// Encrypt a value
const recipientHash = hashPubkeyTo128Bits(recipientPubkey);
const encryptedRecipient = await encryptValue(recipientHash);
const encryptedBuffer = hexToBuffer(encryptedRecipient);
```

---

## Instructions Reference

### Badge System

#### 1. Initialize Config (Admin Only)
```typescript
await program.methods
  .initialize()
  .accounts({
    admin: wallet.publicKey,
    config: configPda,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

#### 2. Claim Badge (With Payment)
```typescript
// Encrypt tier values using INCO
const encryptedTier = await encryptValue(BigInt(tier));
const encryptedT1 = await encryptValue(BigInt(1));
// ... encrypt thresholds 2-5

await program.methods
  .claimBadge(
    tier,
    hexToBuffer(encryptedTier),
    hexToBuffer(encryptedT1),
    hexToBuffer(encryptedT2),
    hexToBuffer(encryptedT3),
    hexToBuffer(encryptedT4),
    hexToBuffer(encryptedT5),
  )
  .accounts({
    user: wallet.publicKey,
    treasury: treasuryPubkey,
    config: configPda,
    badge: badgePda,
    incoLightningProgram: INCO_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

#### 3. Grant Decrypt Access
```typescript
// Derive allowance PDAs for each handle
function deriveAllowancePda(handle: bigint, owner: PublicKey): PublicKey {
  const buf = Buffer.alloc(16);
  let v = handle;
  for (let i = 0; i < 16; i++) {
    buf[i] = Number(v & BigInt(0xff));
    v >>= BigInt(8);
  }
  return PublicKey.findProgramAddressSync(
    [buf, owner.toBuffer()],
    INCO_PROGRAM_ID
  )[0];
}

await program.methods
  .grantAccess()
  .accounts({
    user: wallet.publicKey,
    badge: badgePda,
    incoLightningProgram: INCO_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .remainingAccounts([
    { pubkey: tierAllowancePda, isSigner: false, isWritable: true },
    { pubkey: wallet.publicKey, isSigner: false, isWritable: false },
    // ... 10 more for bronze, silver, gold, diamond, legendary
  ])
  .rpc();
```

---

### Fully Private Payments

#### 1. Create Private Payment
```typescript
// Encrypt ALL data
const senderHash = hashPubkeyTo128Bits(wallet.publicKey);
const recipientHash = hashPubkeyTo128Bits(recipientPubkey);

const encryptedSender = hexToBuffer(await encryptValue(senderHash));
const encryptedRecipient = hexToBuffer(await encryptValue(recipientHash));
const encryptedAmount = hexToBuffer(await encryptValue(BigInt(amount)));

await program.methods
  .createPrivatePayment(
    Array.from(paymentId),      // [u8; 32]
    new BN(amount),             // actual_amount for escrow
    encryptedSender,            // encrypted sender hash
    encryptedRecipient,         // encrypted recipient hash
    encryptedAmount,            // encrypted amount
    new BN(3600),               // expiry_seconds (1 hour)
  )
  .accounts({
    payer: wallet.publicKey,
    payment: paymentPda,
    escrow: escrowPda,
    incoLightningProgram: INCO_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

#### 2. Claim Payment
```typescript
const claimerHash = hashPubkeyTo128Bits(wallet.publicKey);
const encryptedClaimer = hexToBuffer(await encryptValue(claimerHash));

await program.methods
  .claimPayment(encryptedClaimer)
  .accounts({
    claimer: wallet.publicKey,
    payment: paymentPda,
    incoLightningProgram: INCO_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

#### 3. Finalize Claim
```typescript
// Re-encrypt claimer hash for verification
const claimerHash = hashPubkeyTo128Bits(wallet.publicKey);
const verificationBuffer = hexToBuffer(await encryptValue(claimerHash));

await program.methods
  .finalizeClaim(verificationBuffer)
  .accounts({
    claimer: wallet.publicKey,
    payment: paymentPda,
    escrow: escrowPda,
    incoLightningProgram: INCO_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

#### 4. Cancel Payment (Sender Only)
```typescript
const senderHash = hashPubkeyTo128Bits(wallet.publicKey);
const senderProof = hexToBuffer(await encryptValue(senderHash));

await program.methods
  .cancelPayment(senderProof)
  .accounts({
    caller: wallet.publicKey,
    payment: paymentPda,
    escrow: escrowPda,
    incoLightningProgram: INCO_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

---

## PDA Derivation

```typescript
// Seeds
const CONFIG_SEED = Buffer.from("config");
const BADGE_SEED = Buffer.from("badge");
const PAYMENT_SEED = Buffer.from("payment");
const ESCROW_SEED = Buffer.from("escrow");

// Derive PDAs
const [configPda] = PublicKey.findProgramAddressSync(
  [CONFIG_SEED],
  PROGRAM_ID
);

const [badgePda] = PublicKey.findProgramAddressSync(
  [BADGE_SEED, wallet.publicKey.toBuffer()],
  PROGRAM_ID
);

const [paymentPda] = PublicKey.findProgramAddressSync(
  [PAYMENT_SEED, paymentId],
  PROGRAM_ID
);

const [escrowPda] = PublicKey.findProgramAddressSync(
  [ESCROW_SEED, paymentId],
  PROGRAM_ID
);
```

---

## INCO Integration Summary

### Operations Used

| Operation | Purpose | Handler |
|-----------|---------|---------|
| `new_euint128()` | Create encrypted handle | All handlers |
| `e_eq()` | Equality comparison | claim_payment, finalize_claim, cancel_payment |
| `e_ge()` | Greater-than-or-equal | claim_badge (tier proofs) |
| `allow()` | Grant decrypt permission | grant_access, claim_payment |

### Decrypt Proofs (Client-Side)

```typescript
import { decrypt } from "@inco/solana-sdk";
import * as nacl from "tweetnacl";

// Decrypt a proof handle
const result = await decrypt([handleStr], {
  address: wallet.publicKey,
  signMessage: async (msg: Uint8Array) =>
    nacl.sign.detached(msg, wallet.secretKey),
});

const isTrue = result.plaintexts[0] === "1";
```

---

## Privacy Model

### What's ENCRYPTED (Hidden on-chain)

| Data | Storage | Type |
|------|---------|------|
| Sender address | `encrypted_sender` | u128 INCO handle |
| Recipient address | `encrypted_recipient` | u128 INCO handle |
| Amount | `encrypted_amount` | u128 INCO handle |
| Claimer address | `encrypted_claimer` | u128 INCO handle |
| Badge tier | `encrypted_tier` | u128 INCO handle |
| Tier proofs | `proof_bronze..legendary` | u128 INCO handles |

### What's VISIBLE

| Data | Purpose |
|------|---------|
| Payment ID | Random identifier (no info leak) |
| Status | Active/Pending/Claimed/Cancelled |
| Timestamps | created_at, expires_at, claimed_at |
| Escrow balance | SOL amount in escrow PDA |

### Unlinkability

```
Observer sees:
  • "Wallet A created payment XYZ"
  • "Wallet B claimed payment XYZ"

Observer CANNOT prove:
  • That Wallet A intended to send to Wallet B
  • The link is broken without INCO decryption!
```

---

## Account Structures

### PrivatePayment
```rust
pub struct PrivatePayment {
    pub bump: u8,
    pub payment_id: [u8; 32],
    pub encrypted_sender: u128,      // INCO handle
    pub encrypted_recipient: u128,   // INCO handle
    pub encrypted_amount: u128,      // INCO handle
    pub claim_proof: u128,           // INCO Ebool handle
    pub encrypted_claimer: u128,     // INCO handle
    pub claim_initiated: bool,
    pub created_at: i64,
    pub expires_at: i64,
    pub claimed_at: i64,
    pub status: PaymentStatus,       // Active/Pending/Claimed/Cancelled
    pub escrow_bump: u8,
}
```

### ConfidentialBadge
```rust
pub struct ConfidentialBadge {
    pub bump: u8,
    pub owner: Pubkey,
    pub tier: u8,                    // Plaintext tier (1-5)
    pub encrypted_tier: u128,        // INCO handle
    pub proof_bronze: u128,          // tier >= 1
    pub proof_silver: u128,          // tier >= 2
    pub proof_gold: u128,            // tier >= 3
    pub proof_diamond: u128,         // tier >= 4
    pub proof_legendary: u128,       // tier >= 5
    pub amount_paid: u64,
    pub created_at: i64,
    pub is_active: bool,
}
```

---

## Badge Tier Prices

| Tier | Name | Price |
|------|------|-------|
| 1 | Bronze | 0.1 SOL |
| 2 | Silver | 0.2 SOL |
| 3 | Gold | 0.3 SOL |
| 4 | Diamond | 0.4 SOL |
| 5 | Legendary | 0.5 SOL |

---

## Build & Deploy

```bash
# Build
anchor build

# Deploy to devnet
anchor deploy

# Run tests
anchor test --skip-local-validator
```

---

## Test Results

```
15 passing (37s)

✅ Badge System:
  • Initialize config
  • Claim badge with payment
  • Grant decrypt access
  • Verify tier proofs (Bronze+, Gold+, Diamond+)
  • Signature authentication

✅ Fully Private Payments:
  • Create payment (all data encrypted)
  • Claim with hidden identity
  • Finalize with INCO verification
  • Cancel with sender proof
  • Double claim prevention
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 6000 | InvalidTier | Tier must be 1-5 |
| 6001 | BadgeInactive | Badge is not active |
| 6002 | Unauthorized | Not the owner |
| 6003 | PaymentNotActive | Payment is not active |
| 6004 | PaymentExpired | Payment has expired |
| 6005 | PaymentNotExpired | Cannot cancel before expiry |
| 6006 | ClaimAlreadyInitiated | Already claimed |
| 6007 | ClaimNotInitiated | No claim to finalize |
| 6008 | PaymentAlreadyClaimed | Payment already claimed |
| 6009 | InvalidPaymentAmount | Amount must be > 0 |
| 6010 | InsufficientEscrowFunds | Escrow is empty |

---

## License

MIT License - Solana Privacy Hack 2026
