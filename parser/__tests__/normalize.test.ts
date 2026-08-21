import { test, expect, describe } from "bun:test";
import { normalize } from "../normalize";
import type { RawLicense } from "../types";

function makeRaw(overrides: Partial<RawLicense> = {}): RawLicense {
  return {
    id: "1",
    licenseNumber: "НМ 11-02",
    objectName: "Тестовое месторождение",
    company: "ОсОО Тестовая компания",
    location: "Чуйская область, Аламудунский район",
    licenseValidity: "с 01.01.2020 по 31.12.2025",
    minerals: "золото",
    workType: "П",
    area: "100",
    status: "ВЕ",
    inn: "12345678901234",
    manager: "Иванов И.И.",
    phone: "0555123456",
    country: "Кыргызстан",
    coordX: "",
    coordY: "",
    address: "г. Бишкек, ул. Ленина 1",
    founders: "гр. КР Иванов - 100%",
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

describe("normalize", () => {
  test("produces a complete License from valid RawLicense", () => {
    const raw = makeRaw();
    const license = normalize(raw);

    expect(license.id.value).toBe("1");
    expect(license.licenseNumber.value).toBe("НМ 11-02");
    expect(license.objectName.value).toBe("Тестовое месторождение");
    expect(license.region.value).toBe("Чуйская область");
    expect(license.district.value).toBe("Аламудунский район");
    expect(license.areaHa.value).toBe(100);
    expect(license.status.value.code).toBe("ВЕ");
    expect(license.workType.value).toContain("поисково-оценочные работы");
    expect(license.company.identity.value.orgType).toBe("ОсОО");
    expect(license.company.inn.value).toBe("12345678901234");
    expect(license.sourceYear).toBe(2025);
  });

  test("handles empty coordinates", () => {
    const raw = makeRaw();
    const license = normalize(raw);
    expect(license.polygon.value).toEqual([]);
  });

  test("handles empty beneficiary data", () => {
    const raw = makeRaw();
    const license = normalize(raw);
    expect(license.beneficiaries.value).toEqual([]);
  });

  test("handles annulled status", () => {
    const raw = makeRaw({
      status: "Аннулирована. Протокол № 328 от 23.06.17г.",
    });
    const license = normalize(raw);
    expect(license.status.value.isAnnulled).toBe(true);
    expect(license.status.value.protocol).toBe("328");
  });

  test("handles invalid INN gracefully", () => {
    const raw = makeRaw({ inn: "нет" });
    const license = normalize(raw);
    expect(license.company.inn.value).toBe("");
  });
});
