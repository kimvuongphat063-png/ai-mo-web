/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * PromptKichBan Core Backend & Engine Test Suite
 *
 * Run: node --conditions=react-server --import tsx tests/promptkichban.ts
 */

import assert from "node:assert/strict";
import {
  promptKichBanInputSchema,
  videoPromptOutputSchema,
  PromptKichBanInput,
} from "../src/lib/promptkichban/schema";
import {
  buildVeoPrompt,
  buildGrokPrompt,
  buildSeedancePrompt,
  buildMusePrompt,
  buildAllModelPrompts,
} from "../src/lib/promptkichban/prompt-templates";
import {
  generatePromptKichBan,
  regenerateScene,
  compileModelPrompts,
  normalizeTemporalBoundaries,
} from "../src/lib/promptkichban/service";
import { checkPromptKichBanRateLimit } from "../src/lib/promptkichban/rate-limit";
import {
  getPromptKichBanEnv,
  assertPromptKichBanEnv,
  PromptKichBanError,
} from "../src/lib/promptkichban/ai";
import {
  recordSafeMetric,
  getMetricsSummary,
  _resetMetricsForTesting,
} from "../src/lib/promptkichban/observability";

let passed = 0;
let failed = 0;
const failures: string[] = [];

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
    failures.push(`${name}\n${message}`);
    console.log(`  ✗ ${name}`);
  }
}

function section(name: string) {
  console.log(`\n=== ${name} ===`);
}

const validSampleInput: PromptKichBanInput = {
  inputText: "iPhone 15 Pro Max máy cũ 99% nguyên zin, pin 95%, ngoại hình đẹp không vết xước, bảo hành 12 tháng tại Anh Táo Mobile.",
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
  tone: "Hài hước, gần gũi, chân thực",
  additionalRequirements: "Nhấn mạnh bảo hành và cam kết máy zin",
};

