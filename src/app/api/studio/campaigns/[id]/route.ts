import { NextRequest, NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth";
import { authorizeMutation } from "@/lib/auth-csrf";
import { getCampaign, updateCampaign, deleteCampaign } from "@/lib/studio";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const auth = await authorizeApi();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const campaign = await getCampaign(auth.session.userId, id);
    if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ campaign });
  } catch (err) {
    console.error("[GET /api/studio/campaigns/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await authorizeMutation(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const body = await req.json();
    const campaign = await updateCampaign(auth.session.userId, id, body);
    if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ campaign });
  } catch (err) {
    console.error("[PATCH /api/studio/campaigns/[id]]", err);
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await authorizeMutation(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const deleted = await deleteCampaign(auth.session.userId, id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/studio/campaigns/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
