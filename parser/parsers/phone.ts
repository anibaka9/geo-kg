import type { Field } from "@shared/types";

const INVALID_VALUES = new Set(["нет", "нету", "1", "архив"]);

const PHONE_PATTERN = /(?:\+?\d[\d\s\-\(\)]{5,}\d)/gu;
const EXTENSION_PATTERN = /\s*\(.*?\)\s*$/u;

function normalizePhone(digits: string): string | null {
  // Handle 00 prefix (international dialing) → +
  if (digits.startsWith("00") && digits.length > 4) {
    digits = `+${digits.slice(2)}`;
  }

  // Add leading zero for Kyrgyz numbers missing it
  // Mobile: 5XX/7XX/9XX + 6 digits = 9 digits → add 0
  // Landline: 3XX + 6-7 digits → add 0
  if (/^[3579]\d{8}$/u.test(digits)) {
    return `0${digits}`;
  }
  if (/^[3579]\d{9}$/u.test(digits)) {
    return `0${digits}`;
  }

  // International format: 996... → +996...
  if (/^996\d{9,10}$/u.test(digits)) {
    return `+${digits}`;
  }

  // Already has correct format
  if (/^0\d{9,10}$/u.test(digits)) {
    return digits;
  }
  if (/^\+996\d{9,10}$/u.test(digits)) {
    return digits;
  }

  // Keep if reasonable length (7-13 digits)
  if (digits.length >= 7 && digits.length <= 13) {
    return digits;
  }

  return null;
}

function extractPhones(raw: string): string[] {
  const matches = raw.match(PHONE_PATTERN) || [];
  const phones: string[] = [];

  for (const match of matches) {
    // Remove extension like (2122), (20-85)
    const cleaned = match.replace(EXTENSION_PATTERN, "");

    const digits = cleaned.replace(/\D/gu, "");

    const normalized = normalizePhone(digits);
    if (normalized) {
      phones.push(normalized);
    }
  }

  return phones;
}

export function parsePhone(raw: string): Field<string[]> {
  const trimmed = raw.trim();
  if (!trimmed || INVALID_VALUES.has(trimmed.toLowerCase())) {
    return { raw, value: [] };
  }

  // Split by common separators: comma, semicolon, or multiple spaces
  const parts = trimmed.split(/[,;]\s*|\s{2,}/u);
  const phones: string[] = [];

  for (const part of parts) {
    const extracted = extractPhones(part);
    phones.push(...extracted);
  }

  // Deduplicate
  const unique = [...new Set(phones)];

  return { raw, value: unique };
}
