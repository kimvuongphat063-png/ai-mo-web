import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { authorizeApi } from "@/lib/auth";
import { authorizeMutation } from "@/lib/auth-csrf";
import { collectionFor, createEntity, entityTypeSchema, readCms } from "@/lib/cms";

const failure = (error: unknown) => error instanceof ZodError
  ? NextResponse.json({ error: "Dữ liệu không hợp lệ", issues: error.flatten() }, { status: 400 })
  : NextResponse.json({ error: "Không thể xử lý nội dung" }, { status: 500 });

export async function GET(_: Request, context: { params: Promise<{ type: string }> }) {
  const auth = await authorizeApi("admin");
  if (auth.error) return auth.error;
  try {
    const type = entityTypeSchema.parse((await context.params).type);
    return NextResponse.json(collectionFor(type, await readCms()));
  } catch (error) { return failure(error); }
}

export async function POST(request: Request, context: { params: Promise<{ type: string }> }) {
  const auth = await authorizeMutation(request, "admin");
  if (auth.error) return auth.error;
  try {
    const type = entityTypeSchema.parse((await context.params).type);
    return NextResponse.json(await createEntity(type, await request.json()), { status: 201 });
  } catch (error) { return failure(error); }
}
