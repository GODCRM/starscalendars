//! # StarsCalendars Domain Layer
//!
//! Pure business logic and domain types for astronomical calculations,
//! user management, and spiritual features. This layer has no dependencies
//! on infrastructure concerns and forms the core of our Clean Architecture.
//!
//! ## Performance Requirements
//! - O(1) горячий путь для астрономических расчетов
//! - Zero allocations in hot paths
//! - Pre-allocated collections with exact capacity
//! - No error-prone operations like unwrap, expect, or panic

pub mod astronomical;
pub mod auth;
pub mod spiritual;
pub mod user;
pub mod errors;

// Re-export core domain types
pub use astronomical::*;
pub use auth::*;
pub use spiritual::*;
pub use user::*;
pub use errors::*;

/// Domain-wide result type for error handling
pub type DomainResult<T> = Result<T, DomainError>;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_domain_types_serialization() {
        // Ensure all domain types are properly serializable
        // This is critical for WASM interop
    }
}