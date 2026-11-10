# KẾ HOẠCH MIGRATION & BACKUP/RESTORE PLAN — PHASE 4
## PROMPTKICHBAN AUTHENTICATED LIBRARY & POSTGRES SYNC

> **Database:** `ai-mo-staging` (`omdviaffxevjvexausao`)  
> **Nguyên tắc an toàn:**
> - KHÔNG tự ý chạy `prisma db push` hoặc `prisma migrate deploy` khi chưa có approval rõ ràng.
> - Chỉ cập nhật schema, chạy `prisma validate` và `prisma generate` ở client layer.
> - Data store backend hỗ trợ kiến trúc thích ứng (resilient adapter) có fallback an toàn.

---

## 1. MIGRATION PLAN CHI TIẾT

### 1.1. Model mới: `PromptKichBanDocument`

```prisma
model PromptKichBanDocument {
  id                 String    @id @default(cuid())
  userId             String
  title              String
  inputSnapshot      Json
  outputSnapshot     Json
  provider           String
  model              String
  durationSeconds    Int
  aspectRatio        String
  publishingPlatform String
  contentType        String
  status             String    @default("saved") // saved, draft, archived
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  deletedAt          DateTime?

  user               User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, deletedAt])
  @@index([deletedAt])
}
```

### 1.2. Quan hệ với Model `User`
Thêm relation field vào `model User`:
```prisma
  promptKichBanDocs PromptKichBanDocument[]
```
> **Đánh giá rủi ro (Risk Assessment):**  
> Việc thêm relation field `promptKichBanDocs` ở Prisma model `User` là **metadata ảo của Prisma client**, hoàn toàn **không thêm cột hoặc thay đổi cấu trúc bảng `public."User"` trong PostgreSQL**. Do đó rủi ro ảnh hưởng tới User table hiện tại là **0%**.

### 1.3. Câu lệnh DDL PostgreSQL khi được phê duyệt chạy (Target DDL)

```sql
-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."PromptKichBanDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "inputSnapshot" JSONB NOT NULL,
    "outputSnapshot" JSONB NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "aspectRatio" TEXT NOT NULL,
    "publishingPlatform" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'saved',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PromptKichBanDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PromptKichBanDocument_userId_idx" ON "public"."PromptKichBanDocument"("userId");
CREATE INDEX IF NOT EXISTS "PromptKichBanDocument_userId_deletedAt_idx" ON "public"."PromptKichBanDocument"("userId", "deletedAt");
CREATE INDEX IF NOT EXISTS "PromptKichBanDocument_deletedAt_idx" ON "public"."PromptKichBanDocument"("deletedAt");

-- AddForeignKey
ALTER TABLE "public"."PromptKichBanDocument" 
    DROP CONSTRAINT IF EXISTS "PromptKichBanDocument_userId_fkey",
    ADD CONSTRAINT "PromptKichBanDocument_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "public"."User"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## 2. KẾ HOẠCH BACKUP & RESTORE (BACKUP & RESTORE PLAN)

### 2.1. Snapshot trước migration
- Script backup: `scripts/pg-backup-restorepoint.ts`
- Tạo bản snapshot JSON toàn diện lưu trữ tại: `backups/pg-restore-point-<timestamp>.json`
- Đảm bảo snapshot toàn bộ schema và data liên quan trước bất kỳ thao tác DDL nào.

### 2.2. Kế hoạch khôi phục / Rollback (Rollback Plan)
Nếu có bất kỳ vấn đề phát sinh sau khi migration, thực thi lệnh hủy bảng độc lập:
```sql
DROP TABLE IF EXISTS "public"."PromptKichBanDocument" CASCADE;
```
Vì bảng `PromptKichBanDocument` là bảng tạo mới độc lập, việc rollback DROP bảng này hoàn toàn khôi phục database về trạng thái nguyên trạng 100% mà không gây ảnh hưởng đến bất kỳ dữ liệu `User`, `Studio*`, hay storefront hiện có nào.

---

## 3. QUY TRÌNH THỰC HIỆN GIAI ĐOẠN 4 (PHASE 4 WORKFLOW)

1. **Prisma Update & Client Generation:**
   - Cập nhật `prisma/schema.prisma` với `PromptKichBanDocument`.
   - Chạy `npx prisma validate` đảm bảo cú pháp hợp lệ.
   - Chạy `npx prisma generate` sinh type-definitions cho TypeScript.
   - **Tạm dừng và KHÔNG chạy migration/push lên staging DB** cho đến khi có approval rõ ràng.
2. **Kiến trúc Resilient Document Store (`src/lib/promptkichban/document-store.ts`):**
   - Hỗ trợ lưu trữ Postgres nếu bảng đã tồn tại, tự động fallback an toàn sang in-memory mock store trong môi trường test/local khi bảng DB chưa tạo.
   - Bắt buộc kiểm tra quyền sở hữu: `WHERE id = recordId AND userId = session.userId AND deletedAt IS NULL`.
   - Validate JSON input/output bằng Zod schema trước khi lưu.
   - Tuyệt đối không lưu API key hoặc secrets.
3. **Phát triển API Endpoints (`/api/promptkichban/documents`):**
   - Hỗ trợ đầy đủ CRUD: List, Create, Get, Update (rename/save), Delete (soft-delete).
   - Xác thực người dùng qua `authorizeApi()` từ `@/lib/auth`.
4. **Tích hợp Giao diện (UI Integration):**
   - Người dùng guest vẫn giữ trải nghiệm mượt mà với LocalStorage.
   - Người dùng đăng nhập có nút "Lưu vào tài khoản", xem lịch sử đồng bộ đa thiết bị, đổi tên và mở lại kịch bản cũ trong Storyboard Workspace.
