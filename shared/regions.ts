export const CANONICAL_REGIONS = [
  "Баткенская область",
  "Джалал-Абадская область",
  "Иссык-Кульская область",
  "Нарынская область",
  "Ошская область",
  "Таласская область",
  "Чуйская область",
  "г. Бишкек",
  "г. Ош",
] as const;

export type CanonicalRegion = typeof CANONICAL_REGIONS[number];
