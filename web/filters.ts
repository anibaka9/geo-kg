import type { License } from "@shared/types";

export interface FilterOption {
  value: string;
  count: number;
}

export interface MineralTypeOption {
  value: string;
  group: string;
  count: number;
}

export interface FilterOptions {
  regions: FilterOption[];
  workTypes: FilterOption[];
  mineralTypes: MineralTypeOption[];
  countries: FilterOption[];
  years: FilterOption[];
}

export interface ActiveFilters {
  q: string;
  status: string;
  regions: string[];
  workTypes: string[];
  mineralTypes: string[];
  countries: string[];
  years: string[];
  areaMin: string;
  areaMax: string;
}

export function buildFilterOptions(all: License[]): FilterOptions {
  const regionCounts = new Map<string, number>();
  const workTypeCounts = new Map<string, number>();
  const mineralTypeCounts = new Map<string, { count: number; group: string }>();
  const countryCounts = new Map<string, number>();
  const yearCounts = new Map<string, number>();

  for (const l of all) {
    if (l.region.value)
      regionCounts.set(l.region.value, (regionCounts.get(l.region.value) ?? 0) + 1);
    for (const wt of l.workType.value) workTypeCounts.set(wt, (workTypeCounts.get(wt) ?? 0) + 1);
    for (const m of l.minerals.value) {
      const ex = mineralTypeCounts.get(m.type);
      if (ex) ex.count++;
      else mineralTypeCounts.set(m.type, { count: 1, group: m.group });
    }
    for (const c of l.company.country.value) countryCounts.set(c, (countryCounts.get(c) ?? 0) + 1);
    const y = String(l.sourceYear);
    yearCounts.set(y, (yearCounts.get(y) ?? 0) + 1);
  }

  const toArr = (map: Map<string, number>): FilterOption[] =>
    [...map.entries()]
      .map(([value, count]) => ({ value, count }))
      .toSorted((a, b) => b.count - a.count || a.value.localeCompare(b.value));

  return {
    regions: toArr(regionCounts),
    workTypes: toArr(workTypeCounts),
    mineralTypes: [...mineralTypeCounts.entries()]
      .map(([value, { count, group }]) => ({ value, count, group }))
      .toSorted((a, b) => b.count - a.count || a.value.localeCompare(b.value)),
    countries: toArr(countryCounts),
    years: toArr(yearCounts),
  };
}

export function parseFilters(sp: URLSearchParams): ActiveFilters {
  return {
    q: sp.get("q") ?? "",
    status: sp.get("status") ?? "",
    regions: sp.getAll("region"),
    workTypes: sp.getAll("workType"),
    mineralTypes: sp.getAll("mineralType"),
    countries: sp.getAll("country"),
    years: sp.getAll("year"),
    areaMin: sp.get("areaMin") ?? "",
    areaMax: sp.get("areaMax") ?? "",
  };
}

export function applyFilters(all: License[], f: ActiveFilters): License[] {
  return all.filter((l) => {
    if (f.q) {
      const q = f.q.toLowerCase();
      if (
        !l.licenseNumber.value.toLowerCase().includes(q) &&
        !l.objectName.value.toLowerCase().includes(q) &&
        !l.company.identity.value.name.toLowerCase().includes(q)
      )
        return false;
    }
    if (f.status === "active" && l.status.value.isAnnulled) return false;
    if (f.status === "annulled" && !l.status.value.isAnnulled) return false;
    if (f.regions.length > 0 && !f.regions.includes(l.region.value)) return false;
    if (f.workTypes.length > 0 && !l.workType.value.some((wt) => f.workTypes.includes(wt)))
      return false;
    if (f.mineralTypes.length > 0 && !l.minerals.value.some((m) => f.mineralTypes.includes(m.type)))
      return false;
    if (f.countries.length > 0 && !l.company.country.value.some((c) => f.countries.includes(c)))
      return false;
    if (f.years.length > 0 && !f.years.includes(String(l.sourceYear))) return false;
    const areaMin = Number(f.areaMin);
    const areaMax = Number(f.areaMax);
    if (f.areaMin !== "" && (isNaN(areaMin) || l.areaHa.value === null || l.areaHa.value < areaMin))
      return false;
    if (f.areaMax !== "" && (isNaN(areaMax) || l.areaHa.value === null || l.areaHa.value > areaMax))
      return false;
    return true;
  });
}

export function filtersToQs(sp: URLSearchParams): string {
  return [...sp.entries()]
    .filter(([k]) => k !== "page")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}
