# KẾ HOẠCH TỔNG THỂ: PROMPTKICHBAN UNIVERSAL VIDEO PROMPT STUDIO
## TÁI CẤU TRÚC THÀNH CÔNG CỤ PHÂN TÍCH KỊCH BẢN & SINH PROMPT VIDEO ĐA NĂNG

> **Dự án:** `ai-mo-web-workplace`  
> **Database:** `ai-mo-staging` (Project ID: `omdviaffxevjvexausao`)  
> **Mục tiêu:** Nâng cấp module `/promptkichban` từ một công cụ phụ thuộc cửa hàng điện thoại thành Web App tạo prompt video đa năng cho mọi ngành nghề, tập trung định dạng cho Google Veo 3 và xAI Grok.  
> **Giai đoạn:** Phase 0 — Audit First & Implementation Blueprint  
> **Ngày lập:** 07/11/2026  

---

## 1. Hiện trạng hệ thống (Current State Audit)

### 1.1. Các điểm nghẽn và thiên kiến hardcoded (Biases)
Qua kiểm tra toàn bộ codebase tại `ai-mo-web-workplace`, hệ thống hiện tại đang bị ràng buộc sâu vào thương hiệu "Anh Táo Mobile" và sản phẩm iPhone:
1. **Presets (`src/lib/promptkichban/presets.ts`):**
   - Toàn bộ 8/8 preset đều gắn với iPhone (iPhone cũ sinh viên, Review iPhone mới, So sánh iPhone & Android, iPhone trả góp, v.v.).
   - CTA trong preset đều mặc định: *"Ghé ngay Anh Táo Mobile..."*.
2. **UI & Branding (`src/components/promptkichban/*`, `src/app/promptkichban/page.tsx`):**
   - Header hiển thị nhãn: *"Anh Táo Mobile — AI Studio"*.
   - Input Form placeholder: *"Ghé ngay Anh Táo Mobile để xem máy..."*, gợi ý quay: *"đặc tả viền titan..."*.
   - Footer form: *"Hệ thống miễn phí cho khách truy cập website Anh Táo Mobile"*.
   - Markdown export (`markdown.ts`): Kèm chữ ký chân trang *"PromptKichBan — AI Video Prompt Studio (Anh Táo Mobile)"*.
3. **Mock Generator (`src/lib/promptkichban/service.ts`):**
   - Khởi tạo mặc định: *"Hands picking up the smartphone..."*, *"Modern high-end smartphone retail studio..."*, *"MÁY ĐẸP KENG • GIÁ HỜI"*, *"ANH TÁO MOBILE • MUA NGAY"*, `#AnhTaoMobile`.
4. **Input Schema quá cứng nhắc (`src/lib/promptkichban/schema.ts`):**
   - Bắt buộc người dùng phải chọn đầy đủ 7 thông số giọng đọc (`voiceGender`, `voiceRegion`, `voiceAge`, `voiceRole`, `speakingSpeed`, `emotion`, `tone`).
   - Nếu người dùng chỉ muốn nhập kịch bản có sẵn để chia cảnh và tạo prompt góc máy (không cần lồng tiếng hoặc video dạng UGC/POV), form vẫn bắt buộc điền các thông số này.
5. **Chưa có cơ chế bảo toàn kịch bản gốc (Original Script Preservation):**
   - Hiện tại mỗi cảnh chỉ có trường `action`, `voiceover`, và `prompt` do AI tự sinh hoặc diễn giải lại. Chưa có trường bắt buộc `originalScriptSegment` để giữ nguyên 100% câu chữ người dùng đưa vào.
6. **Chưa có cấu trúc prompt chuyên sâu cho Veo 3 và Grok:**
   - Đang dàn trải 5 model (`veo3`, `grok`, `seedance2`, `seedance25`, `muse`), trong đó cấu trúc chỉ là chuỗi string phẳng, chưa có format chuẩn theo thẻ ngoặc của Google Veo 3 và visual dynamics của xAI Grok kèm `negativePrompt` và `notes`.

