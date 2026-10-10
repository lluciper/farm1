---
name: project-engineer
description: Orchestrates Graphify (project knowledge graph), Agent Skills (spec → plan → build → test → review) and Ponytail (minimal code, no over-engineering) into one efficient workflow for any coding task in an existing or new project. Use this skill whenever the user wants to add a feature, fix a bug, refactor, review code, estimate impact of a change, onboard to an unfamiliar codebase, or says things like "implement", "build", "thêm tính năng", "sửa lỗi", "refactor", "phân tích dự án", "lập kế hoạch", "viết test", "review code" — even if they do not name Graphify, Agent Skills or Ponytail. Prefer this skill over using the three tools separately.
---

# Lean Dev Pipeline

One workflow, three tools, each answering a different question. Do not use a tool for a question it does not own.

| Tool | Question it owns | Used in phases |
|---|---|---|
| **Graphify** | *What exists, and what is connected to what?* | Map, Plan (impact), Review (blast radius) |
| **Agent Skills** | *In what order, and with what quality gates?* | Spec, Plan, Build, Test, Review |
| **Ponytail** | *What is the least we must write or own?* | Plan (design gate), Build, Review (diff) |

Reply in the language the user writes in. Keep artifacts (SPEC.md, plan) in that language too.

## Step 0 — Check what is available (once per session)

Check which of the three are installed and say so in one line. Never block on a missing tool; use the fallback.

| Tool | Detect | Fallback if missing |
|---|---|---|
| Graphify | `/graphify` skill or `graphify-out/` exists | `git ls-files`, targeted `grep`, read entry points + manifests |
| Agent Skills | `/spec /plan /build /test /review` or skills like `spec-driven-development` | Follow the phase checklists below directly |
| Ponytail | `/ponytail` skill or plugin | Apply the Simplicity Ladder below directly |

If something is missing and would clearly help, tell the user the install command once and continue:
- Graphify: `pip install graphifyy` then `graphify install`
- Agent Skills: `npx skills add addyosmani/agent-skills`
- Ponytail: `/plugin install ponytail@ponytail`

## Step 1 — Size the task (this is the main optimization)

Running the full pipeline on a one-line fix wastes tokens. Pick the lightest tier that is safe.

| Tier | Example | Phases to run |
|---|---|---|
| **T0 Trivial** | typo, rename, config value | Build → quick verify. No spec, no graph. |
| **T1 Small** | one function/file, clear bug | Map (targeted) → Build with test → Ponytail check |
| **T2 Medium** | new feature in 2–5 files | Map → short Spec → Plan → Build → Test → Review |
| **T3 Large** | cross-module, new subsystem, risky/irreversible | Full pipeline, user approves Spec and Plan before Build |

When unsure between two tiers, take the lower one and escalate if the graph shows a wider blast radius than expected.

## Phase 1 — MAP (Graphify)

Goal: understand structure before touching code, without reading files one by one.

1. If `graphify-out/` exists, **reuse it**. Refresh with `graphify update .` (AST only, no LLM cost). Rebuild from scratch only if the graph is missing or clearly stale.
2. If it does not exist and the task is T2+, write `.graphifyignore` first (see Tool usage rules), then build it once: `/graphify . --no-viz` (code is parsed locally; no need to send code to a model).
3. Read the markdown report in `graphify-out/` first for central nodes and communities. Then query the graph (for example the shortest path between two components) instead of grepping across the repo.
4. Extract only what the task needs and write it down in 5–10 lines:
   - Components the change will touch
   - Their direct dependents and dependencies (blast radius)
   - Existing code that already does part of the job (feeds the Ponytail ladder)
5. Never paste the whole graph into the conversation. Summarize.

## Phase 2 — SPEC (Agent Skills: `/spec`, T2+ only)

Write `SPEC.md` before code, kept short:
- Goal and non-goals
- Acceptance criteria, each one verifiable (a test, a command, or an observable behavior)
- Constraints taken from the MAP step (affected components, compatibility)
- Open questions. Ask the user at most the 1–3 that block progress.

For T3, stop and get approval on the spec. For T2, proceed unless an open question is blocking.

## Phase 3 — PLAN (Agent Skills: `/plan` + Ponytail gate)

Break the spec into small, ordered, individually verifiable tasks in `tasks/plan.md` and `tasks/todo.md`. Each task has: what changes, which files, how it is verified.

**Ponytail design gate — apply to every task before it enters the plan.** Stop at the first rung that fully solves the real problem:

1. Does this need to exist at all? (Challenge the requirement; say so to the user if it does not.)
2. Is it already in this codebase? (Use the MAP output.)
3. Does the language standard library do it?
4. Does the platform/framework do it natively?
5. Does an already-installed dependency do it?
6. Only then: write the smallest new code. A new dependency needs a stated reason.

If Ponytail is installed, use its own ladder and mode (`lite`, `full`, `ultra`); default to `full`. When a rung is skipped or a shortcut is taken, leave a one-line note in the plan.

Ponytail never overrides: validation, error handling, security, accessibility, tests, or anything the user explicitly asked for. An explicit user request is final.

## Phase 4 — BUILD (Agent Skills: `/build`)

- One slice at a time, following the plan order. Do not start slice N+1 until slice N passes.
- Write the test alongside the code (red → green → refactor). Tests are the proof, not optional.
- Before adding any abstraction, interface, config option or helper, ask: *does a current requirement need this today?* If not, do not add it.
- Touch only files in the plan. If the work needs a file outside the plan, update the plan first and say why.
- Re-query the graph only if the change grows beyond what was mapped.

## Phase 5 — TEST (Agent Skills: `/test`)

- Run the relevant tests and the build; report real output, not assumptions.
- Every acceptance criterion in SPEC.md maps to a passing check. List any that are not covered.
- For bug fixes: reproduce with a failing test first, then fix.
- Do not delete or weaken a test to make it pass.

