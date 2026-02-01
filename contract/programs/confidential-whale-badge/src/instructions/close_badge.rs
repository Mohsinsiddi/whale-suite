use anchor_lang::prelude::*;

use crate::constants::BADGE_SEED;
use crate::error::BadgeError;
use crate::state::ConfidentialBadge;

/// Close a badge account and recover rent
///
/// Only the badge owner can close their badge.
/// This permanently deletes the badge and returns rent to the owner.
///
/// **USE CASES:**
/// - User wants to clean up unused badges
/// - User wants to recover rent from old badges
/// - Preparation for trading (transfer badge to buyer, buyer closes old badges)
///
/// **IMPORTANT:**
/// - This action is IRREVERSIBLE
/// - All encrypted tier proofs will be lost
/// - Badge ID cannot be reused
pub fn handler(ctx: Context<CloseBadge>) -> Result<()> {
    let badge = &ctx.accounts.badge;
    let owner = &ctx.accounts.owner;

    // Verify caller is the badge owner
    require!(
        badge.owner == owner.key(),
        BadgeError::Unauthorized
    );

    msg!(
        "Closing badge #{} owned by {}. Rent will be returned.",
        badge.badge_id,
        owner.key()
    );

    // Badge account will be closed automatically by Anchor's close attribute
    // Rent will be returned to the owner

    Ok(())
}

#[derive(Accounts)]
pub struct CloseBadge<'info> {
    /// Badge owner who will receive rent
    #[account(mut)]
    pub owner: Signer<'info>,

    /// Badge account to close
    /// Rent goes to owner
    #[account(
        mut,
        close = owner,
        seeds = [BADGE_SEED, badge.owner.as_ref(), &badge.badge_id.to_le_bytes()],
        bump = badge.bump,
        constraint = badge.owner == owner.key() @ BadgeError::Unauthorized
    )]
    pub badge: Account<'info, ConfidentialBadge>,

    /// System program
    pub system_program: Program<'info, System>,
}
