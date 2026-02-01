use anchor_lang::prelude::*;
use anchor_lang::system_program;

use inco_lightning::{
    cpi::{self, accounts::Operation},
    program::IncoLightning,
    types::{Ebool, Euint128},
};

use crate::constants::{BADGE_SEED, CONFIG_SEED};
use crate::error::BadgeError;
use crate::state::{ConfidentialBadge, Config};

/// Claim a confidential badge with payment
///
/// PRIVACY-FIRST: The tier is NEVER stored in plain text!
/// Only encrypted INCO handles are stored on-chain.
///
/// The client must encrypt the tier value using INCO JS SDK before calling this.
///
/// **MULTI-BADGE SUPPORT:**
/// Users can claim multiple badges. Each badge gets a unique badge_id
/// auto-assigned from config.next_badge_id.
/// PDA seeds: [BADGE_SEED, user, badge_id.to_le_bytes()]
///
/// **WORKFLOW:**
/// 1. Pay SOL to claim a tier (0.1-0.5 SOL based on tier)
/// 2. Call claim_badge with payment + encrypted tier
/// 3. Call grant_access to grant decrypt permissions
///
/// **Tier Prices (admin configurable):**
/// - Bronze (1): 0.1 SOL
/// - Silver (2): 0.2 SOL
/// - Gold (3): 0.3 SOL
/// - Diamond (4): 0.4 SOL
/// - Legendary (5): 0.5 SOL
///
/// **PRIVACY NOTE:**
/// The requested_tier parameter is used ONLY for payment validation.
/// It is NOT stored on-chain. The actual tier is only known via
/// the encrypted INCO handles which require decrypt permission.
pub fn handler<'info>(
    ctx: Context<'_, '_, 'info, 'info, ClaimBadge<'info>>,
    badge_id: u64,                   // Unique badge ID (from config.next_badge_id)
    requested_tier: u8,              // Tier user wants (1-5)
    encrypted_tier_ciphertext: Vec<u8>,
    encrypted_threshold_1: Vec<u8>,  // Encrypted "1" (Bronze threshold)
    encrypted_threshold_2: Vec<u8>,  // Encrypted "2" (Silver threshold)
    encrypted_threshold_3: Vec<u8>,  // Encrypted "3" (Gold threshold)
    encrypted_threshold_4: Vec<u8>,  // Encrypted "4" (Diamond threshold)
    encrypted_threshold_5: Vec<u8>,  // Encrypted "5" (Legendary threshold)
) -> Result<()> {
    let badge = &mut ctx.accounts.badge;
    let config = &mut ctx.accounts.config;
    let user = &ctx.accounts.user;
    let treasury = &ctx.accounts.treasury;
    let inco = ctx.accounts.inco_lightning_program.to_account_info();

    // Get current timestamp
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    // ============================================
    // STEP 0: Validate tier and process payment
    // ============================================
    require!(requested_tier >= 1 && requested_tier <= 5, BadgeError::InvalidTier);

    let required_price = config.get_tier_price(requested_tier);
    // PRIVACY: Don't log the tier - only log payment amount
    msg!("Processing badge claim. Price: {} lamports", required_price);

    // Transfer SOL from user to treasury
    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
            from: user.to_account_info(),
            to: treasury.to_account_info(),
        },
    );
    system_program::transfer(cpi_context, required_price)?;
    msg!("Payment sent to treasury");

    // PRIVACY: We do NOT store tier or amount_paid in plain text!
    // The tier is only known via the encrypted INCO handles.
    // Payment is validated above, but not stored to prevent leaking tier info.

    // ============================================
    // STEP 1: Convert encrypted tier to INCO handle
    // ============================================
    msg!("Creating encrypted tier handle...");

    let cpi_ctx = CpiContext::new(
        inco.clone(),
        Operation {
            signer: user.to_account_info(),
        },
    );
    let encrypted_tier: Euint128 = cpi::new_euint128(cpi_ctx, encrypted_tier_ciphertext, 0)?;

    // Log handle for client to extract from simulation
    msg!("Tier handle: {}", encrypted_tier.0);

    // ============================================
    // STEP 2: Create threshold handles
    // ============================================
    msg!("Creating threshold handles...");

    let cpi_ctx_1 = CpiContext::new(inco.clone(), Operation { signer: user.to_account_info() });
    let tier_1: Euint128 = cpi::new_euint128(cpi_ctx_1, encrypted_threshold_1, 0)?;

    let cpi_ctx_2 = CpiContext::new(inco.clone(), Operation { signer: user.to_account_info() });
    let tier_2: Euint128 = cpi::new_euint128(cpi_ctx_2, encrypted_threshold_2, 0)?;

    let cpi_ctx_3 = CpiContext::new(inco.clone(), Operation { signer: user.to_account_info() });
    let tier_3: Euint128 = cpi::new_euint128(cpi_ctx_3, encrypted_threshold_3, 0)?;

    let cpi_ctx_4 = CpiContext::new(inco.clone(), Operation { signer: user.to_account_info() });
    let tier_4: Euint128 = cpi::new_euint128(cpi_ctx_4, encrypted_threshold_4, 0)?;

    let cpi_ctx_5 = CpiContext::new(inco.clone(), Operation { signer: user.to_account_info() });
    let tier_5: Euint128 = cpi::new_euint128(cpi_ctx_5, encrypted_threshold_5, 0)?;

    // ============================================
    // STEP 3: Compute ALL tier proofs (PRIVACY-FIRST)
    // ============================================
    // PRIVACY: Always compute ALL 5 proofs so all handles are non-zero.
    // This prevents observers from determining tier based on which
    // handles are zero vs non-zero.
    //
    // SECURITY: Payment validates entitlement to claim up to requested_tier.
    // The encrypted_tier should be <= requested_tier (enforced client-side).
    // When decrypted, only proofs where actual_tier >= threshold are TRUE.
    //
    // Example: User pays for Gold (tier 3), encrypts tier=3
    // - All 5 handles are non-zero (observer can't tell tier)
    // - Decrypted: Bronze=TRUE, Silver=TRUE, Gold=TRUE, Diamond=FALSE, Legendary=FALSE
    msg!("Computing ALL tier proofs (privacy-first - all handles non-zero)...");

    // Bronze proof (tier >= 1)
    let cpi_ctx_ge1 = CpiContext::new(inco.clone(), Operation { signer: user.to_account_info() });
    let proof_bronze: Ebool = cpi::e_ge(cpi_ctx_ge1, encrypted_tier, tier_1, 0)?;
    msg!("Bronze proof handle: {}", proof_bronze.0);

    // Silver proof (tier >= 2)
    let cpi_ctx_ge2 = CpiContext::new(inco.clone(), Operation { signer: user.to_account_info() });
    let proof_silver: Ebool = cpi::e_ge(cpi_ctx_ge2, encrypted_tier, tier_2, 0)?;
    msg!("Silver proof handle: {}", proof_silver.0);

    // Gold proof (tier >= 3)
    let cpi_ctx_ge3 = CpiContext::new(inco.clone(), Operation { signer: user.to_account_info() });
    let proof_gold: Ebool = cpi::e_ge(cpi_ctx_ge3, encrypted_tier, tier_3, 0)?;
    msg!("Gold proof handle: {}", proof_gold.0);

    // Diamond proof (tier >= 4)
    let cpi_ctx_ge4 = CpiContext::new(inco.clone(), Operation { signer: user.to_account_info() });
    let proof_diamond: Ebool = cpi::e_ge(cpi_ctx_ge4, encrypted_tier, tier_4, 0)?;
    msg!("Diamond proof handle: {}", proof_diamond.0);

    // Legendary proof (tier >= 5)
    let cpi_ctx_ge5 = CpiContext::new(inco.clone(), Operation { signer: user.to_account_info() });
    let proof_legendary: Ebool = cpi::e_ge(cpi_ctx_ge5, encrypted_tier, tier_5, 0)?;
    msg!("Legendary proof handle: {}", proof_legendary.0);

    // ============================================
    // STEP 4: Store handles in badge account
    // ============================================
    // NOTE: Call grant_access instruction separately to grant decrypt permissions
    // ALL proofs are non-zero handles (privacy-first design)
    badge.bump = ctx.bumps.badge;
    badge.badge_id = badge_id;
    badge.owner = user.key();
    badge.encrypted_tier = encrypted_tier.0;
    badge.proof_bronze = proof_bronze.0;
    badge.proof_silver = proof_silver.0;
    badge.proof_gold = proof_gold.0;
    badge.proof_diamond = proof_diamond.0;
    badge.proof_legendary = proof_legendary.0;
    badge.created_at = now;
    badge.updated_at = now;
    badge.is_active = true;

    // Update global counters
    config.total_badges = config.total_badges.checked_add(1).unwrap();
    config.next_badge_id = config.next_badge_id.checked_add(1).unwrap();

    msg!(
        "Badge #{} claimed successfully! Owner: {}, Total badges: {}",
        badge_id,
        user.key(),
        config.total_badges
    );

    Ok(())
}

#[derive(Accounts)]
#[instruction(badge_id: u64)]
pub struct ClaimBadge<'info> {
    /// User claiming the badge
    #[account(mut)]
    pub user: Signer<'info>,

    /// Treasury account to receive payment
    /// CHECK: Validated against config.treasury
    #[account(
        mut,
        constraint = treasury.key() == config.treasury @ BadgeError::Unauthorized
    )]
    pub treasury: AccountInfo<'info>,

    /// Global config account
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
        // Validate badge_id matches expected next ID
        constraint = badge_id == config.next_badge_id @ BadgeError::InvalidTier
    )]
    pub config: Account<'info, Config>,

    /// Badge account (PDA per user + badge_id for multi-badge support)
    #[account(
        init,
        payer = user,
        space = ConfidentialBadge::SIZE,
        seeds = [BADGE_SEED, user.key().as_ref(), &badge_id.to_le_bytes()],
        bump
    )]
    pub badge: Account<'info, ConfidentialBadge>,

    /// INCO Lightning program for encrypted operations
    pub inco_lightning_program: Program<'info, IncoLightning>,

    /// System program
    pub system_program: Program<'info, System>,
}
