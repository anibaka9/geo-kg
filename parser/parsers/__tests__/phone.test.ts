import { test, expect, describe } from "bun:test";
import { parsePhone } from "../phone";

describe("parsePhone", () => {
  test("parses single phone in KG format", () => {
    const result = parsePhone("0555123456");
    expect(result.value).toEqual(["0555123456"]);
  });

  test("parses phone with +996 prefix", () => {
    const result = parsePhone("+996555123456");
    expect(result.value).toEqual(["+996555123456"]);
  });

  test("converts 00 prefix to +", () => {
    const result = parsePhone("00996555123456");
    expect(result.value).toEqual(["+996555123456"]);
  });

  test("adds leading zero for 9-digit KG numbers", () => {
    const result = parsePhone("555123456");
    expect(result.value).toEqual(["0555123456"]);
  });

  test("converts 996 prefix to +996", () => {
    const result = parsePhone("996555123456");
    expect(result.value).toEqual(["+996555123456"]);
  });

  test("handles phone with spaces and dashes", () => {
    const result = parsePhone("+996 555 12-34-56");
    expect(result.value).toEqual(["+996555123456"]);
  });

  test("handles phone with extension as separate part", () => {
    const result = parsePhone("0312 123456");
    expect(result.value).toEqual(["0312123456"]);
  });

  test("parses multiple phones separated by comma", () => {
    const result = parsePhone("0555123456, 0700123456");
    expect(result.value).toEqual(["0555123456", "0700123456"]);
  });

  test("parses multiple phones separated by semicolon", () => {
    const result = parsePhone("0555123456; 0700123456");
    expect(result.value).toEqual(["0555123456", "0700123456"]);
  });

  test("deduplicates identical phones", () => {
    const result = parsePhone("0555123456, 0555123456");
    expect(result.value).toEqual(["0555123456"]);
  });

  test("rejects invalid values", () => {
    expect(parsePhone("нет").value).toEqual([]);
    expect(parsePhone("нету").value).toEqual([]);
    expect(parsePhone("1").value).toEqual([]);
    expect(parsePhone("архив").value).toEqual([]);
  });

  test("handles empty string", () => {
    expect(parsePhone("").value).toEqual([]);
  });

  test("rejects too-short number", () => {
    const result = parsePhone("12345");
    expect(result.value).toEqual([]);
  });

  test("preserves raw value", () => {
    const result = parsePhone("0555 123456");
    expect(result.raw).toBe("0555 123456");
  });
});
