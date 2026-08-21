import { test, expect, describe } from "bun:test";
import { parseArea } from "../area";

describe("parseArea", () => {
  test("parses integer hectares", () => {
    const result = parseArea("150");
    expect(result.value).toBe(150);
  });

  test("parses decimal hectares with comma", () => {
    const result = parseArea("12,5");
    expect(result.value).toBe(12.5);
  });

  test("parses decimal hectares with dot", () => {
    const result = parseArea("12.5");
    expect(result.value).toBe(12.5);
  });

  test("extracts number from text", () => {
    const result = parseArea(" площадь 150 га ");
    expect(result.value).toBe(150);
  });

  test("returns null for empty string", () => {
    const result = parseArea("");
    expect(result.value).toBeNull();
  });

  test("returns null for non-numeric string", () => {
    const result = parseArea("нет данных");
    expect(result.value).toBeNull();
  });

  test("preserves raw value", () => {
    const result = parseArea("12,5");
    expect(result.raw).toBe("12,5");
  });
});
