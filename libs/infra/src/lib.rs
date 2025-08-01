//! # StarsCalendars Infrastructure Layer
//!
//! Implementations of port interfaces for external services,
//! databases, caches, and third-party APIs.

pub mod database;
pub mod cache;
pub mod telegram;
pub mod jwt;
pub mod astronomical;
pub mod config;

// Re-export implementations
pub use database::*;
pub use cache::*;
pub use telegram::*;
pub use jwt::*;
pub use astronomical::*;
pub use config::*;

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

/// Convert infrastructure errors to application errors
impl From<InfraError> for starscalendars_app::AppError {
    fn from(err: InfraError) -> Self {
        match err {
            InfraError::Database(_) => starscalendars_app::AppError::Repository(err.to_string()),
            InfraError::Redis(_) => starscalendars_app::AppError::ExternalService(err.to_string()),
            InfraError::Http(_) => starscalendars_app::AppError::ExternalService(err.to_string()),
            InfraError::TelegramApi(_) => starscalendars_app::AppError::ExternalService(err.to_string()),
            InfraError::Configuration(_) => starscalendars_app::AppError::Configuration(err.to_string()),
            _ => starscalendars_app::AppError::Internal(err.to_string()),
        }
    }
}