import type { Field } from "@shared/types";
import { type CanonicalRegion, isCanonicalRegion } from "@shared/regions";
import {
  REGION_PATTERNS,
  REGION_KEYWORDS,
  INVALID_REGION_VALUES,
  LATIN_TO_CYRILLIC,
} from "../data/region";

function normalizeCyrillic(s: string): string {
  for (const [pattern, replacement] of LATIN_TO_CYRILLIC) {
    s = s.replace(pattern, replacement);
  }
  return s;
}

function extractRegion(raw: string): CanonicalRegion | null {
  let trimmed = raw.trim();

  if (!trimmed) return null;

  trimmed = normalizeCyrillic(trimmed);

  const lowerTrimmed = trimmed.toLowerCase();
  for (const invalid of INVALID_REGION_VALUES) {
    if (lowerTrimmed.includes(invalid)) return null;
  }

  if (isCanonicalRegion(trimmed)) return trimmed;

  for (const [pattern, replacement] of REGION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return replacement;
    }
  }

  for (const [keyword, canonical] of REGION_KEYWORDS) {
    if (lowerTrimmed.includes(keyword)) {
      return canonical;
    }
  }

  return null;
}

export function parseRegion(
  location: string,
  regionOverride?: string,
): Field<CanonicalRegion | ""> {
  if (regionOverride && isCanonicalRegion(regionOverride)) {
    return { raw: regionOverride, value: regionOverride };
  }
  const result = extractRegion(location);
  return { raw: location, value: result ?? "" };
}
