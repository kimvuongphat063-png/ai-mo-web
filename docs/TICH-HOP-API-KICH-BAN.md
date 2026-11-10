# Phân Tích Tích Hợp API Kịch Bản Desktop vào Web AI Mở

**Ngày phân tích:** 2026-10-09  
**Câu hỏi:** App desktop làm kịch bản có thể chuyển lên web này được không? Có thể kết nối API có sẵn không?

---

## 🎯 Kết Luận Nhanh

✅ **HOÀN TOÀN KHẢ THI** — Web AI Mở đã có đầy đủ hệ thống Studio để tạo kịch bản video, và được thiết kế sẵn để:

1. **Kết nối API ngoài** — Hệ thống AI provider pluggable, chỉ cần thêm adapter
2. **Thay thế hoặc bổ sung** logic kịch bản hiện tại
3. **Giữ nguyên UI/UX** — Chỉ đổi backend generation engine

---

## 📊 Hệ Thống Hiện Tại — Studio Script Generator

### Kiến trúc có sẵn:

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (/app/scripts/new)                                 │
│ → Form: Product, Platform, Duration, Format, Tone, CTA      │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ API ROUTE (/api/studio/scripts POST)                        │
│ → Authorize user                                            │
│ → Validate form với Zod schema                              │
│ → Load product profile + brand context                      │
│ → Check AI quota (30/day default)                           │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ AI GENERATION LAYER (lib/ai/index.ts)                       │
│ → analyzeProduct() — phân tích sản phẩm                     │
│ → generateScripts() — tạo 3 variants kịch bản               │
│                                                              │
│ Providers:                                                  │
│ ┌─────────────┐  ┌────────────┐  ┌──────────┐             │
│ │ MOCK (hiện) │  │ OpenAI     │  │ Anthropic│ (Gemini)    │
│ └─────────────┘  └────────────┘  └──────────┘             │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ DATABASE (Postgres via Prisma)                              │
│ → Script { productId, platform, duration, scripts: JSON }   │
│ → Usage tracking (quota enforcement)                        │
└─────────────────────────────────────────────────────────────┘
```

### Flow tạo kịch bản hiện tại:

1. User nhập thông tin sản phẩm (`/app/products/new`)
2. Phân tích sản phẩm → lưu `analysisCache` (selling angles, pain points, CTAs)
3. Chọn angle + platform + format → gọi `generateScripts()`
4. AI trả về 3 variants:
   - Variant A (angle chính)
   - Variant B (angle phụ 1)  
   - Variant C (angle phụ 2)
5. Mỗi variant có:
   - Title, hook, shots (timeline từng giây)
   - Visual direction, spoken text, on-screen text
   - B-roll suggestions, camera actions
   - Caption, hashtags, disclosure notes
6. Lưu vào database → hiển thị UI để review/export

---

## 🔌 Cách Tích Hợp API Desktop của Anh

### Option 1: Custom Provider (Khuyến nghị)

Tạo provider mới `desktop` trong hệ thống AI, call API desktop của anh:

**File:** `src/lib/ai/provider-desktop.ts` (NEW)

```typescript
import "server-only";
import { AiError } from "@/lib/ai/errors";
import type { ChatRequest } from "@/lib/ai/provider";

const DESKTOP_API_URL = process.env.DESKTOP_API_URL;
const DESKTOP_API_KEY = process.env.DESKTOP_API_KEY;

/**
 * Adapter cho API desktop script generator.
 * Call endpoint của anh, transform response về format web AI Mở.
 */
