# PromptKichBan — Backup, Restore & Rollback Runbook (Phase 5A)

Kế hoạch vận hành, quy trình sao lưu định kỳ, khôi phục dữ liệu và kịch bản ứng phó sự cố (Disaster Recovery & Rollback) cho module `/promptkichban`.

---

## 1. Cơ chế Sao lưu (Backup Procedures)

### A. Sao lưu Tự động trên Supabase (Cloud Infrastructure)
- **Dự án**: `ai-mo-staging` (Project ID: `omdviaffxevjvexausao`)
- **Cơ chế sao lưu**:
  - Supabase thực hiện sao lưu tự động hàng ngày (Daily automated backups) với thời gian lưu trữ 7 ngày (Staging) hoặc 30 ngày (Production).
  - Điểm khôi phục Point-in-time Recovery (PITR) cho phép quay lại bất kỳ thời điểm nào trong vòng 7 ngày qua giao diện Supabase Dashboard > Database > Backups.

### B. Sao lưu Bằng Script Cục bộ (Application-Level Snapshot)
- Trước mỗi đợt bảo trì hoặc thay đổi lớn, chạy script tạo snapshot toàn bộ dữ liệu:
  ```bash
  npx tsx scripts/pg-backup-restorepoint.ts
  ```
- File sao lưu được lưu tại thư mục `backups/pg-restore-point-<timestamp>.json`.
- File snapshot bao gồm cấu trúc bảng, số lượng bản ghi và toàn bộ nội dung của các bảng Studio và `PromptKichBanDocument`.

---

## 2. Quy trình Khôi phục Dữ liệu (Restore Procedures)

### A. Khôi phục Kịch bản bị Xóa nhầm (Soft-delete Recovery)
Hệ thống sử dụng cơ chế **Soft Deletion** (cột `deletedAt TIMESTAMP NULL`). Khi người dùng bấm xóa, dữ liệu thực tế vẫn còn trên PostgreSQL:
```sql
-- Kiểm tra các kịch bản đã bị xóa mềm của một người dùng:
SELECT id, "title", "createdAt", "deletedAt" 
FROM "public"."PromptKichBanDocument" 
WHERE "userId" = '<user_id>' AND "deletedAt" IS NOT NULL;

-- Khôi phục lại kịch bản:
UPDATE "public"."PromptKichBanDocument" 
SET "deletedAt" = NULL, "updatedAt" = NOW() 
WHERE id = '<document_id>' AND "userId" = '<user_id>';
```

### B. Khôi phục Toàn bộ Bảng từ Snapshot
Khi có sự cố hỏng hóc hoặc mất mát diện rộng:
1. Xác định file restore point gần nhất trong `backups/`.
2. Kiểm tra tính toàn vẹn của file JSON snapshot.
3. Chạy script khôi phục hoặc import lại dữ liệu bằng transaction PostgreSQL có ràng buộc khóa ngoại `User(id)`.

### C. Khôi phục Cấu trúc Database (Schema Rollback)
Nếu cần tháo gỡ hoàn toàn bảng `PromptKichBanDocument` về trạng thái trước Phase 4A:
```sql
-- DDL Rollback an toàn (không ảnh hưởng tới các bảng khác):
DROP TABLE IF EXISTS "public"."PromptKichBanDocument" CASCADE;
```

---

## 3. Kịch bản Rollback Nhà cung cấp AI (Provider Fallback)

### Kịch bản 1: VietAPI gặp sự cố hoặc cạn số dư ví
Nếu VietAPI trả về lỗi 5xx, timeout hoặc 429 quá tải:

1. **Cách 1: Cho phép tự động fallback sang Deterministic Mock (Không downtime)**:
   Thêm biến môi trường:
   ```env
   PROMPTKICHBAN_AI_ALLOW_MOCK_FALLBACK=true
   ```
   Hệ thống sẽ ghi nhận warning an toàn và tiếp tục tạo storyboard giả lập chính xác theo input của người dùng mà không làm đứt đoạn trải nghiệm.

2. **Cách 2: Chuyển đổi sang Google Gemini**:
   Cập nhật cấu hình môi trường:
   ```env
   PROMPTKICHBAN_AI_PROVIDER=gemini
   PROMPTKICHBAN_GEMINI_API_KEY=<gemini_api_key_cua_ban>
   PROMPTKICHBAN_AI_MODEL=gemini-2.0-flash
   ```
   Khởi động lại ứng dụng. Hệ thống sẽ lập tức chuyển sang gọi trực tiếp Gemini API.

3. **Cách 3: Chuyển hẳn về chế độ Mock hoàn toàn**:
   ```env
   PROMPTKICHBAN_AI_PROVIDER=mock
   ```

---

## 4. Kịch bản Rollback Phiên bản Ứng dụng (App Rollback)

Nếu bản build mới trên Vercel hoặc server gặp lỗi runtime:
1. **Trên Vercel / Hosting Provider**:
   - Truy cập trang Deployments.
   - Chọn bản deployment của Phase 4B hoặc commit gần nhất hoạt động tốt.
   - Bấm **Instant Rollback**.
2. **Trên Git Repository**:
   ```bash
   git revert HEAD
   git push origin main
   ```

---

## 5. Hành vi Hệ thống khi Cơ sở Dữ liệu Gặp sự cố (Database Outage Behavior)

Trong môi trường Staging/Production (`NODE_ENV=production`):
1. **Khóa chặt Fallback Bộ nhớ**: Hệ thống **tuyệt đối KHÔNG** âm thầm lưu vào in-memory RAM khi PostgreSQL mất kết nối. Điều này ngăn chặn việc người dùng tưởng đã lưu thành công nhưng bị mất sạch dữ liệu sau khi server restart hoặc load-balancer đổi instance.
2. **Thông báo Thân thiện**: API trả về mã lỗi HTTP 503 (`PromptKichBanError("config")`) với thông điệp:
   > *"Lỗi cơ sở dữ liệu: không thể đọc/ghi kịch bản vào PostgreSQL trong môi trường production."*
3. **Chức năng Khách (Guest Mode) vẫn hoạt động**: Khách vẫn có thể tạo kịch bản, sao chép prompt và lưu tạm vào `localStorage` của trình duyệt mà không bị phụ thuộc vào database.
