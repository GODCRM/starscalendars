//! Authentication and authorization domain types
//!
//! JWT-based authentication with Telegram integration and subscription verification

use serde::{Serialize, Deserialize};
use crate::{DomainResult, DomainError};
use crate::telegram::{TelegramUserId, LinkingToken};
use crate::user::UserId;
use time::{OffsetDateTime, Duration};
use uuid::Uuid;

/// JWT claims for authentication
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JwtClaims {
    /// Subject (user ID)
    pub sub: String,
    /// Expiration time (Unix timestamp)
    pub exp: i64,
    /// Issued at (Unix timestamp)
    pub iat: i64,
    /// Is Telegram subscribed (custom claim)
    pub is_telegram_subscribed: bool,
    /// Telegram user ID (optional)
    pub telegram_user_id: Option<i64>,
    /// User role
    pub role: UserRole,
}

/// User role for authorization
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum UserRole {
    /// Free tier user
    Free,
    /// Premium subscriber
    Premium,
    /// Administrator
    Admin,
}

impl UserRole {
    /// Check if role has premium access
    pub fn has_premium_access(&self) -> bool {
        matches!(self, UserRole::Premium | UserRole::Admin)
    }
    
    /// Check if role has admin access
    pub fn has_admin_access(&self) -> bool {
        matches!(self, UserRole::Admin)
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
    pub created_at: OffsetDateTime,
    /// Expiration timestamp
    pub expires_at: OffsetDateTime,
    /// Whether token is revoked
    pub is_revoked: bool,
}

impl RefreshToken {
    /// Create new refresh token
    pub fn new(user_id: UserId, token_hash: String) -> Self {
        let now = OffsetDateTime::now_utc();
        let expires_at = now + Duration::days(30);
        
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
        !self.is_revoked && self.expires_at > OffsetDateTime::now_utc()
    }
    
    /// Revoke the refresh token
    pub fn revoke(&mut self) {
        self.is_revoked = true;
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