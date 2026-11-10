import { test, expect } from "@playwright/test";
import { createAuthCookie } from "./auth.setup";

/**
 * Postgres staging smoke — full write/read round-trip.
 *
 * Requires STUDIO_STORAGE=postgres. `playwright.staging-smoke.config.ts` starts
 * the dev server with that env on port 3201 so it never collides with the
 * JSON-mode server (3000) or the read-only postgres smoke (3200).
 *
 * Flow:
 *   1. Read Products / Scripts / Campaigns / Performance via the API.
 *   2. Create a uniquely-labelled product (staging-smoke-<timestamp>).
 *   3. Analyze it to obtain a selling angle.
 *   4. Generate a script from that product + angle.
 *   5. Re-read both through fresh requests to prove persistence.
 *   6. Delete the smoke product (cascade removes its script).
 *
 * The timestamped name means a failed earlier run can never be mistaken for
 * this run's data, and cleanup is scoped to exactly the record we created.
 * Runs as the `admin` demo user, so ownership filters keep it off other users'
 * rows.
 */

const PRODUCT_NAME = `staging-smoke-${Date.now()}`;

const PRODUCT_PAYLOAD = {
  name: PRODUCT_NAME,
  url: "https://aimo.staging.local",
  description: `Smoke test product created ${new Date().toISOString()}`,
  priceOffer: "199.000đ",
  featuresText: "Xác minh vòng lặp ghi/đọc Postgres Studio",
  targetCustomer: "QA / staging",
  problemSolved: "Chứng minh adapter Postgres lưu và đọc lại record",
  allowedProof: "Smoke run",
  claimsToAvoid: "",
  affiliateLink: "",
  brandVoice: "",
};

function scriptPayload(productId: string, angleId: string) {
  return {
    productProfileId: productId,
    selectedAngleId: angleId,
    platform: "tiktok",
    goal: "conversion",
    durationSeconds: 30,
    format: "ugc",
    presenter: "",
    tone: "thân thiện",
    cta: "Dùng thử ngay",
    complianceConstraints: "Không cam kết doanh thu",
  };
}

