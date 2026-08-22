import { test, expect, describe } from "bun:test";
import { parseFilters, filtersToQs } from "../filters";

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
