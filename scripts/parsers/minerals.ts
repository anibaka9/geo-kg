import type { Field } from "../types";

export function parseMinerals(raw: string): Field<string[]> {
  const value = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return { raw, value };
}
