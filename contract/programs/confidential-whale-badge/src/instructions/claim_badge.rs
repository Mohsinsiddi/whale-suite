use anchor_lang::prelude::*;

use inco_lightning::{
    cpi::{self, accounts::Operation},
    program::IncoLightning,
    types::{Ebool, Euint128},
};

use crate::constants::{BADGE_SEED, CONFIG_SEED};
use crate::state::{ConfidentialBadge, Config};

/// Claim a confidential badge
///
/// The client must encrypt the tier value using INCO JS SDK before calling this.
///
/// **WORKFLOW:**
/// 1. Call claim_badge to create encrypted tier and proof handles
/// 2. Call grant_access to grant decrypt permissions for the handles
///
/// This instruction:
/// 1. Converts the encrypted tier into an INCO handle
/// 2. Pre-computes all tier comparison proofs (tier >= 1, tier >= 2, etc.)
/// 3. Logs all handle values for debugging
/// 4. Stores all handles in the badge account
pub fn handler<'info>(
    ctx: Context<'_, '_, 'info, 'info, ClaimBadge<'info>>,
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
    let inco = ctx.accounts.inco_lightning_program.to_account_info();

    // Get current timestamp
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

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
    // STEP 3: Compute tier proofs (is tier >= threshold?)
    // ============================================
    msg!("Computing tier proofs...");

    let cpi_ctx_ge1 = CpiContext::new(inco.clone(), Operation { signer: user.to_account_info() });
    let proof_bronze: Ebool = cpi::e_ge(cpi_ctx_ge1, encrypted_tier, tier_1, 0)?;
    msg!("Bronze proof handle: {}", proof_bronze.0);

    let cpi_ctx_ge2 = CpiContext::new(inco.clone(), Operation { signer: user.to_account_info() });
    let proof_silver: Ebool = cpi::e_ge(cpi_ctx_ge2, encrypted_tier, tier_2, 0)?;
    msg!("Silver proof handle: {}", proof_silver.0);

    let cpi_ctx_ge3 = CpiContext::new(inco.clone(), Operation { signer: user.to_account_info() });
    let proof_gold: Ebool = cpi::e_ge(cpi_ctx_ge3, encrypted_tier, tier_3, 0)?;
    msg!("Gold proof handle: {}", proof_gold.0);

    let cpi_ctx_ge4 = CpiContext::new(inco.clone(), Operation { signer: user.to_account_info() });
    let proof_diamond: Ebool = cpi::e_ge(cpi_ctx_ge4, encrypted_tier, tier_4, 0)?;
    msg!("Diamond proof handle: {}", proof_diamond.0);

    let cpi_ctx_ge5 = CpiContext::new(inco.clone(), Operation { signer: user.to_account_info() });
    let proof_legendary: Ebool = cpi::e_ge(cpi_ctx_ge5, encrypted_tier, tier_5, 0)?;
    msg!("Legendary proof handle: {}", proof_legendary.0);

    // ============================================
    // STEP 4: Store handles in badge account
    // ============================================
    // NOTE: Call grant_access instruction separately to grant decrypt permissions
    badge.bump = ctx.bumps.badge;
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

    // Update global counter
    config.total_badges = config.total_badges.checked_add(1).unwrap();

    msg!(
        "Badge claimed successfully! Owner: {}, Total badges: {}",
        user.key(),
        config.total_badges
    );

    Ok(())
}

#[derive(Accounts)]
pub struct ClaimBadge<'info> {
    /// User claiming the badge
    #[account(mut)]
    pub user: Signer<'info>,

    /// Global config account
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    /// Badge account (PDA per user)
    #[account(
        init,
        payer = user,
        space = ConfidentialBadge::SIZE,
        seeds = [BADGE_SEED, user.key().as_ref()],
        bump
    )]
    pub badge: Account<'info, ConfidentialBadge>,

    /// INCO Lightning program for encrypted operations
    pub inco_lightning_program: Program<'info, IncoLightning>,

    /// System program
    pub system_program: Program<'info, System>,
}
