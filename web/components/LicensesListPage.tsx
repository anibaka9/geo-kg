import type { License } from "@shared/types";
import { countActiveFilters, type ActiveFilters, type FilterOptions } from "@web/filters";
import { FilterPanel } from "./FilterPanel";
import { FilterToggleButton } from "./FilterToggleButton";
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
    <turbo-frame
      id="results"
      data-turbo-action="advance"
      class="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full w-full overflow-y-auto lg:overflow-visible"
    >
      <aside
        id="filter-aside"
        class="hidden lg:block w-full lg:w-60 lg:h-full shrink-0 overflow-y-auto rounded-lg border border-border bg-card shadow-sm"
      >
        <FilterPanel filters={filters} options={filterOptions} />
      </aside>
      <div class="flex-1 lg:h-full min-w-0 flex flex-col">
        <div class="mb-4 flex flex-wrap items-start justify-between gap-3 shrink-0">
          <div class="min-w-0">
            <h1 class="text-2xl font-semibold tracking-tight text-foreground">Лицензии</h1>
            <p class="mt-1 text-sm text-muted-foreground">
              {total !== totalAll ? `${total} из ${totalAll} лицензий` : `${totalAll} лицензий`}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <FilterToggleButton activeCount={countActiveFilters(filters)} />
            <NavTabs active="table" qs={qs} />
          </div>
        </div>
        <div class="flex-1 lg:overflow-y-auto min-h-0 rounded-lg border border-border">
          <LicensesTable items={items} offset={offset} />
        </div>
        <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} qs={qs} />
      </div>
    </turbo-frame>
  );
}
