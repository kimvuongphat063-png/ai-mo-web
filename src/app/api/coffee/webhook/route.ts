import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { processSepayWebhook, type SepayWebhookPayload } from "@/lib/coffee-orders";

function verifySepayApiKey(authHeader: string | null, expectedKey: string): boolean {
  if (!authHeader || !expectedKey) return false;
  // SePay sends: "Authorization: Apikey YOUR_API_KEY"
  const match = authHeader.match(/^Apikey\s+(.+)$/i);
  if (!match) return false;
  const provided = Buffer.from(match[1].trim(), "utf8");
  const expected = Buffer.from(expectedKey.trim(), "utf8");
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

export async function POST(request: NextRequest) {
  const configuredKey = process.env.SEPAY_API_KEY;
  if (!configuredKey) {
    console.error("[SePay Webhook] SEPAY_API_KEY is not configured");
    return NextResponse.json(
      { success: false, error: "Webhook secret not configured" },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (!verifySepayApiKey(authHeader, configuredKey)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  let payload: SepayWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  try {
    const result = await processSepayWebhook(payload);
    return NextResponse.json(
      { success: true, matched: result.matched, orderId: result.orderId },
      { status: 200 }
    );
  } catch (err) {
    console.error("[SePay Webhook] Processing error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
