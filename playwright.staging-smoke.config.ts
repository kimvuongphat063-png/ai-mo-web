import { defineConfig, devices } from "@playwright/test";

/**
 * Postgres staging smoke config — full write/read round-trip.
 *
 * Starts the dev server with STUDIO_STORAGE=postgres on port 3201 so it never
 * collides with the JSON-mode server (3000) or the read-only postgres smoke
 * (3200). Reads the staging DATABASE_URL from .env.local (loaded by the dev
 * server itself via dotenv).
 *
 * IMPORTANT: this writes to the staging Supabase database. The spec owns its
 * fixtures (timestamped product name) and self-cleans. Run only when you have
 * explicitly opted into staging.
 *
 * Run with: npx playwright test --config=playwright.staging-smoke.config.ts
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: "staging-smoke.spec.ts",
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:3201",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- -p 3201",
    url: "http://127.0.0.1:3201",
    timeout: 180_000,
    reuseExistingServer: true,
    env: {
      STUDIO_STORAGE: "postgres",
      ...process.env,
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
