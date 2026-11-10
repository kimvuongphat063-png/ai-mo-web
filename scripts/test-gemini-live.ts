/**
 * PromptKichBan — Gemini Live API Verification Script (Phase 3B.1)
 *
 * This script DIRECTLY calls the Google Gemini API over HTTP to prove
 * a real network round-trip.  It does NOT use generatePromptKichBan()
 * (which can silently fall back to mock), so the result is unambiguous.
 *
 * Exit codes & machine-readable status lines:
 *
 *   GEMINI_LIVE_STATUS=PASS          exit 0   Real Gemini call succeeded & schema validated
 *   GEMINI_LIVE_STATUS=SKIPPED       exit 0   No GEMINI_API_KEY configured (not an error)
 *   GEMINI_LIVE_STATUS=FAIL          exit 1   Real Gemini call attempted but failed
 *
 * Usage:
 *   npm run test:gemini
 *   # or directly:
 *   npx tsx scripts/test-gemini-live.ts
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
} from "../src/lib/promptkichban/ai";
import {
  rawVideoPromptOutputSchema,
  videoPromptOutputSchema,
  type PromptKichBanInput,
} from "../src/lib/promptkichban/schema";
import {
  normalizeTemporalBoundaries,
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
// Direct Gemini HTTP Call (no service abstraction, no mock fallback)
// ─────────────────────────────────────────────────────────────────────────────

interface GeminiDirectResult {
  rawText: string;
  finishReason: string;
  promptTokens: number | null;
  candidateTokens: number | null;
  latencyMs: number;
}

async function callGeminiDirect(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  timeoutMs: number
): Promise<GeminiDirectResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startMs = Date.now();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.7,
          responseMimeType: "application/json",
        },
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    const latencyMs = Date.now() - startMs;

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Gemini HTTP ${res.status}: ${text.slice(0, 500)}`
      );
    }

    const json = (await res.json()) as Record<string, unknown>;

    // Check prompt-level block
    const promptFeedback = json?.promptFeedback as
      | { blockReason?: string }
      | undefined;
    if (promptFeedback?.blockReason) {
      throw new Error(
        `Gemini safety block (prompt): ${promptFeedback.blockReason}`
      );
    }

    // Parse first candidate
    const candidates = json?.candidates as
      | Array<{
          finishReason?: string;
          content?: { parts?: Array<{ text?: string }> };
        }>
      | undefined;
    const first = candidates?.[0];

    if (
      first?.finishReason === "SAFETY" ||
      first?.finishReason === "RECITATION"
    ) {
      throw new Error(
        `Gemini safety block (candidate): finishReason=${first.finishReason}`
      );
    }

    const rawText = first?.content?.parts?.[0]?.text ?? "";
    if (!rawText.trim()) {
      throw new Error(
        `Gemini returned empty content (finishReason=${first?.finishReason})`
      );
    }

    // Token usage (may be absent in some API versions)
    const usage = json?.usageMetadata as
      | { promptTokenCount?: number; candidatesTokenCount?: number }
      | undefined;

    return {
      rawText,
      finishReason: first?.finishReason ?? "unknown",
      promptTokens: usage?.promptTokenCount ?? null,
      candidateTokens: usage?.candidatesTokenCount ?? null,
      latencyMs,
    };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Gemini call timed out after ${timeoutMs}ms`);
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
  banner("PromptKichBan — Gemini Live Verification (Phase 3B.1)");

  // ── 1. Read & audit env config ──
  const env = getPromptKichBanEnv();
  const requestId = randomUUID();

  console.log("\n[1/5] Environment Audit");
  console.log(`  PROMPTKICHBAN_AI_PROVIDER env: ${process.env.PROMPTKICHBAN_AI_PROVIDER ?? "(unset)"}`);
  console.log(`  AI_PROVIDER env:              ${process.env.AI_PROVIDER ?? "(unset)"}`);
  console.log(`  Resolved provider:            ${env.provider}`);
  console.log(`  Resolved model:               ${env.model}`);
  console.log(`  Timeout:                      ${env.timeoutMs} ms`);
  console.log(`  Max retries:                  ${env.maxRetries}`);
  console.log(`  GEMINI_API_KEY present:       ${env.apiKey ? "YES (" + maskKey(env.apiKey) + ")" : "NO"}`);

  // ── 2. Determine if we can do a live call ──
  const isGeminiProvider = env.provider === "gemini";
  const hasApiKey = Boolean(env.apiKey);

  if (!hasApiKey) {
    console.log("\n[2/5] Gemini API Key Status");
    console.log("  ⚠ GEMINI_API_KEY is not configured in .env.local.");
    console.log("  The service layer would silently fall back to deterministic mock.");
    console.log("  To test Gemini live, add to .env.local:");
    console.log("    PROMPTKICHBAN_AI_PROVIDER=gemini");
    console.log("    GEMINI_API_KEY=AIzaSy...");

    banner("Result");
    kv("GEMINI_LIVE_STATUS", "SKIPPED");
    kv("GEMINI_LIVE_REASON", "NO_API_KEY");
    kv("GEMINI_MODEL", env.model ?? "n/a");
    kv("GEMINI_REQUEST_ID", requestId);
    kv("GEMINI_LATENCY_MS", 0);
    console.log();
    process.exit(0);
  }

  if (!isGeminiProvider) {
    console.log(`\n[2/5] Provider mismatch: resolved provider is "${env.provider}", not "gemini".`);
    console.log("  To test Gemini live, set PROMPTKICHBAN_AI_PROVIDER=gemini in .env.local.");

    banner("Result");
    kv("GEMINI_LIVE_STATUS", "SKIPPED");
    kv("GEMINI_LIVE_REASON", `PROVIDER_IS_${env.provider.toUpperCase()}`);
    kv("GEMINI_MODEL", env.model ?? "n/a");
    kv("GEMINI_REQUEST_ID", requestId);
    kv("GEMINI_LATENCY_MS", 0);
    console.log();
    process.exit(0);
  }

  // ── 3. Build prompts (same as service.ts live path) ──
  console.log("\n[2/5] Building prompts for live Gemini call...");
  const systemPrompt = `You are an elite Hollywood visual director, TikTok viral producer, and AI prompt engineer for state-of-the-art video models (Google Veo 3, xAI Grok, ByteDance Seedance 2.5, Tencent Muse).
Generate a structured video storyboard and script in JSON format.
Strict requirements:
1. Total duration must be exactly ${SAMPLE_INPUT.durationSeconds} seconds.
2. The scenes array must be contiguous from second 0 to ${SAMPLE_INPUT.durationSeconds} without any gaps or overlaps.
3. Write high-quality Vietnamese voiceover and captions tailored to the topic.
4. Output valid JSON matching the schema with all required fields. Never include markdown code fences.
5. Each scene must have: sceneNumber, startSecond, endSecond, scenePurpose, visualDescription, setting, subject, cameraShot, cameraMovement, lensAndDepth, lighting, action, voiceover, onScreenText, soundDesign, transition, prompt, negativePrompt.
6. Top-level fields: title, summary, contentType, visualStyle, publishingPlatform, promptModel, aspectRatio, durationSeconds, tone, targetAudience, hook, scenes, voiceoverFull, cta, caption, hashtags, warnings, missingInformation, generatedAt, requestId.`;

  const userPrompt = JSON.stringify({
    inputData: SAMPLE_INPUT,
    requestId,
  });

  // ── 4. Make the DIRECT HTTP call to Gemini ──
  console.log("\n[3/5] Calling Gemini API directly (NOT via service mock fallback)...");
  console.log(`  URL: https://generativelanguage.googleapis.com/v1beta/models/${env.model}:generateContent`);
  console.log(`  Key: ${maskKey(env.apiKey)}`);

  let result: GeminiDirectResult;
  try {
    result = await callGeminiDirect(
      env.apiKey!,
      env.model!,
      systemPrompt,
      userPrompt,
      env.timeoutMs
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Gemini direct HTTP call FAILED: ${msg}`);

    banner("Result");
    kv("GEMINI_LIVE_STATUS", "FAIL");
    kv("GEMINI_LIVE_ERROR", msg.slice(0, 200));
    kv("GEMINI_MODEL", env.model ?? "n/a");
    kv("GEMINI_REQUEST_ID", requestId);
    kv("GEMINI_LATENCY_MS", 0);
    console.log();
    process.exit(1);
  }

  console.log(`  ✅ HTTP 200 received in ${result.latencyMs} ms`);
  console.log(`  finishReason: ${result.finishReason}`);
  console.log(`  promptTokens: ${result.promptTokens ?? "n/a"}`);
  console.log(`  candidateTokens: ${result.candidateTokens ?? "n/a"}`);
  console.log(`  rawText length: ${result.rawText.length} chars`);

  // ── 5. Parse & validate the response against Zod schemas ──
  console.log("\n[4/5] Parsing Gemini JSON response & validating schema...");

  let parsed: unknown;
  try {
    const cleaned = result.rawText
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error("  ❌ Gemini returned invalid JSON:");
    console.error("  First 500 chars:", result.rawText.slice(0, 500));

    banner("Result");
    kv("GEMINI_LIVE_STATUS", "FAIL");
    kv("GEMINI_LIVE_ERROR", "INVALID_JSON_FROM_GEMINI");
    kv("GEMINI_MODEL", env.model ?? "n/a");
    kv("GEMINI_REQUEST_ID", requestId);
    kv("GEMINI_LATENCY_MS", result.latencyMs);
    console.log();
    process.exit(1);
  }

  // Validate raw schema (before temporal normalization)
  const rawResult = rawVideoPromptOutputSchema.safeParse(parsed);
  if (!rawResult.success) {
    console.error("  ❌ Raw schema validation failed:");
    rawResult.error.issues.forEach((iss) =>
      console.error(`    ${iss.path.join(".")}: ${iss.message}`)
    );
    console.log("  First 800 chars of Gemini response:");
    console.log("  " + result.rawText.slice(0, 800));

    banner("Result");
    kv("GEMINI_LIVE_STATUS", "FAIL");
    kv("GEMINI_LIVE_ERROR", "RAW_SCHEMA_VALIDATION_FAILED");
    kv("GEMINI_MODEL", env.model ?? "n/a");
    kv("GEMINI_REQUEST_ID", requestId);
    kv("GEMINI_LATENCY_MS", result.latencyMs);
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
    kv("GEMINI_LIVE_STATUS", "FAIL");
    kv("GEMINI_LIVE_ERROR", "STRICT_SCHEMA_VALIDATION_FAILED");
    kv("GEMINI_MODEL", env.model ?? "n/a");
    kv("GEMINI_REQUEST_ID", requestId);
    kv("GEMINI_LATENCY_MS", result.latencyMs);
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
    kv("GEMINI_LIVE_STATUS", "FAIL");
    kv("GEMINI_LIVE_ERROR", "API_KEY_LEAKED_IN_OUTPUT");
    kv("GEMINI_MODEL", env.model ?? "n/a");
    kv("GEMINI_REQUEST_ID", requestId);
    kv("GEMINI_LATENCY_MS", result.latencyMs);
    console.log();
    process.exit(1);
  }
  console.log("\n  🔒 Security: No API key leakage in output payload");

  // ── Machine-readable output ──
  banner("Result");
  kv("GEMINI_LIVE_STATUS", "PASS");
  kv("GEMINI_MODEL", env.model ?? "n/a");
  kv("GEMINI_REQUEST_ID", requestId);
  kv("GEMINI_LATENCY_MS", result.latencyMs);
  kv("GEMINI_FINISH_REASON", result.finishReason);
  kv("GEMINI_PROMPT_TOKENS", result.promptTokens ?? "n/a");
  kv("GEMINI_CANDIDATE_TOKENS", result.candidateTokens ?? "n/a");
  kv("GEMINI_SCENE_COUNT", output.scenes.length);
  kv("GEMINI_SCHEMA_VALID", "true");
  kv("GEMINI_SECURITY_CLEAN", "true");
  console.log();
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  banner("Result");
  kv("GEMINI_LIVE_STATUS", "FAIL");
  kv("GEMINI_LIVE_ERROR", err instanceof Error ? err.message.slice(0, 200) : String(err));
  console.log();
  process.exit(1);
});
