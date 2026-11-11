# AI MỞ — PRODUCTION READINESS & DEPLOYMENT CHECKLIST

Tài liệu kiểm tra và hướng dẫn vận hành production cho nền tảng **AI Mở**.

---

## 1. Bảng Trạng Thái Thành Phần (Status Matrix)

| Hạng mục | Trạng thái | Chi tiết triển khai |
| :--- | :---: | :--- |
| **CSRF & Origin Protection** | ✅ Ready | `requireSameOrigin` kiểm tra `origin` / `host` cho toàn bộ mutation API. |
| **AI Rate Limiting** | ✅ Ready | Giới hạn 30 lượt tạo kịch bản/phân tích/ngày (`aiGenerate`), 15 req/h (`pkb-regen`). |
| **Mutation Rate Limiting** | ✅ Ready | Áp dụng `studioMutation` (20 req/h) cho Products, Campaigns, CMS, Creator endpoints. |
| **Environment Validator** | ✅ Ready | `npm run env:validate` tự động kiểm tra biến bắt buộc trước khi deploy. |
| **Sentry Error Tracking** | ✅ Ready | Đã cấu hình Client, Server và Edge tracking qua `@sentry/nextjs`. |
| **Email Service & Templates** | ✅ Ready | Resend adapter với template HTML chuyên nghiệp cho Reset mật khẩu & Xác nhận đơn hàng. |
| **Catalog Search & Filter** | ✅ Ready | Live search & phân loại danh mục tức thì cho `/apps`, `/courses`, `/products`, `/tools`. |
| **Security Headers** | ✅ Ready | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` trong `next.config.ts`. |
| **Homepage Redesign** | ✅ Ready | Hero split xanh cobalt/nhạt, demo 3 bước, lối vào theo nhu cầu, công cụ nổi bật. |
| **Database Staging** | ✅ Ready | Supabase Staging (`omdviaffxevjvexausao`), kết nối qua Prisma & PostgreSQL pool. |

---

## 2. Checklist Trước Khi Deploy Production

### A. Environment Variables trên Hosting (Vercel)
- [x] `NODE_ENV=production`
- [x] `AUTH_SECRET`: Khóa bí mật HMAC >= 32 ký tự (đã cấu hình riêng cho AI Mở).
- [x] `DATABASE_URL`: Connection string PostgreSQL Supabase Staging/Production (kèm connection pooling port 6543 hoặc direct 5432).
- [x] `STUDIO_STORAGE=postgres`
- [x] `APP_URL`: Domain chính thức dạng `https://...`
- [x] `PROMPTKICHBAN_AI_PROVIDER=vietapi`
- [x] `PROMPTKICHBAN_AI_BASE_URL=https://api.vietapi.tech/v1`
- [x] `PROMPTKICHBAN_AI_MODEL=deepseek-v4-flash`
- [x] `PROMPTKICHBAN_AI_API_KEY`: API key cho model AI tạo kịch bản video.
- [ ] `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`: Kích hoạt Redis rate-limit phân tán đa vùng (nếu chưa có sẽ tự fallback in-memory an toàn).
- [ ] `RESEND_API_KEY`: API key gửi email từ Resend (nếu chưa có sẽ tự mock log trên server).
- [ ] `NEXT_PUBLIC_SENTRY_DSN` & `SENTRY_DSN`: Bật theo dõi crash realtime trên Sentry dashboard.

### B. Quy Trình Kiểm Thử Bắt Buộc (Quality Gates)
Chạy bộ lệnh sau trước mỗi lần phát hành:
```bash
# 1. Kiểm tra biến môi trường
npm run env:validate

# 2. Kiểm tra type TypeScript
npm run typecheck

# 3. Chạy unit tests & studio logic
npm test
npm run test:promptkichban

# 4. Kiểm tra giao diện E2E và điều hướng
npm run test:platform
npx playwright test tests/homepage-redesign.spec.ts

# 5. Build đóng gói Next.js
npm run build
```

---

## 3. Nhật Ký Đẩy Lên GitHub & Vercel
- **GitHub Repository:** [https://github.com/kimvuongphat063-png/ai-mo-web](https://github.com/kimvuongphat063-png/ai-mo-web)
- **Vercel Project:** `monopoly1/ai-mo-web`
- **Online Preview Deployment:** [https://ai-mo-fua31yakc-monopoly1.vercel.app](https://ai-mo-fua31yakc-monopoly1.vercel.app)
