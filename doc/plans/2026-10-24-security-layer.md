# Security Layer Implementation Plan (integration phases 1–2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put a security layer in front of every Hermes-calling feature already on `main`, so the team's app can run on the shared VPS without letting any visitor or any generated page steer a tool-using agent or read the app's data.

**Architecture:** Work on branch `integration/one-app` (worktree `.worktrees/integration`, created off `origin/main` `c7291a1`, local only). The server gets typed settings, an access-code gate with a `SameSite=Strict` HttpOnly cookie, Origin / Host / body-size / rate-limit guards, and a hardened CSP for generated HTML. Hermes-written React pages (`/api/solution`) stop running inside the app: they are served by a separate sandbox dev server (own origin, strict CSP) and shown in `<iframe sandbox="allow-scripts">`. Teammates' route modules are not edited; guards attach in `server/app/main.py`.

**Tech Stack:** FastAPI + Starlette + pydantic-settings + httpx (server, uv, pytest); Vite 8 + React 19 + TypeScript + react-router + Vitest + Testing Library (client, pnpm).

**Spec:** `doc/specs/2026-10-24-integration-design.md` (sections "Engine", "Lesson rendering", "Quality and repo hygiene"; phase 2 of the phase table). Later phases (porting our Runs-API engine, intake, skills, lesson page, design system, eval, VPS) get their own plans.

## Global Constraints

- Branch `integration/one-app` in `/home/reallyboard/git/learning-in-progress/.worktrees/integration`. Never push. Commit per task, Conventional Commits.
- Do not edit teammates' route modules (`server/app/routers/assess.py`, `generate.py`, `solution.py`, `profile.py`, `survey.py`) except where a task names the exact function (Task 5: `generate.prepare_page` and `generate.CSP`).
- pnpm only in `client/` (never npm; `client/package-lock.json` stays untouched, `client/pnpm-lock.yaml` stays uncommitted). uv only in `server/`.
- Never print secrets. Check `.env` keys with `grep -c '^NAME=' file`. Plain `grep` is rewritten to ripgrep in this shell: use `/usr/bin/grep` for GNU regex. The `rtk` hook rewrites some tool output (e.g. prettier, ps): use `rtk proxy <cmd>` when the exact output or exit code matters.
- Ports for live checks in this worktree: Vite app `5175`, sandbox `5180`, FastAPI `8001`. The other worktree's servers (`5174`, `8000`) and Hermes (`8642`) stay running and untouched.
- UI copy German, `du`, short and warm; errors coral with a left border, never red; visible focus ring (style guide `doc/design/STYLE_GUIDE.md` on branch `origin/Frontend_ApplicationForm`).
- Error bodies are JSON `{"detail": "<code>"}` with these exact codes: `access_required`, `access_not_configured`, `invalid_access_code`, `too_many_attempts`, `origin_not_allowed`, `request_too_large`, `too_many_runs`.
- `feat/hermes-demo` is **not** merged wholesale: `main` now has its own end-to-end flow (Nils, `c7291a1`: Home → `/application` → MagicStep → `/api/solution` → `/solution/:uuid`). Our pieces (Runs-API engine, json-render catalog, feedback loop, `hermes/`, `data/`) are ported in the next plan.
- Settings names and defaults (exact): `HERMES_BASE_URL` (optional), `HERMES_API_KEY` (optional, secret), `ACCESS_CODE` (optional, secret; unset ⇒ gated routes answer 503 `access_not_configured`), `APP_ORIGINS` = `http://localhost:5173,http://localhost:5174,http://localhost:5175`, `ALLOWED_HOSTS` = `localhost,127.0.0.1`, `MAX_BODY_BYTES` = `262144`, `HERMES_RUNS_PER_MINUTE` = `6`, `ACCESS_ATTEMPTS_PER_MINUTE` = `10`. Lists are comma-separated in the environment.
- Checks before every commit — server: `uv --directory server run pytest -v`, `uv --directory server run --with ruff ruff check .`; client (in `client/`): `pnpm test:run`, `pnpm typecheck`, `pnpm exec oxlint src`, `rtk proxy pnpm exec prettier --check src` (pre-existing failures in files a task does not touch are noted, not fixed), `pnpm build`.

## Review Focus

