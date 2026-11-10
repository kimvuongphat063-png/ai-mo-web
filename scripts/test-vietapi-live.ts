/**
 * PromptKichBan — VietAPI Live Verification Script (Phase 3C)
 *
 * This script DIRECTLY calls the VietAPI OpenAI-compatible endpoint over HTTP
 * to prove a real network round-trip.  It does NOT use generatePromptKichBan()
 * (which can silently fall back to mock), so the result is unambiguous.
 *
 * Exit codes & machine-readable status lines:
 *
 *   VIETAPI_LIVE_STATUS=PASS          exit 0   Real VietAPI call succeeded & schema validated
 *   VIETAPI_LIVE_STATUS=SKIPPED       exit 0   VietAPI is not the active provider
 *   VIETAPI_LIVE_STATUS=FALLBACK_MOCK exit 0   Provider is vietapi but no API key; safely fell back to mock
 *   VIETAPI_LIVE_STATUS=FAIL          exit 1   Real VietAPI call attempted but failed
 *
 * Usage:
 *   npm run test:vietapi
 *   # or directly:
 *   npx tsx scripts/test-vietapi-live.ts
 *   # to simulate/test fallback mock path:
 *   npx tsx scripts/test-vietapi-live.ts --simulate-fallback
 */

import "server-only";
import { randomUUID } from "node:crypto";

