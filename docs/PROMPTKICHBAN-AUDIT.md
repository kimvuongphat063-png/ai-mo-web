# BÁO CÁO AUDIT HỆ THỐNG TRƯỚC KHI XÂY DỰNG PROMPTKICHBAN (PHASE 0)

> **Mục tiêu:** Xây dựng module công khai (Public) **AI Video Script & Prompt Studio** tại `/promptkichban` dành cho khách truy cập website **Anh Táo Mobile**.  
> **Nguyên tắc an toàn:** Module hoạt động độc lập, không thay thế, không sửa đổi Storefront hiện tại, và không phá vỡ Studio nội bộ tại `/app`.  
> **Ngày thực hiện audit:** 06/11/2026.

---

## 1. DANH SÁCH CÁC FILE ĐÃ KIỂM TRA (FILES AUDITED)

Toàn bộ các tài liệu hướng dẫn, quy chuẩn, core logic và cấu trúc hiện có đã được kiểm tra chi tiết:

1. **Quy chuẩn & Chỉ dẫn chung:**
   - `AGENTS.md` (Next.js breaking changes & conventions)
   - `CLAUDE.md`
   - `PROJECT-STATUS.md` (Lịch sử phát triển đến Phase 5A.1: Rate limiting Upstash, CSRF, Storage Adapter)
   - `docs/UI-DIRECTION.md` (Thiết kế Linear/Notion/Vercel tối giản, bảng màu token Tailwind v4)
   - `docs/TICH-HOP-API-KICH-BAN.md` (Phân tích tích hợp API kịch bản desktop & custom provider)
2. **AI Layer (`src/lib/ai/*`):**
   - `src/lib/ai/env.ts` (Quản lý biến môi trường AI, provider fallback, validation schema)
   - `src/lib/ai/provider.ts` (HTTP client gọi model OpenAI, Anthropic, Gemini; cơ chế retry & Zod validation)
   - `src/lib/ai/contract.ts` (Zod schemas cho Product Analysis, Selling Angles, Script Item, Shots, Brand Context)
   - `src/lib/ai/errors.ts` (AiError, mapping lỗi sang thông điệp tiếng Việt thân thiện, che giấu secrets)
   - `src/lib/ai/index.ts` (Dispatcher chuyển tiếp mock/live, helper run())
   - `src/lib/ai/live.ts` & `src/lib/ai/mock.ts` (Logic sinh kịch bản thực tế vs mock mô phỏng xác định)
   - `src/lib/ai/usage.ts`, `src/lib/ai/quota-core.ts`, `src/lib/ai/json-usage.ts`, `src/lib/ai/pg-usage.ts` (Hệ thống quota theo ngày cho user)
3. **Studio Core & Storage (`src/lib/studio/*`, `src/lib/studio-storage/*`):**
   - `src/lib/studio.ts` (Orchestrator phân nhánh storage JSON vs Postgres)
   - `src/lib/studio/markdown.ts` (Export kịch bản ra định dạng Markdown)
   - `src/lib/studio-storage/postgres.ts` (Adapter CRUD Prisma Postgres cho Studio)
   - `src/lib/studio-storage/json.ts` (Adapter CRUD file JSON dự phòng `data/studio.json`)
   - `src/lib/studio-storage/delete-policy.ts` & `delete-cascade.ts`
4. **Studio API Routes (`src/app/api/studio/*`):**
   - `src/app/api/studio/scripts/route.ts` & `src/app/api/studio/scripts/[id]/route.ts` (POST, GET, PATCH, DELETE kịch bản)
   - `src/app/api/studio/products/route.ts` & `src/app/api/studio/products/[id]/analyze/route.ts` (Phân tích góc bán hàng)
   - `src/app/api/studio/brand/route.ts` (Bộ nhớ thương hiệu Brand Memory)
   - `src/app/api/studio/campaigns/*`, `src/app/api/studio/performance/*`, `src/app/api/studio/ai-status/route.ts`, `src/app/api/studio/admin/health/route.ts`
