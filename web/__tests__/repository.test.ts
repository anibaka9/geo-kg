import { test, expect, describe, afterAll } from "bun:test";
import { Database } from "bun:sqlite";
import { existsSync, unlinkSync } from "node:fs";
import type { License } from "@shared/types";
import { buildDatabase } from "../../db/write";
import { Repository, buildWhere } from "../repository";
import { parseFilters } from "../filters";

const DB_PATH = "/tmp/geo-kg-repository-test.db";

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
    status: {
      raw: "ВЕ",
      value: {
        code: "ВЕ",
        mineralType: null,
        workStage: null,
        isAnnulled: false,
        protocol: null,
        protocolDate: null,
      },
    },
    polygon: { raw: { x: "", y: "" }, value: [] },
    beneficiaries: { raw: "", value: [] },
    notes: { raw: "", value: "" },
    sourceYear: 2025,
    ...overrides,
  };
}

describe("buildWhere", () => {
  test("empty filters match everything", () => {
    const where = buildWhere(parseFilters(new URLSearchParams("")));
    expect(where.sql).toBe("1=1");
    expect(where.params).toEqual([]);
  });

  test("q >= 3 chars uses the FTS trigram index, phrase-quoted", () => {
    const where = buildWhere(parseFilters(new URLSearchParams("q=золото")));
    expect(where.sql).toContain("licenses_fts");
    expect(where.params).toEqual(['"золото"']);
  });

  test("q < 3 chars falls back to a LIKE scan on search_lower", () => {
    const where = buildWhere(parseFilters(new URLSearchParams("q=Зо")));
    expect(where.sql).toContain("search_lower LIKE");
    expect(where.params).toEqual(["%зо%"]);
  });

  test("status active/annulled map to is_annulled", () => {
    const activeFilters = parseFilters(new URLSearchParams("status=active"));
    const annulledFilters = parseFilters(new URLSearchParams("status=annulled"));
    expect(buildWhere(activeFilters).sql).toContain("is_annulled = 0");
    expect(buildWhere(annulledFilters).sql).toContain("is_annulled = 1");
  });

  test("multi-select region/year use IN with bound params", () => {
    const where = buildWhere(parseFilters(new URLSearchParams("region=Chui&region=Osh")));
    expect(where.sql).toContain("region IN (?, ?)");
    expect(where.params).toEqual(["Chui", "Osh"]);

    const yearsWhere = buildWhere(parseFilters(new URLSearchParams("year=2025&year=2026")));
    expect(yearsWhere.params).toEqual([2025, 2026]);
  });

  test("workType/mineralType/country use EXISTS against join tables", () => {
    const where = buildWhere(parseFilters(new URLSearchParams("mineralType=золото")));
    expect(where.sql).toContain("EXISTS");
    expect(where.sql).toContain("license_minerals");
    expect(where.params).toEqual(["золото"]);
  });

  test("an unparsable area bound excludes every row, not just out-of-range ones", () => {
    const where = buildWhere(parseFilters(new URLSearchParams("areaMin=not-a-number")));
    expect(where.sql).toContain("(0)");
  });

  test("a valid area bound requires area_ha to be non-null", () => {
    const where = buildWhere(parseFilters(new URLSearchParams("areaMin=50&areaMax=1000")));
    expect(where.sql).toContain("area_ha IS NOT NULL AND area_ha >= ?");
    expect(where.sql).toContain("area_ha IS NOT NULL AND area_ha <= ?");
    expect(where.params).toEqual([50, 1000]);
  });
});

function seed(licenses: License[]): Repository {
  buildDatabase(licenses, DB_PATH);
  return new Repository(new Database(DB_PATH, { readonly: true }));
}

afterAll(() => {
  for (const suffix of ["", "-wal", "-shm"]) {
    const p = DB_PATH + suffix;
    if (existsSync(p)) unlinkSync(p);
  }
});

