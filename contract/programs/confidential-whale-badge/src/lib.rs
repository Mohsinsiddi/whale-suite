use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

// Re-export everything from instructions at crate root for Anchor IDL macro
pub use instructions::*;

// Program ID - generated from target/deploy/confidential_whale_badge-keypair.json
declare_id!("GWvRjicD4DLcXEjwD7K3umrRgtnmtYsCcsGfibKA5fhs");

#[program]
pub mod confidential_whale_badge {
    use super::*;

    /// Initialize the global config (admin only, one-time)
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::handler(ctx)
    }

    /// Claim a confidential badge - encrypts tier and pre-computes all proofs
    ///
    /// All encrypted values must be created client-side using INCO JS SDK:
    /// - encrypted_tier_ciphertext: The user's tier (1-5) encrypted
    /// - encrypted_threshold_1-5: Constant values 1,2,3,4,5 encrypted
    pub fn claim_badge<'info>(
        ctx: Context<'_, '_, 'info, 'info, ClaimBadge<'info>>,
        encrypted_tier_ciphertext: Vec<u8>,
        encrypted_threshold_1: Vec<u8>,
        encrypted_threshold_2: Vec<u8>,
        encrypted_threshold_3: Vec<u8>,
        encrypted_threshold_4: Vec<u8>,
        encrypted_threshold_5: Vec<u8>,
    ) -> Result<()> {
        instructions::claim_badge::handler(
            ctx,
            encrypted_tier_ciphertext,
            encrypted_threshold_1,
            encrypted_threshold_2,
            encrypted_threshold_3,
            encrypted_threshold_4,
            encrypted_threshold_5,
        )
    }

    /// Upgrade tier when user buys a higher badge on mainnet
    pub fn upgrade_tier<'info>(
        ctx: Context<'_, '_, 'info, 'info, UpgradeTier<'info>>,
        encrypted_tier_ciphertext: Vec<u8>,
        encrypted_threshold_1: Vec<u8>,
        encrypted_threshold_2: Vec<u8>,
        encrypted_threshold_3: Vec<u8>,
        encrypted_threshold_4: Vec<u8>,
        encrypted_threshold_5: Vec<u8>,
    ) -> Result<()> {
        instructions::upgrade_tier::handler(
            ctx,
            encrypted_tier_ciphertext,
            encrypted_threshold_1,
            encrypted_threshold_2,
            encrypted_threshold_3,
            encrypted_threshold_4,
            encrypted_threshold_5,
        )
    }

    /// Transfer badge ownership to another wallet
    pub fn transfer_badge<'info>(
        ctx: Context<'_, '_, 'info, 'info, TransferBadge<'info>>,
        new_owner: Pubkey,
    ) -> Result<()> {
        instructions::transfer_badge::handler(ctx, new_owner)
    }

    /// Revoke/deactivate a badge (admin or owner)
    pub fn revoke_badge(ctx: Context<RevokeBadge>) -> Result<()> {
        instructions::revoke_badge::handler(ctx)
    }

    /// Grant decrypt access to badge handles
    ///
    /// Call this after claim_badge to grant decrypt permission for the stored handles.
    /// Requires 12 remaining_accounts: 6 allowance PDAs + 6 user pubkeys (interleaved)
    ///
    /// Allowance PDA derivation: PDA([handle_bytes_le_16, user_pubkey], INCO_PROGRAM_ID)
    pub fn grant_access<'info>(
        ctx: Context<'_, '_, 'info, 'info, GrantAccess<'info>>,
    ) -> Result<()> {
        instructions::grant_access::handler(ctx)
    }
}
