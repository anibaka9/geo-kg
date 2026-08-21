import { test, expect, describe } from "bun:test";
import { parsePassthrough } from "../passthrough";

describe("parsePassthrough", () => {
  test("trims whitespace", () => {
    const result = parsePassthrough("  hello  ");
    expect(result.value).toBe("hello");
  });

  test("handles empty string", () => {
    const result = parsePassthrough("");
    expect(result.value).toBe("");
  });

  test("preserves raw value", () => {
    const result = parsePassthrough("  bar  ");
    expect(result.raw).toBe("  bar  ");
  });
});
