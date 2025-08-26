//! Configuration management

use figment::{
    Figment,
    providers::{Env, Format, Toml},
};
use serde::{Deserialize, Serialize};

/// Application configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub redis: RedisConfig,
    pub telegram: TelegramConfig,
    pub jwt: JwtConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RedisConfig {
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelegramConfig {
    pub bot_token: String,
    pub channel_username: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JwtConfig {
    pub secret: String,
    pub access_token_ttl: u64,
    pub refresh_token_ttl: u64,
}

impl AppConfig {
    pub fn load() -> Result<Self, crate::InfraError> {
        let config = Figment::new()
            .merge(Toml::file("config.toml")) // optional dev-only; safe to delete in minimal setups
            .merge(Env::prefixed("STARS_"))
            .extract()
            .map_err(|e| crate::InfraError::Configuration(e.to_string()))?;

        Ok(config)
    }
}
