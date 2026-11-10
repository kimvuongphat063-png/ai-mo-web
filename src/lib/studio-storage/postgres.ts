import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  ProductProfile,
  Script,
  Campaign,
  CampaignItem,
  BrandProfile,
  PerformanceMetric,
  StudioConflictError,
  CampaignDayPatch
} from "../studio";
import { UNSCHEDULED_STATUS } from "./delete-policy";

let cachedPrisma: any = null;
function getPrisma() {
  if (!cachedPrisma) {
    const url = process.env.DATABASE_URL;
    const adapter = url ? new PrismaPg({ connectionString: url }) : undefined;
    cachedPrisma = new (PrismaClient as any)(adapter ? { adapter } : {});
  }
  return cachedPrisma;
}

// ─────────────────────────────────────────────────────────────────────────────
// Products
// ─────────────────────────────────────────────────────────────────────────────

export async function listProducts(userId: string): Promise<ProductProfile[]> {
  const db = getPrisma();
  const products = await db.studioProduct.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return products.map(mapProduct);
}

export async function getProduct(userId: string, id: string): Promise<ProductProfile | null> {
  const db = getPrisma();
  const product = await db.studioProduct.findFirst({
    where: { id, userId, deletedAt: null },
  });
  return product ? mapProduct(product) : null;
}

export async function createProduct(
  userId: string,
  input: Omit<ProductProfile, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<ProductProfile> {
  const db = getPrisma();
  const product = await db.studioProduct.create({
    data: {
      ...input,
      userId,
      analysisCache: input.analysisCache ?? null,
      analysisFingerprint: input.analysisFingerprint ?? null,
    },
  });
  return mapProduct(product);
}

export async function updateProduct(
  userId: string,
  id: string,
  input: Partial<Omit<ProductProfile, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<ProductProfile | null> {
  const db = getPrisma();
  const existing = await db.studioProduct.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!existing) return null;

  const product = await db.studioProduct.update({
    where: { id },
    data: {
      ...input,
      analysisCache: input.analysisCache !== undefined ? input.analysisCache : existing.analysisCache,
      analysisFingerprint: input.analysisFingerprint !== undefined ? input.analysisFingerprint : existing.analysisFingerprint,
    },
  });
  return mapProduct(product);
}

export async function deleteProduct(userId: string, id: string): Promise<boolean> {
  const db = getPrisma();
  const existing = await db.studioProduct.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!existing) return false;

  // Cascade: deleting a product removes its scripts, which in turn detach their
  // campaign items and cascade their performance metrics (policy in
  // delete-policy.ts). Schema intent: StudioScript.product onDelete: Cascade.
  // Wrapped in a transaction so a partial failure cannot leave orphan refs.
  const scripts = await db.studioScript.findMany({
    where: { productProfileId: id, userId, deletedAt: null },
    select: { id: true },
  });
  const scriptIds = scripts.map((s: any) => s.id);

  await db.$transaction(async (tx: any) => {
    if (scriptIds.length > 0) {
      // Detach campaign items referencing any of these scripts.
      await tx.studioCampaignItem.updateMany({
        where: { scriptId: { in: scriptIds } },
        data: { scriptId: null, status: UNSCHEDULED_STATUS },
      });
      // Cascade performance metrics of these scripts (metrics die with their script).
      await tx.studioPerformanceMetric.deleteMany({
        where: { scriptId: { in: scriptIds } },
      });
      // Soft-delete the scripts themselves.
      await tx.studioScript.updateMany({
        where: { id: { in: scriptIds } },
        data: { deletedAt: new Date() },
      });
    }
    await tx.studioProduct.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  });
  return true;
}

