#!/bin/bash
# Frontend Development: Build WASM + Start Vite
# Только для разработки фронтенда сцены

set -e

echo "🎨 Frontend Development Setup"
echo "============================"

echo "📥 Installing dependencies (always fresh majors)..."
pnpm -w i --prefer-offline=false --frozen-lockfile=false || pnpm -w i
echo "✅ Dependencies ready"
echo ""

# Build WASM first
echo "📦 Building WASM astronomical module (force rebuild)..."
./scripts/build-wasm.sh

echo ""
echo "🚀 Starting Vite development server..."
echo "   URL: http://localhost:3000"
echo "   Press Ctrl+C to stop"
echo ""

# Start frontend dev server
cd frontend && pnpm run dev
