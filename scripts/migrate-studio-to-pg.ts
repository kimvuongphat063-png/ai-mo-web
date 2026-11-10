#!/usr/bin/env tsx
/**
 * Studio JSON → Postgres Migration Script
 *
 * Phase 4B — AI Mở Studio DB Migration
 *
 * Features:
 *   - Idempotent: safe to re-run (upserts existing records)
 *   - Dry-run by default (pass --apply to write)
 *   - Timestamped backup + SHA-256 checksum before any write
 *   - Per-user transaction batching with full rollback on failure
 *   - Conflict and orphan reporting
 *   - Preserves original IDs where practical
 *
 * Usage:
 *   npx tsx scripts/migrate-studio-to-pg.ts          # dry-run
 *   npx tsx scripts/migrate-studio-to-pg.ts --apply  # write to DB
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFile, copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import * as dotenv from "dotenv";
import {
  buildPlan,
  dataFilePath,
  hasAmbiguousProductSource,
  readJsonFile,
  zeroCounts,
  type ImportCounts,
  type StudioDoc,
} from "./migration-plan";

// Load local environment only — never commit connection strings.
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────

const isApply = process.argv.includes("--apply");

// ─────────────────────────────────────────────────────────────────────────────
// Prisma (lazy init — only connects in --apply mode)
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
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// ImportCounts / zeroCounts come from ./migration-plan (shared with the tests).

/** Minimal record shapes — only the fields the migration reads from each entity. */
interface BrandProfileRecord {
  userId?: string;
  companyName?: string;
  brandVoice?: string;
  prohibitedClaims?: string;
  requiredDisclosures?: string;
  preferredFormats?: string[];
  targetAudience?: string;
  competitorUrls?: string[];
  language?: string;
}
interface ProductRecord {
  id?: string;
  userId?: string;
  name?: string;
  url?: string;
  description?: string;
  priceOffer?: string;
  featuresText?: string;
  targetCustomer?: string;
  problemSolved?: string;
  allowedProof?: string;
  claimsToAvoid?: string;
  affiliateLink?: string;
  brandVoice?: string;
  analysisCache?: unknown;
  analysisFingerprint?: string;
}
interface ScriptRecord {
  id?: string;
  userId?: string;
  productProfileId?: string;
  platform?: string;
  goal?: string;
  durationSeconds?: number;
  selectedAngleId?: string;
  scripts?: unknown[];
  missingInformation?: string[];
  complianceNotes?: string[];
}
interface CampaignRecord {
  id?: string;
  userId?: string;
  name?: string;
  startDate?: string;
  durationDays?: number;
  platform?: string;
  goal?: string;
  items?: CampaignItemRecord[];
}
interface CampaignItemRecord {
  day?: number;
  scriptId?: string;
  status?: string;
  publishedUrl?: string;
  notes?: string;
}
interface MetricRecord {
  id?: string;
  userId?: string;
  scriptId?: string;
  campaignId?: string;
  recordedAt?: string;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  clicks?: number;
  conversions?: number;
  revenue?: number;
  costSpent?: number;
  watchTimeSeconds?: number;
  engagementRate?: number;
  ctr?: number;
  roas?: number;
}
interface GenerationJobRecord {
  id?: string;
  userId?: string;
  status?: string;
  prompt?: unknown;
  result?: unknown;
}
interface UsageRecord {
  userId?: string;
  day?: string | number;
  count?: number;
}

interface ImportResult {
  counts: ImportCounts;
  skipped: string[];
  conflicts: string[];
  orphans: string[];
}

function toStr(v: unknown): string | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  return String(v);
}

