import { test } from "@playwright/test";
import { createAuthCookie } from "./auth.setup";

/**
 * Visual capture spec for the Studio redesign.
 * Captures every /app route at desktop (1440px) and mobile (390px)
 * widths into tests/__screenshots__/ for manual visual review.
 *
 * Run with:  npx playwright test screenshots.spec.ts
 */

const ROUTES: { path: string; name: string }[] = [
  { path: "/app", name: "dashboard" },
  { path: "/app/products", name: "products-list" },
  { path: "/app/products/new", name: "products-new" },
  { path: "/app/scripts", name: "scripts-list" },
  { path: "/app/scripts/new", name: "scripts-new" },
  { path: "/app/campaigns", name: "campaigns-list" },
  { path: "/app/campaigns/new", name: "campaigns-new" },
  { path: "/app/brand", name: "brand" },
  { path: "/app/performance", name: "performance" },
  { path: "/app/settings", name: "settings" },
];

const VIEWPORTS = [
  { label: "desktop", width: 1440, height: 900 },
  { label: "mobile", width: 390, height: 844 },
];

test.describe("Studio visual capture", () => {
  test.beforeEach(async ({ context }) => {
    const authCookie = await createAuthCookie("learner");
    await context.addCookies([authCookie]);
  });

  for (const viewport of VIEWPORTS) {
    for (const route of ROUTES) {
      test(`${viewport.label} — ${route.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(route.path, { waitUntil: "networkidle" });
        // Let async server data + client hydration settle.
        await page.waitForTimeout(600);
        await page.screenshot({
          path: `tests/__screenshots__/${viewport.label}-${route.name}.png`,
          fullPage: true,
        });
      });
    }
  }
});
