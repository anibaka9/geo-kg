import { test, expect, describe } from "bun:test";
import { parseFounders } from "../founders";

describe("parseFounders", () => {
  test("trims and normalizes whitespace", () => {
    const result = parseFounders("  Иванов   Иван  - 100%  ");
    expect(result.value).toBe("Иванов Иван - 100%");
  });

  test("handles empty string", () => {
    const result = parseFounders("");
    expect(result.value).toBe("");
  });
});
