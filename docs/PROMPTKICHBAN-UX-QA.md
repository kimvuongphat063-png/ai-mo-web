# BÁO CÁO KIỂM THỬ THỰC TẾ & CỐ CỐ UX — PROMPTKICHBAN (PHASE 3A)
**Ngày thực hiện:** 2026-11-06  
**Môi trường:** Localhost Dev / Chromium Headless (Playwright)  
**Phạm vi:** Route `/promptkichban`, `/api/promptkichban/generate`, `/api/promptkichban/regenerate-scene`  
**Công cụ kiểm thử:** Playwright Real Browser Test (`tests/promptkichban-ui.spec.ts`), Vitest/Node Test Suite, TypeScript Compiler, ESLint  

---

## 1. TỔNG QUAN KẾT QUẢ KIỂM THỬ

| Hạng mục | Chỉ số | Kết quả | Trạng thái |
|---|---|---|---|
| **Playwright UI Tests (`promptkichban-ui.spec.ts`)** | 3 / 3 test suites | 100% Passed (16.5s) | ✅ ĐẠT |
| **PromptKichBan Unit Tests (`tests/promptkichban.ts`)** | 18 / 18 tests | 100% Passed | ✅ ĐẠT |
| **Studio Core Unit Tests (`tests/unit.ts`)** | 39 / 39 tests | 100% Passed | ✅ ĐẠT |
| **Server Usage & Rate Limit Tests (`test:server`)** | 22 / 22 tests | 100% Passed | ✅ ĐẠT |
| **TypeScript Typecheck (`tsc --noEmit`)** | 0 error | Clean compilation | ✅ ĐẠT |
| **ESLint (`src/.../promptkichban`)** | 0 error / 0 warning | Clean standards | ✅ ĐẠT |
| **Next.js Production Build (`next build`)** | 65 / 65 routes | Static & Dynamic OK | ✅ ĐẠT |

---

## 2. CÁC LUỒNG NGHIỆP VỤ ĐÃ XÁC MINH TRÊN BROWSER THẬT

### 2.1. Luồng Desktop (Viewport: 1440x900)
1. **Form mặc định:** Khởi tạo sạch sẽ, tiêu đề, mô tả rõ ràng, hiển thị badge đếm ký tự `0 / 12,000`.
2. **Tính độc lập của bộ chọn:** Nền tảng xuất bản (`publishingPlatform`: TikTok, Reels, Shorts...) và Mô hình video AI (`promptModel`: Veo 3, Grok, Seedance 2.5, Seedance 2.0, Muse, All) là 2 bộ chọn độc lập hoàn toàn, không gộp hay nhầm lẫn.
3. **Preset nhanh Anh Táo Mobile:** Click preset *"iPhone cũ cho sinh viên"* tự động điền đầy đủ nội dung (>150 ký tự), cập nhật thời lượng, phong cách, vai trò người nói và CTA phù hợp.
4. **Accordion Tùy chỉnh nâng cao:** Mở/đóng mượt mà, đầy đủ thuộc tính trợ năng `aria-expanded` và `aria-controls`.
5. **Trạng thái Loading & Khóa Double-Submit:** Nút submit bị vô hiệu hóa khi input < 20 ký tự hoặc khi đang trong quá trình sinh kịch bản. Loading text hiển thị theo nhịp xoay vòng.
6. **Bố cục Storyboard 3 vùng (Desktop 3-Column):**
   - *Cột 1 (Timeline):* Danh sách phân cảnh với thẻ thời gian (`0s-5s`, `5s-12s`...), shot type badge, và icon máy quay.
   - *Cột 2 (Scene Editor):* Xem và chỉnh sửa trực tiếp Lời thoại (Voiceover), Góc máy (Camera Shot), Chuyển động (Camera Movement), Chữ trên màn hình (On-screen text), Bối cảnh, Ánh sáng, SFX, Chuyển cảnh.
   - *Cột 3 (Model Prompts):* Tab chuyển đổi nhanh giữa Veo 3, Grok, Seedance 2.5, Seedance 2.0, Muse kèm hướng dẫn kỹ thuật của từng engine.
