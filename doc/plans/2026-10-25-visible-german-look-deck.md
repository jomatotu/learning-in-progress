# Visible Batch 1 Implementation Plan: German, Graustufen, intake deck, one screen per step

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the agreed design visible in the team's `/application` flow: everything in German, a "Graustufen" (matte e-ink) toggle instead of the comfort controls, the new intake deck (base cards, no AI yet), and steps that fit one screen and reflow on zoom.

**Architecture:** Branch `integration/visible` (worktree `.worktrees/visible`, off `integration/one-app` `3b916dd`, local only). Client changes stay inside the teammates' application flow (`client/src/features/application/`) plus a small look toggle; server changes extend BlackBeardXD's survey/profile (`server/app/scale.py`, `routers/profile.py`, `routers/survey.py`, `data/scale.json`) so deck answers (one band per category) produce the same `learning_instructions` as survey answers. Hermes cards, the summary, the engine port and json-render lessons are the next batch (after the speed test picks the model).

**Tech Stack:** Vite 8 + React 19 + TypeScript + Tailwind v4 + Vitest/Testing Library (client, pnpm); FastAPI + pydantic + pytest (server, uv).

**Spec:** `doc/specs/2026-10-24-integration-design.md` — sections "Decided by Chirag", "The journey" (steps 2–3c), "Intake deck", "Design system"; plus Chirag's decisions of 2026-10-25: Graustufen is a **toggle** (default look stays Nils's), no reading-comfort controls (browser zoom does that; layout must reflow), German UI with `du` everywhere.

## Global Constraints

- Worktree `/home/reallyboard/git/learning-in-progress/.worktrees/visible`, branch `integration/visible`. Never push. One commit per task step group, Conventional Commits.
- Ports for live checks: Vite `5176` (`API_URL=http://localhost:8002 pnpm dev --port 5176 --strictPort` in `client/`), FastAPI `8002` (`uv --directory server run --env-file .env fastapi dev --port 8002 --no-proxy-headers`). `server/.env` exists (copied, includes `ACCESS_CODE` and `APP_ORIGINS` with 5176). Never touch ports 5174, 5175, 8000, 8001, 8642, 8799. Never print `.env` contents.
- German UI copy, `du`, short and warm (style guide voice: buttons are verbs with an arrow, e.g. `Weiter →`; reassurance under the main action). No English left in anything a student sees in `/application`, `/solution/*` or error messages.
- Style guide (`doc/design/STYLE_GUIDE.md` on `origin/Frontend_ApplicationForm`) stays the default look; Graustufen only overrides it while the toggle is on.
- pnpm only (never npm; `client/package-lock.json` untouched; `client/pnpm-lock.yaml` uncommitted), uv only, no new dependencies.
- Plain `grep` is rewritten to ripgrep: use `/usr/bin/grep`. Use `rtk proxy <cmd>` for exact output/exit codes (prettier).
- Checks before every commit — server: `uv --directory server run pytest -v`, `uv --directory server run --with ruff ruff check .` (4 pre-existing errors may remain); client (in `client/`): `pnpm test:run`, `pnpm typecheck`, `pnpm exec oxlint src`, `rtk proxy pnpm exec prettier --check src`, `pnpm build`.
- Teammates' behaviour stays: the survey, profile scoring and `/api/solution` flow keep working; deck bands are an addition, not a replacement for survey answers.

## Review Focus

1. A student who answers some survey questions **and** the deck: survey answers win for those categories, deck bands fill the rest; nothing is counted twice (Task 3).
2. A student who skips every deck card (`Weiß nicht`) still reaches the review and can build; categories without a band are simply absent from `learning_instructions` (Task 3).
3. With Graustufen on, the sticky action bar, the iframe sandbox page and focus rings stay visible and usable (Task 2).
4. At 200 % browser zoom on a 1366×768 window, no step needs horizontal scrolling and no text is cut off (Task 4).
5. Long German words (e.g. `Arbeitsgedächtnis`, `Selbstvertrauen`) don't overflow chips, cards or buttons on a 375 px wide screen (Tasks 1 and 4).

---

### Task 1: Everything in German

**Files:**
- Modify: every `*.tsx`/`*.ts` in `client/src/features/application/` with student-facing text (incl. `profile.ts` step titles and option lists, `MagicStep.tsx`, `ReviewStep.tsx`, `ProfilePanel.tsx`, `MaterialInput.tsx`, `SurveyStep.tsx`, `NotesStep.tsx`, `AboutStep.tsx`, `GoalStep.tsx`, `ApplicationForm.tsx`, `ApplicationPage.tsx`), `client/src/features/learn/Learn.tsx` and `client/src/features/playground/Playground.tsx` only where students see text, `server/app/data/scale.json` (response labels, category `title`/`hint`, item `text`, band `student_text`; `ai_instructions` stay English — they go to the model), `server/app/routers/{assess,generate,solution}.py` `detail=` strings shown to students, `server/app/data/README.md` (note that the survey is German now)
- Test: update existing tests that match English text; add one test that the survey endpoint returns German labels

