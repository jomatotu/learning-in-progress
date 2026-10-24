# Security Layer Implementation Plan (integration phases 1–2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put a security layer in front of every Hermes-calling feature already on `main`, so the team's app can run on the shared VPS without letting any visitor or any generated page steer a tool-using agent or read the app's data.

**Architecture:** Work on branch `integration/one-app` (worktree `.worktrees/integration`, created off `origin/main` `c7291a1`, local only). The server gets typed settings, HTTP Basic auth on the Hermes routes, Host / Origin / body-size / rate-limit guards, and `base-uri 'none'` in the generated-HTML CSP. Hermes-written React pages (`/api/solution`) stop running inside the app: a second entry `sandbox.html` of the same Vite server loads them, shown in `<iframe sandbox="allow-scripts">` (opaque origin) with a strict CSP header. Teammates' route modules are not edited; guards attach in `server/app/main.py`.

**Tech Stack:** FastAPI + Starlette + pydantic-settings (already installed via `fastapi[standard]`) + httpx (server, uv, pytest); Vite 8 + React 19 + TypeScript + react-router + Vitest + Testing Library (client, pnpm).

**Spec:** `doc/specs/2026-10-24-integration-design.md` (sections "Engine", "Lesson rendering", "Quality and repo hygiene"; phase 2). Audited with ponytail-audit; cuts applied (Basic auth instead of a custom cookie gate, one Vite server, no CSP-meta stripping, glob map as the page allow-list, constants instead of unused settings, simpler limiter and body cap).

## Global Constraints

- Branch `integration/one-app` in `/home/reallyboard/git/learning-in-progress/.worktrees/integration`. Never push. Commit per task, Conventional Commits.
- `feat/hermes-demo` is **not** merged wholesale: `main` has its own end-to-end flow (Nils, `c7291a1`: Home → `/application` → MagicStep → `/api/solution` → `/solution/:uuid`). Our pieces are ported in the next plan.
- Do not edit teammates' route modules (`server/app/routers/assess.py`, `generate.py`, `solution.py`, `profile.py`, `survey.py`) except `generate.CSP` in Task 4.
- pnpm only in `client/` (never npm; `client/package-lock.json` untouched, `client/pnpm-lock.yaml` uncommitted). uv only in `server/`. No new dependencies.
- Never print secrets. Check `.env` keys with `grep -c '^NAME=' file`. Plain `grep` is rewritten to ripgrep in this shell: use `/usr/bin/grep` for GNU regex. The `rtk` hook rewrites some tool output: use `rtk proxy <cmd>` when exact output or exit code matters (e.g. prettier).
- Ports for live checks in this worktree: Vite `5175`, FastAPI `8001`. The other worktree's servers (`5174`, `8000`) and Hermes (`8642`) stay running and untouched.
- Settings (environment, comma-separated lists): `HERMES_BASE_URL` (optional), `HERMES_API_KEY` (optional, secret), `ACCESS_CODE` (optional, secret; unset ⇒ gated routes answer 503), `APP_ORIGINS` default `http://localhost:5173,http://localhost:5174,http://localhost:5175`, `ALLOWED_HOSTS` default `localhost,127.0.0.1`. Constants in `server/app/guards.py`: `MAX_BODY_BYTES = 262_144`, `HERMES_RUNS_PER_MINUTE = 6`.
- Error bodies are JSON `{"detail": "<code>"}` with exactly these codes: `access_required` (401), `access_not_configured` (503), `origin_not_allowed` (403), `length_required` (411), `request_too_large` (413), `too_many_requests` (429).
- UI copy German, `du`; errors coral with a left border, never red (style guide `doc/design/STYLE_GUIDE.md` on `origin/Frontend_ApplicationForm`).
- Checks before every commit — server: `uv --directory server run pytest -v`, `uv --directory server run --with ruff ruff check .`; client (in `client/`): `pnpm test:run`, `pnpm typecheck`, `pnpm exec oxlint src`, `rtk proxy pnpm exec prettier --check src` (pre-existing failures in untouched files are noted, not fixed), `pnpm build`.

## Review Focus

1. A student retrying after a Hermes error must not be locked out: 6 Hermes calls per minute pass, the 7th gets 429 `too_many_requests` with `Retry-After` (Task 2).
2. A full German material (60,000 characters with umlauts plus profile JSON) passes the body cap; only bodies over 262,144 bytes get 413 (Task 2).
3. The Vite proxy forwards `Host: localhost:5175`: a host with a port passes, `evil.example` gets 400 (Task 2).
4. A Basic-auth password typed with surrounding spaces still works; a wrong one gets 401 with a `WWW-Authenticate: Basic` challenge so the browser asks again (Task 3).
5. A Solution Page URL with an unknown id shows the German "nicht gefunden" card inside the sandbox, not a blank frame or a stack trace (Task 5).

