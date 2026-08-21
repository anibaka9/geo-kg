import { test, expect, describe } from "bun:test";
import { parseLicenseValidity } from "../licenseValidity";

describe("parseLicenseValidity", () => {
  test("trims and normalizes whitespace", () => {
    const result = parseLicenseValidity("  c 01.01.2020  по  31.12.2025  ");
    expect(result.value).toBe("c 01.01.2020 по 31.12.2025");
  });

  test("handles empty string", () => {
    const result = parseLicenseValidity("");
    expect(result.value).toBe("");
  });
});
