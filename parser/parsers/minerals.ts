import type { Field, MineralEntry } from "@shared/types";
import { MINERAL_MAP, EXPAND_MAP } from "../data/minerals";

const NORMALIZATIONS: [RegExp, string][] = [
  [/\s{2,}/g, " "],
  [/^и\s+/i, ""],
  [/[.\s]+$/g, ""],
];

function normalizeToken(s: string): string {
  let t = s.trim().toLowerCase();
  for (const [re, rep] of NORMALIZATIONS) t = t.replace(re, rep);
  return t.trim();
}

export function parseMinerals(raw: string): Field<MineralEntry[]> {
  const seen = new Set<string>();
  const value: MineralEntry[] = [];

  for (const commaToken of raw.split(",")) {
    const normalized = normalizeToken(commaToken);
    if (!normalized) continue;

    const expanded = EXPAND_MAP[normalized];
    const tokens = expanded ?? normalized.split(" и ").map((s) => s.trim()).filter(Boolean);

    for (const token of tokens) {
      const entry = MINERAL_MAP[token] ?? { name: token, type: "прочее", group: "прочее" };
      if (!seen.has(entry.name)) {
        seen.add(entry.name);
        value.push(entry);
      }
    }
  }

  return { raw, value };
}
