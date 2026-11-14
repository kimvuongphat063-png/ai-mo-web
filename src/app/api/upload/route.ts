import { NextRequest, NextResponse } from "next/server";
import { authorizeMutation } from "@/lib/auth-csrf";
import { checkRateLimit } from "@/lib/rate-limit-v2";
import { processAndSaveUpload, UploadCategory } from "@/lib/upload";

export async function POST(req: NextRequest) {
  // 1. Authentication & CSRF
  const auth = await authorizeMutation(req);
  if (auth.error) return auth.error;

  const userId = auth.session.userId;

  // 2. Rate limit: 20 uploads per hour per user
  const rl = await checkRateLimit("studioMutation", userId);
  if (!rl.allowed) {
    const retryAfterSec = Math.ceil((rl.resetMs - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Tải tệp quá nhanh. Vui lòng thử lại sau.", code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(Math.max(retryAfterSec, 1)) } }
    );
  }

  // 3. Process multipart form data
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Vui lòng chọn tệp hợp lệ để tải lên." },
        { status: 400 }
      );
    }

    const categoryParam = formData.get("category");
    const category: UploadCategory =
      categoryParam === "images" || categoryParam === "documents"
        ? categoryParam
        : "all";

    const result = await processAndSaveUpload(file, { category });

    return NextResponse.json({ ok: true, data: result }, { status: 201 });
  } catch (err: unknown) {
    const rawMessage = err instanceof Error ? err.message : "";
    const isValidation =
      rawMessage.startsWith("Dung lượng tệp") ||
      rawMessage.startsWith("Không thể xác định") ||
      rawMessage.startsWith("Định dạng tệp") ||
      rawMessage.startsWith("Tên tệp");
    const message = isValidation ? rawMessage : "Lỗi khi xử lý tệp tải lên.";
    console.error("[POST /api/upload]", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
