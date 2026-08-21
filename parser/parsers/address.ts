import type { Field } from "@shared/types";

const INVALID_VALUES = new Set(["нет", "переизданно", "0", "20"]);

export function parseAddress(raw: string): Field<string> {
  const trimmed = raw.trim().replace(/\s+/gu, " ");

  if (INVALID_VALUES.has(trimmed.toLowerCase())) {
    return { raw, value: "" };
  }

  return { raw, value: trimmed };
}
