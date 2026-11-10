import { NextRequest, NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth";
import { authorizeMutation } from "@/lib/auth-csrf";
import {
  listPerformanceMetrics,
  createPerformanceMetric,
  getScript,
  getCampaign,
} from "@/lib/studio";
import { performanceMetricFormSchema } from "@/lib/validation/studio";

export async function GET(req: NextRequest) {
  const auth = await authorizeApi();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const scriptId = searchParams.get("scriptId") ?? undefined;
    const campaignId = searchParams.get("campaignId") ?? undefined;

    const metrics = await listPerformanceMetrics(auth.session.userId, { scriptId, campaignId });
    return NextResponse.json({ metrics });
  } catch (err) {
    console.error("[GET /api/studio/performance]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authorizeMutation(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();

    // Validate that scriptId exists
    if (!body.scriptId) {
      return NextResponse.json({ error: "scriptId là bắt buộc" }, { status: 400 });
    }

    // Ownership: the referenced script (and campaign, if any) must belong to
    // the authenticated user — otherwise metrics could be attached to foreign rows.
    const script = await getScript(auth.session.userId, String(body.scriptId));
    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }
    if (body.campaignId) {
      const campaign = await getCampaign(auth.session.userId, String(body.campaignId));
      if (!campaign) {
        return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
      }
    }

    const metric = await createPerformanceMetric(auth.session.userId, {
      scriptId: body.scriptId,
      campaignId: body.campaignId || undefined,
      recordedAt: new Date().toISOString(),
      views: Number(body.views || 0),
      likes: Number(body.likes || 0),
      comments: Number(body.comments || 0),
      shares: Number(body.shares || 0),
      clicks: Number(body.clicks || 0),
      conversions: Number(body.conversions || 0),
      revenue: Number(body.revenue || 0),
      costSpent: Number(body.costSpent || 0),
      watchTimeSeconds: Number(body.watchTimeSeconds || 0),
      engagementRate: Number(body.engagementRate || 0),
      ctr: Number(body.ctr || 0),
      roas: Number(body.roas || 0),
    });

    return NextResponse.json({ metric }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/studio/performance]", err);
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }
}
