import { NextRequest, NextResponse } from "next/server";
import { requireSameOrigin } from "@/lib/csrf";
import { promptKichBanInputSchema } from "@/lib/promptkichban/schema";
import { generatePromptKichBan } from "@/lib/promptkichban/service";
import { checkPromptKichBanRateLimit } from "@/lib/promptkichban/rate-limit";
import {
  PromptKichBanError,
  getPromptKichBanEnv,
  getLastAiExecutionMeta,
} from "@/lib/promptkichban/ai";
import { recordSafeMetric } from "@/lib/promptkichban/observability";

export async function POST(req: NextRequest) {
  const startTime = performance.now();

  // CSRF protection for mutations
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Dữ liệu yêu cầu không đúng định dạng JSON", code: "validation" },
      { status: 400 }
    );
  }

  // Validate Input
  const parsedInput = promptKichBanInputSchema.safeParse(body);
  if (!parsedInput.success) {
    const issues = parsedInput.error.issues
      .map((i) => `${i.path.join(".") || "dữ liệu"}: ${i.message}`)
      .join("; ");
    return NextResponse.json(
      { error: issues || "Dữ liệu nhập vào không hợp lệ", code: "validation" },
      { status: 400 }
    );
  }

  // Client IP rate limiting
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  try {
    const rl = await checkPromptKichBanRateLimit(clientIp);
    if (!rl.allowed) {
      const retryAfterSec = Math.ceil(Math.max(1, (rl.resetMs - Date.now()) / 1000));
      const latencyMs = Math.round(performance.now() - startTime);

      recordSafeMetric({
        requestId: "rate_limited",
        event: "generate",
        status: "error",
        statusCode: 429,
        provider: "rate_limit",
        model: "rate_limit",
        latencyMs,
        errorCode: "quota",
        quotaRemaining: 0,
      });

      return NextResponse.json(
        {
          error:
            "Bạn đã đạt giới hạn tạo kịch bản miễn phí trong hôm nay. Vui lòng quay lại vào ngày mai.",
          code: "quota",
          remaining: 0,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSec),
          },
        }
      );
    }

    // Generate storyboard & prompts
    const output = await generatePromptKichBan(parsedInput.data);
    const latencyMs = Math.round(performance.now() - startTime);
    const meta = getLastAiExecutionMeta();
    const env = getPromptKichBanEnv();

    // Safe Observability: Log request completion without prompt/output text
    recordSafeMetric({
      requestId: output.requestId,
      event: "generate",
      status: "success",
      statusCode: 200,
      provider: env.provider,
      model: meta?.model || env.model || "unknown",
      latencyMs,
      sceneCount: output.scenes?.length,
      promptTokens: meta?.promptTokens,
      completionTokens: meta?.completionTokens,
      totalTokens: meta?.totalTokens,
      quotaRemaining: rl.remaining,
    });

    return NextResponse.json(
      {
        success: true,
        output,
        data: output,
        rateLimit: {
          remaining: rl.remaining,
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - startTime);
    const env = getPromptKichBanEnv();

    if (err instanceof PromptKichBanError) {
      recordSafeMetric({
        requestId: err.requestId,
        event: "generate",
        status: "error",
        statusCode: err.status,
        provider: env.provider,
        model: env.model || "unknown",
        latencyMs,
        errorCode: err.code,
      });
      return NextResponse.json(err.toJSON(), { status: err.status });
    }

    recordSafeMetric({
      requestId: "unknown",
      event: "generate",
      status: "error",
      statusCode: 500,
      provider: env.provider,
      model: env.model || "unknown",
      latencyMs,
      errorCode: "unknown",
    });

    console.error("[POST /api/promptkichban/generate] Unexpected failure:", err);
    return NextResponse.json(
      {
        error: "Không thể tạo kịch bản lúc này. Vui lòng thử lại sau.",
        code: "unknown",
      },
      { status: 500 }
    );
  }
}