5. **Studio Internal UI (`src/app/app/*`):**
   - `src/app/app/layout.tsx` (Studio shell: Sidebar fixed 240px, topbar 56px)
   - `src/app/app/page.tsx` (Dashboard trung tâm)
   - `src/app/app/scripts/page.tsx` & `src/app/app/scripts/new/page.tsx` & `src/app/app/scripts/[id]/page.tsx` (Wizard tạo kịch bản 3 bước)
   - `src/app/app/products/*`, `src/app/app/brand/page.tsx`, `src/app/app/settings/page.tsx`
6. **Hạ tầng Auth, Security & Database:**
   - `src/lib/auth.ts`, `src/lib/auth-shared.ts`, `src/lib/auth-csrf.ts` (Cookie-based session, CSRF protection)
   - `src/lib/rate-limit-v2.ts` (Upstash Redis sliding window / In-memory fallback)
   - `src/instrumentation.ts` (Fail-fast validation khi server khởi động)
   - `prisma/schema.prisma` (Mô hình dữ liệu `StudioProduct`, `StudioScript`, `StudioBrandProfile`,...)
   - `.env.example` và `.env.local`

---

## 2. HIỆN TRẠNG KIẾN TRÚC & PHÁT HIỆN KỸ THUẬT

### 2.1. Provider AI hiện đang chọn bằng biến môi trường nào?
- Biến môi trường: **`AI_PROVIDER`** (định nghĩa trong `src/lib/ai/env.ts`).
- Các giá trị hợp lệ: `"mock" | "openai" | "anthropic" | "gemini"`.
- Giá trị mặc định: `"mock"`.
- Các biến đi kèm:
  - `AI_MODEL`: Model cụ thể (mặc định: `gpt-4o-mini` cho OpenAI, `claude-3-5-sonnet-latest` cho Anthropic, `gemini-2.0-flash` cho Gemini).
  - `AI_TIMEOUT_MS`: Timeout request (mặc định: `30000`ms = 30s).
  - `AI_MAX_RETRIES`: Số lần retry khi lỗi mạng/upstream (mặc định: `2`).
  - `AI_DAILY_LIMIT`: Hạn ngạch quota ngày (mặc định: `30`).
  - API Keys tương ứng: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`.

### 2.2. Provider nào đang hoạt động thật?
- Trong file `.env.local` hiện tại: **Không có biến `AI_PROVIDER`** và không có bất kỳ API key nào (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`).
- Do đó, hệ thống đang tự động fallback về **`mock` provider**.
- Trong chế độ `mock`, việc phân tích sản phẩm và tạo kịch bản diễn ra hoàn toàn cục bộ, tức thời, xác định (deterministic) thông qua thuật toán sinh giả lập có tính đến ngữ cảnh Brand Memory.

### 2.3. Cơ chế Mock/Live Dispatcher
- Điểm điều phối trung tâm: `src/lib/ai/index.ts`:
  ```typescript
  function impl() {
    return aiEnv().AI_PROVIDER === "mock" ? mock : live;
  }
  ```
- Khi chạy `live`:
  - `live.ts` đóng gói System Prompt + User Prompt chứa đầy đủ Brand Context, Selling Angles, Format video.
  - Chuyển vào `provider.ts#generateStructured`: gọi HTTP POST tới API của OpenAI / Anthropic / Gemini.
  - Tự động retry tối đa 2 lần với exponential backoff đối với lỗi timeout (408/Abort), rate limit (429), upstream (5xx).
  - Kết quả trả về được parse JSON và xác thực chặt chẽ qua Zod schema (`scriptGenerationSchema`). Nếu model trả về sai cấu trúc sẽ kích hoạt retry hoặc ném lỗi an toàn `AiError("invalid_response")`.

