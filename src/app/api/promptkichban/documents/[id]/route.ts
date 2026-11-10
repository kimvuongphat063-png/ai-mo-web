import { NextRequest, NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import {
  getDocumentById,
  updateDocument,
  softDeleteDocument,
  type UpdateDocumentInput,
} from "@/lib/promptkichban/document-store";
import { PromptKichBanError } from "@/lib/promptkichban/ai";
import { recordSafeMetric } from "@/lib/promptkichban/observability";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/promptkichban/documents/[id]
 * Fetch a specific script document owned by the authenticated user.
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const auth = await authorizeApi();
  if (auth.error) return auth.error;

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Thiếu mã kịch bản", code: "validation" },
      { status: 400 }
    );
  }

  try {
    const document = await getDocumentById(id, auth.session.userId);
    if (!document) {
      return NextResponse.json(
        { error: "Không tìm thấy kịch bản hoặc không có quyền truy cập", code: "not_found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: document,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    if (err instanceof PromptKichBanError) {
      return NextResponse.json(err.toJSON(), { status: err.status });
    }
    console.error(`[GET /api/promptkichban/documents/${id}] Error:`, err);
    return NextResponse.json(
      { error: "Không thể lấy thông tin kịch bản lúc này", code: "unknown" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/promptkichban/documents/[id]
 * Rename, update status, or update snapshot of an owned document.
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const startTime = performance.now();
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const auth = await authorizeApi();
  if (auth.error) return auth.error;

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Thiếu mã kịch bản", code: "validation" },
      { status: 400 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Dữ liệu JSON không hợp lệ", code: "validation" },
      { status: 400 }
    );
  }

  try {
    const patch: UpdateDocumentInput = {};
    if (typeof body.title === "string") {
      patch.title = body.title;
    }
    if (body.outputSnapshot && typeof body.outputSnapshot === "object") {
      patch.outputSnapshot = body.outputSnapshot as UpdateDocumentInput["outputSnapshot"];
    }
    if (
      body.status === "saved" ||
      body.status === "draft" ||
      body.status === "archived"
    ) {
      patch.status = body.status;
    }

    const updated = await updateDocument(id, auth.session.userId, patch);
    const latencyMs = Math.round(performance.now() - startTime);

    recordSafeMetric({
      requestId: id,
      event: "update_document",
      status: "success",
      statusCode: 200,
      provider: updated.provider || "vietapi",
      model: updated.model || "deepseek-v4-flash",
      latencyMs,
    });

    return NextResponse.json(
      {
        success: true,
        data: updated,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - startTime);

    if (err instanceof PromptKichBanError) {
      recordSafeMetric({
        requestId: err.requestId,
        event: "update_document",
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
      requestId: id,
      event: "update_document",
      status: "error",
      statusCode: 500,
      provider: "postgres",
      model: "document_store",
      latencyMs,
      errorCode: "unknown",
    });

    console.error(`[PATCH /api/promptkichban/documents/${id}] Error:`, err);
    return NextResponse.json(
      { error: "Không thể cập nhật kịch bản", code: "unknown" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/promptkichban/documents/[id]
 * Soft delete an owned document.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const startTime = performance.now();
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const auth = await authorizeApi();
  if (auth.error) return auth.error;

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Thiếu mã kịch bản", code: "validation" },
      { status: 400 }
    );
  }

  try {
    const res = await softDeleteDocument(id, auth.session.userId);
    const latencyMs = Math.round(performance.now() - startTime);

    if (!res.success) {
      recordSafeMetric({
        requestId: id,
        event: "delete_document",
        status: "error",
        statusCode: 404,
        provider: "postgres",
        model: "document_store",
        latencyMs,
        errorCode: "not_found",
      });

      return NextResponse.json(
        { error: "Không tìm thấy kịch bản hoặc không có quyền xóa", code: "not_found" },
        { status: 404 }
      );
    }

    recordSafeMetric({
      requestId: id,
      event: "delete_document",
      status: "success",
      statusCode: 200,
      provider: "postgres",
      model: "document_store",
      latencyMs,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Đã xóa kịch bản thành công",
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - startTime);

    recordSafeMetric({
      requestId: id,
      event: "delete_document",
      status: "error",
      statusCode: 500,
      provider: "postgres",
      model: "document_store",
      latencyMs,
      errorCode: "unknown",
    });

    console.error(`[DELETE /api/promptkichban/documents/${id}] Error:`, err);
    return NextResponse.json(
      { error: "Không thể xóa kịch bản", code: "unknown" },
      { status: 500 }
    );
  }
}
