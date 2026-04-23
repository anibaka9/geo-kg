import type { Field } from "@shared/types";

export function parseFounders(raw: string): Field<string> {
  return { raw, value: raw.trim().replace(/\s+/g, " ") };
}
