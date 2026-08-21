import { test, expect, describe } from "bun:test";
import { parseAyilAymak } from "../ayilAymak";

describe("parseAyilAymak", () => {
  test("trims and normalizes whitespace", () => {
    const result = parseAyilAymak("  Айылный  аймак   ");
    expect(result.value).toBe("Айылный аймак");
  });

  test("handles empty string", () => {
    const result = parseAyilAymak("");
    expect(result.value).toBe("");
  });
});
