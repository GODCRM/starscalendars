//! Domain-specific error types
//!
//! Comprehensive error handling for the domain layer with structured
//! error information for debugging and user feedback.

use serde::{Deserialize, Serialize};
use thiserror::Error;

/// Domain layer errors
/// 
/// All errors are serializable for WASM interop and structured logging
#[derive(Debug, Clone, Error, Serialize, Deserialize)]
pub enum DomainError {
    // ❌ REMOVED: Astronomical validation errors - moved to WASM frontend per tz.md
    // InvalidJulianDay, InvalidCoordinates, InvalidDistance, EphemerisCapacityExceeded, UnsupportedCelestialBody
    // All astronomical validation is now performed in WASM module only
    
    // Authentication and authorization errors
    #[error("Invalid user ID format: {0}")]
    InvalidUserId(String),
    
    #[error("Invalid Telegram user ID: {0}")]
    InvalidTelegramUserId(i64),
    
    #[error("Invalid Telegram channel ID: {0}")]
    InvalidTelegramChannelId(i64),
    
    #[error("Authentication session expired")]
    AuthSessionExpired,
    
    #[error("Authentication verification not completed")]
    AuthVerificationNotCompleted,
    
    #[error("Invalid JWT token format")]
    InvalidJwtToken,
    
    #[error("JWT token expired at {0}")]
    JwtTokenExpired(time::OffsetDateTime),
    
    #[error("Invalid refresh token")]
    InvalidRefreshToken,
    
    #[error("User not authorized for this operation")]
    Unauthorized,
    
    #[error("Subscription required for premium features")]
    SubscriptionRequired,
    
    // User management errors
    #[error("Invalid username format: {0}")]
    InvalidUsername(String),
    
    #[error("Invalid email format: {0}")]
    InvalidEmail(String),
    
    #[error("User not found: {0}")]
    UserNotFound(String),
    
    #[error("Username already exists: {0}")]
    UsernameExists(String),
    
    #[error("Email already exists: {0}")]
    EmailExists(String),
    
    // Spiritual/astrological errors
    #[error("Invalid birth data: {0}")]
    InvalidBirthData(String),
    
    #[error("Unsupported astrological system: {0}")]
    UnsupportedAstrologicalSystem(String),
    
    #[error("Invalid spiritual profile data")]
    InvalidSpiritualProfile,
    
    // Validation errors
    #[error("Validation failed: {field} - {message}")]
    ValidationFailed { field: String, message: String },
    
    #[error("Business rule violation: {0}")]
    BusinessRuleViolation(String),
    
    // Serialization errors
    #[error("Serialization error: {0}")]
    SerializationError(String),
    
    // External service errors (for infrastructure layer)
    #[error("External service error: {0}")]
    ExternalServiceError(String),
    
    #[error("Configuration error: {0}")]
    ConfigurationError(String),
    
    #[error("Internal error: {0}")]
    InternalError(String),
    
    // Generic domain errors
    #[error("Domain operation failed: {0}")]
    OperationFailed(String),
    
    #[error("Invalid state transition: from {from} to {to}")]
    InvalidStateTransition { from: String, to: String },
}

impl DomainError {
    /// Create a validation error with field and message
    pub fn validation(field: impl Into<String>, message: impl Into<String>) -> Self {
        Self::ValidationFailed {
            field: field.into(),
            message: message.into(),
        }
    }
    
    /// Create a business rule violation error
    pub fn business_rule(message: impl Into<String>) -> Self {
        Self::BusinessRuleViolation(message.into())
    }
    
    /// Create an operation failed error
    pub fn operation_failed(message: impl Into<String>) -> Self {
        Self::OperationFailed(message.into())
    }
    
    /// Check if error is related to authentication
    pub fn is_auth_error(&self) -> bool {
        matches!(
            self,
            Self::InvalidJwtToken
                | Self::JwtTokenExpired(_)
                | Self::InvalidRefreshToken
                | Self::Unauthorized
                | Self::SubscriptionRequired
        )
    }
    
    /// Check if error is a validation error
    pub fn is_validation_error(&self) -> bool {
        matches!(self, Self::ValidationFailed { .. })
    }
    
    /// Get error category for logging and metrics
    pub fn category(&self) -> &'static str {
        match self {
            // ❌ REMOVED: Astronomical error categories - WASM-only per tz.md
            
            Self::InvalidUserId(_)
            | Self::InvalidTelegramUserId(_)
            | Self::InvalidTelegramChannelId(_)
            | Self::AuthSessionExpired
            | Self::AuthVerificationNotCompleted
            | Self::InvalidJwtToken
            | Self::JwtTokenExpired(_)
            | Self::InvalidRefreshToken
            | Self::Unauthorized
            | Self::SubscriptionRequired => "auth",
            
            Self::InvalidUsername(_)
            | Self::InvalidEmail(_)
            | Self::UserNotFound(_)
            | Self::UsernameExists(_)
            | Self::EmailExists(_) => "user",
            
            Self::InvalidBirthData(_)
            | Self::UnsupportedAstrologicalSystem(_)
            | Self::InvalidSpiritualProfile => "spiritual",
            
            Self::ValidationFailed { .. }
            | Self::BusinessRuleViolation(_) => "validation",
            
            Self::SerializationError(_) => "serialization",
            
            Self::ExternalServiceError(_)
            | Self::ConfigurationError(_)
            | Self::InternalError(_) => "infrastructure",
            
            Self::OperationFailed(_)
            | Self::InvalidStateTransition { .. } => "generic",
        }
    }
}

/// Result type alias for domain operations
pub type DomainResult<T> = Result<T, DomainError>;

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_error_serialization() {
        // ❌ UPDATED: Test with auth error instead of removed astronomical error
        let error = DomainError::Unauthorized;
        
        if let Ok(json) = serde_json::to_string(&error) {
            if let Ok(deserialized) = serde_json::from_str::<DomainError>(&json) {
                assert!(matches!(deserialized, DomainError::Unauthorized));
            } else {
                assert!(false, "Failed to deserialize domain error");
            }
        } else {
            assert!(false, "Failed to serialize domain error");
        }
    }
    
    #[test]
    fn test_error_categories() {
        // ❌ UPDATED: Test only non-astronomical error categories per WASM-only architecture
        assert_eq!(DomainError::Unauthorized.category(), "auth");
        assert_eq!(DomainError::UserNotFound("test".to_string()).category(), "user");
        assert_eq!(DomainError::ValidationFailed { field: "test".to_string(), message: "invalid".to_string() }.category(), "validation");
    }
    
    #[test]
    fn test_validation_helper() {
        let error = DomainError::validation("username", "too short");
        assert!(error.is_validation_error());
        assert_eq!(error.category(), "validation");
    }
}