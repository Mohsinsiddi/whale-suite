use anchor_lang::prelude::*;

use inco_lightning::{
    cpi::{self, accounts::Operation, accounts::Allow},
    program::IncoLightning,
    types::{Ebool, Euint128},
};

use crate::constants::{BADGE_SEED, CONFIG_SEED};
use crate::state::{ConfidentialBadge, Config};

/// Claim a confidential badge
///
/// The client must encrypt the tier value using INCO JS SDK before calling this.
///
/// **IMPORTANT - TWO-STEP PROCESS:**
/// 1. First, simulate the transaction to get handle values from logs
/// 2. Then, derive allowance PDAs for each handle and call with remaining_accounts
///
/// This instruction:
/// 1. Converts the encrypted tier into an INCO handle
/// 2. Pre-computes all tier comparison proofs (tier >= 1, tier >= 2, etc.)
/// 3. Logs all handle values for client to extract
/// 4. If remaining_accounts provided, grants decrypt permissions
/// 5. Stores all handles in the badge account
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
    // STEP 4: Grant decrypt permissions (if remaining_accounts provided)
    // ============================================
    // Client must:
    // 1. Simulate tx first to get handle values from logs
    // 2. Derive allowance PDAs for each handle: PDA([handle_bytes, user_pubkey], INCO_PROGRAM)
    // 3. Pass as remaining_accounts: [allowance_pda_0, user, allowance_pda_1, user, ...]

    // We need 6 handles to allow: tier + 5 proofs
    // Each allow needs 2 accounts: allowance_pda + allowed_address
    // Total: 12 remaining accounts minimum

    if ctx.remaining_accounts.len() >= 12 {
        msg!("Granting decrypt permissions...");

        // Allow tier handle
        let allow_tier = CpiContext::new(
            inco.clone(),
            Allow {
                allowance_account: ctx.remaining_accounts[0].clone(),
                signer: user.to_account_info(),
                allowed_address: ctx.remaining_accounts[1].clone(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
        );
        cpi::allow(allow_tier, encrypted_tier.0, true, user.key())?;

        // Allow Bronze proof
        let allow_bronze = CpiContext::new(
            inco.clone(),
            Allow {
                allowance_account: ctx.remaining_accounts[2].clone(),
                signer: user.to_account_info(),
                allowed_address: ctx.remaining_accounts[3].clone(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
        );
        cpi::allow(allow_bronze, proof_bronze.0, true, user.key())?;

        // Allow Silver proof
        let allow_silver = CpiContext::new(
            inco.clone(),
            Allow {
                allowance_account: ctx.remaining_accounts[4].clone(),
                signer: user.to_account_info(),
                allowed_address: ctx.remaining_accounts[5].clone(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
        );
        cpi::allow(allow_silver, proof_silver.0, true, user.key())?;

        // Allow Gold proof
        let allow_gold = CpiContext::new(
            inco.clone(),
            Allow {
                allowance_account: ctx.remaining_accounts[6].clone(),
                signer: user.to_account_info(),
                allowed_address: ctx.remaining_accounts[7].clone(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
        );
        cpi::allow(allow_gold, proof_gold.0, true, user.key())?;

        // Allow Diamond proof
        let allow_diamond = CpiContext::new(
            inco.clone(),
            Allow {
                allowance_account: ctx.remaining_accounts[8].clone(),
                signer: user.to_account_info(),
                allowed_address: ctx.remaining_accounts[9].clone(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
        );
        cpi::allow(allow_diamond, proof_diamond.0, true, user.key())?;

        // Allow Legendary proof
        let allow_legendary = CpiContext::new(
            inco.clone(),
            Allow {
                allowance_account: ctx.remaining_accounts[10].clone(),
                signer: user.to_account_info(),
                allowed_address: ctx.remaining_accounts[11].clone(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
        );
        cpi::allow(allow_legendary, proof_legendary.0, true, user.key())?;

        msg!("Decrypt permissions granted for all 6 handles");
    } else {
        msg!("No remaining_accounts - skipping allow (simulate mode)");
    }

    // ============================================
    // STEP 5: Store handles in badge account
    // ============================================
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
