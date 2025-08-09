/**
 * WASM Astronomical Module Integration (TypeScript 5.9.2 + Babylon.js 8.21.0)
 *
 * High-performance WASM integration with zero-copy data transfer and strict typing.
 * Implements exactly one compute_all() call per frame for O(1) performance.
 */

import type {
  PositionBuffer,
  WASMError
} from './types.js';
import {
  validateJulianDay,
  validateWASMBuffer,
  WASM_CONSTANTS,
  WASMErrorType
} from './types.js';

// ✅ CORRECT - Result type pattern for strict error handling (TypeScript 5.9.2+)
export type Result<T, E> = { success: true; data: T } | { success: false; error: E };

// ✅ CORRECT - Strict interface definitions for astronomical data (FIXED: Cartesian from WASM)
export interface CelestialPosition {
  readonly x: number;          // Cartesian X coordinate (AU)
  readonly y: number;          // Cartesian Y coordinate (AU)
  readonly z: number;          // Cartesian Z coordinate (AU)
  readonly distance: number;   // Distance from origin (AU)
  readonly timestamp: number;  // Milliseconds since epoch
}

export interface AstronomicalState {
  readonly sun: CelestialPosition;
  readonly earth: CelestialPosition;
  readonly moon: CelestialPosition;
  readonly earthSunDistance: number; // Earth distance from Sun in AU
  readonly sunZenithLat: number;     // Latitude where Sun is in zenith (degrees N-positive)
  readonly sunZenithLng: number;     // Longitude where Sun is in zenith (degrees E-positive)
  readonly sunZenithLatRad: number;  // Latitude in radians
  readonly sunZenithLngRad: number;  // Longitude in radians (E-positive)
}

// ✅ CORRECT - WASM module interface with strict typing for spiritual astronomy
export interface WASMModule {
  readonly compute_all: (julianDay: number) => number;
  readonly get_body_count: () => number;
  readonly get_coordinate_count: () => number;
  readonly get_version: () => string;
  readonly memory: WebAssembly.Memory;

  // Precise solar zenith calculation (returns pointer to [lon_deg_W_positive, lat_deg])
  readonly calculate_solar_zenith_position?: ((julianDay: number) => number) | undefined;
  // High-precision radians variant (returns pointer to [lon_east_rad, lat_rad])
  readonly calculate_solar_zenith_position_rad?: ((julianDay: number) => number) | undefined;

  // 🌌 QUANTUM SPIRITUAL ASTRONOMY FUNCTIONS
  readonly calculate_earth_orbit: (julianDay: number) => number;
  readonly calculate_moon_orbit: (julianDay: number) => number;
  readonly get_movement_direction: (currentDistance: number, orbitalPhase: number) => number;
  readonly calculate_days_after_passage: (julianDay: number, orbitalPhase: number, orbitalPeriodDays: number) => number;
  readonly calculate_lunar_phase_detailed: (julianDay: number) => number;

  // ⭐ STELLAR COORDINATE TRANSFORMATION FUNCTIONS for createSky
  readonly transform_stellar_coordinates: (raHours: number, decDegrees: number, magnitude: number, starScale: number, radius: number) => number;
  readonly calculate_constellation_line: (star1RaHours: number, star1DecDeg: number, star2RaHours: number, star2DecDeg: number, radius: number) => number;
  readonly apply_stellar_precession: (catalogRaHours: number, catalogDecDegrees: number, catalogEpochJd: number, currentJd: number) => number;
  readonly calculate_astrological_aspects: (julianDay: number) => number;
}

// ✅ CORRECT - Performance monitoring for WASM operations
class WASMPerformanceTimer {
  private readonly operationName: string;
  private readonly startTime: number;

  constructor(operationName: string) {
    this.operationName = operationName;
    this.startTime = performance.now();
    console.log(`🚀 WASM: Starting ${operationName}`);
  }

  public mark(checkpoint: string): void {
    const currentTime = performance.now();
    const duration = currentTime - this.startTime;
    console.log(`📊 WASM: ${this.operationName} - ${checkpoint} at ${duration.toFixed(3)}ms`);
  }
}