// Auto-load .env.local if present in Node 20+
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // Ignore if not present
  }
}
import {
  getPromptKichBanEnv,
  PromptKichBanError,
  extractJson,
} from "../src/lib/promptkichban/ai";
import {
  rawVideoPromptOutputSchema,
  videoPromptOutputSchema,
  type PromptKichBanInput,
} from "../src/lib/promptkichban/schema";
import {
  normalizeTemporalBoundaries,
  normalizeRawOutputShape,
  generatePromptKichBan,
} from "../src/lib/promptkichban/service";
import { buildAllModelPrompts } from "../src/lib/promptkichban/prompt-templates";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const SAMPLE_INPUT: PromptKichBanInput = {
  inputText:
    "iPhone 15 Pro Max màu titan tự nhiên máy cũ đẹp 99% nguyên zin pin 95% giá cực tốt bảo hành 12 tháng tại Anh Táo Mobile.",
  contentType: "product-review",
  visualStyle: "tech-cinematic",
  publishingPlatform: "tiktok",
  promptModel: "all",
  aspectRatio: "9:16",
  durationSeconds: 30,
  voiceGender: "male",
  voiceRegion: "south",
  voiceAge: "young",
  voiceRole: "reviewer",
  speakingSpeed: "normal",
  emotion: "friendly",
  language: "vi",
  tone: "Hài hước, chân thực, uy tín",
  callToAction:
    "Ghé ngay Anh Táo Mobile hoặc bấm vào giỏ hàng để nhận ưu đãi!",
  additionalRequirements: "Nhấn mạnh bảo hành 12 tháng và ngoại hình máy",
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function banner(text: string) {
  const line = "=".repeat(62);
  console.log(`\n${line}`);
  console.log(`  ${text}`);
  console.log(line);
}

function kv(key: string, value: string | number) {
  console.log(`${key}=${value}`);
}

function maskKey(key: string | null): string {
  if (!key) return "(none)";
  if (key.length < 8) return "***";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Direct VietAPI HTTP Call (OpenAI-compatible, no service abstraction)
// ─────────────────────────────────────────────────────────────────────────────

interface VietApiDirectResult {
  rawText: string;
  finishReason: string;
  promptTokens: number | null;
  completionTokens: number | null;
  model: string;
  latencyMs: number;
}

async function callVietApiDirect(
  apiKey: string,
  baseUrl: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  timeoutMs: number
): Promise<VietApiDirectResult> {
  const url = `${baseUrl}/chat/completions`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startMs = Date.now();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 8192,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    const latencyMs = Date.now() - startMs;

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `VietAPI HTTP ${res.status}: ${text.slice(0, 500)}`
      );
    }

    const json = (await res.json()) as Record<string, unknown>;

    // Parse OpenAI-compatible response
    const choices = json?.choices as
      | Array<{
          finish_reason?: string;
          message?: { content?: string; role?: string };
        }>
      | undefined;
    const first = choices?.[0];

    const rawText = first?.message?.content ?? "";
    if (!rawText.trim()) {
      throw new Error(
        `VietAPI returned empty content (finish_reason=${first?.finish_reason})`
      );
    }

    // Token usage
    const usage = json?.usage as
      | { prompt_tokens?: number; completion_tokens?: number }
      | undefined;

    return {
      rawText,
      finishReason: first?.finish_reason ?? "unknown",
      promptTokens: usage?.prompt_tokens ?? null,
      completionTokens: usage?.completion_tokens ?? null,
      model: (json?.model as string) ?? model,
      latencyMs,
    };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`VietAPI call timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  banner("PromptKichBan — VietAPI Live Verification (Phase 3C)");

  // ── 1. Read & audit env config ──
  const env = getPromptKichBanEnv();
  const requestId = randomUUID();
  const baseUrl = env.baseUrl || "https://api.vietapi.tech/v1";

  console.log("\n[1/5] Environment Audit");
  console.log(`  PROMPTKICHBAN_AI_PROVIDER env: ${process.env.PROMPTKICHBAN_AI_PROVIDER ?? "(unset)"}`);
  console.log(`  Resolved provider:            ${env.provider}`);
  console.log(`  Resolved model:               ${env.model}`);
  console.log(`  Base URL:                     ${baseUrl}`);
  console.log(`  Timeout:                      ${env.timeoutMs} ms`);
  console.log(`  Max retries:                  ${env.maxRetries}`);
  console.log(`  PROMPTKICHBAN_AI_API_KEY:     ${env.apiKey ? "YES (" + maskKey(env.apiKey) + ")" : "NO"}`);

  // ── 2. Determine if we can do a live call or fallback mock ──
  const simulateFallback =
    process.argv.includes("--simulate-fallback") ||
    process.argv.includes("--fallback");
  const isVietApiProvider = env.provider === "vietapi" || simulateFallback;
  const hasApiKey = Boolean(env.apiKey) && !simulateFallback;

  if (!isVietApiProvider) {
    console.log(`\n[2/5] Provider Check`);
    console.log(`  Current resolved provider is "${env.provider}", not "vietapi".`);
    console.log(`  VietAPI is not active in this environment.`);
    console.log(`  To test VietAPI, configure in .env.local:`);
    console.log(`    PROMPTKICHBAN_AI_PROVIDER=vietapi`);
    console.log(`    PROMPTKICHBAN_AI_API_KEY=your_vietapi_key`);
    console.log(`    PROMPTKICHBAN_AI_BASE_URL=https://api.vietapi.tech/v1`);

    banner("Result");
    kv("VIETAPI_LIVE_STATUS", "SKIPPED");
    kv("VIETAPI_LIVE_REASON", `PROVIDER_IS_${env.provider.toUpperCase()}`);
    kv("VIETAPI_MODEL", env.model ?? "n/a");
    kv("VIETAPI_BASE_URL", baseUrl);
    kv("VIETAPI_REQUEST_ID", requestId);
    kv("VIETAPI_LATENCY_MS", 0);
    console.log();
    process.exit(0);
  }

  if (!hasApiKey) {
    console.log("\n[2/5] VietAPI Provider Active Without API Key");
    console.log("  PROMPTKICHBAN_AI_PROVIDER=vietapi is selected, but PROMPTKICHBAN_AI_API_KEY is not set.");
    console.log("  Testing server-side fail-safe mock fallback behavior...");

    const fallbackStart = Date.now();
    // Force env for fallback test if in simulate mode
    const prevKey = process.env.PROMPTKICHBAN_AI_API_KEY;
    const prevProv = process.env.PROMPTKICHBAN_AI_PROVIDER;
    delete process.env.PROMPTKICHBAN_AI_API_KEY;
    process.env.PROMPTKICHBAN_AI_PROVIDER = "vietapi";

    let fallbackOutput;
    try {
      fallbackOutput = await generatePromptKichBan(SAMPLE_INPUT);
    } finally {
      if (prevKey) process.env.PROMPTKICHBAN_AI_API_KEY = prevKey;
      else delete process.env.PROMPTKICHBAN_AI_API_KEY;
      if (prevProv) process.env.PROMPTKICHBAN_AI_PROVIDER = prevProv;
      else delete process.env.PROMPTKICHBAN_AI_PROVIDER;
    }

    const fallbackLatency = Date.now() - fallbackStart;

    console.log(`  ✓ Fallback mock executed safely (${fallbackLatency} ms)`);
    console.log(`  ✓ Title: "${fallbackOutput.title}"`);
    console.log(`  ✓ Scenes count: ${fallbackOutput.scenes.length}`);
    console.log(`  ✓ Total duration: ${fallbackOutput.durationSeconds}s`);
    console.log(`  ✓ Temporal continuity: 0s → ${fallbackOutput.scenes[fallbackOutput.scenes.length - 1].endSecond}s`);

    banner("Result");
    kv("VIETAPI_LIVE_STATUS", "FALLBACK_MOCK");
    kv("VIETAPI_LIVE_REASON", "NO_API_KEY");
    kv("VIETAPI_MODEL", "mock");
    kv("VIETAPI_BASE_URL", baseUrl);
    kv("VIETAPI_REQUEST_ID", fallbackOutput.requestId);
    kv("VIETAPI_LATENCY_MS", fallbackLatency);
    console.log();
    process.exit(0);
  }

  // ── 3. Build prompts (same as service.ts live path) ──
  console.log("\n[2/5] Building prompts for live VietAPI call...");
  const systemPrompt = `You are an elite Hollywood visual director, TikTok viral producer, and AI prompt engineer for state-of-the-art video models (Google Veo 3, xAI Grok, ByteDance Seedance 2.5, Tencent Muse).
Generate a structured video storyboard and script in JSON format.
Strict requirements:
1. Total duration must be exactly ${SAMPLE_INPUT.durationSeconds} seconds.
2. Generate exactly 4 concise scenes. Keep each scene field concise (1-2 sentences max).
3. The scenes array must be contiguous from second 0 to ${SAMPLE_INPUT.durationSeconds} without any gaps or overlaps (scene 1 starts at 0, last scene ends at ${SAMPLE_INPUT.durationSeconds}).
4. Write high-quality Vietnamese voiceover and captions tailored to the topic.
5. Output valid JSON matching the schema with all required fields. Never include markdown code fences.
6. Top-level fields: title, summary, contentType, visualStyle, publishingPlatform, promptModel, aspectRatio, durationSeconds, tone, targetAudience, hook, scenes, voiceoverFull, cta, caption, hashtags, warnings, missingInformation, generatedAt, requestId.`;

  const userPrompt = `Input Data:
${JSON.stringify({ inputData: SAMPLE_INPUT, requestId })}

Instructions:
Generate the structured video storyboard and script now as a single valid JSON object matching the required schema. Output ONLY valid JSON. Do not include markdown code fences or any conversational text.`;

  // ── 4. Make the DIRECT HTTP call to VietAPI ──
  console.log("\n[3/5] Calling VietAPI directly (NOT via service mock fallback)...");
  console.log(`  URL: ${baseUrl}/chat/completions`);
  console.log(`  Key: ${maskKey(env.apiKey)}`);
  console.log(`  Model: ${env.model}`);

  let result: VietApiDirectResult;
  try {
    result = await callVietApiDirect(
      env.apiKey!,
      baseUrl,
      env.model!,
      systemPrompt,
      userPrompt,
      env.timeoutMs
    );
  } catch (err: unknown) {
    const errorObj = err as any;
    const msg =
      errorObj?.cause?.message ||
      errorObj?.message ||
      String(err);
    console.error(`\n❌ VietAPI direct HTTP call FAILED: ${msg}`, errorObj?.cause || "");

    banner("Result");
    kv("VIETAPI_LIVE_STATUS", "FAIL");
    kv("VIETAPI_LIVE_ERROR", msg.slice(0, 200));
    kv("VIETAPI_MODEL", env.model ?? "n/a");
    kv("VIETAPI_BASE_URL", baseUrl);
    kv("VIETAPI_REQUEST_ID", requestId);
    kv("VIETAPI_LATENCY_MS", 0);
    console.log();
    process.exit(1);
  }

  console.log(`  ✅ HTTP 200 received in ${result.latencyMs} ms`);
  console.log(`  Model used:        ${result.model}`);
  console.log(`  finishReason:      ${result.finishReason}`);
  console.log(`  promptTokens:      ${result.promptTokens ?? "n/a"}`);
  console.log(`  completionTokens:  ${result.completionTokens ?? "n/a"}`);
  console.log(`  rawText length:    ${result.rawText.length} chars`);

  // ── 5. Parse & validate the response against Zod schemas ──
  console.log("\n[4/5] Parsing VietAPI JSON response & validating schema...");

  let parsed: unknown;
  try {
    parsed = extractJson(result.rawText);
  } catch (err) {
    console.error("  ❌ VietAPI returned invalid JSON:");
    console.error("  First 500 chars:", result.rawText.slice(0, 500));

    banner("Result");
    kv("VIETAPI_LIVE_STATUS", "FAIL");
    kv("VIETAPI_LIVE_ERROR", "INVALID_JSON_FROM_VIETAPI");
    kv("VIETAPI_MODEL", result.model);
    kv("VIETAPI_BASE_URL", baseUrl);
    kv("VIETAPI_REQUEST_ID", requestId);
    kv("VIETAPI_LATENCY_MS", result.latencyMs);
    console.log();
    process.exit(1);
  }

  // Validate raw schema (with shape normalization for flexible LLM output)
  const shaped = normalizeRawOutputShape(parsed, SAMPLE_INPUT, requestId);
  const rawResult = rawVideoPromptOutputSchema.safeParse(shaped);
  if (!rawResult.success) {
    console.error("  ❌ Raw schema validation failed:");
    rawResult.error.issues.forEach((iss) =>
      console.error(`    ${iss.path.join(".")}: ${iss.message}`)
    );
    console.log("  First 800 chars of VietAPI response:");
    console.log("  " + result.rawText.slice(0, 800));

    banner("Result");
    kv("VIETAPI_LIVE_STATUS", "FAIL");
    kv("VIETAPI_LIVE_ERROR", "RAW_SCHEMA_VALIDATION_FAILED");
    kv("VIETAPI_MODEL", result.model);
    kv("VIETAPI_BASE_URL", baseUrl);
    kv("VIETAPI_REQUEST_ID", requestId);
    kv("VIETAPI_LATENCY_MS", result.latencyMs);
    console.log();
    process.exit(1);
  }
  console.log("  ✅ Raw schema validation passed");

  // Normalize temporal boundaries
  const normalizedScenes = normalizeTemporalBoundaries(
    rawResult.data.scenes,
    SAMPLE_INPUT.durationSeconds
  );
  const withNormalized = {
    ...rawResult.data,
    durationSeconds: SAMPLE_INPUT.durationSeconds,
    scenes: normalizedScenes.map((scene) => ({
      ...scene,
      modelPrompts: buildAllModelPrompts(scene, SAMPLE_INPUT),
    })),
  };

  // Validate strict schema (with temporal invariants)
  const strictResult = videoPromptOutputSchema.safeParse(withNormalized);
  if (!strictResult.success) {
    console.error("  ❌ Strict temporal schema validation failed (after normalization):");
    strictResult.error.issues.forEach((iss) =>
      console.error(`    ${iss.path.join(".")}: ${iss.message}`)
    );

    banner("Result");
    kv("VIETAPI_LIVE_STATUS", "FAIL");
    kv("VIETAPI_LIVE_ERROR", "STRICT_SCHEMA_VALIDATION_FAILED");
    kv("VIETAPI_MODEL", result.model);
    kv("VIETAPI_BASE_URL", baseUrl);
    kv("VIETAPI_REQUEST_ID", requestId);
    kv("VIETAPI_LATENCY_MS", result.latencyMs);
    console.log();
    process.exit(1);
  }
  console.log("  ✅ Strict temporal schema validation passed (after normalization)");

  const output = strictResult.data;

  // ── 6. Summary ──
  console.log("\n[5/5] Output Summary");
  console.log(`  Title:    ${output.title}`);
  console.log(`  Scenes:   ${output.scenes.length}`);
  console.log(`  Duration: ${output.scenes[0].startSecond}s → ${output.scenes[output.scenes.length - 1].endSecond}s (target: ${output.durationSeconds}s)`);
  console.log(`  Hook:     "${output.hook.slice(0, 80)}..."`);
  console.log(`  CTA:      "${output.cta.slice(0, 80)}..."`);
  output.scenes.forEach((s) => {
    console.log(`  Scene ${s.sceneNumber} [${s.startSecond}s-${s.endSecond}s]: ${s.scenePurpose.slice(0, 60)}`);
    if (s.modelPrompts) {
      console.log(`    veo3:       ${s.modelPrompts.veo3.slice(0, 60)}...`);
      console.log(`    grok:       ${s.modelPrompts.grok.slice(0, 60)}...`);
      console.log(`    seedance25: ${s.modelPrompts.seedance25.slice(0, 60)}...`);
      console.log(`    muse:       ${s.modelPrompts.muse.slice(0, 60)}...`);
    }
  });

  // Security: verify no key leakage
  const serialized = JSON.stringify(output);
  if (env.apiKey && serialized.includes(env.apiKey)) {
    console.error("\n❌ SECURITY VIOLATION: API key leaked in output!");
    banner("Result");
    kv("VIETAPI_LIVE_STATUS", "FAIL");
    kv("VIETAPI_LIVE_ERROR", "API_KEY_LEAKED_IN_OUTPUT");
    kv("VIETAPI_MODEL", result.model);
    kv("VIETAPI_BASE_URL", baseUrl);
    kv("VIETAPI_REQUEST_ID", requestId);
    kv("VIETAPI_LATENCY_MS", result.latencyMs);
    console.log();
    process.exit(1);
  }
  console.log("\n  🔒 Security: No API key leakage in output payload");

  // ── Machine-readable output ──
  banner("Result");
  kv("VIETAPI_LIVE_STATUS", "PASS");
  kv("VIETAPI_MODEL", result.model);
  kv("VIETAPI_BASE_URL", baseUrl);
  kv("VIETAPI_REQUEST_ID", requestId);
  kv("VIETAPI_LATENCY_MS", result.latencyMs);
  kv("VIETAPI_FINISH_REASON", result.finishReason);
  kv("VIETAPI_PROMPT_TOKENS", result.promptTokens ?? "n/a");
  kv("VIETAPI_COMPLETION_TOKENS", result.completionTokens ?? "n/a");
  kv("VIETAPI_SCENE_COUNT", output.scenes.length);
  kv("VIETAPI_SCHEMA_VALID", "true");
  kv("VIETAPI_SECURITY_CLEAN", "true");
  console.log();
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  banner("Result");
  kv("VIETAPI_LIVE_STATUS", "FAIL");
  kv("VIETAPI_LIVE_ERROR", err instanceof Error ? err.message.slice(0, 200) : String(err));
  console.log();
  process.exit(1);
});