**Interfaces:**
- Produces: German texts only; no API shape change.

- [ ] **Step 1:** Update the tests that assert English UI text to the new German text first (they fail), plus `test_survey_is_german` (e.g. response labels are `Stimmt gar nicht` … `Stimmt total`, first category title is German).
- [ ] **Step 2:** Run client + server tests → the updated tests FAIL.
- [ ] **Step 3:** Translate. Keep meaning of every survey item exactly (they are modelled on published scales); keep item ids, `reverse`, `priority`, scoring untouched. Placeholders become German examples (e.g. `z. B. Lina`, `z. B. Fußball, Minecraft, Zeichnen`, `z. B. Zellbiologie: Membranen und Transport`).
- [ ] **Step 4:** Run all checks → PASS. Check with `/usr/bin/grep` that no English student-facing strings remain in the files above (list any intentional exceptions in the report).
- [ ] **Step 5:** Commit `feat: translate the application flow and survey to german`.

### Task 2: Graustufen toggle instead of reading-comfort controls

**Files:**
- Create: `client/src/features/look/LookToggle.tsx`, `client/src/features/look/LookToggle.test.tsx`
- Delete: `client/src/features/application/ReadingComfort.tsx` (and its CSS rules `data-comfort-*` in `application.css`)
- Modify: `client/src/index.css` (Graustufen rules), the application page header (where `ReadingComfort` was rendered), `client/src/features/onboarding/Topbar.tsx` (place the toggle at the right, next to the help button)

**Interfaces:**
- Produces: `function LookToggle(): JSX.Element` — a button `Graustufen` with `aria-pressed`; on toggle sets/removes `data-look="graustufen"` on `document.documentElement` and remembers it in `localStorage['lip-look']` (wrap storage access in try/catch); reads the stored value on mount. The setting applies to the whole app (no cleanup on unmount).
- Graustufen look (CSS, `:root[data-look="graustufen"]`): page and cards in paper greys (`#efeeea` page, `#f6f5f1` surfaces, `#1d1d1b` ink, `#cfcdc7` hairlines), every accent/pastel colour replaced by greys (e.g. `filter: grayscale(1)` on the app root is acceptable if fixed/sticky elements and the sandbox iframe still behave — verify), **no** box-shadows, **no** `backdrop-filter`, **no** animations/transitions, decoration (blobs, orbits, particles) hidden. Focus ring stays clearly visible (dark, 3px).

- [ ] **Step 1: Failing tests:** `LookToggle` toggles `data-look` on `<html>` and `aria-pressed`; restores from `localStorage`; survives a throwing `localStorage` (still toggles). `ApplicationPage` no longer renders `Larger text`/`More spacing`/`Calmer colours`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement; remove `ReadingComfort` and the `data-comfort-*` CSS.
- [ ] **Step 4:** Run all checks → PASS. **Live check** (chrome-devtools via ToolSearch, Vite on 5176): screenshots of `/` and an `/application` step with Graustufen off and on; confirm no shadows/animations when on, the sticky action bar still sticks, focus ring visible.
- [ ] **Step 5:** Commit `feat: replace reading comfort with a graustufen toggle`.

### Task 3: Intake deck with base cards (no AI)

**Files:**
- Modify: `server/app/data/scale.json` (per band: German `student_text` from Task 1 plus new German `student_reason`, one short `Deshalb …` sentence derived from that band's `ai_instructions`), `server/app/scale.py`, `server/app/routers/profile.py`, `server/app/routers/survey.py`, `client/src/features/application/profile.ts` (new step `deck`, profile field `bands`), `client/src/features/application/ApplicationForm.tsx` (screen order), `client/src/features/application/NotesStep.tsx` (adds `Was macht Lernen gerade schwer?` free text — the 5 things are: name+stage+interests (about), goal, material, what is hard, what helps), `client/src/features/application/ReviewStep.tsx` (shows the chosen bands' `student_text` under `Wie du lernst`, `Bearbeiten` → deck)
- Create: `client/src/features/application/DeckStep.tsx`, `client/src/features/application/deck.ts` (+ tests), `server/tests/test_deck_bands.py`

