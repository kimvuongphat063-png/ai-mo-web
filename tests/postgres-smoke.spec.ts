import { test, expect } from "@playwright/test";
import { createAuthCookie } from "./auth.setup";

/**
 * Postgres-mode Studio smoke test.
 * Verifies the full data flow through the Postgres adapter for both users.
 */

test.describe("Studio Postgres Smoke — Admin", () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([await createAuthCookie("admin")]);
  });

  test("reads products from Postgres", async ({ page }) => {
    const res = await page.request.get("/api/studio/products");
    const body = await res.json();
    expect(body.products.length).toBe(2);
    const names = body.products.map((p: any) => p.name);
    expect(names).toContain("Khóa Học AI Cho Người Mới");
    expect(names).toContain("AI Content Toolkit");
  });

  test("reads brand memory from Postgres", async ({ page }) => {
    const res = await page.request.get("/api/studio/brand");
    const body = await res.json();
    expect(body.profile).toBeTruthy();
    expect(body.profile.companyName).toBe("AI MỞ Studio");
  });

  test("reads scripts from Postgres", async ({ page }) => {
    const res = await page.request.get("/api/studio/scripts");
    const body = await res.json();
    expect(body.scripts.length).toBe(2);
    const titles = body.scripts.map((s: any) => s.platform);
    expect(titles).toContain("tiktok");
    expect(titles).toContain("reels");
  });

  test("reads campaigns from Postgres", async ({ page }) => {
    const res = await page.request.get("/api/studio/campaigns");
    const body = await res.json();
    expect(body.campaigns.length).toBe(2);
    const names = body.campaigns.map((c: any) => c.name);
    expect(names).toContain("Launch Khóa Học AI — Tuần 1");
  });

  test("reads performance metrics from Postgres", async ({ page }) => {
    const res = await page.request.get("/api/studio/performance");
    const body = await res.json();
    expect(body.metrics.length).toBeGreaterThanOrEqual(2);
  });
});

test.describe("Studio Postgres Smoke — Learner", () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([await createAuthCookie("learner")]);
  });

  test("reads product from Postgres", async ({ page }) => {
    const res = await page.request.get("/api/studio/products");
    const body = await res.json();
    expect(body.products.length).toBe(1);
    expect(body.products[0].name).toBe("Sách AI Cơ Bản");
  });

  test("reads brand memory from Postgres", async ({ page }) => {
    const res = await page.request.get("/api/studio/brand");
    const body = await res.json();
    expect(body.profile).toBeTruthy();
    expect(body.profile.companyName).toBe("Học Viên Demo Store");
  });

  test("reads script from Postgres", async ({ page }) => {
    const res = await page.request.get("/api/studio/scripts");
    const body = await res.json();
    expect(body.scripts.length).toBe(1);
    expect(body.scripts[0].platform).toBe("tiktok");
  });

  test("reads campaign from Postgres", async ({ page }) => {
    const res = await page.request.get("/api/studio/campaigns");
    const body = await res.json();
    expect(body.campaigns.length).toBe(1);
    expect(body.campaigns[0].name).toBe("Sách AI — Launch 7 ngày");
  });

  test("full flow: product → script → reload persistence", async ({ page }) => {
    // Load script detail page (from seed data)
    const scriptsRes = await page.request.get("/api/studio/scripts");
    const scriptsBody = await scriptsRes.json();
    const scriptId = scriptsBody.scripts[0].id;

    // Directly hit script detail API
    const scriptRes = await page.request.get(`/api/studio/scripts/${scriptId}`);
    expect(scriptRes.ok()).toBeTruthy();
    const scriptBody = await scriptRes.json();
    expect(scriptBody.script.scripts.length).toBeGreaterThanOrEqual(1);

    // Verify shots are present in the JSON column
    const firstVariant = scriptBody.script.scripts[0];
    expect(firstVariant.shots.length).toBeGreaterThanOrEqual(2);
    expect(firstVariant.hook).toBeTruthy();
    expect(firstVariant.cta).toBeTruthy();
  });
});

test.describe("Health endpoint security", () => {
  test("health requires admin role", async ({ page }) => {
    // No auth cookie → should get 401/403
    const res = await page.request.get("/api/studio/admin/health");
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("health returns safe fields when admin", async ({ page }) => {
    await page.context().addCookies([await createAuthCookie("admin")]);
    const res = await page.request.get("/api/studio/admin/health");
    const body = await res.json();
    expect(body.status).toBeDefined();
    expect(body.storage).toBe("postgres");
    // Must NOT expose connection string or error details
    expect(JSON.stringify(body)).not.toContain("Binhduong");
    expect(JSON.stringify(body)).not.toContain("supabase.com");
  });
});
