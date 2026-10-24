# Client

React + TypeScript frontend, built with Vite. Talks to the Python server through `/api`.

## Requirements

Node 24 (see `.nvmrc`).

## Scripts

| Command           | What it does                                       |
| ----------------- | -------------------------------------------------- |
| `npm run dev`     | Dev server; `/api` is proxied to `localhost:8000`  |
| `npm run build`   | Type-check and build to `dist/`                    |
| `npm run preview` | Serve the production build locally                 |
| `npm run check`   | Type-check, lint, format check, and tests (all CI) |
| `npm run test`    | Vitest in watch mode                               |
| `npm run format`  | Format with Prettier                               |

## Secrets

Never put API keys (e.g. Gemini) in `VITE_*` env vars: they are bundled into the
browser code. Keep keys on the Python server.

## Solution Pages

Hermes-written pages (`src/features/application/generated/`) never run in the
app origin. `/solution/:uuid` embeds `sandbox.html` in
`<iframe sandbox="allow-scripts">` (opaque origin, no `/api`). The dev and
preview servers send a strict `Content-Security-Policy` for `/sandbox.html`
(see `vite.config.ts`); production hosting must send the same header.

**Known limitation (development only):** the dev server answers requests with
`Origin: null` and no `Referer` with `Access-Control-Allow-Origin: null`, because
Chrome sends no `Referer` for the sandbox's module scripts. A malicious page can
omit its `Referer` too, so while the dev server runs on your machine it can read
the sandbox module sources and Hermes-written pages. Requests with a foreign
`Referer` are refused. Chrome's Local Network Access prompt blocks this for public
websites, not for pages on the local network. This is removed when the sandbox gets
its own origin in the VPS plan; production needs no `null` CORS.
