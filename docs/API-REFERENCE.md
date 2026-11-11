# AI Mở — API Reference Documentation

Tài liệu chi tiết về các API endpoints của hệ thống **AI Mở** (`ai-mo-web-workplace`).

---

## 1. Authentication & Session

### `GET /api/auth/session`
Lấy thông tin phiên đăng nhập hiện tại của người dùng.
- **Headers:** Cookie session
- **Response 200:**
  ```json
  {
    "user": {
      "id": "usr_...",
      "email": "user@example.com",
      "name": "Nguyen Van A",
      "role": "user"
    }
  }
  ```
- **Response 401:** `{ "user": null }`

### `POST /api/auth/login`
Đăng nhập tài khoản bằng email và mật khẩu.
- **Body:** `{ "email": "string", "password": "string" }`
- **Response 200:** Thiết lập `Set-Cookie` session token và trả về profile người dùng.

### `POST /api/auth/logout`
Đăng xuất và hủy phiên đăng nhập.

### `POST /api/auth/forgot-password`
Gửi email đặt lại mật khẩu với link an toàn (hiệu lực 1 giờ).
- **Body:** `{ "email": "string" }`
- **Response 200:** `{ "success": true, "message": "Link đặt lại mật khẩu đã được gửi đến email." }`

### `POST /api/auth/reset-password`
Xác nhận token và cập nhật mật khẩu mới.
- **Body:** `{ "token": "string", "password": "string" }`

---

## 2. AI Studio & PromptKichBan

### `POST /api/promptkichban/generate`
Sinh kịch bản video, storyboard và prompt video từ mô tả sản phẩm.
- **Rate Limit:** 30 requests/day/user (policy: `aiGenerate`)
- **Body:**
  ```json
  {
    "description": "Video giới thiệu tai nghe không dây AI MỞ Pro...",
    "duration": "30s",
    "style": "Cinematic sản phẩm",
    "aspectRatio": "16:9"
  }
  ```
- **Response 200:**
  ```json
  {
    "script": "...",
    "storyboard": [
      { "scene": 1, "duration": "8s", "visual": "...", "audio": "..." }
    ],
    "videoPrompt": "Cinematic product video..."
  }
  ```

### `POST /api/promptkichban/regenerate-scene`
Sinh lại một phân cảnh cụ thể trong storyboard.
- **Rate Limit:** 15 requests/hour/IP (policy: `promptkichbanRegenerate`)
- **Body:** `{ "documentId": "string", "sceneIndex": 1, "feedback": "Thêm hiệu ứng ánh sáng neon" }`

### `POST /api/studio/scripts`
Tạo và lưu kịch bản video marketing trong AI Studio.
- **Rate Limit:** `aiGenerate` (30/ngày) + `studioMutation` (20/giờ)
- **Body:** `{ "title": "string", "productId": "string", "content": "..." }`

### `POST /api/studio/products/[id]/analyze`
Phân tích sản phẩm bằng AI để trích xuất USP, insight khách hàng và góc tiếp cận video.
- **Rate Limit:** 30 requests/day/user (`aiGenerate`)

---

## 3. Media & File Upload

### `POST /api/upload`
Upload tệp an toàn (avatar, tài liệu khóa học, ảnh sản phẩm) với kiểm tra magic number.
- **Auth:** Bắt buộc đăng nhập
- **Rate Limit:** 20 requests/hour/user (`studioMutation`)
- **Content-Type:** `multipart/form-data`
- **Form Fields:**
  - `file`: File upload (tối đa 10MB cho ảnh/tài liệu, 50MB cho video)
  - `category`: `"avatar"` | `"course"` | `"product"` | `"all"`
- **Response 200:**
  ```json
  {
    "url": "/uploads/products/prod_1794220000000_a1b2c3d4.jpg",
    "filename": "headphones.jpg",
    "mimeType": "image/jpeg",
    "size": 15897
  }
  ```

---

## 4. Checkout & Orders

### `POST /api/checkout`
Khởi tạo đơn hàng thanh toán cho khóa học hoặc sản phẩm số.
- **Body:**
  ```json
  {
    "items": [{ "id": "course-prompt-video", "price": 490000, "quantity": 1 }],
    "customer": { "name": "...", "email": "...", "phone": "..." },
    "paymentMethod": "vietqr"
  }
  ```
- **Response 200:**
  ```json
  {
    "orderId": "ORD-202611-...",
    "checkoutUrl": "/checkout/ORD-202611-...",
    "qrCode": "https://img.vietqr.io/..."
  }
  ```

### `GET /api/orders/[id]`
Lấy trạng thái đơn hàng và link tải sản phẩm/truy cập khóa học.

---

## 5. Security & Rate Limiting Overview

| Policy Name | Giới hạn | Áp dụng cho | Mục đích |
|-------------|----------|-------------|----------|
| `aiGenerate` | 30 req / ngày | AI endpoints | Kiểm soát chi phí LLM API |
| `studioMutation` | 20 req / giờ | Upload, Script, Product POST | Chống spam & DoS lưu trữ |
| `promptkichbanRegenerate` | 15 req / giờ | Regenerate scene | Bảo vệ tài nguyên tính toán |
| `login` | 5 req / 15 phút | Auth login | Chống tấn công Brute-force |
