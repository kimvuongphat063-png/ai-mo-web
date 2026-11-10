import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { authorizeMutation } from "@/lib/auth-csrf";
import { StudioConflictError, updateCampaignDay } from "@/lib/studio";
import { campaignDayUpdateSchema } from "@/lib/validation/studio";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/studio/campaigns/[id]/days
 * Assign / update / clear a single campaign day.
 *
 * Body: { day, scriptId?, status?, publishedUrl?, notes? }
 * - scriptId: string assigns (must be owned); null | "" clears.
 * - Same script may appear on multiple days; not twice on the same day.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await authorizeMutation(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const body = await req.json();
    const validated = campaignDayUpdateSchema.parse(body);

    const scriptId =
      validated.scriptId === undefined
        ? undefined
        : validated.scriptId === "" || validated.scriptId === null
          ? null
          : validated.scriptId;

    const campaign = await updateCampaignDay(auth.session.userId, id, validated.day, {
      scriptId,
      status: validated.status,
      publishedUrl: validated.publishedUrl,
      notes: validated.notes,
    });

    return NextResponse.json({ campaign });
  } catch (err) {
    if (err instanceof ZodError) {
      const message = err.errors[0]?.message || "Dữ liệu không hợp lệ";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (err instanceof StudioConflictError) {
      const status =
        err.code === "not_found" || err.code === "script_not_found" || err.code === "day_not_found"
          ? 404
          : 409;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    console.error("[PATCH /api/studio/campaigns/[id]/days]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
