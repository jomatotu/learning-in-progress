# Server

FastAPI server for the client. Dependencies are managed with [uv](https://docs.astral.sh/uv/).

In dev, the client's Vite server proxies `/api` to this server on port 8000, so no CORS setup is needed.

## Setup

```sh
uv sync
```

Copy `.env.example` to `.env` and add your Gemini API key.

## Run

```sh
uv run --env-file .env fastapi dev --no-proxy-headers   # development: auto-reload, localhost only
uv run --env-file .env fastapi run --forwarded-allow-ips <proxy ip>   # production: no reload, listens on 0.0.0.0
```

Rate limits key on the client address. uvicorn trusts `X-Forwarded-For` from 127.0.0.1 by default, and the Vite dev proxy forwards that header, so in development anyone could rotate it to dodge the limit: always start dev with `--no-proxy-headers`. On the VPS, trust only the reverse proxy: `--forwarded-allow-ips <proxy ip>` (never `*`).

API docs: http://localhost:8000/docs

## Access code

The routes that call Hermes (`/api/assess`, `/api/generate`, `/api/solution`) need HTTP Basic auth. Set `ACCESS_CODE` in `.env` (for example `openssl rand -hex 16`). The browser asks for a login: leave the username empty or type anything, and enter the code as the password. Without `ACCESS_CODE` these routes answer 503.

```sh
curl -u x:"$ACCESS_CODE" -X POST localhost:8000/api/solution -H 'Content-Type: application/json' -d '{"profile":{}}'
```

## Test

```sh
uv run pytest
```

## Adding routes

Create a router in `app/routers/` and include it in `app/main.py` with `app.include_router(..., prefix="/api")`.
