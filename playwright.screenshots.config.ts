import { defineConfig, devices } from "@playwright/test";

/**
 * Config for the visual capture spec only.
 * Runs its own dev server on port 3100 so it never conflicts with
 * anything else running on 3000.
 *
 * Run with:  npx playwright test --config=playwright.screenshots.config.ts
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: "screenshots.spec.ts",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:3100",
    headless: true,
    screenshot: "off",
  },
  webServer: {
    command: "npm run dev -- -p 3100",
    url: "http://127.0.0.1:3100",
    timeout: 180_000,
    reuseExistingServer: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
