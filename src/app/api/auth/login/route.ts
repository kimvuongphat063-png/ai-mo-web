import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticate, createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { checkRateLimit } from "@/lib/rate-limit-v2";
import { createHash } from "crypto";

const schema = z.object({ email: z.string().email(), password: z.string().min(1).max(200) });

function hashIdentifier(value: string): string {
  return createHash("sha256").update(value.toLowerCase()).digest("hex").slice(0, 16);
}

export async function POST(request: NextRequest) {
  // CSRF: reject cross-origin mutations.
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dữ liệu đăng nhập không hợp lệ" }, { status: 400 });

  // Rate limit: 5 attempts / 10 min per IP + email hash.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const emailHash = hashIdentifier(parsed.data.email);
  const rl = await checkRateLimit("login", `${ip}:${emailHash}`);
  if (!rl.allowed) {
    const retryAfterSec = Math.ceil((rl.resetMs - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau." },
      { status: 429, headers: { "Retry-After": String(Math.max(retryAfterSec, 1)) } },
    );
  }

  const account = await authenticate(parsed.data.email, parsed.data.password);
  if (!account) return NextResponse.json({ error: "Email hoặc mật khẩu không đúng" }, { status: 401 });

  const response = NextResponse.json({ user: { email: account.email, name: account.name, role: account.role } });
  response.cookies.set(SESSION_COOKIE, createSessionToken(account), sessionCookieOptions);
  return response;
}
