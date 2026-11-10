import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { aiEnv } from "@/lib/ai/env";
import { AiError } from "@/lib/ai/errors";
import {
  applyConsume,
  applyRefund,
  computeStatus,
  dropStaleDays,
  findUsage,
  mergeUsage,
  nextReset,
  today,
  type UsageEntry,
  type UsageStatus,
} from "./quota-core";

const usagePath = path.join(process.cwd(), "data", "ai-usage.json");

let queue: Promise<unknown> = Promise.resolve();
function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const op = queue.then(task, task);
  queue = op.catch(() => undefined);
  return op;
}

type UsageDb = { entries: UsageEntry[]; updatedAt: string };

function toDb(entries: UsageEntry[]): UsageDb {
  return { entries, updatedAt: new Date().toISOString() };
}

async function readUsage(): Promise<UsageDb> {
  try {
    const raw = JSON.parse(await readFile(usagePath, "utf-8"));
    const entries: UsageEntry[] = Array.isArray(raw?.entries) ? raw.entries : [];
    return toDb(entries);
  } catch {
    return toDb([]);
  }
}

async function persistUsage(db: UsageDb): Promise<void> {
  const day = today();
  const validated = toDb(dropStaleDays(db.entries, day));
  await mkdir(path.dirname(usagePath), { recursive: true });
  const temp = `${usagePath}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(validated, null, 2), { flag: "wx" });
  await rename(temp, usagePath);
}

export async function getUsage(userId: string): Promise<UsageStatus> {
  const limit = aiEnv().AI_DAILY_LIMIT;
  const db = await readUsage();
  const used = findUsage(db.entries, userId, today());
  return computeStatus(used, limit);
}

export async function consumeQuota(userId: string): Promise<UsageStatus> {
  const limit = aiEnv().AI_DAILY_LIMIT;
  return enqueue(async () => {
    const db = await readUsage();
    const day = today();
    const used = findUsage(db.entries, userId, day);
    const { used: nextUsed, wouldExceed } = applyConsume(used, limit);
    if (wouldExceed) throw new AiError("quota");
    const merged = mergeUsage(db.entries, { userId, day, count: nextUsed });
    await persistUsage(toDb(merged));
    return computeStatus(nextUsed, limit);
  });
}

export async function refundQuota(userId: string): Promise<void> {
  await enqueue(async () => {
    const db = await readUsage();
    const day = today();
    const used = findUsage(db.entries, userId, day);
    if (used === 0) return;
    const merged = mergeUsage(db.entries, { userId, day, count: applyRefund(used) });
    await persistUsage(toDb(merged));
  });
}

// Re-export for callers that need the reset timestamp without a db hit.
export { nextReset };
