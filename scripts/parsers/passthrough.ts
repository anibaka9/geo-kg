import type { Field } from "../types";

export function parsePassthrough(raw: string): Field<string> {
  return { raw, value: raw.trim() };
}
