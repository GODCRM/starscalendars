//! Authentication and authorization domain types
//!
//! JWT-based authentication with Telegram integration and subscription verification

use serde::{Deserialize, Serialize};
use std::fmt;
use uuid::Uuid;

/// User identifier type
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct UserId(Uuid);

impl UserId {
    /// Generate a new random user ID
    pub fn new() -> Self {
        Self(Uuid::new_v4())
    }
    
    /// Create from UUID
    pub fn from_uuid(id: Uuid) -> Self {
        Self(id)
    }
    
    /// Parse from string representation
    pub fn parse(s: &str) -> crate::DomainResult<Self> {
        Uuid::parse_str(s)
            .map(Self)
            .map_err(|_| crate::DomainError::InvalidUserId(s.to_string()))
    }
    
    /// Get the underlying UUID
    pub fn as_uuid(&self) -> Uuid {
        self.0
    }
}

impl fmt::Display for UserId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl Default for UserId {
    fn default() -> Self {
        Self::new()
    }
}

/// Telegram user identifier
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct TelegramUserId(i64);

impl TelegramUserId {
    /// Create new Telegram user ID with validation
    pub fn new(id: i64) -> crate::DomainResult<Self> {
        if id <= 0 {
            return Err(crate::DomainError::InvalidTelegramUserId(id));
        }
        Ok(Self(id))
    }
    
    /// Get the underlying i64 value
    pub fn as_i64(self) -> i64 {
        self.0
    }
}

impl fmt::Display for TelegramUserId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

/// JWT token pair for authentication
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JwtTokenPair {
    /// Short-lived access token (15 minutes)
    pub access_token: String,
    /// Long-lived refresh token (30 days)
    pub refresh_token: String,
    /// Token type (always "Bearer")
    pub token_type: String,
    /// Access token expiration in seconds
    pub expires_in: u64,
}

impl JwtTokenPair {
    /// Create new JWT token pair
    pub fn new(access_token: String, refresh_token: String, expires_in: u64) -> Self {
        Self {
            access_token,
            refresh_token,
            token_type: "Bearer".to_string(),
            expires_in,
        }
    }
}

/// JWT claims for access tokens
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JwtClaims {
    /// Subject (user ID)
    pub sub: String,
    /// Issued at timestamp
    pub iat: i64,
    /// Expiration timestamp
    pub exp: i64,
    /// Telegram user ID (if linked)
    pub telegram_user_id: Option<i64>,
    /// Telegram subscription status
    pub is_telegram_subscribed: bool,
    /// User roles
    pub roles: smallvec::SmallVec<[String; 4]>,
}

impl JwtClaims {
    /// Create new JWT claims
    pub fn new(
        user_id: &UserId,
        telegram_user_id: Option<TelegramUserId>,
        is_subscribed: bool,
        roles: &[String],
    ) -> Self {
        let now = time::OffsetDateTime::now_utc().unix_timestamp();
        let exp = now + 900; // 15 minutes
        
        Self {
            sub: user_id.to_string(),
            iat: now,
            exp,
            telegram_user_id: telegram_user_id.map(|id| id.as_i64()),
            is_telegram_subscribed: is_subscribed,
            roles: roles.iter().cloned().collect(),
        }
    }
    
    /// Check if token is expired
    pub fn is_expired(&self) -> bool {
        let now = time::OffsetDateTime::now_utc().unix_timestamp();
        now >= self.exp
    }
    
    /// Check if user has required role
    pub fn has_role(&self, role: &str) -> bool {
        self.roles.iter().any(|r| r == role)
    }
    
    /// Check if user has premium subscription
    pub fn has_premium_access(&self) -> bool {
        self.is_telegram_subscribed || self.has_role("premium") || self.has_role("admin")
    }
}

/// Refresh token information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefreshToken {
    /// Token ID
    pub id: Uuid,
    /// Associated user ID
    pub user_id: UserId,
    /// Token hash (for security)
    pub token_hash: String,
    /// Creation timestamp
    pub created_at: time::OffsetDateTime,
    /// Expiration timestamp
    pub expires_at: time::OffsetDateTime,
    /// Whether token is revoked
    pub is_revoked: bool,
}

