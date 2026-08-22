# AGENTS.md — geo-kg

geo-kg is a real Bun + Elysia + TypeScript web application for viewing Kyrgyzstan subsoil licenses.
It is not a generated scaffold. Production data lives in `data/`; the parsed output is
`output/licenses.db` (SQLite, via `bun:sqlite`).

## What "done" means

A task is not done until all three exit zero, in this order:

1. `bun run typecheck`
2. `bun run lint`
3. `bun test`

Do not report a task complete with any of these failing. If a failure looks unrelated, say so
explicitly and link the failing test name in your summary. Extend this list with `bun run check`
to run all three in one command.

## Stack

- **Runtime:** Bun. Run scripts with `bun`, never `node` or `npm`.
- **Server:** Elysia (`server.tsx`). SSR via `@kitajs/html`. No React.
- **CSS:** Tailwind CSS v4. Config in `web/input.css`, output in `public/output.css`.
- **CSS tokens:** `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`,
  `bg-card`, `bg-muted`. Never write raw hex colors in components.
- **SPA navigation:** Hotwire Turbo. Reload on form submit, no client JS for table view.
- **Map:** MapLibre GL, client-only. Bundle at `web/map.ts` → `public/map.js`.
- **Data:** SQLite via `bun:sqlite`, no separate DB service. `output/licenses.db` is queried
  per-request (nothing is loaded into memory at startup). `DATABASE_PATH` env var overrides the
  default path; resolved once in `db/client.ts`.
- **Lint/format:** oxlint (`bun run lint`) + oxfmt (`bun run format`).
  Configs: `.oxlintrc.json`, `.oxfmtrc.json`.
- **Tests:** `bun:test`. `bun test` or `bun run check`.
- **Git hooks:** Lefthook. Pre-commit runs lint + format. Pre-push runs typecheck + tests.
  Config: `lefthook.yml`.

## How the codebase is organized

- `server.tsx` — Elysia server, routes, SSR entry point
- `shared/` — types (`types.ts`), region and country canonical lists, mineral groups,
  `geojson.ts` (License → GeoJSON Feature conversion, used by both `db/write.ts` and `web/`)
- `db/` — SQLite schema and access, shared by `parser/` (writer) and `web/` (reader)
  - `schema.ts` — DDL + `SCHEMA_VERSION`
  - `client.ts` — `openDb(path)`: read-only open, schema version check
  - `write.ts` — `buildDatabase(licenses, outPath)`: full rebuild from scratch, one transaction
  - `rows.ts` — DB row types, `hydrate(row)` → `License`
- `parser/` — CSV → SQLite pipeline
  - `parse.ts` — CLI entry: read CSV, deduplicate, build `output/licenses.db`
    (`--json` also writes `output/licenses.json` as an optional diffable artifact)
  - `csv.ts` — PapaParse loader, `licenseKey()`, `getCol()`, `fixColumnShift()`
  - `normalize.ts` — orchestrates field parsers for each row
  - `parsers/` — 18 field parsers, each a pure function
  - `data/` — lookup tables (minerals, regions, districts, countries)
  - `overrides/` — manual corrections applied last
- `web/` — web layer
  - `repository.ts` — `buildWhere(filters)`, `Repository` (`countLicenses`, `listLicenses`,
    `getLicenseById`, `getFilterOptions`, `geojsonBody`) — all SQL lives here
  - `filters.ts` — `parseFilters`, `filtersToQs`, and the `ActiveFilters`/`FilterOptions` types
  - `map.ts` — client-side MapLibre GL (compiled to `public/map.js`)
  - `components/` — SSR JSX components (no React, no state, no hooks)
- `public/` — compiled assets (`output.css`, `map.js`, `turbo.js`), not committed to git —
  built by `bun run build` (see `build.ts`)

## Conventions

- **Imports:** use aliases `@shared/*`, `@web/*`, `@parser/*`. No relative paths.
- **JSX components:** `export function Component(props)`, not arrow functions.
- **Types:** interfaces for component props, `type` for unions/utilities.
- **Field pattern:** `Field<V, R> = { raw: R; value: V }`. Always store both raw and cleaned value.
- **noUncheckedIndexedAccess:** enabled. Access arrays via `[0]!` or check length first.
- **Tests:** each parser has a `__tests__/` sibling. New parser = new test file.
  Unit tests use `bun:test`. Web tests test filters and GeoJSON conversion.

## Adding a parser

1. Create `parser/parsers/newField.ts` — export `parseNewField(raw: string): Field<T>`
2. Import and call in `parser/normalize.ts`
3. Add field to `License` interface in `shared/types.ts`
4. Add test in `parser/parsers/__tests__/newField.test.ts`
5. If needed, add lookup data in `parser/data/`

## Adding a filter