## Phase 6 — REVIEW (all three, T2+ only)

Run the checks in this order and report findings grouped by severity:

1. **Correctness and security** (Agent Skills review): acceptance criteria met, edge cases, input handling, secrets, permissions.
2. **Blast radius** (Graphify): refresh with `graphify update .`, check that every dependent of a changed component is still consistent (callers, importers, shared types). Flag anything touched indirectly that has no test.
3. **Simplicity** (Ponytail `/ponytail-review`, current diff only): dead code, unused flexibility, single-use abstractions, a new dependency where a built-in would do, code that duplicates something already in the graph. Propose the deletion; do not just comment.

Finish with: what changed, what was verified, what remains risky, and the simplest follow-up if any.

## Conflict rules

When the tools pull in different directions, resolve in this order:

1. User's explicit instruction
2. Safety: security, validation, accessibility, data integrity
3. Agent Skills quality gates (spec exists, tests pass)
4. Ponytail minimalism
5. Graph suggestions (a graph shows what is connected; it does not decide what to build)

Examples: an Agent Skills API-design step suggests an extensible interface but only one implementation exists → keep it concrete (Ponytail). Ponytail suggests removing a test → keep the test (rule 3 beats 4).

## Tool usage rules

### Graphify — keep the graph small, fresh and queried
- Before the first build, write `.graphifyignore` (gitignore syntax; `.gitignore` is already respected). Exclude binaries/assets, vendored libs, build output and **generated copies of source** — a generated file duplicates every node of its source and corrupts "who calls X" answers.
- Prefer the CLI for routine work: `graphify update .` after code changes (AST only, no LLM cost). Use `/graphify . --update` only when docs/images changed and need semantic re-extraction (`graphify check-update .` tells you).
- After deleting or merging code, `graphify update . --force` — without it the update refuses a graph with fewer nodes.
- Ask narrow questions with a budget: `graphify query "<q>" --budget 800`; use `graphify path "A" "B"` for impact and `graphify explain "X"` for one node. Raise the budget only if the answer is incomplete.
- `graphify hook install` once per clone keeps the graph updated on commit/checkout, so no manual refresh step is needed.
- The graph lies about dynamic links (string-built file names, globals shared via `<script>` order, `window.*`). Confirm those with one targeted `grep` before trusting "nothing depends on this".

### Agent Skills — one skill per phase, load on demand
| Situation | Use |
|---|---|
| Spec / plan / build / test / review | `/spec`, `/plan`, `/build`, `/test`, `/review` |
| Bug, failing test, "it broke" | `debugging-and-error-recovery`, then `/test` (prove-it test first) |
| Auth, input handling, accounts, payments | `security-and-hardening` in Review, even for T1 |
| T3 or irreversible (migration, data delete) | `doubt-driven-development` on the plan before Build |
| Slow page, mobile jank | `/webperf` or `performance-optimization` — measure first |
| Before release | `/ship` |
- Use `/build auto` only after the user approved the plan; otherwise build slice by slice.
- Do not load `api-and-interface-design`, `spec-driven-development` etc. for T0/T1 — the tier table decides, not the skill list.

### Ponytail — pick the level by task, review with its own tools
- Level: `lite` for exploratory UI/prototype work, `full` (default) for features and fixes, `ultra` for refactors and cleanups where pushing back on scope pays off.
- Review phase: run `/ponytail-review` on the diff instead of a hand-written simplicity pass.
- `/ponytail-audit` is a whole-repo report — run it once when onboarding or before a cleanup, never per task.
- Every shortcut gets `// shortcut: <limit>, <when to upgrade>`; run `/ponytail-debt` before a release to list them.
- Deleting code counts as a change: it still needs the MAP blast-radius check and a passing build/test.

## Project notes (lang-may)

- Game client = plain JS in `public/`, loaded by `<script>` order in `public/index.html`; modules share globals (`Farm`, `s`, `$`). Server = Next API routes on Cloudflare Worker + D1 with raw SQL (`gameDb()`), not Drizzle `getDb()`.
- Generated files — never edit by hand, regenerate after touching their source, and list them in `.graphifyignore`:
  - `app/game-html.ts` ← `public/index.html` (command in `HUONG-DAN-BAN-GIAO.txt`); also bump `?v=` of changed files in `index.html`.
  - `lib/farm-engine.ts`, `lib/card-engine.ts` ← `node scripts/sync-card-engine.mjs` after editing `public/{legacy-core,core,save-compat,cafe-engine,cards}.js`. Forgetting it makes client and server compute differently.
- Suggested `.graphifyignore`: `art-ref/`, `tools/art/src/`, `public/vendor/`, `public/**/*.png`, `public/**/*.webp`, `dist/`, `drizzle/meta/`, `components/ui/`, `app/game-html.ts`, `lib/farm-engine.ts`, `lib/card-engine.ts`.
- Code in `public/` and `lib/` is dense one-line style: keep that style, make minimal line-local edits, never reformat a whole file.
- Tests: `node tests/<name>.cjs|mjs`. Many tests are stale (missing migrations, removed commits, old engine APIs); run the ones related to the change and report pre-existing failures separately from new ones.
- Save data compatibility (`SAVE-COMPATIBILITY.md`) is a data-integrity constraint: any change to save format, `validPayload` or `legacy-core.js` is T3.

## Token and time discipline

- Build the graph once per project, update incrementally afterwards.
- Load only the Agent Skills needed for the current phase, not the whole set.
- Query, do not browse: graph query or targeted grep beats opening many files.
- Keep SPEC.md and plan short; a long plan is itself over-engineering.
- Do not repeat the pipeline summary after each phase; one status line per phase is enough.