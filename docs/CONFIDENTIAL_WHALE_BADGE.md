# CONFIDENTIAL WHALE BADGE

> Privacy-First Badge Verification using INCO Lightning on Solana
> Whale Trading Suite | Solana Privacy Hack 2026

---

## TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Smart Contract (Anchor + INCO)](#3-smart-contract)
4. [UI Flow](#4-ui-flow)
5. [Account Structure](#5-account-structure)
6. [Frontend Components](#6-frontend-components)
7. [API Endpoints](#7-api-endpoints)
8. [Database Models](#8-database-models)
9. [Development Checklist](#9-development-checklist)
10. [Hackathon Proof](#10-hackathon-proof)

---

## 1. OVERVIEW

### Problem
Whale badge holders want to join exclusive channels, but:
- Proving badge tier reveals exact tier to everyone
- No privacy when verifying membership
- Current badge data stored in plaintext MongoDB

### Solution
**Confidential Whale Badge** using INCO Lightning:
- Encrypt badge tier on-chain (devnet)
- Pre-compute proofs: "Am I Gold+?" without revealing exact tier
- Join channels with just a signature (no TX, free forever)
- One-time claim, works on mainnet forever after

### Key Innovation
```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   BEFORE: "I'm Gold tier" → Everyone knows you're Gold                  │
│                                                                         │
│   AFTER:  "I'm Gold+" → Proves >= Gold without revealing exact tier     │
│           Could be Gold, Diamond, or Legendary - nobody knows!          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### INCO Lightning Integration

| Component | Value |
|-----------|-------|
| **Program ID** | `5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj` |
| **Network** | Solana Devnet |
| **Rust Crate** | `inco-lightning = "0.1.4"` |
| **JS SDK** | `@inco/solana-sdk` |

---

## 2. ARCHITECTURE

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ARCHITECTURE DIAGRAM                             │
└─────────────────────────────────────────────────────────────────────────┘

MAINNET (Existing)                    DEVNET (New - INCO)
────────────────────                  ─────────────────────

┌──────────────────┐                  ┌──────────────────┐
│  Badge NFT       │                  │  Confidential    │
│  (Metaplex)      │                  │  Whale Badge     │
│                  │                  │  (Our Program)   │
│  • Visible NFT   │    ─────────→    │                  │
│  • Tier in URI   │    One-time      │  • Encrypted tier│
│  • Tradeable     │    Claim         │  • ZK proofs     │
│                  │                  │  • INCO handles  │
└──────────────────┘                  └──────────────────┘
                                              │
                                              │ CPI
                                              ▼
                                      ┌──────────────────┐
                                      │  INCO Lightning  │
                                      │  (Already Live)  │
                                      │                  │
                                      │  • new_euint128()│
                                      │  • e_ge()        │
                                      │  • allow()       │
                                      │  • decrypt()     │
                                      └──────────────────┘

FRONTEND (Next.js)
──────────────────

┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  Mainnet Mode                        │  Devnet Mode                      │
│  ─────────────                       │  ────────────                     │
│                                      │                                   │
│  • All features enabled              │  • Only channels enabled          │
│  • Channels: 🔒 (if not claimed)     │  • Claim badge flow               │
│  • Channels: ✅ (if claimed)         │  • View encrypted account         │
│  • Banner: "Unlock channels"         │  • Other features disabled        │
│                                      │                                   │
└──────────────────────────────────────────────────────────────────────────┘
```

### Network Flow

```
USER JOURNEY
────────────

1. MAINNET: Buy Badge (existing)
   └─→ Gets Gold NFT
   └─→ Tier stored in MongoDB
   └─→ Sees "Unlock Channels" banner

2. SWITCH TO DEVNET
   └─→ Dashboard shows claim CTA
   └─→ User clicks "Claim Confidential Badge"

3. DEVNET: Claim (ONE transaction)
   └─→ Encrypts tier with INCO
   └─→ Pre-computes all 5 proofs
   └─→ Stores handles on-chain
   └─→ Solscan link for proof!

4. SWITCH BACK TO MAINNET
   └─→ Channels now UNLOCKED ✅
   └─→ Can join any tier-gated channel
   └─→ Just sign to verify (free!)
   └─→ Works forever
```

---

## 3. SMART CONTRACT

### Program: `confidential_whale_badge`

**Deploy to:** Solana Devnet
**Language:** Rust + Anchor
**Dependencies:** `inco-lightning = "0.1.4"`

### Program Structure

```rust
// programs/confidential-whale-badge/src/lib.rs

use anchor_lang::prelude::*;

// INCO Lightning program on devnet
pub const INCO_PROGRAM_ID: Pubkey = pubkey!("5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj");

declare_id!("CWBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"); // Our program ID

#[program]
pub mod confidential_whale_badge {
    use super::*;

    /// Create confidential badge with encrypted tier
    /// Called once per user after they buy badge on mainnet
    pub fn claim_badge(
        ctx: Context<ClaimBadge>,
        tier: u8,  // 1=Bronze, 2=Silver, 3=Gold, 4=Diamond, 5=Legendary
    ) -> Result<()> {
        // Implementation below
    }

    /// Upgrade tier when user buys higher badge
    pub fn upgrade_tier(
        ctx: Context<UpgradeTier>,
        new_tier: u8,
    ) -> Result<()> {
        // Implementation below
    }

    /// Transfer badge to another wallet
    pub fn transfer_badge(
        ctx: Context<TransferBadge>,
        new_owner: Pubkey,
    ) -> Result<()> {
        // Implementation below
    }
}
```

### Instructions

#### 1. `claim_badge` - Create Confidential Badge

```rust
pub fn claim_badge(
    ctx: Context<ClaimBadge>,
    tier: u8,
) -> Result<()> {
    let badge = &mut ctx.accounts.badge;
    let user = &ctx.accounts.user;
    let inco = &ctx.accounts.inco_program;

    // Validate tier (1-5)
    require!(tier >= 1 && tier <= 5, ErrorCode::InvalidTier);

    // 1. Encrypt tier using INCO
    let encrypted_tier = inco_lightning::cpi::new_euint128(
        CpiContext::new(inco.to_account_info(), ...),
        tier as u128,
        0, // nonce
    )?;

    // 2. Pre-compute all 5 tier proofs
    // proof_bronze: is tier >= 1?
    let tier_1 = inco_lightning::cpi::new_euint128(..., 1, 0)?;
    let proof_bronze = inco_lightning::cpi::e_ge(..., encrypted_tier, tier_1, 0)?;

    // proof_silver: is tier >= 2?
    let tier_2 = inco_lightning::cpi::new_euint128(..., 2, 0)?;
    let proof_silver = inco_lightning::cpi::e_ge(..., encrypted_tier, tier_2, 0)?;

    // proof_gold: is tier >= 3?
    let tier_3 = inco_lightning::cpi::new_euint128(..., 3, 0)?;
    let proof_gold = inco_lightning::cpi::e_ge(..., encrypted_tier, tier_3, 0)?;

    // proof_diamond: is tier >= 4?
    let tier_4 = inco_lightning::cpi::new_euint128(..., 4, 0)?;
    let proof_diamond = inco_lightning::cpi::e_ge(..., encrypted_tier, tier_4, 0)?;

    // proof_legendary: is tier >= 5?
    let tier_5 = inco_lightning::cpi::new_euint128(..., 5, 0)?;
    let proof_legendary = inco_lightning::cpi::e_ge(..., encrypted_tier, tier_5, 0)?;

    // 3. Allow user to decrypt all proofs
    inco_lightning::cpi::allow(..., encrypted_tier, user.key())?;
    inco_lightning::cpi::allow(..., proof_bronze, user.key())?;
    inco_lightning::cpi::allow(..., proof_silver, user.key())?;
    inco_lightning::cpi::allow(..., proof_gold, user.key())?;
    inco_lightning::cpi::allow(..., proof_diamond, user.key())?;
    inco_lightning::cpi::allow(..., proof_legendary, user.key())?;

    // 4. Store handles in badge account
    badge.bump = ctx.bumps.badge;
    badge.owner = user.key();
    badge.encrypted_tier = encrypted_tier.to_bytes();
    badge.proof_bronze = proof_bronze.to_bytes();
    badge.proof_silver = proof_silver.to_bytes();
    badge.proof_gold = proof_gold.to_bytes();
    badge.proof_diamond = proof_diamond.to_bytes();
    badge.proof_legendary = proof_legendary.to_bytes();
    badge.created_at = Clock::get()?.unix_timestamp;
    badge.is_active = true;

    // 5. Emit event
    emit!(BadgeClaimed {
        owner: user.key(),
        created_at: badge.created_at,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct ClaimBadge<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = 8 + ConfidentialWhaleBadge::SIZE,
        seeds = [b"badge", user.key().as_ref()],
        bump
    )]
    pub badge: Account<'info, ConfidentialWhaleBadge>,

    /// CHECK: INCO Lightning program
    pub inco_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}
```

#### 2. `upgrade_tier` - Upgrade Encrypted Tier

```rust
pub fn upgrade_tier(
    ctx: Context<UpgradeTier>,
    new_tier: u8,
) -> Result<()> {
    let badge = &mut ctx.accounts.badge;
    let user = &ctx.accounts.user;

    // Validate new tier is higher (can't downgrade)
    // Note: We can't check old tier value, but frontend validates
    require!(new_tier >= 1 && new_tier <= 5, ErrorCode::InvalidTier);

    // Re-encrypt with new tier
    // (Same process as claim_badge but updates existing account)

    // ... encrypt new tier and recompute all proofs ...

    emit!(BadgeUpgraded {
        owner: user.key(),
        new_tier,
        upgraded_at: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
```

#### 3. `transfer_badge` - Transfer to New Owner

```rust
pub fn transfer_badge(
    ctx: Context<TransferBadge>,
    new_owner: Pubkey,
) -> Result<()> {
    let badge = &mut ctx.accounts.badge;
    let old_owner = badge.owner;

    // Update owner
    badge.owner = new_owner;

    // Re-allow new owner to decrypt all proofs
    // Revoke old owner's access (INCO handles this automatically)
    inco_lightning::cpi::allow(..., badge.encrypted_tier, new_owner)?;
    inco_lightning::cpi::allow(..., badge.proof_bronze, new_owner)?;
    inco_lightning::cpi::allow(..., badge.proof_silver, new_owner)?;
    inco_lightning::cpi::allow(..., badge.proof_gold, new_owner)?;
    inco_lightning::cpi::allow(..., badge.proof_diamond, new_owner)?;
    inco_lightning::cpi::allow(..., badge.proof_legendary, new_owner)?;

    emit!(BadgeTransferred {
        from: old_owner,
        to: new_owner,
        transferred_at: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
```

### Account Structure

```rust
#[account]
pub struct ConfidentialWhaleBadge {
    pub bump: u8,                      // PDA bump seed

    // Owner
    pub owner: Pubkey,                 // Current owner wallet

    // Encrypted Data (INCO handles - NOT actual values!)
    pub encrypted_tier: [u8; 32],      // Handle → tier value (1-5)

    // Pre-computed Proofs (Ebool handles)
    pub proof_bronze: [u8; 32],        // Handle → tier >= 1
    pub proof_silver: [u8; 32],        // Handle → tier >= 2
    pub proof_gold: [u8; 32],          // Handle → tier >= 3
    pub proof_diamond: [u8; 32],       // Handle → tier >= 4
    pub proof_legendary: [u8; 32],     // Handle → tier >= 5

    // Metadata
    pub created_at: i64,               // Unix timestamp
    pub is_active: bool,               // Active status
}

impl ConfidentialWhaleBadge {
    pub const SIZE: usize =
        1 +         // bump
        32 +        // owner
        32 +        // encrypted_tier
        32 * 5 +    // 5 proofs
        8 +         // created_at
        1;          // is_active
    // Total: 234 bytes
    // Rent: ~0.002 SOL (devnet = free)
}
```

### Events

```rust
#[event]
pub struct BadgeClaimed {
    pub owner: Pubkey,
    pub created_at: i64,
}

#[event]
pub struct BadgeUpgraded {
    pub owner: Pubkey,
    pub new_tier: u8,
    pub upgraded_at: i64,
}

#[event]
pub struct BadgeTransferred {
    pub from: Pubkey,
    pub to: Pubkey,
    pub transferred_at: i64,
}
```

### Error Codes

```rust
#[error_code]
pub enum ErrorCode {
    #[msg("Invalid tier. Must be 1-5")]
    InvalidTier,

    #[msg("Badge already claimed")]
    AlreadyClaimed,

    #[msg("Not badge owner")]
    NotOwner,

    #[msg("Badge is not active")]
    BadgeInactive,

    #[msg("Cannot transfer to self")]
    SelfTransfer,
}
```

### Cargo.toml

```toml
[package]
name = "confidential-whale-badge"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "confidential_whale_badge"

[features]
default = []
cpi = ["no-entrypoint"]
no-entrypoint = []

[dependencies]
anchor-lang = "0.29.0"
inco-lightning = "0.1.4"
```

### Anchor.toml

```toml
[features]
seeds = false
skip-lint = false

[programs.devnet]
confidential_whale_badge = "CWBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
```

---

## 4. UI FLOW

### Network-Aware Navigation

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         NETWORK-AWARE UX                                 │
└─────────────────────────────────────────────────────────────────────────┘

SIDEBAR STATES
──────────────

                    MAINNET                          DEVNET
                    ───────                          ──────

Not Claimed:        ✅ Dashboard                     ✅ Dashboard
                    ✅ Privacy                       🔒 Privacy (mainnet only)
                    ✅ Transfer                      🔒 Transfer (mainnet only)
                    ✅ Swap                          🔒 Swap (mainnet only)
                    ✅ Markets                       🔒 Markets (mainnet only)
                    ✅ Badges                        🔒 Badges (mainnet only)
                    ✅ Affiliate                     🔒 Affiliate (mainnet only)
                    🔒 Channels ← "Switch to         ✅ Channels ← "Claim first"
                       Devnet & claim"

Claimed:            ✅ Dashboard                     ✅ Dashboard
                    ✅ Privacy                       🔒 Privacy (mainnet only)
                    ✅ Transfer                      🔒 Transfer (mainnet only)
                    ✅ Swap                          🔒 Swap (mainnet only)
                    ✅ Markets                       🔒 Markets (mainnet only)
                    ✅ Badges                        🔒 Badges (mainnet only)
                    ✅ Affiliate                     🔒 Affiliate (mainnet only)
                    ✅ Channels ← UNLOCKED!          ✅ Channels
```

### Dashboard Views

#### Mainnet Dashboard (Not Claimed)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DASHBOARD                                                    [Mainnet] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [Normal dashboard content: balances, quick actions, whale feed, etc.]  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  🐋 UNLOCK PRIVATE WHALE CHANNELS                                   ││
│  │                                                                     ││
│  │  Join exclusive tier-gated channels with encrypted verification.   ││
│  │  Prove you're Gold+ without revealing your exact tier!             ││
│  │                                                                     ││
│  │  ┌─────────────────────────────────────────────────────────────┐   ││
│  │  │  1. Switch to Devnet                                        │   ││
│  │  │  2. Claim your Confidential Badge (one-time, free)          │   ││
│  │  │  3. Return to Mainnet - Channels unlocked forever!          │   ││
│  │  └─────────────────────────────────────────────────────────────┘   ││
│  │                                                                     ││
│  │  [Switch to Devnet →]                                               ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Mainnet Dashboard (Claimed)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DASHBOARD                                                    [Mainnet] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [Normal dashboard content]                                             │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  ✅ CONFIDENTIAL BADGE ACTIVE                                       ││
│  │                                                                     ││
│  │  Your encrypted tier is stored on Solana Devnet.                   ││
│  │  Join private channels without revealing your exact tier!          ││
│  │                                                                     ││
│  │  [View Badge Account]     [Join Channels →]                         ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Devnet Dashboard (Not Claimed)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DASHBOARD                                                    [Devnet]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  🟣 DEVNET MODE                                                     ││
│  │  Only confidential badge features available here.                   ││
│  │  Switch to Mainnet for full app features.                          ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  🔐 CLAIM YOUR CONFIDENTIAL BADGE                                   ││
│  │                                                                     ││
│  │  ┌─────────────────────────────────────────────────────────────┐   ││
│  │  │                                                             │   ││
│  │  │     Your Mainnet Badge                                      │   ││
│  │  │                                                             │   ││
│  │  │           🥇                                                │   ││
│  │  │         GOLD                                                │   ││
│  │  │                                                             │   ││
│  │  └─────────────────────────────────────────────────────────────┘   ││
│  │                                                                     ││
│  │  What happens when you claim:                                       ││
│  │  ✓ Your tier (Gold) is encrypted using INCO Lightning             ││
│  │  ✓ Pre-computed proofs: Bronze+, Silver+, Gold+, etc.             ││
│  │  ✓ Nobody can see your exact tier - only that you qualify         ││
│  │  ✓ One-time claim, works forever on mainnet                        ││
│  │                                                                     ││
│  │  Cost: ~0.01 SOL (free from devnet faucet)                         ││
│  │                                                                     ││
│  │  [Get Devnet SOL]    [Claim Confidential Badge]                     ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Devnet Dashboard (Claimed)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DASHBOARD                                                    [Devnet]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  🟣 DEVNET MODE                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  ✅ CONFIDENTIAL BADGE CLAIMED                                      ││
│  │                                                                     ││
│  │  Your encrypted tier is stored on-chain.                           ││
│  │                                                                     ││
│  │  Claim TX: abc123...xyz   [View on Solscan ↗]                      ││
│  │                                                                     ││
│  │  ──────────────────────────────────────────────────────────────    ││
│  │                                                                     ││
│  │  [View Badge Account]    [Switch to Mainnet →]                      ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Claim Flow Modal

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                    [X]  │
│                                                                         │
│                     CLAIM CONFIDENTIAL BADGE                            │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  STEP 1 OF 3: Encrypting your tier...                                   │
│                                                                         │
│  ████████████████████████░░░░░░░░░░░░░░░░░░░░░  60%                     │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  ✅ Connecting to INCO Lightning...                                 ││
│  │  ✅ Encrypting tier value...                                        ││
│  │  ⏳ Computing Bronze+ proof...                                      ││
│  │  ○  Computing Silver+ proof...                                      ││
│  │  ○  Computing Gold+ proof...                                        ││
│  │  ○  Computing Diamond+ proof...                                     ││
│  │  ○  Computing Legendary proof...                                    ││
│  │  ○  Storing on-chain...                                             ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  Please confirm the transaction in your wallet.                         │
│                                                                         │
│                         [Cancel]                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Success Modal

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                    [X]  │
│                                                                         │
│                              🎉                                         │
│                                                                         │
│                  CONFIDENTIAL BADGE CLAIMED!                            │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Your badge tier is now encrypted on Solana Devnet.                    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Transaction: abc123...xyz789                                       ││
│  │                                                                     ││
│  │  [View on Solscan ↗]                                                ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  What's next?                                                           │
│  1. Switch back to Mainnet                                              │
│  2. Channels will be unlocked!                                          │
│  3. Join any tier-gated channel with just a signature                   │
│                                                                         │
│            [Switch to Mainnet]    [View Badge Account]                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Badge Account View (Profile Tab)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PROFILE  >  CONFIDENTIAL BADGE                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🔐 YOUR CONFIDENTIAL BADGE ACCOUNT                                     │
│                                                                         │
│  ───────────────────────────────────────────────────────────────────── │
│                                                                         │
│  ON-CHAIN DATA (Public - Anyone Can See)                                │
│  ──────────────────────────────────────                                 │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Account Address:  9xYz...4Km                [Copy] [Solscan ↗]     ││
│  │  Owner:            7xKp...3Fj                                       ││
│  │  Created:          Jan 31, 2026, 10:30 AM                           ││
│  │                                                                     ││
│  │  encrypted_tier:   a7f2c9b1d3e5f7a8b2c4...   (32 bytes - hidden)   ││
│  │  proof_bronze:     b3e1d7a2c4f6e8a1b3d5...   (32 bytes - hidden)   ││
│  │  proof_silver:     c8f4e2b5d7a9f1c3e5a7...   (32 bytes - hidden)   ││
│  │  proof_gold:       d1a5f3c7e9b2d4f6a8c1...   (32 bytes - hidden)   ││
│  │  proof_diamond:    e2b6a4d8f1c3e5a7b9d2...   (32 bytes - hidden)   ││
│  │  proof_legendary:  f3c7b5e9a2d4f6b8c1e3...   (32 bytes - hidden)   ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  ⚠️  These are HANDLES, not values! Nobody can decode your tier        │
│      from this data. The actual encrypted values live in INCO.         │
│                                                                         │
│  ───────────────────────────────────────────────────────────────────── │
│                                                                         │
│  🔓 DECRYPT YOUR DATA (Only You Can See)                                │
│  ────────────────────────────────────────                               │
│                                                                         │
│  Sign a message to decrypt your private badge data.                     │
│  This proves ownership without any on-chain transaction.                │
│                                                                         │
│                    [Sign to Reveal My Data]                             │
│                                                                         │
│  ───────────────────────────────────────────────────────────────────── │
│                                                                         │
│  AFTER SIGNING:                                                         │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  Your Tier:     🥇 GOLD (3)                                         ││
│  │                                                                     ││
│  │  Proofs:                                                            ││
│  │  ├─ Bronze+:    ✅ true   (you can join Bronze channels)           ││
│  │  ├─ Silver+:    ✅ true   (you can join Silver channels)           ││
│  │  ├─ Gold+:      ✅ true   (you can join Gold channels)             ││
│  │  ├─ Diamond+:   ❌ false  (need Diamond+ badge)                     ││
│  │  └─ Legendary:  ❌ false  (need Legendary badge)                    ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  ───────────────────────────────────────────────────────────────────── │
│                                                                         │
│  ACTIONS                                                                │
│                                                                         │
│  [Transfer Badge]    [Join Channels]                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Channels Page

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🐋 PRIVATE WHALE CHANNELS                                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Join exclusive tier-gated channels. Prove your tier with a signature  │
│  - no transaction needed, completely free!                              │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  🥉 BRONZE LOUNGE                                                   ││
│  │  ────────────────────                                               ││
│  │  Minimum: Bronze+                                                   ││
│  │  Members: 1,247 whales                                              ││
│  │  Topics: General discussion, market chat, beginner tips             ││
│  │                                                                     ││
│  │  Your Status: ✅ Eligible                   [Join Channel]          ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  🥈 SILVER CIRCLE                                                   ││
│  │  ─────────────────────                                              ││
│  │  Minimum: Silver+                                                   ││
│  │  Members: 832 whales                                                ││
│  │  Topics: Trading strategies, alpha calls, portfolio reviews         ││
│  │                                                                     ││
│  │  Your Status: ✅ Eligible                   [Join Channel]          ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  🥇 GOLD VAULT                                                      ││
│  │  ────────────────                                                   ││
│  │  Minimum: Gold+                                                     ││
│  │  Members: 456 whales                                                ││
│  │  Topics: High-conviction plays, whale movements, exclusive alpha    ││
│  │                                                                     ││
│  │  Your Status: ✅ Eligible                   [Join Channel]          ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  💎 DIAMOND DEN                                                     ││
│  │  ───────────────                                                    ││
│  │  Minimum: Diamond+                                                  ││
│  │  Members: 127 whales                                                ││
│  │  Topics: OTC deals, institutional moves, private opportunities      ││
│  │                                                                     ││
│  │  Your Status: 🔒 Need Diamond+              [Upgrade Badge]         ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  👑 LEGENDARY COUNCIL                                               ││
│  │  ────────────────────                                               ││
│  │  Minimum: Legendary                                                 ││
│  │  Members: 23 whales                                                 ││
│  │  Topics: Protocol governance, VC deals, market making               ││
│  │                                                                     ││
│  │  Your Status: 🔒 Need Legendary             [Upgrade Badge]         ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Join Channel Modal

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                    [X]  │
│                                                                         │
│                        JOIN GOLD VAULT                                  │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  To join this channel, we need to verify you're Gold+.                 │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  How it works:                                                      ││
│  │                                                                     ││
│  │  1. You sign a message (FREE - no gas!)                             ││
│  │  2. We decrypt your "Gold+" proof using INCO                        ││
│  │  3. If true → You get access with anonymous ID                      ││
│  │                                                                     ││
│  │  ⚠️  We only learn if you're Gold+ (true/false)                     ││
│  │      We never see your exact tier!                                  ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│                    [Sign to Verify & Join]                              │
│                                                                         │
│                         [Cancel]                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Join Success Modal

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                    [X]  │
│                                                                         │
│                              🎉                                         │
│                                                                         │
│                   WELCOME TO GOLD VAULT!                                │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  You've been verified as Gold+ and joined the channel!                 │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  Your Anonymous ID:  Whale#7F3A                                     ││
│  │                                                                     ││
│  │  This ID is shown to other members.                                 ││
│  │  Nobody can link it to your wallet!                                 ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│                      [Enter Gold Vault →]                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. ACCOUNT STRUCTURE

### What's Stored On-Chain (Devnet)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  CONFIDENTIAL WHALE BADGE ACCOUNT (PDA)                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  VISIBLE ON SOLSCAN (Anyone Can See):                                   │
│  ─────────────────────────────────────                                  │
│                                                                         │
│  ┌─────────────────────┬────────────────────────────────────────────┐  │
│  │ Field               │ Value                                      │  │
│  ├─────────────────────┼────────────────────────────────────────────┤  │
│  │ owner               │ 7xKp...3Fj (wallet address)                │  │
│  │ bump                │ 254                                        │  │
│  │ created_at          │ 1738300800                                 │  │
│  │ is_active           │ true                                       │  │
│  │ encrypted_tier      │ a7f2c9b1d3e5... (32 bytes - HANDLE)       │  │
│  │ proof_bronze        │ b3e1d7a2c4f6... (32 bytes - HANDLE)       │  │
│  │ proof_silver        │ c8f4e2b5d7a9... (32 bytes - HANDLE)       │  │
│  │ proof_gold          │ d1a5f3c7e9b2... (32 bytes - HANDLE)       │  │
│  │ proof_diamond       │ e2b6a4d8f1c3... (32 bytes - HANDLE)       │  │
│  │ proof_legendary     │ f3c7b5e9a2d4... (32 bytes - HANDLE)       │  │
│  └─────────────────────┴────────────────────────────────────────────┘  │
│                                                                         │
│  ⚠️  HANDLES are just pointers to encrypted data in INCO network.      │
│      Nobody can reverse-engineer the actual values from handles!        │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  HIDDEN IN INCO (Only Owner Can Decrypt):                               │
│  ─────────────────────────────────────────                              │
│                                                                         │
│  ┌─────────────────────┬──────────────────────────────────────┐        │
│  │ Handle              │ Actual Value (Encrypted)             │        │
│  ├─────────────────────┼──────────────────────────────────────┤        │
│  │ encrypted_tier      │ 3 (Gold)                             │        │
│  │ proof_bronze        │ true (tier >= 1)                     │        │
│  │ proof_silver        │ true (tier >= 2)                     │        │
│  │ proof_gold          │ true (tier >= 3)                     │        │
│  │ proof_diamond       │ false (tier >= 4)                    │        │
│  │ proof_legendary     │ false (tier >= 5)                    │        │
│  └─────────────────────┴──────────────────────────────────────┘        │
│                                                                         │
│  ✅ OWNER signs message → INCO decrypts → Returns actual value         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### What's Stored in MongoDB (Backend)

```typescript
// New model: ConfidentialBadge

interface IConfidentialBadge {
  // Link to main user
  userId: ObjectId;
  wallet: string;

  // On-chain reference
  network: 'devnet';
  badgeAccountAddress: string;  // PDA address on devnet
  claimTxSignature: string;     // TX that created the badge

  // Handles (copied from on-chain for quick access)
  encryptedTierHandle: string;
  proofHandles: {
    bronze: string;
    silver: string;
    gold: string;
    diamond: string;
    legendary: string;
  };

  // Status
  isActive: boolean;

  // Timestamps
  claimedAt: Date;
  lastVerifiedAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 6. FRONTEND COMPONENTS

### New Components to Build

```
src/components/
├── confidential-badge/
│   ├── ClaimBadgeBanner.tsx       # Banner shown on mainnet dashboard
│   ├── ClaimBadgeModal.tsx        # Claim flow modal with progress
│   ├── ClaimSuccessModal.tsx      # Success after claiming
│   ├── BadgeAccountView.tsx       # View encrypted account data
│   ├── DecryptDataButton.tsx      # Sign to reveal data
│   ├── DecryptedDataDisplay.tsx   # Show decrypted tier & proofs
│   ├── NetworkSwitchPrompt.tsx    # Prompt to switch network
│   └── TransferBadgeModal.tsx     # Transfer badge to another wallet
│
├── channels/
│   ├── ChannelList.tsx            # List of tier-gated channels
│   ├── ChannelCard.tsx            # Individual channel card
│   ├── JoinChannelModal.tsx       # Verify & join modal
│   ├── JoinSuccessModal.tsx       # Welcome modal with anon ID
│   ├── ChannelChat.tsx            # Chat interface (if we build it)
│   └── AnonIdBadge.tsx            # Display anonymous ID
│
├── layout/
│   └── Sidebar.tsx                # UPDATE: Add Channels link + disabled states
│
└── ui/
    └── NetworkBadge.tsx           # Show current network (mainnet/devnet)
```

### New Pages to Build

```
src/app/
├── (dashboard)/
│   ├── channels/
│   │   └── page.tsx               # Channels list page
│   ├── channels/[channelId]/
│   │   └── page.tsx               # Individual channel (chat)
│   └── profile/
│       └── page.tsx               # UPDATE: Add Confidential Badge tab
│
└── api/
    ├── confidential-badge/
    │   ├── route.ts               # GET: check claim status
    │   ├── claim/route.ts         # POST: initiate claim
    │   └── verify/route.ts        # POST: verify for channel
    │
    └── channels/
        ├── route.ts               # GET: list channels
        ├── [channelId]/route.ts   # GET: channel details
        └── join/route.ts          # POST: join channel
```

### New Hooks to Build

```
src/hooks/
├── useConfidentialBadge.ts        # Claim, verify, transfer badge
├── useNetwork.ts                  # UPDATE: Add devnet detection
├── useChannels.ts                 # List & join channels
└── useIncoDecrypt.ts              # Decrypt INCO handles
```

---

## 7. API ENDPOINTS

### Confidential Badge APIs

```typescript
// GET /api/confidential-badge?wallet=xxx
// Check if user has claimed confidential badge
Response: {
  hasClaimed: boolean;
  badge?: {
    accountAddress: string;
    claimTxSignature: string;
    claimedAt: string;
    isActive: boolean;
  }
}

// POST /api/confidential-badge/claim
// Record badge claim in database
Body: {
  wallet: string;
  txSignature: string;
  accountAddress: string;
  proofHandles: {
    bronze: string;
    silver: string;
    gold: string;
    diamond: string;
    legendary: string;
  };
}
Response: {
  success: boolean;
  badge: IConfidentialBadge;
}

// POST /api/confidential-badge/verify
// Verify user for channel access
Body: {
  wallet: string;
  channelTier: 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary';
  signature: string;  // Signed message for INCO decrypt
}
Response: {
  verified: boolean;
  anonId?: string;  // Generated anonymous ID
}
```

### Channel APIs

```typescript
// GET /api/channels
// List all channels
Response: {
  channels: [
    {
      id: string;
      name: string;
      tier: 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary';
      memberCount: number;
      description: string;
    }
  ]
}

// GET /api/channels/[channelId]
// Get channel details
Response: {
  channel: {
    id: string;
    name: string;
    tier: string;
    memberCount: number;
    description: string;
    topics: string[];
  };
  userAccess: {
    hasAccess: boolean;
    anonId?: string;
    joinedAt?: string;
  }
}

// POST /api/channels/join
// Join a channel
Body: {
  wallet: string;
  channelId: string;
  signature: string;
}
Response: {
  success: boolean;
  anonId: string;
  channelId: string;
}
```

---

## 8. DATABASE MODELS

### ConfidentialBadge Model

```typescript
// src/lib/database/models/ConfidentialBadge.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IConfidentialBadge extends Document {
  userId: mongoose.Types.ObjectId;
  wallet: string;

  // On-chain
  network: 'devnet';
  badgeAccountAddress: string;
  claimTxSignature: string;

  // INCO handles
  encryptedTierHandle: string;
  proofHandles: {
    bronze: string;
    silver: string;
    gold: string;
    diamond: string;
    legendary: string;
  };

  // Status
  isActive: boolean;

  // Timestamps
  claimedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConfidentialBadgeSchema = new Schema<IConfidentialBadge>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    wallet: { type: String, required: true, unique: true, index: true },

    network: { type: String, default: 'devnet' },
    badgeAccountAddress: { type: String, required: true, unique: true },
    claimTxSignature: { type: String, required: true },

    encryptedTierHandle: { type: String, required: true },
    proofHandles: {
      bronze: { type: String, required: true },
      silver: { type: String, required: true },
      gold: { type: String, required: true },
      diamond: { type: String, required: true },
      legendary: { type: String, required: true },
    },

    isActive: { type: Boolean, default: true },
    claimedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.ConfidentialBadge ||
  mongoose.model<IConfidentialBadge>('ConfidentialBadge', ConfidentialBadgeSchema);
```

### Channel Model

```typescript
// src/lib/database/models/Channel.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IChannel extends Document {
  name: string;
  slug: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary';
  topics: string[];
  memberCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChannelSchema = new Schema<IChannel>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'diamond', 'legendary'],
      required: true
    },
    topics: [{ type: String }],
    memberCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Channel ||
  mongoose.model<IChannel>('Channel', ChannelSchema);
```

### ChannelMembership Model

```typescript
// src/lib/database/models/ChannelMembership.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IChannelMembership extends Document {
  userId: mongoose.Types.ObjectId;
  wallet: string;
  channelId: mongoose.Types.ObjectId;
  anonId: string;  // e.g., "Whale#7F3A"
  verifiedAt: Date;
  joinedAt: Date;
  isActive: boolean;
}

const ChannelMembershipSchema = new Schema<IChannelMembership>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    wallet: { type: String, required: true },
    channelId: { type: Schema.Types.ObjectId, ref: 'Channel', required: true },
    anonId: { type: String, required: true },
    verifiedAt: { type: Date, required: true },
    joinedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Compound index: one membership per user per channel
ChannelMembershipSchema.index({ userId: 1, channelId: 1 }, { unique: true });
ChannelMembershipSchema.index({ channelId: 1, isActive: 1 });

export default mongoose.models.ChannelMembership ||
  mongoose.model<IChannelMembership>('ChannelMembership', ChannelMembershipSchema);
```

---

## 9. DEVELOPMENT CHECKLIST

### Phase 1: Smart Contract (Anchor + INCO)
- [ ] Set up Anchor project for devnet
- [ ] Add `inco-lightning` dependency
- [ ] Implement `claim_badge` instruction
- [ ] Implement `upgrade_tier` instruction
- [ ] Implement `transfer_badge` instruction
- [ ] Write unit tests
- [ ] Deploy to devnet
- [ ] Get program ID
- [ ] Verify on Solscan

### Phase 2: Frontend - Core
- [ ] Add network detection hook (`useNetwork`)
- [ ] Update Sidebar with network-aware states
- [ ] Add Channels link (disabled on mainnet if not claimed)
- [ ] Create NetworkBadge component

### Phase 3: Frontend - Claim Flow
- [ ] Create ClaimBadgeBanner component
- [ ] Create ClaimBadgeModal with progress
- [ ] Create ClaimSuccessModal
- [ ] Implement claim transaction logic
- [ ] Add devnet faucet link
- [ ] Store claim in MongoDB
- [ ] Test full claim flow

### Phase 4: Frontend - Badge Account View
- [ ] Create BadgeAccountView component
- [ ] Create DecryptDataButton
- [ ] Implement INCO decrypt via @inco/solana-sdk
- [ ] Create DecryptedDataDisplay
- [ ] Add to Profile page as new tab

### Phase 5: Frontend - Channels
- [ ] Create Channels page
- [ ] Create ChannelList component
- [ ] Create ChannelCard component
- [ ] Create JoinChannelModal
- [ ] Implement verification flow
- [ ] Generate anonymous IDs
- [ ] Create JoinSuccessModal

### Phase 6: Backend - APIs
- [ ] Create ConfidentialBadge model
- [ ] Create Channel model
- [ ] Create ChannelMembership model
- [ ] Implement /api/confidential-badge endpoints
- [ ] Implement /api/channels endpoints
- [ ] Seed initial channels

### Phase 7: Testing & Polish
- [ ] Test full flow: buy badge → claim → join channel
- [ ] Test network switching
- [ ] Test error states
- [ ] Add loading states
- [ ] Mobile responsive
- [ ] Animations

### Phase 8: Demo & Proof
- [ ] Record demo video
- [ ] Get Solscan links for:
  - [ ] Program deployment
  - [ ] Sample claim TX showing INCO CPI
  - [ ] Badge account with encrypted data
- [ ] Screenshots of UI
- [ ] Write submission description

---

## 10. HACKATHON PROOF

### What Judges Will See

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         HACKATHON PROOF                                  │
└─────────────────────────────────────────────────────────────────────────┘

1. SOLSCAN: PROGRAM DEPLOYMENT
   ─────────────────────────────
   https://solscan.io/account/CWBxxx...xxx?cluster=devnet

   Shows: Our program deployed to devnet


2. SOLSCAN: CLAIM TRANSACTION
   ────────────────────────────
   https://solscan.io/tx/abc123...xyz?cluster=devnet

   Shows:
   ├─ Our program: CWBxxx...xxx
   ├─ INCO program: 5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj
   │
   └─ Instructions:
      ├─ claim_badge
      ├─ CPI → inco_lightning::new_euint128 (encrypt tier)
      ├─ CPI → inco_lightning::e_ge (compute Bronze+ proof)
      ├─ CPI → inco_lightning::e_ge (compute Silver+ proof)
      ├─ CPI → inco_lightning::e_ge (compute Gold+ proof)
      ├─ CPI → inco_lightning::e_ge (compute Diamond+ proof)
      ├─ CPI → inco_lightning::e_ge (compute Legendary proof)
      └─ CPI → inco_lightning::allow (grant decrypt access)


3. SOLSCAN: BADGE ACCOUNT
   ────────────────────────
   https://solscan.io/account/9xYz...4Km?cluster=devnet

   Shows:
   ├─ owner: 7xKp...3Fj
   ├─ encrypted_tier: a7f2c9b1... (handle, not value!)
   ├─ proof_bronze: b3e1d7a2...
   ├─ proof_silver: c8f4e2b5...
   ├─ proof_gold: d1a5f3c7...
   ├─ proof_diamond: e2b6a4d8...
   └─ proof_legendary: f3c7b5e9...


4. LIVE DEMO
   ──────────
   https://whale-suite.com

   Shows:
   ├─ Claim confidential badge flow
   ├─ View encrypted account data
   ├─ "Sign to Decrypt" revealing tier only to owner
   ├─ Join tier-gated channels
   └─ Anonymous whale IDs in channel


5. GITHUB
   ───────
   https://github.com/xxx/whale-suite

   Shows:
   ├─ Anchor program source code
   ├─ INCO integration code
   ├─ Frontend components
   └─ Full documentation
```

### Submission Summary

```
INCO Lightning Integration Submission
─────────────────────────────────────

Project: Whale Trading Suite - Confidential Whale Badge
Bounty: INCO Lightning SDK ($XXk)

What We Built:
• Encrypted badge tier storage using INCO
• Pre-computed ZK proofs (Gold+, Silver+, etc.)
• Tier-gated whale channels with anonymous access
• "Only you can see" decrypt demonstration

INCO Functions Used:
• new_euint128() - Encrypt tier value
• e_ge() - Compute tier threshold proofs
• allow() - Grant decrypt permission
• decrypt() - Reveal proof (sign only)

Proof Links:
• Program: [Solscan link]
• Sample TX: [Solscan link showing INCO CPI]
• Badge Account: [Solscan link showing encrypted handles]

Innovation:
Since SPL Confidential Token is disabled, we built our own
confidential badge system using INCO Lightning, demonstrating
real-world utility for encrypted on-chain data.
```

---

## QUICK REFERENCE

### INCO Lightning Program ID
```
5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj
```

### Badge Tier Values
```
1 = Bronze
2 = Silver
3 = Gold
4 = Diamond
5 = Legendary
```

### Network URLs
```
Devnet RPC: https://api.devnet.solana.com
Devnet Faucet: https://faucet.solana.com
Solscan (Devnet): https://solscan.io/?cluster=devnet
```

### Dependencies
```toml
# Rust (Cargo.toml)
anchor-lang = "0.29.0"
inco-lightning = "0.1.4"
```

```json
// JavaScript (package.json)
"@inco/solana-sdk": "^0.1.0"
"@solana/web3.js": "^1.87.0"
```

---

## NOTES

- **Devnet Only**: All INCO operations happen on Solana Devnet
- **Mainnet Badge**: User must have badge NFT on mainnet first
- **One-Time Claim**: User claims once, never needs devnet again
- **Free Verification**: Channel joins are just signatures, no TX
- **Privacy**: Nobody can see exact tier, only boolean proofs
- **Transferable**: Badge can be transferred to another wallet

---

*Last Updated: January 31, 2026*
*Version: 1.0.0*
