# geo-kg — Kyrgyzstan Subsoil License Explorer

A web app for exploring subsoil use licenses in Kyrgyzstan. It cleans raw CSV exports from the
state registry and serves the data through table and map views.

## Problem

Kyrgyzstan publishes mining and drilling license data as CSV files full of typos, variant spellings
(Latin/Cyrillic), missing fields, and coordinate errors. This project cleans the data automatically
and makes it searchable, filterable, and browsable.

## Features

- **Table view** — sort, filter, and search ~10,000 licenses with pagination
- **Map view** — interactive MapLibre GL map, polygons color-coded by mineral type
- **Filters** — region, mineral type, work type, country, year, area range, annulment status
- **Full-text search** — license number, object name, company name
- **License page** — every field, with raw and cleaned values side by side
- **GeoJSON API** — for external GIS tools

## Tech Stack

| Layer                 | Technology                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------ |
| Runtime               | [Bun](https://bun.com)                                                                     |
| Language              | TypeScript (strict)                                                                        |
| Server                | [Elysia](https://elysiajs.com)                                                             |
| SSR / JSX             | [@kitajs/html](https://github.com/kitajs/html) (no React, no hydration)                    |
| CSS                   | Tailwind CSS v4                                                                            |
| SPA navigation        | [Hotwire Turbo](https://turbo.hotwired.dev)                                                |
| Maps                  | [MapLibre GL](https://maplibre.org)                                                        |
| Coordinate conversion | [proj4](https://github.com/proj4js/proj4js) (SK-42 → WGS84)                                |
| CSV parsing           | [PapaParse](https://www.papaparse.com)                                                     |
| Database              | SQLite via [`bun:sqlite`](https://bun.com/docs/api/sqlite) (embedded, no separate service) |

## Getting Started

### Prerequisites

- [Bun](https://bun.com) >= 1.4.0

### Installation

```bash
bun install
```

### Data Preparation

```bash
bun run parse
```

Reads `data/2025.csv` and `data/2026.csv`, deduplicates, cleans, and writes `output/licenses.db`.
Add `--json` to also write `output/licenses.json` as a diffable artifact — the app itself reads
only the `.db` file.

### Development

```bash
bun run dev
```

Builds assets once and starts the server with `--hot`. To rebuild assets on change, run the
watcher in a second terminal:

```bash
bun run build:watch
```

Open http://localhost:3000

### Production

```bash
# Build assets (map.js, turbo.js, output.css) — required before start
bun run build

export PORT=3000  # optional

bun run start  # assumes bun run build already ran, no build step here
```

## Project Structure

`parser/` turns the registry's messy CSVs into `output/licenses.db`:

- `csv.ts` / `normalize.ts` / `parsers/` — 18 field parsers (region matching, mineral
  canonicalization, coordinate repair, etc.)
- `data/` — lookup tables backing the parsers (region regex, mineral names, district variants)
- `overrides/` — manual corrections that run after automatic parsing, for cases the parsers can't
  fix on their own

The rest: `server.tsx` (routes + SSR entry), `web/` (SSR components, `repository.ts` for all SQL,
filters), `db/` (schema + `bun:sqlite` client), `shared/` (types and reference data), `public/`
(compiled assets, not committed — built by `bun run build`).

## Data Pipeline

```
CSV (2025.csv, 2026.csv)
  → csv.ts        (PapaParse, header normalization, column shift fix)
  → parse.ts      (deduplication by license number, 2026 overrides 2025)
  → normalize.ts  (apply field parsers, overrides, coordinate repair)
  → db/write.ts   (buildDatabase: schema, indexes, FTS5, filter_options)
  → output/licenses.db (~6,700 records; ~3s full rebuild)
```

### Coordinate Repair

Many coordinates in the source data are corrupted — wrong SK-42 zone, extra or missing digits in
the northing. `parser/parsers/coords.ts` repairs them:

1. Detect the SK-42 zone (12 or 13) by northing magnitude
2. Insert or delete digits in the northing to repair it
3. Validate against Kyrgyzstan's bounding box (lat 35–48, lon 60–85)
4. Detect and remove spikes — outlier points far from the centroid
5. Convert SK-42 (Gauss-Kruger) to WGS84 via proj4

### Field Pattern

Every parsed field stores both the raw and cleaned value:

```ts
type Field<V, R = string> = { raw: R; value: V };
```

This lets the UI show original data next to normalized values, which matters for auditing data
quality.

### Search

Full-text search uses FTS5 with the `trigram` tokenizer (phrase-quoted, for substring matches).
Queries under 3 characters fall back to `LIKE`, since trigram needs at least 3.

## API

| Endpoint                        | Description                                              |
| ------------------------------- | -------------------------------------------------------- |
| `GET /`                         | Table view (filters via query string)                    |
| `GET /map`                      | Map view                                                 |
| `GET /license/:id`              | Single license page                                      |
| `GET /api/features.geojson`     | GeoJSON FeatureCollection (supports same filters as `/`) |
| `GET /api/license/:id/fragment` | HTML fragment for map popup panel                        |

## Testing

```bash
bun test              # Run all unit tests

bun run check         # Full check: types + lint + tests
```

Tests use `bun:test`, built into the Bun runtime — no external test library needed.

## License

MIT
