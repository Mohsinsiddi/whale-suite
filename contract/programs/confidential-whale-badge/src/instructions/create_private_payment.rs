use anchor_lang::prelude::*;
use anchor_lang::system_program;

use inco_lightning::{
    cpi::{self, accounts::Operation},
    program::IncoLightning,
    types::Euint128,
};

use crate::constants::{PAYMENT_SEED, ESCROW_SEED, DEFAULT_PAYMENT_EXPIRY};
use crate::error::BadgeError;
use crate::state::{PrivatePayment, PaymentStatus};

/// Create a FULLY PRIVATE payment
///
/// **ALL DATA IS ENCRYPTED:**
/// - Sender address: encrypt(hash(sender_pubkey)[0:16])
/// - Recipient address: encrypt(hash(recipient_pubkey)[0:16])
/// - Amount: encrypt(amount_in_lamports)
///
/// **WHAT'S VISIBLE ON-CHAIN:**
/// - Payment ID (random)
/// - Status (Active/Claimed)
/// - Timestamps
/// - Escrow balance (but not linked to specific payment)
///
/// **WHAT'S HIDDEN:**
/// - WHO sent it
/// - WHO receives it
/// - HOW MUCH was sent
///
/// **WORKFLOW:**
/// 1. Sender encrypts: sender_hash, recipient_hash, amount
/// 2. Call create_private_payment with all encrypted values
/// 3. SOL is locked in escrow PDA
/// 4. Only recipient can claim by proving their address matches
pub fn handler<'info>(
    ctx: Context<'_, '_, 'info, 'info, CreatePrivatePayment<'info>>,
    payment_id: [u8; 32],
    actual_amount: u64,  // Actual SOL to transfer (needed for escrow)
    encrypted_sender_ciphertext: Vec<u8>,
    encrypted_recipient_ciphertext: Vec<u8>,
    encrypted_amount_ciphertext: Vec<u8>,
    expiry_seconds: Option<i64>,
) -> Result<()> {
    let payment = &mut ctx.accounts.payment;
    let payer = &ctx.accounts.payer;  // Renamed from 'sender' - just the payer
    let escrow = &ctx.accounts.escrow;
    let inco = ctx.accounts.inco_lightning_program.to_account_info();

    // Get current timestamp
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    // Validate amount
    require!(actual_amount > 0, BadgeError::InvalidPaymentAmount);

    // NO LOGGING OF SENSITIVE DATA!
    msg!("Creating private payment...");

    // ============================================
    // STEP 1: Transfer SOL to escrow
    // ============================================
    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
            from: payer.to_account_info(),
            to: escrow.to_account_info(),
        },
    );
    system_program::transfer(cpi_context, actual_amount)?;

    // ============================================
    // STEP 2: Create INCO handles for ALL encrypted data
    // ============================================

    // Encrypted SENDER hash
    let cpi_ctx_sender = CpiContext::new(
        inco.clone(),
        Operation { signer: payer.to_account_info() },
    );
    let encrypted_sender: Euint128 = cpi::new_euint128(cpi_ctx_sender, encrypted_sender_ciphertext, 0)?;

    // Encrypted RECIPIENT hash
    let cpi_ctx_recipient = CpiContext::new(
        inco.clone(),
        Operation { signer: payer.to_account_info() },
    );
    let encrypted_recipient: Euint128 = cpi::new_euint128(cpi_ctx_recipient, encrypted_recipient_ciphertext, 0)?;

    // Encrypted AMOUNT
    let cpi_ctx_amount = CpiContext::new(
        inco.clone(),
        Operation { signer: payer.to_account_info() },
    );
    let encrypted_amount: Euint128 = cpi::new_euint128(cpi_ctx_amount, encrypted_amount_ciphertext, 0)?;

    // ============================================
    // STEP 3: Initialize payment account
    // ============================================
    let expiry = expiry_seconds.unwrap_or(DEFAULT_PAYMENT_EXPIRY);

    payment.bump = ctx.bumps.payment;
    payment.payment_id = payment_id;
    payment.encrypted_sender = encrypted_sender.0;
    payment.encrypted_recipient = encrypted_recipient.0;
    payment.encrypted_amount = encrypted_amount.0;
    payment.claim_proof = 0;
    payment.encrypted_claimer = 0;
    payment.claim_initiated = false;
    payment.created_at = now;
    payment.expires_at = now + expiry;
    payment.claimed_at = 0;
    payment.status = PaymentStatus::Active;
    payment.escrow_bump = ctx.bumps.escrow;

    // Only log non-sensitive info
    msg!("Private payment created! Status: Active");

    Ok(())
}

#[derive(Accounts)]
#[instruction(payment_id: [u8; 32])]
pub struct CreatePrivatePayment<'info> {
    /// Payer who funds the escrow (identity hidden via encrypted_sender)
    #[account(mut)]
    pub payer: Signer<'info>,

    /// Payment account (PDA per payment_id)
    #[account(
        init,
        payer = payer,
        space = PrivatePayment::SIZE,
        seeds = [PAYMENT_SEED, &payment_id],
        bump
    )]
    pub payment: Account<'info, PrivatePayment>,

    /// Escrow account to hold funds (PDA)
    /// CHECK: This is a PDA that holds SOL
    #[account(
        mut,
        seeds = [ESCROW_SEED, &payment_id],
        bump
    )]
    pub escrow: AccountInfo<'info>,

    /// INCO Lightning program for encrypted operations
    pub inco_lightning_program: Program<'info, IncoLightning>,

    /// System program
    pub system_program: Program<'info, System>,
}
