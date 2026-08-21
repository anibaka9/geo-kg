import { test, expect, describe } from "bun:test";
import { parseStatus } from "../status";

describe("parseStatus", () => {
  test("parses status code ВЕ", () => {
    const result = parseStatus("ВЕ");
    expect(result.value.code).toBe("ВЕ");
    expect(result.value.isAnnulled).toBe(false);
  });

  test("parses status code with suffix АЕ/Р", () => {
    const result = parseStatus("АЕ/Р");
    expect(result.value.code).toBe("АЕ/Р");
    expect(result.value.isAnnulled).toBe(false);
  });

  test("detects annulment by Ан prefix", () => {
    const result = parseStatus("Аннулирована");
    expect(result.value.isAnnulled).toBe(true);
  });

  test("detects annulment with protocol", () => {
    const result = parseStatus("Аннулирована. Протокол № 328-Н-17 от 23.06.17г.");
    expect(result.value.isAnnulled).toBe(true);
    expect(result.value.protocol).toBe("328-Н-17");
    expect(result.value.protocolDate).toBe("23.06.17");
  });

  test("detects ан in any case", () => {
    const result = parseStatus("аннулирована");
    expect(result.value.isAnnulled).toBe(true);
  });

  test("detects annulment with перечень анн", () => {
    const result = parseStatus("Перечень аннулированных 2022");
    expect(result.value.isAnnulled).toBe(true);
  });

  test("handles empty string", () => {
    const result = parseStatus("");
    expect(result.value.code).toBeNull();
    expect(result.value.isAnnulled).toBe(false);
  });

  test("stores unknown text as code", () => {
    const result = parseStatus("какой-то текст");
    expect(result.value.code).toBe("какой-то текст");
    expect(result.value.isAnnulled).toBe(false);
  });
});
