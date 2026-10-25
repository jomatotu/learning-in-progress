/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Connect, type Plugin } from 'vite'
import {
  SANDBOX_CSP,
  isNullOriginFromSelf,
  isSandboxPath,
  withCspMeta,
} from './sandbox-csp.js'

const sandboxCsp: Connect.NextHandleFunction = (req, res, next) => {
  if (req.url && isSandboxPath(req.url)) {
    res.setHeader('Content-Security-Policy', SANDBOX_CSP)
  }
  next()
}

// Dev-only convenience, not an attacker barrier: the sandboxed frame has origin 'null'
// and Chrome sends no Referer for its module scripts, so a missing Referer is allowed.
// Removed when the sandbox gets its own origin (VPS plan).
const allowOwnSandbox: Connect.NextHandleFunction = (req, res, next) => {
  if (
    isNullOriginFromSelf({
      origin: req.headers.origin,
      referer: req.headers.referer,
      host: req.headers.host,
    })
  ) {
    res.setHeader('Access-Control-Allow-Origin', 'null')
    res.appendHeader('Vary', 'Origin')
  }
  next()
}

function sandboxCspPlugin(): Plugin {
  return {
    name: 'sandbox-csp',
    transformIndexHtml: {
      order: 'pre',
      handler: (html, ctx) =>
        ctx.filename.endsWith('sandbox.html') ? withCspMeta(html) : html,
    },
    // `void`: returning the connect app would make Vite treat this as a post hook.
    configureServer: (server) =>
      void server.middlewares.use(allowOwnSandbox).use(sandboxCsp),
    configurePreviewServer: (server) => void server.middlewares.use(sandboxCsp),
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), sandboxCspPlugin()],
    resolve: {
      // Lets imports use @/ for src/, matching "paths" in tsconfig.
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    build: {
      rollupOptions: {
        input: {
          main: fileURLToPath(new URL('./index.html', import.meta.url)),
          sandbox: fileURLToPath(new URL('./sandbox.html', import.meta.url)),
        },
      },
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
        // API_URL lets a second worktree point at its own FastAPI port.
        '/api': env.API_URL || 'http://localhost:8000',
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
    },
  }
})
