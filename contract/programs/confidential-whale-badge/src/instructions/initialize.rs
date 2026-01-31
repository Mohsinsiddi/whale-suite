use anchor_lang::prelude::*;

use crate::constants::CONFIG_SEED;
use crate::error::BadgeError;
use crate::state::Config;

/// Initialize the global configuration
/// This should only be called once by the deployer
pub fn handler(ctx: Context<Initialize>) -> Result<()> {
    let config = &mut ctx.accounts.config;

    // Ensure not already initialized
    require!(!config.is_initialized, BadgeError::AlreadyInitialized);

    // Set config values
    config.admin = ctx.accounts.admin.key();
    config.treasury = ctx.accounts.admin.key(); // Admin is treasury by default
    config.total_badges = 0;
    config.is_initialized = true;
    config.bump = ctx.bumps.config;

    msg!("Config initialized by admin: {}", config.admin);

    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    /// Admin who initializes the config
    #[account(mut)]
    pub admin: Signer<'info>,

    /// Global config account (PDA)
    #[account(
        init,
        payer = admin,
        space = Config::SIZE,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, Config>,

    /// System program for account creation
    pub system_program: Program<'info, System>,
}
