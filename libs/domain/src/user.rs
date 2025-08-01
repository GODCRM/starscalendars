//! User management domain types

use serde::{Deserialize, Serialize};
use crate::auth::{UserId, TelegramUserId};

/// User profile information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: UserId,
    pub username: String,
    pub email: Option<String>,
    pub telegram_user_id: Option<TelegramUserId>,
    pub created_at: time::OffsetDateTime,
    pub updated_at: time::OffsetDateTime,
    pub is_active: bool,
}

/// User role in the system
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum UserRole {
    User,
    Premium,
    Admin,
}

impl UserRole {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::User => "user",
            Self::Premium => "premium",
            Self::Admin => "admin",
        }
    }
}