### 2.4. Quota & Rate Limit hiện có
Hệ thống hiện tại phân tách làm 2 tầng kiểm soát:
1. **Business Quota (`src/lib/ai/usage.ts` + `quota-core.ts`):**
   - Hạn mức: `AI_DAILY_LIMIT=30` (30 lượt sinh AI mỗi ngày cho mỗi người dùng).
   - Khóa định danh: Bắt buộc dùng **`userId`** của user đã đăng nhập.
   - Lưu trữ: Lưu vào bảng `StudioAiUsage` (nếu Postgres) hoặc `data/ai-usage.json` (nếu JSON).
   - Cơ chế: `consumeQuota(userId)` được gọi trước khi chạy AI; nếu sinh thất bại thì gọi `refundQuota(userId)`.
2. **Security Rate Limiting (`src/lib/rate-limit-v2.ts`):**
   - Chạy trên Upstash Redis (production) hoặc In-Memory (development).
   - Đã cấu hình 5 policy: `login`, `register`, `forgot`, `reset`, `aiGenerate` (30 req / 24h per userId).
   - Hiện tại **CHƯA CÓ** policy rate-limit cho khách truy cập ẩn danh (Public Visitor / Guest).

### 2.5. Storage JSON / Postgres
- Được điều khiển bởi biến môi trường: **`STUDIO_STORAGE`** (`"postgres"` hoặc `"json"`).
- Trong `.env.local` hiện tại: `STUDIO_STORAGE=postgres`.
- Cơ chế Storage Adapter: `src/lib/studio.ts` đứng làm proxy trung gian:
  - Nếu `STUDIO_STORAGE=postgres`: gọi `src/lib/studio-storage/postgres.ts` (Prisma Client).
  - Nếu `STUDIO_STORAGE=json`: gọi `src/lib/studio-storage/json.ts` (ghi đọc nguyên tử file `data/studio.json`).
- Đặc điểm quan trọng: Toàn bộ bảng dữ liệu (`StudioProduct`, `StudioScript`, `StudioCampaign`, `StudioBrandProfile`, `StudioPerformanceMetric`) đều có trường `userId` bắt buộc và chỉ cho phép người sở hữu đọc/ghi.

### 2.6. Auth & Session
- Hệ thống phiên làm việc: Cookie `aimo_demo_session` ký số HMAC-SHA256 (`src/lib/auth-shared.ts` + `src/lib/auth.ts`).
- Các vai trò (`Role`): `"admin"` và `"learner"`.
- Guard bảo vệ:
  - Trang `/app/*`: Bắt buộc qua `requirePageRole("admin" | "learner")`, chưa đăng nhập bị redirect về `/login`.
  - API `/api/studio/*`: Bắt buộc qua `authorizeMutation(req)` hoặc `authorizeApi()`, chưa đăng nhập trả về HTTP 401 Unauthenticated.
- **Kết luận:** Khách vãng lai truy cập web không có session cookie này.

---

## 3. KHẢ NĂNG TÁI SỬ DỤNG (REUSABLE ASSETS)

| Thành phần | Đường dẫn | Khả năng tái sử dụng cho `/promptkichban` |
|---|---|---|
| **UI Primitives** | `src/components/studio/ui/index.tsx` | **Rất cao (100%)**: `Button`, `ButtonLink`, `Badge`, `Panel`, `PageHeader`, `Alert`, `Field`, `inputClass`, `textareaClass`, `Stepper`, `Spinner`, `Skeleton`, `EmptyState`, `Tooltip`. Thiết kế chuẩn, không phụ thuộc auth. |
| **Copy Prompt Component** | `src/app/app/scripts/[id]/CopyButton.tsx` | **Rất cao**: Nút sao chép kèm thông báo tooltip "Đã chép", rất quan trọng để người dùng copy prompt sang Veo/Grok/Seedance/Muse. |
| **Site Chrome & Layout** | `src/components/site-chrome.tsx` & `site-shell.tsx` | **Cao**: Tận dụng Header/Footer của Storefront công khai để khách trải nghiệm tự nhiên trong website Anh Táo Mobile. |
| **AI Contract & Shot Schema** | `src/lib/ai/contract.ts` | **Cao**: Tái sử dụng `scriptShotSchema` (startSecond, endSecond, spokenText, visualDirection, cameraAction, bRoll, ctaLine). |
| **Error Handling System** | `src/lib/ai/errors.ts` | **Cao**: Tái sử dụng `AiError`, `toAiError`, `aiErrorBody` (chuẩn hóa lỗi tiếng Việt, không lộ lỗi kỹ thuật ra client). |
| **Rate Limit Engine** | `src/lib/rate-limit-v2.ts` | **Cao**: Dễ dàng bổ sung thêm một policy `publicPromptGenerate` (theo IP). |