---

## 2. Phần tái sử dụng (Reusable Architecture & Assets)

Dự án đã xây dựng nền tảng rất vững chắc từ Phase 1 đến Phase 5A.1, có thể tái sử dụng toàn bộ:

1. **AI Provider Gateway & Resiliency (`src/lib/promptkichban/ai.ts`):**
   - Kết nối live VietAPI (`deepseek-v4-flash`) và Gemini với retry hữu hạn, timeout 45s, xử lý lỗi chuẩn hóa bằng tiếng Việt.
   - Deterministic Mock Generator hỗ trợ kiểm thử offline nhanh và không tốn chi phí.
   - Quản lý Secret an toàn: API key lưu trữ server-side, fail-closed khi thiếu key trong môi trường production, tuyệt đối không lộ ra `NEXT_PUBLIC_*`.
2. **Hệ thống Lưu trữ & Cloud Library (`src/lib/promptkichban/document-store.ts`):**
   - Bảng `PromptKichBanDocument` trên Supabase PostgreSQL đã hoạt động ổn định với đầy đủ CRUD (lưu, cập nhật tên, soft-delete, cascade delete theo user).
   - LocalStorage fallback hoàn chỉnh cho khách vãng lai (`aimo_promptkichban_history`).
   - Đồng bộ từ Local sang Cloud khi khách đăng nhập tài khoản.
3. **An ninh & Bảo vệ hạ tầng:**
   - Chống CSRF qua `requireSameOrigin` (`src/lib/csrf.ts`).
   - Rate limit chống DDoS qua Upstash Redis (`rateLimitPromptKichBan`) phân tách guest và authenticated user.
   - Fail-closed Gatekeeper trong `src/instrumentation.ts` ngăn chặn production khởi động khi thiếu cấu hình trọng yếu.
   - Safe Observability (`src/lib/promptkichban/observability.ts`) ghi log structured JSON có `requestId`, `duration`, `status` mà không bao giờ ghi user prompt hay secret.
4. **Hệ thống UI Foundation:**
   - Hệ thống Design System Tailwind CSS với Dark/Light theme token.
   - Toàn bộ layout Drawer, Modal, Toast Notification, Scene Card, Tab Copy, Markdown/JSON export.

---

## 3. Phần cần sửa đổi & Thiết kế mới (Refactoring & New Features)

### 3.1. Nguyên tắc sản phẩm (Core Product Principles)
1. **Không gắn mặc định với Anh Táo Mobile hay bất kỳ cửa hàng nào.**
2. **Không mặc định nội dung về iPhone, công nghệ hay ngành hàng cụ thể.**
3. **Không mặc định phong cách faceless (cho phép tùy chọn người thuyết trình, POV, hands-only, v.v.).**
4. **Không mặc định SEO địa phương hoặc CTA bán hàng.**
5. **Không tự ý sửa lời thoại gốc:** Mọi đoạn script của người dùng phải được ánh xạ trọn vẹn vào `originalScriptSegment` của từng phân cảnh.
6. **Mọi thông tin sản phẩm, giá, thông số, cam kết phải xuất phát từ input của người dùng:** Tuyệt đối không để AI tự bịa giá hay chứng thực giả.
7. **Thiếu thông tin thì nêu rõ giả định hoặc cảnh báo trong `missingInformation` / `warnings`.**
8. **Chỉ sinh prompt mô tả video, không gọi API Veo/Grok để sinh file video.**

### 3.2. Cấu trúc hợp đồng dữ liệu mới (Phase 1 Contract)

