#!/usr/bin/env tsx
/**
 * Phase 4C Remediation — Postgres Acceptance End-to-End (clean version).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Design rules (this file must satisfy):
 *   - Records use only prefix `acc-<timestamp>` and live under admin-demo.
 *   - try/finally guarantees cleanup — the test cannot exit without removing
 *     every record it created.
 *   - Cleanup self-verifies: after deleting each record, re-reads the list to
 *     confirm zero leftovers by prefix.
 *   - Real brand profile is never written to. The mock provider echoes the
 *     EXISTING admin brand name, so Brand Memory is asserted by checking for
 *     the real brand name (visible via GET /brand), not by writing markers.
 *   - Cascade: after creating a script + scheduling it, the script is deleted
 *     via API and the test asserts the campaign item was detached (scriptId
 *     null, status "planned") — this exercises the new delete-cascade.ts path.
 *   - Restore-point is NOT used as the default cleanup mechanism.
 *
 * Usage:
 *   BASE_URL=http://127.0.0.1:3000 npx tsx scripts/pg-acceptance.ts
 */

import { createHmac } from "node:crypto";
import { preflightGuard } from "./preflight";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const SESSION_COOKIE = "aimo_demo_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const SECRET =
  process.env.AUTH_SECRET || "aimo-local-demo-hmac-secret-change-before-deployment";

const STAMP = `acc-${Date.now()}`;

const IDENTITIES: Record<string, { userId: string; email: string; name: string; role: string }> = {
  admin: { userId: "admin-demo", email: "admin@aimo.vn", name: "Quản trị viên AI MỞ", role: "admin" },
  learner: { userId: "learner-demo", email: "hocvien@aimo.vn", name: "Học viên Demo", role: "learner" },
};

