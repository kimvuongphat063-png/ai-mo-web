import { NextRequest, NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth";
import { authorizeMutation } from "@/lib/auth-csrf";
import { checkRateLimit } from "@/lib/rate-limit-v2";
import { listProducts, createProduct } from "@/lib/studio";
import { productProfileFormSchema } from "@/lib/validation/studio";

export async function GET(req: NextRequest) {
  const auth = await authorizeApi();
  if (auth.error) return auth.error;

  try {
    const products = await listProducts(auth.session.userId);
    return NextResponse.json({ products });
  } catch (err) {
    console.error("[GET /api/studio/products]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authorizeMutation(req);
  if (auth.error) return auth.error;

  const rl = await checkRateLimit("studioMutation", auth.session.userId);
  if (!rl.allowed) {
    const retryAfterSec = Math.ceil((rl.resetMs - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Thao tác quá nhanh. Vui lòng thử lại sau.", code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(Math.max(retryAfterSec, 1)) } },
    );
  }

  try {
    const body = await req.json();
    const validated = productProfileFormSchema.parse(body);

    const product = await createProduct(auth.session.userId, {
      name: validated.name,
      url: validated.url,
      description: validated.description,
      priceOffer: validated.priceOffer,
      featuresText: validated.featuresText,
      targetCustomer: validated.targetCustomer,
      problemSolved: validated.problemSolved,
      allowedProof: validated.allowedProof,
      claimsToAvoid: validated.claimsToAvoid,
      affiliateLink: validated.affiliateLink,
      brandVoice: validated.brandVoice,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/studio/products]", err);
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }
}
