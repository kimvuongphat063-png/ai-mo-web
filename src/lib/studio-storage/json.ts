import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import {
  ProductProfile,
  Script,
  Campaign,
  CampaignItem,
  BrandProfile,
  PerformanceMetric,
  StudioDb,
  StudioConflictError,
  CampaignDayPatch,
  studioDbSchema,
  productProfileSchema,
  scriptSchema,
  campaignSchema,
  campaignItemSchema,
  brandProfileSchema,
  performanceMetricSchema
} from "../studio";
import {
  cascadeDeleteCampaign,
  cascadeDeleteProduct,
  cascadeDeleteScript,
} from "./delete-cascade";

const studioPath = path.join(process.cwd(), "data", "studio.json");

let writeQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const operation = writeQueue.then(task, task);
  writeQueue = operation.catch(() => undefined);
  return operation;
}

async function readStudioDb(): Promise<StudioDb> {
  try {
    const raw = await readFile(studioPath, "utf-8");
    return studioDbSchema.parse(JSON.parse(raw));
  } catch {
    return {
      products: [],
      scripts: [],
      campaigns: [],
      brandProfiles: [],
      performanceMetrics: [],
      updatedAt: new Date().toISOString(),
    };
  }
}

async function persistStudioDb(value: StudioDb): Promise<StudioDb> {
  const validated = studioDbSchema.parse({
    ...value,
    updatedAt: new Date().toISOString(),
  });

  await mkdir(path.dirname(studioPath), { recursive: true });
  const temp = `${studioPath}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(validated, null, 2), { flag: "wx" });
  await rename(temp, studioPath);

  return validated;
}

export async function listProducts(userId: string): Promise<ProductProfile[]> {
  const db = await readStudioDb();
  return db.products.filter((p) => p.userId === userId);
}

export async function getProduct(userId: string, id: string): Promise<ProductProfile | null> {
  const db = await readStudioDb();
  const found = db.products.find((p) => p.id === id && p.userId === userId);
  return found ?? null;
}

export async function createProduct(
  userId: string,
  input: Omit<ProductProfile, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<ProductProfile> {
  return enqueue(async () => {
    const db = await readStudioDb();
    const now = new Date().toISOString();
    const product: ProductProfile = {
      ...input,
      id: randomUUID(),
      userId,
      createdAt: now,
      updatedAt: now,
    };
    productProfileSchema.parse(product);
    db.products.push(product);
    await persistStudioDb(db);
    return product;
  });
}

export async function updateProduct(
  userId: string,
  id: string,
  input: Partial<Omit<ProductProfile, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<ProductProfile | null> {
  return enqueue(async () => {
    const db = await readStudioDb();
    const index = db.products.findIndex((p) => p.id === id && p.userId === userId);
    if (index === -1) return null;

    const updated: ProductProfile = {
      ...db.products[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    productProfileSchema.parse(updated);
    db.products[index] = updated;
    await persistStudioDb(db);
    return updated;
  });
}

export async function deleteProduct(userId: string, id: string): Promise<boolean> {
  return enqueue(async () => {
    const db = await readStudioDb();
    const index = db.products.findIndex((p) => p.id === id && p.userId === userId);
    if (index === -1) return false;

    // Cascade via the shared policy (delete-cascade.ts): a product's scripts go
    // with it, and each removed script detaches its campaign items and cascades
    // its metrics.
    const result = cascadeDeleteProduct(
      { scripts: db.scripts, campaigns: db.campaigns, performanceMetrics: db.performanceMetrics },
      id,
      userId
    );
    db.campaigns = result.campaigns;
    db.performanceMetrics = result.performanceMetrics;
    const removed = new Set(result.removedScriptIds);
    db.scripts = db.scripts.filter((s) => !removed.has(s.id));

    db.products.splice(index, 1);
    await persistStudioDb(db);
    return true;
  });
}

export async function listScripts(userId: string): Promise<Script[]> {
  const db = await readStudioDb();
  return db.scripts.filter((s) => s.userId === userId);
}

export async function getScript(userId: string, id: string): Promise<Script | null> {
  const db = await readStudioDb();
  const found = db.scripts.find((s) => s.id === id && s.userId === userId);
  return found ?? null;
}

export async function createScript(
  userId: string,
  input: Omit<Script, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<Script> {
  return enqueue(async () => {
    const db = await readStudioDb();
    const now = new Date().toISOString();
    const script: Script = {
      ...input,
      id: randomUUID(),
      userId,
      createdAt: now,
      updatedAt: now,
    };
    scriptSchema.parse(script);
    db.scripts.push(script);
    await persistStudioDb(db);
    return script;
  });
}

export async function updateScript(
  userId: string,
  id: string,
  input: Partial<Omit<Script, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<Script | null> {
  return enqueue(async () => {
    const db = await readStudioDb();
    const index = db.scripts.findIndex((s) => s.id === id && s.userId === userId);
    if (index === -1) return null;

    const updated: Script = {
      ...db.scripts[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    scriptSchema.parse(updated);
    db.scripts[index] = updated;
    await persistStudioDb(db);
    return updated;
  });
}

export async function deleteScript(userId: string, id: string): Promise<boolean> {
  return enqueue(async () => {
    const db = await readStudioDb();
    const index = db.scripts.findIndex((s) => s.id === id && s.userId === userId);
    if (index === -1) return false;

    // Policy via shared module: detach campaign items, cascade metrics.
    const result = cascadeDeleteScript(
      { scripts: db.scripts, campaigns: db.campaigns, performanceMetrics: db.performanceMetrics },
      id,
      userId
    );
    db.campaigns = result!.campaigns;
    db.performanceMetrics = result!.performanceMetrics;

    db.scripts.splice(index, 1);
    await persistStudioDb(db);
    return true;
  });
}

export async function listCampaigns(userId: string): Promise<Campaign[]> {
  const db = await readStudioDb();
  return db.campaigns.filter((c) => c.userId === userId);
}

export async function getCampaign(userId: string, id: string): Promise<Campaign | null> {
  const db = await readStudioDb();
  const found = db.campaigns.find((c) => c.id === id && c.userId === userId);
  return found ?? null;
}

export async function createCampaign(
  userId: string,
  input: Omit<Campaign, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<Campaign> {
  return enqueue(async () => {
    const db = await readStudioDb();
    const now = new Date().toISOString();
    const campaign: Campaign = {
      ...input,
      id: randomUUID(),
      userId,
      createdAt: now,
      updatedAt: now,
    };
    campaignSchema.parse(campaign);
    db.campaigns.push(campaign);
    await persistStudioDb(db);
    return campaign;
  });
}

export async function updateCampaign(
  userId: string,
  id: string,
  input: Partial<Omit<Campaign, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<Campaign | null> {
  return enqueue(async () => {
    const db = await readStudioDb();
    const index = db.campaigns.findIndex((c) => c.id === id && c.userId === userId);
    if (index === -1) return null;

    const updated: Campaign = {
      ...db.campaigns[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    campaignSchema.parse(updated);
    db.campaigns[index] = updated;
    await persistStudioDb(db);
    return updated;
  });
}

export async function updateCampaignDay(
  userId: string,
  campaignId: string,
  day: number,
  patch: CampaignDayPatch
): Promise<Campaign> {
  return enqueue(async () => {
    const db = await readStudioDb();
    const index = db.campaigns.findIndex((c) => c.id === campaignId && c.userId === userId);
    if (index === -1) {
      throw new StudioConflictError("not_found", "Không tìm thấy chiến dịch");
    }

    const campaign = db.campaigns[index];
    const itemIndex = campaign.items.findIndex((item) => item.day === day);
    if (itemIndex === -1) {
      throw new StudioConflictError("day_not_found", `Không có ngày ${day} trong chiến dịch`);
    }

    const current = campaign.items[itemIndex];
    let nextScriptId = current.scriptId;

    if (patch.scriptId !== undefined) {
      if (patch.scriptId === null || patch.scriptId === "") {
        nextScriptId = undefined;
      } else {
        const ownedScript = db.scripts.find(
          (s) => s.id === patch.scriptId && s.userId === userId
        );
        if (!ownedScript) {
          throw new StudioConflictError(
            "script_not_found",
            "Kịch bản không tồn tại hoặc không thuộc về bạn"
          );
        }
        nextScriptId = patch.scriptId;
      }
    }

    if (nextScriptId) {
      const sameDayDupes = campaign.items.filter(
        (item) => item.day === day && item.scriptId === nextScriptId
      );
      if (sameDayDupes.length > 1) {
        throw new StudioConflictError(
          "duplicate_script_day",
          "Kịch bản đã được gán cho ngày này"
        );
      }
    }

    const nextItem: CampaignItem = campaignItemSchema.parse({
      day: current.day,
      scriptId: nextScriptId,
      status: patch.status ?? current.status,
      publishedUrl:
        patch.publishedUrl !== undefined
          ? patch.publishedUrl || undefined
          : current.publishedUrl,
      notes: patch.notes !== undefined ? patch.notes || undefined : current.notes,
    });

    const items = campaign.items.map((item, i) => (i === itemIndex ? nextItem : item));
    const updated: Campaign = {
      ...campaign,
      items,
      updatedAt: new Date().toISOString(),
    };
    campaignSchema.parse(updated);
    db.campaigns[index] = updated;
    await persistStudioDb(db);
    return updated;
  });
}

export async function deleteCampaign(userId: string, id: string): Promise<boolean> {
  return enqueue(async () => {
    const db = await readStudioDb();
    const index = db.campaigns.findIndex((c) => c.id === id && c.userId === userId);
    if (index === -1) return false;

    // Policy via shared module: cascade items, detach metrics.
    const result = cascadeDeleteCampaign(
      { scripts: db.scripts, campaigns: db.campaigns, performanceMetrics: db.performanceMetrics },
      id,
      userId
    );
    db.campaigns = result!.campaigns;
    db.performanceMetrics = result!.performanceMetrics;

    // (campaign row removed by cascade; no need to splice since cascade returns
    // the filtered list which already excludes this campaign.)
    await persistStudioDb(db);
    return true;
  });
}

export async function getBrandProfile(userId: string): Promise<BrandProfile | null> {
  const db = await readStudioDb();
  const found = db.brandProfiles.find((b) => b.userId === userId);
  return found ?? null;
}

export async function upsertBrandProfile(
  userId: string,
  input: Omit<BrandProfile, "userId" | "updatedAt">
): Promise<BrandProfile> {
  return enqueue(async () => {
    const db = await readStudioDb();
    const index = db.brandProfiles.findIndex((b) => b.userId === userId);

    const profile: BrandProfile = {
      ...input,
      userId,
      updatedAt: new Date().toISOString(),
    };
    brandProfileSchema.parse(profile);

    if (index === -1) {
      db.brandProfiles.push(profile);
    } else {
      db.brandProfiles[index] = profile;
    }

    await persistStudioDb(db);
    return profile;
  });
}

export async function listPerformanceMetrics(
  userId: string,
  filters?: { scriptId?: string; campaignId?: string }
): Promise<PerformanceMetric[]> {
  const db = await readStudioDb();
  let metrics = db.performanceMetrics.filter((m) => m.userId === userId);

  if (filters?.scriptId) {
    metrics = metrics.filter((m) => m.scriptId === filters.scriptId);
  }
  if (filters?.campaignId) {
    metrics = metrics.filter((m) => m.campaignId === filters.campaignId);
  }

  return metrics;
}

export async function createPerformanceMetric(
  userId: string,
  input: Omit<PerformanceMetric, "id" | "userId">
): Promise<PerformanceMetric> {
  return enqueue(async () => {
    const db = await readStudioDb();
    const metric: PerformanceMetric = {
      ...input,
      id: randomUUID(),
      userId,
    };
    performanceMetricSchema.parse(metric);
    db.performanceMetrics.push(metric);
    await persistStudioDb(db);
    return metric;
  });
}
