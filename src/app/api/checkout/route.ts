import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeMutation } from "@/lib/auth-csrf";

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  items: z.array(z.object({
    slug: z.string().min(1),
    license: z.enum(["personal", "commercial", "extended"]),
    quantity: z.number().int().min(1).max(10),
  })).min(1),
  coupon: z.string().max(30).optional(),
});

export async function POST(request: Request) {
  const auth = await authorizeMutation(request, "learner");
  if (auth.error) return auth.error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Yêu cầu thanh toán không hợp lệ", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  return NextResponse.json({ ok: true, orderId: `AIMO-${Math.floor(10000 + Math.random() * 89999)}`, mode: "demo" }, { status: 201 });
}
