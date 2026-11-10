/**
 * Unit tests — run with `npm test` (tsx tests/unit.ts).
 *
 * Scope: pure/server modules that need no browser and no network.
 * Browser flows live in tests/browser.spec.ts (Playwright).
 */
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { UsageEntry } from "../src/lib/ai/quota-core";

let passed = 0;
let failed = 0;
const failures: string[] = [];

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed += 1;
    const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
    failures.push(`${name}\n${message}`);
    console.log(`  ✗ ${name}`);
  }
}

function section(name: string) {
  console.log(`\n${name}`);
}

function setEnv(values: Record<string, string | undefined>) {
  for (const key of [
    "AI_PROVIDER",
    "AI_MODEL",
    "AI_TIMEOUT_MS",
    "AI_MAX_RETRIES",
    "AI_DAILY_LIMIT",
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "GEMINI_API_KEY",
  ]) {
    delete process.env[key];
  }
  Object.assign(process.env, values);
}

async function main() {
// Every test runs against an isolated data directory so real data/*.json is untouched.
const workdir = await mkdtemp(path.join(tmpdir(), "aimo-unit-"));
const originalCwd = process.cwd();
process.chdir(workdir);

const { aiEnv, assertAiEnv, resetAiEnvCache, aiEnvPublicSummary } = await import("../src/lib/ai/env");
const { AiError, toAiError, aiErrorBody } = await import("../src/lib/ai/errors");
const mockAi = await import("../src/lib/ai/mock");
const { scriptToMarkdown, scriptMarkdownFilename } = await import("../src/lib/studio/markdown");
const quota = await import("../src/lib/ai/quota-core");
const { isMutationOriginAllowed, requireSameOrigin, CSRF_ERROR } = await import("../src/lib/csrf");

// ─── AI env validation ───────────────────────────────────────────────────────
section("lib/ai/env");

await test("defaults to the mock provider when AI_PROVIDER is unset", () => {
  setEnv({});
  resetAiEnvCache();
  const env = aiEnv();
  assert.equal(env.AI_PROVIDER, "mock");
  assert.equal(env.apiKey, null);
  assert.equal(env.AI_TIMEOUT_MS, 30_000);
  assert.equal(env.AI_MAX_RETRIES, 2);
  assert.equal(env.AI_DAILY_LIMIT, 30);
});

await test("rejects an unknown provider name", () => {
  setEnv({ AI_PROVIDER: "skynet" });
  resetAiEnvCache();
  assert.throws(() => assertAiEnv(), /Cấu hình AI không hợp lệ/);
});

await test("requires the matching API key for a live provider", () => {
  setEnv({ AI_PROVIDER: "openai" });
  resetAiEnvCache();
  assert.throws(() => assertAiEnv(), /OPENAI_API_KEY/);
});

await test("accepts a live provider with its key and applies the default model", () => {
  setEnv({ AI_PROVIDER: "anthropic", ANTHROPIC_API_KEY: "sk-test" });
  resetAiEnvCache();
  const env = aiEnv();
  assert.equal(env.AI_PROVIDER, "anthropic");
  assert.equal(env.apiKey, "sk-test");
  assert.ok(env.AI_MODEL && env.AI_MODEL.length > 0);
});

await test("public summary never leaks the API key", () => {
  setEnv({ AI_PROVIDER: "openai", OPENAI_API_KEY: "sk-secret-value" });
  resetAiEnvCache();
  const summary = aiEnvPublicSummary();
  assert.equal(summary.live, true);
  assert.ok(!JSON.stringify(summary).includes("sk-secret-value"));
});

await test("rejects an out-of-range timeout", () => {
  setEnv({ AI_TIMEOUT_MS: "10" });
  resetAiEnvCache();
  assert.throws(() => assertAiEnv(), /AI_TIMEOUT_MS/);
});

// ─── AI errors ───────────────────────────────────────────────────────────────
section("lib/ai/errors");

await test("maps error codes to HTTP status and retryability", () => {
  assert.equal(new AiError("timeout").status, 504);
  assert.equal(new AiError("timeout").retryable, true);
  assert.equal(new AiError("quota").status, 429);
  assert.equal(new AiError("quota").retryable, false);
  assert.equal(new AiError("config").status, 503);
});

await test("normalises unknown throwables", () => {
  const err = toAiError(new Error("boom"));
  assert.equal(err.code, "unknown");
  assert.equal(err.status, 500);
});

await test("preserves an existing AiError instance", () => {
  const original = new AiError("rate_limit");
  assert.equal(toAiError(original), original);
});

await test("response body exposes a Vietnamese message and no internals", () => {
  const body = aiErrorBody(new AiError("upstream", { details: "HTTP 500 secret-trace" }));
  assert.ok(body.error.length > 0);
  assert.equal(body.retryable, true);
  assert.ok(!JSON.stringify(body).includes("secret-trace"));
});

// ─── Deterministic mock provider ─────────────────────────────────────────────
section("lib/ai/mock");

const productInput = {
  name: "AI MỞ Studio",
  description: "Công cụ tạo kịch bản video bán hàng bằng AI",
  featuresText: "Tạo kịch bản, phân tích sản phẩm, lập chiến dịch",
  targetCustomer: "Creator và doanh nghiệp nhỏ",
  problemSolved: "Mất thời gian viết kịch bản",
  allowedProof: "Hơn 100 người dùng thử nghiệm",
  claimsToAvoid: "Không cam kết doanh thu",
};

await test("analyzeProduct returns schema-valid output", async () => {
  const analysis = await mockAi.analyzeProduct(productInput);
  assert.ok(analysis.summary.includes("AI MỞ Studio"));
  assert.ok(analysis.sellingAngles.length >= 1);
  assert.ok(analysis.keyBenefits.length >= 1);
});

await test("analyzeProduct is deterministic", async () => {
  const a = await mockAi.analyzeProduct(productInput);
  const b = await mockAi.analyzeProduct(productInput);
  assert.deepEqual(a, b);
});

await test("generateScripts produces 3 variants covering the requested duration", async () => {
  const analysis = await mockAi.analyzeProduct(productInput);
  const generation = await mockAi.generateScripts({
    product: productInput,
    analysis,
    selectedAngle: analysis.sellingAngles[0],
    platform: "tiktok",
    goal: "conversion",
    durationSeconds: 30,
    format: "ugc",
  });
  assert.equal(generation.scripts.length, 3);
  for (const script of generation.scripts) {
    assert.equal(script.durationSeconds, 30);
    assert.ok(script.shots.length >= 1);
    assert.equal(script.shots[0].startSecond, 0);
    assert.equal(script.shots[script.shots.length - 1].endSecond, 30);
  }
});

await test("generateCampaign produces one entry per day", async () => {
  const analysis = await mockAi.analyzeProduct(productInput);
  const plan = await mockAi.generateCampaign({
    product: productInput,
    analysis,
    platform: "tiktok",
    goal: "awareness",
    durationDays: 7,
  });
  assert.equal(plan.days.length, 7);
  assert.deepEqual(
    plan.days.map((d) => d.day),
    [1, 2, 3, 4, 5, 6, 7]
  );
});

await test("analyzePerformance always returns at least one insight", async () => {
  const none = await mockAi.analyzePerformance({ scriptTitle: "Test", metrics: {} });
  assert.equal(none.length, 1);
  assert.equal(none[0].confidence, "low");

  const some = await mockAi.analyzePerformance({
    scriptTitle: "Test",
    metrics: { views: 1000, clicks: 50, watchThroughRate: 60 },
  });
  assert.ok(some.length >= 2);
});

// ─── Usage quota (pure logic via quota-core) ─────────────────────────────────
section("lib/ai/quota-core");

await test("computeStatus clamps remaining to zero and computes resetsAt", () => {
  const status = quota.computeStatus(3, 3);
  assert.equal(status.used, 3);
  assert.equal(status.limit, 3);
  assert.equal(status.remaining, 0);
  assert.ok(typeof status.resetsAt === "string");
});

await test("computeStatus never returns negative remaining", () => {
  const status = quota.computeStatus(10, 3);
  assert.equal(status.remaining, 0);
});

await test("applyConsume increments until limit, then flags exceed", () => {
  const a = quota.applyConsume(0, 3);
  assert.equal(a.used, 1);
  assert.equal(a.wouldExceed, false);
  const b = quota.applyConsume(2, 3);
  assert.equal(b.used, 3);
  assert.equal(b.wouldExceed, false);
  const c = quota.applyConsume(3, 3);
  assert.equal(c.used, 3);
  assert.equal(c.wouldExceed, true);
});

await test("applyRefund never goes below zero", () => {
  assert.equal(quota.applyRefund(3), 2);
  assert.equal(quota.applyRefund(1), 0);
  assert.equal(quota.applyRefund(0), 0);
});

await test("findUsage returns 0 when no entry exists", () => {
  const entries: UsageEntry[] = [{ userId: "a", day: "2026-01-01", count: 2 }];
  assert.equal(quota.findUsage(entries, "a", "2026-01-01"), 2);
  assert.equal(quota.findUsage(entries, "b", "2026-01-01"), 0);
  assert.equal(quota.findUsage(entries, "a", "2026-01-02"), 0);
});

await test("mergeUsage inserts or updates without mutating input", () => {
  const original: UsageEntry[] = [{ userId: "a", day: "2026-01-01", count: 1 }];
  const merged = quota.mergeUsage(original, { userId: "a", day: "2026-01-01", count: 2 });
  const added = quota.mergeUsage(original, { userId: "b", day: "2026-01-01", count: 1 });
  assert.equal(original[0].count, 1); // input untouched
  assert.equal(merged.length, 1);
  assert.equal(merged[0].count, 2);
  assert.equal(added.length, 2);
});

await test("dropStaleDays keeps only today's entries", () => {
  const entries: UsageEntry[] = [
    { userId: "a", day: "2026-01-01", count: 1 },
    { userId: "a", day: "2026-01-02", count: 2 },
    { userId: "b", day: "2026-01-02", count: 3 },
  ];
  const kept = quota.dropStaleDays(entries, "2026-01-02");
  assert.equal(kept.length, 2);
  assert.ok(kept.every((e) => e.day === "2026-01-02"));
});

await test("today and nextReset use UTC window", () => {
  const now = new Date("2026-08-28T15:30:00.000Z");
  assert.equal(quota.today(now), "2026-08-28");
  assert.equal(quota.nextReset(now), new Date("2026-08-29T00:00:00.000Z").toISOString());
});

await test("assertValidLimit rejects non-positive or non-integer", () => {
  assert.throws(() => quota.assertValidLimit(0));
  assert.throws(() => quota.assertValidLimit(-1));
  assert.throws(() => quota.assertValidLimit(1.5));
  assert.doesNotThrow(() => quota.assertValidLimit(1));
});

// ─── Usage adapter integration (JSON adapter, isolated tmp dir) ───────────────
// NOTE: Adapter integration + routing tests live in tests/server/usage-adapter.ts,
// which runs under `npm run test:server` with Node's `react-server` condition
// so the `import 'server-only'` guard in json-usage.ts / pg-usage.ts resolves
// to empty.js. The plain tsx runner (npm test) cannot load server-only modules,
// so quota-core coverage is tested above while the JSON/PG adapter behavior is
// covered in the server-runtime suite.

// ─── Markdown export ─────────────────────────────────────────────────────────
section("lib/studio/markdown");

const sampleProduct = {
  id: "prod-1",
  userId: "user-a",
  name: "AI MỞ Studio",
  url: "https://aimo.vn",
  description: "Công cụ tạo kịch bản video",
  priceOffer: "990.000đ",
  featuresText: "Tạo kịch bản nhanh",
  targetCustomer: "Creator",
  problemSolved: "Tốn thời gian",
  allowedProof: "100 người dùng",
  claimsToAvoid: "Không cam kết doanh thu",
  affiliateLink: "https://aimo.vn/aff",
  brandVoice: "Thân thiện",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

const sampleScript = {
  id: "script-abcdef123456",
  userId: "user-a",
  productProfileId: "prod-1",
  platform: "tiktok" as const,
  goal: "conversion" as const,
  durationSeconds: 30,
  selectedAngleId: "angle-time",
  scripts: [
    {
      title: "Kịch bản A — Tiết kiệm thời gian",
      angle: "Tiết kiệm thời gian",
      hook: "Bạn mất bao nhiêu giờ để viết kịch bản?",
      durationSeconds: 30,
      shots: [
        {
          startSecond: 0,
          endSecond: 10,
          purpose: "Hook",
          spokenText: "Bạn mất bao lâu | để viết kịch bản?",
          visualDirection: "Close-up presenter",
          onScreenText: "Mất bao lâu?",
          bRoll: "Cảnh sản phẩm",
          cameraAction: "Medium close-up",
          ctaLine: undefined,
        },
        {
          startSecond: 10,
          endSecond: 30,
          purpose: "CTA",
          spokenText: "Dùng thử ngay",
          visualDirection: "Text overlay",
          onScreenText: "Dùng thử",
          bRoll: undefined,
          cameraAction: undefined,
          ctaLine: "Nhấn vào link",
        },
      ],
      alternativeHooks: ["Hook thay thế 1"],
      audioSuggestion: "Nhạc nền upbeat",
      cta: "Dùng thử miễn phí",
      caption: "Caption mẫu",
      hashtags: ["aimo", "#video"],
      disclosureNote: "Có liên kết affiliate",
      warnings: ["[CẦN XÁC MINH] số liệu"],
    },
  ],
  missingInformation: ["Chưa có giá cụ thể"],
  complianceNotes: ["Không dùng claim tuyệt đối"],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

await test("markdown includes product context, timeline, caption and hashtags", () => {
  const md = scriptToMarkdown(sampleScript, sampleProduct);
  assert.ok(md.includes("# Kịch bản A — Tiết kiệm thời gian"));
  assert.ok(md.includes("## Bối cảnh sản phẩm"));
  assert.ok(md.includes("AI MỞ Studio"));
  assert.ok(md.includes("### Timeline"));
  assert.ok(md.includes("00:00–00:10"));
  assert.ok(md.includes("### Caption"));
  assert.ok(md.includes("#aimo #video"));
});

await test("markdown includes angle, hook, compliance notes and disclosure", () => {
  const md = scriptToMarkdown(sampleScript, sampleProduct);
  assert.ok(md.includes("**Góc bán hàng:** Tiết kiệm thời gian"));
  assert.ok(md.includes("**Hook:** Bạn mất bao nhiêu giờ để viết kịch bản?"));
  assert.ok(md.includes("## Tuân thủ & rủi ro"));
  assert.ok(md.includes("Không dùng claim tuyệt đối"));
  assert.ok(md.includes("### Disclosure"));
  assert.ok(md.includes("Có liên kết affiliate"));
  assert.ok(md.includes("Chưa có giá cụ thể"));
});

await test("markdown escapes pipes so the table stays valid", () => {
  const md = scriptToMarkdown(sampleScript, sampleProduct);
  assert.ok(md.includes("Bạn mất bao lâu \\| để viết kịch bản?"));
});

await test("markdown renders without a product", () => {
  const md = scriptToMarkdown(sampleScript, null);
  assert.ok(md.includes("đã bị xoá"));
});

await test("export filename is ascii-safe and unique per script", () => {
  const name = scriptMarkdownFilename(sampleScript);
  assert.match(name, /^[a-z0-9-]+\.md$/);
  assert.ok(name.includes("script-a"));
});

// ─── CSRF protection ─────────────────────────────────────────────────────────
section("lib/csrf");

function mockRequest(origin: string | null, host: string, method = "POST"): Request {
  const headers = new Headers();
  if (origin) headers.set("origin", origin);
  headers.set("host", host);
  return new Request("https://example.com/api/test", { method, headers });
}

await test("isMutationOriginAllowed: matching localhost origin/host allowed", () => {
  const result = isMutationOriginAllowed({
    method: "POST",
    origin: "http://localhost:3000",
    host: "localhost:3000",
  });
  assert.equal(result.ok, true);
});

await test("isMutationOriginAllowed: localhost via ALLOWED_ORIGINS", () => {
  const result = isMutationOriginAllowed({
    method: "POST",
    origin: "http://localhost:3000",
    host: "aimo.vn",
    env: { NODE_ENV: "test", ALLOWED_ORIGINS: "http://localhost:3000" },
  });
  assert.equal(result.ok, true);
});

await test("isMutationOriginAllowed: matching origin/host allowed", () => {
  const result = isMutationOriginAllowed({
    method: "POST",
    origin: "https://aimo.vn",
    host: "aimo.vn",
  });
  assert.equal(result.ok, true);
});

await test("isMutationOriginAllowed: mismatched origin/host blocked", () => {
  const result = isMutationOriginAllowed({
    method: "POST",
    origin: "https://evil.com",
    host: "aimo.vn",
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "origin-mismatch");
});

await test("isMutationOriginAllowed: missing origin blocked", () => {
  const result = isMutationOriginAllowed({
    method: "POST",
    origin: null,
    host: "aimo.vn",
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "missing-origin");
});

await test("isMutationOriginAllowed: GET is exempt from CSRF", () => {
  const result = isMutationOriginAllowed({
    method: "GET",
    origin: null,
    host: "aimo.vn",
  });
  assert.equal(result.ok, true);
});

await test("requireSameOrigin: valid request returns null (pass)", () => {
  const req = mockRequest("https://aimo.vn", "aimo.vn");
  const result = requireSameOrigin(req);
  assert.equal(result, null, "null means no error, request passes");
});

await test("requireSameOrigin: invalid origin returns 403", () => {
  const req = mockRequest("https://evil.com", "aimo.vn");
  const result = requireSameOrigin(req);
  assert.ok(result instanceof Response);
  assert.equal(result.status, 403);
});

await test("requireSameOrigin: missing origin returns 403", () => {
  const req = mockRequest(null, "aimo.vn");
  const result = requireSameOrigin(req);
  assert.ok(result instanceof Response);
  assert.equal(result.status, 403);
});

await test("CSRF_ERROR constant is defined", () => {
  assert.equal(typeof CSRF_ERROR, "string");
  assert.ok(CSRF_ERROR.length > 0);
});


// ─── Summary ─────────────────────────────────────────────────────────────────
process.chdir(originalCwd);
await rm(workdir, { recursive: true, force: true });

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  for (const failure of failures) console.error(`\n${failure}`);
  process.exit(1);
}
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
