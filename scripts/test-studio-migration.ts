/**
 * Studio DB Migration Readiness Test — runs against the live `data/` folder.
 *
 * Read-only: never writes, never connects to Postgres. Exits non-zero on any
 * integrity problem so `npm run studio:readiness` acts as a migration gate.
 *
 * Pure planner logic lives in `./migration-plan` and is unit-tested by
 * `tests/migration-regression.ts`.
 */
import {
  buildPlan,
  dataFilePath,
  hasAmbiguousProductSource,
  productSource,
  readJsonFile,
  type UsageDoc,
} from "./migration-plan";

/** The subset of each entity the integrity checks read. */
interface ProductRef {
  id?: string;
}
interface ScriptRef {
  id?: string;
  productProfileId?: string;
}
interface CampaignItemRef {
  day?: number;
  scriptId?: string;
}
interface CampaignRef {
  id?: string;
  items?: CampaignItemRef[];
}
interface MetricRef {
  id?: string;
  scriptId?: string;
  campaignId?: string;
}

async function run() {
  console.log("=== Studio DB Migration Readiness Test ===");

  const doc = await readJsonFile(dataFilePath("studio.json"));
  const usageDoc = await readJsonFile<UsageDoc>(dataFilePath("ai-usage.json"));

  if (!doc) {
    console.log("No Studio DB found. Exiting.");
    return;
  }

  if (hasAmbiguousProductSource(doc)) {
    console.error(
      "❌ studio.json has both `products` and `productProfiles` keys — ambiguous source."
    );
    console.error("   Remove the legacy key before migrating.");
    process.exit(1);
  }

  const usageEntries = usageDoc?.entries ?? [];
  const plan = buildPlan(doc, usageEntries);

  const products = productSource(doc) as ProductRef[];
  const scripts = (doc.scripts ?? []) as ScriptRef[];
  const campaigns = (doc.campaigns ?? []) as CampaignRef[];
  const performanceMetrics = (doc.performanceMetrics ?? []) as MetricRef[];

  console.log("\n--- Record Counts ---");
  console.log(`Products: ${plan.products}`);
  console.log(`Scripts: ${plan.scripts}`);
  console.log(`Campaigns: ${plan.campaigns}`);
  console.log(`Campaign Items: ${plan.campaignItems}`);
  console.log(`Brand Profiles: ${plan.brandProfiles}`);
  console.log(`Performance Metrics: ${plan.performanceMetrics}`);
  console.log(`Generation Jobs: ${plan.generationJobs}`);
  console.log(`AI Usage Entries: ${plan.aiUsage}`);

  let errors = 0;

  console.log("\n--- Validating Data Integrity ---");

  // Products must exist before their scripts can be imported.
  const productIds = new Set(products.map((p) => p.id));
  for (const script of scripts) {
    if (!productIds.has(script.productProfileId)) {
      console.error(
        `❌ Script ${script.id} is orphaned (Product ${script.productProfileId} not found)`
      );
      errors++;
    }
  }

  // Campaign items may reference a script; if they do, it must exist.
  const scriptIds = new Set(scripts.map((s) => s.id));
  for (const campaign of campaigns) {
    for (const item of campaign.items ?? []) {
      if (item.scriptId && !scriptIds.has(item.scriptId)) {
        console.error(
          `❌ Campaign ${campaign.id} item day ${item.day} references missing script ${item.scriptId}`
        );
        errors++;
      }
    }
  }

  // Metrics require their script; the campaign link is optional but must resolve.
  const campaignIds = new Set(campaigns.map((c) => c.id));
  for (const metric of performanceMetrics) {
    if (!scriptIds.has(metric.scriptId)) {
      console.error(
        `❌ Metric ${metric.id} references missing script ${metric.scriptId}`
      );
      errors++;
    }
    if (metric.campaignId && !campaignIds.has(metric.campaignId)) {
      console.error(
        `❌ Metric ${metric.id} references missing campaign ${metric.campaignId}`
      );
      errors++;
    }
  }

  if (errors === 0) {
    console.log("\n✅ All data validates perfectly! Ready for migration.");
  } else {
    console.error(
      `\n❌ Found ${errors} integrity issues. Please resolve before migration.`
    );
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
