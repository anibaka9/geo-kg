import { test, expect, describe } from "bun:test";
import { parseBeneficiaries } from "../beneficiaries";
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

describe("parseBeneficiaries", () => {
  test("returns empty array for 2025 data", () => {
    const raw = makeRaw({ sourceYear: 2025, beneficiaryName: "Иванов Иван" });
    const result = parseBeneficiaries(raw);
    expect(result.value).toEqual([]);
  });

  test("returns empty array for 2026 data with empty name", () => {
    const raw = makeRaw({ sourceYear: 2026, beneficiaryName: "" });
    const result = parseBeneficiaries(raw);
    expect(result.value).toEqual([]);
  });

  test("parses beneficiary from 2026 data with name", () => {
    const raw = makeRaw({
      sourceYear: 2026,
      beneficiaryName: "Иванов Иван",
      beneficiaryCitizenship: "Кыргызстан",
      beneficiaryPosition: "Директор",
      beneficiaryAddress: "г. Бишкек",
      beneficiaryShare: "100%",
      beneficiaryYear: "2026",
    });
    const result = parseBeneficiaries(raw);
    expect(result.value.length).toBe(1);
    expect(result.value[0]!.name.value).toBe("Иванов Иван");
    expect(result.value[0]!.citizenship.value).toBe("Кыргызстан");
  });
});
