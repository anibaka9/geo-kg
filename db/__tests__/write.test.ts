import { test, expect, describe, afterAll } from "bun:test";
import { Database } from "bun:sqlite";
import { existsSync, unlinkSync } from "node:fs";
import type { License } from "@shared/types";
import { buildDatabase } from "../write";
import { hydrate, type LicenseRow } from "../rows";

const DB_PATH = "/tmp/geo-kg-write-test.db";

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

afterAll(() => {
  for (const suffix of ["", "-wal", "-shm"]) {
    const p = DB_PATH + suffix;
    if (existsSync(p)) unlinkSync(p);
  }
});

describe("buildDatabase", () => {
  test("round-trips License objects through doc column byte-for-byte", () => {
    const licenses = [
      makeLicense({ id: { raw: "1", value: "1" } }),
      makeLicense({
        id: { raw: "2", value: "2" },
        polygon: {
          raw: { x: "42.5,42.6,42.5", y: "74.5,74.6,74.7" },
          value: [
            [42.5, 74.5],
            [42.6, 74.6],
            [42.5, 74.7],
          ],
        },
        areaHa: { raw: "", value: null },
      }),
    ];

    buildDatabase(licenses, DB_PATH);
    const db = new Database(DB_PATH, { readonly: true });
    const rows = db.query("SELECT doc FROM licenses ORDER BY ord").all() as Pick<
      LicenseRow,
      "doc"
    >[];

    expect(rows).toHaveLength(licenses.length);
    rows.forEach((row, i) => {
      expect(hydrate(row)).toEqual(licenses[i]!);
    });
    db.close();
  });

  test("sets schema version via PRAGMA user_version", () => {
    buildDatabase([makeLicense()], DB_PATH);
    const db = new Database(DB_PATH, { readonly: true });
    const { user_version } = db.query("PRAGMA user_version").get() as {
      user_version: number;
    };
    expect(user_version).toBeGreaterThan(0);
    db.close();
  });

  test("populates join tables and FTS index", () => {
    buildDatabase(
      [
        makeLicense({
          minerals: { raw: "", value: [{ name: "медь", type: "медь", group: "металлы" }] },
          workType: { raw: "", value: ["Разведка"] },
        }),
      ],
      DB_PATH,
    );
    const db = new Database(DB_PATH, { readonly: true });
    expect(db.query("SELECT * FROM license_minerals").all()).toHaveLength(1);
    expect(db.query("SELECT * FROM license_work_types").all()).toHaveLength(1);
    expect(db.query("SELECT * FROM license_countries").all()).toHaveLength(1);
    expect(
      db.query("SELECT ord FROM licenses_fts WHERE licenses_fts MATCH ?").all("Тестов"),
    ).toHaveLength(1);
    db.close();
  });

  test("resets an existing database file rather than appending", () => {
    buildDatabase([makeLicense()], DB_PATH);
    buildDatabase([makeLicense(), makeLicense({ id: { raw: "2", value: "2" } })], DB_PATH);
    const db = new Database(DB_PATH, { readonly: true });
    expect(db.query("SELECT COUNT(*) as n FROM licenses").get()).toEqual({ n: 2 });
    db.close();
  });
});
