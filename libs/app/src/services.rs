//! Application services container
//!
//! Dependency injection container for all application services.
//! Production-ready initialization with health checks and error handling.

use std::sync::Arc;
use tracing::{info, error};
use crate::AppError;

/// Application services container
#[derive(Clone)]
pub struct AppServices {
    pub user_repository: Arc<dyn crate::UserRepository + Send + Sync>,
    pub token_repository: Arc<dyn crate::TokenRepository + Send + Sync>,
    pub cache_service: Arc<dyn crate::CacheService + Send + Sync>,
    pub jwt_service: Arc<dyn crate::JwtService + Send + Sync>,
    pub telegram_service: Arc<dyn crate::TelegramService + Send + Sync>,
    pub astronomical_service: Arc<dyn crate::AstronomicalService + Send + Sync>,
}

impl AppServices {
    /// Create new application services container with production dependencies
    pub async fn new_production(
        config: &starscalendars_infra::AppConfig,
    ) -> Result<Self, AppError> {
        info!("🏗️ Initializing production application services");
        
        // Initialize database service and run migrations
        let database_service = starscalendars_infra::DatabaseService::new(&config.database)
            .await
            .map_err(|e| AppError::Configuration(format!("Database initialization failed: {}", e)))?;
        
        database_service.run_migrations()
            .await
            .map_err(|e| AppError::Configuration(format!("Database migrations failed: {}", e)))?;
        
        // Initialize cache service
        let cache_manager = starscalendars_infra::CacheServiceManager::new(&config.redis)
            .await
            .map_err(|e| AppError::Configuration(format!("Redis cache initialization failed: {}", e)))?;
        
        let redis_cache = cache_manager.create_cache_service()
            .await
            .map_err(|e| AppError::Configuration(format!("Redis cache service creation failed: {}", e)))?;
        
        let telegram_cache = starscalendars_infra::TelegramCacheService::new(
            Box::new(redis_cache)
        );
        
        // Initialize JWT service with production keys
        let jwt_service = match (
            std::env::var("JWT_PRIVATE_KEY_PATH"),
            std::env::var("JWT_PUBLIC_KEY_PATH")
        ) {
            (Ok(private_path), Ok(public_path)) => {
                let private_key = std::fs::read(&private_path)
                    .map_err(|e| AppError::Configuration(format!("Failed to read private key: {}", e)))?;
                let public_key = std::fs::read(&public_path)
                    .map_err(|e| AppError::Configuration(format!("Failed to read public key: {}", e)))?;
                
                starscalendars_infra::JwtServiceImpl::new(&private_key, &public_key)
                    .map_err(|e| AppError::Configuration(format!("JWT service initialization failed: {}", e)))?
            }
            _ => {
                info!("⚠️ Using generated JWT keys for development");
                starscalendars_infra::JwtServiceImpl::new_with_generated_keys()
                    .map_err(|e| AppError::Configuration(format!("JWT service initialization failed: {}", e)))?
            }
        };
        
        // Initialize Telegram service
        let telegram_service = starscalendars_infra::TelegramServiceImpl::new(
            &config.telegram.bot_token,
            &config.telegram.channel_username,
            Arc::new(telegram_cache.clone()),
        )
        .await
        .map_err(|e| AppError::Configuration(format!("Telegram service initialization failed: {}", e)))?;
        
        // Initialize repositories
        let user_repository = starscalendars_infra::PostgresUserRepository::new(
            database_service.pool().clone()
        );
        
        let token_repository = starscalendars_infra::PostgresTokenRepository::new(
            database_service.pool().clone()
        );
        
        // Initialize astronomical service
        let astronomical_service = starscalendars_infra::AstronomicalServiceImpl::new();
        
        info!("✅ All production services initialized successfully");
        
        Ok(Self {
            user_repository: Arc::new(user_repository),
            token_repository: Arc::new(token_repository),
            cache_service: Arc::new(telegram_cache),
            jwt_service: Arc::new(jwt_service),
            telegram_service: Arc::new(telegram_service),
            astronomical_service: Arc::new(astronomical_service),
        })
    }
    
    /// Create new application services container for testing
    pub fn new_test() -> Self {
        info!("🧪 Initializing test application services");
        
        let in_memory_cache = starscalendars_infra::InMemoryCacheService::new();
        let telegram_cache = starscalendars_infra::TelegramCacheService::new(
            Box::new(in_memory_cache)
        );
        
        Self {
            user_repository: Arc::new(starscalendars_infra::MockUserRepository::new()),
            token_repository: Arc::new(starscalendars_infra::MockTokenRepository::new()),
            cache_service: Arc::new(telegram_cache),
            jwt_service: Arc::new(starscalendars_infra::MockJwtService::new()),
            telegram_service: Arc::new(starscalendars_infra::MockTelegramService::new()),
            astronomical_service: Arc::new(starscalendars_infra::MockAstronomicalService::new()),
        }
    }
    
    /// Perform health checks on all services
    pub async fn health_check(&self) -> Result<ServiceHealthReport, AppError> {
        let mut report = ServiceHealthReport::new();
        
        // Check cache service
        match self.cache_service.get("health_check").await {
            Ok(_) => report.cache_healthy = true,
            Err(e) => {
                report.cache_healthy = false;
                report.errors.push(format!("Cache health check failed: {}", e));
            }
        }
        
        // Check JWT service
        let test_claims = crate::JwtClaims::new(
            &starscalendars_domain::UserId::new(),
            Some("test".to_string()),
            false,
            &[]
        );
        
        match self.jwt_service.create_access_token(&test_claims).await {
            Ok(token) => {
                match self.jwt_service.validate_access_token(&token).await {
                    Ok(_) => report.jwt_healthy = true,
                    Err(e) => {
                        report.jwt_healthy = false;
                        report.errors.push(format!("JWT validation failed: {}", e));
                    }
                }
            }
            Err(e) => {
                report.jwt_healthy = false;
                report.errors.push(format!("JWT creation failed: {}", e));
            }
        }
        
        // Check Telegram service
        match self.telegram_service.health_check().await {
            Ok(_) => report.telegram_healthy = true,
            Err(e) => {
                report.telegram_healthy = false;
                report.errors.push(format!("Telegram health check failed: {}", e));
            }
        }
        
        report.overall_healthy = report.cache_healthy && report.jwt_healthy && report.telegram_healthy;
        
        if report.overall_healthy {
            info!("✅ All services healthy");
        } else {
            error!("❌ Service health check failed: {:?}", report.errors);
        }
        
        Ok(report)
    }
}

/// Service health report
#[derive(Debug, Clone)]
pub struct ServiceHealthReport {
    pub overall_healthy: bool,
    pub cache_healthy: bool,
    pub jwt_healthy: bool,
    pub telegram_healthy: bool,
    pub errors: Vec<String>,
}

impl ServiceHealthReport {
    fn new() -> Self {
        Self {
            overall_healthy: false,
            cache_healthy: false,
            jwt_healthy: false,
            telegram_healthy: false,
            errors: Vec::with_capacity(5),
        }
    }
}