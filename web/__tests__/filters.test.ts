import { test, expect, describe } from "bun:test";
import { parseFilters, applyFilters, filtersToQs, buildFilterOptions } from "../filters";
import type { License } from "@shared/types";

function makeLicense(overrides: Partial<License> = {}): License {
  return {
    id: { raw: "1", value: "1" },
    licenseNumber: { raw: "НМ 11-02", value: "НМ 11-02" },
    objectName: { raw: "Тестовое месторождение", value: "Тестовое месторождение" },
    company: {
      identity: { raw: "ОсОО Тест", value: { orgType: "ОсОО", name: "Тест" } },
      inn: { raw: "", value: "" },
      manager: { raw: "", value: "" },
      phone: { raw: "", value: [] },
      country: { raw: "Кыргызстан", value: ["Кыргызстан"] },
      address: { raw: "", value: "" },
      founders: { raw: "", value: "" },
    },
    region: { raw: "Чуйская область", value: "Чуйская область" },
    district: { raw: "", value: "" },
    ayilAymak: { raw: "", value: "" },
    licenseValidity: { raw: "", value: "" },
    minerals: { raw: "", value: [{ name: "золото", type: "золото", group: "металлы" }] },
    workType: { raw: "", value: ["Поисковые работы"] },
    areaHa: { raw: "100", value: 100 },
    status: { raw: "ВЕ", value: { code: "ВЕ", mineralType: null, workStage: null, isAnnulled: false, protocol: null, protocolDate: null } },
    polygon: { raw: { x: "", y: "" }, value: [] },
    beneficiaries: { raw: "", value: [] },
    notes: { raw: "", value: "" },
    sourceYear: 2025,
    ...overrides,
  };
}

describe("parseFilters", () => {
  test("parses empty query string", () => {
    const sp = new URLSearchParams("");
    const filters = parseFilters(sp);
    expect(filters.q).toBe("");
    expect(filters.regions).toEqual([]);
  });

  test("parses search query", () => {
    const sp = new URLSearchParams("q=золото");
    const filters = parseFilters(sp);
    expect(filters.q).toBe("золото");
  });

  test("parses multiple regions", () => {
    const sp = new URLSearchParams("region=Chui&region=Osh");
    const filters = parseFilters(sp);
    expect(filters.regions).toEqual(["Chui", "Osh"]);
  });

  test("parses area range", () => {
    const sp = new URLSearchParams("areaMin=10&areaMax=100");
    const filters = parseFilters(sp);
    expect(filters.areaMin).toBe("10");
    expect(filters.areaMax).toBe("100");
  });

  test("parses status", () => {
    const sp = new URLSearchParams("status=active");
    const filters = parseFilters(sp);
    expect(filters.status).toBe("active");
  });
});

