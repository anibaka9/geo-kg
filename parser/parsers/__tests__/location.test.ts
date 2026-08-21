import { test, expect, describe } from "bun:test";
import { parseLocation } from "../location";

describe("parseLocation", () => {
  test("splits region and district", () => {
    const result = parseLocation("Чуйская область, Аламудунский район");
    expect(result.region.value).toBe("Чуйская область");
    expect(result.district.value).toBe("Аламудунский район");
  });

  test("handles single region without district", () => {
    const result = parseLocation("Чуйская область");
    expect(result.region.value).toBe("Чуйская область");
    expect(result.district.value).toBe("");
  });

  test("handles region with multiple comma-separated parts", () => {
    const result = parseLocation("Ошская область, Ноокатский район, г. Ош");
    expect(result.region.value).toBe("Ошская область");
    expect(result.district.value).toContain("Ноокатский район");
  });

  test("handles empty string", () => {
    const result = parseLocation("");
    expect(result.region.value).toBe("");
    expect(result.district.value).toBe("");
  });
});
