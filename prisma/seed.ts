import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { DEMO_IDENTITIES } from "../src/lib/auth-shared";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL required for seeding");
}

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new (PrismaClient as any)({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Seed demo users
  for (const identity of DEMO_IDENTITIES) {
    const isAdmin = identity.role === "admin";
    await prisma.user.upsert({
      where: { id: identity.userId },
      update: {
        email: identity.email,
        name: identity.name,
        isAdmin,
        passwordVersion: 0,
      },
      create: {
        id: identity.userId,
        email: identity.email,
        name: identity.name,
        isAdmin,
        passwordHash: null, // Demo accounts don't use password
        passwordVersion: 0,
      },
    });
    console.log(`✅ Upserted user: ${identity.email} (${identity.role})`);
  }

  console.log("✅ Seeding complete");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
