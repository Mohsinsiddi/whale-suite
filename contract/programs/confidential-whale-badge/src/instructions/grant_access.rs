use anchor_lang::prelude::*;

use inco_lightning::{
    cpi::{self, accounts::Allow},
    program::IncoLightning,
};

use crate::constants::BADGE_SEED;
use crate::error::BadgeError;
use crate::state::ConfidentialBadge;

/// Grant decrypt access for badge proof handles
///
/// This instruction grants the badge owner permission to decrypt the stored
/// encrypted tier and proof handles via INCO's allow mechanism.
///
/// **Usage:**
/// 1. Fetch the badge account to get handle values
/// 2. Derive allowance PDAs for each handle: PDA([handle_bytes_le_16, user_pubkey], INCO_PROGRAM)
/// 3. Call this instruction with remaining_accounts containing the allowance PDAs
///
/// **remaining_accounts structure (12 accounts for 6 handles):**
/// [0] tier_allowance_pda (mut)
/// [1] user_pubkey (readonly)
/// [2] bronze_allowance_pda (mut)
/// [3] user_pubkey (readonly)
/// ... and so on for silver, gold, diamond, legendary
pub fn handler<'info>(ctx: Context<'_, '_, 'info, 'info, GrantAccess<'info>>) -> Result<()> {
    let badge = &ctx.accounts.badge;
    let user = &ctx.accounts.user;
    let inco = ctx.accounts.inco_lightning_program.to_account_info();

    // Ensure badge is active
    require!(badge.is_active, BadgeError::BadgeInactive);

    // Ensure user is the owner
    require!(badge.owner == user.key(), BadgeError::Unauthorized);

    // We need 12 remaining accounts (6 handles * 2 accounts each)
    require!(
        ctx.remaining_accounts.len() >= 12,
        BadgeError::InsufficientAccounts
    );

    msg!("Granting decrypt permissions for all 6 badge handles...");

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
    cpi::allow(allow_tier, badge.encrypted_tier, true, user.key())?;
    msg!("✓ Tier handle allowed");

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
    cpi::allow(allow_bronze, badge.proof_bronze, true, user.key())?;
    msg!("✓ Bronze proof allowed");

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
    cpi::allow(allow_silver, badge.proof_silver, true, user.key())?;
    msg!("✓ Silver proof allowed");

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
    cpi::allow(allow_gold, badge.proof_gold, true, user.key())?;
    msg!("✓ Gold proof allowed");

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
    cpi::allow(allow_diamond, badge.proof_diamond, true, user.key())?;
    msg!("✓ Diamond proof allowed");

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
    cpi::allow(allow_legendary, badge.proof_legendary, true, user.key())?;
    msg!("✓ Legendary proof allowed");

    msg!("All 6 handles granted decrypt permission to {}", user.key());

    Ok(())
}

#[derive(Accounts)]
pub struct GrantAccess<'info> {
    /// User requesting access (must be badge owner)
    #[account(mut)]
    pub user: Signer<'info>,

    /// Badge account containing the handles
    #[account(
        seeds = [BADGE_SEED, user.key().as_ref()],
        bump = badge.bump,
        constraint = badge.owner == user.key() @ BadgeError::Unauthorized,
        constraint = badge.is_active @ BadgeError::BadgeInactive
    )]
    pub badge: Account<'info, ConfidentialBadge>,

    /// INCO Lightning program for allow operations
    pub inco_lightning_program: Program<'info, IncoLightning>,

    /// System program (required for allowance PDA creation)
    pub system_program: Program<'info, System>,
}