---

## 4. XUNG ĐỘT TIỀM ẨN & RỦI RO CẦN TRÁNH (POTENTIAL CONFLICTS)

1. **Xung đột phân quyền (Auth Wall Conflict):**
   - *Nguy cơ:* Nếu tận dụng nhầm route `/api/studio/scripts` hoặc các hàm `createScript(userId, ...)` trong `src/lib/studio.ts`, request của khách vãng lai sẽ lập tức bị chặn mã 401 (hoặc lỗi thiếu `userId`).
   - *Biện pháp cô lập:* Tuyệt đối không dùng chung route `/api/studio/*`. Tạo riêng router công khai `/api/promptkichban/generate`.
2. **Xung đột cơ sở dữ liệu (Database Schema Contamination):**
   - *Nguy cơ:* Các bảng `StudioProduct`, `StudioScript` yêu cầu `userId String` và có ràng buộc foreign key chặt chẽ. Lưu kịch bản của khách vãng lai vào đây sẽ gây lỗi schema drift hoặc làm bẩn database studio nội bộ.
   - *Biện pháp cô lập:* Không ghi đè hay sửa đổi schema cũ. Kịch bản của khách vãng lai có thể lưu cục bộ tại Client (LocalStorage) và/hoặc bảng độc lập riêng biệt nếu cần chia sẻ link.
3. **Nguy cơ cạn kiệt Quota / Chi phí LLM khi mở Public (Cost & Abuse Risk):**
   - *Nguy cơ:* Khách vãng lai không có tài khoản, nếu mở API công khai không giới hạn thì bot/crawler có thể spam làm cạn quota OpenAI/Claude/Gemini hoặc tăng vọt chi phí.
   - *Biện pháp cô lập:* Áp dụng chính sách Rate Limit nghiêm ngặt theo IP (ví dụ: tối đa 3 - 5 lần tạo kịch bản/ngày/IP). Khi đạt giới hạn, thông báo thân thiện mời đăng ký/đăng nhập tài khoản.
4. **Nhầm lẫn giữa "Prompt Studio" và "Video Generation Engine":**
   - *Nguy cơ:* Hiểu lầm rằng web sẽ trực tiếp kết nối API tạo video clip với Veo, Grok, Seedance, Muse.
   - *Biện pháp cô lập:* Tuân thủ nghiêm ngặt yêu cầu: **Không gọi trực tiếp các API sinh video**. Module này là công cụ **Prompt Studio** — nhận input kịch bản và sinh ra các prompt mô tả hình ảnh, camera, ánh sáng, góc quay được tối ưu cú pháp (Prompt Engineering) để người dùng copy dán vào Veo, Grok, Kling, Runway, Seedance, Muse.
5. **Rủi ro lộ bí mật (Secret Leakage):**
   - Tuyệt đối không nhúng bất kỳ API key nào vào client components. Toàn bộ logic sinh prompt chạy ở server qua Next.js Route Handler.

---

## 5. THIẾT KẾ ROUTE ĐỀ XUẤT (PROPOSED ROUTE DESIGN)

