import { NextRequest, NextResponse } from "next/server";
import { requireSameOrigin } from "@/lib/csrf";
import {
  promptKichBanInputSchema,
  videoPromptOutputSchema,
} from "@/lib/promptkichban/schema";
import { regenerateScene } from "@/lib/promptkichban/service";
import { z } from "zod";

const regenerateSceneRequestSchema = z.object({
  input: promptKichBanInputSchema,
  currentOutput: videoPromptOutputSchema,
  sceneNumber: z.number().int().min(1),
});

export async function POST(req: NextRequest) {
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

  const parsed = regenerateSceneRequestSchema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".") || "dữ liệu"}: ${i.message}`)
      .join("; ");
    return NextResponse.json(
      { error: issues || "Dữ liệu tạo lại cảnh không hợp lệ", code: "validation" },
      { status: 400 }
    );
  }

  const { input, currentOutput, sceneNumber } = parsed.data;

  // Verify scene exists and is not locked
  const targetScene = currentOutput.scenes.find((s) => s.sceneNumber === sceneNumber);
  if (!targetScene) {
    return NextResponse.json(
      { error: `Không tìm thấy cảnh số ${sceneNumber}`, code: "not_found" },
      { status: 404 }
    );
  }

  if (targetScene.isLocked) {
    return NextResponse.json(
      { error: `Cảnh số ${sceneNumber} đang bị khóa`, code: "scene_locked" },
      { status: 400 }
    );
  }

  try {
    const updatedOutput = regenerateScene(currentOutput, sceneNumber, {
      customNotes: input?.additionalRequirements,
    });
    return NextResponse.json(
      {
        success: true,
        output: updatedOutput,
        data: updatedOutput,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[POST /api/promptkichban/regenerate-scene] Failure:", err);
    return NextResponse.json(
      { error: "Không thể tạo lại cảnh lúc này. Vui lòng thử lại.", code: "unknown" },
      { status: 500 }
    );
  }
}
