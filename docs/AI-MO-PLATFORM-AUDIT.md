# BÁO CÁO AUDIT & KẾ HOẠCH NÂNG CẤP TOÀN DIỆN NỀN TẢNG AI MỞ
## ĐỊNH VỊ: "HỌC AI BẰNG CÁCH TẠO RA THỨ DÙNG ĐƯỢC" (HỌC — DÙNG — TẠO — MUA)

**Ngày lập:** 08/11/2026  
**Trạng thái:** ✅ Phase 0 hoàn tất — Đủ điều kiện chuyển sang Phase 1.

---

## I. HIỆN TRẠNG KIẾN TRÚC & BẢN ĐỒ ROUTE CODEBASE

### 1. Project Root & Cấu trúc kỹ thuật
- **Thư mục project:** `G:\VIBE CODE THẦY DUYỆT\Web AI Mở - Jacky\ai-mo-web-workplace`
- **Framework:** Next.js 16.2.3 (App Router, Turbopack)
- **Styling:** Tailwind CSS v4, `globals.css` (tokens Tech-Led), `refinement.css` (editorial aesthetic)
- **Database:** PostgreSQL (Supabase Staging ID `omdviaffxevjvexausao`), kết nối qua Prisma ORM v7.8.0.
- **Dữ liệu Store / CMS:** File snapshot `data/cms.json` và bảng `PromptKichBanDocument` lưu trữ dạng JSON snapshot không gây drift DDL.

### 2. Bản đồ Route Hiện Có
| Route | Vai trò hiện tại | Nhận xét kiến trúc & Đề xuất |
| :--- | :--- | :--- |
| `/` | Trang chủ hiện tại | Đang render tối giản: chỉ đọc `cms.homepage` và render danh sách 2 khóa học. Cần thiết kế lại toàn diện theo hành trình **Học — Dùng — Tạo — Mua**. |
| `/promptkichban` | Universal Video Prompt Studio | Đã hoàn thành 100% (Veo 3 & Grok, Zod schema chuẩn, 37 test pass, lock/regenerate scene). Đang chạy độc lập với header/footer riêng. Cần đưa vào vị trí công cụ chủ lực trên Homepage và Navigation. |
| `/tools` | Danh mục công cụ | Đang dùng `CatalogPage` lọc sản phẩm `desktop` và `webapp` từ CMS. |
| `/tools/[slug]` | Chi tiết công cụ | Render thông tin sản phẩm và nút mua/dùng thử. |
| `/courses` & `/courses/[slug]` | Khóa học & Chi tiết | Đã có sẵn 2 khóa học thật: *AI Thực Chiến: Từ số 0 đến trợ lý đầu tiên* và *Content Engine AI*. |
| `/learn/[courseSlug]/[lessonSlug]` | LMS Xem bài học | Có player YouTube, danh sách bài học, đánh dấu hoàn thành, mã hóa tiến độ. |
| `/learning-paths/bat-dau-voi-ai` | Lộ trình học | Lộ trình từng bước với các bài tập thực hành. |
| `/guides` & `/guides/[slug]` | Thư viện bài viết kiến thức AI | Đã có 4 bài viết thật về prompt có cấu trúc, an toàn dữ liệu chatbot, chọn AI tool, kiểm chứng câu trả lời. |
| `/bundles`, `/free-resources` | Gói tài nguyên & Miễn phí | Có sẵn sản phẩm `prompt-starter-kit` (Miễn phí) và `solo-ai-business-bundle`. |
| `/cart`, `/checkout`, `/orders/[id]` | Thương mại điện tử (Mua) | Giỏ hàng client `useCart()`, checkout giả lập an toàn, xác nhận đơn hàng, quản lý license key. |
| `/login`, `/register`, `/forgot-password`| Xác thực & Tài khoản | Argon2 password hashing, session signing, rate limiting v2 (Upstash + memory fallback). |
| `/admin/*` | Hệ thống CMS Admin | Quản trị sản phẩm, khóa học, bài viết, đơn hàng, analytics. |
| `/app/*` | AI Mở Studio Workspace | Hệ thống sinh nội dung, quản lý kịch bản, chiến dịch cho creator/marketer. |

---

## II. DANH MỤC 15 ỨNG DỤNG HTML HIỆN CÓ

Toàn bộ 15 ứng dụng HTML được lưu trữ tại `G:\VIBE CODE THẦY DUYỆT\WORKPLACE MASTER CODE\ai-mo-wave1`.

### 1. Kiểm tra An toàn & Kỹ thuật
- **External Dependencies:** **0 script ngoài** (Không CDN, không tracking, không remote assets).
- **Lưu trữ dữ liệu:** Hoạt động độc lập thông qua `localStorage` của trình duyệt. Có tính năng xuất/nhập file JSON, Excel hoặc HTML chứa dữ liệu.
- **Rủi ro bảo mật:** Khi nhúng vào website chính, cần cách ly iframe bằng sandbox:
  `sandbox="allow-scripts allow-forms allow-downloads"` (loại bỏ `allow-same-origin` để bảo vệ cookie phiên đăng nhập của người dùng AI Mở).

