/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Lets imports use @/ for src/, matching "paths" in tsconfig.
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    // On the VPS the dev server sits behind Caddy, which terminates TLS on 443:
    // it must stay on loopback, answer the public Host header, and point the HMR
    // websocket at 443 instead of the local port. Unset env = local defaults.
    host: process.env.DEV_HOST ?? 'localhost',
    port: Number(process.env.DEV_PORT ?? 5173),
    strictPort: true,
    allowedHosts: process.env.DEV_ALLOWED_HOSTS
      ? process.env.DEV_ALLOWED_HOSTS.split(',').map((h) => h.trim())
      : undefined,
    hmr: process.env.DEV_HMR_CLIENT_PORT
      ? // Only the port is overridden: Vite then infers ws:// vs wss:// from the
        // page itself, which keeps plain-HTTP tests working alongside TLS.
        { clientPort: Number(process.env.DEV_HMR_CLIENT_PORT) }
      : undefined,
    // Sends /api calls to the local Python server so the browser sees one origin (no CORS setup in dev).
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
