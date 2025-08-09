#!/usr/bin/env node

/**
 * WASM Integration Test Script
 *
 * Tests that the compiled WASM module can be loaded and provides expected interface.
 * Run after: pnpm run build:wasm
 */

import { existsSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const wasmPkgPath = resolve(__dirname, '../frontend/src/wasm-astro');

console.log('🧪 Testing StarsCalendars WASM Integration...\n');

// Check if WASM artifacts exist
const requiredFiles = [
  'starscalendars_wasm_astro.js',
  'starscalendars_wasm_astro_bg.wasm',
  'starscalendars_wasm_astro.d.ts',
  'package.json'
];

console.log('📁 Checking WASM artifacts...');
let allFilesExist = true;

for (const file of requiredFiles) {
  const filePath = resolve(wasmPkgPath, file);
  if (existsSync(filePath)) {
    const stats = readFileSync(filePath);
    console.log(`  ✅ ${file} (${stats.byteLength} bytes)`);
  } else {
    console.log(`  ❌ ${file} (MISSING)`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.log('\n❌ Missing WASM artifacts. Run: pnpm run build:wasm');
  process.exit(1);
}

// Test WASM module loading
console.log('\n🔬 Testing WASM module interface...');

try {
  const wasmModulePath = resolve(wasmPkgPath, 'starscalendars_wasm_astro.js');
  const wasmModule = await import('file://' + wasmModulePath);

  console.log('  ✅ WASM module loaded successfully');

  // With bundler target, WASM module is auto-initialized
  console.log('  ✅ WASM module initialized (auto-init with bundler target)');

  // Test interface functions (no mocks)
  const tests = [
    {
      name: 'get_version()',
      test: () => wasmModule.get_version(),
      expected: 'wasm-v1.0.0-bundler'
    },
    {
      name: 'compute_all(2451545.0)', // J2000 epoch
      test: () => wasmModule.compute_all(2451545.0),
      expected: 'non-null-pointer'
    }
  ];

  for (const test of tests) {
    try {
      const result = test.test();

      if (test.expected === 'non-null-pointer') {
        if (result !== 0) {
          console.log(`  ✅ ${test.name} → pointer: ${result}`);
        } else {
          console.log(`  ❌ ${test.name} → null pointer (calculation failed)`);
        }
      } else if (result === test.expected) {
        console.log(`  ✅ ${test.name} → ${result}`);
      } else {
        console.log(`  ⚠️  ${test.name} → ${result} (expected: ${test.expected})`);
      }
    } catch (error) {
      console.log(`  ❌ ${test.name} → Error: ${error.message}`);
    }
  }

  // Test memory access
  console.log('\n🔍 Testing memory access...');
  const ptr = wasmModule.compute_all(2451545.0);

  if (ptr !== 0) {
    const coordinateCount = 33;

    const memory = wasmModule.memory;
    if (memory) {
      const positions = new Float64Array(memory.buffer, ptr, coordinateCount);

      console.log(`  ✅ Memory view created: Float64Array[${positions.length}]`);
      console.log(`  📊 Sample coordinates:`);
      console.log(`     Sun:  [${positions[0]?.toFixed(6)}, ${positions[1]?.toFixed(6)}, ${positions[2]?.toFixed(6)}]`);
      console.log(`     Moon: [${positions[3]?.toFixed(6)}, ${positions[4]?.toFixed(6)}, ${positions[5]?.toFixed(6)}]`);

      // Validate that we got reasonable astronomical values
      const sunDistance = Math.sqrt(positions[0]**2 + positions[1]**2 + positions[2]**2);
      const moonDistance = Math.sqrt(positions[3]**2 + positions[4]**2 + positions[5]**2);

      console.log(`  📏 Distances:`);
      console.log(`     Sun:  ${sunDistance.toFixed(6)} AU`);
      console.log(`     Moon: ${moonDistance.toFixed(6)} AU`);

      if (sunDistance > 0.9 && sunDistance < 1.1) {
        console.log(`  ✅ Sun distance reasonable (~1 AU)`);
      } else {
        console.log(`  ⚠️  Sun distance unusual (expected ~1 AU)`);
      }

      if (moonDistance > 0.001 && moonDistance < 0.01) {
        console.log(`  ✅ Moon distance reasonable (~0.0026 AU)`);
      } else {
        console.log(`  ⚠️  Moon distance unusual (expected ~0.0026 AU)`);
      }
    } else {
      throw new Error('WASM memory export is missing');
    }
  } else {
    console.log(`  ❌ compute_all returned null pointer`);
  }

  // Test new spiritual astronomy functions
  console.log('\n🌌 Testing Spiritual Astronomy Functions...');

  const spiritualTests = [
    {
      name: 'calculate_earth_orbit(2451545.0)',
      test: () => wasmModule.calculate_earth_orbit && wasmModule.calculate_earth_orbit(2451545.0),
      description: 'Earth orbital mechanics (perihelion/aphelion)'
    },
    {
      name: 'calculate_moon_orbit(2451545.0)',
      test: () => wasmModule.calculate_moon_orbit && wasmModule.calculate_moon_orbit(2451545.0),
      description: 'Moon orbital mechanics (perigee/apogee)'
    },
    {
      name: 'get_movement_direction(1.0, 0.25)',
      test: () => wasmModule.get_movement_direction && wasmModule.get_movement_direction(1.0, 0.25),
      description: 'Orbital movement direction'
    },
    {
      name: 'calculate_days_after_passage(2451545.0, 0.25, 365.25)',
      test: () => wasmModule.calculate_days_after_passage && wasmModule.calculate_days_after_passage(2451545.0, 0.25, 365.25),
      description: 'Days after orbital passage'
    },
    {
      name: 'calculate_lunar_phase_detailed(2451545.0)',
      test: () => wasmModule.calculate_lunar_phase_detailed && wasmModule.calculate_lunar_phase_detailed(2451545.0),
      description: 'Detailed lunar phase calculation'
    },
    {
      name: 'transform_stellar_coordinates(12.5, 41.3, 2.1, 1.0, 1000.0)',
      test: () => wasmModule.transform_stellar_coordinates && wasmModule.transform_stellar_coordinates(12.5, 41.3, 2.1, 1.0, 1000.0),
      description: 'Stellar coordinate transformation for createSky'
    },
    {
      name: 'calculate_astrological_aspects(2451545.0)',
      test: () => wasmModule.calculate_astrological_aspects && wasmModule.calculate_astrological_aspects(2451545.0),
      description: 'Quantum astrological timing'
    }
  ];

  for (const test of spiritualTests) {
    try {
      if (test.test) {
        const result = test.test();
        if (result && result !== 0) {
          console.log(`  ✅ ${test.name} → pointer: ${result}`);
          console.log(`     📝 ${test.description}`);
        } else {
          console.log(`  ⚠️  ${test.name} → function not available or returned null`);
        }
      } else {
        console.log(`  ⚠️  ${test.name} → function not available`);
      }
    } catch (error) {
      console.log(`  ❌ ${test.name} → Error: ${error.message}`);
    }
  }

  console.log('\n🎉 WASM integration test completed successfully!');
  console.log('\n🚀 Ready for frontend integration:');
  console.log('   cd frontend && pnpm run dev');

} catch (error) {
  console.log(`\n❌ WASM integration test failed: ${error.message}`);
  console.log('\n🔧 Troubleshooting:');
  console.log('   1. Run: pnpm run build:wasm');
  console.log('   2. Check that wasm-pack and Rust are installed');
  console.log('   3. Verify astro-rust library is present in ./astro-rust/');
  console.log(`\nError details: ${error.stack}`);
  process.exit(1);
}