### 2. Bảng Phân Tích 15 Ứng Dụng

| # | Tên file | Tên công cụ | Mục đích & Giải pháp mang lại | Đối tượng sử dụng | Trạng thái & Hình thức |
|---|---|---|---|---|---|
| 1 | `lai-that-tung-don.html` | Tính lãi thật từng đơn | Tính chính xác lợi nhuận thực tế sau phí sàn, ship, hoàn, công nợ | Chủ shop online, seller TikTok/Shopee | Sẵn sàng online & Tải về |
| 2 | `gia-ban-khuyen-mai.html` | Định giá bán & Khuyến mãi | Tính giá tối thiểu, mức giảm tối đa, mô phỏng các đợt flash sale | Người kinh doanh, marketer | Sẵn sàng online & Tải về |
| 3 | `ngan-sach-gia-dinh.html` | Quản lý ngân sách gia đình | Sổ thu chi 12 tháng, chia hạn mức danh mục, theo dõi mục tiêu tiết kiệm | Cá nhân, gia đình, người quản lý chi tiêu | Sẵn sàng online & Tải về |
| 4 | `bao-gia-chi-tiet.html` | Tạo báo giá chuyên nghiệp | Soạn thảo, in ấn và xuất file Excel bảng báo giá sản phẩm/dịch vụ | Doanh nghiệp nhỏ, freelancer, kinh doanh B2B | Sẵn sàng online & Tải về |
| 5 | `bao-hanh-sua-chua.html` | Quản lý bảo hành & Sửa chữa | Tiếp nhận thiết bị, quản lý linh kiện, in phiếu hẹn và báo cáo bảo hành | Cửa hàng dịch vụ, kỹ thuật, sửa chữa | Sẵn sàng online & Tải về |
| 6 | `cham-soc-khach-sau-ban.html` | Chăm sóc khách hàng sau bán | Lên lịch hẹn chăm sóc, nhắc bảo dưỡng/mua lại, nhật ký tương tác | Chủ cửa hàng, CSKH, sales | Sẵn sàng online & Tải về |
| 7 | `chi-tieu-hoa-hong-sale.html` | Tính chỉ tiêu & Hoa hồng Sale | Thiết lập KPI doanh số và tính toán hoa hồng nhân viên theo bậc lũy tiến | Trưởng nhóm kinh doanh, chủ shop | Sẵn sàng online & Tải về |
| 8 | `cong-tac-vien-affiliate-hoa-hong.html` | Quản lý CTV & Affiliate | Theo dõi đơn hàng từ CTV, đối soát kỳ thanh toán và chi trả hoa hồng | Nhà bán hàng xây mạng lưới CTV | Sẵn sàng online & Tải về |
| 9 | `dai-ly-nha-phan-phoi-chiet-khau.html` | Quản lý đại lý & Chiết khấu | Quản lý công nợ, mức chiết khấu theo volume, hạn mức và thưởng quý | Nhà phân phối, xưởng sản xuất | Sẵn sàng online & Tải về |
| 10| `luyen-go-10-ngon.html` | Luyện gõ phím 10 ngón | 90 bài luyện theo nhóm phím, đo tốc độ WPM 60s, lưu tiến độ học tập | Học sinh, sinh viên, người làm việc văn phòng | Sẵn sàng online & Tải về |
| 11| `ghep-van-chinh-ta.html` | Ghép vần & Chính tả tiếng Việt | 195 bài tập ghép âm, vần, luyện từ đúng cho học sinh tiểu học 1–3 | Phụ huynh, giáo viên, học sinh tiểu học | Sẵn sàng online & Tải về |
| 12| `tu-vung-tieng-anh.html` | Luyện từ vựng tiếng Anh | Học từ vựng theo chủ đề, phát âm, trắc nghiệm phản xạ lớp 3–9 | Học sinh, người bắt đầu học tiếng Anh | Sẵn sàng online & Tải về |
| 13| `toan-bang-tieng-anh-3-5.html` | Toán tiếng Anh lớp 3–5 | 540 bài toán tư duy bằng tiếng Anh kèm giọng đọc phát âm chuẩn | Học sinh tiểu học song ngữ | Sẵn sàng online & Tải về |
| 14| `on-bai-10-phut.html` | Ôn bài 10 phút mỗi ngày | 1.002 câu hỏi ôn luyện kiến thức nhanh theo môn học mỗi ngày | Học sinh, phụ huynh đồng hành | Sẵn sàng online & Tải về |
| 15| `on-tap-hoc-ky-1-lop-4-petrus-ky.html` | Góc ôn tập đề cương lớp 4 | Bộ đề thi học kỳ 1 lớp 4 (dữ liệu đề cương riêng) | Bản thử nghiệm nội bộ | Gắn nhãn thử nghiệm (Chưa đưa vào danh mục chính) |

