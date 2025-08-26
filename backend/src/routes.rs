//! Route definitions for the backend server

use crate::websocket::{WebSocketManager, websocket_handler};
use axum::{
    Router,
    extract::State,
    response::Json,
    routing::{get, post},
};
use serde_json::{Value, json};
use starscalendars_app::AppServices;
use std::sync::Arc;

/// Health check routes
pub fn health_routes() -> Router {
    Router::new()
        .route("/health", get(health_check))
        .route("/readiness", get(readiness_check))
}

/// Authentication routes
pub fn auth_routes() -> Router {
    Router::new()
        .route(
            "/auth/telegram",
            post(|| async { "Telegram auth endpoint" }),
        )
        .route("/auth/refresh", post(|| async { "Token refresh endpoint" }))
        .route("/auth/link", post(|| async { "Account linking endpoint" }))
}

/// API routes for astronomical data
pub fn api_routes() -> Router {
    Router::new()
        .route(
            "/api/ephemeris",
            get(|| async { "Ephemeris data endpoint" }),
        )
        .route(
            "/api/ephemeris/:date",
            get(|| async { "Historical ephemeris endpoint" }),
        )
        .route(
            "/api/user/profile",
            get(|| async { "User profile endpoint" }),
        )
}

/// WebSocket routes
pub fn websocket_routes() -> Router {
    Router::new().route("/ws", get(websocket_handler))
}

async fn health_check() -> Json<Value> {
    Json(json!({
        "status": "healthy",
        "service": "starscalendars-backend",
        "version": env!("CARGO_PKG_VERSION"),
        "timestamp": time::OffsetDateTime::now_utc()
    }))
}

async fn readiness_check(State(services): State<AppServices>) -> Json<Value> {
    let health_report = match services.health_check().await {
        Ok(report) => report,
        Err(e) => {
            return Json(json!({
                "status": "not_ready",
                "error": e.to_string()
            }));
        }
    };

    Json(json!({
        "status": if health_report.overall_healthy { "ready" } else { "not_ready" },
        "checks": {
            "cache": if health_report.cache_healthy { "healthy" } else { "unhealthy" },
            "jwt": if health_report.jwt_healthy { "healthy" } else { "unhealthy" },
            "telegram": if health_report.telegram_healthy { "healthy" } else { "unhealthy" }
        },
        "errors": health_report.errors
    }))
}
