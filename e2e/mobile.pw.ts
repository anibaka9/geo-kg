import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 375, height: 667 } });

test.describe("mobile home page", { tag: ["@critical"] }, () => {
  test("filter panel is collapsed behind a toggle by default", async ({ page }) => {
    await test.step("navigate to home page", async () => {
      await page.goto("/");
    });
    await test.step("filter checkboxes are not visible until toggled", async () => {
      await expect(page.getByRole("checkbox", { name: "Чуйская область" })).toBeHidden();
    });
    await test.step("toggle button reveals the filter panel", async () => {
      await page.getByRole("button", { name: "Фильтры" }).click();
      await expect(page.getByRole("checkbox", { name: "Чуйская область" })).toBeVisible();
    });
  });

  test("secondary table columns are hidden, key columns stay visible", async ({ page }) => {
    await test.step("navigate to home page", async () => {
      await page.goto("/");
    });
    await test.step("key columns are visible", async () => {
      await expect(page.getByRole("columnheader", { name: "Номер лицензии" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Объект" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Статус" })).toBeVisible();
    });
    await test.step("secondary columns are hidden on narrow viewport", async () => {
      await expect(page.getByRole("columnheader", { name: "Компания" })).toBeHidden();
      await expect(page.getByRole("columnheader", { name: "Регион" })).toBeHidden();
      await expect(page.getByRole("columnheader", { name: "Га" })).toBeHidden();
    });
  });

  test("no horizontal overflow on the page", async ({ page }) => {
    await test.step("navigate to home page", async () => {
      await page.goto("/");
    });
    await test.step("open filters and verify no horizontal scroll", async () => {
      await page.getByRole("button", { name: "Фильтры" }).click();
      await expect(page.getByRole("checkbox", { name: "Чуйская область" })).toBeVisible();
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
  });

  test("clicking a license row still navigates to detail page", async ({ page }) => {
    await test.step("navigate to home page", async () => {
      await page.goto("/");
    });
    await test.step("click first license link", async () => {
      const link = page.getByRole("link", { name: /НМ 100-02/u });
      await link.click();
    });
    await test.step("verify license detail page loaded", async () => {
      await expect(page).toHaveURL(/\/license\/1/u);
    });
  });
});

test.describe("mobile license detail page", { tag: ["@critical"] }, () => {
  test("renders fields without horizontal overflow", async ({ page }) => {
    await test.step("navigate to license detail", async () => {
      await page.goto("/license/1");
    });
    await test.step("verify heading and key fields visible", async () => {
      await expect(page.getByRole("heading").first()).toBeVisible();
      await expect(page.getByText("НМ 100-02").first()).toBeVisible();
    });
    await test.step("verify no horizontal scroll", async () => {
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
  });
});

test.describe("mobile map page", { tag: ["@critical"] }, () => {
  test("filter panel is collapsed behind a toggle and map still renders", async ({ page }) => {
    await test.step("navigate to map", async () => {
      const geojsonResponse = page.waitForResponse((r) =>
        r.url().includes("/api/features.geojson"),
      );
      await page.goto("/map");
      await geojsonResponse;
      await expect(page.getByRole("region", { name: "Map", exact: true })).toBeVisible();
    });
    await test.step("filter checkboxes are not visible until toggled", async () => {
      await expect(page.getByRole("checkbox", { name: "Чуйская область" })).toBeHidden();
    });
    await test.step("toggle button reveals the filter panel without breaking the map", async () => {
      await page.getByRole("button", { name: "Фильтры" }).click();
      await expect(page.getByRole("checkbox", { name: "Чуйская область" })).toBeVisible();
      await expect(page.getByRole("region", { name: "Map", exact: true })).toBeVisible();
    });
  });
});
