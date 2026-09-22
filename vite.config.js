/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  // Excluir el compilador WASM de Typst del pre-bundling de Vite.
  // Los módulos WASM deben ser resueltos en tiempo de ejecución por el Worker,
  // no procesados por esbuild en tiempo de dev.
  optimizeDeps: {
    exclude: [
      '@myriaddreamin/typst.ts',
      '@myriaddreamin/typst-ts-web-compiler',
    ],
  },
  // Habilitar Web Workers en formato ESM (requerido por Typst Worker)
  worker: {
    format: 'es',
  },
  build: {
    chunkSizeWarningLimit: 16000, // Typst WASM es ~13MB — aumentamos el límite
    rollupOptions: {
      output: {
        manualChunks: {
          // Chunk separado para el engine Typst: no se incluye en el bundle principal.
          // Solo se descarga cuando el usuario exporta PDF con Typst por primera vez.
          'typst-engine': [
            '@myriaddreamin/typst.ts',
            '@myriaddreamin/typst-ts-web-compiler',
          ],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
    css: true,
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
})