---

### Task 1: Baseline, typed settings, configurable API proxy target

**Files:**
- Create: `server/app/settings.py`
- Modify: `server/app/hermes.py` (`get_client` only), `server/.env.example`, `client/vite.config.ts` (proxy target)
- Test: `server/tests/test_settings.py`

**Interfaces:**
- Produces: `class Settings(BaseSettings)` with `hermes_base_url: str | None = None`, `hermes_api_key: SecretStr | None = None`, `access_code: SecretStr | None = None`, `app_origins: list[str]`, `allowed_hosts: list[str]` (defaults from Global Constraints; `.env` file; list fields as `Annotated[list[str], NoDecode]` with a `field_validator(..., mode="before")` that splits on commas and strips); `def get_settings() -> Settings` cached with `functools.lru_cache`.
- Produces: Vite `/api` proxy target `env.API_URL || 'http://localhost:8000'` via `loadEnv(mode, process.cwd(), '')`.

- [ ] **Step 1: Baseline.** `pnpm -C client install`, `uv --directory server sync`; run all checks from Global Constraints; record counts and pre-existing failures in the report.
- [ ] **Step 2: Write failing tests** (`test_settings.py`, `monkeypatch.setenv` + `Settings(_env_file=None)`): `test_defaults` (origins and hosts as in Global Constraints, `access_code is None`); `test_comma_lists_are_split_and_stripped` (`APP_ORIGINS=" http://a , http://b "` → `["http://a","http://b"]`); `test_access_code_is_secret` (`repr(Settings(access_code="x"))` does not contain `x`).
- [ ] **Step 3: Run** `uv --directory server run pytest -v tests/test_settings.py` → FAIL.
- [ ] **Step 4: Implement** `settings.py`; `hermes.get_client()` reads `get_settings()` and raises `HermesError("HERMES_BASE_URL and HERMES_API_KEY must be set in server/.env")` when either is missing (still lazy and cached). Document the five settings in `server/.env.example` (no secret values).
- [ ] **Step 5: Run** full server suite → PASS (if `test_hermes.py` sets env vars, add `get_settings.cache_clear()` to its setup; assertions unchanged).
- [ ] **Step 6: Proxy target** in `client/vite.config.ts` (`defineConfig(({ mode }) => …)`); `pnpm build` passes.
- [ ] **Step 7: Commit** `feat: add typed server settings and configurable api proxy target`.

### Task 2: Request guards (Host, Origin, body size, rate limit)

**Files:**
- Create: `server/app/guards.py`, `server/tests/conftest.py`
- Modify: `server/app/main.py`
- Test: `server/tests/test_guards.py`

**Interfaces:**
- Consumes: `get_settings()` (Task 1).
- Produces: `class OriginCheckMiddleware` (pure ASGI): for methods other than GET, HEAD, OPTIONS, a present `Origin` not in `settings.app_origins` → 403 `origin_not_allowed`; a missing `Origin` passes. `class BodySizeLimitMiddleware` (pure ASGI, request headers only): POST/PUT/PATCH without `Content-Length` → 411 `length_required`; `Content-Length` above `MAX_BODY_BYTES` → 413 `request_too_large`. `class RateLimiter(per_minute: int)` with `def hit(key: str) -> int | None` (fixed one-minute window per key, `{key: (window_start, count)}`, `time.monotonic`; returns seconds until the window resets, or `None` when allowed) and `async def limit_hermes_runs(request: Request) -> None` → 429 `too_many_requests` with `Retry-After`; key `request.client.host`; one module-level limiter with `HERMES_RUNS_PER_MINUTE`. Comment: `# ponytail: in-process memory; move to Redis or the reverse proxy when running several workers.` `TrustedHostMiddleware(allowed_hosts=settings.allowed_hosts)` in `main.py`.
- Produces (tests): `conftest.py` sets `ALLOWED_HOSTS=testserver,localhost,127.0.0.1` in `os.environ` at import time (before any test imports `app.main`) and has an autouse fixture that overrides `limit_hermes_runs` with a no-op, so existing suites are not rate limited; guard tests remove that override.