export async function callDesktopApi(req: ChatRequest): Promise<string> {
  if (!DESKTOP_API_URL || !DESKTOP_API_KEY) {
    throw new AiError("config", { 
      details: "Thiếu DESKTOP_API_URL hoặc DESKTOP_API_KEY" 
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(`${DESKTOP_API_URL}/api/generate-script`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DESKTOP_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Transform web format → desktop format
        product: {
          name: req.user, // hoặc parse từ req.user JSON
          description: "...",
          // ... map các fields
        },
        platform: "tiktok",
        duration: 30,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new AiError("upstream", { 
        details: `Desktop API error: ${res.status}` 
      });
    }

    const data = await res.json();
    
    // Transform desktop response → web ScriptGeneration format
    return JSON.stringify({
      scripts: data.variants.map((v: any) => ({
        title: v.title,
        angle: v.angle,
        hook: v.hook,
        durationSeconds: v.duration,
        shots: v.timeline,
        caption: v.caption,
        hashtags: v.hashtags,
        // ... map đầy đủ các fields
      })),
      missingInformation: data.warnings || [],
      complianceNotes: data.compliance || [],
    });
  } finally {
    clearTimeout(timer);
  }
}
```

**Đăng ký provider:**

`src/lib/ai/env.ts`:
```typescript
export const AI_PROVIDERS = [
  "mock", "openai", "anthropic", "gemini", 
  "desktop" // <-- THÊM
] as const;

const KEY_BY_PROVIDER = {
  // ...
  desktop: "DESKTOP_API_KEY", // <-- THÊM
};
```

`src/lib/ai/provider.ts`:
```typescript
async function callProvider(req: ChatRequest): Promise<string> {
  const env = aiEnv();
  
  switch (env.AI_PROVIDER) {
    case "desktop": {
      // Import dynamic để không block build khi chưa cài
      const { callDesktopApi } = await import("./provider-desktop");
      return await callDesktopApi(req);
    }
    case "openai": // ... existing
    // ...
  }
}
```

**Environment variables:**

`.env.local`:
```bash
AI_PROVIDER=desktop
DESKTOP_API_URL=https://api.your-desktop-app.com
DESKTOP_API_KEY=your-secret-key-here
AI_DAILY_LIMIT=30
```

✅ **Ưu điểm:**
- Không sửa code hiện tại, chỉ thêm provider mới
- Dễ switch giữa desktop/mock/OpenAI bằng env var
- Giữ nguyên validation, quota, database layer
- Desktop API được treat như 1 AI provider bình thường

---

### Option 2: Direct API Route

Tạo route riêng call trực tiếp API desktop, bypass AI layer:

**File:** `src/app/api/studio/scripts/desktop/route.ts` (NEW)

```typescript
export async function POST(req: NextRequest) {
  const auth = await authorizeMutation(req);
  if (auth.error) return auth.error;

  const validated = scriptWizardFormSchema.parse(await req.json());
  const product = await getProduct(auth.session.userId, validated.productProfileId);
  
  // Call desktop API trực tiếp
  const desktopRes = await fetch(process.env.DESKTOP_API_URL + "/api/generate", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.DESKTOP_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product: {
        name: product.name,
        description: product.description,
        // ...
      },
      platform: validated.platform,
      duration: validated.durationSeconds,
    }),
  });

  const desktopData = await desktopRes.json();
  
  // Transform và lưu vào DB
  const script = await createScript(auth.session.userId, {
    productProfileId: product.id,
    platform: validated.platform,
    goal: validated.goal,
    durationSeconds: validated.durationSeconds,
    scripts: transformDesktopScripts(desktopData),
  });

  return NextResponse.json({ script }, { status: 201 });
}
```

Frontend gọi `/api/studio/scripts/desktop` thay vì `/api/studio/scripts`.

⚠️ **Nhược điểm:**
- Duplicate logic (validation, quota, error handling)
- Cần maintain 2 routes: standard AI + desktop
- Không tận dụng retry logic, error mapping của AI layer

---

### Option 3: Hybrid — Desktop làm generation, Web làm UI/persistence

Desktop app chỉ expose REST API generation, web làm:
- UI/UX (form wizard)
- Authentication & authorization
- Database persistence
- Quota management
- Campaign planning
- Performance tracking

**Flow:**

```
┌──────────────┐
│ Web UI       │ → User nhập product info
└──────┬───────┘
       ↓
