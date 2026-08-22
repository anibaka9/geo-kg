import { Database } from "bun:sqlite";
import { existsSync, unlinkSync } from "node:fs";
import type { License } from "@shared/types";
import { toGeoJsonFeatures } from "@shared/geojson";
import { SCHEMA_SQL, INDEX_SQL, SCHEMA_VERSION } from "./schema";

interface FilterOptionRow {
  kind: string;
  value: string;
  grp: string | null;
  count: number;
}

function computeFilterOptions(licenses: License[]): FilterOptionRow[] {
  const regionCounts = new Map<string, number>();
  const workTypeCounts = new Map<string, number>();
  const mineralTypeCounts = new Map<string, { count: number; group: string }>();
  const countryCounts = new Map<string, number>();
  const yearCounts = new Map<string, number>();

  for (const l of licenses) {
    if (l.region.value)
      regionCounts.set(l.region.value, (regionCounts.get(l.region.value) ?? 0) + 1);
    for (const wt of l.workType.value) workTypeCounts.set(wt, (workTypeCounts.get(wt) ?? 0) + 1);
    for (const m of l.minerals.value) {
      const existing = mineralTypeCounts.get(m.type);
      if (existing) existing.count++;
      else mineralTypeCounts.set(m.type, { count: 1, group: m.group });
    }
    for (const c of l.company.country.value) countryCounts.set(c, (countryCounts.get(c) ?? 0) + 1);
    const y = String(l.sourceYear);
    yearCounts.set(y, (yearCounts.get(y) ?? 0) + 1);
  }

  const rows: FilterOptionRow[] = [];
  for (const [value, count] of regionCounts) rows.push({ kind: "region", value, grp: null, count });
  for (const [value, count] of workTypeCounts)
    rows.push({ kind: "workType", value, grp: null, count });
  for (const [value, { count, group }] of mineralTypeCounts)
    rows.push({ kind: "mineralType", value, grp: group, count });
  for (const [value, count] of countryCounts)
    rows.push({ kind: "country", value, grp: null, count });
  for (const [value, count] of yearCounts) rows.push({ kind: "year", value, grp: null, count });
  return rows;
}

export function buildDatabase(licenses: License[], outPath: string): void {
  for (const suffix of ["", "-wal", "-shm"]) {
    const p = outPath + suffix;
    if (existsSync(p)) unlinkSync(p);
  }

  const db = new Database(outPath, { create: true });
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(SCHEMA_SQL);

  const insertLicense = db.prepare(`
    INSERT INTO licenses (
      id, ord, license_number, object_name, company_name, region, area_ha,
      is_annulled, source_year, has_polygon, min_lat, max_lat, min_lon, max_lon,
      geojson_feature, doc
    ) VALUES (
      $id, $ord, $license_number, $object_name, $company_name, $region, $area_ha,
      $is_annulled, $source_year, $has_polygon, $min_lat, $max_lat, $min_lon, $max_lon,
      $geojson_feature, $doc
    )
  `);
  const insertMineral = db.prepare(
    "INSERT INTO license_minerals (license_ord, name, type, grp) VALUES (?, ?, ?, ?)",
  );
  const insertWorkType = db.prepare(
    "INSERT INTO license_work_types (license_ord, work_type) VALUES (?, ?)",
  );
  const insertCountry = db.prepare(
    "INSERT INTO license_countries (license_ord, country) VALUES (?, ?)",
  );
  const insertFts = db.prepare("INSERT INTO licenses_fts (ord, haystack) VALUES (?, ?)");
  const insertFilterOption = db.prepare(
    "INSERT INTO filter_options (kind, value, grp, count) VALUES (?, ?, ?, ?)",
  );

  const insertAll = db.transaction((rows: License[]) => {
    rows.forEach((l, ord) => {
      const pts = l.polygon.value;
      const hasPolygon = pts.length > 0;
      const lats = pts.map((p) => p[0]);
      const lons = pts.map((p) => p[1]);
      const feature = hasPolygon ? toGeoJsonFeatures([l])[0] : undefined;

      insertLicense.run({
        $id: l.id.value,
        $ord: ord,
        $license_number: l.licenseNumber.value,
        $object_name: l.objectName.value,
        $company_name: l.company.identity.value.name,
        $region: l.region.value,
        $area_ha: l.areaHa.value,
        $is_annulled: l.status.value.isAnnulled ? 1 : 0,
        $source_year: l.sourceYear,
        $has_polygon: hasPolygon ? 1 : 0,
        $min_lat: hasPolygon ? Math.min(...lats) : null,
        $max_lat: hasPolygon ? Math.max(...lats) : null,
        $min_lon: hasPolygon ? Math.min(...lons) : null,
        $max_lon: hasPolygon ? Math.max(...lons) : null,
        $geojson_feature: feature ? JSON.stringify(feature) : null,
        $doc: JSON.stringify(l),
      });

      for (const m of l.minerals.value) insertMineral.run(ord, m.name, m.type, m.group);
      for (const wt of l.workType.value) insertWorkType.run(ord, wt);
      for (const c of l.company.country.value) insertCountry.run(ord, c);

      const haystack = [l.licenseNumber.value, l.objectName.value, l.company.identity.value.name]
        .filter(Boolean)
        .join(" ");
      insertFts.run(ord, haystack);
    });

    for (const opt of computeFilterOptions(rows))
      insertFilterOption.run(opt.kind, opt.value, opt.grp, opt.count);
  });

  insertAll(licenses);

  insertLicense.finalize();
  insertMineral.finalize();
  insertWorkType.finalize();
  insertCountry.finalize();
  insertFts.finalize();
  insertFilterOption.finalize();

  db.exec(INDEX_SQL);
  db.exec("ANALYZE;");
  db.exec(`PRAGMA user_version = ${SCHEMA_VERSION};`);
  db.exec("VACUUM;");
  db.close();
}
