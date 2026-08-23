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

export function countActiveFilters(filters: ActiveFilters): number {
  return (
    (filters.q ? 1 : 0) +
    (filters.status ? 1 : 0) +
    filters.regions.length +
    filters.workTypes.length +
    filters.mineralTypes.length +
    filters.countries.length +
    filters.years.length +
    (filters.areaMin ? 1 : 0) +
    (filters.areaMax ? 1 : 0)
  );
}

export function filtersToQs(sp: URLSearchParams): string {
  return [...sp.entries()]
    .filter(([k]) => k !== "page")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}
