import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { aiEnv } from "@/lib/ai/env";
import { AiError } from "@/lib/ai/errors";
import { applyConsume, applyRefund, computeStatus, today } from "./quota-core";
import type { UsageStatus } from "./quota-core";

let cachedPrisma: any = null;
function getPrisma() {
  if (!cachedPrisma) {
    const url = process.env.DATABASE_URL;
    const adapter = url ? new PrismaPg({ connectionString: url }) : undefined;
    cachedPrisma = new (PrismaClient as any)(adapter ? { adapter } : {});
  }
  return cachedPrisma;
}

export async function getUsage(userId: string): Promise<UsageStatus> {
  const limit = aiEnv().AI_DAILY_LIMIT;
  const db = getPrisma();
  const dayStr = today();
  const entry = await db.studioAiUsage.findFirst({
    where: { userId, day: dayStr },
  });
  const used = entry?.count ?? 0;
  return computeStatus(used, limit);
}

export async function consumeQuota(userId: string): Promise<UsageStatus> {
  const limit = aiEnv().AI_DAILY_LIMIT;
  const db = getPrisma();
  const dayStr = today();

  const result = await db.$transaction(async (tx: any) => {
    const existing = await tx.studioAiUsage.findFirst({
      where: { userId, day: dayStr },
    });
    const used = existing?.count ?? 0;
    const { wouldExceed } = applyConsume(used, limit);
    if (wouldExceed) throw new AiError("quota");

    if (existing) {
      return await tx.studioAiUsage.update({
        where: { id: existing.id },
        data: { count: { increment: 1 } },
      });
    } else {
      return await tx.studioAiUsage.create({
        data: { userId, day: dayStr, count: 1 },
      });
    }
  });

  return computeStatus(result.count, limit);
}

export async function refundQuota(userId: string): Promise<void> {
  const db = getPrisma();
  const dayStr = today();

  await db.$transaction(async (tx: any) => {
    const existing = await tx.studioAiUsage.findFirst({
      where: { userId, day: dayStr },
    });
    if (existing && existing.count > 0) {
      const next = applyRefund(existing.count);
      await tx.studioAiUsage.update({
        where: { id: existing.id },
        data: { count: next },
      });
    }
  });
}
