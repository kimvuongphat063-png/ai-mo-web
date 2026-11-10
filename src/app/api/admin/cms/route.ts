import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { authorizeApi } from "@/lib/auth";
import { authorizeMutation } from "@/lib/auth-csrf";
import { readCms, writeCms } from "@/lib/cms";
export async function GET() {
  const auth = await authorizeApi("admin");
  if (auth.error) return auth.error;
  return NextResponse.json(await readCms());
}
export async function PUT(request: Request) {
  const auth = await authorizeMutation(request, "admin");
  if (auth.error) return auth.error;
  try { return NextResponse.json(await writeCms(await request.json())); }
  catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Nội dung không hợp lệ", issues: error.flatten() }, { status: 400 });
    return NextResponse.json({ error: "Không thể lưu nội dung" }, { status: 500 });
  }
}
