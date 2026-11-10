# Hướng Dẫn Deploy AI MỞ Lên Production

**Thời gian ước tính:** 30-60 phút  
**Yêu cầu:** GitHub account (hoặc GitLab), credit card (cho Vercel/Railway)

---

## 🎯 Lộ Trình Deploy

```
1. Chuẩn bị môi trường (10 phút)
   ↓
2. Setup services bên ngoài (15 phút)
   ↓
3. Deploy code lên hosting (10 phút)
   ↓
4. Khởi tạo database (5 phút)
   ↓
5. Smoke test (10 phút)
```

---

## Bước 1: Chuẩn Bị Môi Trường

### 1.1. Generate AUTH_SECRET

```bash
# Chạy trong terminal
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

**Lưu lại output** — chuỗi 43 ký tự ngẫu nhiên (ví dụ: `X3k9mN2pQ7rS8tU4vW5xY6zA1bC2dE3fG4hI5jK6lM`)

### 1.2. Tạo tài khoản Upstash Redis (miễn phí)

1. Vào https://upstash.com → Sign up (dùng GitHub login cho nhanh)
2. Tạo database mới:
   - Tên: `aimo-rate-limit`
   - Region: chọn gần Vietnam nhất (Singapore/Tokyo)
   - Type: **Regional** (miễn phí)
3. Sau khi tạo, vào tab **REST API** và copy:
   - `UPSTASH_REDIS_REST_URL` (dạng `https://xxx.upstash.io`)
   - `UPSTASH_REDIS_REST_TOKEN` (dạng `AXx...`)

### 1.3. Verify Supabase Database

Anh đã có Supabase database rồi. Kiểm tra lại:

```bash
cd "G:\VIBE CODE THẦY DUYỆT\Web AI Mở - Jacky\ai-mo-web-workplace"
npm run studio:verify
```

Phải thấy `✅ Schema in sync`.

### 1.4. Push Code Lên GitHub (nếu chưa có)

```bash
# Khởi tạo git repo
git init
git add .
git commit -m "Initial commit - AI MỞ v1.0.0"

# Tạo repo trên GitHub, sau đó:
git remote add origin https://github.com/[your-username]/ai-mo-web.git
git branch -M main
git push -u origin main
```

**⚠️ LƯU Ý:** `.gitignore` đã được fix để không commit `.env.local`.

---

## Bước 2: Deploy Lên Vercel (Khuyến Nghị)

### 2.1. Tạo tài khoản Vercel

1. Vào https://vercel.com → Sign Up with GitHub
2. Import project: chọn repo `ai-mo-web` vừa push
3. **Framework Preset:** Next.js (auto-detect)
4. **Root Directory:** `.` (giữ nguyên)

### 2.2. Configure Environment Variables

Trong Vercel dashboard → Settings → Environment Variables, thêm:

| Key | Value | Environment |
|-----|-------|-------------|
| `NODE_ENV` | `production` | Production |
| `AUTH_SECRET` | `[chuỗi 43 ký tự từ bước 1.1]` | Production |
| `DATABASE_URL` | `[copy từ .env.local]` | Production |
| `DIRECT_URL` | `[copy từ .env.local]` | Production |
| `STUDIO_STORAGE` | `postgres` | Production |
| `UPSTASH_REDIS_REST_URL` | `[từ bước 1.2]` | Production |
| `UPSTASH_REDIS_REST_TOKEN` | `[từ bước 1.2]` | Production |

**Tùy chọn (nếu muốn AI thật):**

| Key | Value | Ghi chú |
|-----|-------|---------|
| `OPENAI_API_KEY` | `sk-...` | Cho AI script generator |
| `RESEND_API_KEY` | `re_...` | Cho forgot password email |

### 2.3. Deploy

1. Click **Deploy** trong Vercel dashboard
2. Đợi ~2-3 phút (build + deploy)
3. Khi xong sẽ có URL: `https://ai-mo-web.vercel.app`

---

## Bước 3: Khởi Tạo Database Production

