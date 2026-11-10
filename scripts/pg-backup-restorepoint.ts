#!/usr/bin/env tsx
/**
 * Postgres Restore-Point Script — Phase 4C
 *
 * Creates a timestamped JSON snapshot of ALL studio* tables from Postgres.
 * This is the safety net before cutover: if anything goes wrong, re-import
 * from this snapshot using the migration script's upsert logic.
 *
 * Usage:
 *   npx tsx scripts/pg-backup-restorepoint.ts
 *
 * Output:
 *   backups/pg-restore-point-<YYYY-MM-DDTHHmmss>.json
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Prisma boundary: the generated client types don't expose the adapter-
// constructor overload used here, so the boundary is typed `any` (same pattern
// as migrate-studio-to-pg.ts / verify-studio-pg.ts).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let prisma: any = null;
function getPrisma() {
  if (!prisma) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      console.error("DATABASE_URL is not set. Cannot connect to Postgres.");
      process.exit(1);
    }
    const adapter = new PrismaPg({ connectionString: url });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prisma = new (PrismaClient as any)({ adapter });
  }
  return prisma;
}

async function main() {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(process.cwd(), "backups");
  await mkdir(backupDir, { recursive: true });

  const db = getPrisma();

  console.log("==========================================================");
  console.log(`   Postgres Restore-Point — ${new Date().toISOString()}`);
  console.log("==========================================================\n");

  // Read all studio* tables
  const [
    brandProfiles,
    products,
    scripts,
    campaigns,
    campaignItems,
    performanceMetrics,
    generationJobs,
    aiUsage,
  ] = await Promise.all([
    db.studioBrandProfile.findMany(),
    db.studioProduct.findMany(),
    db.studioScript.findMany(),
    db.studioCampaign.findMany({ include: { items: true } }),
    db.studioCampaignItem.findMany(),
    db.studioPerformanceMetric.findMany(),
    db.studioGenerationJob.findMany(),
    db.studioAiUsage.findMany(),
  ]);

  const snapshot = {
    _meta: {
      createdAt: new Date().toISOString(),
      description: "Phase 4C Postgres restore-point",
      reason: "Pre-cutover snapshot before STUDIO_STORAGE runtime verification",
    },
    brandProfiles: brandProfiles.length,
    products: products.length,
    scripts: scripts.length,
    campaigns: campaigns.length,
    campaignItems: campaignItems.length,
    performanceMetrics: performanceMetrics.length,
    generationJobs: generationJobs.length,
    aiUsage: aiUsage.length,
    data: {
      brandProfiles,
      products,
      scripts,
      campaigns,
      campaignItems,
      performanceMetrics,
      generationJobs,
      aiUsage,
    },
  };

  const backupPath = path.join(backupDir, `pg-restore-point-${ts}.json`);
  await writeFile(backupPath, JSON.stringify(snapshot, null, 2), "utf-8");

  console.log("--- Restore-Point Created ---\n");
  console.log(`  File:               ${backupPath}`);
  console.log(`  Brand Profiles:     ${brandProfiles.length}`);
  console.log(`  Products:           ${products.length}`);
  console.log(`  Scripts:            ${scripts.length}`);
  console.log(`  Campaigns:          ${campaigns.length}`);
  console.log(`  Campaign Items:     ${campaignItems.length}`);
  console.log(`  Performance Metrics:${performanceMetrics.length}`);
  console.log(`  Generation Jobs:    ${generationJobs.length}`);
  console.log(`  AI Usage Entries:   ${aiUsage.length}`);
  console.log("\n✅ Restore-point snapshot written successfully.");
}

main()
  .catch((e) => {
    console.error("Restore-point failed:", e);
    process.exit(1);
  })
  .finally(() => {
    if (prisma) prisma.$disconnect();
  });
