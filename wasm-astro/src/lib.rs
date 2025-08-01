//! # StarsCalendars WASM Astronomical Core
//!
//! High-performance astronomical calculations compiled to WebAssembly.
//! Follows O(1) горячий путь principle with exactly one compute_all(t) call per frame.
//!
//! ## Performance Requirements
//! - Exactly one `compute_all(julian_day)` call per frame
//! - Zero-copy data transfer via Float64Array view
//! - Thread-local buffer for ephemeris data
//! - No allocations in hot path
//! - No string passing between WASM-JS

use wasm_bindgen::prelude::*;
use starscalendars_domain::*;
use std::cell::RefCell;

// Enable console.log for debugging
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

/// Thread-local buffer for ephemeris data (O(1) горячий путь requirement)
///
/// Pre-allocated buffer that can hold all planetary positions in flat f64 array.
/// Layout: [x1, y1, z1, x2, y2, z2, ...] for direct Float64Array view
thread_local! {
    static EPHEMERIS_BUFFER: RefCell<Vec<f64>> = RefCell::new(Vec::with_capacity(33));
}

/// WASM module initialization
#[wasm_bindgen(start)]
pub fn init() {
    // Set panic hook for better error messages in development
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();

    console_log!("🚀 StarsCalendars WASM Astronomical Core initialized");
}

/// **CRITICAL O(1) FUNCTION**: Compute all planetary positions for given Julian Day
///
/// This is the ONLY function that should be called per frame from JavaScript.
/// Returns pointer to thread-local buffer for zero-copy Float64Array view.
///
/// **Performance Contract:**
/// - Exactly one call per frame
/// - O(1) complexity for buffer access
/// - Zero allocations in hot path
/// - No string marshalling
///
/// **Usage from JavaScript:**
/// ```javascript
/// const ptr = compute_all(julian_day);
/// const positions = new Float64Array(memory.buffer, ptr, 33);
/// ```
#[wasm_bindgen]
pub fn compute_all(julian_day: f64) -> *const f64 {
    EPHEMERIS_BUFFER.with(|buffer| {
        let mut buf = buffer.borrow_mut();
        buf.clear(); // O(1) clear without deallocation

        // Validate Julian Day
        let jd = match JulianDay::new(julian_day) {
            Ok(jd) => jd,
            Err(_) => {
                console_log!("❌ Invalid Julian Day: {}", julian_day);
                return std::ptr::null();
            }
        };

        // Calculate all planetary positions
        match calculate_all_positions(jd, &mut buf) {
            Ok(_) => buf.as_ptr(),
            Err(e) => {
                console_log!("❌ Calculation error: {:?}", e);
                std::ptr::null()
            }
        }
    })
}

/// Get the number of celestial bodies (for JavaScript buffer size calculation)
#[wasm_bindgen]
pub fn get_body_count() -> usize {
    CelestialBody::ALL.len()
}

/// Get the total number of coordinates (bodies * 3 for x,y,z)
#[wasm_bindgen]
pub fn get_coordinate_count() -> usize {
    CelestialBody::ALL.len() * 3
}

/// **PERFORMANCE CRITICAL**: Calculate all planetary positions
///
/// Uses pre-allocated buffer to avoid any allocations in hot path.
/// Implements high-precision ephemeris calculations following IAU standards.
fn calculate_all_positions(
    julian_day: JulianDay,
    buffer: &mut Vec<f64>,
) -> Result<(), DomainError> {
    // Calculate positions for all celestial bodies using astro-rust high-precision algorithms
    // ✅ IMPLEMENTED: Full astro-rust integration with VSOP87, ELP-2000/82, and Pluto calculations
    for &body in CelestialBody::ALL {
        let position = calculate_body_position_precise(body, julian_day)?;

        // Add to flat buffer: [x, y, z]
        buffer.push(position.x);
        buffer.push(position.y);
        buffer.push(position.z);
    }

    Ok(())
}

