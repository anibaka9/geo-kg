import { test, expect } from "@playwright/test";

test.describe("home page table", { tag: ["@critical"] }, () => {
  test("renders page with title and table", async ({ page }) => {
    await test.step("navigate to home page", async () => {
      await page.goto("/");
    });
    await test.step("verify page title", async () => {
      await expect(page).toHaveTitle(/Лицензии КР/u);
    });
    await test.step("verify table is visible with rows", async () => {
      await expect(page.getByRole("table")).toBeVisible();
      const rows = page.getByRole("row");
      await expect(rows).not.toHaveCount(1);
    });
  });

  test("pagination shows second page", async ({ page }) => {
    await test.step("navigate to page 2", async () => {
      await page.goto("/?page=2");
    });
    await test.step("verify second page has fewer items", async () => {
      const rows = page.getByRole("row");
      // 28 total, 25 per page → page 2 has 3 data + 1 header = 4 rows
      await expect(rows).toHaveCount(4);
    });
  });

  test("clicking license row navigates to detail page", async ({ page }) => {
    await test.step("navigate to home page", async () => {
      await page.goto("/");
    });
    await test.step("click first license link", async () => {
      const link = page.getByRole("link", { name: /НМ 100-02/u });
      await link.click();
    });
    await test.step("verify license detail page loaded", async () => {
      await expect(page).toHaveURL(/\/license\/1/u);
      await expect(page.getByRole("heading", { name: /скв 100/u })).toBeVisible();
    });
  });

  test("shows correct total count", async ({ page }) => {
    await test.step("navigate to home page", async () => {
      await page.goto("/");
    });
    await test.step("verify total matches", async () => {
      await expect(page.getByText("28 лицензий")).toBeVisible();
    });
  });
});

test.describe("search filter", { tag: ["@critical"] }, () => {
  test("filters by license number", async ({ page }) => {
    await page.goto("/?q=НМ 105");
    await expect(page.getByRole("link", { name: /НМ 105/u })).toBeVisible();
    // Only 1 result
    const count = await page.locator("tr").count();
    expect(count).toBe(2); // header + 1
  });

  test("filters by object name", async ({ page }) => {
    await page.goto("/?q=скв");
    await expect(page.getByText("скв 100")).toBeVisible();
  });

  test("filters by company name", async ({ page }) => {
    await page.goto("/?q=Золотые");
    const companyCell = page.getByText("ОсОО Золотые недра").first();
    await expect(companyCell).toBeVisible();
  });

  test("empty search result shows no data rows", async ({ page }) => {
    await page.goto("/?q=zzzz_nonexistent_zzzz");
    // Only header row
    await expect(page.locator("tr")).toHaveCount(1);
  });
});

test.describe("status filter", { tag: ["@critical"] }, () => {
  test("filters active licenses only", async ({ page }) => {
    await page.goto("/?status=active");
    await expect(page.getByText("Аннул.")).not.toBeVisible();
  });

  test("filters annulled licenses only", async ({ page }) => {
    await page.goto("/?status=annulled");
    await expect(page.getByText("Аннул.").first()).toBeVisible();
    // Fewer than total
    const rows = page.getByRole("row");
    const count = await rows.count();
    expect(count).toBeLessThan(28);
  });
});

test.describe("region filter", { tag: ["@critical"] }, () => {
  test("filters by single region", async ({ page }) => {
    await page.goto("/?region=Чуйская+область");
    const rows = page.getByRole("row");
    const count = await rows.count();
    expect(count).toBeGreaterThan(1);
    expect(count).toBeLessThan(28);
  });

  test("adding second region increases count", async ({ page }) => {
    await page.goto("/?region=Чуйская+область");
    const count1 = await page.getByRole("row").count();

    await page.goto("/?region=Чуйская+область&region=Ошская+область");
    const count2 = await page.getByRole("row").count();

    expect(count2).toBeGreaterThan(count1);
  });
});

test.describe("mineral type filter", { tag: ["@critical"] }, () => {
  test("filters by mineral type", async ({ page }) => {
    await page.goto("/?mineralType=подземные+воды");
    const text = await page.locator("body").textContent();
    expect(text).toContain("подземные воды");
  });
});

test.describe("area range filter", { tag: ["@critical"] }, () => {
  test("filters by min area reduces count", async ({ page }) => {
    await page.goto("/");
    const allCount = await page.getByRole("row").count();

    await page.goto("/?areaMin=200");
    const filteredCount = await page.getByRole("row").count();

    expect(filteredCount).toBeLessThan(allCount);
  });

  test("filters by area range", async ({ page }) => {
    await page.goto("/?areaMin=100&areaMax=300");
    const text = await page.locator("body").textContent();
    expect(text).toMatch(/из \d+ записей/u);
  });
});

test.describe("country filter", { tag: ["@critical"] }, () => {
  test("filters by country", async ({ page }) => {
    await page.goto("/?country=Китай");
    const count = await page.getByRole("row").count();
    expect(count).toBeGreaterThan(1);
    expect(count).toBeLessThan(20);
  });
});

test.describe("year filter", { tag: ["@critical"] }, () => {
  test("filters by year shows fewer results", async ({ page }) => {
    await page.goto("/?year=2025");
    const count = await page.getByRole("row").count();
    expect(count).toBeGreaterThan(1);
    expect(count).toBeLessThan(28);
  });
});

test.describe("work type filter", { tag: ["@critical"] }, () => {
  test("filters by work type", async ({ page }) => {
    await page.goto("/?workType=разведочные+работы");
    await expect(page.getByRole("table")).toBeVisible();
  });
});

test.describe("filter panel sync", { tag: ["@critical"] }, () => {
  test("reset link and count badge appear immediately after checking a filter", async ({
    page,
  }) => {
    await test.step("navigate to home page", async () => {
      await page.goto("/");
    });
    await test.step("reset link is hidden with no active filters", async () => {
      await expect(page.getByRole("link", { name: "Сбросить" })).not.toBeVisible();
    });
    await test.step("check a region filter", async () => {
      await page.getByRole("checkbox", { name: "Чуйская область" }).check();
    });
    await test.step("reset link and badge appear without a manual page reload", async () => {
      await expect(page.getByRole("link", { name: "Сбросить" })).toBeVisible();
      await expect(
        page.locator("summary", { hasText: "Регион" }).locator(".bg-primary"),
      ).toHaveText("1");
    });
  });

  test("reset link clears active filters", async ({ page }) => {
    await test.step("navigate with an active filter in the URL", async () => {
      await page.goto("/?region=Чуйская+область");
      await expect(page.getByRole("checkbox", { name: "Чуйская область" })).toBeChecked();
    });
    await test.step("click reset", async () => {
      await page.getByRole("link", { name: "Сбросить" }).click();
    });
    await test.step("URL and checkbox state are cleared", async () => {
      await expect(page).toHaveURL("/");
      await expect(page.getByRole("checkbox", { name: "Чуйская область" })).not.toBeChecked();
    });
  });
});
