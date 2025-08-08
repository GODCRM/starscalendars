//! Use cases for application business logic

use async_trait::async_trait;
use starscalendars_domain::*;
use crate::{ports::*, AppResult};
use std::sync::Arc;

mod auth;
// mod astronomical; // ❌ REMOVED: violates WASM-only architecture per tz.md
mod user;

pub use auth::*;
// pub use astronomical::*; // ❌ REMOVED: WASM-only calculations
pub use user::*;

/// Dependency injection container for use cases
/// 
/// ❌ CORRECTED: Removed astronomical_service per tz.md WASM-only architecture requirement  
#[derive(Clone)]
pub struct AppServices {
    pub user_repo: Arc<dyn UserRepository>,
    pub token_repo: Arc<dyn TokenRepository>,
    pub telegram_service: Arc<dyn TelegramService>,
    pub cache_service: Arc<dyn CacheService>,
    pub jwt_service: Arc<dyn JwtService>,
    // ❌ REMOVED: astronomical_service (violates WASM-only architecture)
}

impl AppServices {
    pub fn new(
        user_repo: Arc<dyn UserRepository>,
        token_repo: Arc<dyn TokenRepository>,
        telegram_service: Arc<dyn TelegramService>,
        cache_service: Arc<dyn CacheService>,
        jwt_service: Arc<dyn JwtService>,
        // ❌ REMOVED: astronomical_service parameter (WASM-only per tz.md)
    ) -> Self {
        Self {
            user_repo,
            token_repo,
            telegram_service,
            cache_service,
            jwt_service,
            // ❌ REMOVED: astronomical_service field (WASM-only per tz.md)
        }
    }
}