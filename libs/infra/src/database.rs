//! Database implementations for PostgreSQL
//!
//! Repository adapters implementing the port interfaces using SQLx.

use async_trait::async_trait;
use sqlx::PgPool;
use starscalendars_app::*;
use starscalendars_domain::*;
use crate::InfraError;

/// PostgreSQL implementation of UserRepository
pub struct PostgresUserRepository {
    pool: PgPool,
}

impl PostgresUserRepository {
    /// Create new PostgreSQL user repository
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl UserRepository for PostgresUserRepository {
    async fn create_user(&self, user: User) -> AppResult<()> {
        sqlx::query!(
            r#"
            INSERT INTO users (id, username, email, telegram_user_id, created_at, updated_at, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            "#,
            user.id.as_uuid(),
            user.username,
            user.email,
            user.telegram_user_id.map(|id| id.as_i64()),
            user.created_at,
            user.updated_at,
            user.is_active
        )
        .execute(&self.pool)
        .await
        .map_err(|e| InfraError::Database(e))?;
        
        Ok(())
    }
    
    async fn get_user_by_id(&self, id: &UserId) -> AppResult<Option<User>> {
        let row = sqlx::query!(
            "SELECT id, username, email, telegram_user_id, created_at, updated_at, is_active FROM users WHERE id = $1",
            id.as_uuid()
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| InfraError::Database(e))?;
        
        match row {
            Some(row) => {
                let telegram_user_id = row.telegram_user_id
                    .map(|id| TelegramUserId::new(id))
                    .transpose()
                    .map_err(|e| InfraError::Internal(format!("Invalid telegram user ID: {}", e)))?;
                
                Ok(Some(User {
                    id: UserId::from_uuid(row.id),
                    username: row.username,
                    email: row.email,
                    telegram_user_id,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                    is_active: row.is_active,
                }))
            }
            None => Ok(None),
        }
    }
    
    async fn get_user_by_username(&self, username: &str) -> AppResult<Option<User>> {
        let row = sqlx::query!(
            "SELECT id, username, email, telegram_user_id, created_at, updated_at, is_active FROM users WHERE username = $1",
            username
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| InfraError::Database(e))?;
        
        match row {
            Some(row) => {
                let telegram_user_id = row.telegram_user_id
                    .map(|id| TelegramUserId::new(id))
                    .transpose()
                    .map_err(|e| InfraError::Internal(format!("Invalid telegram user ID: {}", e)))?;
                
                Ok(Some(User {
                    id: UserId::from_uuid(row.id),
                    username: row.username,
                    email: row.email,
                    telegram_user_id,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                    is_active: row.is_active,
                }))
            }
            None => Ok(None),
        }
    }
    
    async fn update_user(&self, user: &User) -> AppResult<()> {
        sqlx::query!(
            r#"
            UPDATE users 
            SET username = $2, email = $3, telegram_user_id = $4, updated_at = $5, is_active = $6
            WHERE id = $1
            "#,
            user.id.as_uuid(),
            user.username,
            user.email,
            user.telegram_user_id.map(|id| id.as_i64()),
            user.updated_at,
            user.is_active
        )
        .execute(&self.pool)
        .await
        .map_err(|e| InfraError::Database(e))?;
        
        Ok(())
    }
    
    async fn delete_user(&self, id: &UserId) -> AppResult<()> {
        sqlx::query!(
            "DELETE FROM users WHERE id = $1",
            id.as_uuid()
        )
        .execute(&self.pool)
        .await
        .map_err(|e| InfraError::Database(e))?;
        
        Ok(())
    }
}

/// PostgreSQL implementation of TokenRepository
pub struct PostgresTokenRepository {
    pool: PgPool,
}

impl PostgresTokenRepository {
    /// Create new PostgreSQL token repository
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl TokenRepository for PostgresTokenRepository {
    async fn store_refresh_token(&self, token: &RefreshToken) -> AppResult<()> {
        sqlx::query!(
            r#"
            INSERT INTO refresh_tokens (id, user_id, token_hash, created_at, expires_at, is_revoked)
            VALUES ($1, $2, $3, $4, $5, $6)
            "#,
            token.id,
            token.user_id.as_uuid(),
            token.token_hash,
            token.created_at,
            token.expires_at,
            token.is_revoked
        )
        .execute(&self.pool)
        .await
        .map_err(|e| InfraError::Database(e))?;
        
        Ok(())
    }
    
    async fn get_refresh_token(&self, token_hash: &str) -> AppResult<Option<RefreshToken>> {
        let row = sqlx::query!(
            "SELECT id, user_id, token_hash, created_at, expires_at, is_revoked FROM refresh_tokens WHERE token_hash = $1",
            token_hash
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| InfraError::Database(e))?;
        
        match row {
            Some(row) => Ok(Some(RefreshToken {
                id: row.id,
                user_id: UserId::from_uuid(row.user_id),
                token_hash: row.token_hash,
                created_at: row.created_at,
                expires_at: row.expires_at,
                is_revoked: row.is_revoked,
            })),
            None => Ok(None),
        }
    }
    
    async fn revoke_refresh_token(&self, token_hash: &str) -> AppResult<()> {
        sqlx::query!(
            "UPDATE refresh_tokens SET is_revoked = true WHERE token_hash = $1",
            token_hash
        )
        .execute(&self.pool)
        .await
        .map_err(|e| InfraError::Database(e))?;
        
        Ok(())
    }
    
    async fn store_linking_token(&self, token: &LinkingToken) -> AppResult<()> {
        sqlx::query!(
            r#"
            INSERT INTO linking_tokens (token, user_id, created_at, expires_at, is_used)
            VALUES ($1, $2, $3, $4, $5)
            "#,
            token.token,
            token.user_id.as_uuid(),
            token.created_at,
            token.expires_at,
            token.is_used
        )
        .execute(&self.pool)
        .await
        .map_err(|e| InfraError::Database(e))?;
        
        Ok(())
    }
    
    async fn get_linking_token(&self, token: &uuid::Uuid) -> AppResult<Option<LinkingToken>> {
        let row = sqlx::query!(
            "SELECT token, user_id, created_at, expires_at, is_used FROM linking_tokens WHERE token = $1",
            token
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| InfraError::Database(e))?;
        
        match row {
            Some(row) => Ok(Some(LinkingToken {
                token: row.token,
                user_id: UserId::from_uuid(row.user_id),
                created_at: row.created_at,
                expires_at: row.expires_at,
                is_used: row.is_used,
            })),
            None => Ok(None),
        }
    }
    
    async fn mark_linking_token_used(&self, token: &uuid::Uuid) -> AppResult<()> {
        sqlx::query!(
            "UPDATE linking_tokens SET is_used = true WHERE token = $1",
            token
        )
        .execute(&self.pool)
        .await
        .map_err(|e| InfraError::Database(e))?;
        
        Ok(())
    }
}