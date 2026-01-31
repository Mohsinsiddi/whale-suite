use anchor_lang::prelude::*;

use inco_lightning::{
    cpi::{self, accounts::Allow},
    program::IncoLightning,
};

use crate::constants::BADGE_SEED;
use crate::error::BadgeError;
use crate::state::ConfidentialBadge;

/// Transfer badge ownership to another wallet
/// Re-grants decrypt permissions to the new owner
pub fn handler<'info>(
    ctx: Context<'_, '_, 'info, 'info, TransferBadge<'info>>,
    new_owner: Pubkey,
) -> Result<()> {
    let badge = &mut ctx.accounts.badge;
    let current_owner = &ctx.accounts.current_owner;
    let inco = ctx.accounts.inco_lightning_program.to_account_info();

    // Cannot transfer to yourself
    require!(new_owner != current_owner.key(), BadgeError::SelfTransfer);

    // Ensure badge is active
    require!(badge.is_active, BadgeError::BadgeInactive);

    // Get current timestamp
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    msg!(
        "Transferring badge from {} to {}",
        current_owner.key(),
        new_owner
    );

    // ============================================
    // Grant decrypt permissions to new owner
    // ============================================
    if ctx.remaining_accounts.len() >= 2 {
        // Re-allow for encrypted tier
        let allow_tier = CpiContext::new(
            inco.clone(),
            Allow {
                allowance_account: ctx.remaining_accounts[0].clone(),
                signer: current_owner.to_account_info(),
                allowed_address: ctx.remaining_accounts[1].clone(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
        );
        cpi::allow(allow_tier, badge.encrypted_tier, true, new_owner)?;

        // Re-allow for all proofs
        let allow_bronze = CpiContext::new(
            inco.clone(),
            Allow {
                allowance_account: ctx.remaining_accounts[0].clone(),
                signer: current_owner.to_account_info(),
                allowed_address: ctx.remaining_accounts[1].clone(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
        );
        cpi::allow(allow_bronze, badge.proof_bronze, true, new_owner)?;

        let allow_silver = CpiContext::new(
            inco.clone(),
            Allow {
                allowance_account: ctx.remaining_accounts[0].clone(),
                signer: current_owner.to_account_info(),
                allowed_address: ctx.remaining_accounts[1].clone(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
        );
        cpi::allow(allow_silver, badge.proof_silver, true, new_owner)?;

        let allow_gold = CpiContext::new(
            inco.clone(),
            Allow {
                allowance_account: ctx.remaining_accounts[0].clone(),
                signer: current_owner.to_account_info(),
                allowed_address: ctx.remaining_accounts[1].clone(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
        );
        cpi::allow(allow_gold, badge.proof_gold, true, new_owner)?;

        let allow_diamond = CpiContext::new(
            inco.clone(),
            Allow {
                allowance_account: ctx.remaining_accounts[0].clone(),
                signer: current_owner.to_account_info(),
                allowed_address: ctx.remaining_accounts[1].clone(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
        );
        cpi::allow(allow_diamond, badge.proof_diamond, true, new_owner)?;

        let allow_legendary = CpiContext::new(
            inco.clone(),
            Allow {
                allowance_account: ctx.remaining_accounts[0].clone(),
                signer: current_owner.to_account_info(),
                allowed_address: ctx.remaining_accounts[1].clone(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
        );
        cpi::allow(allow_legendary, badge.proof_legendary, true, new_owner)?;
    }

    // Update owner
    let old_owner = badge.owner;
    badge.owner = new_owner;
    badge.updated_at = now;

    msg!(
        "Badge transferred successfully from {} to {}",
        old_owner,
        new_owner
    );

    Ok(())
}

#[derive(Accounts)]
pub struct TransferBadge<'info> {
    /// Current owner of the badge
    #[account(mut)]
    pub current_owner: Signer<'info>,

    /// Badge account to transfer
    #[account(
        mut,
        seeds = [BADGE_SEED, current_owner.key().as_ref()],
        bump = badge.bump,
        constraint = badge.owner == current_owner.key() @ BadgeError::Unauthorized,
        constraint = badge.is_active @ BadgeError::BadgeInactive
    )]
    pub badge: Account<'info, ConfidentialBadge>,

    /// INCO Lightning program
    pub inco_lightning_program: Program<'info, IncoLightning>,

    /// System program
    pub system_program: Program<'info, System>,
}
