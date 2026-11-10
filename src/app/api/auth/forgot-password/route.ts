import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findUserByEmail, createResetToken } from "@/lib/user-store";
import { sendResetEmail } from "@/lib/email";
import { requireSameOrigin } from "@/lib/csrf";
import { checkRateLimit } from "@/lib/rate-limit-v2";
import { createHash } from "crypto";

const schema = z.object({ email: z.string().email() });

function hashIdentifier(value: string): string {
  return createHash("sha256").update(value.toLowerCase()).digest("hex").slice(0, 16);
}

export async function POST(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 });

  // Rate limit: 3 attempts / 30 min per IP + email hash.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const emailHash = hashIdentifier(parsed.data.email);
  const rl = await checkRateLimit("forgot", `${ip}:${emailHash}`);
  if (!rl.allowed) {
    const retryAfterSec = Math.ceil((rl.resetMs - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Quá nhiều yêu cầu. Vui lòng thử lại sau." },
      { status: 429, headers: { "Retry-After": String(Math.max(retryAfterSec, 1)) } },
    );
  }

  const normalized = parsed.data.email.trim().toLowerCase();

  // Always return the same response — never reveal whether the email exists.
  if (process.env.DATABASE_URL) {
    const user = await findUserByEmail(normalized);
    if (user) {
      const { rawToken } = await createResetToken(user.id);
      const baseUrl = process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
      await sendResetEmail({ to: user.email, name: user.name ?? user.email, resetUrl }).catch(() => undefined);
    }
  } else {
    // Demo mode: no DB, just log.
    console.log(`[forgot-password] Demo mode: would send reset email to ${normalized}`);
  }

  return NextResponse.json({ ok: true, message: "Nếu email tồn tại, bạn sẽ nhận liên kết đặt lại mật khẩu." });
}