#### A. Input Contract (`PromptKichBanInput`)
- `scriptText`: Kịch bản có sẵn của người dùng (bắt buộc, min 20 ký tự, max 12.000 ký tự). Hỗ trợ alias `inputText` để tương thích ngược.
- `contentType`: `tvc` | `review` | `tutorial` | `tips` | `storytelling` | `podcast` | `education` | `entertainment` | `custom`.
- `publishingPlatform`: `tiktok` | `reels` | `shorts` | `youtube` | `facebook` | `custom`.
- `videoModel`: `veo3` | `grok` | `both` (default: `both`). Hỗ trợ alias `promptModel` cũ.
- `aspectRatio`: `9:16` | `16:9` | `1:1` | `4:5` (default: `9:16`).
- `durationSeconds`: 15–300 giây (default: `30`).
- `visualStyle`: `cinematic` | `ugc` | `documentary` | `clean-commercial` | `lifestyle` | `educational` | `custom` (default: `cinematic`).
- `performanceMode`:
  - `no-person`: Không có người, tập trung sản phẩm / bối cảnh / đồ họa.
  - `hands-or-POV`: Góc nhìn thứ nhất, cận cảnh bàn tay thao tác.
  - `person-no-face-focus`: Có người nhưng không quay rõ mặt (quay từ sau lưng, vai, góc khuất).
  - `presenter-on-camera`: Người dẫn chuyện / diễn viên nhìn thẳng ống kính.
  - `custom`: Tùy chỉnh theo kịch bản.
- `characterDescription`: Mô tả nhân vật / diễn viên (tùy chọn, string).
- `voiceLanguage`: Ngôn ngữ kịch bản (default: `vi`).
- `voiceTone`: Tông giọng / phong thái (tùy chọn).
- `pacing`: Nhịp điệu video (`slow` | `balanced` | `fast`, default: `balanced`).
- `seoEnabled`: Bật/tắt sinh SEO metadata (boolean, default: `false`).
- `cta`: Lời kêu gọi hành động (tùy chọn).
- `additionalRequirements`: Yêu cầu kỹ thuật hình ảnh / đạo cụ / ánh sáng (tùy chọn).

*Nguyên tắc UX Input:* **Chỉ có `scriptText` là bắt buộc.** Tất cả các trường còn lại đều có giá trị mặc định an toàn.

#### B. Output Contract (`VideoPromptOutput`)
- **Cấp Video:**
  - `title`: Tiêu đề kịch bản.
  - `summary`: Tóm tắt tổng quan.
  - `hook`: Câu Hook thu hút trong 3 giây đầu.
  - `contentType`, `publishingPlatform`, `aspectRatio`, `durationSeconds`, `visualStyle`.
  - `scenes`: Danh sách các phân cảnh (VideoScene[]).
  - `voiceoverFull`: Toàn bộ lời thoại liên tục.
  - `cta`: Lời kêu gọi hành động.
  - `caption`: Nội dung caption đăng bài.
  - `keywords`: Từ khóa SEO (chỉ sinh khi `seoEnabled = true`).
  - `hashtags`: Danh sách hashtags phù hợp nền tảng.
  - `warnings`: Cảnh báo rủi ro nội dung / bản quyền / chính sách.
  - `missingInformation`: Danh sách thông tin còn thiếu mà AI đã phải giả định trung tính.
  - `requestId`: ID định danh request để truy vết.
  - `generatedAt`: Thời gian tạo ISO-8601.

