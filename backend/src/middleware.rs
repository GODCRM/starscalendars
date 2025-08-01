//! Middleware for request processing

use axum::extract::Request;
use tower::{Layer, Service};
use tower_http::{request_id::RequestIdLayer, trace::TraceLayer};
use uuid::Uuid;

/// Request ID middleware layer
pub fn request_id_layer() -> RequestIdLayer {
    RequestIdLayer::new(|| Uuid::new_v4().to_string())
}

/// Logging middleware layer
pub fn logging_layer() -> TraceLayer<tower_http::classify::SharedClassifier<tower_http::classify::ServerErrorsAsFailures>> {
    TraceLayer::new_for_http()
}