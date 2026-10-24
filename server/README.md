# Server

FastAPI server for the client. Dependencies are managed with [uv](https://docs.astral.sh/uv/).

In dev, the client's Vite server proxies `/api` to this server on port 8000, so no CORS setup is needed.

## Setup

```sh
uv sync
```

## Run

```sh
uv run fastapi dev   # development: auto-reload, localhost only
uv run fastapi run   # production: no reload, listens on 0.0.0.0
```

API docs: http://localhost:8000/docs

## Test

```sh
uv run pytest
```

## Adding routes

Create a router in `app/routers/` and include it in `app/main.py` with `app.include_router(..., prefix="/api")`.
