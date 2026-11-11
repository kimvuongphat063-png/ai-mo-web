import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeMutation } from "@/lib/auth-csrf";
import { sendOrderConfirmationEmail } from "@/lib/email";

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
  const orderId = `AIMO-${Math.floor(10000 + Math.random() * 89999)}`;

  // Send confirmation email asynchronously without blocking the response
  sendOrderConfirmationEmail({
    to: parsed.data.email,
    name: parsed.data.name,
    orderId,
    items: parsed.data.items.map((item) => ({
      slug: item.slug,
      title: item.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      quantity: item.quantity,
      license: item.license,
    })),
  }).catch((err) => console.error("[checkout:email] Failed to send confirmation email", err));

  return NextResponse.json({ ok: true, orderId, mode: "demo" }, { status: 201 });
}
