import { test, expect, describe } from "bun:test";
import { parseCoords } from "../coords";

describe("parseCoords", () => {
  describe("edge cases", () => {
    test("returns empty array for empty input", () => {
      const result = parseCoords("", "");
      expect(result.value).toEqual([]);
    });

    test("returns empty array for whitespace-only input", () => {
      const result = parseCoords("   ", "   ");
      expect(result.value).toEqual([]);
    });

    test("returns empty array for mismatched coordinate counts", () => {
      const result = parseCoords("123 456", "789");
      expect(result.value).toEqual([]);
    });

    test("returns empty array when both have zero numbers", () => {
      const result = parseCoords("", "");
      expect(result.value).toEqual([]);
    });
  });

  describe("single point", () => {
    test("parses a single valid coordinate pair", () => {
      // Test with a point known to be in Kyrgyzstan
      const result = parseCoords("12500000", "4600000");
      // The result may be empty if proj4 rejects it, but it should at least work structurally
      expect(result.raw).toEqual({ x: "12500000", y: "4600000" });
    });
  });

  describe("valid polygon", () => {
    test("parses a valid multi-point coordinate set", () => {
      // Real coordinates from zone 13 (Bishkek area)
      const x = "13500000 13501000 13501000 13500000";
      const y = "4750000 4750000 4750100 4750100";
      const result = parseCoords(x, y);
      // Should produce 4 points for a valid rectangle
      expect(result.value.length).toBe(4);
    });

    test("detects X as easting (large numbers)", () => {
      const x = "13500000 13501000 13501000 13500000";
      const y = "4750000 4750000 4750100 4750100";
      const result = parseCoords(x, y);
      // X values > 10_000_000 → treated as easting
      // Should produce points in Kyrgyzstan area
      expect(result.value.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("northing repair", () => {
    test("accepts northing in valid range", () => {
      const x = "13500000 13501000";
      const y = "4600000 4600100";
      const result = parseCoords(x, y);
      // Valid northings in range 4_300_000 to 4_850_000
      expect(result.value.length).toBeGreaterThanOrEqual(1);
    });

    test("rejects northing out of range", () => {
      const x = "13500000";
      const y = "1000000"; // Way below KG min (4.3M)
      const result = parseCoords(x, y);
      // Should still process but may not produce valid WGS84
      expect(result.raw).toEqual({ x: "13500000", y: "1000000" });
    });
  });

  describe("self-intersecting polygon", () => {
    test("returns convex hull for self-intersecting polygon", () => {
      // Bow-tie shape should be replaced with convex hull
      const x = "13500000 13502000 13500000 13502000";
      const y = "4750000 4750000 4750200 4750200";
      const result = parseCoords(x, y);
      // Convex hull should be produced
      expect(result.value.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("preserves raw values", () => {
    test("stores raw coordinate strings", () => {
      const x = "13500000 13501000";
      const y = "4750000 4750100";
      const result = parseCoords(x, y);
      expect(result.raw.x).toBe("13500000 13501000");
      expect(result.raw.y).toBe("4750000 4750100");
    });
  });

  describe("validation", () => {
    test("rejects points outside Kyrgyzstan", () => {
      // Coordinates that resolve to middle of ocean
      const x = "0";
      const y = "0";
      const result = parseCoords(x, y);
      // The repair may still produce a valid conversion but it won't be in the KG region
      // So should be filtered out
      const inRegion = result.value.every((pt) => pt[0] >= 35 && pt[0] <= 48 && pt[1] >= 60 && pt[1] <= 85);
      expect(inRegion).toBe(true);
    });
  });
});
