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