┌──────────────┐
│ Web Backend  │ → Validate, check quota, load brand context
└──────┬───────┘
       ↓
┌──────────────┐
│ Desktop API  │ → Generate script (core algorithm của anh)
└──────┬───────┘
       ↓
┌──────────────┐
│ Web Backend  │ → Save to DB, track usage, return to UI
└──────┬───────┘
       ↓
┌──────────────┐
│ Web UI       │ → Display, export, campaign planning
└──────────────┘
```

✅ **Ưu điểm:**
- Tận dụng 100% logic desktop đã có (không port lại)
- Web làm phần UI/persistence tốt hơn desktop
- Desktop có thể chạy standalone hoặc làm microservice
- Scalable: web scale theo traffic, desktop scale theo generation load

---

## 🔧 API Desktop Cần Expose Gì?

Để tích hợp mượt mà, desktop API cần endpoints:

### 1. **Generate Script** (core)

```
POST /api/generate-script
Authorization: Bearer {API_KEY}
Content-Type: application/json

Request:
{
  "product": {
    "name": "Khóa học AI Thực Chiến",
    "description": "21 ngày học AI từ số 0",
    "priceOffer": "1.290.000đ (giảm 40%)",
    "features": ["21 bài học", "3 dự án thực tế", "Hỗ trợ 1-1"],
    "targetCustomer": "Người mới bắt đầu, 25-40 tuổi",
    "problemSolved": "Không biết bắt đầu học AI từ đâu",
    "allowedProof": "2.400+ học viên",
    "claimsToAvoid": "Không dùng: ma thuật, thần kỳ, bí kíp"
  },
  "platform": "tiktok",
  "goal": "conversion",
  "durationSeconds": 30,
  "format": "talking-head",
  "presenter": "founder",
  "tone": "professional",
  "cta": "Đăng ký ngay để nhận ưu đãi",
  "brandContext": {
    "brandName": "AI MỞ",
    "targetAudience": "Doanh nghiệp SME và creator",
    "voiceTone": "Chuyên nghiệp, gần gũi",
    "requiredDisclosure": null,
    "claimsToAvoid": ["tự động 100%", "không cần học"]
  }
}

Response (200 OK):
{
  "scripts": [
    {
      "title": "Kịch bản A — Tiết kiệm thời gian",
      "angle": "time-saving",
      "hook": "Bạn đang mất bao nhiêu giờ để viết kịch bản video?",
      "durationSeconds": 30,
      "shots": [
        {
          "startSecond": 0,
          "endSecond": 10,
          "purpose": "Hook — thu hút chú ý",
          "spokenText": "Bạn đang mất bao nhiêu giờ để viết kịch bản?",
          "visualDirection": "Medium close-up presenter",
          "onScreenText": "Mất bao nhiêu giờ viết kịch bản?",
          "bRoll": "B-roll: đồng hồ, notepad với chữ viết tay",
          "cameraAction": "Static shot, eye level"
        },
        {
          "startSecond": 10,
          "endSecond": 20,
          "purpose": "Solution",
          "spokenText": "AI MỞ giúp bạn có kịch bản hoàn chỉnh trong 5 phút",
          "visualDirection": "Screencast: tạo kịch bản trong app",
          "onScreenText": "Kịch bản hoàn chỉnh trong 5 phút",
          "bRoll": "Demo app tạo script"
        },
        {
          "startSecond": 20,
          "endSecond": 30,
          "purpose": "CTA",
          "spokenText": "Đăng ký ngay để nhận ưu đãi 40%",
          "visualDirection": "Presenter + text overlay CTA",
          "onScreenText": "ĐĂNG KÝ NGAY • 40% OFF",
          "bRoll": null
        }
      ],
      "alternativeHooks": [
        "Video của bạn xứng đáng có cấu trúc tốt hơn",
        "Một sản phẩm, mười góc video khác nhau"
      ],
      "audioSuggestion": "Nhạc nền upbeat, BPM 110-120",
      "cta": "Đăng ký ngay để nhận ưu đãi",
      "caption": "Bạn đang mất bao nhiêu giờ để viết kịch bản?\n\nAI MỞ giúp bạn...",
      "hashtags": ["#aimo", "#videobanhang", "#tiktok", "#contentcreator"],
      "disclosureNote": null,
      "warnings": []
    },
    {
      "title": "Kịch bản B — Chất lượng sản xuất",
      // ... variant 2
    },
    {
      "title": "Kịch bản C — Mở rộng nội dung",
      // ... variant 3
    }
  ],
  "missingInformation": [
    "Chưa có case study cụ thể để làm testimonial"
  ],
  "complianceNotes": [
    "Không sử dụng claim tuyệt đối chưa được kiểm chứng",
    "Ghi rõ disclosure nếu có affiliate link"
  ]
}
```

### 2. **Analyze Product** (optional — nếu desktop có logic này)

```
POST /api/analyze-product
Authorization: Bearer {API_KEY}

