import type { Field } from "../types";

export function parseInn(raw: string): Field<string> {
  return { raw, value: raw.replace(/^ИНН\s*/i, "").trim() };
}
