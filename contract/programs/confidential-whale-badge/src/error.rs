use anchor_lang::prelude::*;

#[error_code]
pub enum BadgeError {
    #[msg("Invalid tier value. Must be between 1 (Bronze) and 5 (Legendary)")]
    InvalidTier,

    #[msg("Badge already claimed for this wallet")]
    AlreadyClaimed,

    #[msg("Badge not found or not active")]
    BadgeNotFound,

    #[msg("Not authorized to perform this action")]
    Unauthorized,

    #[msg("Cannot downgrade tier. New tier must be higher than current")]
    CannotDowngrade,

    #[msg("Cannot transfer to yourself")]
    SelfTransfer,

    #[msg("Badge is not active")]
    BadgeInactive,

    #[msg("Config already initialized")]
    AlreadyInitialized,

    #[msg("Invalid INCO program")]
    InvalidIncoProgram,

    #[msg("INCO operation failed")]
    IncoOperationFailed,

    #[msg("Missing required remaining accounts for INCO allow")]
    MissingAllowAccounts,

    #[msg("Insufficient remaining accounts provided")]
    InsufficientAccounts,
}
