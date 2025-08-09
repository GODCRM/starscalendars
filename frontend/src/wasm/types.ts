/**
 * WASM Module Type Definitions for starscalendars-wasm-astro
 *
 * TypeScript 5.9.2 strict definitions for zero-copy WASM integration
 */

// ✅ CORRECT - Strict WASM function signatures (TypeScript 5.9.2+)
export interface WASMExports {
  readonly compute_all: (julianDay: number) => number;
  readonly compute_state?: (julianDay: number) => number;
  readonly get_version: () => string;
  readonly memory: WebAssembly.Memory;
}

// ✅ CORRECT - WASM module initialization interface
export interface WASMModuleInit {
  readonly default: () => Promise<void>;
  readonly compute_all: (julianDay: number) => number;
  readonly compute_state?: (julianDay: number) => number;
  readonly get_version: () => string;
  readonly memory: WebAssembly.Memory;
}

// ✅ CORRECT - Celestial body enumeration (matches Rust domain layer)
export enum CelestialBodyIndex {
  Sun = 0,
  Moon = 1,
  Mercury = 2,
  Venus = 3,
  Earth = 4,
  Mars = 5,
  Jupiter = 6,
  Saturn = 7,
  Uranus = 8,
  Neptune = 9,
  Pluto = 10,
}

// ✅ CORRECT - Position extraction helpers with strict typing
export interface CelestialBodyPositions {
  readonly sun: readonly [number, number, number];    // [x, y, z] in AU
  readonly moon: readonly [number, number, number];   // [x, y, z] in AU
  readonly mercury: readonly [number, number, number];
  readonly venus: readonly [number, number, number];
  readonly earth: readonly [number, number, number];
  readonly mars: readonly [number, number, number];
  readonly jupiter: readonly [number, number, number];
  readonly saturn: readonly [number, number, number];
  readonly uranus: readonly [number, number, number];
  readonly neptune: readonly [number, number, number];
  readonly pluto: readonly [number, number, number];
}

// ✅ CORRECT - Performance monitoring for WASM operations
export interface WASMPerformanceMetrics {
  readonly initializationTime: number;
  readonly lastComputeTime: number;
  readonly totalComputeCalls: number;
  readonly averageComputeTime: number;
  readonly memoryUsage: number;
}

// ✅ CORRECT - WASM module state interface
export interface WASMModuleState {
  readonly isInitialized: boolean;
  readonly isAvailable: boolean;
  readonly version: string;
  readonly bodyCount?: number;
  readonly coordinateCount?: number;
  readonly performance: WASMPerformanceMetrics;
}

// ✅ CORRECT - Zero-copy position extraction utility type
export type PositionBuffer = Float64Array & {
  readonly byteLength: number;
};

// ✅ CORRECT - Strict error types for WASM operations
export enum WASMErrorType {
  InitializationFailed = 'INITIALIZATION_FAILED',
  ModuleNotFound = 'MODULE_NOT_FOUND',
  InvalidJulianDay = 'INVALID_JULIAN_DAY',
  ComputationFailed = 'COMPUTATION_FAILED',
  MemoryAccessError = 'MEMORY_ACCESS_ERROR',
  BufferSizeMismatch = 'BUFFER_SIZE_MISMATCH',
}

export interface WASMError {
  readonly type: WASMErrorType;
  readonly message: string;
  readonly details?: unknown;
  readonly timestamp: number;
}

// ✅ CORRECT - Result pattern for WASM operations (anti.md/QUALITY.md/CLAUDE.md compliant)
export type WASMResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: WASMError };

// ✅ CORRECT - WASM memory layout constants (from Rust lib.rs)
export const WASM_CONSTANTS = {
  EXPECTED_BODY_COUNT: 11,
  EXPECTED_COORDINATE_COUNT: 33,
  COORDINATES_PER_BODY: 3,
  BYTES_PER_COORDINATE: 8, // f64
  TOTAL_BUFFER_SIZE: 264,  // 33 * 8 bytes
} as const;

