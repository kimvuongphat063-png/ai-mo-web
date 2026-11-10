#!/usr/bin/env tsx
/**
 * Read-only orphan audit for the Studio Postgres tables.
 *
 * Phase 4C Remediation — diagnostic. Makes NO writes; safe to run against
 * staging at any time. Reports, per entity:
 *   - live vs soft-deleted counts
 *   - campaign items whose campaign or script is missing / soft-deleted
 *   - performance metrics whose script or campaign is missing / soft-deleted
 *   - leftover test-prefixed rows (`acc-`, `smoke-`, `staging-smoke-`, …)
 *
 * Exit code 1 when any orphan or leftover fixture is found, so it can be used
 * as a gate in CI or after an acceptance run.
 *
 * Usage:
 *   npx tsx scripts/pg-audit-orphans.ts
 */

import path from "node:path";
import * as dotenv from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { preflightGuard } from "./preflight";
import { TEST_PREFIXES } from "./test-fixture-policy";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

/* eslint-disable @typescript-eslint/no-explicit-any -- Prisma boundary */
let prisma: any = null;
function getPrisma() {
  if (!prisma) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      console.error("DATABASE_URL is not set — cannot audit Postgres.");
      process.exit(1);
    }
    prisma = new (PrismaClient as any)({ adapter: new PrismaPg({ connectionString: url }) });
  }
  return prisma;
}

export interface AuditReport {
  orphanCampaignItems: { id: string; campaignId: string; scriptId: string | null; reason: string }[];
  orphanMetrics: { id: string; scriptId: string; campaignId: string | null; reason: string }[];
  leftoverProducts: { id: string; name: string; deletedAt: Date | null }[];
  leftoverCampaigns: { id: string; name: string; deletedAt: Date | null }[];
  counts: Record<string, { live: number; softDeleted?: number }>;
}

export async function auditOrphans(db: any): Promise<AuditReport> {
  const liveScripts: any[] = await db.studioScript.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });
  const liveScriptIds = new Set(liveScripts.map((s) => s.id));

  const liveCampaigns: any[] = await db.studioCampaign.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });
  const liveCampaignIds = new Set(liveCampaigns.map((c) => c.id));

  const items: any[] = await db.studioCampaignItem.findMany({
    select: { id: true, campaignId: true, scriptId: true, status: true },
  });
  const orphanCampaignItems: AuditReport["orphanCampaignItems"] = [];
  for (const item of items) {
    const reasons: string[] = [];
    if (!liveCampaignIds.has(item.campaignId)) reasons.push("campaign missing/soft-deleted");
    if (item.scriptId && !liveScriptIds.has(item.scriptId)) reasons.push("script missing/soft-deleted");
    if (reasons.length > 0) {
      orphanCampaignItems.push({
        id: item.id,
        campaignId: item.campaignId,
        scriptId: item.scriptId ?? null,
        reason: reasons.join(" + "),
      });
    }
  }

  const metrics: any[] = await db.studioPerformanceMetric.findMany({
    select: { id: true, scriptId: true, campaignId: true },
  });
  const orphanMetrics: AuditReport["orphanMetrics"] = [];
  for (const m of metrics) {
    const reasons: string[] = [];
    if (!liveScriptIds.has(m.scriptId)) reasons.push("script missing/soft-deleted");
    if (m.campaignId && !liveCampaignIds.has(m.campaignId)) reasons.push("campaign missing/soft-deleted");
    if (reasons.length > 0) {
      orphanMetrics.push({
        id: m.id,
        scriptId: m.scriptId,
        campaignId: m.campaignId ?? null,
        reason: reasons.join(" + "),
      });
    }
  }

  const prefixFilter = { OR: TEST_PREFIXES.map((p) => ({ name: { startsWith: p } })) };
  const leftoverProducts: any[] = await db.studioProduct.findMany({
    where: prefixFilter,
    select: { id: true, name: true, deletedAt: true },
  });
  const leftoverCampaigns: any[] = await db.studioCampaign.findMany({
    where: prefixFilter,
    select: { id: true, name: true, deletedAt: true },
  });

  const counts = {
    brandProfiles: { live: await db.studioBrandProfile.count() },
    products: {
      live: await db.studioProduct.count({ where: { deletedAt: null } }),
      softDeleted: await db.studioProduct.count({ where: { deletedAt: { not: null } } }),
    },
    scripts: {
      live: await db.studioScript.count({ where: { deletedAt: null } }),
      softDeleted: await db.studioScript.count({ where: { deletedAt: { not: null } } }),
    },
    campaigns: {
      live: await db.studioCampaign.count({ where: { deletedAt: null } }),
      softDeleted: await db.studioCampaign.count({ where: { deletedAt: { not: null } } }),
    },
    campaignItems: { live: items.length },
    performanceMetrics: { live: metrics.length },
    aiUsage: { live: await db.studioAiUsage.count() },
    generationJobs: { live: await db.studioGenerationJob.count() },
  };

  return { orphanCampaignItems, orphanMetrics, leftoverProducts, leftoverCampaigns, counts };
}

async function main() {
  await preflightGuard({ requireStudio: true });
  console.log("==========================================================");
  console.log("   Studio Postgres orphan audit (read-only)");
  console.log("==========================================================\n");

  const db = getPrisma();
  const report = await auditOrphans(db);

  console.log("--- Counts ---");
  for (const [entity, c] of Object.entries(report.counts)) {
    const extra = c.softDeleted !== undefined ? `  (soft-deleted ${c.softDeleted})` : "";
    console.log(`  ${entity.padEnd(20)} live=${String(c.live).padStart(4)}${extra}`);
  }

  console.log("\n--- Orphan campaign items ---");
  if (report.orphanCampaignItems.length === 0) console.log("  none ✅");
  for (const o of report.orphanCampaignItems) {
    console.log(`  ❌ item ${o.id} campaign=${o.campaignId} script=${o.scriptId} — ${o.reason}`);
  }

  console.log("\n--- Orphan performance metrics ---");
  if (report.orphanMetrics.length === 0) console.log("  none ✅");
  for (const o of report.orphanMetrics) {
    console.log(`  ❌ metric ${o.id} script=${o.scriptId} campaign=${o.campaignId} — ${o.reason}`);
  }

  console.log("\n--- Leftover test-prefixed rows ---");
  const leftovers = [...report.leftoverProducts, ...report.leftoverCampaigns];
  if (leftovers.length === 0) console.log("  none ✅");
  for (const p of report.leftoverProducts) {
    console.log(`  ⚠ product  ${p.name} (${p.id}) deleted=${p.deletedAt ? "yes" : "NO"}`);
  }
  for (const c of report.leftoverCampaigns) {
    console.log(`  ⚠ campaign ${c.name} (${c.id}) deleted=${c.deletedAt ? "yes" : "NO"}`);
  }

  const bad =
    report.orphanCampaignItems.length + report.orphanMetrics.length + leftovers.length;
  console.log(`\n${bad === 0 ? "✅ CLEAN" : `❌ ${bad} issue(s)`}`);
  if (bad > 0) process.exitCode = 1;
}

if (process.argv[1] && process.argv[1].includes("pg-audit-orphans")) {
  main()
    .catch((e) => {
      console.error("Audit failed:", e);
      process.exit(1);
    })
    .finally(() => {
      if (prisma) prisma.$disconnect();
    });
}
