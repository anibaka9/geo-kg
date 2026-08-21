import type { Field } from "@shared/types";
import { WORK_TYPE_CODES } from "../data/workType";

const VALID = new Set(Object.keys(WORK_TYPE_CODES));
const ORDER: Record<string, number> = { П: 0, Р: 1, Е: 2 };

export function parseWorkType(raw: string): Field<string[]> {
  const trimmed = raw.trim().replace(/\s+/gu, " ");

  const match = trimmed.match(/^([А-ЯЁA-Z]+)/iu);
  if (!match) return { raw, value: [] };

  const letters = [...new Set(match[1]!.toUpperCase())];

  if (letters.some((l) => !VALID.has(l))) return { raw, value: [] };

  const value = letters.toSorted((a, b) => ORDER[a]! - ORDER[b]!).map((l) => WORK_TYPE_CODES[l]!);

  return { raw, value };
}
