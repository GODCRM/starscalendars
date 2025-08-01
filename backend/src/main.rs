//! # StarsCalendars Backend Server
//!
//! Axum-based HTTP/WebSocket server with Clean Architecture,
//! Telegram authentication, and real-time astronomical calculations.

use anyhow::Result;
use axum::{Router, serve};
use std::net::SocketAddr;
use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;
use tracing::{info, error};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

mod handlers;
mod middleware;
mod websocket;
mod routes;

use starscalendars_infra::AppConfig;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| "starscalendars_backend=debug,tower_http=debug".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

    info!("🌟 Starting StarsCalendars Backend Server");
    
    // Load configuration
    let config = AppConfig::load()
        .map_err(|e| anyhow::anyhow!("Failed to load configuration: {}", e))?;
    
    info!("📋 Configuration loaded successfully");
    
    // Initialize services (dependency injection)
    let _services = initialize_services(&config).await
        .map_err(|e| anyhow::anyhow!("Failed to initialize services: {}", e))?;
    
    info!("🔧 Services initialized successfully");
    
    // Build application routes
    let app = build_app().await?;
    
    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.server.port));
    let listener = TcpListener::bind(addr).await?;
    
    info!("🚀 Server starting on {}", addr);
    info!("📡 WebSocket endpoint: ws://{}/ws");
    info!("🔗 Health check: http://{}/health");
    
    serve(listener, app)
        .await
        .map_err(|e| anyhow::anyhow!("Server error: {}", e))?;
    
    Ok(())
}

async fn build_app() -> Result<Router> {
    let app = Router::new()
        .merge(routes::health_routes())
        .merge(routes::auth_routes())
        .merge(routes::api_routes())
        .merge(routes::websocket_routes())
        .layer(CorsLayer::permissive())
        .layer(middleware::request_id_layer())
        .layer(middleware::logging_layer());
    
    Ok(app)
}

async fn initialize_services(_config: &AppConfig) -> Result<()> {
    // TODO: Initialize database connection pool
    // TODO: Initialize Redis connection
    // TODO: Initialize Telegram bot client
    // TODO: Initialize JWT service
    // TODO: Initialize astronomical calculation service
    // TODO: Create dependency injection container
    
    info!("⚠️  Service initialization stubbed - implement in next phase");
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_build_app() {
        if let Ok(app) = build_app().await {
            // Basic smoke test
            assert!(!format!("{:?}", app).is_empty());
        } else {
            assert!(false, "Failed to build app for test");
        }
    }
}