1. A legitimate student retrying after a Hermes error within a minute must not be locked out: 6 Hermes runs per minute pass, the 7th gets 429 `too_many_runs` with a `Retry-After` header (Task 3).
2. A full-size German material (60,000 characters with umlauts, plus profile JSON) must pass the body cap; only bodies over 262,144 bytes are refused with 413 (Task 3).
3. The Vite proxy forwards `Host: localhost:5175`: a host with a port must pass `TrustedHostMiddleware`, `evil.example` must not (Task 3).
4. An access code typed with surrounding spaces or a trailing newline must still work (strip before compare); a wrong code must not reveal whether a code is configured beyond `invalid_access_code` (Task 2).
5. A Solution Page URL with an unknown or malformed uuid must show a friendly German "nicht gefunden" view inside the sandbox, not a blank frame or a stack trace (Task 4).

---

### Task 1: Baseline, typed settings, configurable API proxy target

**Files:**
- Create: `server/app/settings.py`
- Modify: `server/app/hermes.py` (`get_client` only), `server/.env.example`, `server/pyproject.toml` (+`pydantic-settings` if missing), `client/vite.config.ts` (proxy target)
- Test: `server/tests/test_settings.py`

**Interfaces:**
- Produces: `class Settings(BaseSettings)` with fields `hermes_base_url: str | None`, `hermes_api_key: SecretStr | None`, `access_code: SecretStr | None`, `app_origins: list[str]`, `allowed_hosts: list[str]`, `max_body_bytes: int`, `hermes_runs_per_minute: int`, `access_attempts_per_minute: int` (defaults from Global Constraints; env file `.env`, case-insensitive); `def get_settings() -> Settings` (cached with `functools.lru_cache`). Comma-separated list parsing via `Annotated[list[str], NoDecode]` plus a `field_validator(..., mode="before")` that splits on commas and strips items.
- Produces: Vite proxy target `env.API_URL || 'http://localhost:8000'` (read with `loadEnv(mode, process.cwd(), '')`).

- [ ] **Step 1: Baseline.** In the worktree: `pnpm -C client install`, `uv --directory server sync`. Run all checks from Global Constraints. Record counts and any pre-existing failures in the report (expected roughly: server ~52 tests, client ~33).
- [ ] **Step 2: Write failing tests** in `server/tests/test_settings.py`: `test_defaults` (no env → `app_origins == ["http://localhost:5173","http://localhost:5174","http://localhost:5175"]`, `allowed_hosts == ["localhost","127.0.0.1"]`, `max_body_bytes == 262144`, `hermes_runs_per_minute == 6`, `access_code is None`); `test_comma_lists_are_split_and_stripped` (`APP_ORIGINS=" http://a , http://b "` → `["http://a","http://b"]`); `test_access_code_is_secret` (`repr(Settings(access_code="x"))` does not contain `x`). Use `monkeypatch.setenv` and `Settings(_env_file=None)` so a local `.env` does not leak into tests.
- [ ] **Step 3: Run** `uv --directory server run pytest -v tests/test_settings.py` → FAIL (module missing).
- [ ] **Step 4: Implement** `server/app/settings.py`; switch `hermes.get_client()` to read `get_settings()` and raise `HermesError("HERMES_BASE_URL and HERMES_API_KEY must be set in server/.env")` when either is missing (keep the lazy, cached client so the server still starts without them). Add all settings names with comments to `server/.env.example` (no values for secrets).
- [ ] **Step 5: Run** the settings tests and the full server suite → PASS (existing `test_hermes.py` may need `get_settings.cache_clear()` in a fixture if it sets env vars; adjust only test setup, not assertions).
- [ ] **Step 6: Proxy target.** Change `client/vite.config.ts` to `defineConfig(({ mode }) => …)` with the `/api` proxy target from `API_URL`; `pnpm build` passes.
- [ ] **Step 7: Commit** `feat: add typed server settings and configurable api proxy target`.

### Task 2: Request guards (Host, Origin, body size, rate limit)

**Files:**
- Create: `server/app/guards.py`, `server/tests/conftest.py` (shared settings override incl. `testserver` host)
- Modify: `server/app/main.py`
- Test: `server/tests/test_guards.py`

**Interfaces:**
- Consumes: `get_settings()` (Task 1).
- Produces: `class OriginCheckMiddleware` (pure ASGI): for methods other than GET, HEAD, OPTIONS, a present `Origin` not in `settings.app_origins` → 403 `origin_not_allowed`; a missing `Origin` passes. `class BodySizeLimitMiddleware` (pure ASGI): `Content-Length` above `max_body_bytes` → 413 `request_too_large`; without `Content-Length`, count received bytes and stop with 413 once exceeded. `class RateLimiter(per_minute: int, clock: Callable[[], float] = time.monotonic)` with `def hit(key: str) -> float | None` (seconds until retry, or `None` when allowed; sliding 60 s window, in memory) and dependency `async def limit_hermes_runs(request: Request) -> None` → 429 `too_many_runs` + `Retry-After: <int seconds>`; key = `request.client.host`. Mark with `# ponytail: in-process memory; move to Redis or the reverse proxy when running several workers.` `TrustedHostMiddleware(allowed_hosts=settings.allowed_hosts)` wired in `main.py`. Middleware must not buffer streamed (SSE) responses.

