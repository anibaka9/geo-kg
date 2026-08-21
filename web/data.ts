import type { License } from "@shared/types";
import { buildFilterOptions, type FilterOptions } from "@web/filters";

export const PAGE_SIZE = 25;

let licenses: License[];
const file = Bun.file("./output/licenses.json");
if (await file.exists()) {
  licenses = await file.json() as License[];
} else {
  console.warn("output/licenses.json not found. Run: bun run parse");
  licenses = [];
}

export { licenses };
export const byId = new Map(licenses.map((l) => [l.id.value, l]));
export const filterOptions: FilterOptions = buildFilterOptions(licenses);
