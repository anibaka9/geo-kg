# Deploy — what's done, what's left

This documents the state of Phase 3 of the SQLite/build/deploy roadmap
(`~/.claude/plans/1-witty-beaver.md`). Everything here was verified **locally only** — no
real Fly.io app exists yet, and CI/deploy have not run for real. This file is the handoff:
what to check before flipping this from "configured" to "actually deployed."

## What's already done and verified

- **`Dockerfile`** — multi-stage build (`deps` → `data` / `assets` in parallel → `runtime`).
  Built locally with `docker build -t geo-kg:test .` (via a local `colima` Docker daemon,
  since Docker Desktop isn't installed on this machine) — image builds, container runs,
  `/`, `/map`, and `/api/features.geojson` all respond correctly on a fresh container.
- **Layer-cache independence, verified empirically** (not just asserted): touching only
  `web/map.ts` and rebuilding shows `[data 6/6] RUN bun run parse` as `CACHED` and
  `[assets 4/4] RUN bun run build` re-running; touching only `parser/overrides/rows.ts` shows
  the reverse. So "deploy the web app" and "rebuild the data" really do have independent
  build costs, as the roadmap intended — this wasn't just taken on faith.
- **`.dockerignore`** — excludes `node_modules`, `.git`, `public/`, `output/`, test artifacts.
- **`fly.toml`** — written by hand (not by `fly launch`), `app = "geo-kg"` is a **placeholder**.
  `primary_region = "fra"`, `auto_stop_machines = "suspend"`, `min_machines_running = 0`,
  `shared-cpu-1x` / 512MB, an HTTP health check on `/`, no `[mounts]` (see "Data" below).
- **`.github/workflows/ci.yml`** — install → `bun run check` → `format:check` → `build` →
  `parse` → `playwright test`. The exact command sequence was run locally in this session
  and passes. Fixture generation isn't a separate CI step — it's already a `webServer` array
  entry in `playwright.config.ts`, so `bunx playwright test` alone triggers it.
- **`.github/workflows/deploy.yml`** — **fixed from the original plan**: the plan said
  `needs: ci`, but `needs:` only works across jobs _within one workflow file_, not across
  separate files. Cross-file dependency uses `workflow_run` instead — this workflow triggers
  when the `CI` workflow completes on `main`, and checks `conclusion == 'success'` before
  running `flyctl deploy --remote-only`.

## What's genuinely not done (needs a human with Fly.io access)

1. **Create the app on Fly.io**: `fly launch --no-deploy` from the repo root. It will detect
   `fly.toml` and offer to reuse it — confirm the `app` name (`geo-kg` may already be taken;
   pick another if so) and the region (`fra`, chosen for proximity to KG/RU users — reconsider
   if that's wrong).
2. **`FLY_API_TOKEN`**: generate with `fly tokens create deploy` and add it as a GitHub Actions
   secret (`Settings → Secrets and variables → Actions`) named `FLY_API_TOKEN`. Nothing else in
   this app needs a secret — no auth, no third-party API keys.
3. **First real deploy**: either `flyctl deploy` by hand from a machine with `flyctl` installed
   and authenticated, or push to `main` and let `deploy.yml` do it (it will only fire after
   `ci.yml` succeeds on that same commit).
4. **Post-deploy sanity check**: confirm the health check on `/` passes, check `flyctl logs`
   for the actual RSS (expected ~50–80MB against the 512MB allocation — there's headroom to
   shrink `[[vm]]` later if that holds up), and confirm cold-start-after-scale-to-zero is
   the ~300ms the roadmap assumed for `auto_stop_machines = "suspend"` to be worth it.
5. **`bun-version` pin in `ci.yml`** (`1.4.0`) should track whatever `engines.bun` in
   `package.json` says — bump both together if the Bun version changes.

## Data: no volume, by design (until it isn't)

`output/licenses.db` is baked into the image at build time from `data/*.csv` — there's no
`[mounts]` in `fly.toml` and no persistent volume. This means "update the data" is: edit
`data/*.csv` or `parser/overrides/*`, push to `main`, CI rebuilds the image (the `data` stage
reruns, `assets` stays cached per the caching check above), and `deploy.yml` ships it. Same
mechanism as a web-only change, different build cost — not two separate pipelines.

Revisit this (move to a Fly volume + `fly sftp` upload) if any of these become true:

- `output/licenses.db` grows past ~200–300MB
- Data starts coming from somewhere other than git (an external API, a web upload form)
- The running app ever needs to _write_ to the database (it currently only reads)

## Command cheatsheet

```bash
# Build and smoke-test the image locally (needs a Docker daemon — colima on this machine)
colima start   # if not already running
docker build -t geo-kg:local .
docker run -d --name geo-kg-local -p 3000:3000 geo-kg:local
curl -s localhost:3000/ -o /dev/null -w '%{http_code}\n'
docker rm -f geo-kg-local

# First-time Fly.io setup (human, one-time)
fly launch --no-deploy
fly tokens create deploy   # paste into GitHub Actions secret FLY_API_TOKEN

# Manual deploy (bypassing GitHub Actions, e.g. to test before wiring CI)
flyctl deploy --remote-only
```
