#!/usr/bin/env tsx
/**
 * Script kiểm tra vòng đời (CRUD Live Verification) của PromptKichBanDocument
 * trên Staging PostgreSQL (`ai-mo-staging`).
 *
 * Chạy: npx tsx scripts/verify-promptkichban-pg.ts
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import path from "node:path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ DATABASE_URL chưa được cấu hình.");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: url });
  const prisma = new PrismaClient({ adapter });

  console.log("==========================================================");
  console.log("   LIVE PG VERIFICATION: PromptKichBanDocument            ");
  console.log("==========================================================\n");

  let testUserId: string | null = null;
  let testDocId: string | null = null;

  try {
    // 1. Tạo user tạm thời để test foreign key
    const initialUserCount = await prisma.user.count();
    const initialDocCount = await (prisma as any).promptKichBanDocument.count();

    const tempEmail = `pkb-verify-${Date.now()}@aimo.vn`;
    const user = await prisma.user.create({
      data: {
        email: tempEmail,
        name: "Test User PKB Verification",
      },
    });
    testUserId = user.id;
    console.log(`1. ✅ Tạo user kiểm thử tạm: ${user.email} (id: ${user.id})`);

    // 2. Thêm kịch bản mẫu vào PostgreSQL
    const testDoc = await (prisma as any).promptKichBanDocument.create({
      data: {
        userId: user.id,
        title: "Kịch bản kiểm thử staging live CRUD",
        inputSnapshot: {
          inputText: "Kiểm thử live Postgres trên ai-mo-staging cho PromptKichBan.",
          durationSeconds: 30,
          aspectRatio: "9:16",
          contentType: "product-review",
          publishingPlatform: "tiktok",
        },
        outputSnapshot: {
          title: "Kịch bản kiểm thử staging live CRUD",
          summary: "Tạo tự động để xác thực schema",
          scenes: [],
        },
        provider: "vietapi",
        model: "deepseek-v4-flash",
        durationSeconds: 30,
        aspectRatio: "9:16",
        publishingPlatform: "tiktok",
        contentType: "product-review",
        status: "saved",
      },
    });
    testDocId = testDoc.id;
    console.log(`2. ✅ Ghi bản ghi vào PostgreSQL thành công: ID = ${testDoc.id}`);

    // 3. Truy vấn lại bản ghi
    const fetched = await (prisma as any).promptKichBanDocument.findFirst({
      where: { id: testDoc.id, userId: user.id, deletedAt: null },
    });

    if (!fetched || fetched.title !== "Kịch bản kiểm thử staging live CRUD") {
      throw new Error("Truy vấn bản ghi vừa tạo thất bại!");
    }
    console.log(`3. ✅ Truy vấn bản ghi thành công: Tiêu đề = "${fetched.title}"`);

    // 4. Cập nhật đổi tên
    const updated = await (prisma as any).promptKichBanDocument.update({
      where: { id: testDoc.id },
      data: { title: "Kịch bản kiểm thử (đã đổi tên)", updatedAt: new Date() },
    });
    console.log(`4. ✅ Cập nhật bản ghi thành công: Tiêu đề mới = "${updated.title}"`);

    // 5. Thử soft-delete
    await (prisma as any).promptKichBanDocument.update({
      where: { id: testDoc.id },
      data: { deletedAt: new Date() },
    });

    const activeDocs = await (prisma as any).promptKichBanDocument.findMany({
      where: { id: testDoc.id, deletedAt: null },
    });

    if (activeDocs.length !== 0) {
      throw new Error("Soft delete thất bại: bản ghi vẫn xuất hiện khi deletedAt: null!");
    }
    console.log(`5. ✅ Soft-delete thành công: Bản ghi đã bị ẩn khỏi truy vấn hoạt động.`);

    // 6. Xóa user kiểm thử (kiểm tra CASCADE delete)
    await prisma.user.delete({
      where: { id: user.id },
    });
    testUserId = null;
    testDocId = null;
    console.log(`6. ✅ Xóa user kiểm thử thành công — Ràng buộc CASCADE xóa sạch document.`);

    // 7. Kiểm tra trạng thái sạch sau khi test
    const finalUserCount = await prisma.user.count();
    const finalDocCount = await (prisma as any).promptKichBanDocument.count();

    if (finalUserCount !== initialUserCount || finalDocCount !== initialDocCount) {
      throw new Error("Dữ liệu sau khi kiểm thử không sạch!");
    }
    console.log(`7. ✅ Xác nhận toàn vẹn: Không còn dữ liệu rác sau khi kiểm thử.`);

    console.log("\n==========================================================");
    console.log("   LIVE POSTGRES VERIFICATION PASSED (100% HOẠT ĐỘNG)    ");
    console.log("==========================================================");
  } catch (err: any) {
    console.error("❌ Lỗi kiểm tra live PG:", err.message);
    // Cleanup if needed
    if (testDocId) {
      try {
        await (prisma as any).promptKichBanDocument.delete({ where: { id: testDocId } });
      } catch {}
    }
    if (testUserId) {
      try {
        await prisma.user.delete({ where: { id: testUserId } });
      } catch {}
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌ Lỗi không xử lý được:", err);
  process.exit(1);
});
