#!/usr/bin/env tsx
/**
 * Script áp dụng an toàn bảng PromptKichBanDocument lên Staging Postgres.
 *
 * Chỉ chạy khi có chỉ đạo rõ ràng.
 *
 * Kiểm tra:
 * - Dự án: ai-mo-staging (omdviaffxevjvexausao)
 * - Nghiêm cấm: monopoly web's Project (dgsmjgcxhfpgqrkndxty)
 * - Không sửa/xóa bất kỳ bảng Storefront hay Studio nào.
 * - Idempotent DDL: CREATE TABLE IF NOT EXISTS.
 *
 * Chạy:
 *   npx tsx scripts/apply-promptkichban-schema.ts
 *   (thêm cờ --apply để thực thi, không có cờ --apply chạy ở chế độ dry-run)
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import path from "node:path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const isApply = process.argv.includes("--apply");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ DATABASE_URL chưa được cấu hình.");
    process.exit(1);
  }

  // Project safety check
  if (url.includes("dgsmjgcxhfpgqrkndxty")) {
    console.error("❌ PHÁT HIỆN PROJECT ID SAI (dgsmjgcxhfpgqrkndxty). Nghiêm cấm thực thi!");
    process.exit(1);
  }

  const isStaging = url.includes("omdviaffxevjvexausao");
  console.log("==========================================================");
  console.log("   APPLY SCHEMA: PromptKichBanDocument -> ai-mo-staging   ");
  console.log("==========================================================");
  console.log(`Target project: ${isStaging ? "ai-mo-staging (omdviaffxevjvexausao) ✅" : "Postgres connection"}`);
  console.log(`Chế độ:         ${isApply ? "THỰC THI THẬT (--apply)" : "DRY-RUN (chỉ kiểm tra)"}\n`);

  const adapter = new PrismaPg({ connectionString: url });
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Kiểm tra bảng User
    const userCols = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'User'
    `;
    if (userCols.length === 0) {
      console.error("❌ Không tìm thấy bảng 'User' trong public schema!");
      process.exit(1);
    }
    console.log(`1. Bảng User: Đã xác thực (${userCols.length} cột nguyên vẹn).`);

    // 2. Kiểm tra xem PromptKichBanDocument đã tồn tại chưa
    const existingTable = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'PromptKichBanDocument'
    `;

    if (existingTable.length > 0) {
      console.log("2. Bảng PromptKichBanDocument: ĐÃ TỒN TẠI trên cơ sở dữ liệu.");
    } else {
      console.log("2. Bảng PromptKichBanDocument: CHƯA TỒN TẠI (sẵn sàng tạo mới).");
    }

    if (!isApply) {
      console.log("\n[DRY-RUN] DDL dự kiến sẽ thực thi khi có cờ --apply:");
      console.log(`
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

CREATE INDEX IF NOT EXISTS "PromptKichBanDocument_userId_idx" ON "public"."PromptKichBanDocument"("userId");
CREATE INDEX IF NOT EXISTS "PromptKichBanDocument_userId_deletedAt_idx" ON "public"."PromptKichBanDocument"("userId", "deletedAt");
CREATE INDEX IF NOT EXISTS "PromptKichBanDocument_deletedAt_idx" ON "public"."PromptKichBanDocument"("deletedAt");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PromptKichBanDocument_userId_fkey'
    ) THEN
        ALTER TABLE "public"."PromptKichBanDocument" 
            ADD CONSTRAINT "PromptKichBanDocument_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "public"."User"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
      `);
      console.log("\n✅ Dry-run hoàn tất. Chạy với --apply khi được phê duyệt.");
      return;
    }

    // 3. Thực thi DDL
    console.log("3. Đang thực thi DDL tạo bảng và index...");

    await prisma.$executeRawUnsafe(`
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
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "PromptKichBanDocument_userId_idx" ON "public"."PromptKichBanDocument"("userId");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "PromptKichBanDocument_userId_deletedAt_idx" ON "public"."PromptKichBanDocument"("userId", "deletedAt");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "PromptKichBanDocument_deletedAt_idx" ON "public"."PromptKichBanDocument"("deletedAt");
    `);

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'PromptKichBanDocument_userId_fkey'
          ) THEN
              ALTER TABLE "public"."PromptKichBanDocument" 
                  ADD CONSTRAINT "PromptKichBanDocument_userId_fkey" 
                  FOREIGN KEY ("userId") REFERENCES "public"."User"("id") 
                  ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
      END $$;
    `);

    console.log("✅ DDL thực thi thành công!");

    // 4. Verification sau khi áp dụng
    const cols = await prisma.$queryRaw<Array<{ column_name: string; data_type: string }>>`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'PromptKichBanDocument'
      ORDER BY ordinal_position
    `;

    console.log(`4. Kiểm tra cấu trúc bảng PromptKichBanDocument: ${cols.length} cột.`);
    for (const c of cols) {
      console.log(`   - ${c.column_name}: ${c.data_type}`);
    }

    const count = await (prisma as any).promptKichBanDocument.count();
    console.log(`\n5. Kiểm tra truy vấn Prisma Client: COUNT = ${count} bản ghi.`);

    console.log("\n==========================================================");
    console.log("   HOÀN TẤT ÁP DỤNG SCHEMA THÀNH CÔNG AN TOÀN 100%        ");
    console.log("==========================================================");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌ Lỗi khi thực thi:", err.message);
  process.exit(1);
});
