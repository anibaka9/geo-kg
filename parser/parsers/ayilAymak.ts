import type { Field } from "@shared/types";

export function parseAyilAymak(raw: string): Field<string> {
  return { raw, value: raw.trim().replace(/\s+/gu, " ") };
}
