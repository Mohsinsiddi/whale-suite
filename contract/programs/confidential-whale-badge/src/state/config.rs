use anchor_lang::prelude::*;

/// Global configuration account for the program
#[account]
#[derive(Default)]
pub struct Config {
    /// Admin who can manage the program
    pub admin: Pubkey,

    /// Treasury wallet to receive payments
    pub treasury: Pubkey,

    /// Total number of badges claimed
    pub total_badges: u64,

    /// Whether config is initialized
    pub is_initialized: bool,

    /// PDA bump seed
    pub bump: u8,

    // ============================================
    // Tier Prices (in lamports) - Admin Configurable
    // ============================================
    /// Price for Bronze tier (default: 0.1 SOL = 100_000_000 lamports)
    pub price_bronze: u64,

    /// Price for Silver tier (default: 0.2 SOL)
    pub price_silver: u64,

    /// Price for Gold tier (default: 0.3 SOL)
    pub price_gold: u64,

    /// Price for Diamond tier (default: 0.4 SOL)
    pub price_diamond: u64,

    /// Price for Legendary tier (default: 0.5 SOL)
    pub price_legendary: u64,
}

impl Config {
    pub const SIZE: usize = 8 +  // discriminator
        32 +    // admin
        32 +    // treasury
        8 +     // total_badges
        1 +     // is_initialized
        1 +     // bump
        8 +     // price_bronze
        8 +     // price_silver
        8 +     // price_gold
        8 +     // price_diamond
        8;      // price_legendary

    /// Default prices in lamports
    pub const DEFAULT_PRICE_BRONZE: u64 = 100_000_000;      // 0.1 SOL
    pub const DEFAULT_PRICE_SILVER: u64 = 200_000_000;      // 0.2 SOL
    pub const DEFAULT_PRICE_GOLD: u64 = 300_000_000;        // 0.3 SOL
    pub const DEFAULT_PRICE_DIAMOND: u64 = 400_000_000;     // 0.4 SOL
    pub const DEFAULT_PRICE_LEGENDARY: u64 = 500_000_000;   // 0.5 SOL

    /// Get price for a tier (1-5)
    pub fn get_tier_price(&self, tier: u8) -> u64 {
        match tier {
            1 => self.price_bronze,
            2 => self.price_silver,
            3 => self.price_gold,
            4 => self.price_diamond,
            5 => self.price_legendary,
            _ => u64::MAX, // Invalid tier = max price (will fail)
        }
    }

    /// Determine tier based on payment amount
    pub fn get_tier_for_payment(&self, amount: u64) -> u8 {
        if amount >= self.price_legendary {
            5 // Legendary
        } else if amount >= self.price_diamond {
            4 // Diamond
        } else if amount >= self.price_gold {
            3 // Gold
        } else if amount >= self.price_silver {
            2 // Silver
        } else if amount >= self.price_bronze {
            1 // Bronze
        } else {
            0 // Insufficient payment
        }
    }
}
