# Integration design: one working app from all branches

Status: v2 approved by Chirag ("build the security layer and then make the best that we can of this project on a
new integration branch"). Order: phase 1 (integration branch) → phase 2 (security layer) first, then phases 3–7.
Defaults until decided otherwise: student-run approvals are auto-denied by the server and logged (no shell commands
in the student UI); `client/package-lock.json` stays as on `main` until the team picks one package manager.

Research behind every choice (full reports with sources, in `.superpowers/sdd/2026-10-24-hermes-engine/`):
`research-merit-audit.md` (our code vs teammates' code, security), `research-programming-best-practices.md`
(official docs: OWASP LLM Top 10 2025, FastAPI, Starlette, React Router, Vitest, MSW, Tailwind v4, pnpm, MDN),
`research-generative-ui.md` (json-render, A2UI, MCP Apps, AI SDK, Google Generative UI), plus
`openmaic-skills-report.md` and the DeepTutor survey.

## Why

Six people built pieces of the same app on separate branches. Each piece works alone; none hands off to the next
(the form's profile goes nowhere, the onboarding is decoration on `main`, lesson pages run on a mock student). There
are two Hermes integrations, three intake flows, three Peters and three colour systems. For the jury, the demo and the
code check we need **one student journey that works end to end**, built from the best piece each teammate made —
chosen on merit — and a codebase where every file has a reason to exist.

## Decided by Chirag (2026-10-24)

- **Timing**: demo tomorrow or later → full plan plus a rehearsal.
- **Hermes host**: develop on the laptop (local `lip-student` profile), then deploy to the team VPS (Chirag has access).
- **Language**: German UI, German material (`peter_twin_de`, a German photosynthesis text).
- **Challenge**: optional label (ADHS, Legasthenie, other) plus everyday words. No diagnosis box.
- **Lesson form**: both catalog blocks and HTML, Hermes chooses (refined below: HTML lives inside one block type).
- **Design source**: BlackBeardXD's `doc/design/STYLE_GUIDE.md`.

## Goals

1. One journey: landing → about you → "bist du das?" → what to learn → pick formats → lesson → feedback.
2. One Hermes path (server-side), one profile shape, one progress view, one lesson view, one design system.
3. Every teammate's working piece is used where it fits best; nothing runs on mock data.
4. Fast first result on stage (seconds to an outline), a fallback if the network is slow.
5. Code check ready: CI green on every PR, one lockfile, one README quickstart, docs that match the code.

## Non-goals

New features beyond the journey (no multi-agent classroom, voices, curricula, PDF upload); multi-tenant accounts.

## Anti-goals

Gimmicky output; content Hermes invented (everything comes from the material, each block quotes its source);
teammates' work deleted without their OK; a browser that can steer a tool-using agent.

## The journey

| # | Student sees | Built from | Why this piece (research) |
| --- | --- | --- | --- |
| 1 | Landing | Nils (`Home`) | the front door; style guide hero layout |
| 2 | **5 things about you**: name, interests, goal + material, what makes learning hard, what already helped (chips, free text or mic); optional challenge label | BlackBeardXD's form shell (about / goal / material steps) + Nils's chips and mic | richest signal for the least effort |
| 3 | **Yes/no deck "Stimmt / Eher nicht"** (see "Intake deck") | `scale.json` band texts (BlackBeardXD) + Hermes-written cards | same information Hermes gets from the survey (one band per category), with consent, in about a minute |
| 3b | "Genauer? 30 kurze Fragen" — optional | BlackBeardXD's survey + server scoring | kept for students who want it; overrides deck bands where answered |
| 3c | "Das habe ich verstanden" — Hermes' summary in its own words; confirm or edit | ours (same Hermes session) | the student controls how the AI sees them |
| 4 | Pick formats: 3–6 proposals | ours (proposals) + Ammar's 5 themes as Hermes skills | one menu, evidence notes attached |
| 5 | Lesson builds: outline in seconds, then parts stream in with skeletons; live status | json-render streaming + Ammar's `HermesProgress` + our status | generative-UI research: outline-then-sections, stream patches, re-request only failed parts |
| 6 | Lesson page `/learn/:id`, one tab per picked format; the top pick builds first, the others on demand | Ammar's `/learn/:id` tabs + our catalog blocks | parallel builds strain Hermes' 10-run limit |
| 7 | "Was soll Hermes ändern?" per part | ours (same session) | feedback patches one part; Hermes remembers what helped |

## Intake deck (decided by Chirag, 2026-10-25)

- **Unit**: one mirror card at a time — kicker `Das heißt für dich`, one sentence, a one-line reason (`Deshalb …`), buttons
  `Eher nicht` / `Stimmt →` (mockup "Mirror after each part"). Fits one screen; one tap.
- **Base cards (instant, no AI)**: for each of the 8 `scale.json` categories start with the `low` band's `student_text`
  (translated to German, `du`). `Stimmt` → band `low`, next category. `Eher nicht` → show the `high` band's text:
  `Stimmt` → `high`, `Eher nicht` → `medium`. At most 2 cards per category (8–16 cards). A `Weiß nicht` skip leaves the
  category unset. The resulting bands select the same `ai_instructions` the survey would.
- **Hermes cards (in parallel)**: as soon as the 5 things are sent, one Hermes run writes 3–5 personal yes/no
  hypotheses (e.g. `Hausaufgaben gehen besser mit Timer, wie ein Spiel?`) **with their follow-ups planned ahead**: each
  card carries the next card for `Stimmt` and the next card for `Eher nicht` (a small decision tree, depth 2), so
  answering never waits for Hermes. They join the deck after the base cards when ready; if the run is late, the deck
  ends without them.
- **Summary**: after the deck, the same Hermes session gets the answers (base bands + Hermes cards) and writes
  `Das habe ich verstanden`; the student confirms or edits (step 3c).
- **Speed budget**: base cards ~3 s each; Hermes cards must be ready within ~60 s of sending the 5 things; summary
  within ~30 s. A fast GWDG model is used for these two small runs if the timing test shows the agent default is too
  slow (Runs API accepts a per-request `model`). **First step of the intake plan: measure** both runs on the agent
  default vs. fast models (and a direct model call without the agent loop) and pick the model by measured latency and
  card quality.
- **Request shape**: the server builds both Hermes inputs from validated data — the 5 things, the deck answers as
  `{category: band}` plus Hermes-card answers, never raw survey items or free browser text beyond the 5 things.
- **Memory check**: the plan verifies with test personas that the summary and later lesson runs in the same session
  actually use the 5 things and the deck answers (recall check), and what Hermes stores in its own memory.

## Engine: server-side orchestration over the Runs API

**Change from v1** (research: OWASP LLM Top 10 2025 LLM01/LLM06, merit audit): the browser must not build agent
input. Today our proxy forwards the browser's run body unfiltered — a caller can set `instructions`, `model`, another
student's `session_id`, or answer approvals with `always`; a missing `Origin` (curl) passes. Ammar's endpoints build
prompts server-side but have no auth, rate limit or size caps.

- **FastAPI endpoints** (built on main's server as the base): `POST /api/analyse` (profile + material →
  analysis), `POST /api/profile/confirm`, `POST /api/lesson/plan` (takes proposal ids), `POST /api/lesson/part`,
  `POST /api/lesson/feedback`, `GET /api/runs/{id}/events` (relayed SSE, mapped to student-friendly status),
  `POST /api/runs/{id}/stop`. The server builds every Hermes `input` from validated pydantic models and issues the
  session id (`lip-<student>`); the browser only sends form data, proposal ids and feedback text (size-capped).
- **Hermes calls**: Runs API with `Idempotency-Key`; one shared `httpx.AsyncClient` created in FastAPI `lifespan`;
  streaming relay with client-disconnect handling, long read timeouts, no-buffer headers; stall detection; one
  automatic "resend valid JSON" turn — ported from Ammar's `hermes.py` + our `hermes_proxy.py` tests.
- **Approvals** are server-owned. The student never sees raw shell commands. Policy per environment (decision below).
- **Access**: access code on every `/api/*` route that starts or controls runs, rate limit per client, body-size caps,
  `TrustedHostMiddleware`, settings via `pydantic-settings`.
- **The generic `/api/hermes/*` passthrough** is removed (or kept behind a dev-only flag with the access code).
- **Ammar's `/api/assess` + `/api/generate`**: their logic moves into the endpoints above; the old routes stay until
  he agrees to retire them; `/playground` stays as a dev page.
- **Where Hermes runs**: `HERMES_BASE_URL` → laptop `lip-student` (dev) or the team VPS (demo). On the VPS Hermes runs
  sandboxed (container or VM, no secrets in reach).

Product rules stay JSON (`data/hermes/requirements.json`), sent by the server; teaching methods and lesson formats
are Hermes skills in `hermes/skills/` (this replaces the AGENTS.md rule "nothing app-specific in the profile").

## Skills and one tool

Installed by `hermes/setup.sh` into the profile (laptop and VPS), attribution in `THIRD_PARTY_NOTICES.md`
(OpenMAIC: MIT, "Copyright (c) 2026 THU-MAIC", commit `dff201b4`; DeepTutor: Apache-2.0 v1.6.15, modified files marked):

- **Ammar's 5 themes** → `lip-theme-chunked`, `-fill-blanks`, `-hobby-framing`, `-read-aloud`, `-teach-the-ai`.
- **Adapted OpenMAIC skills** (English, our block vocabulary, OpenMAIC tool calls removed, "answer in the material's
  language"): zone-of-proximal-development, learning-to-learn, fact-check, feynman-learning (1–2 loops),
  social-emotional-learning, workshop-style.
- **"What works for this student"** rule (DeepTutor `learning/models.py`): strategy, helped / not helped, evidence —
  Hermes keeps it in its own memory.
- **`verify_quotes` plugin tool** (DeepTutor `reading/_grounding.py`, ~115 lines stdlib): every `source` quote must be
  verbatim in the material before delivery; the server re-checks.

## Lesson rendering

Research (MDN, OWASP, A2UI docs, CHI EA '26 accessibility study): catalogs are safer, more consistent and more
accessible than model-written pages.

- **json-render catalog is the default** (Lesson, Chunk, Flashcard, Quiz, ReadAloud, Steps; each with `source`).
  Keep the spec shape close to A2UI's flat ID model; revisit A2UI when v1.0 is final.
- **New `Simulation` block** for interactive HTML (the "Hermes chooses HTML" case): sandboxed iframe inside the block,
  required `source`, a text alternative, keyboard check. No full-page HTML lessons.
- **CSP set by the server**, inserted as the first element after the doctype; model-written `<meta>`/`<base>` are
  stripped; `default-src 'none'`, inline scripts only, `connect-src 'none'`, `form-action 'none'`, `base-uri 'none'`;
  **no `cdn.jsdelivr.net`** (self-host pinned libraries if a simulation needs one). No profile data inside lesson HTML.
- `sandbox="allow-scripts"` without `allow-same-origin` (MDN) stays.

## Data

- **Profile**: `StudentProfile` (server) is the one shape, extended with the free-text answers, the optional label and
  the confirmed description. Client types derive from it.
- **Persona**: `data/personas/peter_twin_de.json` is the demo/test student; `intake` fills the form in tests; the
  `evaluation` block scores the result. `mockStudent.ts` is replaced. Kai's `peter.json`: ask Kai.
- **Browser storage**: only ids (student id, run ids) in `localStorage`; no profile data; guarded `JSON.parse`.

## Design system

Binding source: `doc/design/STYLE_GUIDE.md` (cream page, one purple accent, DM Sans + one Fraunces `<em>`, white
cards with warm borders and soft shadows, ink primary → purple hover, one primary per screen, coral errors never red,
focus ring `3px solid #6955c6`, reduced motion off, reading-comfort controls incl. calm mode, `du`, short warm copy).
Its starter tokens (section 14) become the one token set in `client/src/index.css` (Tailwind v4 `@theme static` /
`@theme inline`, so plain CSS reads them too); `onboarding.css`, `application.css` and the blocks use them; Hermes
gets them by role. The application page copy is translated to German (`du`).

## Quality and repo hygiene

- **CI** (GitHub Actions) on every PR: client (frozen install, typecheck, lint, prettier, tests, build) and server
  (`uv sync --locked`, ruff, pytest), required status checks.
- **One package manager, one committed lockfile** (decision below), `packageManager` pinned, `uv.lock` committed.
- **Tests**: bring main's server tests (scale, survey, profile, themes, sse, assess) along; shared `FakeEventSource`
  in Vitest `setupFiles`; MSW for network mocks; role-based queries; new tests for CSP bypass and prompt injection.
- **Client structure**: multi-step flows addressable by URL (step + ids in the URL), route-level error elements.
- **Evaluation**: a small judge harness on Peter's `evaluation` block (must_have, should_have, red_flags,
  recall_check) using hboyar's examiner-judge pattern, plus the quote check.
- Small PRs out of the integration branch, Conventional Commits.

## Cleanup (each agreed with its author first)

`server/app/gemini.py` + `google-genai` (unused); `ai/` and branch `ai` (hboyar); branch `feature/hermes-build`
(Ammar, already on main); Nils's unlinked static screens once replaced (Nils).

## Demo reliability

Outline in seconds and parts streaming in; a pre-built Peter lesson as a stored run and an offline HTML export; one
rehearsed path (Peter, German photosynthesis); `hermes/setup.sh --reset-memory` before a demo.

## Phases (each ends with CI green and a short review)

| Phase | What | Rough time |
| --- | --- | --- |
| 0 | Team check (Chirag): Ammar, BlackBeardXD, Nils, Jens, Kai, hboyar; lockfile decision | 15 min |
| 1 | Integration branch off `origin/main` (main's server as base), bring in `feat/hermes-demo`, resolve conflicts, add CI, lockfile, pydantic-settings | 1.5 h |
| 2 | Server-side orchestration endpoints + SSE relay + approvals policy + access code, rate limit, size caps; remove the passthrough; port Ammar's robustness; tests incl. injection | 2.5–3 h |
| 3 | Intake: form + Nils's questions (Q1 reworded, chip bug fixed) + optional label + opt-in survey → `StudentProfile`; "bist du das?" with 0–3 follow-ups; German application copy | 2 h |
| 4 | Skills + `verify_quotes` into `hermes/skills/`, `setup.sh` installs them | 2 h |
| 5 | Build + lesson: outline → streamed parts, `Simulation` block, server CSP, `/learn/:id` tabs, feedback per part, merged status view | 3 h |
| 6 | Design system per the style guide (tokens, focus, reduced motion, comfort controls) | 1.5 h |
| 7 | Eval harness, fallback lesson, rehearsal run scored on Peter, README / AGENTS.md / arc42 (with Jens), VPS deploy (sandboxed Hermes, approvals policy) | 2.5 h |

About 15 hours of agent time plus the team check.

## Contracts (my calls, marked so Chirag can check them)

- **Two-stage build**: a plan run returns ```json `parts: [{ title, goal, blocks }]`; then one part run per part, in
  order, streamed as json-render patches; a part renders as it arrives. The timing is untested: phase 5 starts with a
  timing spike against the real model.
- **A pick = one theme (a Hermes skill) = one tab.** Inside a tab Hermes uses catalog blocks; interactive HTML only
  inside a `Simulation` block.
- **Analysis output**: structured JSON plus `about_you` (short German text); "Bearbeiten" sends the edited text back
  in the same session; proposals start after the student confirms.
- **Memory**: the confirmed text lives in the session; Hermes may save it to its own memory; `--reset-memory` for
  demos.
- **Old endpoints and screens**: nothing deleted until its author agrees; the new path runs next to the old one.
- **End-to-end pass bar**: Peter's `evaluation` rubric (judge harness + manual check) and every quote verbatim.

## Left to the builder

File layout within each phase, component names, the stall timeout, rate-limit numbers, the access-code mechanism,
which parts of Ammar's theme prompts become skill instructions versus references.