- [ ] **Step 1: Write failing tests** (`test_guards.py`): `test_post_from_foreign_origin_is_403`; `test_post_without_origin_passes`; `test_get_from_foreign_origin_passes` (GET is not checked); `test_host_with_port_is_allowed` (`Host: localhost:5175` → not 400) and `test_foreign_host_is_400`; `test_body_over_limit_is_413` (262,145 bytes); `test_full_german_material_passes_limit` (JSON with 60,000 × `"ä"` plus a small profile, under 262,144 bytes → reaches the route); `test_seventh_run_in_a_minute_is_429` (6 × `POST /api/generate` pass the limiter, 7th → 429 with `Retry-After`; stub the route's Hermes call with monkeypatch as in `test_generate.py`); `test_limiter_window_slides` (`RateLimiter` with a fake clock: after 60 s a hit is allowed again); `test_sse_stream_is_not_buffered` (a streamed route through the middleware yields its first chunk before the body ends, e.g. via `httpx.AsyncClient(transport=ASGITransport(app))` streaming).
- [ ] **Step 2: Run** `uv --directory server run pytest -v tests/test_guards.py` → FAIL.
- [ ] **Step 3: Implement** `guards.py`; in `main.py` add the middlewares (TrustedHost outermost, then body size, then Origin) and `dependencies=[Depends(limit_hermes_runs)]` on `include_router` for `assess`, `generate`, `solution`.
- [ ] **Step 4: Run** full server suite + ruff → PASS (existing tests send no `Origin` and small bodies; `TestClient`'s default host `testserver` is allowed through the `conftest.py` settings override, not through the defaults).
- [ ] **Step 5: Live check:** start FastAPI on `8001` from this worktree (`uv --directory server run --env-file .env fastapi dev --port 8001` after copying `../feat-hermes-demo/server/.env` to `server/.env`, `chmod 600`); with curl: foreign `Origin` POST → 403; `Host: evil.example` → 400; oversized body → 413.
- [ ] **Step 6: Commit** `feat: add host, origin, body-size and rate-limit guards`.

### Task 3: Access-code gate for Hermes routes

**Files:**
- Create: `server/app/access.py`, `server/app/routers/access.py`, `client/src/api/access.ts`, `client/src/features/access/AccessGate.tsx`
- Modify: `server/app/main.py` (include access router; add the gate dependency to the `assess`, `generate`, `solution` routers), `client/src/App.tsx` (wrap gated routes)
- Test: `server/tests/test_access.py`, `client/src/features/access/AccessGate.test.tsx`

**Interfaces:**
- Consumes: `get_settings()` (Task 1); `RateLimiter` (Task 2).
- Produces (server): `ACCESS_COOKIE = "lip_access"`; `def access_token(code: str) -> str` = HMAC-SHA256 hex of the message `b"lip-access-v1"` keyed by the stripped code; `async def require_access(request: Request, settings: Settings = Depends(get_settings)) -> None` (503 `access_not_configured` if no code configured; 401 `access_required` if cookie missing or `hmac.compare_digest` fails). Routes: `GET /api/access` → 204 when the cookie is valid, else the same errors as `require_access`; `POST /api/access` body `{"code": str}` (max 200 chars) → 204 with `Set-Cookie: lip_access=<token>; HttpOnly; SameSite=Strict; Path=/api; Max-Age=604800` plus `Secure` when the request scheme is `https`; wrong code → 401 `invalid_access_code`; limited per client by a second `RateLimiter(settings.access_attempts_per_minute)` (429 `too_many_runs` reused is wrong here: answer 429 with `{"detail": "too_many_attempts"}` and `Retry-After`).
- Produces (client): `checkAccess(): Promise<boolean>`, `enterAccessCode(code: string): Promise<void>` (throws `ApiError` on 401) in `client/src/api/access.ts`; `<AccessGate>{children}</AccessGate>` that renders children only after `checkAccess()` is true, otherwise a centred card (style guide "Main card"): kicker `Zugang`, heading `Gib deinen <em>Zugangscode</em> ein.`, password input labelled `Zugangscode`, primary button `Weiter →`, coral error `Der Code stimmt nicht.` on 401, `Der Server ist noch nicht eingerichtet.` on 503.

- [ ] **Step 1: Write failing server tests** (`server/tests/test_access.py`, `TestClient` used as a context manager, `app.dependency_overrides[get_settings]` for config): `test_gated_route_without_cookie_is_401` (`POST /api/solution` → 401 `access_required`); `test_unconfigured_code_is_503`; `test_correct_code_sets_strict_httponly_cookie` (check `HttpOnly`, `SameSite=Strict`, `Path=/api`, `Max-Age=604800`, no `Secure` over http); `test_code_with_whitespace_is_accepted` (`"  abc\n"` vs configured `abc`); `test_wrong_code_is_401_invalid`; `test_cookie_opens_gated_route` (after login, `POST /api/solution` reaches the route: monkeypatch `hermes.ask_hermes` to raise `hermes.HermesError` and expect the route's own 502, proving the gate passed); `test_ungated_routes_stay_open` (`GET /api/health`, `GET /api/survey` → 200 without cookie).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** `access.py`, the access router, and in `main.py` pass `dependencies=[Depends(require_access)]` to `include_router` for `assess`, `generate`, `solution`.
- [ ] **Step 4: Run** server suite → PASS. Existing tests of the gated routes must keep passing: give them a shared fixture that overrides `require_access` (add it to `server/tests/conftest.py`), do not change their assertions.
- [ ] **Step 5: Write failing client tests** (`AccessGate.test.tsx`, `vi.stubGlobal('fetch', …)` as in `client/src/api/*.test.tsx`): shows children when `GET /api/access` is 204; shows the code card on 401; submitting a wrong code shows `Der Code stimmt nicht.`; a right code shows the children; 503 shows the not-configured text.
- [ ] **Step 6: Implement** `access.ts` (reuse `request` from `client/src/api/client.ts`) and `AccessGate.tsx`; wrap the `/application`, `/playground`, `/learn/:id`, `/solution/:uuid` route elements in `App.tsx` (the landing `/` stays public).
- [ ] **Step 7: Run** client checks → PASS. **Live check:** copy `../feat-hermes-demo/server/.env` to `server/.env` (`chmod 600`), append `ACCESS_CODE=$(openssl rand -hex 16)` without echoing it, start FastAPI on `8001` and Vite on `5175` (`API_URL=http://localhost:8001 pnpm dev --port 5175 --strictPort`), confirm with curl: `POST /api/solution` without cookie → 401; `POST /api/access` with the code (read it inside the command) → 204 + cookie.
- [ ] **Step 8: Commit** `feat: gate hermes routes behind an access code`.

### Task 4: Run Hermes-written Solution Pages in a sandbox origin

**Files:**
- Create: `client/vite.sandbox.config.ts`, `client/sandbox.html`, `client/src/sandbox/main.tsx`, `client/src/sandbox/pages.ts`, `client/src/sandbox/origin.ts`, `client/src/sandbox/SandboxPage.tsx`
- Modify: `client/src/features/application/SolutionRoute.tsx`, `client/package.json` (script `dev:sandbox`), `.gitignore` (+`client/src/features/application/generated/`), `client/README.md` (how to start the sandbox)
- Test: `client/src/sandbox/pages.test.ts`, `client/src/features/application/SolutionRoute.test.tsx`

**Interfaces:**
- Produces: `PAGE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/`; `function resolvePage(id: string | null, pages: Record<string, () => Promise<unknown>>): (() => Promise<unknown>) | null` in `client/src/sandbox/pages.ts` (null for a malformed id or a missing `./generated/<id>.tsx` key; the glob lives in `main.tsx`); `function sandboxOrigin(): string` = `import.meta.env.VITE_SANDBOX_ORIGIN ?? 'http://localhost:5180'` in `client/src/sandbox/origin.ts`.
- Sandbox server (`vite.sandbox.config.ts`): port `5180`, `strictPort`; builds only `sandbox.html` (outDir `dist-sandbox`); response header `Content-Security-Policy` = `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' ws://localhost:5180; form-action 'none'; base-uri 'none'; object-src 'none'; frame-ancestors http://localhost:5173 http://localhost:5174 http://localhost:5175` (`'unsafe-inline'` scripts only for the dev React-refresh preamble; comment that a production build drops it); CORS that lets the opaque-origin frame load its own modules (`Origin: null`) — verify in the live step and adjust only the sandbox config.
- `SolutionRoute` renders, for a well-formed uuid, `<iframe title="Deine Lernseite" sandbox="allow-scripts" src={`${sandboxOrigin()}/sandbox.html?page=${uuid}`}>` filling the page, and keeps its current `NotFound` for a malformed uuid. The app bundle no longer imports anything from `./generated/`.
- `function SandboxPage({ load }: { load: (() => Promise<unknown>) | null })` in `client/src/sandbox/SandboxPage.tsx` renders the loaded default export inside `<div className="app-shell application-page">`, or, for `null` or a module without a default-export component, a German card: heading `Diese Seite gibt es nicht (mehr).`, text `Lass Hermes eine neue Seite für dich bauen.` `sandbox/main.tsx` only imports the app CSS (`../index.css`, `../features/application/application.css`), runs the glob, calls `resolvePage(new URLSearchParams(location.search).get('page'), pages)` and mounts `<SandboxPage>`.

- [ ] **Step 1: Write failing tests:** `pages.test.ts` — `resolvePage` returns the loader for an existing well-formed id, `null` for `"../../etc"`, `"abc"`, an uppercase or missing id, and an unknown well-formed id; `SandboxPage` with `load={null}` shows the heading `Diese Seite gibt es nicht (mehr).`, and with a loader resolving to `{ default: () => <h1>Test</h1> }` shows `Test`. `SolutionRoute.test.tsx` — for `/solution/<valid uuid>` an iframe with `sandbox` exactly `allow-scripts` and the expected `src`; for `/solution/not-a-uuid` the NotFound heading; `import.meta.glob` is not used in `SolutionRoute.tsx` (assert by reading the source file with `node:fs` like the existing drift test pattern, or by mocking — the implementer picks one).
- [ ] **Step 2: Run** `pnpm test:run src/sandbox src/features/application/SolutionRoute.test.tsx` → FAIL.
- [ ] **Step 3: Implement** the files above; add `"dev:sandbox": "vite --config vite.sandbox.config.ts"`.
- [ ] **Step 4: Run** client checks → PASS.
- [ ] **Step 5: Live check** (chrome-devtools tools, load with ToolSearch): create a throwaway page `client/src/features/application/generated/00000000-0000-4000-8000-000000000000.tsx` (a component showing a heading and running `fetch('http://localhost:5175/api/health')` in an effect), start the sandbox (`pnpm dev:sandbox`) and the app on `5175`, open `http://localhost:5175/solution/00000000-0000-4000-8000-000000000000` (after entering the access code): the heading renders inside the frame; the console shows the fetch blocked by CSP; `document.cookie` and `localStorage` in the frame do not expose the app's data. Delete the throwaway file. Record evidence (screenshot path, console lines) in the report.
- [ ] **Step 6: Commit** `feat: isolate hermes-written solution pages in a sandbox origin`.

### Task 5: Harden the CSP of generated HTML lessons

**Files:**
- Modify: `server/app/routers/generate.py` (`CSP` constant and `prepare_page` only)
- Test: `server/tests/test_generate.py` (add cases; keep existing ones)

**Interfaces:**
- Produces: `prepare_page(reply: str) -> str | None` keeps its contract (HTML document from the reply, our CSP right after the doctype) and additionally removes every model-written `<meta http-equiv="Content-Security-Policy" …>` and every `<base …>` tag (case-insensitive) before inserting ours. `CSP` keeps its current directives and gains `form-action 'none'; base-uri 'none'` and allows no external script host (no `cdn.jsdelivr.net`).

- [ ] **Step 1: Write failing tests:** `test_model_csp_meta_is_removed` (a reply with its own permissive CSP meta → only our CSP remains); `test_base_tag_is_removed`; `test_csp_forbids_forms_and_base`; `test_csp_comes_before_any_model_script` (a `<script>` placed before `<head>` still comes after our meta).
- [ ] **Step 2: Run** `uv --directory server run pytest -v tests/test_generate.py` → FAIL.
- [ ] **Step 3: Implement** in `prepare_page` / `CSP`.
- [ ] **Step 4: Run** server suite + ruff → PASS.
- [ ] **Step 5: Commit** `fix: strip model csp and base tags from generated lessons`.

## Not in this plan (next plans)

Porting our Runs-API engine as server-side endpoints (`/api/analyse`, `/api/lesson/*`, events relay, server-owned approvals auto-deny + log), CI workflow (after the team picks one package manager), intake changes, skills and `verify_quotes`, lesson page, design system, eval harness, VPS deployment with a sandboxed Hermes. Residual risk until the VPS plan: Hermes' own file tool can write anywhere its user can; on the laptop this is accepted for development, on the VPS Hermes runs in a container with only the generated-pages directory writable.
