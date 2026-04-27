const GROUP_STYLES: Record<string, string> = {
  "вода": "bg-blue-50 text-blue-700 ring-blue-600/20",
  "металлы": "bg-slate-50 text-slate-700 ring-slate-600/20",
  "углеводороды": "bg-amber-50 text-amber-700 ring-amber-600/20",
  "строительные материалы": "bg-orange-50 text-orange-700 ring-orange-600/20",
  "промышленные минералы": "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "декоративный камень": "bg-purple-50 text-purple-700 ring-purple-600/20",
  "известняк": "bg-stone-50 text-stone-700 ring-stone-600/20",
  "глины": "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
  "редкоземельные": "bg-cyan-50 text-cyan-700 ring-cyan-600/20",
  "прочее": "bg-gray-100 text-gray-600 ring-gray-500/20",
};

export function MineralBadge({ group }: { group: string }) {
  const style = GROUP_STYLES[group] ?? GROUP_STYLES["прочее"];
  return (
    <span
      class={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
      title={group}
    >
      {group}
    </span>
  );
}