### 5.1. Public UI Routes
- **`GET /promptkichban`**:
  - Giao diện Wizard trực quan, tối ưu cho người dùng Anh Táo Mobile.
  - Tích hợp sẵn trong Storefront Shell (`site-shell.tsx`) hoặc chế độ Focus Studio.
  - **Bước 1 — Chọn loại video & Sản phẩm:**
    - Loại video: Review máy cũ 99%, Unbox máy mới, So sánh cấu hình, Mẹo dùng pin/iOS, Video bán hàng chốt đơn TikTok, Kịch bản kịch tính/drama ngắn.
    - Sản phẩm mẫu Anh Táo Mobile: iPhone 16 Pro Max, iPhone 15 Pro, iPhone 13/14 cũ, phụ kiện sạc cáp, thu cũ đổi mới. (Có ô nhập tùy chỉnh cho sản phẩm bất kỳ).
  - **Bước 2 — Tùy chỉnh phong cách & Target AI Video:**
    - Tông giọng: Vui vẻ, chân thật, hài hước, chuyên nghiệp, uy tín kỹ thuật.
    - Thời lượng: 15s, 30s, 60s.
    - Nền tảng đích: TikTok, Reels, Shorts.
    - Target Video Tool: **Google Veo 2 / Grok 2 / Seedance / Muse / Kling / Runway Gen-3**.
  - **Bước 3 — Tạo & Xuất Kịch Bản + Prompts:**
    - Hiển thị từng phân cảnh (Timeline Shot: thời gian, lời thoại, hướng dẫn diễn xuất).
    - Bên cạnh mỗi phân cảnh có sẵn **Hộp Prompt AI Video** tương ứng (được tinh chỉnh theo cú pháp chuẩn của tool đã chọn: góc máy quay, ánh sáng, chi tiết chuyển động).
    - Nút `[Copy Prompt]` cho từng cảnh và `[Copy Toàn Bộ Kịch Bản]`.

### 5.2. Public API Routes
- **`POST /api/promptkichban/generate`**:
  - Công khai (Public), không yêu cầu session cookie.
  - Kiểm tra Rate Limit theo Client IP qua `src/lib/rate-limit-v2.ts`.
  - Nhận payload từ form, chuyển qua prompt template chuyên biệt cho video generation prompt.
  - Trả về JSON kịch bản và danh sách video prompts chuẩn hóa.
- **`GET /api/promptkichban/presets`**:
  - Trả về danh sách kịch bản mẫu và cấu hình có sẵn của Anh Táo Mobile (load nhanh không tốn token AI).

---

## 6. THIẾT KẾ SCHEMA ĐỀ XUẤT (PROPOSED SCHEMA DESIGN)

Module mới sử dụng schema Zod riêng biệt, không đụng vào `src/lib/studio.ts`:

### 6.1. Input Schema (`src/lib/promptkichban/schema.ts`)
```typescript
import { z } from "zod";

export const promptKichBanInputSchema = z.object({
  productName: z.string().trim().min(1, "Vui lòng nhập tên sản phẩm").max(150),
  productHighlights: z.string().trim().min(1, "Vui lòng nhập đặc điểm nổi bật").max(500),
  videoType: z.enum([
    "review_used",       // Review máy cũ / nguyên zin
    "unboxing",          // Mở hộp / trải nghiệm
    "comparison",        // So sánh 2 dòng máy
    "tips_tricks",       // Mẹo hay thủ thuật iOS
    "sales_promo",       // Khuyến mãi / xả kho
    "story_drama"        // Kịch bản tình huống ngắn
  ]),
  targetVideoTool: z.enum(["veo", "grok", "seedance", "muse", "general"]).default("general"),
  durationSeconds: z.union([z.literal(15), z.literal(30), z.literal(60)]).default(30),
  tone: z.enum(["honest_humor", "tech_expert", "enthusiastic_sales", "storytelling"]).default("honest_humor"),
  platform: z.enum(["tiktok", "reels", "shorts"]).default("tiktok"),
  callToAction: z.string().trim().max(100).optional(),
});
export type PromptKichBanInput = z.infer<typeof promptKichBanInputSchema>;
```

