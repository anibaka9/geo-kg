import { test, expect, describe } from "bun:test";
import { parseCountry } from "../country";

describe("parseCountry", () => {
  test("parses single canonical country", () => {
    const result = parseCountry("Кыргызстан");
    expect(result.value).toEqual(["Кыргызстан"]);
  });

  test("parses multiple countries separated by comma", () => {
    const result = parseCountry("Кыргызстан, Китай");
    expect(result.value).toContain("Кыргызстан");
    expect(result.value).toContain("Китай");
  });

  test("parses multiple countries separated by slash", () => {
    const result = parseCountry("Кыргызстан/Китай");
    expect(result.value).toContain("Кыргызстан");
    expect(result.value).toContain("Китай");
  });

  test("filters non-canonical country names", () => {
    const result = parseCountry("Неизвестная страна");
    expect(result.value).toEqual([]);
  });

  test("handles гр. prefix", () => {
    const result = parseCountry("гр. Китай");
    expect(result.value).toContain("Китай");
  });

  test("strips prefixes before matching", () => {
    const result = parseCountry("Кыргызстан");
    expect(result.value).toContain("Кыргызстан");
  });

  test("returns empty for invalid values", () => {
    expect(parseCountry("нет").value).toEqual([]);
  });

  test("handles empty string", () => {
    expect(parseCountry("").value).toEqual([]);
  });

  test("deduplicates countries", () => {
    const result = parseCountry("Кыргызстан, Кыргызстан");
    expect(result.value).toEqual(["Кыргызстан"]);
  });
});