async function run() {
  section("1. Input Schema Validation");

  await test("valid input passes validation", () => {
    const res = promptKichBanInputSchema.safeParse(validSampleInput);
    assert.equal(res.success, true);
  });

  await test("inputText < 20 chars is rejected", () => {
    const res = promptKichBanInputSchema.safeParse({
      ...validSampleInput,
      inputText: "Quá ngắn",
    });
    assert.equal(res.success, false);
    assert.ok(res.error?.issues.some((i) => i.path.includes("inputText")));
  });

  await test("duration < 15 or > 300 is rejected", () => {
    const tooShort = promptKichBanInputSchema.safeParse({
      ...validSampleInput,
      durationSeconds: 10,
    });
    assert.equal(tooShort.success, false);

    const tooLong = promptKichBanInputSchema.safeParse({
      ...validSampleInput,
      durationSeconds: 350,
    });
    assert.equal(tooLong.success, false);
  });

  await test("invalid enum value is rejected", () => {
    const invalid = promptKichBanInputSchema.safeParse({
      ...validSampleInput,
      contentType: "unknown-type" as unknown as "tvc",
    });
    assert.equal(invalid.success, false);
  });

  section("2. Output Temporal Continuity Invariants");

  await test("valid continuous scenes pass refinement", () => {
    const validOutput = {
      title: "Test Video",
      summary: "Summary test",
      contentType: "product-review" as const,
      visualStyle: "tech-cinematic" as const,
      publishingPlatform: "tiktok" as const,
      promptModel: "all" as const,
      aspectRatio: "9:16" as const,
      durationSeconds: 30,
      tone: "Friendly",
      targetAudience: "Tech lovers",
      hook: "Check this out!",
      scenes: [
        {
          sceneNumber: 1,
          startSecond: 0,
          endSecond: 10,
          scenePurpose: "Hook",
          visualDescription: "Visual 1",
          setting: "Studio",
          subject: "Phone",
          cameraShot: "Close up",
          cameraMovement: "Static",
          lensAndDepth: "35mm",
          lighting: "Studio light",
          action: "Showing phone",
          voiceover: "Hello",
          onScreenText: "Text",
          soundDesign: "SFX",
          transition: "Cut",
          prompt: "Cinematic prompt 1",
          negativePrompt: "blurry",
        },
        {
          sceneNumber: 2,
          startSecond: 10,
          endSecond: 30,
          scenePurpose: "CTA",
          visualDescription: "Visual 2",
          setting: "Studio",
          subject: "Phone",
          cameraShot: "Medium",
          cameraMovement: "Pan",
          lensAndDepth: "50mm",
          lighting: "Warm light",
          action: "Holding phone",
          voiceover: "Buy now",
          onScreenText: "Order text",
          soundDesign: "SFX 2",
          transition: "Fade",
          prompt: "Cinematic prompt 2",
          negativePrompt: "blurry",
        },
      ],
      voiceoverFull: "Hello Buy now",
      cta: "Buy now",
      caption: "Caption test",
      hashtags: ["#test", "#phone"],
      generatedAt: new Date().toISOString(),
      requestId: "test-req-1",
    };

    const res = videoPromptOutputSchema.safeParse(validOutput);
    assert.equal(res.success, true);
  });

  await test("first scene startSecond != 0 fails refinement", () => {
    const invalidOutput = {
      title: "Test Video",
      summary: "Summary test",
      contentType: "product-review" as const,
      visualStyle: "tech-cinematic" as const,
      publishingPlatform: "tiktok" as const,
      promptModel: "all" as const,
      aspectRatio: "9:16" as const,
      durationSeconds: 20,
      tone: "Friendly",
      targetAudience: "Tech",
      hook: "Hook",
      scenes: [
        {
          sceneNumber: 1,
          startSecond: 3, // INVALID: does not start at 0
          endSecond: 20,
          scenePurpose: "Hook",
          visualDescription: "Visual",
          setting: "Studio",
          subject: "Subject",
          cameraShot: "Shot",
          cameraMovement: "Movement",
          lensAndDepth: "Lens",
          lighting: "Light",
          action: "Action",
          voiceover: "Vo",
          onScreenText: "Text",
          soundDesign: "SFX",
          transition: "Cut",
          prompt: "Prompt",
          negativePrompt: "neg",
        },
      ],
      voiceoverFull: "Vo",
      cta: "Cta",
      caption: "Cap",
      hashtags: ["#tag"],
      generatedAt: new Date().toISOString(),
      requestId: "test-req-2",
    };

    const res = videoPromptOutputSchema.safeParse(invalidOutput);
    assert.equal(res.success, false);
    assert.ok(res.error?.issues.some((i) => i.message.includes("phải bắt đầu từ 0")));
  });

  await test("gap between scenes fails refinement", () => {
    const invalidOutput = {
      title: "Test Video",
      summary: "Summary test",
      contentType: "product-review" as const,
      visualStyle: "tech-cinematic" as const,
      publishingPlatform: "tiktok" as const,
      promptModel: "all" as const,
      aspectRatio: "9:16" as const,
      durationSeconds: 30,
      tone: "Friendly",
      targetAudience: "Tech",
      hook: "Hook",
      scenes: [
        {
          sceneNumber: 1,
          startSecond: 0,
          endSecond: 10,
          scenePurpose: "Hook",
          visualDescription: "Visual",
          setting: "Studio",
          subject: "Subject",
          cameraShot: "Shot",
          cameraMovement: "Movement",
          lensAndDepth: "Lens",
          lighting: "Light",
          action: "Action",
          voiceover: "Vo",
          onScreenText: "Text",
          soundDesign: "SFX",
          transition: "Cut",
          prompt: "Prompt",
          negativePrompt: "neg",
        },
        {
          sceneNumber: 2,
          startSecond: 15, // INVALID: GAP between 10s and 15s
          endSecond: 30,
          scenePurpose: "CTA",
          visualDescription: "Visual",
          setting: "Studio",
          subject: "Subject",
          cameraShot: "Shot",
          cameraMovement: "Movement",
          lensAndDepth: "Lens",
          lighting: "Light",
          action: "Action",
          voiceover: "Vo",
          onScreenText: "Text",
          soundDesign: "SFX",
          transition: "Cut",
          prompt: "Prompt",
          negativePrompt: "neg",
        },
      ],
      voiceoverFull: "Vo",
      cta: "Cta",
      caption: "Cap",
      hashtags: ["#tag"],
      generatedAt: new Date().toISOString(),
      requestId: "test-req-3",
    };

    const res = videoPromptOutputSchema.safeParse(invalidOutput);
    assert.equal(res.success, false);
    assert.ok(res.error?.issues.some((i) => i.message.includes("không liên tục")));
  });

  await test("last scene endSecond != total duration fails refinement", () => {
    const invalidOutput = {
      title: "Test Video",
      summary: "Summary test",
      contentType: "product-review" as const,
      visualStyle: "tech-cinematic" as const,
      publishingPlatform: "tiktok" as const,
      promptModel: "all" as const,
      aspectRatio: "9:16" as const,
      durationSeconds: 45, // Total duration is 45s
      tone: "Friendly",
      targetAudience: "Tech",
      hook: "Hook",
      scenes: [
        {
          sceneNumber: 1,
          startSecond: 0,
          endSecond: 30, // INVALID: ends at 30s instead of 45s
          scenePurpose: "Hook",
          visualDescription: "Visual",
          setting: "Studio",
          subject: "Subject",
          cameraShot: "Shot",
          cameraMovement: "Movement",
          lensAndDepth: "Lens",
          lighting: "Light",
          action: "Action",
          voiceover: "Vo",
          onScreenText: "Text",
          soundDesign: "SFX",
          transition: "Cut",
          prompt: "Prompt",
          negativePrompt: "neg",
        },
      ],
      voiceoverFull: "Vo",
      cta: "Cta",
      caption: "Cap",
      hashtags: ["#tag"],
      generatedAt: new Date().toISOString(),
      requestId: "test-req-4",
    };

    const res = videoPromptOutputSchema.safeParse(invalidOutput);
    assert.equal(res.success, false);
    assert.ok(res.error?.issues.some((i) => i.message.includes("Phân cảnh cuối kết thúc ở")));
  });

  section("3. Prompt Compilers for AI Video Models");

  const testScene = {
    sceneNumber: 1,
    startSecond: 0,
    endSecond: 8,
    scenePurpose: "Hero product reveal",
    visualDescription: "Pristine iPhone 15 Pro Max Natural Titanium on dark oak wood desk",
    setting: "Minimalist modern studio with ambient rim lighting",
    subject: "iPhone 15 Pro Max Natural Titanium in mint condition",
    cameraShot: "Macro extreme close-up",
    cameraMovement: "Slow orbital camera push-in",
    lensAndDepth: "50mm prime, f/1.4 shallow depth of field with cinematic bokeh",
    lighting: "Warm directional key light with soft blue fill",
    action: "Hands gently rotate device to showcase pristine matte titanium edges",
    voiceover: "Chiếc máy này thật sự quá đẹp!",
    onScreenText: "IPHONE 15 PRO MAX",
    soundDesign: "Subtle metallic whoosh SFX",
    transition: "Smooth rack focus",
    prompt: "Default prompt",
    negativePrompt: "blurry, lowres, watermark",
  };

  await test("buildVeoPrompt generates structured Veo 3 format", () => {
    const prompt = buildVeoPrompt(testScene, validSampleInput);
    assert.ok(prompt.includes("[Subject & Action]:"));
    assert.ok(prompt.includes("[Setting & Environment]:"));
    assert.ok(prompt.includes("[Cinematography]:"));
    assert.ok(prompt.includes("[Technical Specs]:"));
    assert.ok(prompt.includes("--no blurry"));
  });

  await test("buildGrokPrompt generates Grok Video format", () => {
    const prompt = buildGrokPrompt(testScene, validSampleInput);
    assert.ok(prompt.includes("High-fidelity"));
    assert.ok(prompt.includes("Subject:"));
    assert.ok(prompt.includes("Camera:"));
    assert.ok(prompt.includes("Negative:"));
  });

  await test("buildSeedancePrompt generates 2.0 tag format and 2.5 natural format", () => {
    const prompt20 = buildSeedancePrompt(testScene, validSampleInput, "2.0");
    assert.ok(prompt20.includes("[Subject]:"));
    assert.ok(prompt20.includes("[Scene]:"));
    assert.ok(prompt20.includes("--neg"));

    const prompt25 = buildSeedancePrompt(testScene, validSampleInput, "2.5");
    assert.ok(prompt25.includes("At [0s-8s]"));
    assert.ok(prompt25.includes("Cinematography employs"));
    assert.ok(prompt25.includes("--neg"));
  });

  await test("buildMusePrompt generates Tencent Muse format", () => {
    const prompt = buildMusePrompt(testScene, validSampleInput);
    assert.ok(prompt.includes("Commercial master shot"));
    assert.ok(prompt.includes("Subject:"));
    assert.ok(prompt.includes("Cinematography:"));
    assert.ok(prompt.includes("Negative Prompt:"));
  });

  await test("buildAllModelPrompts returns prompts for all models", () => {
    const all = buildAllModelPrompts(testScene, validSampleInput);
    assert.ok(all.veo3 && all.veo3.length > 20);
    assert.ok(all.grok && all.grok.length > 20);
    assert.ok(all.seedance2 && all.seedance2.length > 20);
    assert.ok(all.seedance25 && all.seedance25.length > 20);
    assert.ok(all.muse && all.muse.length > 20);
  });

  section("4. Prompt Generation Service & Deterministic Mock");

  await test("generatePromptKichBan produces valid structured output in mock mode", async () => {
    const output = await generatePromptKichBan(validSampleInput);
    assert.ok(output.title);
    assert.ok(output.scenes.length >= 3);
    assert.equal(output.durationSeconds, 30);
    assert.equal(output.scenes[0].startSecond, 0);
    assert.equal(output.scenes[output.scenes.length - 1].endSecond, 30);
    assert.ok(output.requestId);
  });

  await test("mock generator is strictly deterministic for identical inputs", async () => {
    const output1 = await generatePromptKichBan(validSampleInput);
    const output2 = await generatePromptKichBan(validSampleInput);

    assert.equal(output1.scenes.length, output2.scenes.length);
    for (let i = 0; i < output1.scenes.length; i++) {
      assert.equal(output1.scenes[i].startSecond, output2.scenes[i].startSecond);
      assert.equal(output1.scenes[i].endSecond, output2.scenes[i].endSecond);
      assert.equal(output1.scenes[i].subject, output2.scenes[i].subject);
      assert.equal(output1.scenes[i].action, output2.scenes[i].action);
      assert.equal(output1.scenes[i].cameraShot, output2.scenes[i].cameraShot);
      assert.equal(output1.scenes[i].voiceover, output2.scenes[i].voiceover);
    }
  });

  await test("regenerateScene updates chosen scene while preserving continuity", async () => {
    const output = await generatePromptKichBan(validSampleInput);
    const sceneToUpdate = 2;
    const oldScene = output.scenes[sceneToUpdate - 1];

    const updated = regenerateScene(output, sceneToUpdate, {
      customNotes: "Góc quay từ trên xuống flatlay",
    });

    const newScene = updated.scenes[sceneToUpdate - 1];
    assert.equal(newScene.sceneNumber, oldScene.sceneNumber);
    assert.equal(newScene.startSecond, oldScene.startSecond);
    assert.equal(newScene.endSecond, oldScene.endSecond);
    assert.ok(newScene.visualDescription.includes("flatlay"));
  });

  await test("compileModelPrompts switches default prompt to selected model", async () => {
    const output = await generatePromptKichBan(validSampleInput);
    const veoOutput = compileModelPrompts(output, "veo3");
    assert.equal(veoOutput.promptModel, "veo3");
    assert.ok(veoOutput.scenes[0].prompt.includes("[Subject & Action]:"));

    const grokOutput = compileModelPrompts(output, "grok");
    assert.equal(grokOutput.promptModel, "grok");
    assert.ok(grokOutput.scenes[0].prompt.includes("High-fidelity"));
  });

  section("5. Rate Limiting for Public IP");

  await test("in-memory rate limiter allows requests up to limit and blocks beyond", async () => {
    const testIp = `test-ip-${Date.now()}`;
    // Default limit is 3 requests per 24 hours
    const r1 = await checkPromptKichBanRateLimit(testIp);
    assert.equal(r1.allowed, true);
    assert.equal(r1.remaining, 2);

    const r2 = await checkPromptKichBanRateLimit(testIp);
    assert.equal(r2.allowed, true);
    assert.equal(r2.remaining, 1);

    const r3 = await checkPromptKichBanRateLimit(testIp);
    assert.equal(r3.allowed, true);
    assert.equal(r3.remaining, 0);

    const r4 = await checkPromptKichBanRateLimit(testIp);
    assert.equal(r4.allowed, false);
    assert.equal(r4.remaining, 0);
    assert.ok(r4.resetMs > Date.now());
  });

  section("6. Live AI Hardening & Temporal Boundary Normalization (Phase 3B)");

  await test("normalizeTemporalBoundaries heals gaps, overlaps and duration mismatches", () => {
    const rawJitteryScenes = [
      {
        sceneNumber: 1,
        startSecond: 1, // Invalid start
        endSecond: 6,
        scenePurpose: "Hook",
        visualDescription: "Visual",
        setting: "Studio",
        subject: "Subject",
        cameraShot: "Close-up",
        cameraMovement: "Static",
        lensAndDepth: "35mm",
        lighting: "Studio",
        action: "Action",
        voiceover: "Voice",
        onScreenText: "Text",
        soundDesign: "SFX",
        transition: "Cut",
        prompt: "Prompt",
        negativePrompt: "",
      },
      {
        sceneNumber: 2,
        startSecond: 8, // Gap from 6 to 8
        endSecond: 15,
        scenePurpose: "Detail",
        visualDescription: "Visual",
        setting: "Studio",
        subject: "Subject",
        cameraShot: "Close-up",
        cameraMovement: "Static",
        lensAndDepth: "35mm",
        lighting: "Studio",
        action: "Action",
        voiceover: "Voice",
        onScreenText: "Text",
        soundDesign: "SFX",
        transition: "Cut",
        prompt: "Prompt",
        negativePrompt: "",
      },
      {
        sceneNumber: 3,
        startSecond: 17, // Gap from 15 to 17
        endSecond: 28, // Ends at 28 instead of 30
        scenePurpose: "CTA",
        visualDescription: "Visual",
        setting: "Studio",
        subject: "Subject",
        cameraShot: "Close-up",
        cameraMovement: "Static",
        lensAndDepth: "35mm",
        lighting: "Studio",
        action: "Action",
        voiceover: "Voice",
        onScreenText: "Text",
        soundDesign: "SFX",
        transition: "Cut",
        prompt: "Prompt",
        negativePrompt: "",
      },
    ];

    const normalized = normalizeTemporalBoundaries(rawJitteryScenes as any, 30);
    assert.equal(normalized.length, 3);
    assert.equal(normalized[0].startSecond, 0, "Scene 0 must start at 0");
    assert.equal(normalized[0].endSecond, 6);
    assert.equal(normalized[1].startSecond, 6, "Scene 1 start must match Scene 0 end");
    assert.equal(normalized[1].endSecond, 15);
    assert.equal(normalized[2].startSecond, 15, "Scene 2 start must match Scene 1 end");
    assert.equal(normalized[2].endSecond, 30, "Scene 2 end must match total duration 30");
  });

  await test("getPromptKichBanEnv prioritizes PROMPTKICHBAN_* over legacy AI_* vars", () => {
    const originalEnv = { ...process.env };
    try {
      process.env.AI_PROVIDER = "openai";
      process.env.PROMPTKICHBAN_AI_PROVIDER = "gemini";
      process.env.AI_MODEL = "legacy-model";
      process.env.PROMPTKICHBAN_AI_MODEL = "gemini-2.0-flash";
      process.env.AI_TIMEOUT_MS = "15000";
      process.env.PROMPTKICHBAN_AI_TIMEOUT_MS = "45000";
      process.env.AI_MAX_RETRIES = "1";
      process.env.PROMPTKICHBAN_AI_MAX_RETRIES = "3";
      process.env.GEMINI_API_KEY = "legacy-key";
      process.env.PROMPTKICHBAN_GEMINI_API_KEY = "promptkichban-key";

      const resolved = getPromptKichBanEnv();
      assert.equal(resolved.provider, "gemini");
      assert.equal(resolved.model, "gemini-2.0-flash");
      assert.equal(resolved.timeoutMs, 45000);
      assert.equal(resolved.maxRetries, 3);
      assert.equal(resolved.apiKey, "promptkichban-key");
    } finally {
      process.env = originalEnv;
    }
  });

  await test("PromptKichBanError handles safety error code correctly", () => {
    const err = new PromptKichBanError("safety", { details: "Gemini finishReason: SAFETY" });
    assert.equal(err.code, "safety");
    assert.equal(err.status, 400);
    assert.equal(err.retryable, false);
    assert.ok(err.userMessage.includes("an toàn"));
    assert.ok(err.toJSON().error.includes("an toàn"));
  });

  await test("generatePromptKichBan gracefully falls back to mock when key is missing in normal mode", async () => {
    const originalEnv = { ...process.env };
    try {
      process.env.PROMPTKICHBAN_AI_PROVIDER = "gemini";
      delete process.env.PROMPTKICHBAN_GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      delete process.env.PROMPTKICHBAN_FAIL_ON_MISSING_KEY;

      const output = await generatePromptKichBan(validSampleInput);
      assert.ok(output.title);
      assert.ok(output.scenes.length >= 3);
      assert.equal(output.durationSeconds, 30);
    } finally {
      process.env = originalEnv;
    }
  });

  await test("generatePromptKichBan fails with config error when key is missing and strict mode enabled", async () => {
    const originalEnv = { ...process.env };
    try {
      process.env.PROMPTKICHBAN_AI_PROVIDER = "gemini";
      delete process.env.PROMPTKICHBAN_GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      process.env.PROMPTKICHBAN_FAIL_ON_MISSING_KEY = "true";

      await assert.rejects(
        async () => {
          await generatePromptKichBan(validSampleInput);
        },
        (err: any) => {
          assert.equal(err.code, "config");
          return true;
        }
      );
    } finally {
      process.env = originalEnv;
    }
  });

  section("7. VietAPI OpenAI-Compatible Provider (Phase 3C)");

  await test("getPromptKichBanEnv resolves vietapi provider with base URL and API key", () => {
    const originalEnv = { ...process.env };
    try {
      process.env.PROMPTKICHBAN_AI_PROVIDER = "vietapi";
      process.env.PROMPTKICHBAN_AI_API_KEY = "vietapi-test-key-123";
      process.env.PROMPTKICHBAN_AI_BASE_URL = "https://api.vietapi.tech/v1";
      process.env.PROMPTKICHBAN_AI_MODEL = "gpt-4o-mini";

      const resolved = getPromptKichBanEnv();
      assert.equal(resolved.provider, "vietapi");
      assert.equal(resolved.apiKey, "vietapi-test-key-123");
      assert.equal(resolved.baseUrl, "https://api.vietapi.tech/v1");
      assert.equal(resolved.model, "gpt-4o-mini");
    } finally {
      process.env = originalEnv;
    }
  });

  await test("getPromptKichBanEnv uses default model for vietapi when model is unset", () => {
    const originalEnv = { ...process.env };
    try {
      process.env.PROMPTKICHBAN_AI_PROVIDER = "vietapi";
      process.env.PROMPTKICHBAN_AI_API_KEY = "vietapi-key";
      delete process.env.PROMPTKICHBAN_AI_MODEL;
      delete process.env.AI_MODEL;

      const resolved = getPromptKichBanEnv();
      assert.equal(resolved.provider, "vietapi");
      assert.equal(resolved.model, "deepseek-v4-flash");
    } finally {
      process.env = originalEnv;
    }
  });

  await test("getPromptKichBanEnv sets baseUrl to undefined when not configured", () => {
    const originalEnv = { ...process.env };
    try {
      process.env.PROMPTKICHBAN_AI_PROVIDER = "vietapi";
      process.env.PROMPTKICHBAN_AI_API_KEY = "vietapi-key";
      delete process.env.PROMPTKICHBAN_AI_BASE_URL;

      const resolved = getPromptKichBanEnv();
      assert.equal(resolved.provider, "vietapi");
      assert.equal(resolved.baseUrl, undefined);
    } finally {
      process.env = originalEnv;
    }
  });

  await test("generatePromptKichBan gracefully falls back to mock for vietapi without key", async () => {
    const originalEnv = { ...process.env };
    try {
      process.env.PROMPTKICHBAN_AI_PROVIDER = "vietapi";
      delete process.env.PROMPTKICHBAN_AI_API_KEY;
      delete process.env.PROMPTKICHBAN_FAIL_ON_MISSING_KEY;

      const output = await generatePromptKichBan(validSampleInput);
      assert.ok(output.title);
      assert.ok(output.scenes.length >= 3);
      assert.equal(output.durationSeconds, 30);
    } finally {
      process.env = originalEnv;
    }
  });

  await test("generatePromptKichBan fails in strict mode for vietapi without key", async () => {
    const originalEnv = { ...process.env };
    try {
      process.env.PROMPTKICHBAN_AI_PROVIDER = "vietapi";
      delete process.env.PROMPTKICHBAN_AI_API_KEY;
      process.env.PROMPTKICHBAN_FAIL_ON_MISSING_KEY = "true";

      await assert.rejects(
        async () => {
          await generatePromptKichBan(validSampleInput);
        },
        (err: any) => {
          assert.equal(err.code, "config");
          return true;
        }
      );
    } finally {
      process.env = originalEnv;
    }
  });

  section("8. Staging & Production Readiness Gates & Observability (Phase 5A)");

  await test("assertPromptKichBanEnv enforces live provider API key in production", () => {
    const originalEnv = { ...process.env };
    try {
      process.env.NODE_ENV = "production";
      process.env.PROMPTKICHBAN_AI_PROVIDER = "vietapi";
      delete process.env.PROMPTKICHBAN_AI_API_KEY;
      delete process.env.PROMPTKICHBAN_AI_ALLOW_MOCK_FALLBACK;

      assert.throws(
        () => {
          assertPromptKichBanEnv();
        },
        /PROMPTKICHBAN_AI_API_KEY is missing/
      );
    } finally {
      process.env = originalEnv;
    }
  });

  await test("assertPromptKichBanEnv allows mock fallback in production if feature flag enabled", () => {
    const originalEnv = { ...process.env };
    try {
      process.env.NODE_ENV = "production";
      process.env.PROMPTKICHBAN_AI_PROVIDER = "vietapi";
      delete process.env.PROMPTKICHBAN_AI_API_KEY;
      process.env.PROMPTKICHBAN_AI_ALLOW_MOCK_FALLBACK = "true";

      assert.doesNotThrow(() => {
        assertPromptKichBanEnv();
      });
    } finally {
      process.env = originalEnv;
    }
  });

  await test("generatePromptKichBan fails closed in production when live provider lacks key without fallback flag", async () => {
    const originalEnv = { ...process.env };
    try {
      process.env.NODE_ENV = "production";
      process.env.PROMPTKICHBAN_AI_PROVIDER = "vietapi";
      delete process.env.PROMPTKICHBAN_AI_API_KEY;
      delete process.env.PROMPTKICHBAN_AI_ALLOW_MOCK_FALLBACK;

      await assert.rejects(
        async () => {
          await generatePromptKichBan(validSampleInput);
        },
        (err: any) => {
          assert.equal(err.code, "config");
          return true;
        }
      );
    } finally {
      process.env = originalEnv;
    }
  });

  await test("recordSafeMetric records structured event without leaking sensitive text", () => {
    _resetMetricsForTesting();
    const event = recordSafeMetric({
      requestId: "test-req-123",
      event: "generate",
      status: "success",
      statusCode: 200,
      provider: "vietapi",
      model: "deepseek-v4-flash",
      latencyMs: 1450,
      sceneCount: 4,
      promptTokens: 450,
      completionTokens: 1200,
      totalTokens: 1650,
      quotaRemaining: 2,
    });

    assert.equal(event.requestId, "test-req-123");
    assert.equal(event.statusCode, 200);
    assert.equal(event.sceneCount, 4);

    const json = JSON.stringify(event);
    assert.equal(json.includes("apiKey"), false);
    assert.equal(json.includes("inputText"), false);
    assert.equal(json.includes("voiceoverFull"), false);
  });

  await test("getMetricsSummary correctly aggregates latency, tokens, and error breakdown", () => {
    _resetMetricsForTesting();
    recordSafeMetric({
      requestId: "req-1",
      event: "generate",
      status: "success",
      statusCode: 200,
      provider: "vietapi",
      model: "deepseek-v4-flash",
      latencyMs: 1000,
      totalTokens: 2000,
    });

    recordSafeMetric({
      requestId: "req-2",
      event: "generate",
      status: "error",
      statusCode: 429,
      provider: "vietapi",
      model: "deepseek-v4-flash",
      latencyMs: 100,
      errorCode: "quota",
    });

    const summary = getMetricsSummary();
    assert.equal(summary.totalRequests, 2);
    assert.equal(summary.successCount, 1);
    assert.equal(summary.errorCount, 1);
    assert.equal(summary.errorsByCode["quota"], 1);
    assert.equal(summary.avgLatencyMs, 550);
    assert.equal(summary.totalTokensConsumed, 2000);
  });

  section("9. Universal Video Prompt Studio & Contract Upgrades");

  await test("minimal scriptText without voice parameters passes validation", () => {
    const res = promptKichBanInputSchema.safeParse({
      scriptText: "Đây là kịch bản video ngắn chia sẻ về quy trình làm việc sáng tạo mỗi buổi sáng.",
      durationSeconds: 30,
      contentType: "storytelling",
      publishingPlatform: "reels",
      visualStyle: "lifestyle",
      performanceMode: "hands-or-POV",
    });
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.scriptText, "Đây là kịch bản video ngắn chia sẻ về quy trình làm việc sáng tạo mỗi buổi sáng.");
      assert.equal(res.data.performanceMode, "hands-or-POV");
      assert.equal(res.data.videoModel, "both");
      assert.ok(res.data.tone); // has default
    }
  });

  await test("all 8 universal presets pass input schema validation", async () => {
    const { UNIVERSAL_PRESETS } = await import("../src/lib/promptkichban/presets");
    assert.equal(UNIVERSAL_PRESETS.length, 8);
    for (const preset of UNIVERSAL_PRESETS) {
      const res = promptKichBanInputSchema.safeParse(preset);
      assert.equal(res.success, true, `Preset ${preset.id} must be valid`);
    }
  });

  await test("generator preserves originalScriptSegment across scenes in mock mode", async () => {
    const script = "Bí quyết pha một ly cold brew đậm vị tại nhà. Bước một chọn hạt arabica tươi mới. Bước hai ủ lạnh trong mười hai tiếng. Thành phẩm thơm nồng nàn.";
    const output = await generatePromptKichBan({
      scriptText: script,
      durationSeconds: 30,
      contentType: "tips",
      publishingPlatform: "tiktok",
      visualStyle: "cinematic",
      performanceMode: "hands-or-POV",
      videoModel: "both",
      aspectRatio: "9:16",
    });

    assert.ok(output.scenes.length >= 3);
    for (const scene of output.scenes) {
      assert.ok(scene.originalScriptSegment, "Each scene must preserve an originalScriptSegment");
      assert.ok(scene.prompts && scene.prompts.length >= 2, "Must contain structured prompts for Veo 3 & Grok");
      assert.ok(scene.characterAction, "Must contain characterAction");
      assert.ok(scene.cameraAngle, "Must contain cameraAngle");
    }
  });

  await test("veo3 and grok structured prompts are properly formatted", async () => {
    const output = await generatePromptKichBan({
      scriptText: "Đánh giá chi tiết mẫu tai nghe chống ồn mới nhất vừa cập bến.",
      durationSeconds: 30,
      contentType: "review",
      publishingPlatform: "shorts",
      visualStyle: "tech-cinematic",
      performanceMode: "no-person",
      videoModel: "both",
      aspectRatio: "9:16",
      seoEnabled: true,
    });

    const firstScene = output.scenes[0];
    const veoPromptItem = firstScene.prompts?.find((p) => p.model === "veo3");
    const grokPromptItem = firstScene.prompts?.find((p) => p.model === "grok");

    assert.ok(veoPromptItem, "Must have Veo 3 prompt item");
    assert.ok(veoPromptItem?.prompt.includes("[Subject & Action]:"), "Veo prompt must follow bracketed cinematic syntax");
    assert.ok(grokPromptItem, "Must have Grok prompt item");
    assert.ok(grokPromptItem?.prompt.includes("High-fidelity"), "Grok prompt must follow high-fidelity dynamic syntax");
    assert.ok(output.keywords && output.keywords.length > 0, "Keywords must be generated when seoEnabled is true");
  });

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================`);

  if (failed > 0) {
    console.error("\nFailures:");
    failures.forEach((f) => console.error(f));
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
