#!/bin/bash
# Frontend Development: Build WASM + Start Vite
# Только для разработки фронтенда сцены

set -e

echo "🎨 Frontend Development Setup"
echo "============================"

echo "📥 Installing dependencies (workspace, always fresh majors)..."
pnpm -w install --prefer-offline=false --frozen-lockfile=false || pnpm -w install
# Ensure workspace-local symlinks for frontend exist (avoids 'node_modules missing' in workspace)
pnpm --filter starscalendars-frontend install || true
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
