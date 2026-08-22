export const SCHEMA_VERSION = 1;

// `id` mirrors the raw "№" column from the source CSVs. It is a per-sheet row
// number, NOT a globally unique identifier — merging 2025+2026 data produces
// duplicate values (1906 of 6720 real rows collide). The pre-existing web app
// already has this quirk (a `Map` keyed by `id.value` silently keeps only the
// last row for a given id), so `ord` — sequential and unique by construction —
// is the real primary key, and lookups by `id` replicate "last insertion wins"
// via `ORDER BY ord DESC LIMIT 1` to keep /license/:id behavior unchanged.
export const SCHEMA_SQL = `
CREATE TABLE licenses (
  ord            INTEGER PRIMARY KEY,
  id             TEXT NOT NULL,
  license_number TEXT NOT NULL,
  object_name    TEXT NOT NULL,
  company_name   TEXT NOT NULL,
  region         TEXT NOT NULL,
  area_ha        REAL,
  is_annulled    INTEGER NOT NULL,
  source_year    INTEGER NOT NULL,
  has_polygon    INTEGER NOT NULL,
  min_lat REAL, max_lat REAL, min_lon REAL, max_lon REAL,
  geojson_feature TEXT,
  doc            TEXT NOT NULL
);

CREATE TABLE license_minerals (
  license_ord INTEGER NOT NULL,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL,
  grp         TEXT NOT NULL
);

CREATE TABLE license_work_types (
  license_ord INTEGER NOT NULL,
  work_type   TEXT NOT NULL
);

CREATE TABLE license_countries (
  license_ord INTEGER NOT NULL,
  country     TEXT NOT NULL
);

CREATE TABLE filter_options (
  kind  TEXT NOT NULL,
  value TEXT NOT NULL,
  grp   TEXT,
  count INTEGER NOT NULL
);

CREATE VIRTUAL TABLE licenses_fts USING fts5(ord UNINDEXED, haystack, tokenize = 'trigram');
`;

export const INDEX_SQL = `
CREATE INDEX idx_licenses_id ON licenses(id, ord DESC);
CREATE INDEX idx_licenses_region ON licenses(region);
CREATE INDEX idx_licenses_source_year ON licenses(source_year);
CREATE INDEX idx_licenses_is_annulled ON licenses(is_annulled);
CREATE INDEX idx_licenses_area_ha ON licenses(area_ha);
CREATE INDEX idx_licenses_has_polygon ON licenses(has_polygon) WHERE has_polygon = 1;
CREATE INDEX idx_minerals_type ON license_minerals(type, license_ord);
CREATE INDEX idx_work_types_type ON license_work_types(work_type, license_ord);
CREATE INDEX idx_countries_country ON license_countries(country, license_ord);
`;
