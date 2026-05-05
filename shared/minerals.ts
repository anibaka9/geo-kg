export const MINERAL_GROUPS = [
  "металлы",
  "топливо",
  "строительные материалы",
  "минералы",
  "вода",
  "прочее",
] as const;

export type MineralGroup = (typeof MINERAL_GROUPS)[number];

export const MINERAL_GROUP_COLORS: Record<MineralGroup, string> = {
  металлы: "#64748b",
  топливо: "#f59e0b",
  "строительные материалы": "#f97316",
  минералы: "#10b981",
  вода: "#3b82f6",
  прочее: "#9ca3af",
};

export const MINERAL_GROUP_STYLES: Record<MineralGroup, string> = {
  металлы: "bg-slate-50 text-slate-700 ring-slate-600/20",
  топливо: "bg-amber-50 text-amber-700 ring-amber-600/20",
  "строительные материалы": "bg-orange-50 text-orange-700 ring-orange-600/20",
  минералы: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  вода: "bg-blue-50 text-blue-700 ring-blue-600/20",
  прочее: "bg-gray-100 text-gray-500 ring-gray-400/20",
};
