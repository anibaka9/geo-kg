import type { Field } from "@shared/types";
import { DISTRICT_FIXES } from "../data/district";

function normalizeDistrict(value: string): string {
  let result = value.trim().replace(/\s+/g, " ");

  result = result.replace(/^[,.\s]+/, "");
  result = result.replace(/[,.\s]+$/, "");

  result = result.replace(/р-н\./g, "р-н");
  result = result.replace(/район\./g, "район");

  result = result.replace(/,\s*$/, "");

  for (const [pattern, replacement] of DISTRICT_FIXES) {
    result = result.replace(pattern, replacement);
  }

  return result.trim();
}

export function parseDistrict(raw: string): Field<string> {
  const normalized = normalizeDistrict(raw);
  return { raw, value: normalized };
}
