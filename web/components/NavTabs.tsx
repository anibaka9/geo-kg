export function NavTabs({
  active,
  qs,
}: {
  active: "table" | "map";
  qs?: string;
}) {
  const tableHref = qs ? `/?${qs}` : "/";
  const mapHref = qs ? `/map?${qs}` : "/map";

  const base =
    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors";
  const activeStyle = `${base} bg-primary text-primary-foreground`;
  const inactiveStyle = `${base} text-muted-foreground hover:text-foreground hover:bg-muted`;

  return (
    <div class="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1">
      <a href={tableHref} class={active === "table" ? activeStyle : inactiveStyle}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M3 3h18v18H3z" />
          <path d="M3 9h18M3 15h18M9 3v18" />
        </svg>
        Таблица
      </a>
      <a href={mapHref} class={active === "map" ? activeStyle : inactiveStyle}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
          <line x1="9" y1="3" x2="9" y2="18" />
          <line x1="15" y1="6" x2="15" y2="21" />
        </svg>
        Карта
      </a>
    </div>
  );
}
