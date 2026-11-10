import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { authorizeApi } from "@/lib/auth";
import { authorizeMutation } from "@/lib/auth-csrf";
import { CmsNotFoundError, deleteEntity, entityTypeSchema, updateEntity } from "@/lib/cms";

const failure = (error: unknown) => {
  if (error instanceof CmsNotFoundError) return NextResponse.json({ error: "Không tìm thấy nội dung" }, { status: 404 });
  if (error instanceof ZodError) return NextResponse.json({ error: "Dữ liệu không hợp lệ", issues: error.flatten() }, { status: 400 });
  return NextResponse.json({ error: "Không thể xử lý nội dung" }, { status: 500 });
};

export async function PUT(request: Request, context: { params: Promise<{ type: string; id: string }> }) {
  const auth = await authorizeMutation(request, "admin");
  if (auth.error) return auth.error;
  try {
    const params = await context.params;
    return NextResponse.json(await updateEntity(entityTypeSchema.parse(params.type), params.id, await request.json()));
  } catch (error) { return failure(error); }
}

export async function DELETE(request: Request, context: { params: Promise<{ type: string; id: string }> }) {
  const auth = await authorizeMutation(request, "admin");
  if (auth.error) return auth.error;
  try {
    const params = await context.params;
    await deleteEntity(entityTypeSchema.parse(params.type), params.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) { return failure(error); }
}