### 6.2. Output Schema (Kịch bản & Prompt sinh video)
```typescript
export const videoShotPromptSchema = z.object({
  shotNumber: z.number().int().min(1),
  timestamp: z.string(), // "00:00 - 00:05"
  shotType: z.string(),  // "Close-up", "Medium shot", "Top-down macro"
  spokenDialogue: z.string(), // Lời thoại nói
  onScreenText: z.string(),   // Chữ hiện trên màn hình
  actorAction: z.string(),    // Hành động diễn xuất của người/tay
  
  // Các trường Prompt chuyên sâu dành cho AI Video Engine (Veo, Grok, Seedance, Muse)
  videoPrompt: z.object({
    subject: z.string(),       // Mô tả chủ thể chi tiết (ví dụ: iPhone 16 Pro Max Natural Titanium)
    cameraMotion: z.string(),  // Chuyển động camera (Smooth slow push-in, 45 degree orbital)
    lightingAndEnvironment: z.string(), // Ánh sáng & bối cảnh (Studio warm rim light, bokeh background)
    negativePrompt: z.string().optional(), // Các điểm loại trừ nếu có
    fullPromptText: z.string(), // Prompt tiếng Anh chuẩn hóa để 1-click copy sang Veo/Grok/Muse
  })
});

export const promptKichBanResultSchema = z.object({
  title: z.string(),
  hookStatement: z.string(),
  videoType: z.string(),
  targetTool: z.string(),
  shots: z.array(videoShotPromptSchema).min(1),
  hashtags: z.array(z.string()),
  musicSuggestion: z.string(),
  proTips: z.array(z.string()),
});
export type PromptKichBanResult = z.infer<typeof promptKichBanResultSchema>;
```

### 6.3. Persistence Strategy (Lưu trữ)
- **Tùy chọn khuyến nghị (Không đổi DB):**
  Lưu trữ kịch bản vừa tạo vào `localStorage` của trình duyệt người dùng (`aimo_public_scripts`). Khách có thể xem lại các kịch bản mình đã tạo trên máy của họ mà không làm phình cơ sở dữ liệu và không cần quản lý tài khoản.
- **Tùy chọn mở rộng (Database cho Shareable Links):**
  Nếu sau này có nhu cầu tạo link công khai chia sẻ kịch bản cho người khác xem (ví dụ: `/promptkichban/share/[id]`), chỉ cần thêm một bảng độc lập `PublicPromptShare` trong Prisma, tuyệt đối không chèn vào bảng `StudioScript`.

---

## 7. DANH SÁCH QUYẾT ĐỊNH CẦN CHỦ DỰ ÁN XÁC NHẬN

Trước khi bắt tay vào triển khai Phase 1, đề nghị Chủ dự án xác nhận các điểm sau:

1. **Về cơ chế lưu trữ kịch bản khách:**
   - *Đề xuất:* Lưu trên `localStorage` trình duyệt người dùng để tối giản, an toàn và không đụng tới database. Khi người dùng muốn lưu lâu dài vào kho kịch bản thì mới bấm "Lưu vào Studio" (yêu cầu đăng nhập).
   - *Chủ dự án xác nhận:* Đồng ý hay muốn lưu trên Server DB ngay từ đầu?
2. **Về hạn ngạch miễn phí cho khách (Public Rate Limit):**
   - *Đề xuất:* Cho phép **3 đến 5 lượt tạo kịch bản / ngày / IP**. Hết lượt sẽ hiển thị modal thông báo giới hạn và hướng dẫn đăng nhập tài khoản AI Mở để nhận thêm lượt tạo.
   - *Chủ dự án xác nhận:* Hạn mức này đã phù hợp chưa?
