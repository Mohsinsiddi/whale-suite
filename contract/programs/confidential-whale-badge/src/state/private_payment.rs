use anchor_lang::prelude::*;

/// Fully Private Payment Account
/// ALL sensitive data is encrypted using INCO Lightning
/// Nobody can see sender, recipient, or amount on-chain
#[account]
pub struct PrivatePayment {
    /// PDA bump seed
    pub bump: u8,

    /// Unique payment identifier (32 bytes) - public
    pub payment_id: [u8; 32],

    // ============================================
    // INCO ENCRYPTED DATA (ALL HIDDEN!)
    // These are u128 handles - nobody can decode them
    // ============================================

    /// Encrypted hash of SENDER's address
    /// Created by sender: encrypt(hash(sender_pubkey)[0:16])
    /// Even the sender identity is hidden!
    pub encrypted_sender: u128,

    /// Encrypted hash of RECIPIENT's address
    /// Created by sender: encrypt(hash(recipient_pubkey)[0:16])
    /// Nobody knows who the payment is for
    pub encrypted_recipient: u128,

    /// Encrypted payment AMOUNT (in lamports)
    /// Created by sender: encrypt(amount)
    /// The actual amount is hidden!
    pub encrypted_amount: u128,

    // ============================================
    // CLAIM STATE (minimal public info)
    // ============================================

    /// Proof handle from e_eq comparison (Ebool)
    /// Set when someone attempts to claim
    /// Decrypts to TRUE only for real recipient
    pub claim_proof: u128,

    /// Encrypted claimer hash (also hidden!)
    /// We don't store the actual claimer address
    pub encrypted_claimer: u128,

    /// Whether a claim has been initiated
    pub claim_initiated: bool,

    // ============================================
    // TIMESTAMPS & STATUS
    // ============================================

    /// When the payment was created
    pub created_at: i64,

    /// Expiry timestamp (sender can cancel after this)
    pub expires_at: i64,

    /// When the payment was claimed (0 if not claimed)
    pub claimed_at: i64,

    /// Payment status
    pub status: PaymentStatus,

    /// Escrow bump for PDA signing
    pub escrow_bump: u8,
}

impl PrivatePayment {
    pub const SIZE: usize = 8 +     // discriminator
        1 +         // bump
        32 +        // payment_id
        16 +        // encrypted_sender (u128)
        16 +        // encrypted_recipient (u128)
        16 +        // encrypted_amount (u128)
        16 +        // claim_proof (u128)
        16 +        // encrypted_claimer (u128)
        1 +         // claim_initiated (bool)
        8 +         // created_at (i64)
        8 +         // expires_at (i64)
        8 +         // claimed_at (i64)
        1 +         // status (enum)
        1 +         // escrow_bump
        32;         // padding for future use

    /// Check if payment can be claimed
    pub fn can_claim(&self) -> bool {
        self.status == PaymentStatus::Active
    }

    /// Check if payment can be cancelled (by sender proving ownership)
    pub fn can_cancel(&self, current_time: i64) -> bool {
        self.status == PaymentStatus::Active &&
        (current_time >= self.expires_at || !self.claim_initiated)
    }

    /// Check if payment can be finalized
    pub fn can_finalize(&self) -> bool {
        self.status == PaymentStatus::Pending && self.claim_initiated
    }
}

/// Payment status enum
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, Default)]
pub enum PaymentStatus {
    #[default]
    Active,     // Waiting for claim
    Pending,    // Claim initiated, awaiting finalization
    Claimed,    // Successfully claimed
    Cancelled,  // Cancelled by sender
    Expired,    // Expired without claim
}

impl PaymentStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            PaymentStatus::Active => "Active",
            PaymentStatus::Pending => "Pending",
            PaymentStatus::Claimed => "Claimed",
            PaymentStatus::Cancelled => "Cancelled",
            PaymentStatus::Expired => "Expired",
        }
    }
}