### 3.1. Chạy Prisma Generate

Vercel tự động chạy trong build, nhưng nếu deploy thủ công:

```bash
npx prisma generate
```

### 3.2. Seed Demo Users

```bash
# Local machine, trỏ đến production DB
export DATABASE_URL="[production DATABASE_URL]"
npm run db:seed
```

**Output mong đợi:**
```
🌱 Seeding database...
✅ Upserted user: admin-demo@aimo.vn (admin)
✅ Upserted user: learner-demo@aimo.vn (learner)
✅ Seeding complete
```

### 3.3. Verify Database

```bash
npm run studio:verify
```

Phải thấy:
- `✅ Schema in sync — User has exactly the 13 declared columns`
- `✅ Found 2 users in database`

---

## Bước 4: Smoke Test Production

### 4.1. Test Homepage

1. Vào `https://ai-mo-web.vercel.app` (thay domain thật)
2. Phải thấy:
   - ✅ Homepage load, không có lỗi 500
   - ✅ LED effects (gradient header, hero text có màu xanh)
   - ✅ Stats hiển thị: "2.400+ HỌC VIÊN"
   - ✅ Khóa học list hiển thị

### 4.2. Test Login

1. Vào `https://ai-mo-web.vercel.app/login`
2. Login với:
   - **Email:** `admin-demo@aimo.vn`
   - **Password:** (bất kỳ, demo account không check password)
3. Sau login phải redirect về homepage, thấy:
   - Header có nút "Đăng xuất"
   - Có link "/app" (Studio dashboard)

### 4.3. Test Studio

1. Vào `https://ai-mo-web.vercel.app/app`
2. Phải vào được dashboard (không bị kick về login)
3. Test tạo product:
   - Click "Tạo sản phẩm mới"
   - Nhập tên, mô tả
   - Click "Lưu"
   - Phải thấy product trong danh sách

### 4.4. Test Rate Limiting

```bash
# Test từ terminal (Windows PowerShell)
for ($i=1; $i -le 7; $i++) {
  curl -X POST https://ai-mo-web.vercel.app/api/auth/login `
    -H "Content-Type: application/json" `
    -H "Origin: https://ai-mo-web.vercel.app" `
    -d '{\"email\":\"fake@test.com\",\"password\":\"wrong\"}'
  echo "Request $i"
}
```

**Kết quả mong đợi:**
- Request 1-5: trả về 401 (wrong password)
- Request 6-7: trả về 429 (rate limited)

### 4.5. Test Health Endpoint

```bash
# Phải login trước với admin account, lấy cookie
curl https://ai-mo-web.vercel.app/api/studio/admin/health \
  -H "Cookie: session=[copy từ browser DevTools]"
```

**Response mong đợi:**
```json
{
  "storage": "postgres",
  "timestamp": "2026-10-09T12:15:30.123Z",
  "ok": true,
  "dbConnectable": true,
  "userCount": 2,
  "migrations": "applied"
}
```

---

## Bước 5: Custom Domain (Tùy Chọn)

### 5.1. Mua Domain

- Namecheap, GoDaddy, hoặc dùng domain Việt Nam (.vn)
- Ví dụ: `aimo.vn`

### 5.2. Configure DNS

Trong Vercel dashboard → Settings → Domains:

1. Add domain: `aimo.vn`
2. Vercel sẽ yêu cầu thêm DNS records:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
3. Vào domain registrar (Namecheap/GoDaddy), thêm records trên
4. Đợi 5-60 phút để DNS propagate
5. Vercel tự động issue SSL certificate (Let's Encrypt)

### 5.3. Force HTTPS

Vercel dashboard → Settings → Domains → aimo.vn:
- ✅ Enable **Redirect www to apex** (hoặc ngược lại)
- ✅ Enable **Force HTTPS**

---

## Bước 6: Monitoring & Logs

### 6.1. Vercel Logs

Dashboard → Deployments → [latest] → **Runtime Logs**

Xem real-time logs của server:
- API requests
- Errors
- Database queries (nếu có)

### 6.2. Setup Sentry (Khuyến Nghị)

```bash
# Cài Sentry
npm install --save @sentry/nextjs

