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

// The sandboxed frame has the opaque origin 'null' and still needs to load its modules.
// Allow that origin only when the request comes from this dev server's own pages.
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
