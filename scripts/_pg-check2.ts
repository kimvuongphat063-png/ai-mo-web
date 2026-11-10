import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
import * as path from "node:path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
async function main() {
  const url = process.env.DATABASE_URL!;
  const adapter = new PrismaPg({ connectionString: url });
  const prisma = new (PrismaClient as any)({ adapter });
  const allTables = await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`;
  console.log("ALL TABLES:", JSON.stringify(allTables));
  await prisma.$disconnect();
}
main().catch((e) => { console.error("ERR", e); process.exit(1); });