test.describe("Studio Postgres staging smoke", () => {
  // Steps build on each other: the product must exist before the script.
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ context }) => {
    await context.addCookies([await createAuthCookie("admin")]);
  });

  let productId = "";
  let angleId = "";
  let scriptId = "";

  test("reads Products, Scripts, Campaigns and Performance from Postgres", async ({ page }) => {
    const products = await page.request.get("/api/studio/products");
    expect(products.ok()).toBeTruthy();
    expect((await products.json()).products.length).toBeGreaterThanOrEqual(1);

    const scripts = await page.request.get("/api/studio/scripts");
    expect(scripts.ok()).toBeTruthy();
    expect((await scripts.json()).scripts.length).toBeGreaterThanOrEqual(1);

    const campaigns = await page.request.get("/api/studio/campaigns");
    expect(campaigns.ok()).toBeTruthy();
    expect((await campaigns.json()).campaigns.length).toBeGreaterThanOrEqual(1);

    const performance = await page.request.get("/api/studio/performance");
    expect(performance.ok()).toBeTruthy();
    expect((await performance.json()).metrics.length).toBeGreaterThanOrEqual(1);
  });

  test("creates a staging-smoke product", async ({ page }) => {
    const res = await page.request.post("/api/studio/products", { data: PRODUCT_PAYLOAD });
    expect(res.status()).toBe(201);
    const body = await res.json();
    productId = body.product.id;
    expect(productId).toBeTruthy();
    expect(body.product.name).toBe(PRODUCT_NAME);
  });

  test("analyzes the smoke product and gets a selling angle", async ({ page }) => {
    const res = await page.request.post(`/api/studio/products/${productId}/analyze`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const angles = (body.analysis ?? body).sellingAngles;
    expect(angles?.length).toBeGreaterThanOrEqual(1);
    angleId = String(angles[0].id);
  });

  test("creates a script from the smoke product", async ({ page }) => {
    const res = await page.request.post("/api/studio/scripts", {
      data: scriptPayload(productId, angleId),
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    scriptId = body.script.id;
    expect(scriptId).toBeTruthy();
    expect(body.script.productProfileId).toBe(productId);
  });

  test("verifies both records persist on a fresh read", async ({ page }) => {
    const productRes = await page.request.get(`/api/studio/products/${productId}`);
    expect(productRes.ok()).toBeTruthy();
    const product = (await productRes.json()).product;
    expect(product.id).toBe(productId);
    expect(product.name).toBe(PRODUCT_NAME);

    const scriptRes = await page.request.get(`/api/studio/scripts/${scriptId}`);
    expect(scriptRes.ok()).toBeTruthy();
    const script = (await scriptRes.json()).script;
    expect(script.id).toBe(scriptId);
    expect(script.productProfileId).toBe(productId);
    expect(script.scripts.length).toBeGreaterThanOrEqual(1);

    // The smoke product must also show up in the owner's list view.
    const listRes = await page.request.get("/api/studio/products");
    const names = (await listRes.json()).products.map((p: { name: string }) => p.name);
    expect(names).toContain(PRODUCT_NAME);
  });

  test("delete flows honour the cascade/detach policy (staging integration)", async ({ page }) => {
    // Create a dedicated product + script + campaign for this cascade check so
    // no shared state is mutated.
    const cascadeName = `staging-cascade-${Date.now()}`;
    const res = await page.request.post("/api/studio/products", {
      data: { ...PRODUCT_PAYLOAD, name: cascadeName },
    });
    expect(res.status()).toBe(201);
    const cascadeProductId = (await res.json()).product.id;

    try {
      // Analyze to get an angle for the script.
      const analyze = await page.request.post(`/api/studio/products/${cascadeProductId}/analyze`);
      expect(analyze.ok()).toBeTruthy();
      const analyzeBody = await analyze.json();
      const angles = (analyzeBody.analysis ?? analyzeBody).sellingAngles;
      expect(angles?.length).toBeGreaterThanOrEqual(1);
      const angleId = String(angles[0].id);

      // Create a script.
      const scriptRes = await page.request.post("/api/studio/scripts", {
        data: scriptPayload(cascadeProductId, angleId),
      });
      expect(scriptRes.status()).toBe(201);
      const cascadeScriptId = (await scriptRes.json()).script.id;

      // Create a campaign and schedule the script on day 1.
      const campRes = await page.request.post("/api/studio/campaigns", {
        data: { name: `${cascadeName}-camp`, startDate: new Date().toISOString(), durationDays: 7, platform: "tiktok", goal: "conversion" },
      });
      expect(campRes.status()).toBe(201);
      const cascadeCampaignId = (await campRes.json()).campaign.id;
      const patch = await page.request.patch(`/api/studio/campaigns/${cascadeCampaignId}/days`, {
        data: { day: 1, scriptId: cascadeScriptId, status: "scripted" },
      });
      expect(patch.ok()).toBeTruthy();

      // Create a performance metric for the script.
      const perfRes = await page.request.post("/api/studio/performance", {
        data: { scriptId: cascadeScriptId, campaignId: cascadeCampaignId },
      });
      expect([200, 201]).toContain(perfRes.status());

      // ── Cascade: delete the SCRIPT → campaign item detached, metric gone ──
      const scriptDel = await page.request.delete(`/api/studio/scripts/${cascadeScriptId}`);
      expect(scriptDel.status()).toBe(200);
      const campAfter = await page.request.get(`/api/studio/campaigns/${cascadeCampaignId}`);
      const day1 = (await campAfter.json()).campaign.items.find((i: { day: number }) => i.day === 1);
      expect(day1.scriptId).toBeFalsy();
      expect(day1.status).toBe("planned");
      const perfAfter = await page.request.get(`/api/studio/performance?scriptId=${cascadeScriptId}`);
      expect((await perfAfter.json()).metrics.length).toBe(0);

      // ── Cascade: delete the PRODUCT → its scripts gone, items detached ──
      const productDel = await page.request.delete(`/api/studio/products/${cascadeProductId}`);
      expect(productDel.status()).toBe(200);
      const campAfter2 = await page.request.get(`/api/studio/campaigns/${cascadeCampaignId}`);
      // Campaign still exists (we created it), its items no longer reference anything.
      const campBody2 = await campAfter2.json();
      expect(campBody2.campaign.items.every((i: { scriptId?: string | null }) => !i.scriptId)).toBe(true);

      // Clean the campaign we created.
      const campDel = await page.request.delete(`/api/studio/campaigns/${cascadeCampaignId}`);
      expect([200, 404]).toContain(campDel.status());
    } finally {
      // Best-effort: ensure the cascade product is gone even if an assertion above
      // failed mid-way.
      await page.request.delete(`/api/studio/products/${cascadeProductId}`);
      const listRes = await page.request.get("/api/studio/products");
      const names = (await listRes.json()).products.map((p: { name: string }) => p.name);
      expect(names).not.toContain(cascadeName);
    }
  });

  test("cleans up the smoke records", async ({ page }) => {
    // Deleting a product now cascades to its scripts (delete-cascade.ts), so
    // deleting the product is sufficient for the smoke fixture. The explicit
    // script delete below is kept as a belt-and-suspenders guard.
    const del = await page.request.delete(`/api/studio/products/${productId}`);
    expect([200, 404]).toContain(del.status());

    // The smoke product must no longer show up in the active list.
    const listRes = await page.request.get("/api/studio/products");
    const names = (await listRes.json()).products.map((p: { name: string }) => p.name);
    expect(names).not.toContain(PRODUCT_NAME);

    // Extra guard: the script must also be gone from the active list.
    if (scriptId) {
      const scriptGone = await page.request.get(`/api/studio/scripts/${scriptId}`);
      expect(scriptGone.status()).toBe(404);
    }
  });
});