// ✅ CORRECT - Global WASM module state
let globalWasmModule: WASMModule | null = null;
let isInitialized = false;
let initializationPromise: Promise<WASMModule> | null = null;

/**
 * Initialize WASM module with runtime module loading
 */
export const initializeWASM = async (): Promise<WASMModule> => {
  // Singleton pattern to prevent multiple initializations
  if (isInitialized && globalWasmModule) {
    return globalWasmModule;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async (): Promise<WASMModule> => {
    const timer = new WASMPerformanceTimer('wasm_module_initialization');

    try {
      // Runtime module loading to avoid TypeScript compilation issues
      const loadWASMModule = async (): Promise<{
        init: () => Promise<void>;
        compute_all: (jd: number) => number;
        get_body_count: () => number;
        get_coordinate_count: () => number;
        get_version: () => string;
        memory: WebAssembly.Memory;
        // Spiritual astronomy functions (optional - may not be available in all builds)
        calculate_earth_orbit?: (jd: number) => number;
        calculate_moon_orbit?: (jd: number) => number;
        get_movement_direction?: (currentDistance: number, orbitalPhase: number) => number;
        calculate_days_after_passage?: (jd: number, orbitalPhase: number, orbitalPeriodDays: number) => number;
        calculate_lunar_phase_detailed?: (jd: number) => number;
        transform_stellar_coordinates?: (raHours: number, decDegrees: number, magnitude: number, starScale: number, radius: number) => number;
        calculate_constellation_line?: (star1RaHours: number, star1DecDeg: number, star2RaHours: number, star2DecDeg: number, radius: number) => number;
        apply_stellar_precession?: (catalogRaHours: number, catalogDecDegrees: number, catalogEpochJd: number, currentJd: number) => number;
        calculate_astrological_aspects?: (jd: number) => number;
        calculate_solar_zenith_position?: (jd: number) => number;
        calculate_solar_zenith_position_rad?: (jd: number) => number;
      }> => {
        // Try different module loading strategies
        const moduleLoadStrategies = [
          // Strategy 1: Vite 7.0.6 + bundler target optimized loading (2025 best practice)
          async () => {
            console.log('🚀 Loading WASM module via Vite 7.0.6 bundler target...');

            // ✅ CORRECT 2025: Import wasm-bindgen bundler target module
          const wasmModule = await import('../wasm-astro/starscalendars_wasm_astro.js');

            // ✅ CORRECT 2025: With bundler target, initialization is automatic
            // No need for wasmModule.default() - this is for web target only

            console.log('✅ WASM module loaded and initialized with bundler target');

            // ✅ CORRECT 2025: With bundler target, memory is accessed from the WASM binary
            // Import the background module to get internal wasm access
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore - no types for this internal helper
            const bgModule = await import('../wasm-astro/starscalendars_wasm_astro_bg.js');

            // Access internal WASM memory for bundler target
            // In bundler target, memory is accessed through internal wasm variable
            let memory: WebAssembly.Memory | null = null;

            // Strategy: Use private property access to get real WASM memory
            // This is safe because we control the WASM compilation
            try {
              // Import the actual WASM module (may fail in dev - optional)
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore - Vite will handle .wasm as asset in bundler target
              const wasmBin: any = await import('../wasm-astro/starscalendars_wasm_astro_bg.wasm');
              if (wasmBin && wasmBin.memory) {
                memory = wasmBin.memory as WebAssembly.Memory;
              }
            } catch (wasmDirectError) {
              console.log('Direct WASM memory access failed, trying alternatives...');

              // Fallback: create accessor through internal wasm reference
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const anyBgModule = bgModule as any;
              if (anyBgModule.__wbg_get_wasm) {
                const internalWasm = anyBgModule.__wbg_get_wasm();
                if (internalWasm?.memory) {
                  memory = internalWasm.memory;
                }
              }
            }

            // Final fallback for development
            if (!memory) {
              console.warn('⚠️ Could not access real WASM memory, using development fallback');
              // Allocate a valid WebAssembly.Memory for fallback to satisfy types
              memory = new WebAssembly.Memory({ initial: 256, maximum: 512 });
            }

            console.log(`✅ WASM memory accessed: ${memory.buffer?.byteLength || 'unknown'} bytes`);

            // Test a real calculation to ensure WASM is working
            const testJD = 2451545.0; // J2000 epoch
            const testResult = wasmModule.compute_all(testJD);
            if (testResult !== 0) {
              console.log(`✅ WASM compute_all test successful: pointer ${testResult}`);
            } else {
              console.warn('⚠️ WASM compute_all returned null pointer - calculation may have failed');
            }

            // Return unified interface optimized for bundler target
            const base = {
              init: async () => { /* Already initialized */ },
              compute_all: wasmModule.compute_all,
              get_body_count: wasmModule.get_body_count,
              get_coordinate_count: wasmModule.get_coordinate_count,
              get_version: () => {
                try {
                  // Try the export function first (should return string)
                  return wasmModule.get_version ? wasmModule.get_version() : 'wasm-v1.0.0-bundler';
                } catch {
                  // Fallback if there's a signature mismatch
                  return 'wasm-v1.0.0-bundler';
                }
              },
              memory,
            } as const;
            const extras: any = {};
            if ((wasmModule as any).calculate_solar_zenith_position) {
              extras.calculate_solar_zenith_position = (wasmModule as any).calculate_solar_zenith_position;
            }
            if ((wasmModule as any).calculate_solar_zenith_position_rad) {
              extras.calculate_solar_zenith_position_rad = (wasmModule as any).calculate_solar_zenith_position_rad;
            }
            // Note: Additional functions may be conditionally attached above
            return { ...base, ...extras } as any;
          },

          // Strategy 2: Development fallback with safe imports (no eval)
          async () => {
            console.warn('🚧 Using development fallback strategy');
            throw new Error('Development fallback not available - please build WASM module');
          },

          // Strategy 3: WASM unavailable - show error (NO MOCK DATA!)
          async () => {
            throw new Error('🚨 WASM module unavailable - cannot proceed without real astronomical calculations! Please build WASM module with: pnpm run build:wasm');
          }
        ];

        // Try each strategy until one succeeds
        for (const strategy of moduleLoadStrategies) {
          try {
            return await strategy();
          } catch (error) {
            console.warn('WASM loading strategy failed:', error);
            continue;
          }
        }

        throw new Error('All WASM loading strategies failed');
      };

      const wasmFunctions = await loadWASMModule();
      timer.mark('wasm_functions_loaded');

      // Validate WASM module interface using strict constants
      const bodyCount = wasmFunctions.get_body_count();
      const coordinateCount = wasmFunctions.get_coordinate_count();
      const version = wasmFunctions.get_version();

      if (bodyCount !== WASM_CONSTANTS.EXPECTED_BODY_COUNT) {
        throw new Error(`Invalid body count: expected ${WASM_CONSTANTS.EXPECTED_BODY_COUNT}, got ${bodyCount}`);
      }

      if (coordinateCount !== WASM_CONSTANTS.EXPECTED_COORDINATE_COUNT) {
        throw new Error(`Invalid coordinate count: expected ${WASM_CONSTANTS.EXPECTED_COORDINATE_COUNT}, got ${coordinateCount}`);
      }

      timer.mark('validation_complete');

      // Create WASM module interface
      const module: WASMModule = {
        compute_all: (julianDay: number): number => {
          const validation = validateJulianDay(julianDay);
          if (!validation.success) {
            throw new Error(validation.error.message);
          }
          return wasmFunctions.compute_all(julianDay);
        },

        get_body_count: (): number => bodyCount,
        get_coordinate_count: (): number => coordinateCount,
        get_version: (): string => version,


        memory: wasmFunctions.memory,
        calculate_solar_zenith_position: wasmFunctions.calculate_solar_zenith_position,

        // 🌌 QUANTUM SPIRITUAL ASTRONOMY FUNCTIONS (newly implemented)
        calculate_earth_orbit: (julianDay: number): number => {
          const validation = validateJulianDay(julianDay);
          if (!validation.success) {
            throw new Error(validation.error.message);
          }
          // Call the actual WASM function once it's available
          return wasmFunctions.calculate_earth_orbit ? wasmFunctions.calculate_earth_orbit(julianDay) : 0;
        },

        calculate_moon_orbit: (julianDay: number): number => {
          const validation = validateJulianDay(julianDay);
          if (!validation.success) {
            throw new Error(validation.error.message);
          }
          return wasmFunctions.calculate_moon_orbit ? wasmFunctions.calculate_moon_orbit(julianDay) : 0;
        },

        get_movement_direction: (currentDistance: number, orbitalPhase: number): number => {
          return wasmFunctions.get_movement_direction ? wasmFunctions.get_movement_direction(currentDistance, orbitalPhase) : 0;
        },

        calculate_days_after_passage: (julianDay: number, orbitalPhase: number, orbitalPeriodDays: number): number => {
          return wasmFunctions.calculate_days_after_passage ? wasmFunctions.calculate_days_after_passage(julianDay, orbitalPhase, orbitalPeriodDays) : 0;
        },

        calculate_lunar_phase_detailed: (julianDay: number): number => {
          const validation = validateJulianDay(julianDay);
          if (!validation.success) {
            throw new Error(validation.error.message);
          }
          return wasmFunctions.calculate_lunar_phase_detailed ? wasmFunctions.calculate_lunar_phase_detailed(julianDay) : 0;
        },

        // ⭐ STELLAR COORDINATE TRANSFORMATION FUNCTIONS for createSky
        transform_stellar_coordinates: (raHours: number, decDegrees: number, magnitude: number, starScale: number, radius: number): number => {
          return wasmFunctions.transform_stellar_coordinates ? wasmFunctions.transform_stellar_coordinates(raHours, decDegrees, magnitude, starScale, radius) : 0;
        },

        calculate_constellation_line: (star1RaHours: number, star1DecDeg: number, star2RaHours: number, star2DecDeg: number, radius: number): number => {
          return wasmFunctions.calculate_constellation_line ? wasmFunctions.calculate_constellation_line(star1RaHours, star1DecDeg, star2RaHours, star2DecDeg, radius) : 0;
        },

        apply_stellar_precession: (catalogRaHours: number, catalogDecDegrees: number, catalogEpochJd: number, currentJd: number): number => {
          return wasmFunctions.apply_stellar_precession ? wasmFunctions.apply_stellar_precession(catalogRaHours, catalogDecDegrees, catalogEpochJd, currentJd) : 0;
        },

        calculate_astrological_aspects: (julianDay: number): number => {
          const validation = validateJulianDay(julianDay);
          if (!validation.success) {
            throw new Error(validation.error.message);
          }
          return wasmFunctions.calculate_astrological_aspects ? wasmFunctions.calculate_astrological_aspects(julianDay) : 0;
        }
      };

      globalWasmModule = module;
      isInitialized = true;
      timer.mark('module_ready');

      console.log(`✅ WASM Module Initialized Successfully:
        Version: ${version}
        Bodies: ${bodyCount}
        Coordinates: ${coordinateCount}
        Memory Buffer Size: ${wasmFunctions.memory.buffer.byteLength} bytes`);

      return module;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown WASM initialization error';
      console.error(`❌ WASM Initialization Failed: ${errorMessage}`);

      // Reset state on failure
      isInitialized = false;
      globalWasmModule = null;
      initializationPromise = null;

      throw new Error(`WASM module initialization failed: ${errorMessage}`);
    }
  })();

  return initializationPromise;
};

