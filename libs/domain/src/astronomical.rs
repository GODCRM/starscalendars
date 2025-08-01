//! Astronomical domain types and calculations
//!
//! High-precision ephemeris calculations following IAU standards
//! with O(1) performance guarantees for real-time visualization.

use serde::{Deserialize, Serialize};
use std::ops::{Add, Sub};

/// Julian Day representation for astronomical time
/// 
/// Thread-safe, Copy type for high-performance calculations
#[derive(Debug, Clone, Copy, PartialEq, PartialOrd, Serialize, Deserialize)]
pub struct JulianDay(pub f64);

impl JulianDay {
    /// J2000.0 epoch (January 1, 2000, 12:00 TT)
    pub const J2000: Self = Self(2451545.0);
    
    /// Creates a new Julian Day with validation
    pub fn new(jd: f64) -> crate::DomainResult<Self> {
        if jd.is_finite() && jd > 0.0 {
            Ok(Self(jd))
        } else {
            Err(crate::DomainError::InvalidJulianDay(jd))
        }
    }
    
    /// Get the underlying f64 value
    #[inline]
    pub fn as_f64(self) -> f64 {
        self.0
    }
    
    /// Days since J2000.0 epoch
    #[inline]
    pub fn days_since_j2000(self) -> f64 {
        self.0 - Self::J2000.0
    }
}

impl Add<f64> for JulianDay {
    type Output = Self;
    
    #[inline]
    fn add(self, days: f64) -> Self::Output {
        Self(self.0 + days)
    }
}

impl Sub<f64> for JulianDay {
    type Output = Self;
    
    #[inline]
    fn sub(self, days: f64) -> Self::Output {
        Self(self.0 - days)
    }
}

/// Ecliptic spherical coordinates (longitude, latitude, radius)
/// 
/// J2000.0 ecliptic coordinate system for high precision
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct EclipticSpherical {
    /// Ecliptic longitude in radians
    pub lon_rad: f64,
    /// Ecliptic latitude in radians  
    pub lat_rad: f64,
    /// Heliocentric distance in AU
    pub r_au: f64,
}

impl EclipticSpherical {
    /// Creates new ecliptic coordinates with validation
    pub fn new(lon_rad: f64, lat_rad: f64, r_au: f64) -> crate::DomainResult<Self> {
        if !lon_rad.is_finite() || !lat_rad.is_finite() || !r_au.is_finite() {
            return Err(crate::DomainError::InvalidCoordinates);
        }
        
        if r_au <= 0.0 {
            return Err(crate::DomainError::InvalidDistance(r_au));
        }
        
        Ok(Self { lon_rad, lat_rad, r_au })
    }
}

/// Cartesian coordinates for 3D scene positioning
/// 
/// Optimized for Babylon.js Vector3 interop with zero-copy conversion
#[derive(Debug, Clone, Copy, PartialEq, Default, Serialize, Deserialize)]
pub struct Cartesian {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

impl Cartesian {
    /// Zero vector constant
    pub const ZERO: Self = Self { x: 0.0, y: 0.0, z: 0.0 };
    
    /// Creates new Cartesian coordinates
    #[inline]
    pub fn new(x: f64, y: f64, z: f64) -> Self {
        Self { x, y, z }
    }
    
    /// Convert from ecliptic spherical coordinates
    /// 
    /// High-performance conversion without allocations
    #[inline]
    pub fn from_ecliptic_spherical(s: &EclipticSpherical) -> Self {
        let clat = s.lat_rad.cos();
        let x = s.r_au * clat * s.lon_rad.cos();
        let y = s.r_au * clat * s.lon_rad.sin();
        let z = s.r_au * s.lat_rad.sin();
        Self { x, y, z }
    }
    
