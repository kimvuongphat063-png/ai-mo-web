/**
 * Schema drift check: does the live database match prisma/schema.prisma?
 *
 * Run: npx tsx scripts/check-schema-drift.ts
 *
 * Reads DATABASE_URL from the environment (never prints credentials).
 * Exit code 0 = schema in sync; 1 = drift found; 2 = no DATABASE_URL.
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFileSync } from "node:fs";
import path from "node:path";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL not set — cannot check schema.");
    process.exit(2);
  }

  const adapter = new PrismaPg({ connectionString: url });
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Existing columns on public."User".
    const userCols = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'User'
      ORDER BY column_name`;
    const actual = new Set(userCols.map((c) => c.column_name));

    // 2. Columns declared in prisma/schema.prisma for model User.
    //    Relation fields (type = another model, or carrying @relation) are
    //    Prisma metadata, not database columns — exclude them.
    const schema = readFileSync(path.join(process.cwd(), "prisma/schema.prisma"), "utf8");
    const modelNames = new Set(
      [...schema.matchAll(/^model\s+(\w+)/gm)].map((m) => m[1]),
    );
    const modelMatch = schema.match(/model User \{([\s\S]*?)\n\}/);
    if (!modelMatch) {
      console.error("Could not parse `model User` from prisma/schema.prisma");
      process.exit(1);
    }
    const declared = new Set(
      modelMatch[1]
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("//") && !line.startsWith("@@"))
        .map((line) => {
          const [name, type] = line.replace(/\/\/.*$/, "").trim().split(/\s+/);
          return { name, type: (type ?? "").replace(/[\[\]?]/g, ""), isRelation: line.includes("@relation") };
        })
        .filter((f) => f.name && !f.isRelation && !modelNames.has(f.type))
        .map((f) => f.name),
    );

    const missing = [...declared].filter((c) => !actual.has(c));
    const extra = [...actual].filter((c) => !declared.has(c));

    if (missing.length === 0 && extra.length === 0) {
      console.log(`✅ Schema in sync — User has exactly the ${declared.size} declared columns.`);
      process.exit(0);
    }

    if (missing.length) {
      console.log(`❌ Missing in DB (declared in schema): ${missing.join(", ")}`);
    }
    if (extra.length) {
      console.log(`⚠️  Extra in DB (not in schema): ${extra.join(", ")}`);
    }
    console.log("\nFix with: npx prisma db push");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Schema check failed:", err.message);
  process.exit(1);
});
