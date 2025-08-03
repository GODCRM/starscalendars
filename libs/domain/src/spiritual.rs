//! Spiritual and astrological domain types

use serde::{Deserialize, Serialize};
use crate::astronomical::{JulianDay, CelestialBody};
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
    pub birth_time: JulianDay,
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

/// Types of spiritual events
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SpiritualEventType {
    /// New Moon phase
    NewMoon,
    /// Full Moon phase
    FullMoon,
    /// First Quarter Moon
    FirstQuarter,
    /// Last Quarter Moon
    LastQuarter,
    /// Solar Eclipse
    SolarEclipse,
    /// Lunar Eclipse
    LunarEclipse,
    /// Planetary Conjunction
    PlanetaryConjunction,
    /// Planetary Opposition
    PlanetaryOpposition,
    /// Equinox
    Equinox,
    /// Solstice
    Solstice,
    /// Meteor Shower
    MeteorShower,
    /// Custom spiritual event
    Custom,
}

/// Spiritual recommendation based on astronomical data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpiritualRecommendation {
    /// Event type
    pub event_type: SpiritualEventType,
    /// Event title
    pub title: String,
    /// Event description
    pub description: String,
    /// Recommended practices
    pub practices: Vec<String>,
    /// Astrological significance
    pub significance: String,
    /// Astronomical data for the event
    pub astronomical_data: serde_json::Value,
}

impl SpiritualRecommendation {
    /// Create new spiritual recommendation
    pub fn new(
        event_type: SpiritualEventType,
        title: String,
        description: String,
        practices: Vec<String>,
        significance: String,
    ) -> Self {
        Self {
            event_type,
            title,
            description,
            practices,
            significance,
            astronomical_data: serde_json::Value::Null,
        }
    }
    
    /// Add astronomical data to the recommendation
    pub fn with_astronomical_data(mut self, data: serde_json::Value) -> Self {
        self.astronomical_data = data;
        self
    }
}