- [ ] **Step 1: Write failing tests** (`test_guards.py`): `test_post_from_foreign_origin_is_403`; `test_post_without_origin_passes`; `test_get_from_foreign_origin_passes`; `test_host_with_port_is_allowed` (`Host: localhost:5175`); `test_foreign_host_is_400`; `test_post_without_length_is_411`; `test_body_over_limit_is_413` (262,145 bytes); `test_full_german_material_passes_limit` (60,000 × `"ä"` plus a small profile → reaches the route); `test_seventh_call_in_a_minute_is_429` (6 × `POST /api/generate` pass, 7th → 429 with `Retry-After`; stub Hermes as in `test_generate.py`); `test_limiter_resets_after_a_minute` (monkeypatch `time.monotonic`).
- [ ] **Step 2: Run** `uv --directory server run pytest -v tests/test_guards.py` → FAIL.
- [ ] **Step 3: Implement** `guards.py`; in `main.py` add TrustedHost (outermost), body size, Origin; `include_router(..., dependencies=[Depends(limit_hermes_runs)])` for `assess`, `generate`, `solution`.
- [ ] **Step 4: Run** full server suite + ruff → PASS.
- [ ] **Step 5: Live check:** copy `../feat-hermes-demo/server/.env` to `server/.env` (`chmod 600`); start `uv --directory server run --env-file .env fastapi dev --port 8001`; with curl: foreign `Origin` POST → 403; `Host: evil.example` → 400; oversized body → 413.
- [ ] **Step 6: Commit** `feat: add host, origin, body-size and rate-limit guards`.

### Task 3: HTTP Basic auth on the Hermes routes

**Files:**
- Create: `server/app/access.py`
- Modify: `server/app/main.py`, `server/tests/conftest.py`, `server/README.md` (how to log in)
- Test: `server/tests/test_access.py`

**Interfaces:**
- Consumes: `get_settings()` (Task 1), `limit_hermes_runs` (Task 2).
- Produces: `async def require_access(credentials: HTTPBasicCredentials | None = Depends(HTTPBasic(auto_error=False)), settings: Settings = Depends(get_settings)) -> None`: no `ACCESS_CODE` → 503 `access_not_configured`; missing credentials or `secrets.compare_digest(password.strip().encode(), code.encode())` false → 401 `access_required` with header `WWW-Authenticate: Basic realm="Learning in Progress", charset="UTF-8"`. The username is ignored. In `main.py` the three Hermes routers get `dependencies=[Depends(limit_hermes_runs), Depends(require_access)]` (limiter first, so wrong passwords count against the limit). `conftest.py` autouse-overrides `require_access` with a no-op for existing suites; access tests remove it.

