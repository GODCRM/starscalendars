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

// ❌ REMOVED: astronomical types violate WASM-only architecture per tz.md
pub mod telegram;
pub mod events;
pub mod spiritual;
pub mod user;
pub mod auth;
pub mod ports;
pub mod errors;

// ❌ REMOVED: astronomical types - WASM-only calculations per tz.md
// Re-export core domain types (specific imports to avoid ambiguity)
pub use telegram::{TelegramChannelId, SubscriptionStatus, TelegramProfile};
pub use events::{DomainEvent, UserEvent, AstronomicalEvent, Event, EventId, EventPublisher};
pub use spiritual::{SpiritualProfile};
pub use user::{User, UserId};
pub use auth::{JwtClaims, RefreshToken, LinkingToken};
pub use ports::*;
pub use errors::*;

// Explicit re-exports to avoid ambiguity
pub use telegram::TelegramUserId as TelegramId;
pub use events::SpiritualEvent as EventSpiritualEvent;
pub use spiritual::SpiritualEvent as SpiritualEventData;

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