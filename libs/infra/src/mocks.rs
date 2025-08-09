//! Mock implementations for testing
//!
//! Provides mock services that implement the same interfaces as production services
//! but with predictable behavior for testing.

use async_trait::async_trait;
// Use only domain types for Clean Architecture
use crate::InfraError;
use starscalendars_domain::*;
use std::sync::Arc;

/// Mock user repository for testing
pub struct MockUserRepository {
    users: dashmap::DashMap<UserId, User>,
}

impl MockUserRepository {
    pub fn new() -> Self {
        Self {
            users: dashmap::DashMap::with_capacity(100),
        }
    }

    pub fn add_user(&self, user: User) {
        self.users.insert(user.id.clone(), user);
    }
}

impl Default for MockUserRepository {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl UserRepository for MockUserRepository {
    async fn create_user(&self, user: User) -> PortResult<()> {
        self.users.insert(user.id.clone(), user);
        Ok(())
    }

    async fn get_user_by_id(&self, id: &UserId) -> PortResult<Option<User>> {
        Ok(self.users.get(id).map(|user| user.clone()))
    }

    async fn get_user_by_username(&self, username: &str) -> PortResult<Option<User>> {
        Ok(self
            .users
            .iter()
            .find(|entry| entry.username == username)
            .map(|entry| entry.clone()))
    }

    async fn update_user(&self, user: &User) -> PortResult<()> {
        self.users.insert(user.id.clone(), user.clone());
        Ok(())
    }

    async fn delete_user(&self, id: &UserId) -> PortResult<()> {
        self.users.remove(id);
        Ok(())
    }
}

/// Mock token repository for testing
pub struct MockTokenRepository {
    refresh_tokens: dashmap::DashMap<String, RefreshToken>,
    linking_tokens: dashmap::DashMap<uuid::Uuid, LinkingToken>,
}

impl MockTokenRepository {
    pub fn new() -> Self {
        Self {
            refresh_tokens: dashmap::DashMap::with_capacity(100),
            linking_tokens: dashmap::DashMap::with_capacity(100),
        }
    }
}

impl Default for MockTokenRepository {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl TokenRepository for MockTokenRepository {
    async fn store_refresh_token(&self, token: &RefreshToken) -> PortResult<()> {
        self.refresh_tokens
            .insert(token.token_hash.clone(), token.clone());
        Ok(())
    }

    async fn get_refresh_token(&self, token_hash: &str) -> PortResult<Option<RefreshToken>> {
        Ok(self
            .refresh_tokens
            .get(token_hash)
            .map(|token| token.clone()))
    }

    async fn revoke_refresh_token(&self, token_hash: &str) -> PortResult<()> {
        if let Some(mut token) = self.refresh_tokens.get_mut(token_hash) {
            token.is_revoked = true;
        }
        Ok(())
    }

    async fn store_linking_token(&self, token: &LinkingToken) -> PortResult<()> {
        self.linking_tokens.insert(token.token, token.clone());
        Ok(())
    }

    async fn get_linking_token(&self, token: &uuid::Uuid) -> PortResult<Option<LinkingToken>> {
        Ok(self.linking_tokens.get(token).map(|token| token.clone()))
    }

    async fn mark_linking_token_used(&self, token: &uuid::Uuid) -> PortResult<()> {
        if let Some(mut linking_token) = self.linking_tokens.get_mut(token) {
            linking_token.is_used = true;
        }
        Ok(())
    }
}

// ❌ ARCHITECTURAL VIOLATION REMOVED:
// Mock astronomical service with hardcoded planetary positions violates tz.md WASM-only architecture.
//
// **VIOLATION DETAILS:**
// - Contained hardcoded CelestialBodyPosition data (lines 126-137 in original)
// - Mock Sun at (0,0,0) and Earth at (1,0,0) coordinates
// - Violates "ВСЕ астрономические расчеты ТОЛЬКО в WASM модуле на клиенте" requirement
//
// **CORRECT APPROACH:**
// All planetary positions must come from WASM compute_state(julian_day) function only.
// Infrastructure layer provides ONLY external service adapters (PostgreSQL, Redis, Telegram, JWT).
