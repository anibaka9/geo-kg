import { test, expect } from "@playwright/test";

test.describe("license detail page", { tag: ["@critical"] }, () => {
  test("displays license fields", async ({ page }) => {
    await test.step("navigate to license detail", async () => {
      await page.goto("/license/2");
    });
    await test.step("verify license number visible", async () => {
      await expect(page.getByRole("heading").first()).toContainText(/Месторождение/u);
    });
    await test.step("verify license number in details", async () => {
      await expect(page.getByText("НМ 101-02").first()).toBeVisible();
    });
  });

  test("displays company info", async ({ page }) => {
    await test.step("navigate to license detail", async () => {
      await page.goto("/license/2");
    });
    await test.step("verify company section visible", async () => {
      await expect(page.getByRole("heading", { name: "Компания" })).toBeVisible();
    });
  });

  test("displays mineral badges", async ({ page }) => {
    await test.step("navigate to license detail", async () => {
      await page.goto("/license/2");
    });
    await test.step("verify mineral section visible", async () => {
      const pageText = await page.locator("body").textContent();
      expect(pageText).toMatch(/цветные металлы|медь|металлы/u);
    });
  });

  test("displays status code", async ({ page }) => {
    await test.step("navigate to active license", async () => {
      await page.goto("/license/2");
    });
    await test.step("verify status label visible", async () => {
      await expect(page.getByText("Статус")).toBeVisible();
    });
  });

  test("displays annulled status", async ({ page }) => {
    await test.step("navigate to annulled license", async () => {
      await page.goto("/license/1");
    });
    await test.step("verify annulment text visible", async () => {
      const text = await page.locator("body").textContent();
      expect(text).toContain("Аннул");
    });
  });

  test("shows 404 for non-existent license", async ({ page }) => {
    await test.step("navigate to invalid id", async () => {
      await page.goto("/license/99999");
    });
    await test.step("verify 404 message", async () => {
      await expect(page.getByText(/Лицензия не найдена/u)).toBeVisible();
    });
  });

  test("displays area value", async ({ page }) => {
    await test.step("navigate to license", async () => {
      await page.goto("/license/22");
    });
    await test.step("verify area label visible", async () => {
      await expect(page.getByText("Площадь, га")).toBeVisible();
    });
  });

  test("handles null area gracefully", async ({ page }) => {
    await test.step("navigate to license with null area", async () => {
      await page.goto("/license/26");
    });
    await test.step("verify page loads without error", async () => {
      await expect(page.getByRole("heading").first()).toBeVisible();
    });
  });
});

test.describe("map page", { tag: ["@critical"] }, () => {
  test("renders map page", async ({ page }) => {
    await test.step("navigate to map", async () => {
      await page.goto("/map");
    });
    await test.step("verify page title", async () => {
      await expect(page).toHaveTitle(/Карта лицензий КР/u);
    });
    await test.step("verify filter form present", async () => {
      await expect(page.getByRole("form", { name: "Фильтры" })).toBeVisible();
    });
  });
});

test.describe("GeoJSON API", { tag: ["@critical"] }, () => {
  test("returns valid GeoJSON FeatureCollection", async ({ request }) => {
    const response = await request.get("/api/features.geojson");
    expect(response.ok()).toBe(true);
    const body: Record<string, unknown> = await response.json();
    expect(body["type"]).toBe("FeatureCollection");
    expect(Array.isArray(body["features"])).toBe(true);
  });

  test("respects region filter", async ({ request }) => {
    const allRes = await request.get("/api/features.geojson");
    const all = (await allRes.json()) as Record<string, unknown>;
    const filteredRes = await request.get("/api/features.geojson?region=Чуйская+область");
    const filtered = (await filteredRes.json()) as Record<string, unknown>;
    const filteredArr = filtered["features"] as unknown[];
    const allArr = all["features"] as unknown[];
    expect(filteredArr.length).toBeLessThan(allArr.length);
  });

  test("each feature has required properties", async ({ request }) => {
    const response = await request.get("/api/features.geojson");
    const body = (await response.json()) as Record<string, unknown>;
    const features = body["features"] as Record<string, unknown>[];
    expect(features.length).toBeGreaterThan(0);
    for (const feature of features.slice(0, 5)) {
      expect(feature["type"]).toBe("Feature");
      expect(feature["geometry"]).toBeDefined();
      const props = feature["properties"] as Record<string, unknown>;
      expect(props["id"]).toBeDefined();
      expect(props["licenseNumber"]).toBeDefined();
    }
  });
});

test.describe("license fragment API", { tag: ["@critical"] }, () => {
  test("returns HTML fragment for valid license", async ({ request }) => {
    const response = await request.get("/api/license/2/fragment");
    expect(response.ok()).toBe(true);
    const html = await response.text();
    expect(html).toContain("НМ 101-02");
  });

  test("returns 404 for non-existent license", async ({ request }) => {
    const response = await request.get("/api/license/99999/fragment");
    expect(response.status()).toBe(404);
  });
});
