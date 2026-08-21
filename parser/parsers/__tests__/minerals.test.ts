import { test, expect, describe } from "bun:test";
import { parseMinerals } from "../minerals";

describe("parseMinerals", () => {
  test("parses known mineral", () => {
    const result = parseMinerals("золото");
    expect(result.value.length).toBe(1);
    expect(result.value[0]!.type).toBe("благородные металлы");
    expect(result.value[0]!.group).toBe("металлы");
    expect(result.value[0]!.name).toBe("золото");
  });

  test("parses multiple comma-separated minerals", () => {
    const result = parseMinerals("золото, медь");
    expect(result.value.length).toBe(2);
    expect(result.value[0]!.name).toBe("золото");
    expect(result.value[1]!.name).toBe("медь");
  });

  test("parses minerals with ' и ' separator", () => {
    const result = parseMinerals("золото и медь");
    expect(result.value.length).toBe(2);
  });

  test("deduplicates minerals", () => {
    const result = parseMinerals("золото, ЗОЛОТО");
    expect(result.value.length).toBe(1);
  });

  test("returns empty array for empty string", () => {
    const result = parseMinerals("");
    expect(result.value).toEqual([]);
  });

  test("returns прочее for unknown mineral", () => {
    const result = parseMinerals("неизвестный элемент");
    expect(result.value.length).toBe(1);
    expect(result.value[0]!.group).toBe("прочее");
  });

  test("preserves raw value", () => {
    const result = parseMinerals("ЗОЛОТО");
    expect(result.raw).toBe("ЗОЛОТО");
  });
});
