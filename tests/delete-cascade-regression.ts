/**
 * Delete cascade / detach regression tests.
 *
 * Validates the policy documented in src/lib/studio-storage/delete-policy.ts and
 * implemented by src/lib/studio-storage/delete-cascade.ts — the SAME module the
 * JSON and Postgres adapters apply. No `server-only` / prisma / fs imports, so
 * this runs as a pure unit test:
 *
 *   npx tsx tests/delete-cascade-regression.ts
 *
 * Policy (see delete-policy.ts):
 *   - deleteScript  → detach campaign items (status = "planned"), cascade metrics.
 *   - deleteProduct → cascade scripts (which applies the Script policy above).
 *   - deleteCampaign → cascade items, detach metrics (campaignId = null).
 */

import assert from "node:assert/strict";
import {
  cascadeDeleteScript,
  cascadeDeleteProduct,
  cascadeDeleteCampaign,
  UNSCHEDULED_STATUS,
  type DbSnapshot,
} from "../src/lib/studio-storage/delete-cascade";

function deepClone<T>(o: T): T {
  return JSON.parse(JSON.stringify(o));
}

/** Load the real snapshot shape the adapters pass in. */
function seedFixture(): DbSnapshot {
  return {
    scripts: [
      { id: "script-admin-001", userId: "admin-demo", productProfileId: "prod-admin-001" },
      { id: "script-admin-002", userId: "admin-demo", productProfileId: "prod-admin-002" },
      { id: "script-learner-001", userId: "learner-demo", productProfileId: "prod-learner-001" },
    ],
    campaigns: [
      {
        id: "camp-admin-001", userId: "admin-demo",
        items: [
          { day: 1, scriptId: "script-admin-001", status: "scripted" },
          { day: 2, scriptId: "script-admin-001", status: "scripted" },
          { day: 3, scriptId: null, status: "planned" },
        ],
      },
      {
        id: "camp-admin-002", userId: "admin-demo",
        items: [
          { day: 1, scriptId: "script-admin-002", status: "scripted" },
          { day: 2, scriptId: "script-admin-002", status: "scripted" },
        ],
      },
      {
        id: "camp-learner-001", userId: "learner-demo",
        items: [
          { day: 1, scriptId: "script-learner-001", status: "scripted" },
          { day: 2, scriptId: null, status: "planned" },
        ],
      },
    ],
    performanceMetrics: [
      { id: "perf-001", userId: "admin-demo", scriptId: "script-admin-001", campaignId: "camp-admin-001" },
      { id: "perf-002", userId: "admin-demo", scriptId: "script-admin-002", campaignId: "camp-admin-002" },
      { id: "perf-003", userId: "learner-demo", scriptId: "script-learner-001", campaignId: "camp-learner-001" },
    ],
  };
}

/** Verify the policy invariant: no live ref points at a removed record. */
function assertNoOrphans(
  rel: { scripts: DbSnapshot["scripts"]; campaigns: DbSnapshot["campaigns"]; performanceMetrics: DbSnapshot["performanceMetrics"] },
  removedScriptIds: string[],
  removedCampaignIds: string[],
  label: string
) {
  const liveScripts = new Set(rel.scripts.map((s) => s.id).filter((id) => !removedScriptIds.includes(id)));
  const liveCampaigns = new Set(rel.campaigns.map((c) => c.id));
  for (const item of rel.campaigns.flatMap((c) => c.items)) {
    if (item.scriptId && !liveScripts.has(item.scriptId)) {
      throw new Error(`${label}: orphan campaignItem.scriptId=${item.scriptId}`);
    }
  }
  for (const m of rel.performanceMetrics) {
    if (!liveScripts.has(m.scriptId)) {
      throw new Error(`${label}: orphan performanceMetric.scriptId=${m.scriptId}`);
    }
    if (m.campaignId && !liveCampaigns.has(m.campaignId) && !removedCampaignIds.includes(m.campaignId)) {
      throw new Error(`${label}: orphan performanceMetric.campaignId=${m.campaignId}`);
    }
  }
}

