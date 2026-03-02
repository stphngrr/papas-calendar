// ABOUTME: Vite and Vitest configuration.
// ABOUTME: Configures React plugin, jsdom test environment, and GitHub Pages base path.

/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/papas-calendar/',
  optimizeDeps: {
    // jsPDF optionally imports these for features we don't use (HTML-to-PDF, SVG).
    // Exclude them from dependency optimization so esbuild doesn't choke on them.
    exclude: ['html2canvas', 'dompurify', 'canvg'],
  },
  resolve: {
    alias: {
      // Stub out jsPDF's optional dependencies with an empty module.
      html2canvas: new URL('./src/empty-module.ts', import.meta.url).pathname,
      dompurify: new URL('./src/empty-module.ts', import.meta.url).pathname,
      canvg: new URL('./src/empty-module.ts', import.meta.url).pathname,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
