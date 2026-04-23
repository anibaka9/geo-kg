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

export const CANONICAL_REGIONS_SET = new Set<string>(CANONICAL_REGIONS);

export function isCanonicalRegion(r: string): r is CanonicalRegion {
  return CANONICAL_REGIONS_SET.has(r);
}
