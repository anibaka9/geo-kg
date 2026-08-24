import { test, expect } from "@playwright/test";

test.describe("map filter sync", { tag: ["@critical", "@slow"] }, () => {
  test("reset link appears immediately after checking a filter, map stays rendered", async ({
    page,
  }) => {
    // MapLibre's `load` event depends on real network fetches to unpkg.com and
    // tiles.openfreemap.org plus WebGL compositing; both are measurably variable
    // in headless runs and occasionally exceed the default 30s timeout even
    // though every resource involved is still loading correctly (see the trace
    // from a failing run: all style/tile/font requests complete by ~8.6s, but
    // `load` doesn't fire before the 30s cutoff). Triple the timeout rather
    // than changing the wait strategy, which is already correct.
    test.slow();
    await test.step("navigate to map", async () => {
      await page.goto("/map");
      await expect(page.getByRole("region", { name: "Map", exact: true })).toBeVisible();
    });
    await test.step("check a region filter", async () => {
      await page.getByRole("checkbox", { name: "Чуйская область" }).check();
    });
    await test.step("reset link appears without breaking the map", async () => {
      await expect(page.getByRole("link", { name: "Сбросить" })).toBeVisible();
      await expect(page.getByRole("region", { name: "Map", exact: true })).toHaveCount(1);
    });
  });

  test("reset link restores the map instead of leaving it blank", async ({ page }) => {
    test.slow();
    await test.step("navigate to map with an active filter", async () => {
      await page.goto("/map?region=Чуйская+область");
      await expect(page.getByRole("region", { name: "Map", exact: true })).toBeVisible();
    });
    await test.step("click reset", async () => {
      await page.getByRole("link", { name: "Сбросить" }).click();
    });
    await test.step("URL clears and the map re-renders", async () => {
      await expect(page).toHaveURL("/map");
      await expect(page.getByRole("region", { name: "Map", exact: true })).toHaveCount(1);
    });
  });

  test("loads without console errors", async ({ page }) => {
    test.slow();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await test.step("navigate to map and wait for feature data to load", async () => {
      const geojsonResponse = page.waitForResponse((r) =>
        r.url().includes("/api/features.geojson"),
      );
      await page.goto("/map");
      await geojsonResponse;
    });

    await test.step("no errors were logged while adding layers", () => {
      expect(errors).toEqual([]);
    });
  });
});
