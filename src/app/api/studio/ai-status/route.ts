import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth";
import { aiEnvPublicSummary, aiErrorBody, getUsage, toAiError } from "@/lib/ai";

export const dynamic = "force-dynamic";

/** Generation status for the UI: which provider is live and quota remaining. */
export async function GET() {
  const auth = await authorizeApi();
  if (auth.error) return auth.error;

  try {
    return NextResponse.json({
      ...aiEnvPublicSummary(),
      usage: await getUsage(auth.session.userId),
    });
  } catch (err) {
    const aiError = toAiError(err);
    console.error("[GET /api/studio/ai-status]", aiError.code, aiError.details ?? aiError.message);
    return NextResponse.json(aiErrorBody(aiError), { status: aiError.status });
  }
}