# Init Sentry
npx @sentry/wizard@latest -i nextjs
```

Sentry tự động catch errors và gửi alerts.

### 6.3. Uptime Monitoring

Dùng service miễn phí:
- **UptimeRobot** (https://uptimerobot.com)
- **BetterUptime** (https://betteruptime.com)

Ping `https://aimo.vn/api/studio/admin/health` mỗi 5 phút.

---

## 🚨 Troubleshooting

### Lỗi: "DATABASE_URL not found"

**Nguyên nhân:** Environment variables chưa set trong Vercel.

**Fix:**
1. Vào Vercel dashboard → Settings → Environment Variables
2. Add `DATABASE_URL`, `DIRECT_URL`
3. Redeploy: Deployments → [latest] → **Redeploy**

### Lỗi: Build failed "Module not found"

**Nguyên nhân:** Package chưa install hoặc sai import path.

**Fix:**
```bash
# Local
npm install
npm run build

# Nếu local build OK mà Vercel fail, check Node version
# Vercel phải dùng Node >= 20
```

### Lỗi: 500 Internal Server Error

**Nguyên nhân:** Runtime error, thường là database connection.

**Fix:**
1. Check Vercel logs: Dashboard → Runtime Logs
2. Verify `DATABASE_URL` format:
   ```
   postgresql://user:pass@host:6543/database?pgbouncer=true
   ```
3. Test connection từ local:
   ```bash
   npx prisma db execute --stdin <<< "SELECT 1"
   ```

### Lỗi: Rate limit không hoạt động

**Nguyên nhân:** Upstash Redis chưa configure.

**Fix:**
1. Check `UPSTASH_REDIS_REST_URL` và `UPSTASH_REDIS_REST_TOKEN` trong Vercel env
2. Test connection:
   ```bash
   curl $UPSTASH_REDIS_REST_URL/get/test \
     -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
   ```
3. Nếu production mà thiếu Upstash, app sẽ throw error (fail-closed)

### Lỗi: LED effects không hiển thị

**Nguyên nhân:** CSS không load hoặc browser cũ.

**Fix:**
1. Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
2. Check browser DevTools → Console cho errors
3. Verify `globals.css` và `refinement.css` được import trong `layout.tsx`

---

## 📊 Post-Launch Checklist

### Ngay sau deploy
- [ ] Homepage load thành công
- [ ] Login/logout hoạt động
- [ ] Studio dashboard accessible
- [ ] Tạo test product thành công
- [ ] Rate limit blocks request thứ 6
- [ ] Health endpoint returns `{"ok":true}`

### Trong 24 giờ đầu
- [ ] Monitor Vercel logs cho errors
- [ ] Test trên mobile devices
- [ ] Test các browser: Chrome, Firefox, Safari, Edge
- [ ] Kiểm tra performance: Lighthouse score
- [ ] Setup Sentry error tracking

### Trong tuần đầu
- [ ] Invite 5-10 beta users
- [ ] Collect feedback
- [ ] Monitor database usage (Supabase dashboard)
- [ ] Monitor Redis usage (Upstash dashboard)
- [ ] Check Vercel bandwidth usage

---

## 🎉 Hoàn Thành!

Website **AI MỞ** đã deploy production tại: `https://[your-domain].vercel.app`

**Demo accounts:**
- Admin: `admin-demo@aimo.vn` / (any password)
- Learner: `learner-demo@aimo.vn` / (any password)

**Next steps:**
1. Thay demo accounts bằng real authentication
2. Integrate real AI provider (OpenAI/Claude)
3. Add payment gateway (Stripe/PayPal)
4. Marketing campaign & user acquisition

**Support:**
- Vercel docs: https://vercel.com/docs
- Supabase docs: https://supabase.com/docs
- Upstash docs: https://docs.upstash.com

---

**Prepared by:** Claude Opus 5  
**Last updated:** 2026-10-09
