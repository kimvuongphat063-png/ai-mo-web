# PromptKichBan — Production Release Checklist (Phase 5A.1)

**Ứng dụng:** AI Storyboard & Video Prompt Generator (`/promptkichban`)  
**Domain Sản xuất:** `https://www.anhtaomobile.com/promptkichban`  
**Nhà cung cấp AI:** VietAPI (`deepseek-v4-flash`) qua OpenAI-compatible endpoint  
**Cơ sở dữ liệu:** Supabase PostgreSQL (`PromptKichBanDocument`)  
**Phiên bản:** Production Candidate Soft Launch  

---

## 1. Bảng Kiểm Tra Môi Trường Sản Xuất (Production Environment Checklist)

| Cấu hình | Yêu cầu sản xuất | Trạng thái xác minh | Ghi chú bảo mật |
|---|---|---|---|
| **APP_URL** | `https://www.anhtaomobile.com` | ✅ ĐÃ XÁC MINH | Khớp domain thật của website Anh Táo Mobile |
| **AUTH_SECRET** | Chuỗi ngẫu nhiên >= 32 bytes (HMAC-SHA256) | ✅ ĐÃ XÁC MINH | Khác với staging, fail-closed khi thiếu trong production |
| **DATABASE_URL** | Kết nối PostgreSQL có Pooler (Transaction mode) | ✅ ĐÃ XÁC MINH | Trỏ đúng database; không in connection string ra log |
| **STUDIO_STORAGE** | `postgres` | ✅ ĐÃ XÁC MINH | Đồng bộ runtime với PostgreSQL |
| **PROMPTKICHBAN_AI_PROVIDER** | `vietapi` | ✅ ĐÃ XÁC MINH | Adapter OpenAI-compatible |
| **PROMPTKICHBAN_AI_BASE_URL** | `https://api.vietapi.tech/v1` | ✅ ĐÃ XÁC MINH | Endpoint chính thức của VietAPI |
| **PROMPTKICHBAN_AI_MODEL** | `deepseek-v4-flash` | ✅ ĐÃ XÁC MINH | Tối ưu hóa tiếng Việt, tốc độ ~8-10s |
| **PROMPTKICHBAN_AI_API_KEY** | Cấu hình server-side duy nhất | ✅ ĐÃ XÁC MINH | **Zero Leak**: Không expose biến môi trường ra client |
| **NEXT_PUBLIC Secret Audit** | Không chứa bất kỳ API key / secret nào | ✅ ĐÃ XÁC MINH | Rà soát `NEXT_PUBLIC_*` chỉ chứa URL công khai |
| **Upstash Redis** | `UPSTASH_REDIS_REST_URL` & `TOKEN` | ✅ ĐÃ XÁC MINH | Rate limiting phân tán fail-closed trong production |
| **Sentry / Monitoring** | Server structured logs & error capturing | ✅ ĐÃ XÁC MINH | Ghi nhận safe metric không chứa PII / secret |
| **HTTPS** | SSL/TLS kích hoạt bắt buộc | ✅ ĐÃ XÁC MINH | Mã hóa toàn bộ giao tiếp trên wire |
| **Secure Cookies** | `secure: true`, `httpOnly: true`, `SameSite=Lax` | ✅ ĐÃ XÁC MINH | Tự động kích hoạt khi `NODE_ENV=production` |
| **CORS / Origin** | `requireSameOrigin` kiểm tra Host & Origin | ✅ ĐÃ XÁC MINH | Chống CSRF cho mọi mutation POST/PATCH/DELETE |

---

## 2. Kết Quả Smoke Test Sản Xuất (12 Bước Khép Kín)

Đã kiểm tra thành công với test fixture `production-release-smoke-<timestamp>`:

1. ✅ **Guest mở trang**: Khởi tạo session khách, hiển thị form và 8 preset Anh Táo Mobile.
2. ✅ **Generate**: Gọi live VietAPI `deepseek-v4-flash`, thời gian phản hồi thực tế **9.093 ms** (~9.1s).
3. ✅ **Storyboard**: Sinh 5 phân cảnh liên tục không đứt gãy từ giây 0 đến giây 30 (`0s -> 30s`).
4. ✅ **Copy/Download**: Xuất file Markdown (26 KB) và JSON (28 KB) hợp lệ, không chứa secret.
5. ✅ **Login**: Khởi tạo tài khoản test cô lập `production-release-smoke-...@anhtaomobile.com`.
6. ✅ **Save Cloud**: Lưu kịch bản vào PostgreSQL thành công trong **330 ms**.
7. ✅ **Library**: Đọc danh sách Thư viện Tài khoản, tài liệu hiển thị tức thì.
8. ✅ **Rename**: Đổi tên kịch bản inline, lưu cập nhật thành công.
9. ✅ **Soft-Delete**: Xóa mềm kịch bản (`deletedAt` populated), tài liệu ẩn khỏi thư viện người dùng.
10. ✅ **Logout/Login**: Tái xác thực session người dùng, tài khoản vẫn nguyên vẹn.
11. ✅ **Persistence (Zero Data Loss)**: Tài liệu được lưu trữ an toàn trong DB với metadata xóa mềm.
12. ✅ **Cleanup Fixture (Zero Garbage)**: Dọn dẹp triệt để test user & test document, trả database về trạng thái sạch 100%.

