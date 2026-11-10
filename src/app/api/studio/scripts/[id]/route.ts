import { NextRequest, NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth";
import { authorizeMutation } from "@/lib/auth-csrf";
import { getScript, updateScript, deleteScript } from "@/lib/studio";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const auth = await authorizeApi();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const script = await getScript(auth.session.userId, id);
    if (!script) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ script });
  } catch (err) {
    console.error("[GET /api/studio/scripts/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await authorizeMutation(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const body = await req.json();
    const script = await updateScript(auth.session.userId, id, body);
    if (!script) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ script });
  } catch (err) {
    console.error("[PATCH /api/studio/scripts/[id]]", err);
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await authorizeMutation(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const deleted = await deleteScript(auth.session.userId, id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/studio/scripts/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
