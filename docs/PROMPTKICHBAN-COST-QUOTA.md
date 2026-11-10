# PromptKichBan — API Cost, Quota & Budget Guide (Phase 5A)

Tài liệu chi tiết về hạn mức sử dụng (quota), giới hạn kỹ thuật (rate limit, timeout, tokens), ước tính chi phí và khuyến nghị ngân sách cho module `/promptkichban` trên môi trường Staging & Production.

---

## 1. Bảng tổng hợp Hạn mức & Quota

| Đối tượng / Tham số | Giá trị | Quy tắc áp dụng | Mục đích bảo vệ |
|---|---|---|---|
| **Guest Rate Limit** | **3 lượt / 24 giờ / IP** | Window 24h trượt theo IP (`x-forwarded-for` / `x-real-ip`). Lượt thứ 4 trả HTTP 429 + `Retry-After`. | Chống cào dữ liệu, chống lạm dụng AI token miễn phí. |
| **Authenticated Quota** | **100 kịch bản / tài khoản** | Lưu trữ trên PostgreSQL (`PromptKichBanDocument`). Khi đạt 100 bản ghi, API trả HTTP 429 yêu cầu xóa bớt. | Chống phình database, tối ưu dung lượng snapshot JSONB. |
| **Request Max Input** | **12.000 ký tự** (mặc định) | Giới hạn độ dài trường `inputText`. Zod schema reject các chuỗi vượt quá 12.000 ký tự với HTTP 400. | Ngăn chặn Prompt Injection và overflow context window. |
| **Max Output Tokens** | **3.000 tokens** | LLM completion token cap (`max_tokens: 3000`). | Đảm bảo phản hồi nhanh, tránh kịch bản quá dài không cần thiết. |
| **Scene Count** | **3 đến 5 cảnh** | Prompt engineering chỉ đạo model tạo 3-5 scenes súc tích (1-2 câu/scene). | Phù hợp định dạng video ngắn (TikTok, Reels, Shorts) 15-60s. |
| **Request Timeout** | **30.000 ms (30s)** | Hạn mức thời gian chờ phản hồi AI (`AbortController`). Khoảng cho phép cấu hình: 1.000 - 120.000 ms. | Tránh giữ connection treo trên server khi provider trễ. |
| **Max Retries** | **2 lần** | Thử lại tối đa 2 lần với exponential backoff (1s, 2s) khi gặp lỗi mạng/upstream 5xx/429. | Tăng tỷ lệ thành công khi mạng chập chờn. |
| **Document Snapshot Cap** | **250 KB / tài liệu** | Kiểm tra kích thước JSON stringify của `inputSnapshot` + `outputSnapshot`. | Tránh payload quá lớn gây nghẽn memory/network. |
| **Title Length** | **150 ký tự** | Cắt gọn tiêu đề tối đa 150 ký tự. | Giao diện hiển thị gọn gàng, tránh tràn text. |

---

## 2. Ước tính Tiêu hao Token & Chi phí

### A. Token Metrics thực tế đo lường (Benchmark Phase 3E & 5A)

| Thành phần | Khoảng token | Ghi chú |
|---|---|---|
| **Input Prompt Tokens** | ~350 – 850 tokens | Tối ưu nhờ system prompt tinh gọn & không yêu cầu model sinh prompt cho từng engine. |
| **Completion Output Tokens** | ~1.500 – 2.400 tokens | JSON storyboard (3-5 cảnh, visual descriptions, voiceover tiếng Việt, metadata). |
| **Tổng Token mỗi Request** | **~2.000 – 3.200 tokens** | Trung bình thực tế quan sát được: **~2.500 tokens / lượt tạo**. |

### B. Chi phí mỗi Request với VietAPI (`deepseek-v4-flash`)

- **Đơn giá tham chiếu VietAPI / DeepSeek**:
  - Input: ~0.50 VNĐ / 1.000 tokens (~$0.00002 / 1k tokens)
  - Output: ~5.00 VNĐ / 1.000 tokens (~$0.0002 / 1k tokens)
- **Chi phí trung bình mỗi kịch bản**:
  - Input (600 tokens): ~0.3 VNĐ
  - Output (2.000 tokens): ~10.0 VNĐ
  - **Tổng chi phí: ~10 – 12 VNĐ / kịch bản video (~$0.00045 USD)**.
- **Quy mô 10.000 kịch bản**: ~100.000 – 120.000 VNĐ (~$4.5 USD).

---

## 3. Khuyến nghị Cảnh báo Ngân sách (Daily Budget Alerts)

Để tránh cạn kiệt tài khoản API đột ngột hoặc chi phí phát sinh bất thường:

1. **Ngưỡng cảnh báo mềm (Soft Alert)**:
   - **Mức thiết lập**: **200.000 VNĐ / ngày** (tương đương ~18.000 lượt tạo/ngày).
   - **Hành động**: Gửi email cảnh báo tới đội ngũ kỹ thuật (`admin@aimo.vn`).
2. **Ngưỡng chặn cứng (Hard Cap / Safety Break)**:
   - **Mức thiết lập**: **500.000 VNĐ / ngày** (tương đương ~45.000 lượt tạo/ngày).
   - **Hành động**: Tự động chuyển `PROMPTKICHBAN_AI_PROVIDER` sang trạng thái trả lời quá tải an toàn hoặc tạm thời chuyển về chế độ Mock có thông báo cho người dùng.
3. **VietAPI Wallet Balance Alert**:
   - Duy trì số dư tối thiểu trong tài khoản VietAPI: **200.000 VNĐ**.
   - Cảnh báo nạp tiền khi số dư < **50.000 VNĐ**.

---

## 4. Nguyên tắc Bảo mật Nhật ký (Zero Leak Invariant)

Mọi log ghi nhận đo lường (Observability) và phân tích thống kê phải tuân thủ nghiêm ngặt:

> [!IMPORTANT]
> **Tuyệt đối KHÔNG ghi vào file log hoặc telemetry:**
> 1. Toàn bộ nội dung prompt của người dùng (`inputText`).
> 2. Toàn bộ nội dung kịch bản AI sinh ra (`voiceoverFull`, `storyboard`).
> 3. API Key, Auth Secret, Database URL hoặc Session Tokens.
> 4. Thông tin cá nhân, email hoặc địa chỉ IP không được mã hóa băm (hash).

Module chỉ ghi nhận các trường an toàn: `requestId`, `status`, `statusCode`, `latencyMs`, `provider`, `model`, `sceneCount`, `tokenUsage`, `errorCode`.
