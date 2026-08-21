import { test, expect, describe } from "bun:test";
import { toGeoJsonFeatures } from "../geojson";
import type { License } from "@shared/types";

function makeLicense(overrides: Partial<License> = {}): License {
  return {
    id: { raw: "1", value: "1" },
    licenseNumber: { raw: "НМ 11-02", value: "НМ 11-02" },
    objectName: { raw: "Тестовое месторождение", value: "Тестовое месторождение" },
    company: {
      identity: { raw: "", value: { orgType: null, name: "" } },
      inn: { raw: "", value: "" },
      manager: { raw: "", value: "" },
      phone: { raw: "", value: [] },
      country: { raw: "", value: [] },
      address: { raw: "", value: "" },
      founders: { raw: "", value: "" },
    },
    region: { raw: "", value: "" },
    district: { raw: "", value: "" },
    ayilAymak: { raw: "", value: "" },
    licenseValidity: { raw: "", value: "" },
    minerals: { raw: "", value: [{ name: "золото", type: "золото", group: "металлы" }] },
    workType: { raw: "", value: [] },
    areaHa: { raw: "", value: null },
    status: { raw: "", value: { code: null, mineralType: null, workStage: null, isAnnulled: false, protocol: null, protocolDate: null } },
    polygon: { raw: { x: "", y: "" }, value: [] },
    beneficiaries: { raw: "", value: [] },
    notes: { raw: "", value: "" },
    sourceYear: 2025,
    ...overrides,
  };
}

describe("toGeoJsonFeatures", () => {
  test("filters out licenses without coordinates", () => {
    const license = makeLicense();
    expect(toGeoJsonFeatures([license])).toEqual([]);
  });

  test("produces Point for single coordinate", () => {
    const license = makeLicense({
      polygon: { raw: { x: "", y: "" }, value: [[42.5, 74.5]] },
    });
    const features = toGeoJsonFeatures([license]);
    expect(features.length).toBe(1);
    expect(features[0]!.geometry.type).toBe("Point");
    expect(features[0]!.geometry.coordinates).toEqual([74.5, 42.5]);
  });

  test("produces Point for borehole water license", () => {
    const license = makeLicense({
      minerals: { raw: "", value: [{ name: "вода", type: "подземные воды", group: "вода" }] },
      objectName: { raw: "скв 123", value: "скв 123" },
      polygon: { raw: { x: "", y: "" }, value: [[42.5, 74.5], [42.6, 74.6]] },
    });
    const features = toGeoJsonFeatures([license]);
    expect(features.length).toBe(1);
    expect(features[0]!.geometry.type).toBe("Point");
  });

  test("produces Polygon for 3+ coordinates", () => {
    const license = makeLicense({
      polygon: {
        raw: { x: "", y: "" },
        value: [
          [42.5, 74.5],
          [42.6, 74.5],
          [42.6, 74.6],
        ],
      },
    });
    const features = toGeoJsonFeatures([license]);
    expect(features.length).toBe(1);
    expect(features[0]!.geometry.type).toBe("Polygon");
    // Should be GeoJSON order: [lon, lat]
    const ring = (features[0]!.geometry as { coordinates: number[][][] }).coordinates[0]!;
    expect(ring[0]![0]).toBe(74.5);
    expect(ring[0]![1]).toBe(42.5);
  });

  test("closes polygon ring", () => {
    const license = makeLicense({
      polygon: {
        raw: { x: "", y: "" },
        value: [
          [42.5, 74.5],
          [42.6, 74.5],
          [42.6, 74.6],
        ],
      },
    });
    const features = toGeoJsonFeatures([license]);
    const ring = (features[0]!.geometry as { coordinates: number[][][] }).coordinates[0]!;
    expect(ring.at(0)).toEqual(ring.at(-1));
  });

  test("includes properties", () => {
    const license = makeLicense({
      licenseNumber: { raw: "НМ 11-02", value: "НМ 11-02" },
      objectName: { raw: "Тест", value: "Тест" },
      status: {
        raw: "",
        value: { code: null, mineralType: null, workStage: null, isAnnulled: true, protocol: null, protocolDate: null },
      },
      polygon: { raw: { x: "", y: "" }, value: [[42.5, 74.5]] },
    });
    const features = toGeoJsonFeatures([license]);
    const props = features[0]!.properties;
    expect(props.id).toBe("1");
    expect(props.licenseNumber).toBe("НМ 11-02");
    expect(props.objectName).toBe("Тест");
    expect(props.isAnnulled).toBe(true);
    expect(props.mineralGroup).toBe("металлы");
  });

  test("handles null mineral group fallback", () => {
    const license = makeLicense({
      minerals: { raw: "", value: [] },
      polygon: { raw: { x: "", y: "" }, value: [[42.5, 74.5]] },
    });
    const features = toGeoJsonFeatures([license]);
    expect(features[0]!.properties.mineralGroup).toBe("прочее");
  });
});
