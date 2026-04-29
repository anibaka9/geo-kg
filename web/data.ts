import type { License } from "@shared/types";
import { buildFilterOptions, type FilterOptions } from "@web/filters";

export const PAGE_SIZE = 25;

export const licenses: License[] = await Bun.file("./output/licenses.json").json();
export const byId = new Map(licenses.map((l) => [l.id.value, l]));
export const filterOptions: FilterOptions = buildFilterOptions(licenses);
