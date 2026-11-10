import { NextRequest, NextResponse } from "next/server";
import { authorizeMutation } from "@/lib/auth-csrf";
import { getProduct, updateProduct, getBrandProfile } from "@/lib/studio";
import {
  aiErrorBody,
  analyzeProduct,
  consumeQuota,
  getUsage,
  refundQuota,
  toAiError,
} from "@/lib/ai";
import { createHash } from "node:crypto";
import { BrandContext } from "@/lib/ai/contract";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await authorizeMutation(req);
  if (auth.error) return auth.error;
  const userId = auth.session.userId;

  const { id } = await params;
  // Ownership: getProduct filters by userId, so a foreign id yields 404.
  const product = await getProduct(userId, id);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const brandProfile = await getBrandProfile(userId);
  let brandContext: BrandContext | undefined = undefined;
  if (brandProfile) {
    brandContext = {
      brandName: brandProfile.companyName,
      targetAudience: brandProfile.targetAudience,
      voiceTone: brandProfile.brandVoice,
      requiredDisclosure: brandProfile.requiredDisclosures,
      claimsToAvoid: brandProfile.prohibitedClaims,
    };
  }

  // Fingerprint cache
  const fingerprintInput = JSON.stringify({
    name: product.name,
    description: product.description,
    priceOffer: product.priceOffer,
    featuresText: product.featuresText,
    targetCustomer: product.targetCustomer,
    problemSolved: product.problemSolved,
    allowedProof: product.allowedProof,
    claimsToAvoid: product.claimsToAvoid,
    brandVoice: product.brandVoice,
    brandUpdatedAt: brandProfile?.updatedAt,
  });
  const fingerprint = createHash("sha256").update(fingerprintInput).digest("hex");

  const url = new URL(req.url);
  const isRefresh = url.searchParams.get("refresh") === "1";

  if (!isRefresh && product.analysisCache && product.analysisFingerprint === fingerprint) {
    return NextResponse.json({ 
      analysis: product.analysisCache, 
      usage: await getUsage(userId), 
      cached: true,
      ...product.analysisCache 
    });
  }

  let reserved = false;
  try {
    await consumeQuota(userId);
    reserved = true;

    const analysis = await analyzeProduct({
      name: product.name,
      description: product.description,
      priceOffer: product.priceOffer,
      featuresText: product.featuresText,
      targetCustomer: product.targetCustomer,
      problemSolved: product.problemSolved,
      allowedProof: product.allowedProof ?? "",
      claimsToAvoid: product.claimsToAvoid ?? "",
      brandVoice: product.brandVoice,
      brandContext,
    });
    
    await updateProduct(userId, id, { 
      analysisCache: analysis, 
      analysisFingerprint: fingerprint 
    });

    return NextResponse.json({ analysis, usage: await getUsage(userId), ...analysis, cached: false });
  } catch (err) {
    const aiError = toAiError(err);
    if (reserved && aiError.code !== "quota") await refundQuota(userId).catch(() => undefined);
    console.error("[POST /api/studio/products/[id]/analyze]", aiError.code, aiError.details ?? aiError.message);
    return NextResponse.json(aiErrorBody(aiError), { status: aiError.status });
  }
}
