import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.pw.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["html", { open: "never", outputFolder: "playwright-report/html" }], ["list"]]
    : [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  // Two entries, launched in order: the first has no url/port, so Playwright
  // waits for it to exit before starting the second. This keeps fixture
  // generation out of the app's own webServer.command (which should own
  // process startup and readiness only, per AGENTS.md) while still
  // guaranteeing the fixture DB exists before the server tries to open it.
  webServer: [
    {
      command: "bun run fixtures",
      name: "Fixtures",
      timeout: 15_000,
    },
    {
      command: `bun run build && bun run start`,
      name: "App",
      url: `http://127.0.0.1:${PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 15_000,
      env: {
        PORT: String(PORT),
        DATABASE_PATH: "./tests/fixtures/mock-licenses.db",
      },
    },
  ],
  expect: {
    timeout: 10_000,
  },
  // Default project mirrors the previous no-`projects` behavior (Desktop Chrome).
  // "mobile-webkit" additionally runs the mobile suite on a WebKit (Safari) engine,
  // since mobile-only CSS/overflow bugs can slip past a Chromium-only baseline.
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile-webkit",
      use: { ...devices["iPhone 13"] },
      testMatch: /mobile\.pw\.ts/u,
    },
  ],
});
