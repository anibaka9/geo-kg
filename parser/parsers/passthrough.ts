import type { Field } from "@shared/types";

export function parsePassthrough(raw: string): Field<string> {
  return { raw, value: raw.trim() };
}
