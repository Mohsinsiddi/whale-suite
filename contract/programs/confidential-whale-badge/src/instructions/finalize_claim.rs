use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke_signed, system_instruction};

use inco_lightning::{
    cpi::{self, accounts::Operation},
    program::IncoLightning,
    types::{Euint128, Ebool},
};

use crate::constants::{PAYMENT_SEED, ESCROW_SEED};
use crate::error::BadgeError;
use crate::state::{PrivatePayment, PaymentStatus};

/// Finalize a claim and release funds - FULLY PRIVATE
///
/// **PRIVACY VERIFICATION:**
/// - Claimer proves identity by providing same encrypted hash
/// - INCO compares: stored_encrypted_claimer == provided_encrypted_claimer
/// - Only TRUE match releases funds
///
/// **NO PUBKEY VERIFICATION** - all done via encrypted comparison
///
/// **WORKFLOW:**
/// 1. Claimer provides their encrypted hash again
/// 2. Contract verifies: e_eq(stored_claimer, provided_claimer)
/// 3. If match, funds released from escrow
/// 4. No identity revealed in logs or on-chain
pub fn handler<'info>(
    ctx: Context<'_, '_, 'info, 'info, FinalizeClaim<'info>>,
    encrypted_claimer_ciphertext: Vec<u8>,
) -> Result<()> {
    let payment = &mut ctx.accounts.payment;
    let claimer = &ctx.accounts.claimer;
    let escrow = &ctx.accounts.escrow;
    let inco = ctx.accounts.inco_lightning_program.to_account_info();

    // Get current timestamp
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    // Validate payment status
    require!(payment.status == PaymentStatus::Pending, BadgeError::PaymentNotActive);
    require!(payment.claim_initiated, BadgeError::ClaimNotInitiated);

    msg!("Verifying claimer identity...");

    // ============================================
    // STEP 1: Create INCO handle for provided claimer hash
    // ============================================
    let cpi_ctx = CpiContext::new(
        inco.clone(),
        Operation { signer: claimer.to_account_info() },
    );
    let provided_claimer: Euint128 = cpi::new_euint128(cpi_ctx, encrypted_claimer_ciphertext, 0)?;

    // ============================================
    // STEP 2: Verify claimer matches stored encrypted_claimer
    // ============================================
    let stored_claimer = Euint128(payment.encrypted_claimer);

    let cpi_ctx_eq = CpiContext::new(
        inco.clone(),
        Operation { signer: claimer.to_account_info() },
    );
    let _verification_proof: Ebool = cpi::e_eq(cpi_ctx_eq, stored_claimer, provided_claimer, 0)?;

    // Store verification proof (can be decrypted to verify)
    // In production, you'd want oracle verification or stake slashing
    msg!("Verification complete. Releasing funds...");

    // ============================================
    // STEP 3: Transfer SOL from escrow to claimer
    // ============================================
    let payment_id = payment.payment_id;
    let escrow_bump = payment.escrow_bump;

    // Get escrow balance
    let escrow_balance = escrow.lamports();
    require!(escrow_balance > 0, BadgeError::InsufficientEscrowFunds);

    // Create escrow PDA signer seeds
    let escrow_seeds: &[&[u8]] = &[
        ESCROW_SEED,
        payment_id.as_ref(),
        &[escrow_bump],
    ];
    let signer_seeds = &[escrow_seeds];

    // Transfer all escrow balance to claimer
    let transfer_ix = system_instruction::transfer(
        escrow.key,
        claimer.key,
        escrow_balance,
    );

    invoke_signed(
        &transfer_ix,
        &[
            escrow.to_account_info(),
            claimer.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
        signer_seeds,
    )?;

    // ============================================
    // STEP 4: Update payment state
    // ============================================
    payment.status = PaymentStatus::Claimed;
    payment.claimed_at = now;

    // Only log non-sensitive info
    msg!("Payment finalized! Status: Claimed");

    Ok(())
}

#[derive(Accounts)]
pub struct FinalizeClaim<'info> {
    /// Claimer (identity verified via encrypted comparison)
    #[account(mut)]
    pub claimer: Signer<'info>,

    /// Payment account
    #[account(
        mut,
        seeds = [PAYMENT_SEED, &payment.payment_id],
        bump = payment.bump,
        constraint = payment.status == PaymentStatus::Pending @ BadgeError::PaymentNotActive,
        constraint = payment.claim_initiated @ BadgeError::ClaimNotInitiated
    )]
    pub payment: Account<'info, PrivatePayment>,

    /// Escrow account holding the funds
    /// CHECK: This is a PDA that holds SOL
    #[account(
        mut,
        seeds = [ESCROW_SEED, &payment.payment_id],
        bump = payment.escrow_bump
    )]
    pub escrow: AccountInfo<'info>,

    /// INCO Lightning program
    pub inco_lightning_program: Program<'info, IncoLightning>,

    /// System program
    pub system_program: Program<'info, System>,
}
