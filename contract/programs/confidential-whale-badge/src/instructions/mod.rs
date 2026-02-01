pub mod initialize;
pub mod claim_badge;
pub mod upgrade_tier;
pub mod transfer_badge;
pub mod revoke_badge;
pub mod close_badge;
pub mod grant_access;
pub mod update_prices;

// Private Payment instructions
pub mod create_private_payment;
pub mod claim_payment;
pub mod finalize_claim;
pub mod cancel_payment;

// Re-export everything including generated __client_accounts modules
pub use initialize::*;
pub use claim_badge::*;
pub use upgrade_tier::*;
pub use transfer_badge::*;
pub use revoke_badge::*;
pub use close_badge::*;
pub use grant_access::*;
pub use update_prices::*;

// Private Payment exports
pub use create_private_payment::*;
pub use claim_payment::*;
pub use finalize_claim::*;
pub use cancel_payment::*;
