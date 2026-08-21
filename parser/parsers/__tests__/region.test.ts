import { test, expect, describe } from "bun:test";
import { parseRegion } from "../region";

describe("parseRegion", () => {
  test("parses canonical region name", () => {
    const result = parseRegion("Чуйская область");
    expect(result.value).toBe("Чуйская область");
  });

  test("parses region with alias keyword", () => {
    const result = parseRegion("Аламудунский р-н, Чуйская область");
    expect(result.value).toBe("Чуйская область");
  });

  test("parses from location string with district", () => {
    const result = parseRegion("Чуйская область, Аламудунский район");
    expect(result.value).toBe("Чуйская область");
  });

  test("uses region override if canonical", () => {
    const result = parseRegion("some garbage", "Чуйская область");
    expect(result.value).toBe("Чуйская область");
  });

  test("returns empty for unknown input", () => {
    const result = parseRegion("какой-то текст");
    expect(result.value).toBe("");
  });

  test("returns empty for empty input", () => {
    const result = parseRegion("");
    expect(result.value).toBe("");
  });

  test("parses all 7 oblasts by keyword", () => {
    const regions = [
      "Баткенская область",
      "Джалал-Абадская область",
      "Иссык-Кульская область",
      "Нарынская область",
      "Ошская область",
      "Таласская область",
      "Чуйская область",
    ];
    for (const r of regions) {
      expect(parseRegion(r).value as string).toBe(r);
    }
  });

  test("parses Bishkek and Osh cities", () => {
    expect(parseRegion("г. Бишкек").value).toBe("г. Бишкек");
    expect(parseRegion("г. Ош").value).toBe("г. Ош");
  });
});
