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
        <FilterPanel filters={filters} options={filterOptions} action="/map" />
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
      <div
        id="license-panel"
        class="fixed inset-y-0 right-0 w-[420px] bg-background border-l border-border overflow-y-auto shadow-xl z-50"
        style="display: none;"
      >
        <div class="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-center justify-between z-10">
          <span class="text-sm font-semibold text-foreground">Лицензия</span>
          <button
            id="license-panel-close"
            class="text-muted-foreground hover:text-foreground transition-colors p-1 -m-1 rounded leading-none"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>
        <div id="license-panel-content" class="p-4" />
      </div>
    </div>
  );
}
