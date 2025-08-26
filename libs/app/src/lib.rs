//! # StarsCalendars Application Layer
//!
//! Use cases and port interfaces following Clean Architecture principles.
//! This layer orchestrates business logic and defines contracts for
//! external dependencies through traits (ports).

pub mod services;
pub mod usecases;

// Re-export main interfaces
pub use services::*;
pub use usecases::*;

// Re-export domain ports for convenience
pub use starscalendars_domain::{
    CacheService, CacheServiceExt, JwtService, PortResult, TelegramService, TelegramUserInfo,
    TokenRepository, UserRepository,
};

/// Application layer result type
pub type AppResult<T> = Result<T, AppError>;

/// Convert domain results to app results
impl From<starscalendars_domain::DomainError> for AppError {
    fn from(err: starscalendars_domain::DomainError) -> Self {
        Self::Domain(err)
    }
}

/// Application layer errors
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Domain error: {0}")]
    Domain(#[from] starscalendars_domain::DomainError),

    #[error("Repository error: {0}")]
    Repository(String),

    #[error("External service error: {0}")]
    ExternalService(String),

    #[error("Configuration error: {0}")]
    Configuration(String),

    #[error("Authentication error: {0}")]
    Authentication(String),

    #[error("Authorization error: {0}")]
    Authorization(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Internal error: {0}")]
    Internal(String),
}
