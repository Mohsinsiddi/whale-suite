use anchor_lang::prelude::*;

use inco_lightning::{
    cpi::{self, accounts::Operation},
    program::IncoLightning,
    types::{Ebool, Euint128},
};

use crate::constants::BADGE_SEED;
use crate::error::BadgeError;
use crate::state::ConfidentialBadge;

/// Upgrade a badge to a higher tier
/// Re-encrypts the tier and re-computes all proofs
pub fn handler<'info>(
    ctx: Context<'_, '_, 'info, 'info, UpgradeTier<'info>>,
    encrypted_tier_ciphertext: Vec<u8>,
    encrypted_threshold_1: Vec<u8>,
    encrypted_threshold_2: Vec<u8>,
    encrypted_threshold_3: Vec<u8>,
    encrypted_threshold_4: Vec<u8>,
    encrypted_threshold_5: Vec<u8>,
) -> Result<()> {
    let badge = &mut ctx.accounts.badge;
    let user = &ctx.accounts.user;
    let inco = ctx.accounts.inco_lightning_program.to_account_info();

    // Ensure badge is active
    require!(badge.is_active, BadgeError::BadgeInactive);

    // Ensure user is the owner
    require!(badge.owner == user.key(), BadgeError::Unauthorized);

    // Get current timestamp
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    // ============================================
    // Re-encrypt with new tier and recompute proofs
    // ============================================
    msg!("Upgrading badge with new tier...");

    let cpi_ctx = CpiContext::new(
        inco.clone(),
        Operation {
            signer: user.to_account_info(),
        },
    );
    let encrypted_tier: Euint128 = cpi::new_euint128(cpi_ctx, encrypted_tier_ciphertext, 0)?;

    // Create threshold handles
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

    // Compute proofs
    let cpi_ctx_ge1 = CpiContext::new(inco.clone(), Operation { signer: user.to_account_info() });
    let proof_bronze: Ebool = cpi::e_ge(cpi_ctx_ge1, encrypted_tier, tier_1, 0)?;

    let cpi_ctx_ge2 = CpiContext::new(inco.clone(), Operation { signer: user.to_account_info() });
    let proof_silver: Ebool = cpi::e_ge(cpi_ctx_ge2, encrypted_tier, tier_2, 0)?;

    let cpi_ctx_ge3 = CpiContext::new(inco.clone(), Operation { signer: user.to_account_info() });
    let proof_gold: Ebool = cpi::e_ge(cpi_ctx_ge3, encrypted_tier, tier_3, 0)?;

    let cpi_ctx_ge4 = CpiContext::new(inco.clone(), Operation { signer: user.to_account_info() });
    let proof_diamond: Ebool = cpi::e_ge(cpi_ctx_ge4, encrypted_tier, tier_4, 0)?;

    let cpi_ctx_ge5 = CpiContext::new(inco.clone(), Operation { signer: user.to_account_info() });
    let proof_legendary: Ebool = cpi::e_ge(cpi_ctx_ge5, encrypted_tier, tier_5, 0)?;

    // Note: The user who signed this transaction automatically has permission
    // to decrypt these handles. No explicit `allow` call needed for owner.

    // Update badge account
    badge.encrypted_tier = encrypted_tier.0;
    badge.proof_bronze = proof_bronze.0;
    badge.proof_silver = proof_silver.0;
    badge.proof_gold = proof_gold.0;
    badge.proof_diamond = proof_diamond.0;
    badge.proof_legendary = proof_legendary.0;
    badge.updated_at = now;

    msg!("Badge upgraded successfully for {}", user.key());

    Ok(())
}

#[derive(Accounts)]
pub struct UpgradeTier<'info> {
    /// User upgrading the badge (must be owner)
    #[account(mut)]
    pub user: Signer<'info>,

    /// Badge account to upgrade
    #[account(
        mut,
        seeds = [BADGE_SEED, user.key().as_ref()],
        bump = badge.bump,
        constraint = badge.owner == user.key() @ BadgeError::Unauthorized,
        constraint = badge.is_active @ BadgeError::BadgeInactive
    )]
    pub badge: Account<'info, ConfidentialBadge>,

    /// INCO Lightning program
    pub inco_lightning_program: Program<'info, IncoLightning>,

    /// System program
    pub system_program: Program<'info, System>,
}