/**
 * Get current WASM module instance (if initialized)
 */
export const getWASMModule = (): WASMModule | null => {
  return globalWasmModule;
};

/**
 * Check if WASM module is initialized and ready
 */
export const isWASMInitialized = (): boolean => {
  return isInitialized && globalWasmModule !== null;
};

/**
 * Convert JavaScript Date to Julian Day for WASM calculations
 */
export const dateToJulianDay = (date: Date): number => {
  const unixEpochJulianDay = 2440587.5;
  const millisecondsPerDay = 86400000;
  return unixEpochJulianDay + date.getTime() / millisecondsPerDay;
};

/**
 * Convert milliseconds since epoch to Julian Day
 */
export const millisecondsToJulianDay = (milliseconds: number): number => {
  const unixEpochJulianDay = 2440587.5;
  const millisecondsPerDay = 86400000;
  return unixEpochJulianDay + milliseconds / millisecondsPerDay;
};

/**
 * ✅ CRITICAL: Create zero-copy Float64Array view of WASM memory (TypeScript 5.9.2+)
 *
 * This function implements the zero-copy data transfer requirement with strict validation.
 * Returns a validated Float64Array view directly into WASM memory at the given pointer.
 */
export const createPositionsView = (wasmModule: WASMModule, ptr: number): Result<PositionBuffer, WASMError> => {
  if (ptr === 0) {
    return {
      success: false,
      error: {
        type: WASMErrorType.MemoryAccessError,
        message: 'Null pointer returned from WASM compute_all',
        timestamp: performance.now()
      }
    };
  }

  const coordinateCount = wasmModule.get_coordinate_count();

  // No mock data allowed - WASM must be available for real astronomical calculations

  // Real WASM memory access with bounds checking
  try {
    const memoryBuffer = wasmModule.memory.buffer;

    // Check if pointer is within valid memory bounds
    if (ptr < 0 || ptr + (coordinateCount * 8) > memoryBuffer.byteLength) {
      return {
        success: false,
        error: {
          type: WASMErrorType.MemoryAccessError,
          message: `Pointer ${ptr} out of bounds (memory size: ${memoryBuffer.byteLength})`,
          timestamp: performance.now()
        }
      };
    }

    const buffer = new Float64Array(memoryBuffer, ptr, coordinateCount);

    // Add debug logging for first few calls
    if (!((globalThis as any).__bufferDebugCount)) (globalThis as any).__bufferDebugCount = 0;
    if ((globalThis as any).__bufferDebugCount++ < 3) {
      console.log(`🔍 WASM Buffer #${(globalThis as any).__bufferDebugCount}:`, {
        ptr,
        coordinateCount,
        bufferLength: buffer.length,
        firstFewValues: Array.from(buffer.slice(0, 9)).map(v => v.toFixed(6))
      });
    }

    const validation = validateWASMBuffer(buffer);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error
      };
    }

    return {
      success: true,
      data: validation.data
    };
  } catch (error) {
    return {
      success: false,
      error: {
        type: WASMErrorType.MemoryAccessError,
        message: `Memory access failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: performance.now()
      }
    };
  }
};

/**
 * ✅ CRITICAL: Extract celestial body positions from WASM buffer (HELIOCENTRIC/GEOCENTRIC MODEL)
 *
 * 🌟 ПРАВИЛЬНАЯ АСТРОНОМИЧЕСКАЯ СИСТЕМА КООРДИНАТ:
 * - **ГЕЛИОЦЕНТРИЧЕСКАЯ для планет**: Солнце в центре сцены (0,0,0)
 * - **ГЕОЦЕНТРИЧЕСКАЯ для Луны**: Луна относительно позиции Земли
 *
 * Celestial body order in WASM buffer (from wasm-astro/src/lib.rs):
 * - Sun: indices 0-2 (x, y, z) - GEOCENTRIC position (Sun relative to Earth)
 * - Moon: indices 3-5 (x, y, z) - GEOCENTRIC position (Moon relative to Earth)
 * - Mercury: indices 6-8 (x, y, z) - HELIOCENTRIC position
 * - Venus: indices 9-11 (x, y, z) - HELIOCENTRIC position
 * - Earth: indices 12-14 (x, y, z) - HELIOCENTRIC position (Earth relative to Sun)
 * - Mars: indices 15-17 (x, y, z) - HELIOCENTRIC position
 * - Jupiter: indices 18-20 (x, y, z) - HELIOCENTRIC position
 * - Saturn: indices 21-23 (x, y, z) - HELIOCENTRIC position
 * - Uranus: indices 24-26 (x, y, z) - HELIOCENTRIC position
 * - Neptune: indices 27-29 (x, y, z) - HELIOCENTRIC position
 * - Pluto: indices 30-32 (x, y, z) - HELIOCENTRIC position
 */
export const extractCelestialPositions = (
  positions: Float64Array,
  currentTime: number,
  wasmModule?: WASMModule | null
): AstronomicalState => {
  // Babylon LEFT-HANDED (default): X→right, Y→up, Z→forward (into screen)
  // Single LH bridge transform: flip Z once (z = -z).
  // IMPORTANT: After this, ALL positions are already in Babylon LH space.
  // Any additional axis flips in the scene are FORBIDDEN.
  const conv = (x: number, y: number, z: number) => ({ x, y, z: -z });
  // ✅ HELIOCENTRIC MODEL: Sun always at center (0,0,0) in 3D scene
  const sunPosition: CelestialPosition = {
    x: 0.0, // Sun at center of heliocentric scene
    y: 0.0,
    z: 0.0,
    distance: 0.0,
    timestamp: currentTime
  };

  // ✅ HELIOCENTRIC MODEL: Earth uses real heliocentric coordinates from WASM (indices 12-14)
  const e = conv(positions[12]!, positions[13]!, positions[14]!);
  const earthPosition: CelestialPosition = {
    x: e.x,
    y: e.y,
    z: e.z,
    distance: Math.sqrt(e.x * e.x + e.y * e.y + e.z * e.z),
    timestamp: currentTime
  };

  // ✅ GEOCENTRIC MODEL: Moon position relative to Earth (indices 3-5) + Earth offset
  const mOff = conv(positions[3]!, positions[4]!, positions[5]!);
  const moonPosition: CelestialPosition = {
    x: e.x + mOff.x,
    y: e.y + mOff.y,
    z: e.z + mOff.z,
    distance: Math.sqrt(mOff.x * mOff.x + mOff.y * mOff.y + mOff.z * mOff.z),
    timestamp: currentTime
  };

  // ✅ REAL ASTRONOMICAL DATA: Earth-Sun distance and Sun zenith coordinates
  const earthSunDistance = earthPosition.distance; // Real distance in AU

  // Calculate Sun zenith coordinates via WASM (rad preferred, deg fallback). No JS fallback allowed.
  let sunZenithLat: number;
  let sunZenithLng: number;
  let sunZenithLatRad: number;
  let sunZenithLngRad: number;
  const jd = millisecondsToJulianDay(currentTime);
  if (wasmModule?.calculate_solar_zenith_position_rad) {
    const ptrRad = wasmModule.calculate_solar_zenith_position_rad(jd);
    if (ptrRad) {
      const radView = new Float64Array(wasmModule.memory.buffer, ptrRad, 2);
      sunZenithLngRad = radView[0]!; // east-positive
      sunZenithLatRad = radView[1]!;
      sunZenithLng = (sunZenithLngRad * 180) / Math.PI;
      sunZenithLat = (sunZenithLatRad * 180) / Math.PI;
    } else {
      throw new Error('WASM returned null pointer for calculate_solar_zenith_position_rad');
    }
  } else if (wasmModule?.calculate_solar_zenith_position) {
    const ptrDeg = wasmModule.calculate_solar_zenith_position(jd);
    if (ptrDeg) {
      const degView = new Float64Array(wasmModule.memory.buffer, ptrDeg, 2);
      const lonDegWestPositive = degView[0]!;
      const latDeg = degView[1]!;
      sunZenithLng = -lonDegWestPositive; // convert to east-positive
      sunZenithLat = latDeg;
      sunZenithLngRad = (sunZenithLng * Math.PI) / 180;
      sunZenithLatRad = (sunZenithLat * Math.PI) / 180;
    } else {
      throw new Error('WASM returned null pointer for calculate_solar_zenith_position');
    }
  } else {
    throw new Error('WASM solar zenith functions are not available');
  }

  return {
    sun: sunPosition,
    earth: earthPosition,
    moon: moonPosition,
    earthSunDistance,
    sunZenithLat,
    sunZenithLng,
    sunZenithLatRad,
    sunZenithLngRad
  };
};

// Removed JS fallback zenith calculators: we rely exclusively on WASM

/**
 * Cleanup WASM module resources
 */
export const cleanupWASM = (): void => {
  console.log('🧹 Cleaning up WASM module resources');
  globalWasmModule = null;
  isInitialized = false;
  initializationPromise = null;
};
