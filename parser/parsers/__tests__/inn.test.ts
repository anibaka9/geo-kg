import { test, expect, describe } from "bun:test";
import { parseInn } from "../inn";

describe("parseInn", () => {
  test("parses valid 14-digit INN", () => {
    const result = parseInn("12345678901234");
    expect(result.value).toBe("12345678901234");
  });

  test("strips ИНН prefix", () => {
    const result = parseInn("ИНН 12345678901234");
    expect(result.value).toBe("12345678901234");
  });

  test("strips ИИН prefix", () => {
    const result = parseInn("ИИН 12345678901234");
    expect(result.value).toBe("12345678901234");
  });

  test("strips ПИН prefix", () => {
    const result = parseInn("ПИН 12345678901234");
    expect(result.value).toBe("12345678901234");
  });

  test("restores leading zero for 13-digit number", () => {
    const result = parseInn("2345678901234");
    expect(result.value).toBe("02345678901234");
  });

  test("rejects non-digit content", () => {
    const result = parseInn("12-345678901234");
    expect(result.value).toBe("");
  });

  test("rejects too-short INN", () => {
    const result = parseInn("1234567890");
    expect(result.value).toBe("");
  });

  test("rejects too-long INN", () => {
    const result = parseInn("123456789012345");
    expect(result.value).toBe("");
  });

  test("rejects 'нет'", () => {
    expect(parseInn("нет").value).toBe("");
    expect(parseInn("нету").value).toBe("");
  });

  test("rejects 'кр'", () => {
    expect(parseInn("кр").value).toBe("");
  });

  test("rejects empty string", () => {
    expect(parseInn("").value).toBe("");
  });

  test("preserves raw value", () => {
    const result = parseInn("ИНН 12345678901234");
    expect(result.raw).toBe("ИНН 12345678901234");
  });

  test("handles trailing semicolons", () => {
    const result = parseInn("12345678901234;");
    expect(result.value).toBe("12345678901234");
  });
});