---

## III. NỘI DUNG THẬT VÀ NỘI DUNG PLACEHOLDER

1. **Nội dung THẬT (Verified & Ready):**
   - **Công cụ PromptKichBan:** Đã hoàn chỉnh 100%, tạo prompt chuyên sâu Google Veo 3 & xAI Grok, Zod validation, lưu trữ tài liệu.
   - **Khóa học thật:** *AI Thực Chiến: Từ số 0 đến trợ lý đầu tiên* (có modules, lessons, video YouTube ID thật, bài tập).
   - **Bài viết kiến thức thật:** 4 bài viết dài hoàn chỉnh trong CMS (`/guides/*`) với đầy đủ dẫn chứng, cấu trúc thực hành.
   - **14 App HTML thực tế:** Toàn bộ code logic, dữ liệu mẫu, giao diện xử lý offline đều đã qua nghiệm thu acceptance.

2. **Nội dung Placeholder / Cần nâng cấp:**
   - **Trang chủ (`src/app/page.tsx`):** Chưa phản ánh định vị **Học — Dùng — Tạo — Mua**, chưa làm nổi bật PromptKichBan và thư viện app miễn phí.
   - **Navigation (`src/components/site-shell.tsx`):** Menu hiện tại chỉ có: `Khóa học`, `Lộ trình`, `Công cụ`. Chưa có mục `App miễn phí`, `Học AI`, `Sản phẩm số`.
   - **Game web:** Chưa có game thực tế hoàn chỉnh -> Cần hiển thị minh bạch nhãn "Sắp ra mắt" hoặc ẩn khỏi navigation chính theo đúng chỉ đạo.

---

## IV. ĐỀ XUẤT KẾ HOẠCH TRIỂN KHAI THEO TỪNG GIAI ĐOẠN

### Phase 1 — Navigation & Trang Chủ Mới (Học — Dùng — Tạo — Mua)
1. **Navigation:** Cập nhật Header & Mobile Nav:
   - `Công cụ AI` ➔ Trỏ tới `/tools` và nổi bật `/promptkichban`
   - `App miễn phí` ➔ Trỏ tới `/apps` (Thư viện ứng dụng HTML thực dụng)
   - `Học AI` ➔ Trỏ tới `/guides` (Bài viết thực hành) & `/learning-paths/bat-dau-voi-ai`
   - `Sản phẩm số` ➔ Trỏ tới `/products` & `/courses`
   - `Game` ➔ Hiển thị nhãn "Sắp ra mắt" (Coming soon)
2. **Trang chủ (`src/app/page.tsx`):**
   - **Hero:** Định vị "Học AI bằng cách tạo ra thứ dùng được". CTA kép: `Trải nghiệm Prompt Studio` & `Khám phá lộ trình học`.
   - **Spotlight 1 (Dùng & Tạo):** Spotlight trực quan module `PromptKichBan Universal Video Prompt Studio`.
   - **Spotlight 2 (App Miễn Phí):** Trưng bày các app tính lãi đơn hàng, định giá khuyến mãi, luyện gõ 10 ngón.
   - **Spotlight 3 (Học AI):** Các bài hướng dẫn thực chiến mới nhất từ CMS.
   - **Spotlight 4 (Sản Phẩm Số & Khóa Học):** Khóa học AI thực chiến và bộ template trả phí.

### Phase 2 — Tối ưu Landing / Intro cho PromptKichBan
- Hoàn thiện trang giới thiệu công cụ, đối tượng phù hợp (shop owner, affiliate, creator, marketer), hướng dẫn sử dụng và CTA bắt đầu nhanh.

### Phase 3 — Tích hợp Thư viện 14+1 App HTML vào Web
- Tạo route `/apps` và `/apps/[slug]` với metadata SEO chuẩn, hướng dẫn sử dụng chi tiết, preview ảnh/giao diện và 2 tùy chọn: "Dùng trực tiếp trên web" (qua sandbox an toàn) hoặc "Tải về dùng offline".

### Phase 4 & Phase 5 — Kiến thức AI & Game
- Cập nhật bài viết hướng dẫn tạo video AI, cách dùng app HTML với AI, game giải trí gắn nhãn sắp ra mắt.

---

## V. KẾ HOẠCH KIỂM THỬ VÀ ROLLBACK

- **Kiểm thử bắt buộc:**
  1. `npm run typecheck` (0 errors)
  2. `npm run test:promptkichban` (37/37 passed)
  3. `npm run test` (39/39 passed)
  4. `npm run build` (Turbopack compile toàn bộ routes thành công)
  5. Playwright smoke test trên giao diện Desktop & Mobile.
- **Rollback:**
  - Giữ nguyên `data/cms.json` và cấu trúc database.
  - Các component được nâng cấp theo hướng mở rộng tương thích ngược, dễ dàng revert qua git / backup nếu cần.
