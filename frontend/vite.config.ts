import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    wasm(),
    topLevelAwait()
  ],
  server: {
    port: 3000,
    host: true,
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
          'babylon': ['@babylonjs/core', '@babylonjs/materials', '@babylonjs/loaders'],
          'react-vendor': ['react', 'react-dom'],
          'wasm-astro': ['../wasm-astro/pkg']
        },
        // ✅ 2025 Optimization: Rolldown-specific optimizations
        format: 'es',
        generatedCode: 'es2022'
      }
    },
    // ✅ 2025 Build Performance: Enhanced for large 3D applications
    minify: 'terser',
    terserOptions: {
      compress: {
        passes: 2,
        pure_getters: true,
        unsafe_arrows: true
      },
      mangle: {
        properties: {
          regex: /^_private/
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src',
      '@wasm': '/src/wasm',
      '@wasm-pkg': '../wasm-astro/pkg'
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