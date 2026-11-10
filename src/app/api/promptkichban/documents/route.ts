import { NextRequest, NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import {
  createDocument,
  listDocuments,
  type CreateDocumentInput,
} from "@/lib/promptkichban/document-store";
import { PromptKichBanError } from "@/lib/promptkichban/ai";
import { recordSafeMetric } from "@/lib/promptkichban/observability";

/**
 * GET /api/promptkichban/documents
 * List saved video script documents for the authenticated user.
 */
export async function GET(req: NextRequest) {
  const auth = await authorizeApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status") || undefined;
  const contentType = searchParams.get("contentType") || undefined;

  try {
    const result = await listDocuments(auth.session.userId, {
      page,
      limit,
      search,
      status,
      contentType,
    });

    return NextResponse.json(
      {
        success: true,
        data: result.documents,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit) || 1,
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    if (err instanceof PromptKichBanError) {
      return NextResponse.json(err.toJSON(), { status: err.status });
    }
    console.error("[GET /api/promptkichban/documents] Error:", err);
    return NextResponse.json(
      { error: "Không thể lấy danh sách kịch bản lúc này", code: "unknown" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/promptkichban/documents
 * Save a new video script document to the authenticated user's library.
 */
export async function POST(req: NextRequest) {
  const startTime = performance.now();
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const auth = await authorizeApi();
  if (auth.error) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Dữ liệu JSON không hợp lệ", code: "validation" },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Dữ liệu yêu cầu không hợp lệ", code: "validation" },
      { status: 400 }
    );
  }

  try {
    const statusVal =
      body.status === "saved" || body.status === "draft" || body.status === "archived"
        ? body.status
        : "saved";

    const payload: CreateDocumentInput = {
      title: typeof body.title === "string" ? body.title : undefined,
      inputSnapshot: body.inputSnapshot as CreateDocumentInput["inputSnapshot"],
      outputSnapshot: body.outputSnapshot as CreateDocumentInput["outputSnapshot"],
      provider: typeof body.provider === "string" ? body.provider : undefined,
      model: typeof body.model === "string" ? body.model : undefined,
      status: statusVal,
    };

    const document = await createDocument(auth.session.userId, payload);
    const latencyMs = Math.round(performance.now() - startTime);

    recordSafeMetric({
      requestId: document.id,
      event: "save_document",
      status: "success",
      statusCode: 201,
      provider: document.provider || "vietapi",
      model: document.model || "deepseek-v4-flash",
      latencyMs,
    });

    return NextResponse.json(
      {
        success: true,
        data: document,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - startTime);

    if (err instanceof PromptKichBanError) {
      recordSafeMetric({
        requestId: err.requestId,
        event: "save_document",
        status: "error",
        statusCode: err.status,
        provider: "postgres",
        model: "document_store",
        latencyMs,
        errorCode: err.code,
      });
      return NextResponse.json(err.toJSON(), { status: err.status });
    }

    recordSafeMetric({
      requestId: "unknown",
      event: "save_document",
      status: "error",
      statusCode: 500,
      provider: "postgres",
      model: "document_store",
      latencyMs,
      errorCode: "unknown",
    });

    console.error("[POST /api/promptkichban/documents] Error:", err);
    return NextResponse.json(
      { error: "Không thể lưu kịch bản lúc này", code: "unknown" },
      { status: 500 }
    );
  }
}
