import type { Field } from "@shared/types";
import countryOverrides from "../overrides/country";
import { CANONICAL_COUNTRIES, type CanonicalCountry, isCanonicalCountry } from "@shared/countries";

const COUNTRY_NAMES = [
  "Британские Виргинские Острова", "Британские острова", "Британских островах",
  "Британские виргинские острова", "Британские вирджинские острова",
  "Великобритания", "Британия",
  "Домини-канская Республика", "Доминиканская Республика",
  "Каймановы острова", "Каймановы Острова", "Каймоновы острова",
  "Сейшельские Острова", "Сейшельский острова",
  "Новая Зеландия",
  "Северная Америка",
  "Российский Федерация",
  "Кыргызстан", "Кыргызстан,", "Кыргызстан.", "КЫРГЫЗСТАН", "кыргызстан",
  "Кыргыгызстан", "Кыргызчтан", "Кыргыстан", "Кырзыстан", "Кырыгзстан",
  "Кырызстан", "Кыргызтан",
  "Казахстан", "Казакстан",
  "Узбекистан", "Узбекстан",
  "Швейцария", "Швйцария", "Щвейцария",
  "Турция", "Турции",
  "Австралия", "Австрия", "Афганистан", "Германия", "Гонконг",
  "Джерси", "остров Джерси", "ОАЭ", "Дубай", "Израиль", "Индия",
  "Канада", "Кипр", "Китай", "КНР", "Корея", "Кувейт", "Малайзия",
  "Монголия", "Нидерланды", "Россия", "РФ", "РУ", "Сингапур", "США",
  "Таджикистан", "Украина", "КР", "РК", "Швеция", "Эстония", "Япония",
  "Страны КНР, РУ",
];

const PREFIX_STRIP = [
  /^СП\s+/i,
  /^\d+\.\s*/,
];

const COUNTRY_PATTERN = new RegExp(COUNTRY_NAMES.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'gi');

const INVALID_VALUES = new Set([
  "1193", "13точек", "444", "Досканировано",
  "87-Н-17 от 22.02.17",
  "Аннулирована.Протокол от 01-н-2022 от 24.02.22г",
  "Аннулирована.Протокол № 328-Н-17 от  23.06.17г.",
  "Аннулирована.Протокол №87-Н-17 от 22.02.17г.",
]);

function normalizeCountry(raw: string): string | null {
  let trimmed = raw.trim();
  if (INVALID_VALUES.has(trimmed)) return null;

  for (const pattern of PREFIX_STRIP) {
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
    const normalized = matches.map(m => {
      const overridden = countryOverrides[m];
      return overridden || m;
    });
    // Deduplicate while preserving order
    return [...new Set(normalized)].join(", ");
  }

  return trimmed;
}

export function parseCountry(raw: string): Field<CanonicalCountry[]> {
  const result = normalizeCountry(raw);
  if (!result) {
    return { raw, value: [] };
  }

  // Split by common separators and normalize each
  const countries = result.split(/[,\/\\]\s*/).map(c => c.trim()).filter(Boolean);
  const unique = [...new Set(countries)];

  // Filter to only canonical countries
  const canonical = unique.filter(isCanonicalCountry);

  return { raw, value: canonical };
}
