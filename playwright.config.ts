import { defineConfig } from "@playwright/test";

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
  webServer: {
    command: `bun run build:css && bun server.tsx`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
    env: {
      PORT: String(PORT),
      LICENSES_PATH: "./tests/fixtures/mock-licenses.json",
    },
  },
  expect: {
    timeout: 10_000,
  },
});
