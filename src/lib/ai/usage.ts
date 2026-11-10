import type { UsageStatus } from "./quota-core";
import * as jsonUsage from "./json-usage";
import * as pgUsage from "./pg-usage";

/**
 * Usage adapter interface — both JSON and Postgres adapters satisfy it.
 * The dispatcher picks one at runtime based on STUDIO_STORAGE.
 */
export interface UsageAdapter {
  getUsage(userId: string): Promise<UsageStatus>;
  consumeQuota(userId: string): Promise<UsageStatus>;
  refundQuota(userId: string): Promise<void>;
}

/**
 * Which backend the dispatcher will use for the next call.
 *
 * Exported so the server-runtime test suite can assert the routing decision
 * without opening a database connection. Reads the env on every call — never
 * cached — so tests and hot reloads see changes immediately.
 */
export function activeUsageBackend(): "postgres" | "json" {
  return process.env.STUDIO_STORAGE === "postgres" ? "postgres" : "json";
}

function adapter(): UsageAdapter {
  return activeUsageBackend() === "postgres" ? pgUsage : jsonUsage;
}

export type { UsageStatus };

export async function getUsage(userId: string): Promise<UsageStatus> {
  return adapter().getUsage(userId);
}

export async function consumeQuota(userId: string): Promise<UsageStatus> {
  return adapter().consumeQuota(userId);
}

export async function refundQuota(userId: string): Promise<void> {
  return adapter().refundQuota(userId);
}