describe("Repository", () => {
  test("returns all licenses with empty filters", () => {
    const repo = seed([makeLicense(), makeLicense({ id: { raw: "2", value: "2" } })]);
    const filters = parseFilters(new URLSearchParams(""));
    expect(repo.countLicenses(filters)).toBe(2);
    expect(repo.listLicenses(filters, 0, 25)).toHaveLength(2);
  });

  test("filters by search query on license number", () => {
    const l1 = makeLicense({ licenseNumber: { raw: "АП 99-01", value: "АП 99-01" } });
    const l2 = makeLicense({
      id: { raw: "2", value: "2" },
      licenseNumber: { raw: "НМ 11-02", value: "НМ 11-02" },
    });
    const repo = seed([l1, l2]);
    const filters = parseFilters(new URLSearchParams("q=АП"));
    expect(repo.countLicenses(filters)).toBe(1);
  });

  test("filters by search query on object name", () => {
    const l1 = makeLicense({ objectName: { raw: "Золотое", value: "Золотое" } });
    const l2 = makeLicense({
      id: { raw: "2", value: "2" },
      objectName: { raw: "Медное", value: "Медное" },
    });
    const repo = seed([l1, l2]);
    const filters = parseFilters(new URLSearchParams("q=золото"));
    expect(repo.countLicenses(filters)).toBe(1);
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
    const repo = seed([l1]);
    const filters = parseFilters(new URLSearchParams("q=Золоторудная"));
    expect(repo.countLicenses(filters)).toBe(1);
  });

  test("short (< 3 char) query still matches via the LIKE fallback", () => {
    const l1 = makeLicense({ objectName: { raw: "Золотое", value: "Золотое" } });
    const l2 = makeLicense({
      id: { raw: "2", value: "2" },
      objectName: { raw: "Медное", value: "Медное" },
    });
    const repo = seed([l1, l2]);
    const filters = parseFilters(new URLSearchParams("q=зо"));
    expect(repo.countLicenses(filters)).toBe(1);
  });

  test("filters active vs annulled licenses", () => {
    const active = makeLicense();
    const annulled = makeLicense({
      id: { raw: "2", value: "2" },
      status: {
        raw: "Аннулирована",
        value: {
          code: null,
          mineralType: null,
          workStage: null,
          isAnnulled: true,
          protocol: null,
          protocolDate: null,
        },
      },
    });
    const repo = seed([active, annulled]);
    const activeFilters = parseFilters(new URLSearchParams("status=active"));
    const annulledFilters = parseFilters(new URLSearchParams("status=annulled"));
    expect(repo.countLicenses(activeFilters)).toBe(1);
    expect(repo.countLicenses(annulledFilters)).toBe(1);
  });

  test("filters by region", () => {
    const chui = makeLicense();
    const osh = makeLicense({
      id: { raw: "2", value: "2" },
      region: { raw: "Ошская область", value: "Ошская область" },
    });
    const repo = seed([chui, osh]);
    const filters = parseFilters(new URLSearchParams("region=Чуйская+область"));
    expect(repo.countLicenses(filters)).toBe(1);
  });

  test("filters by area range", () => {
    const small = makeLicense({ areaHa: { raw: "10", value: 10 } });
    const large = makeLicense({
      id: { raw: "2", value: "2" },
      areaHa: { raw: "500", value: 500 },
    });
    const repo = seed([small, large]);
    const filters = parseFilters(new URLSearchParams("areaMin=50&areaMax=1000"));
    const result = repo.listLicenses(filters, 0, 25);
    expect(result).toHaveLength(1);
    expect(result[0]!.areaHa.value).toBe(500);
  });

  test("filters by mineral type", () => {
    const gold = makeLicense();
    const copper = makeLicense({
      id: { raw: "2", value: "2" },
      minerals: { raw: "", value: [{ name: "медь", type: "медь", group: "металлы" }] },
    });
    const repo = seed([gold, copper]);
    const filters = parseFilters(new URLSearchParams("mineralType=золото"));
    expect(repo.countLicenses(filters)).toBe(1);
  });

  test("getLicenseById replicates last-insertion-wins for duplicate id values", () => {
    const first = makeLicense({
      id: { raw: "7", value: "7" },
      objectName: { raw: "Первое", value: "Первое" },
    });
    const second = makeLicense({
      id: { raw: "7", value: "7" },
      objectName: { raw: "Второе", value: "Второе" },
    });
    const repo = seed([first, second]);
    expect(repo.getLicenseById("7")?.objectName.value).toBe("Второе");
  });

  test("getLicenseById returns null for unknown id", () => {
    const repo = seed([makeLicense()]);
    expect(repo.getLicenseById("does-not-exist")).toBeNull();
  });

  test("getFilterOptions builds region/mineral/work type option counts", () => {
    const repo = seed([makeLicense()]);
    const options = repo.getFilterOptions();
    expect(options.regions).toEqual([{ value: "Чуйская область", count: 1 }]);
    expect(options.mineralTypes.length).toBeGreaterThanOrEqual(1);
    expect(options.workTypes).toEqual([{ value: "Поисковые работы", count: 1 }]);
  });

  test("geojsonBody returns a FeatureCollection restricted to licenses with a polygon", () => {
    const withPolygon = makeLicense({
      polygon: {
        raw: { x: "42.5,42.6,42.5", y: "74.5,74.6,74.7" },
        value: [
          [42.5, 74.5],
          [42.6, 74.6],
          [42.5, 74.7],
        ],
      },
    });
    const withoutPolygon = makeLicense({ id: { raw: "2", value: "2" } });
    const repo = seed([withPolygon, withoutPolygon]);
    const noFilters = parseFilters(new URLSearchParams(""));
    const body = JSON.parse(repo.geojsonBody(noFilters));
    expect(body.type).toBe("FeatureCollection");
    expect(body.features).toHaveLength(1);
  });
});
