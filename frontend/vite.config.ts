import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import topLevelAwait from 'vite-plugin-top-level-await'
import wasm from 'vite-plugin-wasm'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    wasm(),
    topLevelAwait()
  ],
  server: {
    port: 3001,
    host: '0.0.0.0',
    fs: {
      // Allow serving files from wasm-astro workspace
      allow: ['..', '../wasm-astro/pkg']
    }
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'babylon': ['@babylonjs/core'],
          'react-vendor': ['react', 'react-dom']
        },
        // ✅ 2025 Optimization: Rollup-specific optimizations  
        format: 'es',
        generatedCode: 'es2015'
      }
    },
    // ✅ 2025 Build Performance: Enhanced for large 3D applications
    minify: 'esbuild'
  },
  resolve: {
    alias: {
      '@': '/src',
      '@wasm': '/src/wasm',
      '@wasm-pkg': '/wasm-astro/pkg'
    }
  },
  optimizeDeps: {
    exclude: ['@babylonjs/core', '@babylonjs/materials'],
    // ✅ 2025 Optimization: Force pre-bundling for performance
    include: ['react', 'react-dom', 'zustand', 'date-fns']
  },
  worker: {
    format: 'es',
    plugins: () => [wasm(), topLevelAwait()]
  }
})
