import { defineConfig, devices } from "@playwright/test";

/**
 * Security smoke tests: CSRF + rate limiting.
 *
 * Run: npx playwright test --config=playwright.security.config.ts
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: "security.spec.ts",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:3000",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    timeout: 120_000,
    reuseExistingServer: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
