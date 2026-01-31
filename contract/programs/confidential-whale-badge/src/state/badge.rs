use anchor_lang::prelude::*;

/// Confidential Whale Badge Account
/// Stores encrypted tier and pre-computed proofs using INCO Lightning
#[account]
pub struct ConfidentialBadge {
    /// PDA bump seed
    pub bump: u8,

    /// Current owner of the badge
    pub owner: Pubkey,

    /// Tier level (1-5) - stored for reference
    /// The actual tier is hidden via encrypted proofs
    pub tier: u8,

    /// Amount paid for this badge (in lamports)
    pub amount_paid: u64,

    // ============================================
    // INCO ENCRYPTED DATA (handles, not values!)
    // These are u128 handles pointing to encrypted
    // data in the INCO network. Nobody can decode
    // the actual values from these handles.
    // ============================================

    /// Encrypted tier value (1-5)
    /// INCO Euint128 handle
    pub encrypted_tier: u128,

    /// Pre-computed proof: is tier >= 1 (Bronze+)?
    /// INCO Ebool handle - decrypts to true/false
    pub proof_bronze: u128,

    /// Pre-computed proof: is tier >= 2 (Silver+)?
    pub proof_silver: u128,

    /// Pre-computed proof: is tier >= 3 (Gold+)?
    pub proof_gold: u128,

    /// Pre-computed proof: is tier >= 4 (Diamond+)?
    pub proof_diamond: u128,

    /// Pre-computed proof: is tier >= 5 (Legendary)?
    pub proof_legendary: u128,

    // ============================================
    // METADATA
    // ============================================

    /// When the badge was first claimed
    pub created_at: i64,

    /// Last update timestamp
    pub updated_at: i64,

    /// Whether the badge is currently active
    pub is_active: bool,
}

impl ConfidentialBadge {
    pub const SIZE: usize = 8 +     // discriminator
        1 +         // bump
        32 +        // owner (Pubkey)
        1 +         // tier (u8)
        8 +         // amount_paid (u64)
        16 +        // encrypted_tier (u128)
        16 +        // proof_bronze (u128)
        16 +        // proof_silver (u128)
        16 +        // proof_gold (u128)
        16 +        // proof_diamond (u128)
        16 +        // proof_legendary (u128)
        8 +         // created_at (i64)
        8 +         // updated_at (i64)
        1 +         // is_active (bool)
        64;         // padding for future use

    /// Check if badge is valid and active
    pub fn is_valid(&self) -> bool {
        self.is_active && self.owner != Pubkey::default()
    }
}

/// Badge tier enum for type safety
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum BadgeTier {
    None = 0,
    Bronze = 1,
    Silver = 2,
    Gold = 3,
    Diamond = 4,
    Legendary = 5,
}

impl BadgeTier {
    pub fn from_u8(value: u8) -> Option<Self> {
        match value {
            0 => Some(BadgeTier::None),
            1 => Some(BadgeTier::Bronze),
            2 => Some(BadgeTier::Silver),
            3 => Some(BadgeTier::Gold),
            4 => Some(BadgeTier::Diamond),
            5 => Some(BadgeTier::Legendary),
            _ => None,
        }
    }

    pub fn to_u8(self) -> u8 {
        self as u8
    }

    pub fn name(&self) -> &'static str {
        match self {
            BadgeTier::None => "None",
            BadgeTier::Bronze => "Bronze",
            BadgeTier::Silver => "Silver",
            BadgeTier::Gold => "Gold",
            BadgeTier::Diamond => "Diamond",
            BadgeTier::Legendary => "Legendary",
        }
    }
}
