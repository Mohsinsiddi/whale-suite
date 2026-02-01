use anchor_lang::prelude::*;

/// Confidential Whale Badge Account
///
/// PRIVACY-FIRST DESIGN:
/// - NO plain text tier stored (was leaking privacy!)
/// - NO amount_paid stored (reveals tier via price)
/// - ONLY encrypted INCO handles stored
/// - Tier can only be verified via INCO proof decryption
#[account]
pub struct ConfidentialBadge {
    /// PDA bump seed
    pub bump: u8,

    /// Current owner of the badge
    pub owner: Pubkey,

    // ============================================
    // INCO ENCRYPTED DATA (handles, not values!)
    // These are u128 handles pointing to encrypted
    // data in the INCO network. Nobody can decode
    // the actual values from these handles.
    //
    // PRIVACY: The tier is ONLY stored encrypted!
    // To verify access, decrypt the relevant proof.
    // ============================================

    /// Encrypted tier value (1-5)
    /// INCO Euint128 handle - ONLY way to know tier
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
    // METADATA (non-sensitive)
    // ============================================

    /// When the badge was first claimed
    pub created_at: i64,

    /// Last update timestamp
    pub updated_at: i64,

    /// Whether the badge is currently active
    pub is_active: bool,
}

impl ConfidentialBadge {
    // Size calculation (removed tier: u8 and amount_paid: u64)
    pub const SIZE: usize = 8 +     // discriminator
        1 +         // bump
        32 +        // owner (Pubkey)
        // REMOVED: tier (u8) - privacy leak!
        // REMOVED: amount_paid (u64) - privacy leak!
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
