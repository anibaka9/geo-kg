import { test, expect, describe } from "bun:test";
import { parseAddress } from "../address";

describe("parseAddress", () => {
  test("normalizes whitespace", () => {
    const result = parseAddress("  г. Бишкек,   ул. Ленина  1 ");
    expect(result.value).toBe("г. Бишкек, ул. Ленина 1");
  });

  test("rejects 'нет'", () => {
    expect(parseAddress("нет").value).toBe("");
    expect(parseAddress("Нет").value).toBe("");
  });

  test("rejects 'переизданно'", () => {
    expect(parseAddress("переизданно").value).toBe("");
  });

  test("rejects single digits", () => {
    expect(parseAddress("0").value).toBe("");
    expect(parseAddress("20").value).toBe("");
  });

  test("preserves raw value", () => {
    const result = parseAddress("  test  ");
    expect(result.raw).toBe("  test  ");
  });
});
