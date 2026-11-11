import { NextRequest, NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth";
import { authorizeMutation } from "@/lib/auth-csrf";
import { checkRateLimit } from "@/lib/rate-limit-v2";
import { listScripts, createScript, getProduct, getBrandProfile, updateProduct } from "@/lib/studio";
import { scriptWizardFormSchema } from "@/lib/validation/studio";
import {
  aiErrorBody,
  analyzeProduct,
  consumeQuota,
  generateScripts,
  getUsage,
  refundQuota,
  toAiError,
} from "@/lib/ai";
import { createHash } from "node:crypto";
import type { ScriptInput, SellingAngle, BrandContext, ProductAnalysis } from "@/lib/ai/contract";

export async function GET(req: NextRequest) {
  const auth = await authorizeApi();
  if (auth.error) return auth.error;

  try {
    const scripts = await listScripts(auth.session.userId);
    return NextResponse.json({ scripts });
  } catch (err) {
    console.error("[GET /api/studio/scripts]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authorizeMutation(req);
  if (auth.error) return auth.error;

  const userId = auth.session.userId;

  // Rate limit: 30 AI generations per day per user.
  const rl = await checkRateLimit("aiGenerate", userId);
  if (!rl.allowed) {
    const retryAfterSec = Math.ceil((rl.resetMs - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Đã đạt giới hạn tạo kịch bản hôm nay.", code: "quota" },
      { status: 429, headers: { "Retry-After": String(Math.max(retryAfterSec, 1)) } },
    );
  }

  let validated: ReturnType<typeof scriptWizardFormSchema.parse>;
  try {
    validated = scriptWizardFormSchema.parse(await req.json());
  } catch (err) {
    console.error("[POST /api/studio/scripts] invalid payload", err);
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  // Ownership: the product must belong to the authenticated user.
  const product = await getProduct(userId, validated.productProfileId);
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

  let reserved = false;
  try {
    await consumeQuota(userId);
    reserved = true;

    let analysis: ProductAnalysis;
    if (product.analysisCache && product.analysisFingerprint === fingerprint) {
      analysis = product.analysisCache as ProductAnalysis;
    } else {
      analysis = await analyzeProduct({
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
      await updateProduct(userId, product.id, { 
        analysisCache: analysis, 
        analysisFingerprint: fingerprint 
      });
    }

    const selectedAngle = analysis.sellingAngles.find(
      (a: SellingAngle) => a.id === validated.selectedAngleId
    );
    if (!selectedAngle) {
      return NextResponse.json({ error: "Selling angle not found" }, { status: 400 });
    }

    const scriptInput: ScriptInput = {
      product: {
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
      },
      analysis,
      selectedAngle,
      platform: validated.platform,
      goal: validated.goal,
      durationSeconds: validated.durationSeconds,
      format: validated.format,
      presenter: validated.presenter,
      tone: validated.tone,
      cta: validated.cta,
      complianceConstraints: validated.complianceConstraints,
      brandContext,
    };

    const generation = await generateScripts(scriptInput);

    const script = await createScript(userId, {
      productProfileId: product.id,
      platform: validated.platform,
      goal: validated.goal,
      durationSeconds: validated.durationSeconds,
      selectedAngleId: selectedAngle.id,
      scripts: generation.scripts,
      missingInformation: generation.missingInformation,
      complianceNotes: generation.complianceNotes,
    });

    return NextResponse.json(
      { script, generation, usage: await getUsage(userId) },
      { status: 201 }
    );
  } catch (err) {
    const aiError = toAiError(err);
    if (reserved && aiError.code !== "quota") await refundQuota(userId).catch(() => undefined);
    console.error("[POST /api/studio/scripts]", aiError.code, aiError.details ?? aiError.message);
    return NextResponse.json(aiErrorBody(aiError), { status: aiError.status });
  }
}