7. **Khóa cảnh (Scene Lock):** Bấm nút *Khóa cảnh* đánh dấu `isLocked: true`, hiển thị badge *"Đã khóa"* và icon ổ khóa. Nút *Tạo lại cảnh* bị vô hiệu hóa an toàn để ngăn người dùng vô tình ghi đè cảnh quan trọng.
8. **Chỉnh sửa & Lưu cảnh:** Sửa lời thoại và góc máy ➔ bấm *Lưu sửa* ➔ nội dung được cập nhật ngay vào state và lưu bền vững vào `localStorage`.
9. **Tạo lại chỉ 1 cảnh (`regenerateScene`):** Tạo lại cảnh số 2 ➔ chỉ cảnh số 2 được cập nhật visual direction và prompt mới, cảnh số 1 (đã khóa) và các cảnh còn lại giữ nguyên 100%.
10. **Sao chép Prompt & Trợ năng:** Nút *Sao chép Prompt* phản hồi checkmark *"Đã sao chép"*. Các tab model tuân thủ WAI-ARIA (`role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, `role="tabpanel"`).
11. **Thư viện LocalStorage (`LibraryDrawer`):** Mở drawer từ header, hiển thị danh sách kịch bản đã lưu. Cho phép mở lại kịch bản cũ hoặc xóa từng mục.
12. **Khả năng phục hồi khi Reload (F5):** Tải lại trang vẫn giữ nguyên kịch bản và cảnh đang biên tập dở dang từ `aimo_promptkichban_current`.
13. **Khả năng chịu lỗi khi LocalStorage bị hỏng (Resilience):** Khi ghi đè dữ liệu rác/JSON lỗi (`{CORRUPTED_JSON_MALFORMED`) vào `localStorage`, ứng dụng vẫn bắt lỗi an toàn (try/catch), không bị crash hay hiển thị màn hình trắng.

### 2.2. Luồng Mobile (Viewport: 390x844 - iPhone Form Factor)
1. **Không tràn màn hình theo chiều ngang (No Horizontal Overflow):** Đã kiểm tra `document.documentElement.scrollWidth <= document.documentElement.clientWidth` cho cả màn hình Form nhập liệu và màn hình Storyboard Workspace.
2. **Trải nghiệm chạm (Touch-friendly):** Các chip preset, nút bấm, selector có kích thước tối thiểu từ 36px - 48px, nhắm trúng ngón tay dễ dàng.
3. **Layout xếp chồng thông minh (Vertical Flow):** Bố cục 3 cột trên desktop tự động chuyển thành dòng thời gian dọc dễ cuộn trên điện thoại.

### 2.3. Luồng Kiểm soát Lỗi & Rate-Limit
1. **Error State (Mã lỗi 500 / Network Error):** Khi server gặp sự cố hoặc timeout, hệ thống bắt lỗi an toàn, hiển thị hộp Alert đỏ thân thiện bằng tiếng Việt, loading state kết thúc ngay lập tức, nút submit mở lại để người dùng thử lại.
2. **Rate-Limit State (HTTP 429 Quota):** Khi đạt giới hạn 3 kịch bản/ngày/IP, Route Handler trả về HTTP 429 kèm header `Retry-After: 86400`. Client hiển thị thông báo mời quay lại vào ngày mai hoặc đăng nhập.

---

## 3. DANH SÁCH 12 SCREENSHOT THỰC TẾ ĐÃ CHỤP

Toàn bộ 12 ảnh chụp màn hình thực tế bằng Playwright Chromium đã được lưu vào thư mục:  
`docs/screenshots/promptkichban/`

| STT | Tên file | Mô tả màn hình |
|---|---|---|
| 01 | `01-form-default.png` | Giao diện Form mặc định trên Desktop 1440x900 |
| 02 | `02-form-preset.png` | Form sau khi click Preset *"iPhone cũ cho sinh viên"* |
| 03 | `03-advanced-options.png` | Accordion Tùy chỉnh nâng cao được mở (Giọng, Tông, CTA, Ngôn ngữ) |
| 04 | `04-loading-state.png` | Trạng thái đang sinh kịch bản với progress text xoay vòng |
| 05 | `05-storyboard-3-col.png` | Storyboard Workspace 3 cột hoàn chỉnh trên Desktop |
| 06 | `06-scene-detail.png` | Cột Chi tiết cảnh với tính năng Khóa cảnh, Sửa lời thoại, Sửa camera |
| 07 | `07-model-prompt-tabs.png` | Tab Prompt chuyển đổi giữa các engine (Grok, Muse, Veo, Seedance) |
| 08 | `08-library-drawer.png` | Drawer Thư viện kịch bản đã lưu trong LocalStorage |
| 09 | `09-mobile-form.png` | Giao diện Form trên màn hình điện thoại iPhone 390x844 |
| 10 | `10-mobile-storyboard.png` | Giao diện Storyboard trên màn hình điện thoại iPhone 390x844 |
| 11 | `11-error-state.png` | Màn hình thông báo lỗi máy chủ an toàn không lộ stack trace |
| 12 | `12-rate-limit-state.png` | Màn hình thông báo giới hạn 3 kịch bản/ngày (HTTP 429) |

---

## 4. CÁC LỖI PHÁT HIỆN VÀ ĐÃ XỬ LÝ (BUG FIXES)

1. **Khớp cấu trúc phản hồi API (`data.output` vs `data.data`):**
   - *Phát hiện:* Route Handler trả về `{ success: true, data: output }`, trong khi `page.tsx` kiểm tra `data.output`.
   - *Khắc phục:* Bổ sung cả `output` và `data` vào payload trả về ở `src/app/api/promptkichban/generate/route.ts` để đồng bộ hoàn toàn.
2. **Cross-Origin Dev HMR trên 127.0.0.1:**
   - *Phát hiện:* Next.js chặn kết nối HMR dev websocket từ IP `127.0.0.1`.
   - *Khắc phục:* Thêm `allowedDevOrigins: ["127.0.0.1", "localhost"]` vào `next.config.ts`, cập nhật Playwright baseURL trỏ chuẩn về `http://localhost:3000`.
3. **Thao tác Hydration Race Condition trong Playwright:**
   - *Phát hiện:* Playwright click preset trước khi React hoàn tất hydration SSR dẫn đến input chưa nhận state.
   - *Khắc phục:* Bổ sung `waitForLoadState('networkidle')` và `waitForTimeout(600)` giúp test ổn định 100%.
4. **Cô lập IP Rate Limit giữa các test case:**
   - *Phát hiện:* Test Desktop và Test Mobile chạy chung IP `127.0.0.1` làm chạm trần `PROMPTKICHBAN_DAILY_IP_LIMIT=3`.
   - *Khắc phục:* Gán header `x-forwarded-for` độc lập (`127.0.0.11`, `127.0.0.22`) cho từng Browser Context trong file test để các kịch bản test không chiếm quota của nhau.
5. **Cú pháp hàm `regenerateScene`:**
   - *Phát hiện:* API route gọi `regenerateScene(input, currentOutput, sceneNumber)` sai thứ tự tham số.
   - *Khắc phục:* Sửa đúng chữ ký `regenerateScene(currentOutput, sceneNumber, { customNotes: ... })`.
6. **Thêm trường Camera Movement & Lock Scene:**
   - Bổ sung ô nhập `cameraShot`, `cameraMovement` và nút toggle `Khóa cảnh` trực tiếp trên UI workspace theo đúng yêu cầu đề bài.

---

## 5. BẢO MẬT & CÔ LẬP HỆ THỐNG (SECURITY AUDIT)

* **Không lộ bí mật (Secret Leakage Check):** Quét toàn bộ HTML, client bundle và API response — không có bất kỳ API key nào (OpenAI, Anthropic, Gemini, Supabase service role) bị lộ xuống trình duyệt.
* **Không làm bẩn dữ liệu (Database Isolation):** 100% dữ liệu của khách vãng lai chỉ lưu cục bộ tại `localStorage` của máy khách. Không có bất kỳ bản ghi nào được ghi vào các bảng Studio Postgres (`StudioScript`, `StudioProduct`, `StudioAiUsage`).
* **Không bypass quota bằng userId giả:** Route `/api/promptkichban/generate` là public endpoint độc lập, áp dụng rate limit bằng Client IP qua Upstash Redis / Sliding Window In-Memory, hoàn toàn không nhận diện hay cấp quota qua tham số `userId` giả mạo.
* **Không lộ Stack Trace:** Toàn bộ exception được chuẩn hóa qua `PromptKichBanError` hoặc generic message tiếng Việt.

---

## 6. LỖI CÒN LẠI (REMAINING RISKS / ISSUES)

* **Không có lỗi tồn đọng nghiêm trọng.** Toàn bộ 79 bài test tự động và 3 bộ test Playwright đều xanh (Passed).
* *Ghi chú môi trường:* Lệnh `next build` khi chạy bên trong sandbox không có mạng sẽ không tải được Google Fonts từ Google (`fonts.googleapis.com`). Khi chạy với quyền truy cập mạng bình thường (`BypassSandbox: true`), lệnh build hoàn thành 100% trong 6.6 giây.

---

## 7. ĐỀ XUẤT CHO PHASE 3B TIẾP THEO

Khi Chủ dự án phê duyệt Phase 3A, có thể triển khai tiếp **Phase 3B**:
1. **Kết nối AI Live Provider (Gemini / OpenAI / Claude):** Đưa `PROMPTKICHBAN_AI_PROVIDER=gemini` vào hoạt động thật sau khi xác nhận quota API.
2. **Public SEO Script Library (Khám phá kịch bản mẫu):** Xây dựng trang danh mục `/promptkichban/thu-vien` hiển thị các kịch bản mẫu phổ biến của Anh Táo Mobile được lập chỉ mục SEO tốt (SSR / Static Generated).
3. **Tính năng "Lưu vào Studio của tôi":** Với người dùng đã đăng nhập tài khoản Anh Táo Mobile, bổ sung thêm nút 1-click *"Lưu vào Kho Studio cá nhân"* để chuyển kịch bản từ LocalStorage sang database Postgres.

---
*Báo cáo được thực hiện tự động và nghiệm thu hoàn tất cho Phase 3A.*
