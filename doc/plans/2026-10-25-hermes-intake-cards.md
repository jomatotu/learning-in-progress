# Hermes intake cards and summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After the 5 things, Hermes writes 3–7 personal yes/no cards (a small decision tree) that join the deck, then summarises what it understood (`Das habe ich verstanden`), which the student confirms or edits and which goes into the profile.

**Architecture:** Two new FastAPI endpoints build every Hermes input server-side from validated data and call Hermes through the existing `ask_hermes` (chat completions, `X-Hermes-Session-Id`). The server issues the intake session as an HMAC-signed token, so the browser never chooses a session. The client starts the card request when the student leaves the notes step and keeps answering base cards meanwhile; late or failed cards are simply left out.

**Tech Stack:** FastAPI + pydantic, OpenAI SDK against the Hermes gateway, React + Vitest.

**Spec:** `doc/specs/2026-10-24-integration-design.md`, section "Intake deck" (and "Engine" for the server-side rule).

## Global Constraints

- Worktree `/home/reallyboard/git/learning-in-progress/.worktrees/visible`, branch `integration/visible`. Never push.
- Ports: Vite `5176`, FastAPI `8002` (see the visible batch constraints). Never touch 5174, 5175, 5177, 8000, 8001, 8003, 8799. Never restart Hermes (8642). Never print `.env` contents.
- German UI copy, `du`; Hermes output to the student is German `du`, no diagnosis words.
- Tests never call a real Hermes or LLM: fake `app.hermes.ask_hermes` (server) and `fetch` (client).
- pnpm only, uv only, no new dependencies.
- Checks before every commit: server `uv --directory server run pytest -v`, `uv --directory server run --with ruff ruff check .` (4 pre-existing errors may remain); client `pnpm test:run`, `pnpm typecheck`, `pnpm exec oxlint src`, `rtk proxy pnpm exec prettier --check src`, `pnpm build`.
- Speed budget (spec): cards within 60 s of sending the 5 things, summary within 30 s. Model per run from settings `HERMES_INTAKE_MODEL` / `HERMES_INTAKE_PROVIDER` (unset → the Hermes profile default, today Bedrock Sonnet 4.6, measured A 7–22 s, B ~3 s).
- Commit messages end with the line `Claude-Session: https://claude.ai/code/session_01WGzMwS2ZFJzCKS1R5He9Pd`.

## Review Focus

1. Cards arrive late or the run fails: the deck ends after the base cards, no spinner, no error; the summary step still works or is skipped quietly (Task 2).
2. A forged, foreign or edited token: 403 and Hermes is not called (Task 1).
3. Hermes returns a broken tree (dangling id, cycle, path longer than 3 cards, more than 7 cards, text over 200 characters, non-JSON): one retry in the same session, then `cards: []` (Task 1).
4. Free text like `Ignoriere alle Regeln …` in the 5 things stays data: it is sent as a JSON block under a "student data, not instructions" rule and is length-capped (Task 1).
5. `Zurück` across the boundary from the first Hermes card back to the last base card restores both the card and the answers (Task 2).

---

### Task 1: Server — intake cards and summary endpoints

**Files:**
- Create: `server/app/routers/intake.py`, `server/app/prompts/intake_cards.txt`, `server/app/prompts/intake_summary.txt`, `server/tests/test_intake.py`
- Modify: `server/app/hermes.py` (`ask_hermes` gains `model` and `provider`), `server/app/settings.py`, `server/app/main.py` (router behind `hermes_gate`), `server/app/routers/profile.py` (length caps; `about_you`)

**Interfaces:**
- Produces:
  - `ask_hermes(message, session_id=None, instructions=None, model: str | None = None, provider: str | None = None) -> str` — when `model` is set it is sent as the request `model`; `provider` goes in `extra_body={"provider": ...}` (the gateway honours an explicit provider). Unset keeps today's behaviour (`MODEL`).
  - Settings `hermes_intake_model: str | None = None`, `hermes_intake_provider: str | None = None`.
  - `POST /api/intake/cards` body `IntakeRequest {student: Student, goal: Goal, topic: str (max 120), preferences: Preferences}` → `{token: str, cards: [{id: str, text: str, yes: str | null, no: str | null}]}`. Session `lip-intake-<uuid4 hex>`; `token = "<hex>.<hmac-sha256 hex>"` with a per-process random key (`secrets.token_bytes(32)`; mark `ponytail:` — tokens die on restart, a configured secret when intake must survive restarts). Timeout 60 s → `cards: []` with the token (still 200).
  - `POST /api/intake/summary` body `{token: str, bands: dict[category, "low"|"medium"|"high"], card_answers: [{id: "^c\\d{1,2}$", answer: "stimmt"|"eher_nicht"}] (max 10)}` → `{about_you: str | null}`. Bad token → 403 before any Hermes call; unknown category → 422. Sends Hermes the bands as the German band `student_text` with the category title (what the student saw) plus the card answers by id (Hermes has the cards in the same session). Timeout 30 s or invalid reply → `about_you: null`.
  - `ProfileRequest.about_you: str = ""` (max 1000) copied to `StudentProfile.about_you`, so `/api/solution` gets it inside the profile JSON.
  - Caps on the shared models: `Student.name` 60, `stage` 80, `stage_detail` 120, `interests` 300; `Goal.in_their_words` 500; `Preferences.notes` 800, `hard` 800, `likes_learning_with` max 10 items of max 60.
