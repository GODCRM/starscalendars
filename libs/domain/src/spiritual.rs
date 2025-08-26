//! Spiritual and astrological domain types

use serde::{Deserialize, Serialize};
// ❌ REMOVED: astronomical imports violate WASM-only architecture per tz.md
use uuid::Uuid;

/// Astrological system types
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum AstrologicalSystem {
    Western,
    Vedic,
    Chinese,
    Mayan,
}

/// Birth chart information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BirthChart {
    pub birth_time: f64, // Julian Day as f64 - calculated in WASM frontend only
    pub latitude: f64,
    pub longitude: f64,
    pub system: AstrologicalSystem,
}

/// Spiritual profile for personalized recommendations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpiritualProfile {
    pub preferred_system: AstrologicalSystem,
    pub birth_chart: Option<BirthChart>,
    pub interests: smallvec::SmallVec<[String; 8]>,
}

/// Spiritual event (e.g., Full Moon, New Moon, planetary alignment)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpiritualEvent {
    /// Unique event ID
    pub id: Uuid,
    /// Type of spiritual event
    pub event_type: String,
    /// Human-readable title
    pub title: String,
    /// Detailed description
    pub description: Option<String>,
    /// When the event occurs
    pub occurs_at: time::OffsetDateTime,
    /// Associated astronomical data
    pub astronomical_data: serde_json::Value,
    /// Quantum resonance level (0.0 - 1.0)
    pub quantum_resonance: Option<f64>,
}

impl SpiritualEvent {
    /// Create new spiritual event
    pub fn new(event_type: String, title: String, occurs_at: time::OffsetDateTime) -> Self {
        Self {
            id: Uuid::new_v4(),
            event_type,
            title,
            description: None,
            occurs_at,
            astronomical_data: serde_json::Value::Null,
            quantum_resonance: None,
        }
    }

    /// Check if event is in the future
    pub fn is_upcoming(&self) -> bool {
        self.occurs_at > time::OffsetDateTime::now_utc()
    }

    /// Check if event has high spiritual significance
    pub fn is_significant(&self) -> bool {
        self.quantum_resonance.map_or(false, |r| r > 0.8)
    }
}
