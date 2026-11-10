import { defineConfig, devices } from "@playwright/test";

/**
 * Postgres-mode smoke test config.
 *
 * Runs against a dev server started with STUDIO_STORAGE=postgres on port 3200
 * so it never collides with the JSON-mode dev server on 3000.
 *
 * Run with:  npx playwright test --config=playwright.postgres.config.ts
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: "postgres-smoke.spec.ts",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:3200",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- -p 3200",
    url: "http://127.0.0.1:3200",
    timeout: 180_000,
    reuseExistingServer: true,
    env: { STUDIO_STORAGE: "postgres" },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
