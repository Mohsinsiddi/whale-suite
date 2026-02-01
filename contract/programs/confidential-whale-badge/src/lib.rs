use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

// Re-export everything from instructions at crate root for Anchor IDL macro
pub use instructions::*;

// Program ID - generated from target/deploy/confidential_whale_badge-keypair.json
declare_id!("3aov6rjb4U8YjkjMjkA9Tbz3FMNdLTscKJVrbTAcWFxs");

#[program]
pub mod confidential_whale_badge {
    use super::*;

    /// Initialize the global config (admin only, one-time)
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::handler(ctx)
    }

    /// Claim a confidential badge - encrypts tier and pre-computes all proofs
    ///
    /// All encrypted values must be created client-side using INCO JS SDK:
    /// - badge_id: Get from config.next_badge_id (enables multi-badge)
    /// - requested_tier: The tier (1-5) the user wants to purchase
    /// - encrypted_tier_ciphertext: The user's tier (1-5) encrypted
    /// - encrypted_threshold_1-5: Constant values 1,2,3,4,5 encrypted
    ///
    /// **Multi-Badge Support:**
    /// Users can own multiple badges. Each badge has a unique badge_id.
    /// Get badge_id from config.next_badge_id before calling this.
    ///
    /// **Tier Prices (admin configurable):**
    /// - Bronze (1): 0.1 SOL
    /// - Silver (2): 0.2 SOL
    /// - Gold (3): 0.3 SOL
    /// - Diamond (4): 0.4 SOL
    /// - Legendary (5): 0.5 SOL
    pub fn claim_badge<'info>(
        ctx: Context<'_, '_, 'info, 'info, ClaimBadge<'info>>,
        badge_id: u64,
        requested_tier: u8,
        encrypted_tier_ciphertext: Vec<u8>,
        encrypted_threshold_1: Vec<u8>,
        encrypted_threshold_2: Vec<u8>,
        encrypted_threshold_3: Vec<u8>,
        encrypted_threshold_4: Vec<u8>,
        encrypted_threshold_5: Vec<u8>,
    ) -> Result<()> {
        instructions::claim_badge::handler(
            ctx,
            badge_id,
            requested_tier,
            encrypted_tier_ciphertext,
            encrypted_threshold_1,
            encrypted_threshold_2,
            encrypted_threshold_3,
            encrypted_threshold_4,
            encrypted_threshold_5,
        )
    }

    /// Upgrade tier when user buys a higher badge on mainnet
    ///
    /// User must pay the full price for the new tier.
    /// Only proofs up to the NEW PAID tier are computed.
    ///
    /// **Parameters:**
    /// - badge_id: The badge to upgrade (for PDA derivation)
    /// - new_tier: The tier to upgrade to (1-5, must be > current)
    /// - encrypted_tier_ciphertext: User's actual tier encrypted via INCO
    /// - encrypted_threshold_1-5: Constants 1,2,3,4,5 encrypted
    pub fn upgrade_tier<'info>(
        ctx: Context<'_, '_, 'info, 'info, UpgradeTier<'info>>,
        badge_id: u64,
        new_tier: u8,
        encrypted_tier_ciphertext: Vec<u8>,
        encrypted_threshold_1: Vec<u8>,
        encrypted_threshold_2: Vec<u8>,
        encrypted_threshold_3: Vec<u8>,
        encrypted_threshold_4: Vec<u8>,
        encrypted_threshold_5: Vec<u8>,
    ) -> Result<()> {
        instructions::upgrade_tier::handler(
            ctx,
            badge_id,
            new_tier,
            encrypted_tier_ciphertext,
            encrypted_threshold_1,
            encrypted_threshold_2,
            encrypted_threshold_3,
            encrypted_threshold_4,
            encrypted_threshold_5,
        )
    }

    /// Transfer badge ownership to another wallet
    ///
    /// **Parameters:**
    /// - badge_id: The badge to transfer (for PDA derivation)
    /// - new_owner: The new owner's pubkey
    pub fn transfer_badge<'info>(
        ctx: Context<'_, '_, 'info, 'info, TransferBadge<'info>>,
        badge_id: u64,
        new_owner: Pubkey,
    ) -> Result<()> {
        instructions::transfer_badge::handler(ctx, badge_id, new_owner)
    }

    /// Revoke/deactivate a badge (admin or owner)
    ///
    /// **Parameters:**
    /// - badge_id: The badge to revoke (for PDA derivation)
    pub fn revoke_badge(ctx: Context<RevokeBadge>, badge_id: u64) -> Result<()> {
        instructions::revoke_badge::handler(ctx, badge_id)
    }

    /// Close a badge account and recover rent
    ///
    /// Only the badge owner can close their badge.
    /// This permanently deletes the badge and returns rent to the owner.
    pub fn close_badge(ctx: Context<CloseBadge>) -> Result<()> {
        instructions::close_badge::handler(ctx)
    }

    /// Grant decrypt access to badge handles
    ///
    /// Call this after claim_badge to grant decrypt permission for the stored handles.
    /// Requires 12 remaining_accounts: 6 allowance PDAs + 6 user pubkeys (interleaved)
    ///
    /// **Parameters:**
    /// - badge_id: The badge to grant access to (for PDA derivation)
    ///
    /// Allowance PDA derivation: PDA([handle_bytes_le_16, user_pubkey], INCO_PROGRAM_ID)
    pub fn grant_access<'info>(
        ctx: Context<'_, '_, 'info, 'info, GrantAccess<'info>>,
        badge_id: u64,
    ) -> Result<()> {
        instructions::grant_access::handler(ctx, badge_id)
    }

    /// Update tier prices (admin only)
    ///
    /// Allows admin to configure badge prices for each tier.
    /// Prices are in lamports (1 SOL = 1_000_000_000 lamports)
    pub fn update_prices(
        ctx: Context<UpdatePrices>,
        price_bronze: Option<u64>,
        price_silver: Option<u64>,
        price_gold: Option<u64>,
        price_diamond: Option<u64>,
        price_legendary: Option<u64>,
    ) -> Result<()> {
        instructions::update_prices::handler(
            ctx,
            price_bronze,
            price_silver,
            price_gold,
            price_diamond,
            price_legendary,
        )
    }

    // ============================================
    // FULLY PRIVATE PAYMENT INSTRUCTIONS
    // ALL DATA IS ENCRYPTED: sender, recipient, amount
    // ============================================

    /// Create a FULLY PRIVATE payment
    ///
    /// **ALL DATA IS ENCRYPTED:**
    /// - Sender address: encrypt(hash(sender_pubkey)[0:16])
    /// - Recipient address: encrypt(hash(recipient_pubkey)[0:16])
    /// - Amount: encrypt(amount_in_lamports)
    ///
    /// **WHAT'S VISIBLE ON-CHAIN:**
    /// - Payment ID (random)
    /// - Status (Active/Claimed)
    /// - Timestamps
    /// - Escrow balance (needed for actual transfer)
    ///
    /// **WHAT'S HIDDEN:**
    /// - WHO sent it
    /// - WHO receives it
    /// - HOW MUCH was sent (encrypted version)
    ///
    /// **Parameters:**
    /// - payment_id: Unique 32-byte identifier
    /// - actual_amount: Amount in lamports (needed for escrow transfer)
    /// - encrypted_sender_ciphertext: Encrypted hash of sender address
    /// - encrypted_recipient_ciphertext: Encrypted hash of recipient address
    /// - encrypted_amount_ciphertext: Encrypted amount
    /// - expiry_seconds: Optional expiry time (default 7 days)
    pub fn create_private_payment<'info>(
        ctx: Context<'_, '_, 'info, 'info, CreatePrivatePayment<'info>>,
        payment_id: [u8; 32],
        actual_amount: u64,
        encrypted_sender_ciphertext: Vec<u8>,
        encrypted_recipient_ciphertext: Vec<u8>,
        encrypted_amount_ciphertext: Vec<u8>,
        expiry_seconds: Option<i64>,
    ) -> Result<()> {
        instructions::create_private_payment::handler(
            ctx,
            payment_id,
            actual_amount,
            encrypted_sender_ciphertext,
            encrypted_recipient_ciphertext,
            encrypted_amount_ciphertext,
            expiry_seconds,
        )
    }

    /// Initiate a claim on a FULLY PRIVATE payment
    ///
    /// **PRIVACY PRESERVED:**
    /// - Claimer's identity is ENCRYPTED (not stored as pubkey)
    /// - Comparison happens in encrypted space
    /// - Only TRUE recipient will get TRUE when decrypting proof
    ///
    /// **Workflow:**
    /// 1. Claimer provides their encrypted address hash
    /// 2. Contract compares: e_eq(stored_recipient, claimer_hash)
    /// 3. Result is stored as claim_proof (Ebool handle)
    /// 4. Claimer decrypts off-chain - if TRUE, call finalize_claim
    ///
    /// **Remaining Accounts (optional):**
    /// - [0] Allowance PDA for claim_proof
    /// - [1] Claimer pubkey
    pub fn claim_payment<'info>(
        ctx: Context<'_, '_, 'info, 'info, ClaimPayment<'info>>,
        encrypted_claimer_ciphertext: Vec<u8>,
    ) -> Result<()> {
        instructions::claim_payment::handler(ctx, encrypted_claimer_ciphertext)
    }

    /// Finalize a claim and release funds - FULLY PRIVATE
    ///
    /// **PRIVACY VERIFICATION:**
    /// - Claimer proves identity by providing same encrypted hash
    /// - INCO compares: stored_encrypted_claimer == provided_encrypted_claimer
    /// - Only TRUE match releases funds
    ///
    /// **NO PUBKEY VERIFICATION** - all done via encrypted comparison
    pub fn finalize_claim<'info>(
        ctx: Context<'_, '_, 'info, 'info, FinalizeClaim<'info>>,
        encrypted_claimer_ciphertext: Vec<u8>,
    ) -> Result<()> {
        instructions::finalize_claim::handler(ctx, encrypted_claimer_ciphertext)
    }

    /// Cancel a private payment - sender must PROVE ownership
    ///
    /// **PRIVACY PRESERVED:**
    /// - Sender proves identity by providing their encrypted hash
    /// - INCO compares: stored_encrypted_sender == provided_sender
    /// - Only TRUE match allows cancellation
    ///
    /// **NO PUBKEY VERIFICATION** - all done via encrypted comparison
    pub fn cancel_payment<'info>(
        ctx: Context<'_, '_, 'info, 'info, CancelPayment<'info>>,
        encrypted_sender_ciphertext: Vec<u8>,
    ) -> Result<()> {
        instructions::cancel_payment::handler(ctx, encrypted_sender_ciphertext)
    }
}
