/**
 * Studio migration planner — pure logic shared by the migration scripts and
 * the readiness/regression tests.
 *
 * This module must stay dependency-free (no prisma, no fs, no server-only) so
 * both the scripts (`npx tsx scripts/...`) and the plain-tsx test runner
 * (`npm run studio:readiness`) can import it.
 */
import path from "node:path";

/**
 * Entity counts describing both the JSON source and the Postgres target.
 * Keys match the models in `prisma/schema.prisma`.
 */
export interface ImportCounts {
  brandProfiles: number;
  products: number;
  scripts: number;
  campaigns: number;
  campaignItems: number;
  performanceMetrics: number;
  generationJobs: number;
  aiUsage: number;
}

export function zeroCounts(): ImportCounts {
  return {
    brandProfiles: 0,
    products: 0,
    scripts: 0,
    campaigns: 0,
    campaignItems: 0,
    performanceMetrics: 0,
    generationJobs: 0,
    aiUsage: 0,
  };
}

/**
 * A loaded studio JSON document. Only the keys the planner reads are typed;
 * the rest stay `unknown` so tests can exercise both naming conventions.
 */
export interface StudioDoc {
  version?: unknown;
  updatedAt?: unknown;
  products?: unknown[];
  productProfiles?: unknown[];
  scripts?: unknown[];
  campaigns?: unknown[];
  brandProfiles?: unknown[];
  performanceMetrics?: unknown[];
  generationJobs?: unknown[];
}

/** An integer day-indexed campaign item — only the fields the planner reads. */
interface CampaignLike {
  items?: unknown[];
}

/**
 * True when the loaded document carries both the current `products` key and
 * the legacy `productProfiles` key. Importing from an ambiguous source would
 * silently drop one of them, so callers must fail loudly instead.
 */
export function hasAmbiguousProductSource(doc: StudioDoc): boolean {
  return "products" in doc && "productProfiles" in doc;
}

/**
 * The resolved product list (current `products` key wins, falls back to the
 * legacy `productProfiles` key). Callers must check
 * {@link hasAmbiguousProductSource} first.
 */
export function productSource(doc: StudioDoc): unknown[] {
  return doc.products ?? doc.productProfiles ?? [];
}

/**
 * Build the full migration plan from a loaded studio doc.
 *
 * Throws when the doc carries both `products` and `productProfiles`: picking
 * one silently would drop the other, so the caller must resolve it first.
 */
export function buildPlan(studio: StudioDoc, usageEntries: unknown[] = []): ImportCounts {
  if (hasAmbiguousProductSource(studio)) {
    throw new Error(
      "Ambiguous product source: studio.json has both `products` and " +
        "`productProfiles`. Remove the legacy key before migrating."
    );
  }

  const campaigns = Array.isArray(studio.campaigns) ? studio.campaigns : [];

  const plan = zeroCounts();
  plan.brandProfiles = Array.isArray(studio.brandProfiles)
    ? studio.brandProfiles.length
    : 0;
  plan.products = productSource(studio).length;
  plan.scripts = Array.isArray(studio.scripts) ? studio.scripts.length : 0;
  plan.campaigns = campaigns.length;
  plan.campaignItems = campaigns.reduce(
    (n: number, c: unknown) => n + (isCampaignLike(c) ? (c.items?.length ?? 0) : 0),
    0
  );
  plan.performanceMetrics = Array.isArray(studio.performanceMetrics)
    ? studio.performanceMetrics.length
    : 0;
  plan.generationJobs = Array.isArray(studio.generationJobs)
    ? studio.generationJobs.length
    : 0;
  plan.aiUsage = Array.isArray(usageEntries) ? usageEntries.length : 0;
  return plan;
}

function isCampaignLike(value: unknown): value is CampaignLike {
  return typeof value === "object" && value !== null && "items" in value;
}

/** The ai-usage.json shape — a flat list of per-user/per-day counters. */
export interface UsageDoc {
  entries?: unknown[];
}

/** Parse a .json file path (utf-8). Returns null when the file is missing. */
export async function readJsonFile<T = StudioDoc>(
  filePath: string
): Promise<T | null> {
  const { readFile } = await import("node:fs/promises");
  try {
    return JSON.parse(await readFile(filePath, "utf-8")) as T;
  } catch {
    return null;
  }
}

/** Absolute path to a JSON data file under the current working directory. */
export function dataFilePath(name: `${string}.json`): string {
  return path.join(process.cwd(), "data", name);
}