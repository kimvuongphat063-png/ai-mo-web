import "server-only";
import type {
  CampaignInput,
  CampaignPlan,
  PerformanceInput,
  PerformanceInsight,
  ProductAnalysis,
  ProductProfileInput,
  ScriptGeneration,
  ScriptInput,
  SellingAngle,
  SuggestAnglesInput,
} from "@/lib/ai/contract";
import { aiEnv } from "@/lib/ai/env";
import { toAiError } from "@/lib/ai/errors";
import * as mock from "@/lib/ai/mock";
import * as live from "@/lib/ai/live";

export { AiError, toAiError, aiErrorBody } from "@/lib/ai/errors";
export type { AiErrorCode } from "@/lib/ai/errors";
export { aiEnvPublicSummary } from "@/lib/ai/env";
export { getUsage, consumeQuota, refundQuota } from "@/lib/ai/usage";
export type { UsageStatus } from "@/lib/ai/usage";

/**
 * Provider dispatcher.
 *
 * `AI_PROVIDER=mock` (default) → deterministic local generation, used by unit
 * tests and offline development. Any other value → real provider via
 * `live.ts` + `provider.ts`, with timeout, retry and Zod validation.
 *
 * Every function normalises thrown values to `AiError` so API routes can map
 * them to a status code and a user-friendly Vietnamese message.
 */
function impl() {
  return aiEnv().AI_PROVIDER === "mock" ? mock : live;
}

async function run<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    throw toAiError(err);
  }
}

export function analyzeProduct(input: ProductProfileInput): Promise<ProductAnalysis> {
  return run(() => impl().analyzeProduct(input));
}

export function suggestAngles(input: SuggestAnglesInput): Promise<SellingAngle[]> {
  return run(() => impl().suggestAngles(input));
}

export function generateScripts(input: ScriptInput): Promise<ScriptGeneration> {
  return run(() => impl().generateScripts(input));
}

export function generateCampaign(input: CampaignInput): Promise<CampaignPlan> {
  return run(() => impl().generateCampaign(input));
}

export function analyzePerformance(input: PerformanceInput): Promise<PerformanceInsight[]> {
  return run(() => impl().analyzePerformance(input));
}