3. **Về AI Provider sử dụng khi chạy thật:**
   - Hiện tại hệ thống đang chạy `mock` (không tốn phí API).
   - Khi chạy live cho khách Anh Táo Mobile trải nghiệm, anh muốn dùng key của nhà cung cấp nào: **OpenAI (GPT-4o-mini)**, **Anthropic (Claude 3.5 Sonnet)**, hay **Gemini (Gemini 2.0 Flash)**?
4. **Về thương hiệu & Dữ liệu mồi của Anh Táo Mobile:**
   - Module có cần gắn sẵn bộ preset các dòng máy hot (iPhone 13, 14, 15, 16 Pro Max, máy 99%, pin zin, giá tốt) làm mẫu mồi sẵn (1-click chọn là ra kịch bản ngay) không?
5. **Về phong cách giao diện:**
   - *Đề xuất:* Tích hợp trong layout Storefront (`site-shell.tsx`) để khách vẫn thấy menu, logo Anh Táo Mobile / AI Mở và giỏ hàng; khu vực nội dung chính áp dụng thiết kế Linear/Notion sạch sẽ, hiện đại.
   - *Chủ dự án xác nhận:* Đồng ý hướng giao diện này hay muốn làm full-screen độc lập hoàn toàn?

---

## 8. KẾ HOẠCH CÁC PHASE TIẾP THEO

- **Phase 1 — Core Prompt Engine & Public API:**
  - Tạo `src/lib/promptkichban/schema.ts` (Zod schemas cho input và output kịch bản).
  - Tạo `src/lib/promptkichban/prompt-templates.ts` (Cấu trúc system prompt chuyên biệt sinh prompt video cho Veo, Grok, Seedance, Muse).
  - Mở rộng policy rate-limit IP trong `src/lib/rate-limit-v2.ts`.
  - Tạo Route Handler `POST /api/promptkichban/generate` độc lập (hỗ trợ cả mock và live AI).
  - Viết unit tests kiểm tra validation và rate-limiting.
- **Phase 2 — UI Wizard tại `/promptkichban`:**
  - Xây dựng giao diện công khai `/promptkichban` với Stepper wizard 3 bước.
  - Form chọn máy Anh Táo Mobile (preset gợi ý sẵn + nhập tay tùy biến).
  - Chọn target AI engine (Veo, Grok, Seedance, Muse).
  - Bảng hiển thị kịch bản phân cảnh + Hộp Prompt 1-Click Copy từng cảnh.
  - Lưu lịch sử tạm thời vào LocalStorage.
- **Phase 3 — Tích hợp & Kiểm thử Toàn diện:**
  - Kiểm thử Responsive (Desktop 1440px và Mobile 390px).
  - Kiểm tra tính độc lập: đảm bảo `/app` và `/api/studio/*` vẫn hoạt động nguyên vẹn 100%.
  - Run typecheck, lint, build và browser smoke test.

---

## 9. KẾT QUẢ KIỂM TRA HIỆN TRẠNG (PRE-CHANGE VERIFICATION)

- **Lệnh `npm run typecheck`:**
  ```text
  > digital-product-store@0.1.0 typecheck
  > tsc --noEmit
  => KẾT QUẢ: 0 errors (Codebase sạch hoàn toàn về TypeScript).
  ```
- **Lệnh `npm run build`:**
  - Trong môi trường sandbox cô lập không có internet: Next.js báo lỗi do `next/font/google` cố gắng kết nối tải font `Be Vietnam Pro` và `Lora` từ Google Fonts.
  - Khi chạy có kết nối mạng bên ngoài sandbox: Lệnh `next build` hoàn tất thành công 100% trong ~17s, biên dịch đầy đủ 62 routes (gồm cả tĩnh và động) mà không phát sinh bất kỳ lỗi nào.

---
*Báo cáo Phase 0 kết thúc tại đây. Hệ thống dừng lại và không tự ý chuyển sang Phase 1 cho đến khi nhận được chỉ đạo tiếp theo từ Chủ dự án.*
