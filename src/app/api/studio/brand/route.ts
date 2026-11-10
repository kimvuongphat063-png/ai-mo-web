import { NextRequest, NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth";
import { authorizeMutation } from "@/lib/auth-csrf";
import { getBrandProfile, upsertBrandProfile } from "@/lib/studio";
import { z } from "zod";

// Validation schema matching BrandProfile from studio.ts
const brandProfileInputSchema = z.object({
  companyName: z.string().trim().max(200).optional(),
  brandVoice: z.string().trim().max(2000).optional(),
  prohibitedClaims: z.string().trim().max(1000).optional(),
  requiredDisclosures: z.string().trim().max(1000).optional(),
  preferredFormats: z.array(z.string()).default([]),
  targetAudience: z.string().trim().max(500).optional(),
  competitorUrls: z.array(z.string()).default([]),
  language: z.enum(["vi", "en"]).default("vi"),
});

export async function GET(req: NextRequest) {
  const auth = await authorizeApi();
  if (auth.error) return auth.error;

  try {
    const profile = await getBrandProfile(auth.session.userId);
    return NextResponse.json({ profile });
  } catch (err) {
    console.error("[GET /api/studio/brand]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await authorizeMutation(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const validated = brandProfileInputSchema.parse(body);

    const profile = await upsertBrandProfile(auth.session.userId, {
      companyName: validated.companyName,
      brandVoice: validated.brandVoice,
      prohibitedClaims: validated.prohibitedClaims,
      requiredDisclosures: validated.requiredDisclosures,
      preferredFormats: validated.preferredFormats,
      targetAudience: validated.targetAudience,
      competitorUrls: validated.competitorUrls,
      language: validated.language,
    });

    return NextResponse.json({ profile });
  } catch (err) {
    console.error("[PUT /api/studio/brand]", err);
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }
}