1. Add field to `ActiveFilters` in `web/filters.ts`
2. Add a clause in `buildWhere` in `web/repository.ts`
3. If it needs its own option list, add a `kind` to `computeFilterOptions` in `db/write.ts`
   (backs `filter_options`, read by `Repository.getFilterOptions`)
4. Add UI in `web/components/FilterPanel.tsx`
5. Add query string parsing in `parseFilters`

## Route map

- `GET /` — license table with filters and pagination (SSR, no client JS for table)
- `GET /map` — MapLibre GL interactive map
- `GET /license/:id` — single license detail page
- `GET /api/features.geojson` — GeoJSON endpoint (same filters as `/`)
- `GET /api/license/:id/fragment` — HTML fragment for map popup panel

## E2E tests (Playwright)

- E2E tests live in `e2e/` and run with `bunx playwright test`.
- Test files use `*.pw.ts` extension (not `.spec.ts`, which `bun test` would pick up).
- Config: `playwright.config.ts`. Web server starts automatically via `webServer`.
- `webServer` owns process startup and readiness only. Do not hide seed or migration
  logic inside the startup command. Set `use.baseURL` explicitly.
- Fixture generation (`bun run fixtures`, writes `tests/fixtures/mock-licenses.db`) runs as its
  own entry in the `webServer` array, without a `url`/`port` — Playwright waits for it to exit
  before starting the next entry. This is required, not stylistic: the app entry opens the
  database eagerly at module load and exits immediately if it's missing, and a `globalSetup`
  hook does not run early enough to win that race (empirically, `webServer` processes are
  spawned before `globalSetup`).
- Use `reuseExistingServer: !process.env.CI` unless the suite has a specific reason not to.
- Smoke tests cover: home page table, filters, map navigation, search.

### Playwright locator priority

1. `getByRole(role, { name })` — try this first. Always.
2. `getByLabel(labelText)` — for form inputs with visible labels.
3. `getByPlaceholder(text)` — for inputs without labels (and fix the missing label if you can).
4. `getByText(text)` — for static visible text and confirmation messages.
5. `getByTestId(id)` — only when 1–4 genuinely do not work. If you use this, explain why.
6. `page.locator(cssSelector)` — never. If you find yourself here, the component needs an
   accessible name.

For nested elements, scope with chained locators, `filter({ has, hasText })`,
`and()`, and `or().first()` before reaching for `nth()`.

### Playwright waiting

- Never use `page.waitForTimeout`. There is always a better option.
- Never use `page.waitForLoadState('networkidle')`.
- To wait for a UI change, use `expect(locator).toBeVisible()` or a similar retrying
  assertion. Never use `locator.isVisible()` or similar boolean probes as waits.
- To wait for a network call, set up `page.waitForResponse` with a URL+method matcher
  _before_ triggering the action.
- Use `expect.poll()` for eventually consistent values.
- If you are tempted to add a wait to "fix flakiness," stop. Find the real end state
  and assert on it. Flakiness is never solved by waiting longer.

### When a Playwright test fails

- Read the trace _before_ changing code: `npx playwright show-trace test-results/.../trace.zip`.
- Classify the failure into one of four buckets:
  1. **Timing race** — fix with `page.waitForResponse`, never by bumping timeouts.
  2. **Shared state leak** — fix with a fixture teardown.
  3. **Order-dependent rendering** — fix with a region-scoped locator.
  4. **Config / auth mismatch** — fix the project, storage state, or `dependencies: ['setup']`.
- Quote specific evidence from the trace in the fix: failing step name, DOM snapshot
  summary, relevant network request with status and timing.
- Never raise `retries` above `process.env.CI ? 2 : 0` to "fix" a flaky test.
  Retries are for environmental flakes only.
- Use `test.fixme` plus an issue annotation to quarantine, never `test.skip`.

### Test steps and tags

- Every top-level user action gets a `test.step('...', async () => { ... })` wrapper
  with a human-readable label.
- Tag every test with at least one of `@critical` or `@slow`.
- Keep `test.step` nesting to two levels deep at most. If you need three, the test is
  doing too much.

## Git and verification

- Never use `--no-verify`, `HUSKY=0`, `LEFTHOOK=0`, or other hook-skipping flags
- Never weaken hook, lint, or type configuration to make a failing change pass
- Pre-commit runs `oxlint` and `oxfmt --check` on staged files
- Pre-push runs `bun run typecheck` and `bun test`
- CI mirrors local checks — local hooks are convenience, CI is authority

## Do not

- Do not use `any` or `@ts-expect-error`
- Do not add `eslint-disable` or `oxlint-disable` comments
- Do not edit generated files in `public/` directly (`output.css`, `map.js`, `turbo.js`)
- Do not edit `output/licenses.db` (or `output/licenses.json`) — both are generated by
  `bun run parse`
- Do not add dependencies without explicit discussion
- Do not change `tsconfig.json` compiler flags to weaken type checking
