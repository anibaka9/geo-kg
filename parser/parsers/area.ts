import type { Field } from "@shared/types";

export function parseArea(raw: string): Field<number | null> {
  const m = raw.replace(",", ".").match(/([\d.]+)/);
  return { raw, value: m?.[1] != null ? parseFloat(m[1]) : null };
}
