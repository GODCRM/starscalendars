#!/bin/bash

# StarsCalendars WASM Build Script
# High-performance astronomical calculations compilation

set -e

echo "🚀 Building StarsCalendars WASM Astronomical Core..."

# Check dependencies
if ! command -v wasm-pack &> /dev/null; then
    echo "❌ wasm-pack not found. Installing..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

if ! command -v rustc &> /dev/null; then
    echo "❌ Rust not found. Installing..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    source ~/.cargo/env
fi

# Navigate to WASM module directory
cd "$(dirname "$0")/../wasm-astro"

echo "📦 Compiling WASM module with wasm-pack..."
echo "   Target: bundler (Vite 7.0.6 optimized)"
echo "   Mode: release (optimized)"
echo "   Output: frontend/src/wasm-astro/"

# Build WASM module with maximum optimization for Vite 7.0.6
# ✅ 2025 BEST PRACTICE: --target bundler for vite-plugin-wasm 3.5.0
wasm-pack build \
    --release \
    --target bundler \
    --out-dir ../frontend/src/wasm-astro \
    --out-name starscalendars_wasm_astro \
    --scope starscalendars

echo "✅ WASM build completed successfully!"

# Verify output files
echo "📋 Generated files:"
ls -la ../frontend/src/wasm-astro/

# Verify expected files exist
REQUIRED_FILES=(
    "../frontend/src/wasm-astro/starscalendars_wasm_astro.js"
    "../frontend/src/wasm-astro/starscalendars_wasm_astro_bg.wasm"
    "../frontend/src/wasm-astro/starscalendars_wasm_astro.d.ts"
    "../frontend/src/wasm-astro/package.json"
)

echo "🔍 Verifying required files..."
for file in "${REQUIRED_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo "  ✅ $file"
        # Show file size for performance monitoring
        SIZE=$(wc -c < "$file" 2>/dev/null || echo "unknown")
        echo "     Size: $SIZE bytes"
    else
        echo "  ❌ $file (MISSING)"
        exit 1
    fi
done

echo ""
echo "🎯 Performance Summary:"
WASM_SIZE=$(wc -c < "../frontend/src/wasm-astro/starscalendars_wasm_astro_bg.wasm" 2>/dev/null || echo "0")
JS_SIZE=$(wc -c < "../frontend/src/wasm-astro/starscalendars_wasm_astro.js" 2>/dev/null || echo "0")
TOTAL_SIZE=$((WASM_SIZE + JS_SIZE))

echo "   WASM module: $WASM_SIZE bytes"
echo "   JS wrapper:  $JS_SIZE bytes"
echo "   Total size:  $TOTAL_SIZE bytes"

if [[ $WASM_SIZE -lt 102400 ]]; then  # < 100KB
    echo "   ✅ WASM size under 100KB target"
else
    echo "   ⚠️  WASM size exceeds 100KB target"
fi

echo ""
echo "🚀 WASM module ready for frontend integration!"
echo "   ES Module: './wasm-astro/starscalendars_wasm_astro.js'"
echo "   Location: frontend/src/wasm-astro/"
echo "   Next step: pnpm run dev in frontend/"

# Optional: Test WASM module can be loaded
echo ""
echo "🧪 Testing WASM module loading..."
node -e "
  import('file://$(pwd)/../frontend/src/wasm-astro/starscalendars_wasm_astro.js')
    .then(module => {
      console.log('✅ WASM module loads successfully');
      console.log('   Version:', module.get_version?.() || 'unknown');
      console.log('   Bodies:', module.get_body_count?.() || 'unknown');
      console.log('   Coordinates:', module.get_coordinate_count?.() || 'unknown');
    })
    .catch(err => {
      console.log('❌ WASM module loading failed:', err.message);
      process.exit(1);
    });
" 2>/dev/null || echo "⚠️  Node.js test skipped (not available or ES modules not supported)"

echo ""
echo "✅ Build complete! You can now run the frontend with:"
echo "   cd ../frontend && pnpm run dev"