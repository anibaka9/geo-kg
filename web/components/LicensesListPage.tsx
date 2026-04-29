import type { License } from "@shared/types";
import type { ActiveFilters, FilterOptions } from "@web/filters";
import { FilterPanel } from "./FilterPanel";
import { LicensesTable } from "./LicensesTable";
import { Pagination } from "./Pagination";
import { NavTabs } from "./NavTabs";

interface Props {
  filters: ActiveFilters;
  filterOptions: FilterOptions;
  items: License[];
  offset: number;
  page: number;
  totalPages: number;
  total: number;
  totalAll: number;
  pageSize: number;
  qs: string | undefined;
}

export function LicensesListPage({
  filters,
  filterOptions,
  items,
  offset,
  page,
  totalPages,
  total,
  totalAll,
  pageSize,
  qs,
}: Props) {
  return (
    <div class="flex gap-6 items-start">
      <aside class="w-60 shrink-0 sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <FilterPanel filters={filters} options={filterOptions} />
      </aside>
      <div class="flex-1 min-w-0">
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-semibold tracking-tight text-foreground">
              Лицензии
            </h1>
            <p class="mt-1 text-sm text-muted-foreground">
              {total !== totalAll
                ? `${total} из ${totalAll} лицензий`
                : `${totalAll} лицензий`}
            </p>
          </div>
          <NavTabs active="table" qs={qs} />
        </div>
        <LicensesTable items={items} offset={offset} />
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          qs={qs}
        />
      </div>
    </div>
  );
}