function mapProduct(p: any): ProductProfile {
  return {
    id: p.id,
    userId: p.userId,
    name: p.name,
    url: p.url ?? undefined,
    description: p.description,
    priceOffer: p.priceOffer ?? undefined,
    featuresText: p.featuresText,
    targetCustomer: p.targetCustomer,
    problemSolved: p.problemSolved,
    allowedProof: p.allowedProof ?? undefined,
    claimsToAvoid: p.claimsToAvoid ?? undefined,
    affiliateLink: p.affiliateLink ?? undefined,
    brandVoice: p.brandVoice ?? undefined,
    analysisCache: p.analysisCache ?? undefined,
    analysisFingerprint: p.analysisFingerprint ?? undefined,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Scripts
// ─────────────────────────────────────────────────────────────────────────────

export async function listScripts(userId: string): Promise<Script[]> {
  const db = getPrisma();
  const scripts = await db.studioScript.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return scripts.map(mapScript);
}

export async function getScript(userId: string, id: string): Promise<Script | null> {
  const db = getPrisma();
  const script = await db.studioScript.findFirst({
    where: { id, userId, deletedAt: null },
  });
  return script ? mapScript(script) : null;
}

export async function createScript(
  userId: string,
  input: Omit<Script, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<Script> {
  const db = getPrisma();
  const script = await db.studioScript.create({
    data: {
      userId,
      productProfileId: input.productProfileId,
      platform: input.platform,
      goal: input.goal,
      durationSeconds: input.durationSeconds,
      selectedAngleId: input.selectedAngleId,
      scripts: input.scripts as any,
      missingInformation: input.missingInformation,
      complianceNotes: input.complianceNotes,
    },
  });
  return mapScript(script);
}

export async function updateScript(
  userId: string,
  id: string,
  input: Partial<Omit<Script, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<Script | null> {
  const db = getPrisma();
  const existing = await db.studioScript.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!existing) return null;

  const script = await db.studioScript.update({
    where: { id },
    data: {
      ...input,
      scripts: input.scripts ? (input.scripts as any) : undefined,
    },
  });
  return mapScript(script);
}

export async function deleteScript(userId: string, id: string): Promise<boolean> {
  const db = getPrisma();
  const existing = await db.studioScript.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!existing) return false;

  // Policy (delete-policy.ts): detach campaign items (the day slot survives,
  // unscheduled), cascade the script's performance metrics. Transactional so a
  // partial failure cannot leave orphan refs.
  await db.$transaction(async (tx: any) => {
    await tx.studioCampaignItem.updateMany({
      where: { scriptId: id },
      data: { scriptId: null, status: UNSCHEDULED_STATUS },
    });
    await tx.studioPerformanceMetric.deleteMany({
      where: { scriptId: id },
    });
    await tx.studioScript.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  });
  return true;
}

function mapScript(s: any): Script {
  return {
    id: s.id,
    userId: s.userId,
    productProfileId: s.productProfileId,
    platform: s.platform,
    goal: s.goal,
    durationSeconds: s.durationSeconds,
    selectedAngleId: s.selectedAngleId,
    scripts: s.scripts,
    missingInformation: s.missingInformation,
    complianceNotes: s.complianceNotes,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Campaigns
// ─────────────────────────────────────────────────────────────────────────────

export async function listCampaigns(userId: string): Promise<Campaign[]> {
  const db = getPrisma();
  const campaigns = await db.studioCampaign.findMany({
    where: { userId, deletedAt: null },
    include: { items: { orderBy: { day: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  return campaigns.map(mapCampaign);
}

export async function getCampaign(userId: string, id: string): Promise<Campaign | null> {
  const db = getPrisma();
  const campaign = await db.studioCampaign.findFirst({
    where: { id, userId, deletedAt: null },
    include: { items: { orderBy: { day: "asc" } } },
  });
  return campaign ? mapCampaign(campaign) : null;
}

export async function createCampaign(
  userId: string,
  input: Omit<Campaign, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<Campaign> {
  const db = getPrisma();
  const campaign = await db.studioCampaign.create({
    data: {
      userId,
      name: input.name,
      startDate: new Date(input.startDate),
      durationDays: input.durationDays,
      platform: input.platform,
      goal: input.goal,
      items: {
        create: input.items.map((i) => ({
          day: i.day,
          scriptId: i.scriptId,
          status: i.status,
          publishedUrl: i.publishedUrl,
          notes: i.notes,
        })),
      },
    },
    include: { items: true },
  });
  return mapCampaign(campaign);
}

export async function updateCampaign(
  userId: string,
  id: string,
  input: Partial<Omit<Campaign, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<Campaign | null> {
  const db = getPrisma();
  const existing = await db.studioCampaign.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!existing) return null;

  const campaign = await db.studioCampaign.update({
    where: { id },
    data: {
      name: input.name,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      durationDays: input.durationDays,
      platform: input.platform,
      goal: input.goal,
    },
    include: { items: { orderBy: { day: "asc" } } },
  });
  return mapCampaign(campaign);
}

export async function updateCampaignDay(
  userId: string,
  campaignId: string,
  day: number,
  patch: CampaignDayPatch
): Promise<Campaign> {
  const db = getPrisma();
  
  const existing = await db.studioCampaign.findFirst({
    where: { id: campaignId, userId, deletedAt: null },
    include: { items: true },
  });
  
  if (!existing) {
    throw new StudioConflictError("not_found", "Không tìm thấy chiến dịch");
  }

  const currentItem = existing.items.find((i: any) => i.day === day);
  if (!currentItem) {
    throw new StudioConflictError("day_not_found", `Không có ngày ${day} trong chiến dịch`);
  }

  let nextScriptId = currentItem.scriptId;
  if (patch.scriptId !== undefined) {
    if (patch.scriptId === null || patch.scriptId === "") {
      nextScriptId = null;
    } else {
      const ownedScript = await db.studioScript.findFirst({
        where: { id: patch.scriptId, userId, deletedAt: null },
      });
      if (!ownedScript) {
        throw new StudioConflictError("script_not_found", "Kịch bản không tồn tại hoặc không thuộc về bạn");
      }
      nextScriptId = patch.scriptId;
    }
  }

  if (nextScriptId) {
    const sameDayDupes = existing.items.filter((i: any) => i.day === day && i.scriptId === nextScriptId);
    if (sameDayDupes.length > 1 || (sameDayDupes.length === 1 && sameDayDupes[0].id !== currentItem.id)) {
      throw new StudioConflictError("duplicate_script_day", "Kịch bản đã được gán cho ngày này");
    }
  }

  await db.studioCampaignItem.update({
    where: { id: currentItem.id },
    data: {
      scriptId: nextScriptId,
      status: patch.status,
      publishedUrl: patch.publishedUrl !== undefined ? patch.publishedUrl : undefined,
      notes: patch.notes !== undefined ? patch.notes : undefined,
    },
  });

  const updatedCampaign = await db.studioCampaign.findUnique({
    where: { id: campaignId },
    include: { items: { orderBy: { day: "asc" } } },
  });
  return mapCampaign(updatedCampaign);
}

export async function deleteCampaign(userId: string, id: string): Promise<boolean> {
  const db = getPrisma();
  const existing = await db.studioCampaign.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!existing) return false;

  // Policy (delete-policy.ts): campaign items are children of the campaign and
  // are removed with it; performance metrics detach (campaignId = null) so the
  // measurement survives without its grouping. Transactional so a partial
  // failure cannot leave orphan refs.
  await db.$transaction(async (tx: any) => {
    await tx.studioPerformanceMetric.updateMany({
      where: { campaignId: id },
      data: { campaignId: null },
    });
    await tx.studioCampaignItem.deleteMany({
      where: { campaignId: id },
    });
    await tx.studioCampaign.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  });
  return true;
}

function mapCampaign(c: any): Campaign {
  return {
    id: c.id,
    userId: c.userId,
    name: c.name,
    startDate: c.startDate.toISOString(),
    durationDays: c.durationDays as any,
    platform: c.platform,
    goal: c.goal,
    items: c.items.map((i: any) => ({
      day: i.day,
      scriptId: i.scriptId ?? undefined,
      status: i.status,
      publishedUrl: i.publishedUrl ?? undefined,
      notes: i.notes ?? undefined,
    })),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Brand Profile
// ─────────────────────────────────────────────────────────────────────────────

export async function getBrandProfile(userId: string): Promise<BrandProfile | null> {
  const db = getPrisma();
  const profile = await db.studioBrandProfile.findUnique({
    where: { userId },
  });
  return profile ? mapBrandProfile(profile) : null;
}

export async function upsertBrandProfile(
  userId: string,
  input: Omit<BrandProfile, "userId" | "updatedAt">
): Promise<BrandProfile> {
  const db = getPrisma();
  const profile = await db.studioBrandProfile.upsert({
    where: { userId },
    update: {
      ...input,
    },
    create: {
      userId,
      ...input,
    },
  });
  return mapBrandProfile(profile);
}

function mapBrandProfile(b: any): BrandProfile {
  return {
    userId: b.userId,
    companyName: b.companyName ?? undefined,
    brandVoice: b.brandVoice ?? undefined,
    prohibitedClaims: b.prohibitedClaims ?? undefined,
    requiredDisclosures: b.requiredDisclosures ?? undefined,
    preferredFormats: b.preferredFormats,
    targetAudience: b.targetAudience ?? undefined,
    competitorUrls: b.competitorUrls,
    language: b.language,
    updatedAt: b.updatedAt.toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Performance Metrics
// ─────────────────────────────────────────────────────────────────────────────

export async function listPerformanceMetrics(
  userId: string,
  filters?: { scriptId?: string; campaignId?: string }
): Promise<PerformanceMetric[]> {
  const db = getPrisma();
  const metrics = await db.studioPerformanceMetric.findMany({
    where: {
      userId,
      ...(filters?.scriptId && { scriptId: filters.scriptId }),
      ...(filters?.campaignId && { campaignId: filters.campaignId }),
    },
    orderBy: { recordedAt: "desc" },
  });
  return metrics.map(mapPerformanceMetric);
}

export async function createPerformanceMetric(
  userId: string,
  input: Omit<PerformanceMetric, "id" | "userId">
): Promise<PerformanceMetric> {
  const db = getPrisma();
  const metric = await db.studioPerformanceMetric.create({
    data: {
      ...input,
      recordedAt: new Date(input.recordedAt),
      userId,
    },
  });
  return mapPerformanceMetric(metric);
}

function mapPerformanceMetric(m: any): PerformanceMetric {
  return {
    id: m.id,
    userId: m.userId,
    scriptId: m.scriptId,
    campaignId: m.campaignId ?? undefined,
    recordedAt: m.recordedAt.toISOString(),
    views: m.views,
    likes: m.likes,
    comments: m.comments,
    shares: m.shares,
    clicks: m.clicks,
    conversions: m.conversions,
    revenue: m.revenue,
    costSpent: m.costSpent,
    watchTimeSeconds: m.watchTimeSeconds,
    engagementRate: m.engagementRate,
    ctr: m.ctr,
    roas: m.roas,
  };
}
