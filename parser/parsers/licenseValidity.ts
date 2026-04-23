import type { Field } from "@shared/types";

export function parseLicenseValidity(raw: string): Field<string> {
  return { raw, value: raw.trim().replace(/\s+/g, " ") };
}
