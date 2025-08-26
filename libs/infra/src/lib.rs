//! # StarsCalendars Infrastructure Layer
//!
//! Implementations of port interfaces for external services,
//! databases, caches, and third-party APIs.

pub mod cache;
pub mod database;
pub mod jwt;
pub mod telegram;
// ❌ REMOVED: astronomical services violate WASM-only architecture per tz.md
pub mod config;
pub mod mocks;

// Re-export implementations
pub use cache::*;
pub use database::*;
pub use jwt::*;
pub use telegram::*;
// ❌ REMOVED: astronomical services - WASM-only calculations per tz.md
pub use config::*;
pub use mocks::*;

/// Infrastructure layer errors
#[derive(Debug, thiserror::Error)]
pub enum InfraError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Redis error: {0}")]
    Redis(#[from] redis::RedisError),

    #[error("HTTP client error: {0}")]
    Http(#[from] reqwest::Error),

    #[error("JWT error: {0}")]
    Jwt(#[from] jsonwebtoken::errors::Error),

    #[error("Telegram API error: {0}")]
    TelegramApi(String),

    #[error("Configuration error: {0}")]
    Configuration(String),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Internal error: {0}")]
    Internal(String),
}

/// Convert infrastructure errors to domain errors (Clean Architecture)
impl From<InfraError> for starscalendars_domain::DomainError {
    fn from(err: InfraError) -> Self {
        match err {
            InfraError::Database(_) => {
                starscalendars_domain::DomainError::ExternalServiceError(err.to_string())
            }
            InfraError::Redis(_) => {
                starscalendars_domain::DomainError::ExternalServiceError(err.to_string())
            }
            InfraError::Http(_) => {
                starscalendars_domain::DomainError::ExternalServiceError(err.to_string())
            }
            InfraError::TelegramApi(_) => {
                starscalendars_domain::DomainError::ExternalServiceError(err.to_string())
            }
            InfraError::Configuration(_) => {
                starscalendars_domain::DomainError::ConfigurationError(err.to_string())
            }
            InfraError::Serialization(_) => {
                starscalendars_domain::DomainError::SerializationError(err.to_string())
            }
            _ => starscalendars_domain::DomainError::InternalError(err.to_string()),
        }
    }
}
