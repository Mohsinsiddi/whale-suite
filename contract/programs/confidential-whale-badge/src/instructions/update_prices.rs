use anchor_lang::prelude::*;

use crate::constants::CONFIG_SEED;
use crate::error::BadgeError;
use crate::state::Config;

/// Update tier prices (admin only)
///
/// Allows admin to configure badge prices for each tier.
/// Prices are in lamports (1 SOL = 1_000_000_000 lamports)
pub fn handler(
    ctx: Context<UpdatePrices>,
    price_bronze: Option<u64>,
    price_silver: Option<u64>,
    price_gold: Option<u64>,
    price_diamond: Option<u64>,
    price_legendary: Option<u64>,
) -> Result<()> {
    let config = &mut ctx.accounts.config;

    // Update prices if provided
    if let Some(price) = price_bronze {
        config.price_bronze = price;
        msg!("Bronze price updated: {} lamports", price);
    }
    if let Some(price) = price_silver {
        config.price_silver = price;
        msg!("Silver price updated: {} lamports", price);
    }
    if let Some(price) = price_gold {
        config.price_gold = price;
        msg!("Gold price updated: {} lamports", price);
    }
    if let Some(price) = price_diamond {
        config.price_diamond = price;
        msg!("Diamond price updated: {} lamports", price);
    }
    if let Some(price) = price_legendary {
        config.price_legendary = price;
        msg!("Legendary price updated: {} lamports", price);
    }

    msg!("Prices updated by admin: {}", ctx.accounts.admin.key());

    Ok(())
}

#[derive(Accounts)]
pub struct UpdatePrices<'info> {
    /// Admin who can update prices
    #[account(
        constraint = admin.key() == config.admin @ BadgeError::Unauthorized
    )]
    pub admin: Signer<'info>,

    /// Global config account
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,
}