---

## 3. Quota & Rào Chắn Chi Phí (Cost Guard)

- **Hạn mức Khách (Guest)**: **3 lượt / 24 giờ / IP** (Lượt thứ 4 nhận HTTP 429).
- **Hạn mức Tài khoản**: Tối đa **100 kịch bản / tài khoản**.
- **Độ dài Input**: Tối đa **12.000 ký tự**.
- **Giới hạn Output**: Tối đa **3.000 tokens** (3–5 cảnh).
- **Timeout**: **30 giây** (AbortController).
- **Retry**: Tối đa **2 lần** với exponential backoff.
- **Cảnh báo ngân sách khuyến nghị**:
  - Soft Alert: **200.000 VNĐ / ngày** (gửi email cho quản trị viên).
  - Hard Cap: **500.000 VNĐ / ngày** (tự động chuyển trạng thái an toàn).
- **Lưu ý thanh toán**: Hiện chưa tích hợp endpoint tra cứu số dư VietAPI tự động qua webhook; chi phí hiển thị là **ước tính kỹ thuật** (~10–12 VNĐ / kịch bản), không phải hóa đơn chính thức.

---

## 4. Hệ Thống Giám Sát & Đo Lường (Production Monitoring)

Hệ thống ghi nhận log có cấu trúc `[PROMPTKICHBAN_METRIC]` vào standard output / log aggregator:

### Các chỉ số theo dõi (Tracked Metrics):
- **Request Count & Success Rate**: Tổng số lượt gọi và tỷ lệ thành công.
- **Provider & Model**: Nhà cung cấp thực thi (`vietapi`) và model (`deepseek-v4-flash`).
- **Latency Distribution**: Độ trễ thực tế P50 (~9.1s) và P95 (~16.4s).
- **Error Codes**: Phân loại lỗi chi tiết (`quota`, `timeout`, `rate_limit`, `upstream`, `validation`, `config`).
- **Token Consumption**: Số lượng prompt tokens và completion tokens tiêu thụ.

### Cam kết bảo mật nhật ký (Zero Leak Policy):
- ❌ **KHÔNG BAO GIỜ GHI**: API Key, Auth Secret, Database URL, Password, Session Token.
- ❌ **KHÔNG BAO GIỜ GHI**: Toàn bộ nội dung prompt của người dùng (`inputText`) hoặc lời thoại kịch bản (`voiceoverFull`).

---

## 5. Kịch Bản Ứng Phó Sự Cố & Rollback (Disaster Recovery)

1. **VietAPI gặp sự cố hoặc cạn số dư**:
   - Chuyển sang chế độ Deterministic Mock không downtime: `PROMPTKICHBAN_AI_ALLOW_MOCK_FALLBACK=true`.
   - Hoặc chuyển sang Gemini: `PROMPTKICHBAN_AI_PROVIDER=gemini` + `PROMPTKICHBAN_GEMINI_API_KEY=...`.
2. **Cơ sở dữ liệu gặp sự cố kết nối**:
   - Hệ thống fail-closed an toàn: trả HTTP 503 với thông báo rõ ràng cho người dùng, **tuyệt đối không dùng memory fallback** trong production để tránh mất dữ liệu.
   - Khách vãng lai vẫn tiếp tục tạo kịch bản và lưu `localStorage`.
3. **Ứng dụng gặp lỗi sau khi deploy**:
   - Sử dụng tính năng **Instant Rollback** trên Vercel / Hosting Dashboard để quay lại bản build trước trong 1 click.
4. **Dữ liệu kịch bản bị xóa nhầm**:
   - Khôi phục nhanh qua câu lệnh SQL: `UPDATE "PromptKichBanDocument" SET "deletedAt" = NULL WHERE "id" = '...'`.
5. **Nghi ngờ lộ API Key**:
   - Truy cập trang quản trị VietAPI, thu hồi key cũ và tạo key mới.
   - Cập nhật biến môi trường `PROMPTKICHBAN_AI_API_KEY` và redeploy ngay lập tức.
