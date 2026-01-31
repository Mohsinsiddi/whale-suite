use anchor_lang::prelude::*;

/// INCO Lightning Program ID on Devnet
pub const INCO_PROGRAM_ID: Pubkey = pubkey!("5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj");

/// Badge tier values
pub const TIER_NONE: u8 = 0;
pub const TIER_BRONZE: u8 = 1;
pub const TIER_SILVER: u8 = 2;
pub const TIER_GOLD: u8 = 3;
pub const TIER_DIAMOND: u8 = 4;
pub const TIER_LEGENDARY: u8 = 5;

/// Minimum and maximum valid tier
pub const MIN_TIER: u8 = TIER_BRONZE;
pub const MAX_TIER: u8 = TIER_LEGENDARY;

/// PDA Seeds
pub const CONFIG_SEED: &[u8] = b"config";
pub const BADGE_SEED: &[u8] = b"badge";
pub const PAYMENT_SEED: &[u8] = b"payment";
pub const ESCROW_SEED: &[u8] = b"escrow";

/// Default payment expiry (7 days in seconds)
pub const DEFAULT_PAYMENT_EXPIRY: i64 = 7 * 24 * 60 * 60;

/// Account sizes (for rent calculation)
pub const CONFIG_SIZE: usize = 8 + // discriminator
    32 + // admin
    32 + // treasury
    8 +  // total_badges
    1 +  // is_initialized
    1;   // bump

pub const BADGE_SIZE: usize = 8 +   // discriminator
    1 +     // bump
    32 +    // owner
    16 +    // encrypted_tier handle (u128)
    16 +    // proof_bronze handle (u128)
    16 +    // proof_silver handle (u128)
    16 +    // proof_gold handle (u128)
    16 +    // proof_diamond handle (u128)
    16 +    // proof_legendary handle (u128)
    8 +     // created_at
    8 +     // updated_at
    1 +     // is_active
    64;     // padding for future use
