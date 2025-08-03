//! Port interfaces for external dependencies
//!
//! Defines contracts that infrastructure adapters must implement.
//! These belong to the domain layer in Clean Architecture.

use async_trait::async_trait;
use crate::*;

/// Domain-wide result type for ports
pub type PortResult<T> = Result<T, DomainError>;

/// Repository port for user management
#[async_trait]
pub trait UserRepository: Send + Sync {
    async fn create_user(&self, user: User) -> PortResult<()>;
    async fn get_user_by_id(&self, id: &UserId) -> PortResult<Option<User>>;
    async fn get_user_by_username(&self, username: &str) -> PortResult<Option<User>>;
    async fn update_user(&self, user: &User) -> PortResult<()>;
    async fn delete_user(&self, id: &UserId) -> PortResult<()>;
}

/// Repository port for authentication tokens
#[async_trait]
pub trait TokenRepository: Send + Sync {
    async fn store_refresh_token(&self, token: &RefreshToken) -> PortResult<()>;
    async fn get_refresh_token(&self, token_hash: &str) -> PortResult<Option<RefreshToken>>;
    async fn revoke_refresh_token(&self, token_hash: &str) -> PortResult<()>;
    async fn store_linking_token(&self, token: &LinkingToken) -> PortResult<()>;
    async fn get_linking_token(&self, token: &uuid::Uuid) -> PortResult<Option<LinkingToken>>;
    async fn mark_linking_token_used(&self, token: &uuid::Uuid) -> PortResult<()>;
}

/// External service port for Telegram API
#[async_trait]
pub trait TelegramService: Send + Sync {
    async fn is_member_of_channel(&self, user_id: i64, channel: &str) -> PortResult<bool>;
    async fn send_message(&self, user_id: i64, message: &str) -> PortResult<()>;
    async fn get_user_info(&self, user_id: i64) -> PortResult<TelegramUserInfo>;
    async fn health_check(&self) -> PortResult<()>;
}

/// Cache port for performance optimization
#[async_trait]
pub trait CacheService: Send + Sync {
    /// Get cached value as JSON string
    async fn get(&self, key: &str) -> PortResult<Option<String>>;

    /// Set value as JSON string with TTL
    async fn set(&self, key: &str, value: &str, ttl: std::time::Duration) -> PortResult<()>;

    /// Delete cached value
    async fn delete(&self, key: &str) -> PortResult<()>;
}

/// Extension trait for generic cache operations
/// 
/// This is separate to maintain dyn compatibility of CacheService
pub trait CacheServiceExt: CacheService {
    /// Get and deserialize cached value
    async fn get_json<T>(&self, key: &str) -> PortResult<Option<T>>
    where
        T: serde::de::DeserializeOwned + Send,
    {
        match self.get(key).await? {
            Some(json_str) => {
                let value: T = serde_json::from_str(&json_str).map_err(|e| {
                    DomainError::SerializationError(format!("Cache deserialization error: {}", e))
                })?;
                Ok(Some(value))
            }
            None => Ok(None),
        }
    }

    /// Serialize and set cached value
    async fn set_json<T>(&self, key: &str, value: &T, ttl: std::time::Duration) -> PortResult<()>
    where
        T: serde::Serialize + Send + Sync,
    {
        let json_str = serde_json::to_string(value)
            .map_err(|e| DomainError::SerializationError(format!("Cache serialization error: {}", e)))?;
        self.set(key, &json_str, ttl).await
    }
}

// Automatically implement CacheServiceExt for all CacheService implementations
impl<T: CacheService + ?Sized> CacheServiceExt for T {}

/// JWT service port for token operations
#[async_trait]
pub trait JwtService: Send + Sync {
    async fn create_access_token(&self, claims: &JwtClaims) -> PortResult<String>;
    async fn validate_access_token(&self, token: &str) -> PortResult<JwtClaims>;
    async fn create_refresh_token(&self) -> PortResult<String>;
}

/// Astronomical calculation service port
#[async_trait]
pub trait AstronomicalService: Send + Sync {
    async fn calculate_planetary_positions(
        &self,
        julian_day: JulianDay,
    ) -> PortResult<Vec<CelestialBodyPosition>>;
    async fn calculate_spiritual_events(
        &self,
        start: time::OffsetDateTime,
        end: time::OffsetDateTime,
    ) -> PortResult<Vec<SpiritualEvent>>;
}

/// Telegram user information
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TelegramUserInfo {
    pub id: i64,
    pub username: Option<String>,
    pub first_name: String,
    pub last_name: Option<String>,
    pub is_bot: bool,
}