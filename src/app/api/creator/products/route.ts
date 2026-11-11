import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeMutation } from "@/lib/auth-csrf";
import { checkRateLimit } from "@/lib/rate-limit-v2";

const schema = z.object({
  name: z.string().min(3).max(120),
  description: z.string().min(20).max(1000),
  category: z.enum(["ui-kits", "templates", "code", "e-books"]),
  price: z.number().positive().max(9999),
});
export async function POST(request: Request) {
  const auth = await authorizeMutation(request, "admin");
  if (auth.error) return auth.error;

  const rl = await checkRateLimit("studioMutation", auth.session.userId);
  if (!rl.allowed) {
    const retryAfterSec = Math.ceil((rl.resetMs - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Thao tác quá nhanh. Vui lòng thử lại sau.", code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(Math.max(retryAfterSec, 1)) } },
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  return NextResponse.json({ ok: true, id: crypto.randomUUID(), status: "draft" }, { status: 201 });
}