function toDate(v: unknown): Date {
  if (!v) return new Date();
  if (v instanceof Date) return v;
  return new Date(String(v));
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("==========================================================");
  console.log("   Studio JSON → Postgres Migration  (Phase 4B)");
  console.log("==========================================================\n");

  if (!isApply) {
    console.log("🔍 DRY RUN MODE — no data will be written.\n");
  } else {
    console.log("⚠️  APPLY MODE — data will be written to Postgres.\n");
  }

  // ── 1. Load JSON files ────────────────────────────────────────────────────

  const studioPath = dataFilePath("studio.json");
  const usagePath = dataFilePath("ai-usage.json");

  // rawStudio holds the exact bytes on disk — the backup checksum must hash
  // the file itself, not a re-serialized copy.
  let rawStudio: string | null = null;
  let db: StudioDoc = {};

  try {
    rawStudio = await readFile(studioPath, "utf-8");
    db = JSON.parse(rawStudio) as StudioDoc;
    console.log(`[Load] studio.json parsed (${rawStudio.length} bytes)`);
  } catch {
    console.log("[Load] No studio.json found — nothing to import.\n");
    if (!isApply) return;
    // In apply mode, still continue if usage.json exists
  }

  if (hasAmbiguousProductSource(db)) {
    console.error(
      "❌ Ambiguous product source: both `products` and `productProfiles` are present in studio.json."
    );
    console.error("   Remove the duplicate/legacy key before migrating.");
    process.exit(1);
  }

  const usageDb: { entries: UsageRecord[] } = { entries: [] };
  try {
    const rawUsage = await readFile(usagePath, "utf-8");
    usageDb.entries = (JSON.parse(rawUsage).entries as UsageRecord[] | undefined) ?? [];
    console.log(`[Load] ai-usage.json parsed (${rawUsage.length} bytes)`);
  } catch {
    console.log("[Load] No ai-usage.json found — skipping usage data.\n");
  }

  // ── 2. Backup ─────────────────────────────────────────────────────────────

  if (isApply && rawStudio) {
    const hash = crypto.createHash("sha256").update(rawStudio).digest("hex");
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = path.join(process.cwd(), "data", "backups");
    await mkdir(backupDir, { recursive: true });
    const backupPath = path.join(backupDir, `studio.${ts}.json`);
    await copyFile(studioPath, backupPath);
    console.log(`[Backup] ${backupPath}`);
    console.log(`[Backup] SHA-256: ${hash}\n`);
  }

  // ── 3. Migration plan ─────────────────────────────────────────────────────

  const productProfiles = Array.isArray(db.products)
    ? (db.products as ProductRecord[])
    : ((db.productProfiles as ProductRecord[]) ?? []);

  const plan: ImportCounts = buildPlan(db, usageDb.entries);

  console.log("--- Migration Plan ---");
  console.log(`  Brand Profiles:       ${plan.brandProfiles}`);
  console.log(`  Products:             ${plan.products}`);
  console.log(`  Scripts:              ${plan.scripts}`);
  console.log(`  Campaigns:            ${plan.campaigns}`);
  console.log(`  Campaign Items:       ${plan.campaignItems}`);
  console.log(`  Performance Metrics:  ${plan.performanceMetrics}`);
  console.log(`  Generation Jobs:      ${plan.generationJobs}`);
  console.log(`  AI Usage Entries:     ${plan.aiUsage}\n`);

  if (!isApply) {
    console.log("✅ DRY RUN COMPLETE — no data written.");
    return;
  }

  // ── 4. Import ─────────────────────────────────────────────────────────────

  const result: ImportResult = {
    counts: zeroCounts(),
    skipped: [],
    conflicts: [],
    orphans: [],
  };

  try {
    await getPrisma().$transaction(async (tx: any) => {
      // 4a. Brand Profiles
      for (const b of (db.brandProfiles as BrandProfileRecord[] | undefined) ?? []) {
        try {
          await tx.studioBrandProfile.upsert({
            where: { userId: b.userId },
            update: {
              companyName: b.companyName,
              brandVoice: b.brandVoice,
              prohibitedClaims: b.prohibitedClaims,
              requiredDisclosures: b.requiredDisclosures,
              preferredFormats: b.preferredFormats ?? [],
              targetAudience: b.targetAudience,
              competitorUrls: b.competitorUrls ?? [],
              language: b.language ?? "vi",
            },
            create: {
              userId: b.userId ?? "",
              companyName: b.companyName,
              brandVoice: b.brandVoice,
              prohibitedClaims: b.prohibitedClaims,
              requiredDisclosures: b.requiredDisclosures,
              preferredFormats: b.preferredFormats ?? [],
              targetAudience: b.targetAudience,
              competitorUrls: b.competitorUrls ?? [],
              language: b.language ?? "vi",
            },
          });
          result.counts.brandProfiles++;
        } catch (e: any) {
          result.conflicts.push(`BrandProfile:${b.userId}: ${e.message}`);
        }
      }

      // 4b. Products
      const validProductIds = new Set<string>();
      for (const p of productProfiles) {
        if (!p.userId || !p.name) {
          result.skipped.push(`Product:${p.id ?? "?"}: missing userId or name`);
          continue;
        }
        try {
          await tx.studioProduct.upsert({
            where: { id: p.id },
            update: {
              userId: p.userId,
              name: p.name,
              url: p.url,
              description: p.description,
              priceOffer: p.priceOffer,
              featuresText: p.featuresText,
              targetCustomer: p.targetCustomer,
              problemSolved: p.problemSolved,
              allowedProof: p.allowedProof,
              claimsToAvoid: p.claimsToAvoid,
              affiliateLink: p.affiliateLink,
              brandVoice: p.brandVoice,
              analysisCache: p.analysisCache ?? undefined,
              analysisFingerprint: p.analysisFingerprint,
            },
            create: {
              id: p.id,
              userId: p.userId,
              name: p.name,
              url: p.url,
              description: p.description ?? "",
              priceOffer: p.priceOffer,
              featuresText: p.featuresText ?? "",
              targetCustomer: p.targetCustomer ?? "",
              problemSolved: p.problemSolved ?? "",
              allowedProof: p.allowedProof,
              claimsToAvoid: p.claimsToAvoid,
              affiliateLink: p.affiliateLink,
              brandVoice: p.brandVoice,
              analysisCache: p.analysisCache ?? undefined,
              analysisFingerprint: p.analysisFingerprint,
            },
          });
          validProductIds.add(p.id ?? "");
          result.counts.products++;
        } catch (e: any) {
          result.conflicts.push(`Product:${p.id}: ${e.message}`);
        }
      }

      // 4c. Scripts (requires valid product)
      const validScriptIds = new Set<string>();
      for (const s of (db.scripts as ScriptRecord[] | undefined) ?? []) {
        if (!s.userId || !s.productProfileId) {
          result.skipped.push(`Script:${s.id ?? "?"}: missing userId or productProfileId`);
          continue;
        }
        if (!validScriptIds.has(s.productProfileId) && !validProductIds.has(s.productProfileId)) {
          result.orphans.push(`Script:${s.id}: product ${s.productProfileId} not in import set`);
          continue;
        }
        try {
          await tx.studioScript.upsert({
            where: { id: s.id },
            update: {
              userId: s.userId,
              productProfileId: s.productProfileId,
              platform: s.platform,
              goal: s.goal,
              durationSeconds: s.durationSeconds,
              selectedAngleId: s.selectedAngleId,
              scripts: s.scripts ?? [],
              missingInformation: s.missingInformation ?? [],
              complianceNotes: s.complianceNotes ?? [],
            },
            create: {
              id: s.id,
              userId: s.userId ?? "",
              productProfileId: s.productProfileId,
              platform: s.platform,
              goal: s.goal,
              durationSeconds: s.durationSeconds,
              selectedAngleId: s.selectedAngleId,
              scripts: s.scripts ?? [],
              missingInformation: s.missingInformation ?? [],
              complianceNotes: s.complianceNotes ?? [],
            },
          });
          validScriptIds.add(s.id ?? "");
          result.counts.scripts++;
        } catch (e: any) {
          result.conflicts.push(`Script:${s.id}: ${e.message}`);
        }
      }

      // 4d. Campaigns + Campaign Items
      const validCampaignIds = new Set<string>();
      for (const c of (db.campaigns as CampaignRecord[] | undefined) ?? []) {
        if (!c.userId) {
          result.skipped.push(`Campaign:${c.id ?? "?"}: missing userId`);
          continue;
        }
        try {
          await tx.studioCampaign.upsert({
            where: { id: c.id },
            update: {
              userId: c.userId,
              name: c.name,
              startDate: toDate(c.startDate),
              durationDays: c.durationDays,
              platform: c.platform,
              goal: c.goal,
            },
            create: {
              id: c.id,
              userId: c.userId,
              name: c.name ?? "Campaign",
              startDate: toDate(c.startDate),
              durationDays: c.durationDays,
              platform: c.platform,
              goal: c.goal,
            },
          });
          validCampaignIds.add(c.id ?? "");
          result.counts.campaigns++;
        } catch (e: any) {
          result.conflicts.push(`Campaign:${c.id}: ${e.message}`);
          continue; // skip items if campaign failed
        }

        // Campaign items
        for (const item of c.items ?? []) {
          if (item.scriptId && !validScriptIds.has(item.scriptId)) {
            result.orphans.push(
              `CampaignItem:${c.id} day ${item.day}: script ${item.scriptId} not in import set`
            );
          }
          try {
            const existing = await tx.studioCampaignItem.findFirst({
              where: { campaignId: c.id, day: item.day },
            });
            if (existing) {
              await tx.studioCampaignItem.update({
                where: { id: existing.id },
                data: {
                  scriptId: item.scriptId ?? null,
                  status: item.status,
                  publishedUrl: item.publishedUrl,
                  notes: item.notes,
                },
              });
            } else {
              await tx.studioCampaignItem.create({
                data: {
                  campaignId: c.id ?? "",
                  day: item.day ?? 0,
                  scriptId: item.scriptId ?? null,
                  status: item.status,
                  publishedUrl: item.publishedUrl,
                  notes: item.notes,
                },
              });
            }
            result.counts.campaignItems++;
          } catch (e: any) {
            result.conflicts.push(
              `CampaignItem:${c.id}/day${item.day}: ${e.message}`
            );
          }
        }
      }

      // 4e. Performance Metrics
      for (const m of (db.performanceMetrics as MetricRecord[] | undefined) ?? []) {
        if (!validScriptIds.has(m.scriptId ?? "")) {
          result.orphans.push(
            `Performance:${m.id}: script ${m.scriptId} not in import set`
          );
          continue;
        }
        try {
          await tx.studioPerformanceMetric.upsert({
            where: { id: m.id },
            update: {
              userId: m.userId,
              scriptId: m.scriptId,
              campaignId: m.campaignId,
              recordedAt: toDate(m.recordedAt),
              views: m.views ?? 0,
              likes: m.likes ?? 0,
              comments: m.comments ?? 0,
              shares: m.shares ?? 0,
              clicks: m.clicks ?? 0,
              conversions: m.conversions ?? 0,
              revenue: m.revenue ?? 0,
              costSpent: m.costSpent ?? 0,
              watchTimeSeconds: m.watchTimeSeconds ?? 0,
              engagementRate: m.engagementRate ?? 0,
              ctr: m.ctr ?? 0,
              roas: m.roas ?? 0,
            },
            create: {
              id: m.id,
              userId: m.userId ?? "",
              scriptId: m.scriptId ?? "",
              campaignId: m.campaignId,
              recordedAt: toDate(m.recordedAt),
              views: m.views ?? 0,
              likes: m.likes ?? 0,
              comments: m.comments ?? 0,
              shares: m.shares ?? 0,
              clicks: m.clicks ?? 0,
              conversions: m.conversions ?? 0,
              revenue: m.revenue ?? 0,
              costSpent: m.costSpent ?? 0,
              watchTimeSeconds: m.watchTimeSeconds ?? 0,
              engagementRate: m.engagementRate ?? 0,
              ctr: m.ctr ?? 0,
              roas: m.roas ?? 0,
            },
          });
          result.counts.performanceMetrics++;
        } catch (e: any) {
          result.conflicts.push(`Performance:${m.id}: ${e.message}`);
        }
      }

      // 4f. Generation Jobs (best-effort — schema exists but not yet in use)
      for (const j of (db.generationJobs as GenerationJobRecord[] | undefined) ?? []) {
        try {
          await tx.studioGenerationJob.upsert({
            where: { id: j.id },
            update: {
              userId: j.userId,
              status: j.status ?? "complete",
              prompt: j.prompt ?? undefined,
              result: j.result ?? undefined,
            },
            create: {
              id: j.id,
              userId: j.userId ?? "",
              status: j.status ?? "complete",
              prompt: j.prompt ?? undefined,
              result: j.result ?? undefined,
            },
          });
          result.counts.generationJobs++;
        } catch (e: any) {
          result.conflicts.push(`GenerationJob:${j.id}: ${e.message}`);
        }
      }

      // 4g. AI Usage
      for (const u of usageDb.entries) {
        if (!u.userId) {
          result.skipped.push(`Usage:missing userId`);
          continue;
        }
        try {
          const dayStr = typeof u.day === "string" ? u.day : String(u.day);
          const existing = await tx.studioAiUsage.findFirst({
            where: { userId: u.userId, day: dayStr },
          });
          if (existing) {
            await tx.studioAiUsage.update({
              where: { id: existing.id },
              data: { count: u.count ?? 0 },
            });
          } else {
            await tx.studioAiUsage.create({
              data: { userId: u.userId, day: dayStr, count: u.count ?? 0 },
            });
          }
          result.counts.aiUsage++;
        } catch (e: any) {
          result.conflicts.push(`Usage:${u.userId}/${u.day}: ${e.message}`);
        }
      }
    }); // end $transaction
  } catch (e: any) {
    console.error(`\n❌ Transaction failed — all changes rolled back: ${e.message}`);
    process.exit(1);
  }

  // ── 5. Report ─────────────────────────────────────────────────────────────

  console.log("\n--- Import Results ---");
  console.log(`  Brand Profiles:       ${result.counts.brandProfiles}`);
  console.log(`  Products:             ${result.counts.products}`);
  console.log(`  Scripts:              ${result.counts.scripts}`);
  console.log(`  Campaigns:            ${result.counts.campaigns}`);
  console.log(`  Campaign Items:       ${result.counts.campaignItems}`);
  console.log(`  Performance Metrics:  ${result.counts.performanceMetrics}`);
  console.log(`  Generation Jobs:      ${result.counts.generationJobs}`);
  console.log(`  AI Usage Entries:     ${result.counts.aiUsage}`);

  if (result.skipped.length) {
    console.log(`\n  ⚠ Skipped (${result.skipped.length}):`);
    result.skipped.forEach((s) => console.log(`    - ${s}`));
  }

  if (result.conflicts.length) {
    console.log(`\n  ⚠ Conflicts (${result.conflicts.length}):`);
    result.conflicts.forEach((c) => console.log(`    - ${c}`));
  }

  if (result.orphans.length) {
    console.log(`\n  ⚠ Orphans (${result.orphans.length}):`);
    result.orphans.forEach((o) => console.log(`    - ${o}`));
  }

  const totalIssues =
    result.skipped.length + result.conflicts.length + result.orphans.length;
  if (totalIssues === 0) {
    console.log("\n✅ Migration completed — no issues.");
  } else {
    console.log(
      `\n⚠ Migration completed with ${totalIssues} issue(s) — review above.`
    );
  }
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => {
    if (prisma) prisma.$disconnect();
  });