// ✅ CORRECT - Validation utilities with strict typing
export const validateWASMBuffer = (buffer: Float64Array): WASMResult<PositionBuffer> => {
  if (buffer.length !== WASM_CONSTANTS.EXPECTED_COORDINATE_COUNT) {
    return {
      success: false,
      error: {
        type: WASMErrorType.BufferSizeMismatch,
        message: `Expected ${WASM_CONSTANTS.EXPECTED_COORDINATE_COUNT} coordinates, got ${buffer.length}`,
        timestamp: performance.now(),
      }
    };
  }

  if (buffer.byteLength !== WASM_CONSTANTS.TOTAL_BUFFER_SIZE) {
    return {
      success: false,
      error: {
        type: WASMErrorType.BufferSizeMismatch,
        message: `Expected ${WASM_CONSTANTS.TOTAL_BUFFER_SIZE} bytes, got ${buffer.byteLength}`,
        timestamp: performance.now(),
      }
    };
  }

  return {
    success: true,
    data: buffer as PositionBuffer
  };
};

// Variant validators (strict):
export const validateSEMBuffer = (buffer: Float64Array): WASMResult<PositionBuffer> => {
  const expectedLen = 9; // Sun, Moon, Earth (3 bodies * 3)
  const expectedBytes = expectedLen * WASM_CONSTANTS.BYTES_PER_COORDINATE;
  if (buffer.length !== expectedLen) {
    return {
      success: false,
      error: {
        type: WASMErrorType.BufferSizeMismatch,
        message: `Expected ${expectedLen} coordinates (SEM), got ${buffer.length}`,
        timestamp: performance.now(),
      }
    };
  }
  if (buffer.byteLength !== expectedBytes) {
    return {
      success: false,
      error: {
        type: WASMErrorType.BufferSizeMismatch,
        message: `Expected ${expectedBytes} bytes (SEM), got ${buffer.byteLength}`,
        timestamp: performance.now(),
      }
    };
  }
  return { success: true, data: buffer as PositionBuffer };
};

// ✅ CORRECT - Position extraction with zero allocation (TypeScript 5.9.2 optimized)
export const extractBodyPosition = (
  buffer: PositionBuffer,
  bodyIndex: CelestialBodyIndex
): readonly [number, number, number] => {
  const baseIndex = bodyIndex * WASM_CONSTANTS.COORDINATES_PER_BODY;
  return [
    buffer[baseIndex]!,
    buffer[baseIndex + 1]!,
    buffer[baseIndex + 2]!,
  ] as const;
};

// ✅ CORRECT - Bulk position extraction with pre-allocated result
export const extractAllPositions = (buffer: PositionBuffer): CelestialBodyPositions => {
  return {
    sun: extractBodyPosition(buffer, CelestialBodyIndex.Sun),
    moon: extractBodyPosition(buffer, CelestialBodyIndex.Moon),
    mercury: extractBodyPosition(buffer, CelestialBodyIndex.Mercury),
    venus: extractBodyPosition(buffer, CelestialBodyIndex.Venus),
    earth: extractBodyPosition(buffer, CelestialBodyIndex.Earth),
    mars: extractBodyPosition(buffer, CelestialBodyIndex.Mars),
    jupiter: extractBodyPosition(buffer, CelestialBodyIndex.Jupiter),
    saturn: extractBodyPosition(buffer, CelestialBodyIndex.Saturn),
    uranus: extractBodyPosition(buffer, CelestialBodyIndex.Uranus),
    neptune: extractBodyPosition(buffer, CelestialBodyIndex.Neptune),
    pluto: extractBodyPosition(buffer, CelestialBodyIndex.Pluto),
  };
};

// ✅ CORRECT - Julian Day validation with strict bounds
export const validateJulianDay = (jd: number): WASMResult<number> => {
  if (!Number.isFinite(jd)) {
    return {
      success: false,
      error: {
        type: WASMErrorType.InvalidJulianDay,
        message: `Julian Day must be finite, got: ${jd}`,
        timestamp: performance.now(),
      }
    };
  }

  // Reasonable astronomical bounds (year -4712 to +9999)
  const MIN_JULIAN_DAY = 0.0;
  const MAX_JULIAN_DAY = 5373484.5; // Approximately year 9999

  if (jd < MIN_JULIAN_DAY || jd > MAX_JULIAN_DAY) {
    return {
      success: false,
      error: {
        type: WASMErrorType.InvalidJulianDay,
        message: `Julian Day ${jd} outside valid range [${MIN_JULIAN_DAY}, ${MAX_JULIAN_DAY}]`,
        timestamp: performance.now(),
      }
    };
  }

  return { success: true, data: jd };
};
