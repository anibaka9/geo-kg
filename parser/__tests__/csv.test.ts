import { test, expect, describe } from "bun:test";
import { licenseKey, getCol } from "../csv";

describe("licenseKey", () => {
  test("extracts standard format: letters + digits", () => {
    expect(licenseKey("НМ 11-02")).toBe("нм 11-02");
    expect(licenseKey("АП 1234-56")).toBe("ап 1234-56");
  });

  test("extracts when digits come first", () => {
    expect(licenseKey("123-НМ")).toBe("123-нм");
  });

  test("handles cyrillic letters", () => {
    expect(licenseKey("ВЕ 5-99")).toBe("ве 5-99");
  });

  test("handles no separator between letters and digits", () => {
    expect(licenseKey("НМ1102")).toBe("нм1102");
  });

  test("handles long license numbers with trailing text", () => {
    expect(licenseKey("  НМ 11-02 (переоформление)  ")).toBe("нм 11-02");
  });

  test("handles empty input", () => {
    expect(licenseKey("")).toBe("");
  });

  test("handles just digits", () => {
    expect(licenseKey("  12345  ")).toBe("12345");
  });

  test("is case-insensitive", () => {
    expect(licenseKey("ап 99-01")).toBe("ап 99-01");
    expect(licenseKey("АП 99-01")).toBe("ап 99-01");
  });
});

describe("getCol", () => {
  test("finds column by exact name", () => {
    const row = { "Номер лицензии": "НМ 11-02", Объект: "Тест" };
    expect(getCol(row, "Номер лицензии")).toBe("НМ 11-02");
  });

  test("returns first matching candidate", () => {
    const row = { "Номер лицензии": "А", "№ лицензии": "Б" };
    expect(getCol(row, "Номер лицензии", "№ лицензии")).toBe("А");
  });

  test("falls back to second candidate", () => {
    const row = { "№ лицензии": "Б" };
    expect(getCol(row, "Номер лицензии", "№ лицензии")).toBe("Б");
  });

  test("returns empty string for missing column", () => {
    const row = { "Другая колонка": "42" };
    expect(getCol(row, "Номер лицензии")).toBe("");
  });

  test("normalizes whitespace in column names", () => {
    const row = { "Номер  лицензии": "НМ 11-02" };
    expect(getCol(row, "Номер лицензии")).toBe("НМ 11-02");
  });

  test("is case-insensitive for column names", () => {
    const row = { "номер лицензии": "НМ 11-02" };
    expect(getCol(row, "Номер лицензии")).toBe("НМ 11-02");
  });
});
