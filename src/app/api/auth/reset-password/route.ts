import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { consumeResetToken, bumpPasswordVersion } from "@/lib/user-store";
import { hashPassword } from "@/lib/auth-password";
import { requireSameOrigin } from "@/lib/csrf";
import { checkRateLimit } from "@/lib/rate-limit-v2";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const schema = z.object({
  token: z.string().min(10).max(200),
  newPassword: z.string().min(8).max(200),
});

let cachedPrisma: any = null;
function getPrisma() {
  if (!cachedPrisma) {
    const url = process.env.DATABASE_URL;
    const adapter = url ? new PrismaPg({ connectionString: url }) : undefined;
    cachedPrisma = new (PrismaClient as any)(adapter ? { adapter } : {});
  }
  return cachedPrisma;
}

export async function POST(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });

  // Rate limit: 5 attempts / 30 min per IP.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await checkRateLimit("reset", ip);
  if (!rl.allowed) {
    const retryAfterSec = Math.ceil((rl.resetMs - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Quá nhiều yêu cầu. Vui lòng thử lại sau." },
      { status: 429, headers: { "Retry-After": String(Math.max(retryAfterSec, 1)) } },
    );
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Chức năng này yêu cầu cơ sở dữ liệu." }, { status: 503 });
  }

  // Validate and consume the token (single-use).
  const userId = await consumeResetToken(parsed.data.token);
  if (!userId) {
    return NextResponse.json({ error: "Liên kết không hợp lệ hoặc đã hết hạn." }, { status: 400 });
  }

  // Hash the new password and bump version (invalidates all prior sessions).
  const passwordHash = await hashPassword(parsed.data.newPassword);
  const db = getPrisma();
  await db.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
  await bumpPasswordVersion(userId);

  return NextResponse.json({ ok: true, message: "Mật khẩu đã được đặt lại. Vui lòng đăng nhập lại." });
}
