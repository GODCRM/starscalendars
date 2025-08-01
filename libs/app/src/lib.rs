//! # StarsCalendars Application Layer
//!
//! Use cases and port interfaces following Clean Architecture principles.
//! This layer orchestrates business logic and defines contracts for
//! external dependencies through traits (ports).

pub mod ports;
pub mod usecases;

// Re-export main interfaces
pub use ports::*;
pub use usecases::*;

/// Application layer result type
pub type AppResult<T> = Result<T, AppError>;

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
    
    #[error("Internal error: {0}")]
    Internal(String),
}