**Interfaces:**
- Server: `GET /api/survey` additionally returns `deck: [{ "category": str, "title": str, "low": {"text": str, "reason": str}, "high": {"text": str, "reason": str} }]` (8 entries, German; no `ai_instructions`). `ProfileRequest` gains `bands: dict[str, Literal["low", "medium", "high"]] = {}` (unknown category ids → 422). `scale.evaluate(answers, bands)`: for each category, survey answers (if any) decide the band as today; otherwise `bands[category]` if present; otherwise the category is left out. Output shape unchanged (`learning_instructions` per category).
- Client: `type DeckState = { index: number; asked: 'low' | 'high'; bands: Record<string, Band> }`; `function nextDeckState(state: DeckState, answer: 'stimmt' | 'eher_nicht' | 'weiss_nicht', deck: DeckEntry[]): DeckState | 'done'` in `deck.ts` with the rule: ask `low` → `stimmt` ⇒ band `low`, next category; `eher_nicht` ⇒ ask `high`; at `high`: `stimmt` ⇒ `high`, `eher_nicht` ⇒ `medium`; `weiss_nicht` ⇒ no band, next category. Screen order: about → goal (incl. material) → notes (what helps + what is hard) → **deck** → review; the 30-question survey is reachable from the deck's last card via a text button `Genauer? 30 kurze Fragen` and from the review.
- `DeckStep` UI (mockup "Mirror after each part"): progress `Karte N von ~M` and `noch ~X Min`, dark card with kicker `Das heißt für dich` and the band text, the reason line below, buttons `Eher nicht` / `Stimmt →`, a small text button `Weiß nicht`. One card per screen, keyboard: Enter = Stimmt, Backspace = Eher nicht.

- [ ] **Step 1: Failing server tests** (`test_deck_bands.py`): bands only → `learning_instructions` for those categories equal the survey-path instructions for the same band; survey answers override a deck band for the same category; unknown category in `bands` → 422; empty `bands` and no answers → no `learning_instructions` and still 200; `GET /api/survey` has 8 `deck` entries with German `low`/`high` texts and reasons and no `ai_instructions`.
- [ ] **Step 2: Failing client tests:** `nextDeckState` for all branches (low-stimmt, low-eher_nicht-high-stimmt, low-eher_nicht-high-eher_nicht → medium, weiss_nicht, last category → done); `DeckStep` renders the card texts, buttons work, keyboard works; `ApplicationForm` sends `bands` in the profile request; `ReviewStep` shows the chosen `student_text`s.
- [ ] **Step 3:** Run → FAIL.
- [ ] **Step 4:** Implement server then client.
- [ ] **Step 5:** Run all checks → PASS. **Live check** on 5176/8002: walk about → goal → notes → deck (answer a mix incl. `Weiß nicht`) → review; capture the `POST /api/profile` body and response (no Hermes call needed; stop before `Build my tool`). Screenshots of a deck card at 1366×768 and 375×812.
- [ ] **Step 6:** Commit `feat: add the intake deck with base cards`.

### Task 4: One screen per step, reflow on zoom

**Files:**
- Modify: `client/src/features/application/application.css`, the step components as needed (layout only), `client/src/features/onboarding/onboarding.css` only where the landing breaks at 200 % zoom

**Interfaces:**
- Acceptance (measured, not eyeballed): for every step of `/application` (about, goal, notes, deck card, each survey part, review) at a **1366×768** viewport and 100 % zoom, `document.scrollingElement.scrollHeight <= innerHeight + 2` (no page scroll); at **683×384** viewport (equals 200 % zoom of 1366×768) and at **375×812**, `scrollWidth <= innerWidth` (no horizontal scroll; vertical scroll allowed there). Use `rem` for font sizes and spacing that should grow with zoom; two columns of fields on wide screens, one column below `48rem`; the profile side panel collapses into a `Dein Profil` summary line below `64rem`; survey parts show their 3–4 statements compactly (one row per statement, 5 tiles inline on wide screens).

- [ ] **Step 1:** Measure the baseline with the chrome-devtools tools (`resize_page`, `evaluate_script` returning `scrollHeight`, `innerHeight`, `scrollWidth`, `innerWidth`) for every step × viewport and record the table in the report. No new dependency.
- [ ] **Step 2:** Change layout until every row passes; keep the style guide's look (spacing rhythm, cards, type scale in `rem`).
- [ ] **Step 3:** Run client checks → PASS; re-measure; record the after table and screenshots (1366×768, 683×384, 375×812) for about, deck and one survey part.
- [ ] **Step 4:** Commit `feat: fit each application step on one screen and reflow on zoom`.

## Not in this batch

Hermes cards with planned follow-ups and the `Das habe ich verstanden` summary (model chosen by the speed test), server-side orchestration over the Runs API, json-render lessons with the Simulation block, Ammar's themes as skills, design of the lesson page, eval harness, VPS.
