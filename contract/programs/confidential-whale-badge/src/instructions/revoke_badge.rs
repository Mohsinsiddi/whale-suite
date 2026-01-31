use anchor_lang::prelude::*;

use crate::constants::{BADGE_SEED, CONFIG_SEED};
use crate::error::BadgeError;
use crate::state::{ConfidentialBadge, Config};

/// Revoke/deactivate a badge
/// Can be called by admin or badge owner
pub fn handler(ctx: Context<RevokeBadge>) -> Result<()> {
    let badge = &mut ctx.accounts.badge;
    let authority = &ctx.accounts.authority;
    let config = &ctx.accounts.config;

    // Check authorization: must be admin or owner
    let is_admin = authority.key() == config.admin;
    let is_owner = authority.key() == badge.owner;

    require!(is_admin || is_owner, BadgeError::Unauthorized);

    // Ensure badge is currently active
    require!(badge.is_active, BadgeError::BadgeInactive);

    // Get current timestamp
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    // Deactivate the badge
    badge.is_active = false;
    badge.updated_at = now;

    msg!(
        "Badge revoked for owner {}. Revoked by: {}",
        badge.owner,
        authority.key()
    );

    Ok(())
}

#[derive(Accounts)]
pub struct RevokeBadge<'info> {
    /// Authority revoking the badge (admin or owner)
    pub authority: Signer<'info>,

    /// Global config (to check if authority is admin)
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    /// Badge account to revoke
    #[account(
        mut,
        seeds = [BADGE_SEED, badge.owner.as_ref()],
        bump = badge.bump,
        constraint = badge.is_active @ BadgeError::BadgeInactive
    )]
    pub badge: Account<'info, ConfidentialBadge>,
}
