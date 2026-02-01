use anchor_lang::prelude::*;

use inco_lightning::{
    cpi::{self, accounts::Operation, accounts::Allow},
    program::IncoLightning,
    types::{Euint128, Ebool},
};

use crate::constants::PAYMENT_SEED;
use crate::error::BadgeError;
use crate::state::{PrivatePayment, PaymentStatus};

/// Initiate a claim on a FULLY PRIVATE payment
///
/// **PRIVACY PRESERVED:**
/// - Claimer's identity is ENCRYPTED (not stored as pubkey)
/// - Comparison happens in encrypted space
/// - Only TRUE recipient will get TRUE when decrypting proof
///
/// **WORKFLOW:**
/// 1. Claimer provides their encrypted address hash
/// 2. Contract compares: e_eq(stored_recipient, claimer_hash)
/// 3. Result is stored as claim_proof (Ebool handle)
/// 4. Claimer decrypts off-chain - if TRUE, call finalize_claim
///
/// **WHAT'S VISIBLE:**
/// - A claim was initiated (no identity revealed)
/// - Encrypted handles (meaningless numbers)
///
/// **WHAT'S HIDDEN:**
/// - WHO is claiming
/// - WHETHER they are the valid recipient (until finalized)
pub fn handler<'info>(
    ctx: Context<'_, '_, 'info, 'info, ClaimPayment<'info>>,
    encrypted_claimer_ciphertext: Vec<u8>,
) -> Result<()> {
    let payment = &mut ctx.accounts.payment;
    let claimer = &ctx.accounts.claimer;
    let inco = ctx.accounts.inco_lightning_program.to_account_info();

    // Get current timestamp
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    // Validate payment status
    require!(payment.status == PaymentStatus::Active, BadgeError::PaymentNotActive);
    require!(!payment.claim_initiated, BadgeError::ClaimAlreadyInitiated);
    require!(now < payment.expires_at, BadgeError::PaymentExpired);

    // NO LOGGING OF CLAIMER IDENTITY!
    msg!("Processing claim attempt...");

    // ============================================
    // STEP 1: Create INCO handle for claimer's hash
    // ============================================
    let cpi_ctx = CpiContext::new(
        inco.clone(),
        Operation { signer: claimer.to_account_info() },
    );
    let encrypted_claimer: Euint128 = cpi::new_euint128(cpi_ctx, encrypted_claimer_ciphertext, 0)?;

    // ============================================
    // STEP 2: Compare encrypted recipient == encrypted claimer
    // ============================================
    let stored_recipient = Euint128(payment.encrypted_recipient);

    let cpi_ctx_eq = CpiContext::new(
        inco.clone(),
        Operation { signer: claimer.to_account_info() },
    );
    let claim_proof: Ebool = cpi::e_eq(cpi_ctx_eq, stored_recipient, encrypted_claimer, 0)?;

    // ============================================
    // STEP 3: Grant claimer decrypt permission for proof
    // ============================================
    if ctx.remaining_accounts.len() >= 2 {
        let allowance_account = &ctx.remaining_accounts[0];
        let allowed_address = &ctx.remaining_accounts[1];

        let allow_ctx = CpiContext::new(
            inco.clone(),
            Allow {
                signer: claimer.to_account_info(),
                allowance_account: allowance_account.clone(),
                allowed_address: allowed_address.clone(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
        );
        cpi::allow(allow_ctx, claim_proof.0, true, claimer.key())?;
    }

    // ============================================
    // STEP 4: Update payment state (NO PUBKEY STORED!)
    // ============================================
    payment.claim_proof = claim_proof.0;
    payment.encrypted_claimer = encrypted_claimer.0;  // Store encrypted, not pubkey!
    payment.claim_initiated = true;
    payment.status = PaymentStatus::Pending;

    // Only log non-sensitive info
    msg!("Claim initiated! Status: Pending");

    Ok(())
}

#[derive(Accounts)]
pub struct ClaimPayment<'info> {
    /// Person attempting to claim (identity hidden via encrypted_claimer)
    #[account(mut)]
    pub claimer: Signer<'info>,

    /// Payment account
    #[account(
        mut,
        seeds = [PAYMENT_SEED, &payment.payment_id],
        bump = payment.bump,
        constraint = payment.status == PaymentStatus::Active @ BadgeError::PaymentNotActive
    )]
    pub payment: Account<'info, PrivatePayment>,

    /// INCO Lightning program for encrypted operations
    pub inco_lightning_program: Program<'info, IncoLightning>,

    /// System program
    pub system_program: Program<'info, System>,
}
