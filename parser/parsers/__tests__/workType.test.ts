import { test, expect, describe } from "bun:test";
import { parseWorkType } from "../workType";

describe("parseWorkType", () => {
  test("parses single work type П", () => {
    const result = parseWorkType("П");
    expect(result.value).toContain("поисково-оценочные работы");
  });

  test("parses single work type Р", () => {
    const result = parseWorkType("Р");
    expect(result.value).toContain("разведочные работы");
  });

  test("parses single work type Е", () => {
    const result = parseWorkType("Е");
    expect(result.value).toContain("эксплуатационные работы");
  });

  test("parses multiple work types", () => {
    const result = parseWorkType("ПР");
    expect(result.value.length).toBe(2);
  });

  test("deduplicates repeated letters", () => {
    const result = parseWorkType("ППП");
    expect(result.value.length).toBe(1);
  });

  test("returns empty for invalid letters", () => {
    const result = parseWorkType("Х");
    expect(result.value).toEqual([]);
  });

  test("returns empty for text without valid code", () => {
    const result = parseWorkType("Какие-то работы");
    expect(result.value).toEqual([]);
  });

  test("handles lowercase input", () => {
    const result = parseWorkType("пр");
    expect(result.value.length).toBe(2);
  });

  test("handles empty string", () => {
    const result = parseWorkType("");
    expect(result.value).toEqual([]);
  });

  test("sorts by standard order: П before Р before Е", () => {
    const result = parseWorkType("ЕР");
    expect(result.value.length).toBe(2);
    expect(result.value[0]).toContain("разведочные");
    expect(result.value[1]).toContain("эксплуатационные");
  });
});
