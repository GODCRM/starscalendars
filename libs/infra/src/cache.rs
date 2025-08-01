//! Cache service implementations
//!
//! Redis-based caching with JSON serialization support.

use async_trait::async_trait;
use redis::aio::MultiplexedConnection;
use redis::{AsyncCommands, RedisResult};
use starscalendars_app::*;
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
    async fn get(&self, key: &str) -> AppResult<Option<String>> {
        let mut conn = self.conn.clone();
        let result: RedisResult<Option<String>> = conn.get(key).await;
        
        match result {
            Ok(value) => Ok(value),
            Err(e) => Err(InfraError::Redis(e).into()),
        }
    }
    
    async fn set(&self, key: &str, value: &str, ttl: Duration) -> AppResult<()> {
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
    
    async fn delete(&self, key: &str) -> AppResult<()> {
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
    async fn get(&self, key: &str) -> AppResult<Option<String>> {
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
    
    async fn set(&self, key: &str, value: &str, ttl: Duration) -> AppResult<()> {
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
    
    async fn delete(&self, key: &str) -> AppResult<()> {
        self.cache.remove(key);
        Ok(())
    }
}