- **Cấp Phân cảnh (`VideoScene`):**
  - `sceneNumber`: Thứ tự cảnh (1, 2, ..., N).
  - `startSecond`, `endSecond`: Mốc thời gian liên tục từ 0s đến `durationSeconds`.
  - `originalScriptSegment`: **Bắt buộc** — Đoạn thoại hoặc nội dung kịch bản gốc tương ứng với cảnh này.
  - `scenePurpose`: Mục đích phân cảnh (Hook, Problem, Solution, Demo, Benefit, CTA...).
  - `visualDescription`: Mô tả chi tiết hình ảnh cảnh quay.
  - `setting`: Bối cảnh không gian.
  - `subject`: Chủ thể chính của cảnh.
  - `characterAction`: Hành động chi tiết của nhân vật / bàn tay / chủ thể.
  - `facialExpression`: Biểu cảm gương mặt (nếu có người).
  - `emotion`: Sắc thái cảm xúc truyền tải.
  - `cameraShot`: Cỡ cảnh (Extreme Close-up, Close-up, Medium shot, Wide shot...).
  - `cameraAngle`: Góc máy (Eye-level, Low-angle, High-angle, Dutch angle, Top-down...).
  - `cameraMovement`: Chuyển động camera (Push-in, Pan, Tilt, Orbit, Tracking, Static...).
  - `lensAndDepth`: Tiêu cự ống kính và độ sâu trường ảnh (35mm f/1.8, Shallow DOF, Macro...).
  - `lighting`: Thiết lập ánh sáng (Cinematic rim lighting, Soft commercial diffused light...).
  - `soundDesign`: Âm thanh nền, tiếng động môi trường, SFX.
  - `transition`: Hiệu ứng chuyển cảnh tiếp theo.
  - `modelPrompts`: Đối tượng chứa prompt chuẩn cho từng video engine:
    ```typescript
    interface SceneModelPromptItem {
      model: "veo3" | "grok";
      prompt: string;
      negativePrompt: string;
      notes: string;
    }
    ```
  - `negativePrompt`: Negative prompt chung cho cảnh.
  - `continuityNotes`: Ghi chú tính liền mạch về trang phục, vị trí chủ thể và ánh sáng.
  - `isLocked`: Trạng thái khóa chỉnh sửa cảnh.

#### C. Timeline Invariants (Ràng buộc thời gian)
1. Cảnh đầu tiên luôn bắt đầu ở giây 0 (`scenes[0].startSecond === 0`).
2. Mọi cảnh đều có thời lượng dương (`scene.endSecond > scene.startSecond`).
3. Các cảnh hoàn toàn liên tục, không khe hở (gap) và không đè lên nhau (overlap): `scenes[i].startSecond === scenes[i - 1].endSecond`.
4. Cảnh cuối cùng kết thúc chính xác tại thời lượng tổng (`scenes[last].endSecond === durationSeconds`).
5. Chuẩn hóa timeline không được phép tự ý cắt bỏ hoặc thay đổi câu chữ trong `originalScriptSegment`.

### 3.3. Script Beat Analyzer & Prompt Compiler Pipeline (Phase 2 & 3)

1. **Phân tích nhịp kịch bản (Script Beat Analyzer):**
   - Đọc kịch bản gốc, phân tách thành $N$ beats tự nhiên dựa theo dấu câu, câu thoại và nhịp chuyển ý.
   - Tính toán thời lượng hiển thị phù hợp với tốc độ đọc chuẩn (trung bình 3–4 từ/giây trong tiếng Việt).
   - Gán nguyên vẹn từng đoạn text vào `originalScriptSegment`.
2. **Đạo diễn hình ảnh & Tính liên tục (Visual Director):**
   - Dựa vào `performanceMode` đã chọn: Nếu là `no-person`, tuyệt đối không đưa nhân vật vào prompt. Nếu là `hands-or-POV`, chỉ đặc tả góc nhìn thứ nhất và thao tác bàn tay.
   - Thiết lập ánh sáng, bối cảnh, chuyển động máy quay tạo nhịp điệu thị giác lôi cuốn.
   - Kiểm tra tính trung thực: Nếu kịch bản không đề cập giá tiền hay ưu đãi, hệ thống không tự thêm vào, đồng thời ghi chú vào `missingInformation`.
3. **Bộ biên dịch Prompt chuẩn cho Veo 3 và Grok (Local Model Compiler):**
   - **Google Veo 3 Compiler:**
     - Cấu trúc: `[Subject & Action]: ... [Setting & Environment]: ... [Cinematography]: ... [Lighting & Color]: ... [Motion Continuity]: ... [Context]: ... [Technical Specs]: Aspect ratio {ratio}, duration {dur}s, 4K resolution, 24fps photoreal cinematic render. --no {negative}`.
   - **xAI Grok Video Compiler:**
     - Cấu trúc visual dynamics tốc độ cao, nhấn mạnh tính chân thực và chi tiết chuyển động vật lý: `High-fidelity {style} video capture. Subject: ... Setting: ... Action: ... Camera: ... Lighting: ... Motion: ... Specs: {ratio}, {dur}s runtime. Negative: ...`.
