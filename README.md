# geo-kg — Kyrgyzstan Subsoil License Explorer

A web application for exploring subsoil use licenses in Kyrgyzstan. Takes raw CSV exports from the state registry, cleans and normalizes the dirty data, and serves it through an interactive web interface with table and map views.

## Problem

Kyrgyzstan's government publishes mining and drilling license data as CSV files full of typos, variant spellings (Latin/Cyrillic), missing fields, and coordinate errors. This project cleans all that data automatically and makes it searchable, filterable, and browsable.

## Features

- **Table view** — sort, filter, and search through ~10,000 licenses with pagination
- **Map view** — interactive MapLibre GL map with color-coded polygons by mineral type
- **Filter by** region, mineral type, work type, country, year, area range, annulment status
- **Full-text search** across license number, object name, and company name
- **Single license page** — detailed view with all fields including raw/cleaned comparison
- **GeoJSON API** — consumable by external GIS tools

## Tech Stack

| Layer                 | Technology                                                              |
| --------------------- | ----------------------------------------------------------------------- |
| Runtime               | [Bun](https://bun.com)                                                  |
| Language              | TypeScript (strict)                                                     |
| Server                | [Elysia](https://elysiajs.com)                                          |
| SSR / JSX             | [@kitajs/html](https://github.com/kitajs/html) (no React, no hydration) |
| CSS                   | Tailwind CSS v4                                                         |
| SPA navigation        | [Hotwire Turbo](https://turbo.hotwired.dev)                             |
| Maps                  | [MapLibre GL](https://maplibre.org)                                     |
| Coordinate conversion | [proj4](https://github.com/proj4js/proj4js) (SK-42 → WGS84)             |
| CSV parsing           | [PapaParse](https://www.papaparse.com)                                  |
| Database              | None — in-memory filtering (~22 MB JSON)                                |

## Getting Started

### Prerequisites

- [Bun](https://bun.com) >= 1.3.11

### Installation

```bash
bun install
```

### Data Preparation

Parse and normalize the raw CSV data:

```bash
bun run parse
```

This reads `data/2025.csv` and `data/2026.csv`, deduplicates, cleans, and writes `output/licenses.json`.

### Development

Run the server (auto-reload on changes) and CSS watcher in parallel:

```bash
bun run dev:server &
bun run dev:css
```

Or with your own terminal tabs:

```bash
# Terminal 1: Start server
bun run dev:server

# Terminal 2: Watch CSS
bun run dev:css
```

Open http://localhost:3000

### Production

```bash
# Build CSS
bun run build:css

# Configure port (optional)
export PORT=3000

# Start server
bun server.tsx
```

## Project Structure

```
geo-kg/
├── server.tsx              # HTTP server, routes, SSR entry point
├── shared/                 # Shared types and reference data
│   ├── types.ts            # License, Field<V,R>, MineralEntry — core types
│   ├── regions.ts          # Canonical Kyrgyzstan region names (9)
│   ├── countries.ts        # Canonical country names (36)
│   └── minerals.ts         # Mineral groups, colors, MapLibre styles
├── parser/                 # CSV → JSON normalization pipeline
│   ├── parse.ts            # Entry point: read CSV, deduplicate, write JSON
│   ├── csv.ts              # CSV loading with PapaParse + column mapping
│   ├── normalize.ts        # Orchestrates field parsers per row
│   ├── parsers/            # Individual field parsers (18 files)
│   │   ├── coords.ts       # SK-42 → WGS84 with coordinate repair algorithm
│   │   ├── minerals.ts     # Tokenize & canonicalize mineral names
│   │   ├── region.ts       # Fuzzy region matching (~80 regex patterns)
│   │   ├── company.ts      # Org type extraction, manager name normalization
│   │   ├── status.ts       # License status parsing & annulment detection
│   │   ├── phone.ts        # KG phone number extraction & normalization
│   │   ├── country.ts      # Country name canonicalization
│   │   ├── inn.ts          # 14-digit TIN validation
│   │   └── ...12 more      # address, area, beneficiaries, district, etc.
│   ├── data/               # Reference lookup tables for parsers
│   │   ├── minerals.ts     # 755-line mineral name → canonical mapping
│   │   ├── district.ts     # ~190 regex fixes for district name variants
│   │   ├── region.ts       # Region regex patterns & transliteration
│   │   └── ...              # company, country, status, workType data
│   └── overrides/          # Manual corrections impossible to compute
│       ├── rows.ts         # ~15 row-level patches by license number
│       ├── manager.ts      # 16 manager name fixes
│       ├── company.ts      # 4 company name fixes
│       └── country.ts      # ~75 country name mappings
├── web/                    # Web layer (SSR components + client JS)
│   ├── data.ts             # Load licenses.json, build filter option counts
│   ├── filters.ts          # Filter definitions, parsing, application
│   ├── geojson.ts          # License → GeoJSON Feature conversion
│   ├── input.css           # Tailwind CSS input
│   ├── map.ts              # Client-side MapLibre GL init (compiled to public/map.js)
│   └── components/         # JSX SSR components
│       ├── Layout.tsx               # HTML shell: <head>, fonts, CSS, turbo.js
│       ├── LicensesListPage.tsx     # Main page: filter panel + table + pagination
│       ├── LicensesTable.tsx        # Sortable/filterable license table
│       ├── FilterPanel.tsx          # Sidebar filter form (checkbox + text inputs)
│       ├── MapPage.tsx              # Map view with filter sidebar
│       ├── LicensePage.tsx          # Single license detail view
│       ├── MineralBadge.tsx         # Color-coded mineral type badge
│       ├── Pagination.tsx           # Paginated navigation
│       └── NavTabs.tsx              # Table/Map tab switcher
└── public/                 # Compiled assets
    ├── output.css          # Compiled Tailwind CSS
    ├── map.js              # Bundled client JS
    └── turbo.js            # Bundled Hotwire Turbo
```

## Data Pipeline

```
CSV (2025.csv, 2026.csv)
  → csv.ts        (PapaParse, header normalization, column shift fix)
  → parse.ts      (deduplication by license number, 2026 overrides 2025)
  → normalize.ts  (apply field parsers, overrides, coordinate repair)
  → output/licenses.json (~10,000 records)
```

### Coordinate Repair

A significant portion of coordinates in the source data are corrupted — wrong SK-42 zone, extra/missing digits in northing. `parser/parsers/coords.ts` implements a multi-step repair algorithm:

1. Detect SK-42 zone (12 or 13) by northing magnitude
2. Attempt digit insertion/deletion on northing for repair
3. Validate against Kyrgyzstan bounding box (lat 35–48, lon 60–85)
4. Spike detection — remove outlier points far from the centroid
5. Convert SK-42 (Gauss-Kruger) → WGS84 via proj4

### Field Pattern

Every parsed field stores both the raw and cleaned value:

```ts
type Field<V, R = string> = { raw: R; value: V };
```

This allows showing original data alongside normalized values in the UI — critical for data quality auditing.

## Architecture Highlights

- **SSR without hydration** — the table view is pure HTML. Filter forms use `method="GET"`, pagination uses plain links. No JavaScript on the client for table browsing.
- **Map is a separate bundle** — only loaded on `/map` route
- **In-memory filtering** — no database. All licenses in memory, filters applied via `Array.filter`. Sufficient for the current data volume.
- **Overrides as an explicit layer** — manual corrections in `parser/overrides/` apply after automatic parsing, keeping concerns separate.
- **No React on the server** — `@kitajs/html` converts JSX to HTML strings at render time.

## API

| Endpoint                        | Description                                              |
| ------------------------------- | -------------------------------------------------------- |
| `GET /`                         | Table view (filters via query string)                    |
| `GET /map`                      | Map view                                                 |
| `GET /license/:id`              | Single license page                                      |
| `GET /api/features.geojson`     | GeoJSON FeatureCollection (supports same filters as `/`) |
| `GET /api/license/:id/fragment` | HTML fragment for map popup panel                        |

## License

MIT
