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
    <div class="flex gap-6 h-full">
      <aside class="w-60 h-full shrink-0 overflow-y-auto rounded-lg border border-border bg-card shadow-sm">
        <FilterPanel filters={filters} options={filterOptions} />
      </aside>
      <turbo-frame
        id="results"
        data-turbo-action="advance"
        class="flex-1 h-full min-w-0 flex flex-col"
      >
        <div class="mb-4 flex items-start justify-between gap-4 shrink-0">
          <div>
            <h1 class="text-2xl font-semibold tracking-tight text-foreground">Лицензии</h1>
            <p class="mt-1 text-sm text-muted-foreground">
              {total !== totalAll ? `${total} из ${totalAll} лицензий` : `${totalAll} лицензий`}
            </p>
          </div>
          <NavTabs active="table" qs={qs} />
        </div>
        <div class="flex-1 overflow-y-auto min-h-0 rounded-lg border border-border">
          <LicensesTable items={items} offset={offset} />
        </div>
        <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} qs={qs} />
      </turbo-frame>
    </div>
  );
}