4. **Tối ưu hóa Token & Tốc độ:**
   - LLM chỉ sinh cấu trúc kịch bản và thông số visual cốt lõi (JSON tinh gọn).
   - Server-side compiler tự động biên dịch prompt hoàn chỉnh cho Veo 3 và Grok mà không cần tiêu tốn token đầu ra của LLM. Giúp giảm độ trễ từ ~20s xuống ~8-12s và tiết kiệm 60% chi phí token.

### 3.4. Cải tiến giao diện người dùng (Phase 4 UX/UI)

1. **Thương hiệu & Header:**
   - Thay nhãn Anh Táo Mobile bằng **AI Mở Video Prompt Studio**.
   - Phục vụ người dùng đa dạng: Chủ shop, Affiliate creator, Doanh nghiệp nhỏ, Content Creator.
2. **Bộ Presets Đa Ngành Hàng (8 Universal Presets):**
   - *Preset 1: Review sản phẩm E-commerce (UGC / Mở hộp)*.
   - *Preset 2: TVC Mỹ phẩm / Thời trang (Cinematic / Sang trọng)*.
   - *Preset 3: Hướng dẫn mẹo vặt công nghệ (Hands & Screen POV)*.
   - *Preset 4: Giới thiệu Quán Cafe / F&B (Lifestyle / Ánh sáng tự nhiên)*.
   - *Preset 5: Storytelling xây dựng thương hiệu cá nhân (Presenter on camera)*.
   - *Preset 6: Đồ gia dụng thông minh Smart Home (Clean commercial)*.
   - *Preset 7: Khóa học & Giáo dục kỹ năng (Educational / Infographic)*.
   - *Preset 8: Bất động sản / Du lịch trải nghiệm (Documentary / Wide angle)*.
3. **Màn hình Nhập kịch bản (Input Screen):**
   - Trọng tâm hàng đầu: Textarea lớn cho `Kịch bản video`.
   - Nút chọn nhanh: Nền tảng (TikTok, Reels, Shorts, YouTube) & Model (Veo 3, Grok, Cả hai).
   - Tỷ lệ khung hình & Thời lượng (15s, 30s, 45s, 60s, 90s).
   - Phong cách hình ảnh & Chế độ diễn xuất nhân vật (Không người / POV bàn tay / Không thấy mặt / Diễn xuất trước ống kính).
   - Accordion tùy chọn nâng cao: Mô tả nhân vật, Tông giọng, SEO metadata toggle, CTA.
   - Nút hành động chính: **`Phân tích kịch bản và tạo prompt`**.
4. **Màn hình Kết quả (Workspace Screen):**
   - Bố cục 3 cột trực quan trên Desktop:
     - **Cột 1 (Scene List):** Danh sách các phân cảnh kèm mốc thời gian và đoạn kịch bản gốc.
     - **Cột 2 (Scene Detail & Director Editor):** Biên tập chi tiết góc máy, ánh sáng, diễn xuất nhân vật, lời thoại.
     - **Cột 3 (Model Prompts):** Tab xem và copy prompt cho **Google Veo 3** và **xAI Grok Video**, kèm giải thích kỹ thuật và negative prompt.

---

## 4. Đánh giá tác động Schema & API (Impact Analysis)

### 4.1. Tác động tới API `/api/promptkichban/generate`
- **Tương thích ngược (Backward Compatibility):**
  - API chấp nhận cả trường mới `scriptText` lẫn trường cũ `inputText`.
  - API chấp nhận cả trường mới `videoModel` lẫn trường cũ `promptModel`.
  - Nếu request không gửi các trường voiceover cũ (`voiceGender`, `voiceRegion`...), hệ thống tự động gán default an toàn thay vì báo lỗi Zod validation.

