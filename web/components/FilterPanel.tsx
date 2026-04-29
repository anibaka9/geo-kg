import type {
  ActiveFilters,
  FilterOptions,
  MineralTypeOption,
} from "@web/filters";

export type { ActiveFilters, FilterOptions };

function Section({
  title,
  children,
  defaultOpen = true,
  activeCount = 0,
}: {
  title: string;
  children: JSX.Element | JSX.Element[];
  defaultOpen?: boolean;
  activeCount?: number;
}) {
  return (
    <details class="border-b border-border last:border-0" open={defaultOpen || undefined}>
      <summary class="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground cursor-pointer hover:bg-muted/50 select-none [&::-webkit-details-marker]:hidden">
        <span class="flex-1">{title}</span>
        {activeCount > 0 && (
          <span class="bg-primary text-primary-foreground rounded-full text-[10px] leading-none px-1.5 py-0.5">
            {activeCount}
          </span>
        )}
      </summary>
      <div class="px-4 pb-3 pt-1 space-y-0.5">{children}</div>
    </details>
  );
}

function CheckRow({
  name,
  value,
  label,
  count,
  checked,
}: {
  name: string;
  value: string;
  label: string;
  count: number;
  checked: boolean;
}) {
  return (
    <label class="flex items-center gap-2 py-0.5 cursor-pointer group">
      <input
        type="checkbox"
        name={name}
        value={value}
        checked={checked || undefined}
        onchange="this.closest('form').submit()"
        class="h-3.5 w-3.5 shrink-0 rounded border-border accent-primary"
      />
      <span class="flex-1 text-sm text-foreground truncate" title={label}>
        {label}
      </span>
      <span class="text-xs text-muted-foreground tabular-nums shrink-0">{count}</span>
    </label>
  );
}

const MINERAL_GROUP_ORDER = [
  "металлы",
  "топливо",
  "строительные материалы",
  "минералы",
  "вода",
  "прочее",
];

export function FilterPanel({
  filters,
  options,
}: {
  filters: ActiveFilters;
  options: FilterOptions;
}) {
  const totalActive =
    (filters.q ? 1 : 0) +
    (filters.status ? 1 : 0) +
    filters.regions.length +
    filters.workTypes.length +
    filters.mineralTypes.length +
    filters.countries.length +
    filters.years.length +
    (filters.areaMin ? 1 : 0) +
    (filters.areaMax ? 1 : 0);

  const mineralByGroup = new Map<string, MineralTypeOption[]>();
  for (const mt of options.mineralTypes) {
    if (!mineralByGroup.has(mt.group)) mineralByGroup.set(mt.group, []);
    mineralByGroup.get(mt.group)!.push(mt);
  }
  const sortedGroups = MINERAL_GROUP_ORDER.filter((g) => mineralByGroup.has(g));

  return (
    <form method="GET" action="/">
      <div class="rounded-lg border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div class="flex items-center justify-between px-4 py-3 border-b border-border">
          <span class="text-sm font-semibold text-foreground">
            Фильтры
            {totalActive > 0 && (
              <span class="ml-1.5 bg-primary text-primary-foreground rounded-full text-xs px-1.5 py-0.5">
                {totalActive}
              </span>
            )}
          </span>
          {totalActive > 0 && (
            <a
              href="/"
              class="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Сбросить
            </a>
          )}
        </div>

        <div class="px-4 py-3 border-b border-border">
          <input
            type="text"
            name="q"
            value={filters.q}
            placeholder="Номер, объект, компания…"
            class="w-full text-sm rounded-md border border-border bg-background px-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <Section title="Статус" activeCount={filters.status ? 1 : 0}>
          {(
            [
              { value: "", label: "Все" },
              { value: "active", label: "Активные" },
              { value: "annulled", label: "Аннулированные" },
            ] as { value: string; label: string }[]
          ).map(({ value, label }) => (
            <label class="flex items-center gap-2 py-0.5 cursor-pointer">
              <input
                type="radio"
                name="status"
                value={value}
                checked={filters.status === value || undefined}
                onchange="this.closest('form').submit()"
                class="h-3.5 w-3.5 shrink-0 border-border accent-primary"
              />
              <span class="text-sm text-foreground">{label}</span>
            </label>
          ))}
        </Section>

        <Section title="Год данных" activeCount={filters.years.length}>
          {options.years.map(({ value, count }) => (
            <CheckRow
              name="year"
              value={value}
              label={value}
              count={count}
              checked={filters.years.includes(value)}
            />
          ))}
        </Section>

        <Section title="Стадия работ" activeCount={filters.workTypes.length}>
          {options.workTypes.map(({ value, count }) => (
            <CheckRow
              name="workType"
              value={value}
              label={value}
              count={count}
              checked={filters.workTypes.includes(value)}
            />
          ))}
        </Section>

        <Section title="Регион" activeCount={filters.regions.length}>
          {options.regions.map(({ value, count }) => (
            <CheckRow
              name="region"
              value={value}
              label={value}
              count={count}
              checked={filters.regions.includes(value)}
            />
          ))}
        </Section>

        <Section title="Минералы" activeCount={filters.mineralTypes.length}>
          {sortedGroups.map((group, gi) => (
            <div class={gi > 0 ? "mt-2 pt-2 border-t border-border/50" : ""}>
              <p class="text-[10px] uppercase tracking-wide text-muted-foreground/60 mb-1">
                {group}
              </p>
              {mineralByGroup.get(group)!.map(({ value, count }) => (
                <CheckRow
                  name="mineralType"
                  value={value}
                  label={value}
                  count={count}
                  checked={filters.mineralTypes.includes(value)}
                />
              ))}
            </div>
          ))}
        </Section>

        <Section
          title="Страна регистрации"
          defaultOpen={false}
          activeCount={filters.countries.length}
        >
          <div class="max-h-52 overflow-y-auto space-y-0.5">
            {options.countries.map(({ value, count }) => (
              <CheckRow
                name="country"
                value={value}
                label={value}
                count={count}
                checked={filters.countries.includes(value)}
              />
            ))}
          </div>
        </Section>

        <Section
          title="Площадь (га)"
          defaultOpen={false}
          activeCount={(filters.areaMin ? 1 : 0) + (filters.areaMax ? 1 : 0)}
        >
          <div class="flex items-center gap-2">
            <input
              type="number"
              name="areaMin"
              value={filters.areaMin}
              placeholder="от"
              min="0"
              class="w-full text-sm rounded-md border border-border bg-background px-2 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span class="text-muted-foreground shrink-0">—</span>
            <input
              type="number"
              name="areaMax"
              value={filters.areaMax}
              placeholder="до"
              min="0"
              class="w-full text-sm rounded-md border border-border bg-background px-2 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            class="mt-2 w-full text-xs rounded-md border border-border bg-background px-3 py-1.5 text-foreground hover:bg-accent transition-colors"
          >
            Применить
          </button>
        </Section>
      </div>
    </form>
  );
}
