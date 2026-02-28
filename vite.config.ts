// ABOUTME: Vite and Vitest configuration.
// ABOUTME: Configures React plugin, jsdom test environment, and GitHub Pages base path.

/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/papas-calendar/',
  resolve: {
    alias: {
      // jsPDF optionally imports these for features we don't use (HTML-to-PDF, SVG).
      // Alias to empty modules to keep them out of the production bundle.
      html2canvas: 'data:text/javascript,export default null',
      dompurify: 'data:text/javascript,export default null',
      canvg: 'data:text/javascript,export default null',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
