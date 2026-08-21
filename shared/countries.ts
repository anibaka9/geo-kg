export const CANONICAL_COUNTRIES = [
  "Австралия",
  "Австрия",
  "Афганистан",
  "Британские Виргинские Острова",
  "Великобритания",
  "Германия",
  "Гонконг",
  "Джерси",
  "Доминиканская Республика",
  "Израиль",
  "Индия",
  "Казахстан",
  "Каймановы Острова",
  "Канада",
  "Кипр",
  "Китай",
  "Корея",
  "Кувейт",
  "Кыргызстан",
  "Малайзия",
  "Монголия",
  "Нидерланды",
  "Новая Зеландия",
  "ОАЭ",
  "Россия",
  "Сейшельские Острова",
  "Сингапур",
  "США",
  "Таджикистан",
  "Турция",
  "Узбекистан",
  "Украина",
  "Швейцария",
  "Швеция",
  "Эстония",
  "Япония",
] as const;

export type CanonicalCountry = (typeof CANONICAL_COUNTRIES)[number];

export const CANONICAL_COUNTRIES_SET = new Set<string>(CANONICAL_COUNTRIES);

export function isCanonicalCountry(c: string): c is CanonicalCountry {
  return CANONICAL_COUNTRIES_SET.has(c);
}
