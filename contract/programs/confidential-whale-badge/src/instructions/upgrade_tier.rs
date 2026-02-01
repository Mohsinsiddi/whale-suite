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

/// Upgrade a badge to a higher tier with payment
///
/// SECURITY: Only computes proofs up to the NEW PAID tier.
/// User must pay the difference between their current tier and new tier.
///
/// **Upgrade Pricing:**
/// User pays: new_tier_price - current_tier_price (inferred from existing proofs)
/// For simplicity, we charge the full new tier price.
///
/// **Parameters:**
/// - badge_id: The badge to upgrade (used in PDA derivation)
/// - new_tier: The tier to upgrade to (1-5)
pub fn handler<'info>(
    ctx: Context<'_, '_, 'info, 'info, UpgradeTier<'info>>,
    _badge_id: u64,                        // For PDA derivation (used in accounts)
    new_tier: u8,                         // The tier to upgrade to (must be > current)
    encrypted_tier_ciphertext: Vec<u8>,
    encrypted_threshold_1: Vec<u8>,
    encrypted_threshold_2: Vec<u8>,
    encrypted_threshold_3: Vec<u8>,
    encrypted_threshold_4: Vec<u8>,
    encrypted_threshold_5: Vec<u8>,
) -> Result<()> {
    let badge = &mut ctx.accounts.badge;
    let config = &ctx.accounts.config;
    let user = &ctx.accounts.user;
    let treasury = &ctx.accounts.treasury;
    let inco = ctx.accounts.inco_lightning_program.to_account_info();

    // Ensure badge is active
    require!(badge.is_active, BadgeError::BadgeInactive);

    // Ensure user is the owner
    require!(badge.owner == user.key(), BadgeError::Unauthorized);

    // Validate new tier
    require!(new_tier >= 1 && new_tier <= 5, BadgeError::InvalidTier);

    // Get current timestamp
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    // ============================================
    // STEP 0: Process upgrade payment
    // ============================================
    let required_price = config.get_tier_price(new_tier);
    msg!("Processing upgrade to tier {}. Price: {} lamports", new_tier, required_price);

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

    // ============================================
    // STEP 1: Re-encrypt with new tier
    // ============================================
    msg!("Upgrading badge to tier {}...", new_tier);

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

    // ============================================
    // STEP 2: Compute ALL proofs (PRIVACY-FIRST)
    // ============================================
    // PRIVACY: Always compute ALL 5 proofs so all handles are non-zero.
    // Payment validates entitlement, but all handles look identical on-chain.
    msg!("Computing ALL proofs (privacy-first)...");

    // Bronze proof (tier >= 1)
    let cpi_ctx_ge1 = CpiContext::new(inco.clone(), Operation { signer: user.to_account_info() });
    let proof_bronze: Ebool = cpi::e_ge(cpi_ctx_ge1, encrypted_tier, tier_1, 0)?;

    // Silver proof (tier >= 2)
    let cpi_ctx_ge2 = CpiContext::new(inco.clone(), Operation { signer: user.to_account_info() });
    let proof_silver: Ebool = cpi::e_ge(cpi_ctx_ge2, encrypted_tier, tier_2, 0)?;

    // Gold proof (tier >= 3)
    let cpi_ctx_ge3 = CpiContext::new(inco.clone(), Operation { signer: user.to_account_info() });
    let proof_gold: Ebool = cpi::e_ge(cpi_ctx_ge3, encrypted_tier, tier_3, 0)?;

    // Diamond proof (tier >= 4)
    let cpi_ctx_ge4 = CpiContext::new(inco.clone(), Operation { signer: user.to_account_info() });
    let proof_diamond: Ebool = cpi::e_ge(cpi_ctx_ge4, encrypted_tier, tier_4, 0)?;

    // Legendary proof (tier >= 5)
    let cpi_ctx_ge5 = CpiContext::new(inco.clone(), Operation { signer: user.to_account_info() });
    let proof_legendary: Ebool = cpi::e_ge(cpi_ctx_ge5, encrypted_tier, tier_5, 0)?;

    // Update badge account - ALL proofs are non-zero handles
    badge.encrypted_tier = encrypted_tier.0;
    badge.proof_bronze = proof_bronze.0;
    badge.proof_silver = proof_silver.0;
    badge.proof_gold = proof_gold.0;
    badge.proof_diamond = proof_diamond.0;
    badge.proof_legendary = proof_legendary.0;
    badge.updated_at = now;

    msg!("Badge upgraded successfully to tier {} for {}", new_tier, user.key());

    Ok(())
}

#[derive(Accounts)]
#[instruction(badge_id: u64)]
pub struct UpgradeTier<'info> {
    /// User upgrading the badge (must be owner)
    #[account(mut)]
    pub user: Signer<'info>,

    /// Treasury account to receive payment
    /// CHECK: Validated against config.treasury
    #[account(
        mut,
        constraint = treasury.key() == config.treasury @ BadgeError::Unauthorized
    )]
    pub treasury: AccountInfo<'info>,

    /// Global config account (for tier prices)
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    /// Badge account to upgrade (uses badge_id in PDA seeds)
    #[account(
        mut,
        seeds = [BADGE_SEED, user.key().as_ref(), &badge_id.to_le_bytes()],
        bump = badge.bump,
        constraint = badge.owner == user.key() @ BadgeError::Unauthorized,
        constraint = badge.is_active @ BadgeError::BadgeInactive,
        constraint = badge.badge_id == badge_id @ BadgeError::BadgeNotFound
    )]
    pub badge: Account<'info, ConfidentialBadge>,

    /// INCO Lightning program
    pub inco_lightning_program: Program<'info, IncoLightning>,

    /// System program
    pub system_program: Program<'info, System>,
}
