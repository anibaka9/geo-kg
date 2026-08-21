import type { License } from "@shared/types";
import { buildFilterOptions, type FilterOptions } from "@web/filters";

export const PAGE_SIZE = 25;

const DATA_PATH = process.env.LICENSES_PATH || "./output/licenses.json";

let licenses: License[];
const file = Bun.file(DATA_PATH);
if (await file.exists()) {
  licenses = (await file.json()) as License[];
} else {
  console.warn(`${DATA_PATH} not found. Run: bun run parse`);
  licenses = [];
}

export { licenses };
export const byId = new Map(licenses.map((l) => [l.id.value, l]));
export const filterOptions: FilterOptions = buildFilterOptions(licenses);