/// Calculate position of specific celestial body using local astro-rust library  
///
/// 🚨 CRITICAL: Uses ONLY astro-rust API functions - NO custom formulas!
/// Implements high-precision VSOP87, ELP-2000/82, and Pluto calculations for all celestial bodies.
/// Uses the local astro-rust library with critical bug fixes (decimal_day & lunar equations).
fn calculate_body_position_precise(body: CelestialBody, julian_day: JulianDay) -> Result<Cartesian, DomainError> {
    let jd = julian_day.as_f64();
    
    let position = match body {
        CelestialBody::Sun => {
            // Sun geocentric ecliptic position using corrected astro-rust fork
            let (sun_ecl, sun_dist_km) = astro::sun::geocent_ecl_pos(jd);
            // Convert km to AU (1 AU ≈ 149,597,870.7 km)
            let sun_dist_au = sun_dist_km / 149597870.7;
            ecliptic_to_cartesian(sun_ecl.long, sun_ecl.lat, sun_dist_au)
        },
        CelestialBody::Moon => {
            // Moon geocentric ecliptic position using corrected ELP-2000/82 theory
            let (moon_ecl, moon_dist_km) = astro::lunar::geocent_ecl_pos(jd);
            // Convert km to AU
            let moon_dist_au = moon_dist_km / 149597870.7;
            ecliptic_to_cartesian(moon_ecl.long, moon_ecl.lat, moon_dist_au)
        },
        CelestialBody::Mercury => {
            // Mercury heliocentric position using VSOP87 theory
            let (long_rad, lat_rad, radius_au) = astro::planet::heliocent_coords(&astro::planet::Planet::Mercury, jd);
            ecliptic_to_cartesian(long_rad, lat_rad, radius_au)
        },
        CelestialBody::Venus => {
            // Venus heliocentric position using VSOP87 theory
            let (long_rad, lat_rad, radius_au) = astro::planet::heliocent_coords(&astro::planet::Planet::Venus, jd);
            ecliptic_to_cartesian(long_rad, lat_rad, radius_au)
        },
        CelestialBody::Earth => {
            // Earth heliocentric position using VSOP87 theory
            let (long_rad, lat_rad, radius_au) = astro::planet::heliocent_coords(&astro::planet::Planet::Earth, jd);
            ecliptic_to_cartesian(long_rad, lat_rad, radius_au)
        },
        CelestialBody::Mars => {
            // Mars heliocentric position using VSOP87 theory
            let (long_rad, lat_rad, radius_au) = astro::planet::heliocent_coords(&astro::planet::Planet::Mars, jd);
            ecliptic_to_cartesian(long_rad, lat_rad, radius_au)
        },
        CelestialBody::Jupiter => {
            // Jupiter heliocentric position using VSOP87 theory
            let (long_rad, lat_rad, radius_au) = astro::planet::heliocent_coords(&astro::planet::Planet::Jupiter, jd);
            ecliptic_to_cartesian(long_rad, lat_rad, radius_au)
        },
        CelestialBody::Saturn => {
            // Saturn heliocentric position using VSOP87 theory
            let (long_rad, lat_rad, radius_au) = astro::planet::heliocent_coords(&astro::planet::Planet::Saturn, jd);
            ecliptic_to_cartesian(long_rad, lat_rad, radius_au)
        },
        CelestialBody::Uranus => {
            // Uranus heliocentric position using VSOP87 theory
            let (long_rad, lat_rad, radius_au) = astro::planet::heliocent_coords(&astro::planet::Planet::Uranus, jd);
            ecliptic_to_cartesian(long_rad, lat_rad, radius_au)
        },
        CelestialBody::Neptune => {
            // Neptune heliocentric position using VSOP87 theory
            let (long_rad, lat_rad, radius_au) = astro::planet::heliocent_coords(&astro::planet::Planet::Neptune, jd);
            ecliptic_to_cartesian(long_rad, lat_rad, radius_au)
        },
        CelestialBody::Pluto => {
            // Pluto calculation using high-precision heliocentric coordinates
            let (long_rad, lat_rad, radius_au) = astro::pluto::heliocent_pos(jd);
            ecliptic_to_cartesian(long_rad, lat_rad, radius_au)
        },
    };

    Ok(position)
}

/// Convert ecliptic spherical coordinates to Cartesian
/// 
/// High-performance coordinate transformation without allocations.
/// Input coordinates are in RADIANS (as returned by astro-rust API).
#[inline]
fn ecliptic_to_cartesian(longitude_rad: f64, latitude_rad: f64, radius_au: f64) -> Cartesian {
    let cos_lat = latitude_rad.cos();
    let x = radius_au * cos_lat * longitude_rad.cos();
    let y = radius_au * cos_lat * longitude_rad.sin();
    let z = radius_au * latitude_rad.sin();
    Cartesian::new(x, y, z)
}

/// Get version information
#[wasm_bindgen]
pub fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// **DEVELOPMENT ONLY**: Get current buffer contents in JSON string format
///
/// **DO NOT USE IN PRODUCTION** - violates no-string-passing rule
#[wasm_bindgen]
#[cfg(debug_assertions)]
pub fn debug_get_buffer() -> String {
    EPHEMERIS_BUFFER.with(|buffer| {
        let buf = buffer.borrow();
        format!("{:?}", buf.as_slice())
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_julian_day_calculation() {
        let jd = JulianDay::J2000;
        let result = compute_all(jd.as_f64());
        assert!(!result.is_null());
    }

    #[test]
    fn test_coordinate_count() {
        assert_eq!(get_coordinate_count(), 11 * 3); // 11 bodies * 3 coordinates each
    }

    #[test]
    fn test_body_position_calculation() {
        if let Ok(earth_pos) = calculate_body_position_precise(CelestialBody::Earth, JulianDay::J2000) {
            assert!((earth_pos.magnitude() - 1.0).abs() < 0.2); // Earth should be ~1 AU from Sun
        } else {
            assert!(false, "Earth position calculation should succeed");
        }
    }
}
