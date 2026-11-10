/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomUUID } from "node:crypto";
import {
  type PromptKichBanInput,
  type VideoPromptOutput,
  promptKichBanInputSchema,
  videoPromptOutputSchema,
} from "./schema";
import { PromptKichBanError } from "./ai";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PromptKichBanDocumentDto {
  id: string;
  userId: string;
  title: string;
  inputSnapshot: PromptKichBanInput;
  outputSnapshot: VideoPromptOutput;
  provider: string;
  model: string;
  durationSeconds: number;
  aspectRatio: string;
  publishingPlatform: string;
  contentType: string;
  status: "saved" | "draft" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentInput {
  title?: string;
  inputSnapshot: PromptKichBanInput;
  outputSnapshot: VideoPromptOutput;
  provider?: string;
  model?: string;
  status?: "saved" | "draft" | "archived";
}

export interface UpdateDocumentInput {
  title?: string;
  outputSnapshot?: VideoPromptOutput;
  status?: "saved" | "draft" | "archived";
}

export interface ListDocumentsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  contentType?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Prisma Client Singleton & Fallback Memory Store
// ─────────────────────────────────────────────────────────────────────────────

let cachedPrisma: any = null;

function getPrisma() {
  if (!cachedPrisma) {
    const url = process.env.DATABASE_URL;
    const adapter = url ? new PrismaPg({ connectionString: url }) : undefined;
    cachedPrisma = new (PrismaClient as any)(adapter ? { adapter } : {});
  }
  return cachedPrisma;
}

// Memory store for isolated tests or when table is not yet migrated to Postgres
const memoryStore = new Map<string, PromptKichBanDocumentDto & { deletedAt: string | null }>();

/**
 * Checks whether in-memory fallback is allowed.
 * Permitted only in development, testing, or database-less builds.
 * Strictly forbidden in staging/production to prevent data loss.
 */
function isMemoryFallbackAllowed(): boolean {
  if (process.env.NODE_ENV === "production" && process.env.PROMPTKICHBAN_ALLOW_MEMORY_FALLBACK !== "true") {
    return false;
  }
  return true;
}

function assertStorageReady(operation: string) {
  if (!isMemoryFallbackAllowed()) {
    throw new PromptKichBanError("config", {
      details: `Không thể thực hiện '${operation}': bảng PromptKichBanDocument chưa sẵn sàng hoặc kết nối PostgreSQL thất bại trong môi trường production.`,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sanitization & Validation Helpers
// ─────────────────────────────────────────────────────────────────────────────

function cleanTitle(title: string | undefined, defaultTitle: string): string {
  const trimmed = (title || "").trim();
  if (!trimmed) return defaultTitle.slice(0, 150);
  return trimmed.slice(0, 150);
}

function sanitizeDocument(doc: any): PromptKichBanDocumentDto {
  return {
    id: doc.id,
    userId: doc.userId,
    title: doc.title,
    inputSnapshot: doc.inputSnapshot as PromptKichBanInput,
    outputSnapshot: doc.outputSnapshot as VideoPromptOutput,
    provider: doc.provider,
    model: doc.model,
    durationSeconds: doc.durationSeconds,
    aspectRatio: doc.aspectRatio,
    publishingPlatform: doc.publishingPlatform,
    contentType: doc.contentType,
    status: (doc.status as any) || "saved",
    createdAt: typeof doc.createdAt === "string" ? doc.createdAt : doc.createdAt.toISOString(),
    updatedAt: typeof doc.updatedAt === "string" ? doc.updatedAt : doc.updatedAt.toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Document Store Operations (Strictly Filtered by session.userId)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates and persists a PromptKichBan document for an authenticated user.
 */
export async function createDocument(
  userId: string,
  payload: CreateDocumentInput
): Promise<PromptKichBanDocumentDto> {
  if (!userId || typeof userId !== "string") {
    throw new PromptKichBanError("validation", {
      details: "Thiếu thông tin định danh người dùng.",
    });
  }

  // Validate snapshots
  const parsedInput = promptKichBanInputSchema.safeParse(payload.inputSnapshot);
  if (!parsedInput.success) {
    throw new PromptKichBanError("validation", {
      details: `Input snapshot không hợp lệ: ${parsedInput.error.message}`,
    });
  }

  const parsedOutput = videoPromptOutputSchema.safeParse(payload.outputSnapshot);
  if (!parsedOutput.success) {
    throw new PromptKichBanError("validation", {
      details: `Output snapshot không hợp lệ: ${parsedOutput.error.message}`,
    });
  }

  // Size limit check on JSON snapshots (max 250KB per snapshot)
  const inputStr = JSON.stringify(parsedInput.data);
  const outputStr = JSON.stringify(parsedOutput.data);
  if (inputStr.length > 250_000 || outputStr.length > 250_000) {
    throw new PromptKichBanError("validation", {
      details: "Dung lượng kịch bản vượt quá giới hạn cho phép (tối đa 250KB mỗi snapshot).",
    });
  }

  const title = cleanTitle(payload.title, parsedOutput.data.title || "Kịch bản video mới");
  const provider = payload.provider || process.env.PROMPTKICHBAN_AI_PROVIDER || "vietapi";
  const model = payload.model || process.env.PROMPTKICHBAN_AI_MODEL || "deepseek-v4-flash";
  const durationSeconds = parsedInput.data.durationSeconds;
  const aspectRatio = parsedInput.data.aspectRatio;
  const publishingPlatform = parsedInput.data.publishingPlatform;
  const contentType = parsedInput.data.contentType;
  const status = payload.status || "saved";
  const now = new Date();

  // 1. Try Postgres via Prisma if configured
  if (process.env.DATABASE_URL) {
    try {
      const db = getPrisma();

      // Per-user quota check (max 100 documents per user)
      const existingCount = await db.promptKichBanDocument.count({
        where: { userId, deletedAt: null },
      });
      if (existingCount >= 100) {
        throw new PromptKichBanError("quota", {
          details: "Bạn đã đạt giới hạn tối đa 100 kịch bản lưu trữ trên tài khoản. Vui lòng xóa bớt kịch bản cũ để lưu thêm.",
        });
      }

      const created = await db.promptKichBanDocument.create({
        data: {
          userId,
          title,
          inputSnapshot: parsedInput.data as any,
          outputSnapshot: parsedOutput.data as any,
          provider,
          model,
          durationSeconds,
          aspectRatio,
          publishingPlatform,
          contentType,
          status,
          createdAt: now,
          updatedAt: now,
        },
      });
      return sanitizeDocument(created);
    } catch (err: any) {
      if (err instanceof PromptKichBanError) throw err;
      if (!isMemoryFallbackAllowed()) {
        console.error("[PromptKichBan DocumentStore] Prisma create error in production:", err);
        throw new PromptKichBanError("config", {
          details: "Lỗi cơ sở dữ liệu: không thể ghi kịch bản vào PostgreSQL trong môi trường production.",
        });
      }
      // P2021: Table does not exist yet (pre-migration approval stage in non-prod)
      if (err?.code !== "P2021") {
        console.error("[PromptKichBan DocumentStore] Prisma create error:", err);
      }
    }
  }

  // 2. Memory fallback (only permitted in dev/test/offline)
  assertStorageReady("createDocument");
  const id = `pkb_${randomUUID().replace(/-/g, "").slice(0, 24)}`;
  const doc: PromptKichBanDocumentDto & { deletedAt: string | null } = {
    id,
    userId,
    title,
    inputSnapshot: parsedInput.data,
    outputSnapshot: parsedOutput.data,
    provider,
    model,
    durationSeconds,
    aspectRatio,
    publishingPlatform,
    contentType,
    status,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    deletedAt: null,
  };
  memoryStore.set(id, doc);
  return sanitizeDocument(doc);
}

/**
 * Lists documents owned by the authenticated user with optional search and pagination.
 * Excludes soft-deleted records (`deletedAt IS NULL`).
 */
export async function listDocuments(
  userId: string,
  query?: ListDocumentsQuery
): Promise<{
  documents: PromptKichBanDocumentDto[];
  total: number;
  page: number;
  limit: number;
}> {
  if (!userId || typeof userId !== "string") {
    throw new PromptKichBanError("validation", {
      details: "Thiếu thông tin định danh người dùng.",
    });
  }

  const page = Math.max(1, Number(query?.page) || 1);
  const limit = Math.max(1, Math.min(50, Number(query?.limit) || 20));
  const skip = (page - 1) * limit;
  const search = (query?.search || "").trim().toLowerCase();
  const contentType = query?.contentType;
  const status = query?.status;

  // 1. Try Postgres via Prisma
  if (process.env.DATABASE_URL) {
    try {
      const db = getPrisma();
      const where: any = {
        userId,
        deletedAt: null,
      };

      if (search) {
        where.title = { contains: search, mode: "insensitive" };
      }
      if (contentType) {
        where.contentType = contentType;
      }
      if (status) {
        where.status = status;
      }

      const [total, items] = await Promise.all([
        db.promptKichBanDocument.count({ where }),
        db.promptKichBanDocument.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          skip,
          take: limit,
        }),
      ]);

      return {
        documents: items.map(sanitizeDocument),
        total,
        page,
        limit,
      };
    } catch (err: any) {
      if (err instanceof PromptKichBanError) throw err;
      if (!isMemoryFallbackAllowed()) {
        console.error("[PromptKichBan DocumentStore] Prisma list error in production:", err);
        throw new PromptKichBanError("config", {
          details: "Lỗi cơ sở dữ liệu: không thể lấy danh sách kịch bản từ PostgreSQL trong môi trường production.",
        });
      }
      if (err?.code !== "P2021") {
        console.error("[PromptKichBan DocumentStore] Prisma list error:", err);
      }
    }
  }

  // 2. Memory fallback (only permitted in dev/test/offline)
  assertStorageReady("listDocuments");
  const userDocs = Array.from(memoryStore.values()).filter(
    (d) =>
      d.userId === userId &&
      !d.deletedAt &&
      (!search || d.title.toLowerCase().includes(search)) &&
      (!contentType || d.contentType === contentType) &&
      (!status || d.status === status)
  );

  userDocs.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const paginated = userDocs.slice(skip, skip + limit);

  return {
    documents: paginated.map(sanitizeDocument),
    total: userDocs.length,
    page,
    limit,
  };
}

/**
 * Retrieves a single document by ID, strictly verifying ownership (`userId`).
 * Returns null if not found or owned by a different user.
 */
export async function getDocumentById(
  id: string,
  userId: string
): Promise<PromptKichBanDocumentDto | null> {
  if (!id || !userId) return null;

  // 1. Try Postgres via Prisma
  if (process.env.DATABASE_URL) {
    try {
      const db = getPrisma();
      const doc = await db.promptKichBanDocument.findFirst({
        where: {
          id,
          userId,
          deletedAt: null,
        },
      });
      if (doc) return sanitizeDocument(doc);
      return null;
    } catch (err: any) {
      if (err instanceof PromptKichBanError) throw err;
      if (!isMemoryFallbackAllowed()) {
        console.error("[PromptKichBan DocumentStore] Prisma get error in production:", err);
        throw new PromptKichBanError("config", {
          details: "Lỗi cơ sở dữ liệu: không thể đọc kịch bản từ PostgreSQL trong môi trường production.",
        });
      }
      if (err?.code !== "P2021") {
        console.error("[PromptKichBan DocumentStore] Prisma get error:", err);
      }
    }
  }

  // 2. Memory fallback (only permitted in dev/test/offline)
  assertStorageReady("getDocumentById");
  const doc = memoryStore.get(id);
  if (!doc || doc.userId !== userId || doc.deletedAt) return null;
  return sanitizeDocument(doc);
}

/**
 * Updates title, outputSnapshot, or status of an existing document owned by `userId`.
 */
export async function updateDocument(
  id: string,
  userId: string,
  patch: UpdateDocumentInput
): Promise<PromptKichBanDocumentDto> {
  if (!id || !userId) {
    throw new PromptKichBanError("validation", {
      details: "Thiếu ID hoặc thông tin người dùng.",
    });
  }

  const now = new Date();
  const updateData: any = { updatedAt: now };

  if (patch.title !== undefined) {
    updateData.title = cleanTitle(patch.title, "Kịch bản video");
  }

  if (patch.status !== undefined) {
    updateData.status = patch.status;
  }

  if (patch.outputSnapshot) {
    const parsed = videoPromptOutputSchema.safeParse(patch.outputSnapshot);
    if (!parsed.success) {
      throw new PromptKichBanError("validation", {
        details: `Output snapshot cập nhật không hợp lệ: ${parsed.error.message}`,
      });
    }
    updateData.outputSnapshot = parsed.data;
  }

  // 1. Try Postgres via Prisma
  if (process.env.DATABASE_URL) {
    try {
      const db = getPrisma();
      // Ensure ownership check on update:
      const existing = await db.promptKichBanDocument.findFirst({
        where: { id, userId, deletedAt: null },
      });
      if (!existing) {
        throw new PromptKichBanError("not_found", {
          details: "Không tìm thấy kịch bản hoặc bạn không có quyền sửa đổi.",
        });
      }

      const updated = await db.promptKichBanDocument.update({
        where: { id },
        data: updateData,
      });

      return sanitizeDocument(updated);
    } catch (err: any) {
      if (err instanceof PromptKichBanError) throw err;
      if (!isMemoryFallbackAllowed()) {
        console.error("[PromptKichBan DocumentStore] Prisma update error in production:", err);
        throw new PromptKichBanError("config", {
          details: "Lỗi cơ sở dữ liệu: không thể cập nhật kịch bản trong PostgreSQL trong môi trường production.",
        });
      }
      if (err?.code !== "P2021") {
        console.error("[PromptKichBan DocumentStore] Prisma update error:", err);
      }
    }
  }

  // 2. Memory fallback (only permitted in dev/test/offline)
  assertStorageReady("updateDocument");
  const existing = memoryStore.get(id);
  if (!existing || existing.userId !== userId || existing.deletedAt) {
    throw new PromptKichBanError("not_found", {
      details: "Không tìm thấy kịch bản hoặc bạn không có quyền sửa đổi.",
    });
  }

  const updatedDoc = {
    ...existing,
    ...updateData,
    updatedAt: now.toISOString(),
  };
  memoryStore.set(id, updatedDoc);
  return sanitizeDocument(updatedDoc);
}

/**
 * Soft deletes a document owned by `userId` (`deletedAt = now()`).
 */
export async function softDeleteDocument(
  id: string,
  userId: string
): Promise<{ success: boolean }> {
  if (!id || !userId) return { success: false };
  const now = new Date();

  // 1. Try Postgres via Prisma
  if (process.env.DATABASE_URL) {
    try {
      const db = getPrisma();
      const existing = await db.promptKichBanDocument.findFirst({
        where: { id, userId, deletedAt: null },
      });
      if (!existing) return { success: false };

      await db.promptKichBanDocument.update({
        where: { id },
        data: { deletedAt: now },
      });
      return { success: true };
    } catch (err: any) {
      if (err instanceof PromptKichBanError) throw err;
      if (!isMemoryFallbackAllowed()) {
        console.error("[PromptKichBan DocumentStore] Prisma delete error in production:", err);
        throw new PromptKichBanError("config", {
          details: "Lỗi cơ sở dữ liệu: không thể xóa kịch bản trong PostgreSQL trong môi trường production.",
        });
      }
      if (err?.code !== "P2021") {
        console.error("[PromptKichBan DocumentStore] Prisma delete error:", err);
      }
    }
  }

  // 2. Memory fallback (only permitted in dev/test/offline)
  assertStorageReady("softDeleteDocument");
  const existing = memoryStore.get(id);
  if (!existing || existing.userId !== userId || existing.deletedAt) {
    return { success: false };
  }

  existing.deletedAt = now.toISOString();
  memoryStore.set(id, existing);
  return { success: true };
}

/**
 * Testing helper: clears in-memory store for unit test isolation.
 */
export function _resetMemoryStoreForTesting() {
  memoryStore.clear();
}
