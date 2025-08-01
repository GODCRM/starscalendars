//! Spiritual and astrological domain types

use serde::{Deserialize, Serialize};
use crate::astronomical::{JulianDay, CelestialBody};

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