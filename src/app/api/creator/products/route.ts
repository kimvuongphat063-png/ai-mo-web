import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeMutation } from "@/lib/auth-csrf";

const schema = z.object({
  name: z.string().min(3).max(120),
  description: z.string().min(20).max(1000),
  category: z.enum(["ui-kits", "templates", "code", "e-books"]),
  price: z.number().positive().max(9999),
});
export async function POST(request: Request) {
  const auth = await authorizeMutation(request, "admin");
  if (auth.error) return auth.error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  return NextResponse.json({ ok: true, id: crypto.randomUUID(), status: "draft" }, { status: 201 });
}