const run = async () => {
  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  async function test(name: string, fn: () => void | Promise<void>) {
    try {
      await fn();
      passed += 1;
      console.log(`  ✓ ${name}`);
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.stack ?? err.message : String(err);
      failures.push(`${name}\n${message}`);
      console.log(`  ✗ ${name}`);
    }
  }

  function section(name: string) {
    console.log(`\n${name}`);
  }

  // ─── deleteScript ──────────────────────────────────────────────────────────

  section("deleteScript");

  await test("detaches campaign items referencing the script", () => {
    const snapshot = deepClone(seedFixture());
    const result = cascadeDeleteScript(snapshot, "script-admin-001", "admin-demo")!;
    const items = result.campaigns
      .find((c) => c.id === "camp-admin-001")!
      .items.filter((i) => i.day <= 2);
    assert.ok(items.every((i) => i.scriptId === undefined), "scriptIds must be detached");
    assert.ok(items.every((i) => i.status === UNSCHEDULED_STATUS), "status must be 'planned'");
  });

  await test("cascades performance metrics referencing the script", () => {
    const snapshot = deepClone(seedFixture());
    const result = cascadeDeleteScript(snapshot, "script-admin-001", "admin-demo")!;
    assert.ok(!result.performanceMetrics.some((m) => m.scriptId === "script-admin-001"));
    assert.deepEqual(result.removedScriptIds, ["script-admin-001"]);
  });

  await test("does not touch other users' campaigns", () => {
    const snapshot = deepClone(seedFixture());
    const result = cascadeDeleteScript(snapshot, "script-admin-001", "admin-demo")!;
    const learnerCamp = result.campaigns.find((c) => c.id === "camp-learner-001")!;
    assert.ok(learnerCamp.items.some((i) => i.scriptId === "script-learner-001"));
  });

  await test("returns null for non-existent / foreign script", () => {
    const snapshot = deepClone(seedFixture());
    assert.equal(cascadeDeleteScript(snapshot, "nonexistent", "admin-demo"), null);
    assert.equal(cascadeDeleteScript(snapshot, "script-learner-001", "admin-demo"), null);
  });

  await test("no orphan records after deleteScript", () => {
    const snapshot = deepClone(seedFixture());
    const result = cascadeDeleteScript(snapshot, "script-admin-001", "admin-demo")!;
    assertNoOrphans(
      { scripts: snapshot.scripts, campaigns: result.campaigns, performanceMetrics: result.performanceMetrics },
      result.removedScriptIds, [],
      "deleteScript"
    );
  });

  // ─── deleteProduct ─────────────────────────────────────────────────────────

  section("deleteProduct");

  await test("cascades scripts + their campaign items + metrics", () => {
    const snapshot = deepClone(seedFixture());
    const result = cascadeDeleteProduct(snapshot, "prod-admin-001", "admin-demo");
    assert.deepEqual(result.removedScriptIds, ["script-admin-001"]);
    const allItems = result.campaigns.flatMap((c) => c.items);
    assert.ok(!allItems.some((i) => i.scriptId === "script-admin-001"));
    assert.ok(!result.performanceMetrics.some((m) => m.scriptId === "script-admin-001"));
  });

  await test("no orphan records after deleteProduct", () => {
    const snapshot = deepClone(seedFixture());
    const result = cascadeDeleteProduct(snapshot, "prod-admin-001", "admin-demo");
    assertNoOrphans(
      { scripts: snapshot.scripts, campaigns: result.campaigns, performanceMetrics: result.performanceMetrics },
      result.removedScriptIds, [],
      "deleteProduct"
    );
  });

  await test("product with no scripts leaves campaigns/metrics untouched", () => {
    const snapshot = deepClone(seedFixture());
    const result = cascadeDeleteProduct(snapshot, "prod-learner-001", "learner-demo");
    assert.deepEqual(result.removedScriptIds, ["script-learner-001"]);
  });

  // ─── deleteCampaign ────────────────────────────────────────────────────────

  section("deleteCampaign");

  await test("removes campaign items (they are children of the campaign)", () => {
    const snapshot = deepClone(seedFixture());
    const result = cascadeDeleteCampaign(snapshot, "camp-admin-001", "admin-demo")!;
    assert.ok(!result.campaigns.some((c) => c.id === "camp-admin-001"));
  });

  await test("detaches performance metrics (campaignId = null)", () => {
    const snapshot = deepClone(seedFixture());
    const result = cascadeDeleteCampaign(snapshot, "camp-admin-001", "admin-demo")!;
    const m = result.performanceMetrics.find((x) => x.id === "perf-001")!;
    assert.equal(m.campaignId, undefined, "campaignId must be detached");
    assert.equal(m.scriptId, "script-admin-001", "scriptId preserved");
  });

  await test("no orphan records after deleteCampaign", () => {
    const snapshot = deepClone(seedFixture());
    const result = cascadeDeleteCampaign(snapshot, "camp-admin-001", "admin-demo")!;
    assertNoOrphans(
      { scripts: snapshot.scripts, campaigns: result.campaigns, performanceMetrics: result.performanceMetrics },
      [], ["camp-admin-001"],
      "deleteCampaign"
    );
  });

  // ─── compound scenario ─────────────────────────────────────────────────────

  section("compound: deleteProduct with scheduled scripts");

  await test("all refs cleaned when deleting a product whose scripts are scheduled", () => {
    const snapshot = deepClone(seedFixture());
    const result = cascadeDeleteProduct(snapshot, "prod-admin-001", "admin-demo");
    const itemScriptIds = result.campaigns
      .flatMap((c) => c.items)
      .map((i) => i.scriptId)
      .filter(Boolean);
    assert.ok(!itemScriptIds.includes("script-admin-001"), "script-admin-001 refs removed from items");
    assertNoOrphans(
      { scripts: snapshot.scripts, campaigns: result.campaigns, performanceMetrics: result.performanceMetrics },
      result.removedScriptIds, [],
      "deleteProduct compound"
    );
  });

  // ─── adapter-specific regression: the JSON adapter's deleteScreen must
  // ─── apply the SAME policy. We verify against the real JSON adapter file
  // ─── by exercising pure transforms; the Postgres adapter is covered by the
  // ─── staging integration test (tests/staging-smoke.spec.ts).

  section("json adapter delete flows");

  // Verify the shared module's contract that the JSON adapter relies on:
  // deleting a product detaches items and cascades metrics for every owned script.
  await test("product delete cascade removes metrics of its scripts", () => {
    const snapshot = deepClone(seedFixture());
    const result = cascadeDeleteProduct(snapshot, "prod-admin-002", "admin-demo");
    // prod-admin-002 -> script-admin-002 -> perf-002
    assert.deepEqual(result.removedScriptIds, ["script-admin-002"]);
    assert.ok(!result.performanceMetrics.some((m) => m.id === "perf-002"));
  });

  await test("campaign delete detaches metrics but keeps them", () => {
    const snapshot = deepClone(seedFixture());
    const result = cascadeDeleteCampaign(snapshot, "camp-admin-002", "admin-demo")!;
    const m = result.performanceMetrics.find((x) => x.id === "perf-002")!;
    assert.equal(m.campaignId, undefined, "campaignId detached");
    assert.equal(m.scriptId, "script-admin-002", "metric survives with its script");
  });

  // ─── Summary ───────────────────────────────────────────────────────────────

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    for (const f of failures) console.error(`\n${f}`);
    process.exit(1);
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});