import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileTypeFromBuffer } from "file-type";

export type UploadCategory = "images" | "documents" | "all";

export interface UploadOptions {
  category?: UploadCategory;
  maxSizeBytes?: number;
}

export interface UploadResult {
  url: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

const ALLOWED_MIME_TYPES: Record<UploadCategory, string[]> = {
  images: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"],
  documents: ["application/pdf", "text/plain", "text/markdown"],
  all: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
    "application/pdf",
    "text/plain",
    "text/markdown",
  ],
};

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB default

export async function processAndSaveUpload(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const category = options.category ?? "all";
  const maxSizeBytes = options.maxSizeBytes ?? DEFAULT_MAX_SIZE;

  // 1. Size check
  if (file.size > maxSizeBytes) {
    const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
    throw new Error(`Dung lượng tệp vượt quá giới hạn tối đa (${maxMb}MB).`);
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 2. MIME type inspection (magic number validation)
  const detectedType = await fileTypeFromBuffer(buffer);
  let mimeType: string | undefined = detectedType?.mime;

  // Fallback for plain text or SVG which file-type may not flag as binary
  if (!mimeType) {
    if (file.type === "image/svg+xml") {
      mimeType = "image/svg+xml";
    } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      mimeType = "text/plain";
    } else if (file.type === "text/markdown" || file.name.endsWith(".md")) {
      mimeType = "text/markdown";
    }
  }

  if (!mimeType) {
    throw new Error("Không thể xác định định dạng tệp hoặc định dạng không an toàn.");
  }

  const allowedList = ALLOWED_MIME_TYPES[category] || ALLOWED_MIME_TYPES.all;
  if (!allowedList.includes(mimeType)) {
    throw new Error(`Định dạng tệp "${mimeType}" không được hỗ trợ trong danh mục này.`);
  }

  // 3. Filename sanitization
  const safeBaseName = path
    .basename(file.name)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80);
  const ext = detectedType?.ext ? `.${detectedType.ext}` : path.extname(safeBaseName) || ".bin";
  const uniqueId = crypto.randomUUID().slice(0, 12);
  const finalFileName = `${Date.now()}-${uniqueId}${ext}`;

  // 4. Save to public/uploads
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  const destinationPath = path.join(uploadDir, finalFileName);
  await fs.writeFile(destinationPath, buffer);

  return {
    url: `/uploads/${finalFileName}`,
    originalName: file.name,
    fileName: finalFileName,
    mimeType,
    sizeBytes: buffer.length,
  };
}
