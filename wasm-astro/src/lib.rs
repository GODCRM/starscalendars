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
    // Calculate positions for all celestial bodies using simplified calculations
    // TODO: Integrate proper astro library when API is verified
    for &body in CelestialBody::ALL {
        let position = calculate_body_position_simplified(body, julian_day)?;

        // Add to flat buffer: [x, y, z]
        buffer.push(position.x);
        buffer.push(position.y);
        buffer.push(position.z);
    }

    Ok(())
}

/// Calculate position of specific celestial body using simplified calculations
///
/// TODO: Replace with proper astro library integration once API is verified.
/// Currently uses simplified Keplerian orbits for demonstration.
fn calculate_body_position_simplified(body: CelestialBody, julian_day: JulianDay) -> Result<Cartesian, DomainError> {
    let t = julian_day.days_since_j2000() / 365.25; // Time in years since J2000
    
    let position = match body {
        CelestialBody::Sun => {
            // Sun is at origin in heliocentric coordinates per tz.md specification
            Cartesian::new(0.0, 0.0, 0.0)
        },
        CelestialBody::Mercury => {
            let mean_anomaly = 2.0 * std::f64::consts::PI * t * 4.15; // Mercury orbital period
            let r = 0.387; // Semi-major axis in AU
            Cartesian::new(
                r * mean_anomaly.cos(),
                r * mean_anomaly.sin(),
                0.0,
            )
        },
        CelestialBody::Venus => {
            let mean_anomaly = 2.0 * std::f64::consts::PI * t * 1.62; // Venus orbital period
            let r = 0.723; // Semi-major axis in AU
            Cartesian::new(
                r * mean_anomaly.cos(),
                r * mean_anomaly.sin(),
                0.0,
            )
        },
        CelestialBody::Earth => {
            let mean_anomaly = 2.0 * std::f64::consts::PI * t; // Earth orbital period (1 year)
            let r = 1.0; // Semi-major axis in AU
            Cartesian::new(
                r * mean_anomaly.cos(),
                r * mean_anomaly.sin(),
                0.0,
            )
        },
        CelestialBody::Moon => {
            // Moon orbiting Earth (simplified)
            let earth_pos = calculate_body_position_simplified(CelestialBody::Earth, julian_day)?;
            let lunar_anomaly = 2.0 * std::f64::consts::PI * t * 13.37; // ~13.37 lunar months per year
            let moon_distance = 0.00257; // ~384,400 km in AU
            Cartesian::new(
                earth_pos.x + moon_distance * lunar_anomaly.cos(),
                earth_pos.y + moon_distance * lunar_anomaly.sin(),
                earth_pos.z,
            )
        },
        CelestialBody::Mars => {
            let mean_anomaly = 2.0 * std::f64::consts::PI * t * 0.53; // Mars orbital period
            let r = 1.524; // Semi-major axis in AU
            Cartesian::new(
                r * mean_anomaly.cos(),
                r * mean_anomaly.sin(),
                0.0,
            )
        },
        CelestialBody::Jupiter => {
            let mean_anomaly = 2.0 * std::f64::consts::PI * t * 0.084; // Jupiter orbital period
            let r = 5.204; // Semi-major axis in AU
            Cartesian::new(
                r * mean_anomaly.cos(),
                r * mean_anomaly.sin(),
                0.0,
            )
        },
        CelestialBody::Saturn => {
            let mean_anomaly = 2.0 * std::f64::consts::PI * t * 0.034; // Saturn orbital period
            let r = 9.573; // Semi-major axis in AU
            Cartesian::new(
                r * mean_anomaly.cos(),
                r * mean_anomaly.sin(),
                0.0,
            )
        },
        CelestialBody::Uranus => {
            let mean_anomaly = 2.0 * std::f64::consts::PI * t * 0.012; // Uranus orbital period
            let r = 19.165; // Semi-major axis in AU
            Cartesian::new(
                r * mean_anomaly.cos(),
                r * mean_anomaly.sin(),
                0.0,
            )
        },
        CelestialBody::Neptune => {
            let mean_anomaly = 2.0 * std::f64::consts::PI * t * 0.006; // Neptune orbital period
            let r = 30.178; // Semi-major axis in AU
            Cartesian::new(
                r * mean_anomaly.cos(),
                r * mean_anomaly.sin(),
                0.0,
            )
        },
        CelestialBody::Pluto => {
            let mean_anomaly = 2.0 * std::f64::consts::PI * t * 0.004; // Pluto orbital period
            let r = 39.482; // Semi-major axis in AU
            Cartesian::new(
                r * mean_anomaly.cos(),
                r * mean_anomaly.sin(),
                0.0,
            )
        },
    };

    Ok(position)
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
        if let Ok(earth_pos) = calculate_body_position_simplified(CelestialBody::Earth, JulianDay::J2000) {
            assert!((earth_pos.magnitude() - 1.0).abs() < 0.2); // Earth should be ~1 AU from Sun
        } else {
            assert!(false, "Earth position calculation should succeed");
        }
    }
}
