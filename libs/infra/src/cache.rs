//! Cache service implementations
//!
//! Redis-based caching with JSON serialization support.

use async_trait::async_trait;
use redis::aio::MultiplexedConnection;
use redis::{AsyncCommands, RedisResult};
use starscalendars_domain::*;
use std::time::Duration;
use crate::InfraError;

/// Redis implementation of CacheService
pub struct RedisCacheService {
    conn: MultiplexedConnection,
}

impl RedisCacheService {
    /// Create new Redis cache service
    pub fn new(conn: MultiplexedConnection) -> Self {
        Self { conn }
    }
}

#[async_trait]
impl CacheService for RedisCacheService {
    async fn get(&self, key: &str) -> PortResult<Option<String>> {
        let mut conn = self.conn.clone();
        let result: RedisResult<Option<String>> = conn.get(key).await;
        
        match result {
            Ok(value) => Ok(value),
            Err(e) => Err(InfraError::Redis(e).into()),
        }
    }
    
    async fn set(&self, key: &str, value: &str, ttl: Duration) -> PortResult<()> {
        let mut conn = self.conn.clone();
        let ttl_secs = ttl.as_secs();
        
        let result: redis::RedisResult<()> = if ttl_secs > 0 {
            conn.set_ex(key, value, ttl_secs).await
        } else {
            conn.set(key, value).await
        };
        
        result.map_err(|e| InfraError::Redis(e))?;
        
        Ok(())
    }
    
    async fn delete(&self, key: &str) -> PortResult<()> {
        let mut conn = self.conn.clone();
        let _: () = conn.del(key).await
            .map_err(|e| InfraError::Redis(e))?;
        
        Ok(())
    }
}

/// In-memory cache implementation for testing and development
pub struct InMemoryCacheService {
    cache: dashmap::DashMap<String, CacheEntry>,
}

#[derive(Debug, Clone)]
struct CacheEntry {
    value: String,
    expires_at: Option<std::time::Instant>,
}

impl InMemoryCacheService {
    /// Create new in-memory cache service
    pub fn new() -> Self {
        Self {
            cache: dashmap::DashMap::with_capacity(1000), // Pre-allocated capacity
        }
    }
    
    /// Cleanup expired entries (should be called periodically)
    pub fn cleanup_expired(&self) {
        let now = std::time::Instant::now();
        
        self.cache.retain(|_, entry| {
            entry.expires_at.map_or(true, |expires_at| expires_at > now)
        });
    }
}

impl Default for InMemoryCacheService {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl CacheService for InMemoryCacheService {
    async fn get(&self, key: &str) -> PortResult<Option<String>> {
        let now = std::time::Instant::now();
        
        match self.cache.get(key) {
            Some(entry) => {
                // Check if expired
                if let Some(expires_at) = entry.expires_at {
                    if expires_at <= now {
                        // Entry expired, remove it
                        self.cache.remove(key);
                        return Ok(None);
                    }
                }
                Ok(Some(entry.value.clone()))
            }
            None => Ok(None),
        }
    }
    
    async fn set(&self, key: &str, value: &str, ttl: Duration) -> PortResult<()> {
        let expires_at = if ttl.as_secs() > 0 {
            Some(std::time::Instant::now() + ttl)
        } else {
            None
        };
        
        let entry = CacheEntry {
            value: value.to_string(),
            expires_at,
        };
        
        self.cache.insert(key.to_string(), entry);
        Ok(())
    }
    
    async fn delete(&self, key: &str) -> PortResult<()> {
        self.cache.remove(key);
        Ok(())
    }
}

/// Enhanced cache service with Telegram subscription caching
pub struct TelegramCacheService {
    cache: Box<dyn CacheService + Send + Sync>,
}

impl TelegramCacheService {
    /// Create new Telegram cache service
    pub fn new(cache: Box<dyn CacheService + Send + Sync>) -> Self {
        Self { cache }
    }
    
    /// Cache Telegram subscription status
    pub async fn cache_subscription_status(
        &self,
        user_id: i64,
        is_subscribed: bool,
    ) -> PortResult<()> {
        let key = format!("telegram:subscription:{}", user_id);
        let value = if is_subscribed { "true" } else { "false" };
        
        // Cache for 5 minutes to reduce Telegram API calls
        self.cache.set(&key, value, Duration::from_secs(300)).await
    }
    
    /// Get cached subscription status
    pub async fn get_subscription_status(&self, user_id: i64) -> PortResult<Option<bool>> {
        let key = format!("telegram:subscription:{}", user_id);
        
        match self.cache.get(&key).await? {
            Some(value) => Ok(Some(value == "true")),
            None => Ok(None),
        }
    }
    
    /// Cache user linking token
    pub async fn cache_linking_token(
        &self,
        token: &uuid::Uuid,
        user_id: &starscalendars_domain::UserId,
    ) -> PortResult<()> {
        let key = format!("telegram:linking:{}", token);
        let value = user_id.uuid().to_string();
        
        // Cache for 10 minutes (same as token expiry)
        self.cache.set(&key, &value, Duration::from_secs(600)).await
    }
    
    /// Get cached linking token
    pub async fn get_linking_token(
        &self,
        token: &uuid::Uuid,
    ) -> PortResult<Option<starscalendars_domain::UserId>> {
        let key = format!("telegram:linking:{}", token);
        
        match self.cache.get(&key).await? {
            Some(value) => {
                let user_uuid = uuid::Uuid::parse_str(&value)
                    .map_err(|e| InfraError::Internal(format!("Invalid UUID in cache: {}", e)))?;
                Ok(Some(starscalendars_domain::UserId::from_uuid(user_uuid)))
            }
            None => Ok(None),
        }
    }
}

#[async_trait]
impl CacheService for TelegramCacheService {
    async fn get(&self, key: &str) -> PortResult<Option<String>> {
        self.cache.get(key).await
    }
    
    async fn set(&self, key: &str, value: &str, ttl: Duration) -> PortResult<()> {
        self.cache.set(key, value, ttl).await
    }
    
    async fn delete(&self, key: &str) -> PortResult<()> {
        self.cache.delete(key).await
    }
}