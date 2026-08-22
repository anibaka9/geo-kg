import type { License } from "@shared/types";

export interface LicenseRow {
  ord: number;
  id: string;
  license_number: string;
  object_name: string;
  company_name: string;
  region: string;
  area_ha: number | null;
  is_annulled: number;
  source_year: number;
  has_polygon: number;
  min_lat: number | null;
  max_lat: number | null;
  min_lon: number | null;
  max_lon: number | null;
  geojson_feature: string | null;
  doc: string;
}

export function hydrate(row: Pick<LicenseRow, "doc">): License {
  return JSON.parse(row.doc) as License;
}
