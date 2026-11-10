/**
 * Pure delete-cascade transformations for the Studio storage layer.
 *
 * Deliberately free of `server-only`, `fs`, `prisma`, and concrete record
 * types that would drag in the Prisma boundary. Both adapters apply these to
 * their own record shapes via the serializable `DbSnapshot` contract, and the
 * regression tests exercise this same module — so a fix here is verified, not
 * duplicated.
 *
 * See delete-policy.ts for the full policy rationale.
 */

export const UNSCHEDULED_STATUS = "planned" as const;

/** Minimal script reference the cascade needs. */
export interface ScriptRef {
  id: string;
  userId: string;
  productProfileId: string;
}

/**
 * Campaign-item reference. Includes the fields the cascade mutates; extra
 * domain fields (publishedUrl, notes, …) are preserved through spread and
 * typed via the generic `T` parameter of `DbSnapshot`.
 */
export interface CampaignItemRef {
  day: number;
  scriptId?: string | null;
  status: string;
}

/**
 * Performance-metric reference. Only `scriptId` and `campaignId` are
 * consumed by the cascade; extra fields are preserved via spread.
 */
export interface MetricRef {
  id: string;
  userId: string;
  scriptId: string;
  campaignId?: string | null;
}

/**
 * Generic snapshot: callers provide the narrow ref types above, but the
 * concrete adapters pass full domain objects (Campaign, PerformanceMetric).
 * The generic parameters `C` and `M` let the return type carry the same
 * shape the caller started with — so `json.ts` gets `Campaign[]` back,
 * not `CampaignRef[]`.
 *
 * The cascade functions only read the ref fields; spread operators carry
 * every other field forward unmodified.
 */
export interface DbSnapshot<
  C extends { id: string; userId: string; items: CampaignItemRef[] } = {
    id: string;
    userId: string;
    items: CampaignItemRef[];
  },
  M extends MetricRef = MetricRef,
> {
  scripts: ScriptRef[];
  campaigns: C[];
  performanceMetrics: M[];
}

interface Result<
  C extends { id: string; userId: string; items: CampaignItemRef[] },
  M extends MetricRef,
> {
  campaigns: C[];
  performanceMetrics: M[];
  /** Script ids removed as part of this operation. */
  removedScriptIds: string[];
}

/** Detach a set of script ids from every campaign item; returns the diff. */
function detachFromItems<
  C extends { id: string; userId: string; items: CampaignItemRef[] },
>(campaigns: C[], scriptIds: ReadonlySet<string>): C[] {
  return campaigns.map((campaign) => ({
    ...campaign,
    items: campaign.items.map((item) =>
      item.scriptId && scriptIds.has(item.scriptId)
        ? { ...item, scriptId: undefined, status: UNSCHEDULED_STATUS }
        : item
    ),
  }));
}

/**
 * Delete a script: detach its campaign items, cascade its metrics.
 * Returns the resulting campaigns + metrics + removed ids, so a caller can
 * finish the delete on its own store (soft-delete row, remove from JSON, …).
 */
export function cascadeDeleteScript<
  C extends { id: string; userId: string; items: CampaignItemRef[] },
  M extends MetricRef,
>(
  snapshot: DbSnapshot<C, M>,
  scriptId: string,
  userId: string
): Result<C, M> | null {
  const script = snapshot.scripts.find((s) => s.id === scriptId && s.userId === userId);
  if (!script) return null;
  const ids = new Set([scriptId]);
  return {
    campaigns: detachFromItems(snapshot.campaigns, ids),
    performanceMetrics: snapshot.performanceMetrics.filter((m) => m.scriptId !== scriptId),
    removedScriptIds: [scriptId],
  };
}

/**
 * Delete a product: cascade its scripts (which in turn run the script policy).
 * Returns the resulting campaigns + metrics + removed ids.
 */
export function cascadeDeleteProduct<
  C extends { id: string; userId: string; items: CampaignItemRef[] },
  M extends MetricRef,
>(
  snapshot: DbSnapshot<C, M>,
  productId: string,
  userId: string
): Result<C, M> {
  const scriptIds = new Set(
    snapshot.scripts
      .filter((s) => s.productProfileId === productId && s.userId === userId)
      .map((s) => s.id)
  );
  if (scriptIds.size === 0) {
    return { campaigns: snapshot.campaigns, performanceMetrics: snapshot.performanceMetrics, removedScriptIds: [] };
  }
  return {
    campaigns: detachFromItems(snapshot.campaigns, scriptIds),
    performanceMetrics: snapshot.performanceMetrics.filter((m) => !scriptIds.has(m.scriptId)),
    removedScriptIds: [...scriptIds],
  };
}

/**
 * Delete a campaign: cascade its items, detach its metrics (campaignId = null).
 * Returns the new campaigns array (items removed) + metrics.
 */
export function cascadeDeleteCampaign<
  C extends { id: string; userId: string; items: CampaignItemRef[] },
  M extends MetricRef,
>(
  snapshot: DbSnapshot<C, M>,
  campaignId: string,
  userId: string
): { campaigns: C[]; performanceMetrics: M[] } | null {
  const campaign = snapshot.campaigns.find((c) => c.id === campaignId && c.userId === userId);
  if (!campaign) return null;
  return {
    campaigns: snapshot.campaigns.filter((c) => c.id !== campaignId),
    performanceMetrics: snapshot.performanceMetrics.map((m) =>
      m.campaignId === campaignId ? { ...m, campaignId: undefined } : m
    ),
  };
}