describe("applyFilters", () => {
  test("returns all licenses with empty filters", () => {
    const licenses = [makeLicense(), makeLicense({ id: { raw: "2", value: "2" } })];
    const filters = parseFilters(new URLSearchParams(""));
    expect(applyFilters(licenses, filters).length).toBe(2);
  });

  test("filters by search query on license number", () => {
    const l1 = makeLicense({ licenseNumber: { raw: "АП 99-01", value: "АП 99-01" } });
    const l2 = makeLicense({ id: { raw: "2", value: "2" }, licenseNumber: { raw: "НМ 11-02", value: "НМ 11-02" } });
    const filters = parseFilters(new URLSearchParams("q=АП"));
    expect(applyFilters([l1, l2], filters).length).toBe(1);
  });

  test("filters by search query on object name", () => {
    const l1 = makeLicense({ objectName: { raw: "Золотое", value: "Золотое" } });
    const l2 = makeLicense({ id: { raw: "2", value: "2" }, objectName: { raw: "Медное", value: "Медное" } });
    const filters = parseFilters(new URLSearchParams("q=золото"));
    expect(applyFilters([l1, l2], filters).length).toBe(1);
  });

  test("filters by search query on company name", () => {
    const l1 = makeLicense({
      company: {
        identity: { raw: "", value: { orgType: "ОсОО", name: "Золоторудная" } },
        inn: { raw: "", value: "" },
        manager: { raw: "", value: "" },
        phone: { raw: "", value: [] },
        country: { raw: "", value: [] },
        address: { raw: "", value: "" },
        founders: { raw: "", value: "" },
      },
    });
    const filters = parseFilters(new URLSearchParams("q=Золоторудная"));
    expect(applyFilters([l1], filters).length).toBe(1);
  });

  test("filters active licenses", () => {
    const active = makeLicense();
    const annulled = makeLicense({
      id: { raw: "2", value: "2" },
      status: {
        raw: "Аннулирована",
        value: { code: null, mineralType: null, workStage: null, isAnnulled: true, protocol: null, protocolDate: null },
      },
    });
    const filters = parseFilters(new URLSearchParams("status=active"));
    expect(applyFilters([active, annulled], filters).length).toBe(1);
  });

  test("filters annulled licenses", () => {
    const active = makeLicense();
    const annulled = makeLicense({
      id: { raw: "2", value: "2" },
      status: {
        raw: "Аннулирована",
        value: { code: null, mineralType: null, workStage: null, isAnnulled: true, protocol: null, protocolDate: null },
      },
    });
    const filters = parseFilters(new URLSearchParams("status=annulled"));
    expect(applyFilters([active, annulled], filters).length).toBe(1);
  });

  test("filters by region", () => {
    const chui = makeLicense();
    const osh = makeLicense({
      id: { raw: "2", value: "2" },
      region: { raw: "Ошская область", value: "Ошская область" },
    });
    const filters = parseFilters(new URLSearchParams("region=Чуйская+область"));
    expect(applyFilters([chui, osh], filters).length).toBe(1);
  });

  test("filters by area range", () => {
    const small = makeLicense({ areaHa: { raw: "10", value: 10 } });
    const large = makeLicense({ id: { raw: "2", value: "2" }, areaHa: { raw: "500", value: 500 } });
    const filters = parseFilters(new URLSearchParams("areaMin=50&areaMax=1000"));
    const result = applyFilters([small, large], filters);
    expect(result.length).toBe(1);
    expect(result[0]!.areaHa.value).toBe(500);
  });

  test("filters by mineral type", () => {
    const gold = makeLicense();
    const copper = makeLicense({
      id: { raw: "2", value: "2" },
      minerals: { raw: "", value: [{ name: "медь", type: "медь", group: "металлы" }] },
    });
    const filters = parseFilters(new URLSearchParams("mineralType=золото"));
    expect(applyFilters([gold, copper], filters).length).toBe(1);
  });
});

describe("filtersToQs", () => {
  test("generates query string from URLSearchParams", () => {
    const sp = new URLSearchParams("region=Chui&region=Osh&page=1");
    const qs = filtersToQs(sp);
    expect(qs).not.toContain("page");
    expect(qs).toContain("region");
  });

  test("handles empty params", () => {
    const sp = new URLSearchParams("");
    expect(filtersToQs(sp)).toBe("");
  });
});

describe("buildFilterOptions", () => {
  test("builds region options", () => {
    const licenses = [makeLicense()];
    const options = buildFilterOptions(licenses);
    expect(options.regions.length).toBe(1);
    expect(options.regions[0]!.value).toBe("Чуйская область");
    expect(options.regions[0]!.count).toBe(1);
  });

  test("builds mineral type options", () => {
    const licenses = [makeLicense()];
    const options = buildFilterOptions(licenses);
    expect(options.mineralTypes.length).toBeGreaterThanOrEqual(1);
  });

  test("builds work type options", () => {
    const licenses = [makeLicense()];
    const options = buildFilterOptions(licenses);
    expect(options.workTypes.length).toBe(1);
  });
});
