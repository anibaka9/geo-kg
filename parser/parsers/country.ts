import type { Field } from "@shared/types";
import countryOverrides from "../overrides/country";
import { type CanonicalCountry, isCanonicalCountry } from "@shared/countries";
import {
  COUNTRY_NAMES,
  COUNTRY_PREFIX_STRIP,
  INVALID_COUNTRY_VALUES,
} from "../data/country";

const COUNTRY_PATTERN = new RegExp(
  COUNTRY_NAMES.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
  "gi",
);

function normalizeCountry(raw: string): string | null {
  let trimmed = raw.trim();
  if (INVALID_COUNTRY_VALUES.has(trimmed)) return null;

  for (const pattern of COUNTRY_PREFIX_STRIP) {
    trimmed = trimmed.replace(pattern, "");
  }
  trimmed = trimmed.trim();

  const overridden = countryOverrides[trimmed];
  if (overridden) return overridden;

  // Check for "гр. КНР" pattern
  if (/^гр\.\s*/i.test(trimmed)) {
    const withoutGr = trimmed.replace(/^гр\.\s*/i, "").trim();
    const overriddenGr = countryOverrides[withoutGr];
    if (overriddenGr) return overriddenGr;
  }

  // Extract country names using regex
  const matches = trimmed.match(COUNTRY_PATTERN);
  if (matches && matches.length > 0) {
    const normalized = matches.map((m) => {
      const overridden = countryOverrides[m];
      return overridden || m;
    });
    return [...new Set(normalized)].join(", ");
  }

  return trimmed;
}

export function parseCountry(raw: string): Field<CanonicalCountry[]> {
  const result = normalizeCountry(raw);
  if (!result) {
    return { raw, value: [] };
  }

  const countries = result
    .split(/[,\/\\]\s*/)
    .map((c) => c.trim())
    .filter(Boolean);
  const unique = [...new Set(countries)];
  const canonical = unique.filter(isCanonicalCountry);

  return { raw, value: canonical };
}
