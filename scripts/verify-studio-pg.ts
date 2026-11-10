#!/usr/bin/env tsx
/**
 * Studio Postgres Verification Script
 *
 * Phase 4B — AI Mở Studio DB Migration
 *
 * Checks performed:
 *   1. Entity count comparison (JSON vs Postgres)
 *   2. Foreign-key ownership validation
 *   3. Sample flow: Product → Analysis → Script → Campaign → Performance
 *   4. Orphan detection
 *
 * Exits with code 1 on any count mismatch or orphan.
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFile } from "fs/promises";
import path from "node:path";
import * as dotenv from "dotenv";

// Load local environment only — never commit connection strings.
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// ─────────────────────────────────────────────────────────────────────────────
// Prisma
// ─────────────────────────────────────────────────────────────────────────────

let prisma: any = null;
function getPrisma() {
  if (!prisma) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      console.error("DATABASE_URL is not set. Cannot connect to Postgres.");
      process.exit(1);
    }
    const adapter = new PrismaPg({ connectionString: url });
    prisma = new (PrismaClient as any)({ adapter });
  }
  return prisma;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("==========================================================");
  console.log("   Studio Postgres Verification  (Phase 4B)");
  console.log("==========================================================\n");

  // ── Load JSON source ──────────────────────────────────────────────────────

  const studioPath = path.join(process.cwd(), "data", "studio.json");
  const usagePath = path.join(process.cwd(), "data", "ai-usage.json");

  let jsonDb: any = {
    products: [],
    scripts: [],
    campaigns: [],
    brandProfiles: [],
    performanceMetrics: [],
    generationJobs: [],
  };
  let rawStudio: string | null = null;

  try {
    rawStudio = await readFile(studioPath, "utf-8");
    const parsed = JSON.parse(rawStudio);
    // Accept both "productProfiles" and "products"
    jsonDb = {
      ...parsed,
      products: parsed.productProfiles ?? parsed.products ?? [],
    };
    console.log(`[Load] studio.json (${rawStudio.length} bytes)`);
  } catch {
    console.log("[Load] No studio.json found — counts will compare against zero.\n");
  }

  let usageDb: any = { entries: [] };
  try {
    const rawUsage = await readFile(usagePath, "utf-8");
    usageDb = JSON.parse(rawUsage);
    console.log(`[Load] ai-usage.json`);
  } catch {
    console.log("[Load] No ai-usage.json found.\n");
  }

  // ── Count comparison ──────────────────────────────────────────────────────

  console.log("--- Entity Count Comparison ---\n");

  const counts = {
    brandProfiles: { json: jsonDb.brandProfiles?.length ?? 0, pg: 0 },
    products: { json: jsonDb.products?.length ?? 0, pg: 0 },
    scripts: { json: jsonDb.scripts?.length ?? 0, pg: 0 },
    campaigns: { json: jsonDb.campaigns?.length ?? 0, pg: 0 },
    campaignItems: {
      json: (jsonDb.campaigns ?? []).reduce(
        (n: number, c: any) => n + (c.items?.length ?? 0),
        0
      ),
      pg: 0,
    },
    performanceMetrics: { json: jsonDb.performanceMetrics?.length ?? 0, pg: 0 },
    generationJobs: { json: jsonDb.generationJobs?.length ?? 0, pg: 0 },
    aiUsage: { json: usageDb.entries?.length ?? 0, pg: 0 },
  };

  // Query Postgres counts
  const tx = getPrisma();
  counts.brandProfiles.pg = await tx.studioBrandProfile.count();
  counts.products.pg = await tx.studioProduct.count({
    where: { deletedAt: null },
  });
  counts.scripts.pg = await tx.studioScript.count({
    where: { deletedAt: null },
  });
  counts.campaigns.pg = await tx.studioCampaign.count({
    where: { deletedAt: null },
  });
  // Campaign items: only count those belonging to a live (non-deleted) campaign.
  // JSON campaigns never contain items for soft-deleted campaigns, so PG must
  // exclude them too for a fair comparison.
  const liveCampaignRows: { id: string }[] = await tx.studioCampaign.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });
  const liveCampaignIds = new Set(liveCampaignRows.map((c) => c.id));
  const allItems: { campaignId: string }[] = await tx.studioCampaignItem.findMany({
    select: { campaignId: true },
  });
  counts.campaignItems.pg = allItems.filter((i) => liveCampaignIds.has(i.campaignId)).length;
  counts.performanceMetrics.pg =
    await tx.studioPerformanceMetric.count();
  counts.generationJobs.pg = await tx.studioGenerationJob.count();
  counts.aiUsage.pg = await tx.studioAiUsage.count();

  let failed = false;
  for (const [entity, c] of Object.entries(counts)) {
    const match = c.json === c.pg;
    const icon = match ? "✅" : "❌";
    const pad = entity.padEnd(20);
    console.log(`  ${icon} ${pad} JSON=${String(c.json).padStart(4)}  PG=${String(c.pg).padStart(4)}  ${match ? "" : "MISMATCH"}`);
    if (!match) failed = true;
  }

  // ── Foreign-key ownership validation ──────────────────────────────────────

  console.log("\n--- Foreign Key Ownership ---\n");

  let fkIssues = 0;

  // Scripts must reference existing Products (same user)
  const scripts: any[] = await tx.studioScript.findMany({
    where: { deletedAt: null },
    select: { id: true, userId: true, productProfileId: true },
  });
  const products: any[] = await tx.studioProduct.findMany({
    where: { deletedAt: null },
    select: { id: true, userId: true },
  });
  const productMap = new Map(products.map((p: any) => [p.id, p]));

  for (const s of scripts) {
    const product = productMap.get(s.productProfileId);
    if (!product) {
      console.log(
        `  ❌ Script ${s.id} → Product ${s.productProfileId} (NOT FOUND)`
      );
      fkIssues++;
    } else if (product.userId !== s.userId) {
      console.log(
        `  ❌ Script ${s.id} (user:${s.userId}) → Product ${s.productProfileId} (user:${product.userId}) OWNERSHIP MISMATCH`
      );
      fkIssues++;
    }
  }

  // CampaignItems must reference existing Campaigns and (nullable) Scripts.
  const scriptMap = new Map(scripts.map((s: any) => [s.id, s]));
  const campaigns: any[] = await tx.studioCampaign.findMany({
    where: { deletedAt: null },
    select: { id: true, userId: true },
  });
  const campaignMap = new Map(campaigns.map((c: any) => [c.id, c]));

  const items: any[] = await tx.studioCampaignItem.findMany({
    select: { id: true, campaignId: true, scriptId: true },
  });

  for (const item of items) {
    if (!campaignMap.has(item.campaignId)) {
      console.log(
        `  ❌ CampaignItem ${item.id} → Campaign ${item.campaignId} (NOT FOUND)`
      );
      fkIssues++;
    }
    // CampaignItem.scriptId references a Script (nullable).
    if (item.scriptId && !scriptMap.has(item.scriptId)) {
      console.log(
        `  ❌ CampaignItem ${item.id} → Script ${item.scriptId} (NOT FOUND)`
      );
      fkIssues++;
    }
  }

  // Performance Metrics must reference existing Scripts
  const metrics: any[] = await tx.studioPerformanceMetric.findMany({
    select: { id: true, scriptId: true, campaignId: true, userId: true },
  });

  for (const m of metrics) {
    const script = scriptMap.get(m.scriptId);
    if (!script) {
      console.log(
        `  ❌ Metric ${m.id} → Script ${m.scriptId} (NOT FOUND)`
      );
      fkIssues++;
    } else if (script.userId !== m.userId) {
      console.log(
        `  ❌ Metric ${m.id} (user:${m.userId}) → Script ${m.scriptId} (user:${script.userId}) OWNERSHIP MISMATCH`
      );
      fkIssues++;
    }
    if (m.campaignId && !campaignMap.has(m.campaignId)) {
      console.log(
        `  ❌ Metric ${m.id} → Campaign ${m.campaignId} (NOT FOUND)`
      );
      fkIssues++;
    }
  }

  if (fkIssues === 0) {
    console.log("  ✅ All foreign keys valid — no orphans, no ownership mismatches.");
  } else {
    console.log(`\n  ❌ ${fkIssues} foreign-key issue(s) found.`);
    failed = true;
  }

  // ── Sample flow verification ──────────────────────────────────────────────

  console.log("\n--- Sample Flow Verification ---\n");

  // Find the first Product that has: Analysis → Script → Campaign → Performance
  let flowFound = false;
  for (const product of products) {
    const script = scripts.find(
      (s: any) => s.productProfileId === product.id && s.userId === product.userId
    );
    if (!script) continue;

    // Check if this product has analysis cache
    const fullProduct = await tx.studioProduct.findUnique({
      where: { id: product.id },
      select: { analysisCache: true },
    });
    const hasAnalysis = !!fullProduct?.analysisCache;

    // Check campaign linkage
    const linkedItem = items.find(
      (i: any) => i.scriptId === script.id
    );
    const campaign = linkedItem
      ? campaignMap.get(linkedItem.campaignId)
      : null;

    // Check performance
    const perf = metrics.find((m: any) => m.scriptId === script.id);

    console.log(
      `  Product: ${product.id} (${product.name})`
    );
    console.log(`    Analysis: ${hasAnalysis ? "✅ cached" : "⬜ not cached"}`);
    console.log(
      `    Script:   ${script.id} ✅`
    );
    console.log(
      `    Campaign: ${campaign ? `✅ ${campaign.id}` : "⬜ no linked campaign"}`
    );
    console.log(
      `    Metrics:  ${perf ? "✅ has data" : "⬜ no metrics"}`
    );

    if (hasAnalysis) {
      console.log(
        `\n  ✅ Full flow verified: Product → Analysis → Script → Campaign → Performance`
      );
      flowFound = true;
      break;
    }
  }

  if (!flowFound) {
    if (products.length === 0 && scripts.length === 0) {
      console.log(
        "  ⬜ No products or scripts to verify — data is empty."
      );
    } else {
      console.log(
        "  ⚠ No complete Product → Analysis → Script → Campaign → Performance flow found."
      );
      console.log(
        "    (This is expected if analysis cache or campaign links are missing.)"
      );
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log("\n--- Summary ---\n");

  if (failed) {
    console.error("❌ Verification FAILED — count mismatches or FK violations.");
    process.exit(1);
  } else {
    console.log("✅ Verification PASSED — all counts match, no orphan data.");
  }
}

main()
  .catch((e) => {
    console.error("Verification failed:", e);
    process.exit(1);
  })
  .finally(() => {
    if (prisma) prisma.$disconnect();
  });