### 4.2. Tác động tới Thư viện & Dữ liệu đã lưu (`PromptKichBanDocument`)
- Bảng `PromptKichBanDocument` lưu dữ liệu dưới dạng JSON (`inputSnapshot` và `outputSnapshot`).
- Khi người dùng mở lại tài liệu cũ được lưu từ các Phase trước:
  - Hàm load tài liệu sẽ kiểm tra: Nếu cảnh cũ chưa có `originalScriptSegment`, tự động lấy từ `voiceover` hoặc `action`.
  - Nếu chưa có `characterAction`, tự động lấy từ `action`.
  - Các tài liệu cũ vẫn hiển thị đầy đủ trên giao diện mới mà không xảy ra lỗi render.

---

## 5. Kế hoạch Database & Migration Safety

> [!IMPORTANT]
> **KẾT LUẬN QUAN TRỌNG:** **KHÔNG CẦN BẤT KỲ DDL HOẶC PRISMA MIGRATION NÀO CHO PHASE NÀY.**

### Phân tích chi tiết:
1. Model `PromptKichBanDocument` hiện tại trong `prisma/schema.prisma`:
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
     status             String    @default("saved")
     createdAt          DateTime  @default(now())
     updatedAt          DateTime  @updatedAt
     deletedAt          DateTime?

     user               User      @relation(fields: [userId], references: [id], onDelete: Cascade)
     @@index([userId])
     @@index([userId, deletedAt])
     @@index([deletedAt])
   }
   ```
2. Các trường `inputSnapshot` và `outputSnapshot` là kiểu `Json` (PostgreSQL `jsonb`), hoàn toàn có thể lưu trữ cấu trúc mới mà không làm thay đổi cấu trúc bảng hay kiểu dữ liệu của Postgres.
3. Các trường metadata (`durationSeconds`, `aspectRatio`, `publishingPlatform`, `contentType`) đều là kiểu chuẩn `Int` và `String`, hoàn toàn phù hợp với các giá trị mở rộng mới.
4. **Cam kết an toàn tuyệt đối:**
   - Không chạy lệnh `prisma db push`.
   - Không chạy lệnh migration production.
   - Không thay đổi bảng của Storefront hay bảng Studio cũ.
   - Giữ nguyên trạng thái Database `ai-mo-staging`.

---

## 6. Kế hoạch Kiểm thử Toàn diện (Test Plan)

### 6.1. Unit & Schema Tests
- Tạo mới bộ kiểm thử hợp đồng dữ liệu:
  - `tests/promptkichban-universal-schema.spec.ts`:
    - Kiểm thử Zod schema input mới: `scriptText` bắt buộc, các trường khác tùy chọn có default an toàn.
    - Kiểm thử Zod schema output mới: đầy đủ `originalScriptSegment`, `characterAction`, `facialExpression`, `cameraAngle`, `modelPrompts` (Veo 3 & Grok).
    - Kiểm thử timeline invariants: 0s -> duration, không khe hở, không đè lấn.
    - Kiểm thử tính tương thích ngược với payload cũ (`inputText`, `voiceGender`...).

### 6.2. Script Beat & Compiler Tests
- `tests/promptkichban-beat-analyzer.spec.ts`:
  - Kiểm thử khả năng chia beat từ các kịch bản dài và ngắn.
  - Đảm bảo 100% câu từ trong kịch bản gốc được giữ nguyên vẹn trong `originalScriptSegment`.
  - Đảm bảo không bịa đặt thông số, giá bán hay ưu đãi.
- `tests/promptkichban-model-compilers.spec.ts`:
  - Kiểm thử định dạng prompt Google Veo 3: Thẻ ngoặc `[Subject & Action]`, `[Cinematography]`, `--no negative`.
  - Kiểm thử định dạng prompt xAI Grok: Visual dynamics, cinematic pacing.

### 6.3. Regression Tests (Bảo toàn các tính năng cũ)
- Chạy toàn bộ test suites hiện có để đảm bảo 100% tỷ lệ vượt qua:
  - `npm run test:promptkichban` (33 tests).
  - `npm run test:promptkichban:docs` (12 tests CRUD Postgres).
  - `npm test` (39 core tests).
  - `npm run test:server` (22 server tests).
  - `npm run typecheck` (0 lỗi TypeScript).
  - `npm run build` (66/66 routes compile thành công).

### 6.4. Live VietAPI & Playwright E2E Tests
- Kiểm thử live benchmark với 5 kịch bản thực tế thuộc các lĩnh vực khác nhau:
  1. Kịch bản quảng cáo đồ uống / F&B.
  2. Kịch bản review sách / khóa học.
  3. Kịch bản chia sẻ mẹo nấu ăn gia đình.
  4. Kịch bản bán hàng thời trang nữ.
  5. Kịch bản giới thiệu công ty / dịch vụ phần mềm.
- Kiểm thử E2E trên trình duyệt thật bằng Playwright:
  - Khách vãng lai nhập kịch bản -> Bấm "Phân tích kịch bản và tạo prompt" -> Xem Storyboard 3 cột -> Chuyển tab Veo 3 / Grok -> Copy prompt -> Lưu Local Library.
  - Thành viên đăng nhập -> Lưu Cloud Library -> Đổi tên bản ghi -> Mở lại trên thiết bị khác.

---

## 7. Rủi ro & Kế hoạch Rollback (Risks & Rollback Strategy)

| Rủi ro tiềm ẩn | Mức độ | Biện pháp phòng ngừa & Xử lý |
| :--- | :---: | :--- |
| **LLM tự ý viết lại kịch bản gốc** | Cao | Prompt engineering nghiêm ngặt (`STRICT: preserve original dialogue verbatim`). Hàm post-process kiểm tra và khôi phục câu từ gốc từ user script nếu phát hiện sai lệch. |
| **LLM bịa đặt khuyến mãi / giá bán** | Trung bình | Yêu cầu LLM chỉ sử dụng dữ kiện người dùng cung cấp. Mọi chi tiết thiếu bắt buộc phải đưa vào `missingInformation` dưới dạng mô tả trung tính. |
| **Lỗi hiển thị bản lưu cũ trong thư viện** | Trung bình | Viết adapter chuẩn hóa (data normalizer) tự động điền các trường mới từ dữ liệu cũ trước khi render ra UI. |
| **Thời gian phản hồi AI tăng cao** | Thấp | Tối ưu hóa JSON payload đầu ra, chuyển việc sinh model prompt Veo 3 / Grok sang compiler server-side để giảm 60% token output. |

### Kế hoạch Rollback
Do không có thay đổi DDL trên Database, nếu xảy ra sự cố trong quá trình nâng cấp mã nguồn, việc rollback sẽ được thực hiện nhanh chóng trong vòng 2 phút bằng cách khôi phục lại các file code nguồn theo phiên bản Phase 5A.1 mà không gây gián đoạn dịch vụ hay mất mát dữ liệu.

---

## 8. Lộ trình triển khai (Execution Roadmap)

- **Phase 0 (Hiện tại):** Hoàn thành Audit, lập kế hoạch chi tiết, không đụng chạm database.
- **Phase 1 (Product Contract):** Nâng cấp Zod schemas (`schema.ts`), bổ sung bộ unit test contract mới, đảm bảo tương thích ngược 100%.
- **Phase 2 (Script Analysis & Model Compilers):** Cải tiến pipeline phân tích kịch bản, bảo toàn câu từ gốc, hoàn thiện bộ compiler Veo 3 & Grok.
- **Phase 3 (Provider & Reliability):** Tối ưu hóa System Prompt cho VietAPI `deepseek-v4-flash`, nâng cấp Deterministic Mock.
- **Phase 4 (UX/UI Universal Redesign):** Loại bỏ toàn bộ branding Anh Táo Mobile, cập nhật 8 Universal Presets, xây dựng bố cục 3 cột Desktop cho Workspace.
- **Phase 5 (Testing & Production Gate):** Chạy toàn bộ test suites, benchmark live VietAPI, Playwright E2E và đóng gói release.
