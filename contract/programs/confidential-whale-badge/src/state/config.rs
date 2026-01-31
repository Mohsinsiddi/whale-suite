use anchor_lang::prelude::*;

/// Global configuration account for the program
#[account]
#[derive(Default)]
pub struct Config {
    /// Admin who can manage the program
    pub admin: Pubkey,

    /// Treasury wallet for any fees (future use)
    pub treasury: Pubkey,

    /// Total number of badges claimed
    pub total_badges: u64,

    /// Whether config is initialized
    pub is_initialized: bool,

    /// PDA bump seed
    pub bump: u8,
}

impl Config {
    pub const SIZE: usize = 8 +  // discriminator
        32 +    // admin
        32 +    // treasury
        8 +     // total_badges
        1 +     // is_initialized
        1;      // bump
}
