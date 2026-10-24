/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { SANDBOX_CSP, isSandboxPath, withCspMeta } from './sandbox-csp.js'
import { defineConfig, loadEnv, type Connect, type Plugin } from 'vite'

const sandboxCsp: Connect.NextHandleFunction = (req, res, next) => {
  if (req.url && isSandboxPath(req.url)) {
    res.setHeader('Content-Security-Policy', SANDBOX_CSP)
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
    configureServer: (server) => void server.middlewares.use(sandboxCsp),
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
      // The sandboxed frame has the opaque origin 'null'; it still needs to load its modules.
      cors: {
        origin: [
          /^https?:\/\/(?:(?:[^:]+\.)?localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/,
          'null',
        ],
      },
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