impl RefreshToken {
    /// Create new refresh token
    pub fn new(user_id: UserId, token_hash: String) -> Self {
        let now = time::OffsetDateTime::now_utc();
        let expires_at = now + time::Duration::days(30);
        
        Self {
            id: Uuid::new_v4(),
            user_id,
            token_hash,
            created_at: now,
            expires_at,
            is_revoked: false,
        }
    }
    
    /// Check if refresh token is valid
    pub fn is_valid(&self) -> bool {
        !self.is_revoked && self.expires_at > time::OffsetDateTime::now_utc()
    }
    
    /// Revoke the refresh token
    pub fn revoke(&mut self) {
        self.is_revoked = true;
    }
}

/// Account linking token for Telegram integration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LinkingToken {
    /// Token UUID
    pub token: Uuid,
    /// Associated user ID
    pub user_id: UserId,
    /// Creation timestamp
    pub created_at: time::OffsetDateTime,
    /// Expiration timestamp (5 minutes)
    pub expires_at: time::OffsetDateTime,
    /// Whether token was used
    pub is_used: bool,
}

impl LinkingToken {
    /// Create new linking token
    pub fn new(user_id: UserId) -> Self {
        let now = time::OffsetDateTime::now_utc();
        let expires_at = now + time::Duration::minutes(5);
        
        Self {
            token: Uuid::new_v4(),
            user_id,
            created_at: now,
            expires_at,
            is_used: false,
        }
    }
    
    /// Check if linking token is valid
    pub fn is_valid(&self) -> bool {
        !self.is_used && self.expires_at > time::OffsetDateTime::now_utc()
    }
    
    /// Mark token consumed
    pub fn mark_used(&mut self) {
        self.is_used = true;
    }
}

/// User authentication status
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum AuthStatus {
    /// User is authenticated
    Authenticated {
        user_id: UserId,
        telegram_linked: bool,
        subscription_active: bool,
    },
    /// User is not authenticated
    Unauthenticated,
    /// Authentication expired
    Expired,
    /// Authentication is invalid
    Invalid,
}

impl AuthStatus {
    /// Check if user is authenticated
    pub fn is_authenticated(&self) -> bool {
        matches!(self, Self::Authenticated { .. })
    }
    
    /// Check if user has premium access
    pub fn has_premium_access(&self) -> bool {
        match self {
            Self::Authenticated { subscription_active, .. } => *subscription_active,
            _ => false,
        }
    }
    
    /// Get user ID if authenticated
    pub fn user_id(&self) -> Option<&UserId> {
        match self {
            Self::Authenticated { user_id, .. } => Some(user_id),
            _ => None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_user_id_generation() {
        let id1 = UserId::new();
        let id2 = UserId::new();
        assert_ne!(id1, id2);
    }
    
    #[test]
    fn test_telegram_user_id_validation() {
        assert!(TelegramUserId::new(12345).is_ok());
        assert!(TelegramUserId::new(-1).is_err());
        assert!(TelegramUserId::new(0).is_err());
    }
    
    #[test]
    fn test_jwt_claims_expiration() {
        let user_id = UserId::new();
        let claims = JwtClaims::new(&user_id, None, false, &[]);
        
        // Should not be expired immediately
        assert!(!claims.is_expired());
    }
    
    #[test]
    fn test_refresh_token_validity() {
        let user_id = UserId::new();
        let mut token = RefreshToken::new(user_id, "hash".to_string());
        
        assert!(token.is_valid());
        
        token.revoke();
        assert!(!token.is_valid());
    }
    
    #[test]
    fn test_linking_token_expiration() {
        let user_id = UserId::new();
        let mut token = LinkingToken::new(user_id);
        
        assert!(token.is_valid());
        
        token.mark_used();
        assert!(!token.is_valid());
    }
    
    #[test]
    fn test_auth_status() {
        let user_id = UserId::new();
        let status = AuthStatus::Authenticated {
            user_id: user_id.clone(),
            telegram_linked: true,
            subscription_active: true,
        };
        
        assert!(status.is_authenticated());
        assert!(status.has_premium_access());
        assert_eq!(status.user_id(), Some(&user_id));
    }
}