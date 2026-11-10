import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export const dynamic = "force-dynamic";

let cachedPrisma: any = null;
function getPrisma() {
  if (!cachedPrisma) {
    const url = process.env.DATABASE_URL;
    const adapter = url ? new PrismaPg({ connectionString: url }) : undefined;
    cachedPrisma = new (PrismaClient as any)(adapter ? { adapter } : {});
  }
  return cachedPrisma;
}

/**
 * Admin-only database connectivity check.
 *
 * Returns a safe health status only. Connection strings, provider keys and raw
 * driver errors are never included in the response — failures are logged
 * server-side and surfaced to the client as a generic status.
 */
export async function GET() {
  const auth = await authorizeApi("admin");
  if (auth.error) return auth.error;

  const storage = process.env.STUDIO_STORAGE === "postgres" ? "postgres" : "json";

  try {
    const prisma = getPrisma();
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      storage,
      database: "reachable",
      configured: Boolean(process.env.DATABASE_URL),
    });
  } catch (error) {
    // Logged server-side only — never returned to the client.
    console.error("[GET /api/studio/admin/health] Database check failed", error);
    return NextResponse.json(
      {
        status: "error",
        storage,
        database: "unreachable",
        configured: Boolean(process.env.DATABASE_URL),
      },
      { status: 503 }
    );
  }
}
