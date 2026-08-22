import type { Database, SQLQueryBindings } from "bun:sqlite";
import type { License } from "@shared/types";
import { openDb, resolveDatabasePath } from "../db/client";
import { hydrate, type LicenseRow } from "../db/rows";
import type { ActiveFilters, FilterOptions, MineralTypeOption } from "./filters";

export const PAGE_SIZE = 25;

export interface WhereClause {
  sql: string;
  params: SQLQueryBindings[];
}

function ftsPhrase(q: string): string {
  return `"${q.replace(/"/gu, '""')}"`;
}

function placeholders(n: number): string {
  return Array.from({ length: n }, () => "?").join(", ");
}

// Mirrors ActiveFilters -> SQL. `q` uses FTS5 trigram (phrase-quoted, so the
// tokenizer's trigrams are required contiguous — plain substring semantics)
// for 3+ chars; trigram can't index shorter strings, so short queries fall
// back to a LIKE scan on the pre-lowercased search_lower column. areaMin/
// areaMax preserve the existing quirk: an unparsable bound excludes every row
// (not just an out-of-range one), same as the old in-memory isNaN check.
export function buildWhere(f: ActiveFilters): WhereClause {
  const clauses: string[] = [];
  const params: SQLQueryBindings[] = [];

  if (f.q) {
    if (f.q.length >= 3) {
      clauses.push("ord IN (SELECT ord FROM licenses_fts WHERE licenses_fts MATCH ?)");
      params.push(ftsPhrase(f.q));
    } else {
      clauses.push("search_lower LIKE ?");
      params.push(`%${f.q.toLowerCase()}%`);
    }
  }

  if (f.status === "active") clauses.push("is_annulled = 0");
  else if (f.status === "annulled") clauses.push("is_annulled = 1");

  if (f.regions.length > 0) {
    clauses.push(`region IN (${placeholders(f.regions.length)})`);
    params.push(...f.regions);
  }

  if (f.years.length > 0) {
    clauses.push(`source_year IN (${placeholders(f.years.length)})`);
    params.push(...f.years.map(Number));
  }

  if (f.workTypes.length > 0) {
    clauses.push(
      `EXISTS (SELECT 1 FROM license_work_types wt WHERE wt.license_ord = licenses.ord AND wt.work_type IN (${placeholders(f.workTypes.length)}))`,
    );
    params.push(...f.workTypes);
  }

  if (f.mineralTypes.length > 0) {
    clauses.push(
      `EXISTS (SELECT 1 FROM license_minerals m WHERE m.license_ord = licenses.ord AND m.type IN (${placeholders(f.mineralTypes.length)}))`,
    );
    params.push(...f.mineralTypes);
  }

  if (f.countries.length > 0) {
    clauses.push(
      `EXISTS (SELECT 1 FROM license_countries c WHERE c.license_ord = licenses.ord AND c.country IN (${placeholders(f.countries.length)}))`,
    );
    params.push(...f.countries);
  }

  if (f.areaMin !== "") {
    const min = Number(f.areaMin);
    if (Number.isNaN(min)) clauses.push("0");
    else {
      clauses.push("area_ha IS NOT NULL AND area_ha >= ?");
      params.push(min);
    }
  }

  if (f.areaMax !== "") {
    const max = Number(f.areaMax);
    if (Number.isNaN(max)) clauses.push("0");
    else {
      clauses.push("area_ha IS NOT NULL AND area_ha <= ?");
      params.push(max);
    }
  }

  return {
    sql: clauses.length > 0 ? clauses.map((c) => `(${c})`).join(" AND ") : "1=1",
    params,
  };
}

export class Repository {
  #db: Database;

  constructor(db: Database) {
    this.#db = db;
  }

  countLicenses(filters: ActiveFilters, opts: { onlyWithPolygon?: boolean } = {}): number {
    const where = buildWhere(filters);
    const extra = opts.onlyWithPolygon ? "AND has_polygon = 1" : "";
    const row = this.#db
      .query(`SELECT COUNT(*) as n FROM licenses WHERE ${where.sql} ${extra}`)
      .get(...where.params) as { n: number };
    return row.n;
  }

  listLicenses(filters: ActiveFilters, offset: number, limit: number): License[] {
    const where = buildWhere(filters);
    const rows = this.#db
      .query(`SELECT doc FROM licenses WHERE ${where.sql} ORDER BY ord LIMIT ? OFFSET ?`)
      .all(...where.params, limit, offset) as Pick<LicenseRow, "doc">[];
    return rows.map(hydrate);
  }

  getLicenseById(id: string): License | null {
    const row = this.#db
      .query("SELECT doc FROM licenses WHERE id = ? ORDER BY ord DESC LIMIT 1")
      .get(id) as Pick<LicenseRow, "doc"> | null;
    return row ? hydrate(row) : null;
  }

  getFilterOptions(): FilterOptions {
    const rows = this.#db.query("SELECT kind, value, grp, count FROM filter_options").all() as {
      kind: string;
      value: string;
      grp: string | null;
      count: number;
    }[];

    const byKind = (kind: string) =>
      rows
        .filter((r) => r.kind === kind)
        .map((r) => ({ value: r.value, count: r.count }))
        .toSorted((a, b) => b.count - a.count || a.value.localeCompare(b.value));

    const mineralTypes: MineralTypeOption[] = rows
      .filter((r) => r.kind === "mineralType")
      .map((r) => ({ value: r.value, group: r.grp ?? "", count: r.count }))
      .toSorted((a, b) => b.count - a.count || a.value.localeCompare(b.value));

    return {
      regions: byKind("region"),
      workTypes: byKind("workType"),
      mineralTypes,
      countries: byKind("country"),
      years: byKind("year"),
    };
  }

  geojsonBody(filters: ActiveFilters): string {
    const where = buildWhere(filters);
    const rows = this.#db
      .query(
        `SELECT geojson_feature FROM licenses WHERE ${where.sql} AND has_polygon = 1 ORDER BY ord`,
      )
      .all(...where.params) as { geojson_feature: string }[];
    return `{"type":"FeatureCollection","features":[${rows.map((r) => r.geojson_feature).join(",")}]}`;
  }
}

let repository: Repository;
try {
  repository = new Repository(openDb(resolveDatabasePath()));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

export { repository };
