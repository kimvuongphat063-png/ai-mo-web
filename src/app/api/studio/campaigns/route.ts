import { NextRequest, NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth";
import { authorizeMutation } from "@/lib/auth-csrf";
import { listCampaigns, createCampaign } from "@/lib/studio";
import { campaignFormSchema } from "@/lib/validation/studio";

export async function GET(req: NextRequest) {
  const auth = await authorizeApi();
  if (auth.error) return auth.error;

  try {
    const campaigns = await listCampaigns(auth.session.userId);
    return NextResponse.json({ campaigns });
  } catch (err) {
    console.error("[GET /api/studio/campaigns]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authorizeMutation(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const validated = campaignFormSchema.parse(body);

    const items = Array.from({ length: validated.durationDays }, (_, i) => ({
      day: i + 1,
      scriptId: undefined,
      status: "planned" as const,
      publishedUrl: undefined,
      notes: undefined,
    }));

    const campaign = await createCampaign(auth.session.userId, {
      name: validated.name,
      startDate: validated.startDate,
      durationDays: validated.durationDays,
      platform: validated.platform,
      goal: validated.goal,
      items,
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/studio/campaigns]", err);
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }
}
