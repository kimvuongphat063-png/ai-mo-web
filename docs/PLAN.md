# AI MỞ Script Studio — Implementation Plan

_Phase 1 plan, generated 2026-08-13_

## 1. Context / Existing Stack

| Item | Value |
|---|---|
| Framework | Next.js 16.2.3, React 19, TypeScript strict |
| Styling | Tailwind v4 (`@import "tailwindcss"`) |
| Auth | Custom HMAC-SHA-256 signed cookie (`aimo_demo_session`) — roles: `admin`, `learner` |
| Persistence | JSON files under `data/` with atomic rename (same process queue pattern as `src/lib/cms.ts`) |
| AI SDK | None installed — mock service to be injected, swap-ready interface |
| Existing routes | `/`, `/courses`, `/login`, `/account/**`, `/admin/**`, `/learn/**` |
| New routes | `/app/**` (script studio SaaS layer) |

No Prisma DB connection is live (schema present, no `DATABASE_URL`). All new studio data follows the existing `data/cms.json` atomic-write pattern, stored in `data/studio.json`.

---

## 2. New Files (all paths relative to workspace root)

### Foundation
```
data/studio.json                          initial empty store
src/lib/ai/contract.ts                    Zod schemas + TS types (AI contract)
src/lib/ai/index.ts                       mock AI service (server-only)
src/lib/validation/studio.ts              form validation schemas (shared)
src/lib/studio.ts                         JSON data store, atomic writes (server-only)
```

### API Routes
```
src/app/api/studio/products/route.ts           GET list, POST create
src/app/api/studio/products/[id]/route.ts      GET, PUT, DELETE
src/app/api/studio/products/[id]/analyze/route.ts   POST → ProductAnalysis
src/app/api/studio/scripts/route.ts            GET list, POST generate
src/app/api/studio/scripts/[id]/route.ts       GET, PUT, DELETE
src/app/api/studio/campaigns/route.ts          GET list, POST create
src/app/api/studio/campaigns/[id]/route.ts     GET, PUT, DELETE
src/app/api/studio/brand/route.ts              GET, PUT
src/app/api/studio/performance/route.ts        GET list, POST add metric
```

### Pages (App Router, `/app/**`)
```
src/app/app/layout.tsx             studio shell (sidebar nav + auth guard)
src/app/app/page.tsx               dashboard
src/app/app/products/page.tsx      product library
src/app/app/products/new/page.tsx  create product
src/app/app/products/[id]/page.tsx product brain (analysis result)
src/app/app/scripts/new/page.tsx   script wizard
src/app/app/scripts/[id]/page.tsx  script editor / result (tabs)
src/app/app/campaigns/page.tsx     campaign list
src/app/app/campaigns/new/page.tsx create campaign
src/app/app/campaigns/[id]/page.tsx campaign workspace
src/app/app/brand/page.tsx         brand memory
src/app/app/performance/page.tsx   performance loop
src/app/app/settings/page.tsx      settings
```

### Components
```
src/components/studio/studio-shell.tsx
src/components/studio/product-brain-form.tsx
src/components/studio/product-analysis-result.tsx
src/components/studio/script-wizard.tsx
src/components/studio/script-result.tsx
src/components/studio/timeline.tsx
src/components/studio/campaign-workspace.tsx
src/components/studio/brand-memory-form.tsx
src/components/studio/performance-loop.tsx
```

### Tests + Docs
```
tests/unit/studio-validation.ts
docs/AI-CONTRACT.md
docs/PRODUCT.md
docs/SECURITY.md
PROJECT-STATUS.md
```

---

## 3. Data Model (JSON store — `data/studio.json`)

```
StudioDb {
  version: 1
  updatedAt: string (ISO)
  productProfiles: ProductProfile[]
  scripts: Script[]
  campaigns: Campaign[]
  brandProfiles: BrandProfile[]        (one per userId, upsert)
  performanceMetrics: PerformanceMetric[]
}

ProductProfile {
  id, userId, createdAt, updatedAt
  name, url?, description, priceOffer?, featuresText
  targetCustomer, problemSolved, allowedProof
  claimsToAvoid, affiliateLink?, brandVoice?
  analysis?: ProductAnalysis            (cached after POST /analyze)
  archivedAt?: string
}

Script {
  id, userId, productProfileId, createdAt, updatedAt
  platform, goal, durationSeconds, format, presenter?, tone, cta?
  generation: ScriptGeneration          (from AI service)
  status: 'draft' | 'ready' | 'archived'
  title: string
}

Campaign {
  id, userId, productProfileId?, createdAt, updatedAt
  name, platform, goal, durationDays: 7|14|30
  scriptIds: string[]
  status: 'idea'|'draft'|'ready'|'filming'|'published'|'archived'
  owner?, deadline?, note?
}

BrandProfile {
  id, userId, createdAt, updatedAt
  brandName, audience, preferredWords, forbiddenWords
  tone, language, cta, disclosure?, exampleScript?
}

PerformanceMetric {
  id, userId, scriptId?, createdAt
  views, watchThroughRate?, avgWatchTime?, likes?, comments?
  shares?, clicks?, leads?, orders?, commission?
  notes?
  insights?: PerformanceInsight[]
}
```

---

## 4. AI Contract Summary

Service functions (all server-only):
- `analyzeProduct(input: ProductProfileInput): Promise<ProductAnalysis>`
- `suggestAngles(input: SuggestAnglesInput): Promise<SellingAngle[]>`
- `generateScripts(input: ScriptInput): Promise<ScriptGeneration>`
- `generateCampaign(input: CampaignInput): Promise<CampaignPlan>`
- `analyzePerformance(input: PerformanceInput): Promise<PerformanceInsight[]>`

All outputs validated by Zod. Missing data marked `[CẦN XÁC MINH]`. No medical claims, no fabricated metrics.

---

## 5. Auth Strategy

All `/app/**` pages and `/api/studio/**` routes call `requirePageRole()` / `authorizeApi()` with no role argument (any logged-in session). This follows the existing pattern and allows both `admin` and `learner` accounts to use the studio during demo.

---

## 6. Acceptance Criteria (Definition of Done)

- [x] Product profile can be created, read, updated, soft-deleted
- [ ] Product Brain returns structured analysis (Zod-validated)
- [ ] Script Lab generates ≥3 scripts with timeline, shots, caption, hashtags
- [ ] Scripts can be saved, copied, exported (Markdown download)
- [ ] Campaign can be created with 7/14/30-day schedule and multiple scripts
- [ ] Brand Memory can be saved and reused in script generation
- [ ] Performance metrics can be entered and AI insights returned
- [ ] All pages have loading/skeleton, empty state, error + retry
- [ ] Workspace auth: server always verifies session before returning data
- [ ] No secrets in logs or responses
- [ ] Unit tests pass for Zod schemas and validation rules

---

## 7. Risks

| Risk | Mitigation |
|---|---|
| No real AI provider installed | Mock service returns realistic fixture data. Swap-ready `AIProvider` interface |
| Single-file JSON store not safe for concurrent writes | Same write-queue pattern as `cms.ts` (enqueue serialises mutations) |
| `/app` route conflicts with existing app directory structure | `src/app/app/` is valid Next.js nested routing — confirmed pattern |
| studio.json grows large with many users | Demo has 2 fixed accounts; production needs DB migration |
| Tailwind v4 class names differ from v3 | Follow existing `globals.css` utility patterns only, no new utilities |