    /// Distance from origin
    #[inline]
    pub fn magnitude(self) -> f64 {
        (self.x * self.x + self.y * self.y + self.z * self.z).sqrt()
    }
}

/// Celestial body identifiers
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum CelestialBody {
    Sun,
    Moon,
    Mercury,
    Venus,
    Earth,
    Mars,
    Jupiter,
    Saturn,
    Uranus,
    Neptune,
    Pluto,
}

impl CelestialBody {
    /// All major celestial bodies for calculations
    pub const ALL: &'static [Self] = &[
        Self::Sun, Self::Moon, Self::Mercury, Self::Venus,
        Self::Earth, Self::Mars, Self::Jupiter, Self::Saturn,
        Self::Uranus, Self::Neptune, Self::Pluto,
    ];
    
    /// Get display name for UI
    pub fn name(self) -> &'static str {
        match self {
            Self::Sun => "Sun",
            Self::Moon => "Moon",
            Self::Mercury => "Mercury",
            Self::Venus => "Venus",
            Self::Earth => "Earth",
            Self::Mars => "Mars",
            Self::Jupiter => "Jupiter",
            Self::Saturn => "Saturn",
            Self::Uranus => "Uranus",
            Self::Neptune => "Neptune",
            Self::Pluto => "Pluto",
        }
    }
}

/// Pre-calculated ephemeris data for WASM interop
/// 
/// Optimized for Float64Array view without copying
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EphemerisData {
    /// Julian Day for this calculation
    pub julian_day: JulianDay,
    /// Positions of all celestial bodies
    pub positions: smallvec::SmallVec<[Cartesian; 11]>,
    /// Calculation timestamp for caching
    pub calculated_at: time::OffsetDateTime,
}

impl EphemerisData {
    /// Create new ephemeris data with pre-allocated capacity
    pub fn new(julian_day: JulianDay) -> Self {
        Self {
            julian_day,
            positions: smallvec::SmallVec::with_capacity(11),
            calculated_at: time::OffsetDateTime::now_utc(),
        }
    }
    
    /// Add position for celestial body
    pub fn add_position(&mut self, body: CelestialBody, position: Cartesian) -> crate::DomainResult<()> {
        if self.positions.len() >= 11 {
            return Err(crate::DomainError::EphemerisCapacityExceeded);
        }
        
        self.positions.push(position);
        Ok(())
    }
    
    /// Convert to flat f64 array for WASM interop
    /// 
    /// Layout: [x1, y1, z1, x2, y2, z2, ...] for direct Float64Array view
    pub fn to_flat_array(&self) -> smallvec::SmallVec<[f64; 33]> {
        let mut result = smallvec::SmallVec::with_capacity(33);
        
        for pos in &self.positions {
            result.push(pos.x);
            result.push(pos.y);
            result.push(pos.z);
        }
        
        result
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_julian_day_validation() {
        assert!(JulianDay::new(2451545.0).is_ok());
        assert!(JulianDay::new(-1.0).is_err());
        assert!(JulianDay::new(f64::NAN).is_err());
    }
    
    #[test]
    fn test_coordinate_conversion() {
        if let Ok(ecliptic) = EclipticSpherical::new(0.0, 0.0, 1.0) {
            let cartesian = Cartesian::from_ecliptic_spherical(&ecliptic);
            
            assert!((cartesian.x - 1.0).abs() < f64::EPSILON);
            assert!(cartesian.y.abs() < f64::EPSILON);
            assert!(cartesian.z.abs() < f64::EPSILON);
        } else {
            assert!(false, "Failed to create valid ecliptic coordinates");
        }
    }
    
    #[test]
    fn test_ephemeris_flat_array() {
        let mut ephemeris = EphemerisData::new(JulianDay::J2000);
        
        if ephemeris.add_position(CelestialBody::Sun, Cartesian::new(1.0, 2.0, 3.0)).is_ok() {
            let flat = ephemeris.to_flat_array();
            assert_eq!(flat.len(), 3);
            assert_eq!(flat[0], 1.0);
            assert_eq!(flat[1], 2.0);
            assert_eq!(flat[2], 3.0);
        } else {
            assert!(false, "Failed to add position to ephemeris");
        }
    }
}