import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { checkRateLimit } from "@/lib/rate-limit-v2";
import { createUser } from "@/lib/user-store";

const schema = z.object({
  email: z.string().email("Email không hợp lệ").max(200),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự").max(200),
  name: z.string().max(100).optional(),
});

export async function POST(request: NextRequest) {
  // CSRF: reject cross-origin mutations.
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message ?? "Dữ liệu đăng ký không hợp lệ";
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }

  // Rate limit: 5 register attempts / 15 min per IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await checkRateLimit("register", ip);
  if (!rl.allowed) {
    const retryAfterSec = Math.ceil((rl.resetMs - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Quá nhiều lượt đăng ký từ mạng này. Vui lòng thử lại sau ít phút." },
      { status: 429, headers: { "Retry-After": String(Math.max(retryAfterSec, 1)) } },
    );
  }

  try {
    const user = await createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      name: parsed.data.name,
    });

    const account = {
      userId: user.id,
      email: user.email,
      name: user.name ?? user.email,
      role: (user.isAdmin ? "admin" : "learner") as "admin" | "learner",
      passwordVersion: user.passwordVersion,
    };

    const response = NextResponse.json({
      success: true,
      user: {
        email: account.email,
        name: account.name,
        role: account.role,
      },
    });

    response.cookies.set(SESSION_COOKIE, createSessionToken(account), sessionCookieOptions);
    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Không thể tạo tài khoản. Vui lòng thử lại." },
      { status: 400 },
    );
  }
}