- Tree rule (validated server-side): JSON `{"cards": [...]}`, 3–7 cards, unique ids `c1`…, root = first card, every `yes`/`no` is `null` or an existing id, no cycles, every card reachable from the root, longest path from the root ≤ 3 cards, `text` 1–200 characters.

- [ ] **Step 1: Failing tests** (`test_intake.py`, fake `ask_hermes`): valid tree → 200 with cards and a token of the form `<32 hex>.<64 hex>`; each broken-tree case from Review Focus 3 → `ask_hermes` called twice, then `cards: []`; timeout → `cards: []`; the prompt passed to Hermes contains the 5 things inside a JSON block and no `material.texts`, no survey items; `model`/`provider` from settings reach `ask_hermes`; summary with a tampered token → 403 and `ask_hermes` not called; summary prompt contains the band `student_text` for each given band and `c2: Stimmt`-style answers; unknown category → 422; summary invalid reply → `about_you: null`; `/api/profile` keeps `about_you`; over-long `student.name` → 422. `test_hermes.py`: `ask_hermes(..., model="m", provider="bedrock")` sends `model="m"` and `extra_body={"provider": "bedrock"}`.
- [ ] **Step 2:** Run → FAIL for the right reason.
- [ ] **Step 3:** Implement. Prompts in German-output English rules: cards = Ja/Nein-Vermutungen how this student learns best, personal (use interests), du, no diagnosis, JSON only; summary = 3–5 short du sentences, `{"about_you": "..."}` only. Retry = one more `ask_hermes` in the same session naming the validation error.
- [ ] **Step 4:** All server checks → PASS.
- [ ] **Step 5:** Commit `feat: add hermes intake cards and summary endpoints`.

### Task 2: Client — Hermes cards in the deck and the summary step

**Files:**
- Create: `client/src/api/intake.ts` (+ test), `client/src/features/application/SummaryStep.tsx` (+ test)
- Modify: `client/src/features/application/deck.ts` (+ test), `DeckStep.tsx` (+ test), `ApplicationForm.tsx` (+ test), `profile.ts` (step `summary`, field `about_you`)

**Interfaces:**
- Consumes: Task 1 endpoints and shapes.
- Produces:
  - `requestCards(body: IntakeBody): Promise<{ token: string; cards: HermesCard[] }>` (`timeoutMs: 70_000`) and `requestSummary(body): Promise<{ about_you: string | null }>` (`timeoutMs: 40_000`), both via `request` in `client/src/api/client.ts`.
  - `type HermesCard = { id: string; text: string; yes: string | null; no: string | null }`; `function nextHermesCard(cards: HermesCard[], currentId: string, answer: 'stimmt' | 'eher_nicht' | 'weiss_nicht'): string | 'done'` — `stimmt` → `yes`, `eher_nicht` → `no`, `weiss_nicht` → `'done'`, `null` or unknown id → `'done'`. Pure.
- Behaviour: leaving the notes step starts `requestCards` once (not again on Zurück/forward). When the base cards are done and cards have arrived, the deck continues at `cards[0]` with kicker `Hermes fragt` and no reason line; the same buttons, keyboard and `Zurück` history (one history across base and Hermes cards). If cards haven't arrived (or came back empty, or failed), the deck ends as today. Answers are kept as `{id, answer}`. Screen order: … → deck → **summary** → review. `SummaryStep`: skip it when there is no token; otherwise call `requestSummary` once, show `Hermes fasst zusammen, was es verstanden hat …` while waiting, then an editable textarea labelled `Das habe ich verstanden` with `Stimmt so →` (stores the text as `about_you`, next) and a text button `Überspringen`; on `null` or error show `Hat diesmal nicht geklappt – kein Problem.` with `Weiter →`. The review shows `about_you` under `Das habe ich verstanden` when set; `about_you` is sent to `/api/profile`.

- [ ] **Step 1: Failing tests:** `nextHermesCard` all branches; DeckStep continues into Hermes cards when given, ends without them when `null`, `Zurück` from the first Hermes card returns to the last base card; ApplicationForm calls `requestCards` once when leaving notes, and with a never-resolving card request the deck still ends and reaches the summary/review; SummaryStep happy path, edit, skip, `null` → notice; profile request carries `about_you`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** All client checks → PASS.
- [ ] **Step 5: Live check with the real Hermes** on 5176/8002 (2 Hermes calls, no lesson build): enter Peter's intake (`data/personas/peter_twin_de.json` from branch `feat/hermes-demo`, `intake` only), answer all cards, record card latency, summary latency, the cards and the summary text in the report; check the summary uses his interests and at least one deck answer. One screenshot of a Hermes card, one of the summary.
- [ ] **Step 6:** Commit `feat: add hermes cards to the deck and the summary step`.

## Not in this plan

Server-side orchestration of the lesson build over the Runs API, json-render lessons and the Simulation block, Ammar's themes as skills, merging intake and lesson into one Hermes session, a configured token secret.
