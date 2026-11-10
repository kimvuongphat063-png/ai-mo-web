import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
import * as path from "node:path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
async function main() {
  const url = process.env.DATABASE_URL!;
  const adapter = new PrismaPg({ connectionString: url });
  const prisma = new (PrismaClient as any)({ adapter });
  // Check core tables counts
  const core = ["User","Product","Category","Order","OrderItem","ProductVariant","ProductAsset","Review","Coupon","Referral","Payout","PayoutItem","DownloadToken","Session","Account","AuditLog","LegalPage","VerificationToken","CouponUsage","ProductAssetVariant"];
  const counts: Record<string, number> = {};
  for (const t of core) {
    try { counts[t] = await prisma[t].count(); } catch (e: any) { counts[t] = -1; }
  }
  console.log("CORE COUNTS:", JSON.stringify(counts, null, 2));
  await prisma.$disconnect();
}
main().catch((e) => { console.error("ERR", e); process.exit(1); });