- [ ] **Step 1: Write failing tests** (`test_access.py`, `TestClient` as a context manager, settings via `app.dependency_overrides[get_settings]`): `test_gated_route_without_credentials_is_401_with_challenge` (`POST /api/solution` → 401 `access_required`, `WWW-Authenticate` starts with `Basic`); `test_unconfigured_code_is_503`; `test_wrong_password_is_401`; `test_password_with_whitespace_is_accepted` (`auth=("x", "  abc ")` vs code `abc` reaches the route: monkeypatch `hermes.ask_hermes` to raise `hermes.HermesError` and expect the route's own 502); `test_username_is_ignored`; `test_ungated_routes_stay_open` (`GET /api/health`, `GET /api/survey` → 200); `test_wrong_passwords_count_against_the_limit` (7th wrong attempt in a minute → 429).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** `access.py` and the router dependencies.
- [ ] **Step 4: Run** full server suite + ruff → PASS.
- [ ] **Step 5: Live check:** append `ACCESS_CODE=$(openssl rand -hex 16)` to `server/.env` without echoing it; restart FastAPI on `8001`; curl `POST /api/solution` without auth → 401 with challenge; with `-u x:<code read inside the command>` → past the gate. In a browser (chrome-devtools), open `http://localhost:5175` with Vite started as `API_URL=http://localhost:8001 pnpm dev --port 5175 --strictPort`, go through the form to the MagicStep, and record whether the browser's own login prompt appears for the `fetch` to `/api/solution`; if automation cannot answer the prompt, record that and verify with curl only.
- [ ] **Step 6: Commit** `feat: require http basic auth for hermes routes`.

### Task 4: `base-uri 'none'` in the generated-HTML CSP

**Files:**
- Modify: `server/app/routers/generate.py` (`CSP` constant only)
- Test: `server/tests/test_generate.py` (add one case)

**Interfaces:**
- Produces: `CSP` keeps its directives (`default-src 'none'`, inline scripts/styles, `img-src data: blob:`, `font-src data:`, `media-src data: blob:`, `form-action 'none'`) and adds `base-uri 'none'`. Extra model-written CSP metas need no stripping (additional policies only restrict); `base-uri 'none'` neutralises model `<base>` tags.

- [ ] **Step 1: Write failing test** `test_page_csp_forbids_base_and_forms`: the page from `prepare_page` contains `base-uri 'none'` and `form-action 'none'` inside the first `<meta http-equiv="Content-Security-Policy"`.
- [ ] **Step 2: Run** `uv --directory server run pytest -v tests/test_generate.py` → FAIL.
- [ ] **Step 3: Implement** the one-line change.
- [ ] **Step 4: Run** server suite → PASS.
- [ ] **Step 5: Commit** `fix: forbid base urls in generated lessons`.

### Task 5: Run Hermes-written Solution Pages in a sandboxed frame

**Files:**
- Create: `client/sandbox.html`, `client/src/sandbox/main.tsx`, `client/src/sandbox/SandboxPage.tsx`
- Modify: `client/vite.config.ts` (second input, CSP header plugin, CORS for `null`), `client/src/features/application/SolutionRoute.tsx`, `.gitignore` (+`client/src/features/application/generated/`), `client/README.md`
- Test: `client/src/sandbox/SandboxPage.test.tsx`, `client/src/features/application/SolutionRoute.test.tsx`

**Interfaces:**
- `client/vite.config.ts`: `build.rollupOptions.input` = `index.html` + `sandbox.html`; a small plugin whose `configureServer` (and `configurePreviewServer`) middleware sets, for requests to `/sandbox.html`, the header `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src ws://localhost:*; form-action 'none'; base-uri 'none'; object-src 'none'; frame-ancestors 'self'` (`'unsafe-inline'` scripts for the dev React-refresh preamble; `connect-src` only the HMR websocket, so the frame cannot call `/api`); `server.cors.origin` additionally allows `'null'` so the opaque-origin frame can load its modules. Comment that production hosting must send the same header.
- `function SandboxPage({ load }: { load: (() => Promise<unknown>) | undefined })` renders the module's default-export component inside `<div className="app-shell application-page">`, or, when `load` is undefined or the module has no default-export function, a German card: heading `Diese Seite gibt es nicht (mehr).`, text `Lass Hermes eine neue Seite für dich bauen.`
- `client/src/sandbox/main.tsx`: imports `../index.css` and `../features/application/application.css`, `const pages = import.meta.glob('../features/application/generated/*.tsx')`, reads `page` from `location.search`, mounts `<SandboxPage load={pages[`../features/application/generated/${page}.tsx`]} />` (the glob's keys are the allow-list; nothing else can load).
- `SolutionRoute` renders `<iframe title="Deine Lernseite" sandbox="allow-scripts" src={`/sandbox.html?page=${encodeURIComponent(uuid)}`}>` filling the page (keeps the existing back link if any); it no longer uses `import.meta.glob`, so the app bundle never imports generated code.

- [ ] **Step 1: Write failing tests:** `SandboxPage.test.tsx` — `load={undefined}` shows `Diese Seite gibt es nicht (mehr).`; a loader resolving to `{ default: () => <h1>Test</h1> }` shows `Test`; a loader resolving to `{}` shows the not-found card. `SolutionRoute.test.tsx` — `/solution/abc` renders an iframe with `sandbox` exactly `allow-scripts` and `src` `/sandbox.html?page=abc`; the source of `SolutionRoute.tsx` (read with `node:fs`) contains no `import.meta.glob`.
- [ ] **Step 2: Run** `pnpm test:run src/sandbox src/features/application/SolutionRoute.test.tsx` → FAIL.
- [ ] **Step 3: Implement** the files above.
- [ ] **Step 4: Run** client checks → PASS.
- [ ] **Step 5: Live check** (chrome-devtools tools via ToolSearch): create a throwaway `client/src/features/application/generated/00000000-0000-4000-8000-000000000000.tsx` (a heading plus a `fetch('/api/health')` and a `localStorage.getItem('x')` in an effect), start Vite on `5175` (`API_URL=http://localhost:8001`), open `/solution/00000000-0000-4000-8000-000000000000`: the heading renders inside the frame; the console shows the fetch blocked by CSP and `localStorage` throwing (opaque origin); `/solution/unknown` shows the German not-found card in the frame. Delete the throwaway file. Record screenshot path and console lines in the report.
- [ ] **Step 6: Commit** `feat: isolate hermes-written solution pages in a sandboxed frame`.

## Not in this plan (next plans)

Porting our Runs-API engine as server-side endpoints (`/api/analyse`, `/api/lesson/*`, events relay, server-owned approvals auto-deny + log), CI (after the team picks one package manager), intake changes, skills and `verify_quotes`, lesson page, design system, eval harness, VPS deployment (TLS so Basic auth is not sent in clear; production CSP header for `sandbox.html`; Hermes in a container with only the generated-pages directory writable). Residual risk until then: on the laptop Hermes' own file tool can write anywhere its user can.
