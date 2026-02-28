// ABOUTME: Vite and Vitest configuration.
// ABOUTME: Configures React plugin, jsdom test environment, and GitHub Pages base path.

/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/papas-calendar/',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