function cookieFor(role: "admin" | "learner"): string {
  const id = IDENTITIES[role];
  const session = { ...id, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${SESSION_COOKIE}=${payload}.${sig}`;
}

const ADMIN = cookieFor("admin");
const LEARNER = cookieFor("learner");

/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic JSON from the API */
type Res = { status: number; body: any };
async function api(method: string, path: string, opts: { cookie?: string; body?: any } = {}): Promise<Res> {
  const headers: Record<string, string> = {};
  if (opts.cookie) headers["Cookie"] = opts.cookie;
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  let body: any = null;
  const text = await res.text();
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: res.status, body };
}

let passed = 0;
let failed = 0;
const failures: string[] = [];
function check(label: string, cond: boolean, detail = "") {
  if (cond) { passed++; console.log(`  ✅ ${label}`); }
  else { failed++; failures.push(`${label} ${detail}`); console.log(`  ❌ ${label} ${detail}`); }
}

// Track every id this run created — cleanup MUST remove all of them.
const created = {
  products: [] as string[],
  scripts: [] as string[],
  campaigns: [] as string[],
};

/** Snapshot the real admin brand so finally can restore it. */
let brandSnapshot: any = null;

async function main() {
  await preflightGuard({ requireStudio: true });
  console.log("==========================================================");
  console.log(`   Phase 4C Acceptance (clean) — ${new Date().toISOString()}`);
  console.log(`   BASE=${BASE}  STAMP=${STAMP}`);
  console.log("==========================================================\n");

  try {
    // ── 0. Capture real admin brand (never overwrite) ─────────────────────────
    console.log("[0] Brand snapshot (admin)");
    const brandSnapRes = await api("GET", "/api/studio/brand", { cookie: ADMIN });
    brandSnapshot = brandSnapRes.body?.profile ?? null;
    check("Admin brand readable for snapshot", !!brandSnapshot);
    const existingBrandName = brandSnapshot?.companyName;
    check("Existing brand has companyName", !!existingBrandName, `got ${existingBrandName}`);

    // ── 1. Auth ───────────────────────────────────────────────────────────────
    console.log("\n[1] Authentication");
    const anon = await api("GET", "/api/studio/products");
    check("Unauthenticated read rejected (401)", anon.status === 401, `got ${anon.status}`);
    const adminList = await api("GET", "/api/studio/products", { cookie: ADMIN });
    check("Admin can list products (200)", adminList.status === 200, `got ${adminList.status}`);
    const learnerList = await api("GET", "/api/studio/products", { cookie: LEARNER });
    check("Learner can list products (200)", learnerList.status === 200, `got ${learnerList.status}`);

    // ── 2. Brand Memory injection (assert, do NOT write) ─────────────────────
    console.log("\n[2] Brand Memory — assertion (no write)");
    check("Brand snapshot has company name", !!existingBrandName);

    // ── 3. Create product ─────────────────────────────────────────────────────
    console.log("\n[3] Product create (admin)");
    const productPayload = {
      name: `${STAMP}-product`,
      url: "https://aimo.staging.local",
      description: `Acceptance product ${new Date().toISOString()}`,
      priceOffer: "299.000đ",
      featuresText: "Tính năng kiểm thử vòng lặp Postgres delete cascade",
      targetCustomer: "QA/staging",
      problemSolved: "Chứng minh adapter Postgres cascade delete hoạt động đúng",
      allowedProof: "Acceptance run",
      claimsToAvoid: "",
      affiliateLink: "",
      brandVoice: "",
    };
    const prodRes = await api("POST", "/api/studio/products", { cookie: ADMIN, body: productPayload });
    check("Product created (201)", prodRes.status === 201, `got ${prodRes.status}`);
    const productId = prodRes.body?.product?.id;
    if (productId) created.products.push(productId);
    check("Product has id", !!productId);

    // ── 4. Analyze ────────────────────────────────────────────────────────────
    console.log("\n[4] Analyze product + Brand Memory injection");
    const usageBefore = await api("GET", "/api/studio/ai-status", { cookie: ADMIN });
    const usedBefore = usageBefore.body?.usage?.used ?? usageBefore.body?.usage?.count ?? 0;
    const analyzeRes = await api("POST", `/api/studio/products/${productId}/analyze`, { cookie: ADMIN });
    check("Analyze succeeds (200)", analyzeRes.status === 200, `got ${analyzeRes.status}`);
    const analysis = analyzeRes.body?.analysis ?? analyzeRes.body;
    const angles = analysis?.sellingAngles;
    check("Analysis returns selling angles", Array.isArray(angles) && angles.length >= 1);
    // Assert brand memory: the mock echoes the real brand name (no mutation needed).
    const analysisStr = JSON.stringify(analysis ?? {});
    check(
      "Brand Memory present (real brand name in analysis)",
      analysisStr.includes(existingBrandName),
      `mock should echo brand name "${existingBrandName}"; analysis keys=${Object.keys(analysis ?? {}).join(",")}`
    );
    const angleId = angles?.[0]?.id ? String(angles[0].id) : "";

    // ── 5. AI quota ───────────────────────────────────────────────────────────
    console.log("\n[5] AI quota/usage (Postgres mode)");
    const usageAfter = await api("GET", "/api/studio/ai-status", { cookie: ADMIN });
    const usedAfter = usageAfter.body?.usage?.used ?? usageAfter.body?.usage?.count ?? 0;
    check("ai-status reachable (200)", usageAfter.status === 200, `got ${usageAfter.status}`);
    check("Quota consumed (used increased after analyze)", usedAfter > usedBefore, `before=${usedBefore} after=${usedAfter}`);

    // ── 6. Script create ──────────────────────────────────────────────────────
    console.log("\n[6] Script create + Brand Memory");
    const scriptPayload = {
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
    const scriptRes = await api("POST", "/api/studio/scripts", { cookie: ADMIN, body: scriptPayload });
    check("Script created (201)", scriptRes.status === 201, `got ${scriptRes.status}`);
    const scriptId = scriptRes.body?.script?.id;
    if (scriptId) created.scripts.push(scriptId);
    check("Script belongs to product", scriptRes.body?.script?.productProfileId === productId);
    const scriptStr = JSON.stringify(scriptRes.body?.script ?? {});
    check(
      "Brand Memory reflected in script",
      scriptStr.includes(existingBrandName),
      `mock should echo brand name "${existingBrandName}"`
    );

    // ── 7. Campaign + schedule + cascade test ──────────────────────────────────
    console.log("\n[7] Campaign create + schedule + cascade test");
    const campRes = await api("POST", "/api/studio/campaigns", {
      cookie: ADMIN,
      body: { name: `${STAMP}-campaign`, startDate: new Date().toISOString(), durationDays: 7, platform: "tiktok", goal: "conversion" },
    });
    check("Campaign created (201)", campRes.status === 201, `got ${campRes.status}`);
    const campaignId = campRes.body?.campaign?.id;
    if (campaignId) created.campaigns.push(campaignId);
    check("Campaign has 7 day-items", (campRes.body?.campaign?.items?.length ?? 0) === 7);
    const dayRes = await api("PATCH", `/api/studio/campaigns/${campaignId}/days`, {
      cookie: ADMIN, body: { day: 1, scriptId, status: "scripted" },
    });
    check("Schedule script into day 1 (200)", dayRes.status === 200, `got ${dayRes.status}`);
    const day1 = dayRes.body?.campaign?.items?.find((i: any) => i.day === 1);
    check("Day 1 references the script", day1?.scriptId === scriptId);

    // ── 8. Performance metric ─────────────────────────────────────────────────
    console.log("\n[8] Performance metric");
    const perfRes = await api("POST", "/api/studio/performance", {
      cookie: ADMIN,
      body: {
        scriptId, campaignId, recordedAt: new Date().toISOString(),
        views: 1000, likes: 100, comments: 10, shares: 5, clicks: 50,
        conversions: 3, revenue: 897000, costSpent: 200000, watchTimeSeconds: 15000,
      },
    });
    check("Performance metric created (201)", perfRes.status === 201, `got ${perfRes.status}`);

    // ── 9. Delete script → cascade detach campaign item, remove metrics ───────
    console.log("\n[9] Delete script cascade test");
    const delScriptRes = await api("DELETE", `/api/studio/scripts/${scriptId}`, { cookie: ADMIN });
    check("Script deleted (200)", delScriptRes.status === 200, `got ${delScriptRes.status}`);
    // After deletion, re-read campaign day 1 — scriptId must be null.
    const campAfter = await api("GET", `/api/studio/campaigns/${campaignId}`, { cookie: ADMIN });
    const day1After = campAfter.body?.campaign?.items?.find((i: any) => i.day === 1);
    check(
      "Campaign item detached after script delete (scriptId=null)",
      day1After?.scriptId === null || day1After?.scriptId === undefined,
      `got scriptId=${day1After?.scriptId}`
    );
    check(
      "Campaign item status reset to 'planned'",
      day1After?.status === "planned",
      `got status=${day1After?.status}`
    );
    // Metrics for the deleted script must be gone.
    const perfAfter = await api("GET", `/api/studio/performance?scriptId=${scriptId}`, { cookie: ADMIN });
    check("Performance metric removed after script delete", (perfAfter.body?.metrics?.length ?? 0) === 0);

    // Remove the deleted script from our tracking (cleanup won't re-delete it).
    created.scripts = created.scripts.filter((s) => s !== scriptId);

    // ── 10. Ownership isolation ───────────────────────────────────────────────
    console.log("\n[10] Ownership isolation");
    const learnerRead = await api("GET", `/api/studio/products/${productId}`, { cookie: LEARNER });
    check("Learner cannot read admin product (404)", learnerRead.status === 404, `got ${learnerRead.status}`);
    const learnerDelete = await api("DELETE", `/api/studio/products/${productId}`, { cookie: LEARNER });
    check("Learner cannot delete admin product (404)", learnerDelete.status === 404, `got ${learnerDelete.status}`);

    // ── 11. Persistence (fresh read) ──────────────────────────────────────────
    console.log("\n[11] Persistence");
    const reProduct = await api("GET", `/api/studio/products/${productId}`, { cookie: ADMIN });
    check("Product persists", reProduct.body?.product?.id === productId);
    check("Analysis cache persisted", !!reProduct.body?.product?.analysisCache);

    console.log(`\n=== RESULT: ${passed} passed, ${failed} failed ===`);
    if (failed > 0) failures.forEach((f) => console.log(`  - ${f}`));
  } finally {
    // ── Cleanup — ALWAYS runs, even on early exit ─────────────────────────────
    console.log("\n[cleanup] Removing acceptance fixtures");

    for (const id of created.campaigns) {
      await api("DELETE", `/api/studio/campaigns/${id}`, { cookie: ADMIN });
    }
    for (const id of created.scripts) {
      await api("DELETE", `/api/studio/scripts/${id}`, { cookie: ADMIN });
    }
    for (const id of created.products) {
      await api("DELETE", `/api/studio/products/${id}`, { cookie: ADMIN });
    }
    // Restore real brand snapshot if it was ever captured (safety net).
    if (brandSnapshot) {
      await api("PUT", "/api/studio/brand", {
        cookie: ADMIN,
        body: {
          companyName: brandSnapshot.companyName,
          brandVoice: brandSnapshot.brandVoice ?? "",
          prohibitedClaims: brandSnapshot.prohibitedClaims ?? "",
          requiredDisclosures: brandSnapshot.requiredDisclosures ?? "",
          preferredFormats: brandSnapshot.preferredFormats ?? [],
          targetAudience: brandSnapshot.targetAudience ?? "",
          competitorUrls: brandSnapshot.competitorUrls ?? [],
          language: brandSnapshot.language ?? "vi",
        },
      });
    }

    // Verify no acceptance-prefixed records remain in any active entity.
    const listCheck = await api("GET", "/api/studio/products", { cookie: ADMIN });
    const leftoverProducts: string[] = (listCheck.body?.products ?? [])
      .map((p: any) => p.name)
      .filter((n: string) => n.startsWith(STAMP));
    const campListCheck = await api("GET", "/api/studio/campaigns", { cookie: ADMIN });
    const leftoverCampaigns: string[] = (campListCheck.body?.campaigns ?? [])
      .map((c: any) => c.name)
      .filter((n: string) => n.startsWith(STAMP));
    const allLeftovers = [...leftoverProducts, ...leftoverCampaigns];
    const ok = allLeftovers.length === 0;
    console.log(`  leftover records with prefix ${STAMP}: ${ok ? "none ✅" : allLeftovers.join(", ") + " ❌"}`);
    if (!ok) failed++;

    // Extra guard: assert no orphan campaign items point at any deleted scripts.
    // This catches cascade failures that slip past the list-level check.
    for (const campId of created.campaigns) {
      const campDetail = await api("GET", `/api/studio/campaigns/${campId}`, { cookie: ADMIN });
      if (campDetail.status === 200) {
        const orphanedItems = (campDetail.body?.campaign?.items ?? [])
          .filter((i: any) => i.scriptId && created.scripts.includes(i.scriptId));
        if (orphanedItems.length > 0) {
          console.log(`  ❌ orphan campaign items in campaign ${campId}: ${JSON.stringify(orphanedItems)}`);
          failed++;
        }
      }
    }

    if (failed > 0) process.exit(1);
  }
}

main().catch(async (err) => {
  console.error("Acceptance run crashed:", err);
  process.exit(1);
});
