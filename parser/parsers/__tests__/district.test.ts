import { test, expect, describe } from "bun:test";
import { parseDistrict } from "../district";

describe("parseDistrict", () => {
  test("trims and normalizes whitespace", () => {
    const result = parseDistrict("  Аламудунский  район  ");
    expect(result.value).toBe("Аламудунский район");
  });

  test("removes leading punctuation", () => {
    const result = parseDistrict(",, Аламудунский район");
    expect(result.value).toBe("Аламудунский район");
  });

  test("removes trailing comma", () => {
    const result = parseDistrict("Аламудунский район,");
    // after processing: the trailing comma should be removed
    expect(result.value).not.toMatch(/,\s*$/u);
  });

  test("normalizes р-н. to р-н", () => {
    const result = parseDistrict("Аламудунский р-н.");
    expect(result.value).toMatch(/р-н$/u);
  });

  test("normalizes район. to район", () => {
    const result = parseDistrict("Аламудунский район.");
    expect(result.value).toMatch(/район$/u);
  });

  test("handles empty string", () => {
    const result = parseDistrict("");
    expect(result.value).toBe("");
  });
});
