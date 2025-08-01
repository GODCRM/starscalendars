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
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src',
      '@wasm': '/src/wasm'
    }
  },
  optimizeDeps: {
    exclude: ['@babylonjs/core', '@babylonjs/materials']
  },
  worker: {
    format: 'es',
    plugins: [wasm(), topLevelAwait()]
  }
})