Request: (giống product object ở trên)

Response:
{
  "summary": "Khóa học AI Thực Chiến — 21 ngày từ số 0",
  "customerPains": ["Không biết bắt đầu", "Thiếu thời gian", "..."],
  "customerDesires": ["Làm chủ AI", "Tạo workflow tự động"],
  "keyBenefits": ["21 bài học", "3 dự án thực tế"],
  "proofPoints": ["2.400+ học viên"],
  "objections": ["Lo ngại về giá", "Không có nền IT"],
  "sellingAngles": [
    {
      "id": "angle-time",
      "label": "Tiết kiệm thời gian",
      "hook": "Bạn đang mất bao nhiêu giờ để...",
      "rationale": "Pain point phổ biến nhất"
    },
    // ... more angles
  ],
  "claimsToVerify": [],
  "suggestedCtas": ["Đăng ký ngay", "Dùng thử miễn phí"],
  "missingInformation": [],
  "complianceNotes": []
}
```

### 3. **Health Check**

```
GET /api/health
Authorization: Bearer {API_KEY}

Response:
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 123456,
  "rateLimit": {
    "remaining": 1000,
    "resetAt": "2026-10-09T12:00:00Z"
  }
}
```

---

## 📋 Checklist Tích Hợp

### Bước 1: Chuẩn bị Desktop API
- [ ] Expose REST endpoints (generate-script, analyze-product, health)
- [ ] Implement API key authentication (`Authorization: Bearer ...`)
- [ ] CORS headers cho phép web origin
- [ ] Rate limiting (1000 req/hour hoặc custom)
- [ ] Response format match với schema web
- [ ] Error codes chuẩn (400, 401, 429, 500)
- [ ] Logging & monitoring

### Bước 2: Tích hợp vào Web
- [ ] Tạo `src/lib/ai/provider-desktop.ts`
- [ ] Thêm "desktop" vào `AI_PROVIDERS` enum
- [ ] Set env vars: `AI_PROVIDER=desktop`, `DESKTOP_API_URL`, `DESKTOP_API_KEY`
- [ ] Transform functions: web format ↔ desktop format
- [ ] Error mapping: desktop errors → AiError codes
- [ ] Test với mock desktop API trước (ngrok tunnel hoặc local proxy)

### Bước 3: Testing
- [ ] Unit test: provider-desktop.ts với mock fetch
- [ ] Integration test: `/api/studio/scripts` với desktop provider
- [ ] E2E test: tạo product → analyze → generate script → lưu DB
- [ ] Load test: 100 concurrent requests → desktop API handle được không
- [ ] Error cases: desktop API timeout, 429, 500

### Bước 4: Migration Data (nếu có desktop app users)
- [ ] Export user data từ desktop DB
- [ ] Transform sang Postgres schema
- [ ] Migrate products, scripts, campaigns
- [ ] Verify integrity: counts match, no data loss

### Bước 5: Deployment
- [ ] Deploy desktop API (Docker container / VPS / cloud function)
- [ ] SSL certificate cho API domain
- [ ] Firewall rules: chỉ cho phép web server IP
- [ ] Monitor logs: desktop API errors, latency
- [ ] Rollback plan nếu desktop API down → fallback về mock provider

---

## 💰 Chi Phí & Performance

### Desktop API hosting:
- **VPS** (DigitalOcean, Linode): $10-20/tháng cho 2GB RAM
- **Cloud Function** (AWS Lambda, Google Cloud Run): Pay-per-request (~$0.0001/request)
- **Container** (Railway, Render): $7-15/tháng

### Latency:
- Desktop local: 0ms network
- Desktop API (same datacenter): ~5-20ms
- Desktop API (cross-region): ~50-200ms
- OpenAI/Claude API: ~1-3s (model inference time)

**Khuyến nghị:** Nếu desktop algorithm nhanh (<500ms), hosting gần web server sẽ cho UX tốt hơn gọi OpenAI.

---

## 🚀 Roadmap Đề Xuất

### Phase 1: POC (1 tuần)
- [ ] Desktop API expose 1 endpoint đơn giản (generate-script)
- [ ] Web tích hợp provider-desktop
- [ ] Test end-to-end: web form → desktop API → lưu DB
- [ ] Demo cho anh review

### Phase 2: Full Integration (2 tuần)
- [ ] Desktop API đầy đủ endpoints (analyze, health)
- [ ] Error handling, retry logic
- [ ] Rate limiting phía desktop
- [ ] Web admin panel để monitor desktop API health

### Phase 3: Production (1 tuần)
- [ ] Deploy desktop API production
- [ ] SSL, monitoring, alerting
- [ ] Load testing
- [ ] Documentation cho maintainers

### Phase 4: Scale (sau 1 tháng)
- [ ] Caching layer (Redis) cho desktop responses
- [ ] Queue system (BullMQ) nếu desktop chậm
- [ ] Multi-region desktop API deployment
- [ ] Fallback providers (OpenAI backup khi desktop down)

---

## 🎯 Kết Luận & Khuyến Nghị

### Câu trả lời câu hỏi của anh:

**1. App desktop có chuyển lên web được không?**  
→ ✅ **ĐƯỢC** — Web đã có đầy đủ UI/UX cho script generation, chỉ cần thay engine generation.

**2. Web có thể kết nối API của anh không?**  
→ ✅ **ĐƯỢC** — Hệ thống AI provider pluggable, designed để swap providers.

### Khuyến nghị triển khai:

**Nếu desktop algorithm độc quyền (IP của anh):**  
→ Dùng **Option 1 (Custom Provider)**  
→ Desktop chạy như microservice, web call API  
→ Giữ nguyên logic desktop, tận dụng UI/persistence web

**Nếu muốn port logic vào web hoàn toàn:**  
→ Rewrite desktop algorithm bằng TypeScript  
→ Chạy native trong Next.js API routes  
→ Không cần maintain desktop API hosting

**Ưu tiên nào?**

| Tiêu chí | Custom Provider (API) | Native Rewrite |
|----------|----------------------|----------------|
| Time to market | ⚡ Nhanh (1-2 tuần) | 🐌 Chậm (1-2 tháng) |
| Maintain | 🔧 2 codebases | ✅ 1 codebase |
| Performance | 🌐 Network latency | 💨 Zero latency |
| Scalability | ⬆️ Scale riêng | ⬆️ Scale cùng web |
| IP protection | 🔒 Desktop API riêng | ⚠️ Code trong web |

**Khuyến nghị của tôi:**  
→ **Start với Option 1 (Custom Provider)**  
→ Nhanh lên production, validate business value trước  
→ Sau 3-6 tháng nếu traffic lớn, consider rewrite native

---

**Cần tôi code POC không anh?** Tôi có thể:
1. Tạo `provider-desktop.ts` adapter
2. Mock desktop API response để test flow
3. Document API contract chi tiết hơn
4. Setup ngrok tunnel để test local desktop ↔ web

Anh muốn đi theo hướng nào?
