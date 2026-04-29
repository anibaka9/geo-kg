import type { ActiveFilters, FilterOptions } from "@web/filters";
import { FilterPanel } from "./FilterPanel";
import { NavTabs } from "./NavTabs";

interface Props {
  filters: ActiveFilters;
  filterOptions: FilterOptions;
  total: number;
  qs: string | undefined;
}

export function MapPage({ filters, filterOptions, total, qs }: Props) {
  return (
    <div class="flex gap-6 h-[calc(100vh-5rem)]">
      <aside class="w-60 shrink-0 overflow-y-auto">
        <FilterPanel filters={filters} options={filterOptions} />
      </aside>
      <div class="flex-1 flex flex-col min-w-0 gap-3">
        <div class="flex items-center justify-between">
          <NavTabs active="map" qs={qs} />
          <p class="text-sm text-muted-foreground">
            {total} лицензий с координатами
          </p>
        </div>
        <div
          id="map"
          class="flex-1 rounded-lg border border-border overflow-hidden"
          data-qs={qs ?? ""}
        />
      </div>
    </div>
  );
}
