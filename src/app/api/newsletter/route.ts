import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeMutation } from "@/lib/auth-csrf";

const schema = z.object({ email: z.string().email() });
export async function POST(request: Request) {
  const auth = await authorizeMutation(request, "learner");
  if (auth.error) return auth.error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Email không hợp lệ" }, { status: 400 });
  return NextResponse.json({ ok: true, message: "Đã đăng ký trong chế độ demo" });
}
