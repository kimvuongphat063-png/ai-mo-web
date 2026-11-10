import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
import * as path from "node:path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
async function main() {
  const url = process.env.DATABASE_URL!;
  const adapter = new PrismaPg({ connectionString: url });
  const prisma = new (PrismaClient as any)({ adapter });
  const raw = await prisma.$queryRaw`SELECT current_database() as db`;
  console.log("DB:", JSON.stringify(raw));
  const counts: Record<string, number> = {};
  for (const t of ["studioBrandProfile","studioProduct","studioScript","studioCampaign","studioCampaignItem","studioPerformanceMetric","studioAiUsage","studioGenerationJob"]) {
    try { counts[t] = await prisma[t].count(); } catch (e: any) { counts[t] = -1; }
  }
  console.log("COUNTS:", JSON.stringify(counts));
  await prisma.$disconnect();
}
main().catch((e) => { console.error("ERR", e); process.exit(1); });
