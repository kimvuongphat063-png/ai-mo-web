/**
 * Migration regression tests — pure unit tests; never touches disk or prisma.
 *
 * Run via `npm run studio:readiness` (which also runs
 * `scripts/test-studio-migration.ts` against the live data/) or directly:
 *   npx tsx tests/migration-regression.ts
 *
 * Regression cases:
 *   1. The `products` key (current schema) must be counted by the planner.
 *   2. The `productProfiles` key (legacy) must still be counted.
 *   3. Fails loudly when both `products` and `productProfiles` coexist.
 *   4. Routing: `productSource` prefers the current key, falls back to legacy.
 *   5. Live fixture guard: the real studio.json must carry non-zero data.
 */

import assert from "node:assert/strict";
import {
  buildPlan,
  productSource,
  type ImportCounts,
} from "../scripts/migration-plan";

/** Minimal helper to build a typed doc with only the arrays we need. */
function docWith(overrides: Partial<{
  products: unknown[];
  productProfiles: unknown[];
  brandProfiles: unknown[];
}>, base?: Record<string, unknown>): Record<string, unknown> {
  return {
    scripts: [],
    campaigns: [],
    performanceMetrics: [],
    generationJobs: [],
    ...base,
    ...overrides,
  };
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

  // ─── 1. current schema key `products` must be counted ────────────────────────

  section("regression: products key");

  await test("plan counts Products from the `products` key", () => {
    const plan = buildPlan(
      docWith({ products: [{ id: "p1", userId: "u1", name: "P1" }] })
    );
    assert.equal(plan.products, 1, `expected products=1, got ${plan.products}`);
  });

  // ─── 2. legacy key `productProfiles` must still be counted ───────────────────

  section("regression: legacy productProfiles key");

  await test("plan counts Products from the legacy `productProfiles` key", () => {
    const plan = buildPlan(
      docWith({ productProfiles: [{ id: "legacy-1", userId: "u1", name: "Legacy" }] })
    );
    assert.equal(
      plan.products,
      1,
      `expected legacy productProfiles=1, got ${plan.products}`
    );
  });

  // ─── 3. both `products` and `productProfiles` present → must fail clearly ─────

  section("regression: silent loss prevention");

  await test("fails clearly when both `products` and `productProfiles` are present", () => {
    const doc = docWith({ products: [{ id: "p1" }] });
    doc.productProfiles = [{ id: "legacy-1" }];

    let threw = false;
    let message = "";
    try {
      buildPlan(doc);
    } catch (err) {
      threw = true;
      message = err instanceof Error ? err.message : String(err);
    }
    assert.ok(threw, "buildPlan must throw when both keys are present");
    assert.ok(
      message.toLowerCase().includes("ambiguous"),
      `error should mention ambiguity, got: ${message}`
    );
  });

  // ─── 4. productSource routing ────────────────────────────────────────────────

  section("regression: productSource routing");

  await test("productSource returns `products` when both keys exist", () => {
    const doc = docWith({
      products: [{ id: "p1" }],
      productProfiles: [{ id: "legacy-1" }],
    });
    const src = productSource(doc);
    assert.equal(src.length, 1);
    assert.deepEqual(src[0], { id: "p1" }, "current key `products` must win");
  });

  await test("productSource falls back to `productProfiles` when `products` is missing", () => {
    const src = productSource(
      docWith({ productProfiles: [{ id: "legacy-1", userId: "u1" }] })
    );
    assert.equal(src.length, 1);
    assert.equal((src[0] as { id: string }).id, "legacy-1");
  });

  // ─── 5. live fixture guard: real studio.json must have non-zero counts ────────

  section("regression: live fixture guard");

  await test("real studio.json has non-zero entity counts (staging smoke guard)", async () => {
    const { readJsonFile, dataFilePath } = await import("../scripts/migration-plan");
    const doc = await readJsonFile(dataFilePath("studio.json"));
    if (!doc) {
      throw new Error("studio.json is missing — run the staging smoke on real data");
    }

    const plan: ImportCounts = buildPlan(doc);
    const names = Object.entries(plan) as [keyof ImportCounts, number][];
    const populated = names.filter(([, v]) => v > 0);

    if (populated.length === 0) {
      throw new Error(
        "staging guard: studio.json is fully empty — no entities to verify migration against"
      );
    }

    // If the current schema key is present but empty while other entities carry
    // data, that is exactly the migration regression we must not ship.
    const hasCurrentKey = "products" in doc;
    if (hasCurrentKey && plan.products === 0) {
      throw new Error(
        "staging guard: `products` key is present but empty while other entities " +
          "have data — migration would silently drop products"
      );
    }
  });

  // ─── Summary ────────────────────────────────────────────────────────────────

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    for (const failure of failures) console.error(`\n${failure}`);
    process.exit(1);
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
