const GROUP_STYLES: Record<string, string> = {
  "металлы":                 "bg-slate-50 text-slate-700 ring-slate-600/20",
  "топливо":                 "bg-amber-50 text-amber-700 ring-amber-600/20",
  "строительные материалы":  "bg-orange-50 text-orange-700 ring-orange-600/20",
  "минералы":                "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "вода":                    "bg-blue-50 text-blue-700 ring-blue-600/20",
  "прочее":                  "bg-gray-100 text-gray-500 ring-gray-400/20",
};

export function MineralBadge({ name, group, type }: { name: string; group: string; type?: string }) {
  const style = GROUP_STYLES[group] ?? GROUP_STYLES["прочее"];
  const tooltip = type ? `${group} → ${type}` : group;
  return (
    <span
      class={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
      title={tooltip}
    >
      {name}
    </span>
  );
}
