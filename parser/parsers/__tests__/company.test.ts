import { test, expect, describe } from "bun:test";
import { parseCompany } from "../company";
import type { RawLicense } from "../../types";

function makeRaw(overrides: Partial<RawLicense> = {}): RawLicense {
  return {
    id: "1",
    licenseNumber: "НМ 11-02",
    objectName: "",
    company: "",
    location: "",
    licenseValidity: "",
    minerals: "",
    workType: "",
    area: "",
    status: "",
    inn: "",
    manager: "",
    phone: "",
    country: "",
    coordX: "",
    coordY: "",
    address: "",
    founders: "",
    ayilAymak: "",
    beneficiariesText: "",
    beneficiaryName: "",
    beneficiaryCitizenship: "",
    beneficiaryPosition: "",
    beneficiaryAddress: "",
    beneficiaryShare: "",
    beneficiaryYear: "",
    notes: "",
    sourceYear: 2025,
    ...overrides,
  };
}

describe("parseCompany", () => {
  describe("identity", () => {
    test("extracts org type ОсОО", () => {
      const raw = makeRaw({ company: "ОсОО Кыргызалтын" });
      const result = parseCompany(raw);
      expect(result.identity.value.orgType).toBe("ОсОО");
      expect(result.identity.value.name).toBe("Кыргызалтын");
    });

    test("extracts org type АО", () => {
      const raw = makeRaw({ company: "АО Национальная компания" });
      const result = parseCompany(raw);
      expect(result.identity.value.orgType).toBe("АО");
    });

    test("extracts org type with dot separator", () => {
      const raw = makeRaw({ company: "ОсОО. Кыргызалтын" });
      const result = parseCompany(raw);
      expect(result.identity.value.orgType).toBe("ОсОО");
    });

    test("handles company without org type", () => {
      const raw = makeRaw({ company: "Кыргызалтын" });
      const result = parseCompany(raw);
      expect(result.identity.value.orgType).toBeNull();
      expect(result.identity.value.name).toBe("Кыргызалтын");
    });

    test("handles quoted company names", () => {
      const raw = makeRaw({ company: 'ОсОО "Золотой век"' });
      const result = parseCompany(raw);
      expect(result.identity.value.name).toBe("Золотой век");
    });
  });

  describe("manager", () => {
    test("normalizes manager name with initials", () => {
      const raw = makeRaw({ manager: "Ахунбаев С.М." });
      const result = parseCompany(raw);
      expect(result.manager.value).toBe("Ахунбаев С.М.");
    });

    test("fixes initials before surname", () => {
      const raw = makeRaw({ manager: "С.М.Ахунбаев" });
      const result = parseCompany(raw);
      expect(result.manager.value).toBe("Ахунбаев С.М.");
    });

    test("adds trailing dot to initials", () => {
      const raw = makeRaw({ manager: "Зикиров А.А" });
      const result = parseCompany(raw);
      expect(result.manager.value).toBe("Зикиров А.А.");
    });

    test("removes trailing percentage", () => {
      const raw = makeRaw({ manager: "Иванов И.И. %" });
      const result = parseCompany(raw);
      expect(result.manager.value).toBe("Иванов И.И.");
    });
  });

  describe("full parseCompany", () => {
    test("composes all sub-parsers", () => {
      const raw = makeRaw({
        company: "ОсОО Тестовая компания",
        inn: "ИНН 12345678901234",
        manager: "Иванов И.И.",
        phone: "0555123456",
        address: "г. Бишкек, ул. Ленина 1",
        founders: "Иванов - 100%",
      });
      const result = parseCompany(raw);
      expect(result.identity.value.orgType).toBe("ОсОО");
      expect(result.inn.value).toBe("12345678901234");
      expect(result.manager.value).toBe("Иванов И.И.");
      expect(result.phone.value).toEqual(["0555123456"]);
      expect(result.address.value).toBe("г. Бишкек, ул. Ленина 1");
      expect(result.founders.value).toBe("Иванов - 100%");
    });
  });
});
