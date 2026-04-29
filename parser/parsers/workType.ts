import type { Field } from "@shared/types";

const CODES: Record<string, string> = {
  "П": "поисково-оценочные работы",
  "Р": "разведочные работы",
  "Е": "эксплуатационные работы",
};

const VALID = new Set(Object.keys(CODES));
const ORDER: Record<string, number> = { "П": 0, "Р": 1, "Е": 2 };

export function parseWorkType(raw: string): Field<string[]> {
  const trimmed = raw.trim().replace(/\s+/g, " ");

  // Extract the leading letter sequence (the code)
  const match = trimmed.match(/^([А-ЯЁA-Z]+)/i);
  if (!match) return { raw, value: [] };

  const letters = [...new Set(match[1]!.toUpperCase())];

  // Any unknown letter → treat whole code as unrecognised
  if (letters.some((l) => !VALID.has(l))) return { raw, value: [] };

  // Sort П → Р → Е and decode
  const value = letters
    .sort((a, b) => ORDER[a]! - ORDER[b]!)
    .map((l) => CODES[l]!);

  return { raw, value };
}
