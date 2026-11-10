/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { createHash, randomUUID } from "node:crypto";
import {
  PromptKichBanInput,
  VideoPromptOutput,
  VideoScene,
  PromptModel,
  VideoModel,
  videoPromptOutputSchema,
  rawVideoPromptOutputSchema,
} from "./schema";
import { buildAllModelPrompts, buildStructuredModelPrompts } from "./prompt-templates";
import {
  executeAiCompletion,
  getPromptKichBanEnv,
  PromptKichBanError,
} from "./ai";

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic PRNG Helper (Seed-based, No Math.random)
// ─────────────────────────────────────────────────────────────────────────────

class SeededRandom {
  private state: number;

  constructor(seedText: string) {
    const hash = createHash("sha256").update(seedText).digest("hex");
    this.state = parseInt(hash.slice(0, 8), 16) || 123456789;
  }

  next(): number {
    // 32-bit LCG
    this.state = (1664525 * this.state + 1013904223) % 4294967296;
    return this.state / 4294967296;
  }

  pick<T>(arr: readonly T[]): T {
    const index = Math.floor(this.next() * arr.length);
    return arr[Math.min(index, arr.length - 1)];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Universal Script Beat Splitter Helper
// ─────────────────────────────────────────────────────────────────────────────

function splitScriptIntoBeats(script: string, targetCount: number): string[] {
  const clean = script.trim();
  // Split into sentences or clauses
  const rawSentences = clean
    .split(/(?<=[.!?;\n])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (rawSentences.length === 0) {
    return Array(targetCount).fill(clean);
  }

  if (rawSentences.length <= targetCount) {
    const beats: string[] = [...rawSentences];
    while (beats.length < targetCount) {
      beats.push(beats[beats.length - 1] || clean);
    }
    return beats;
  }

  // Chunk sentences into targetCount beats
  const beats: string[] = [];
  const chunkSize = Math.ceil(rawSentences.length / targetCount);
  for (let i = 0; i < targetCount; i++) {
    const start = i * chunkSize;
    const end = i === targetCount - 1 ? rawSentences.length : Math.min(start + chunkSize, rawSentences.length);
    const chunk = rawSentences.slice(start, end).join(" ");
    beats.push(chunk || rawSentences[rawSentences.length - 1]);
  }
  return beats;
}

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic Universal Mock Generator
// ─────────────────────────────────────────────────────────────────────────────

function generateDeterministicMock(
  input: PromptKichBanInput,
  requestId: string
): VideoPromptOutput {
  const scriptContent = (input.scriptText || input.inputText || "").trim();
  const seedString = `${scriptContent}|${input.durationSeconds}|${input.contentType}|${input.visualStyle}|${input.performanceMode}`;
  const rng = new SeededRandom(seedString);

  const duration = input.durationSeconds;
  let sceneCount = 4;
  if (duration <= 20) sceneCount = 3;
  else if (duration <= 45) sceneCount = 4;
  else if (duration <= 90) sceneCount = 5;
  else sceneCount = 6;

  // Compute exact contiguous time intervals summing to duration
  const baseDur = Math.floor(duration / sceneCount);
  const remainder = duration % sceneCount;

  const intervals: { start: number; end: number }[] = [];
  let currentStart = 0;
  for (let i = 0; i < sceneCount; i++) {
    const sceneDur = baseDur + (i === sceneCount - 1 ? remainder : 0);
    const end = currentStart + sceneDur;
    intervals.push({ start: currentStart, end });
    currentStart = end;
  }

  // Split original script verbatim across scenes
  const scriptBeats = splitScriptIntoBeats(scriptContent, sceneCount);
  const firstSentence = scriptContent.split(/[.\n!?]/)[0].trim() || scriptContent.slice(0, 60);

  const shotPurposes = [
    "Hook — Thu hút sự chú ý trong 3 giây đầu",
    "Problem / Context — Thiết lập bối cảnh và gợi mở vấn đề",
    "Core Value / Detail — Cận cảnh chi tiết trọng tâm và tính năng nổi bật",
    "Demonstration / Proof — Trải nghiệm thực tế và bằng chứng trực quan",
    "Benefit / Insight — Lợi ích thiết thực mang lại cho người xem",
    "CTA — Kêu gọi hành động và tương tác rõ ràng",
  ];

  const cameraShots = [
    "Extreme Close-up macro",
    "Close-up portrait",
    "Medium shot",
    "Wide environmental shot",
    "Over-the-shoulder POV shot",
    "High-angle top-down flat lay",
  ];

  const cameraAngles = [
    "Eye-level",
    "Low-angle heroic",
    "High-angle overview",
    "Slight Dutch angle",
    "Direct top-down 90-degree",
  ];

  const cameraMovements = [
    "Slow smooth push-in",
    "Gentle 45-degree orbital pan",
    "Subtle handheld movement with optical stabilization",
    "Lateral slider tracking shot",
    "Fast whip pan transition",
    "Static lock-off shot with depth focus rack",
  ];

  const lightingPresets = [
    "High-CRI cinematic diffused key light with subtle rim lighting",
    "Natural soft morning window illumination, photorealistic",
    "Commercial soft box illumination, clean balanced reflections",
    "Warm golden-hour ambient backlighting with cool shadow fill",
    "Moody low-key contrast lighting with selective focus",
  ];

  const scenes: VideoScene[] = intervals.map((interval, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === intervals.length - 1;

    const shotPurpose = isFirst
      ? shotPurposes[0]
      : isLast
      ? shotPurposes[shotPurposes.length - 1]
      : shotPurposes[Math.min(idx, shotPurposes.length - 2)];

    const cameraShot = rng.pick(cameraShots);
    const cameraAngle = rng.pick(cameraAngles);
    const cameraMovement = rng.pick(cameraMovements);
    const lighting = rng.pick(lightingPresets);

    // Performance mode aware action & subject
    let subject = `Chủ thể trọng tâm trong phân cảnh kịch bản`;
    let characterAction = "Thao tác tự nhiên tương tác với chủ thể trong bối cảnh";
    let facialExpression = "";
    let emotion = "Chân thật, tự nhiên";

    if (input.performanceMode === "no-person") {
      subject = `Sản phẩm và chi tiết vật thể trong không gian`;
      characterAction = `Góc quay đặc tả chuyển động bề mặt, texture và chi tiết quang học của vật thể`;
      facialExpression = "";
      emotion = "Chuyên nghiệp, tinh tế";
    } else if (input.performanceMode === "hands-or-POV") {
      subject = `Góc nhìn thứ nhất (POV)`;
      characterAction = `Cận cảnh hai bàn tay thao tác tỉ mỉ, cầm nắm và điều hướng vật thể trực tiếp`;
      facialExpression = "";
      emotion = "Chân thực, gần gũi";
    } else if (input.performanceMode === "person-no-face-focus") {
      subject = `Chủ thể tương tác (không lộ mặt)`;
      characterAction = `Chủ thể đứng nghiêng góc máy hoặc quay lưng, tập trung vào thao tác tay và tư thế tự nhiên`;
      facialExpression = "";
      emotion = "Tập trung, uy tín";
    } else if (input.performanceMode === "presenter-on-camera") {
      subject = input.characterDescription || `Người dẫn dắt / diễn giả`;
      characterAction = isFirst
        ? `Hướng ánh mắt tự tin về ống kính, cử chỉ tay mở tạo sự chào đón cuốn hút`
        : isLast
        ? `Nụ cười thân thiện, chỉ tay hướng về phần liên hệ và lời kêu gọi hành động`
        : `Diễn thuyết tự nhiên, kết hợp ngôn ngữ hình thể sinh động nhấn mạnh luận điểm`;
      facialExpression = isFirst ? "Hào hứng, cuốn hút" : isLast ? "Thân thiện, chân thành" : "Tập trung, thuyết phục";
      emotion = "Tự tin, truyền cảm hứng";
    }

    const scriptSegment = scriptBeats[idx] || firstSentence;
    const setting = `Không gian phù hợp phong cách ${input.visualStyle}, bố cục tối giản và sạch sẽ`;
    const onScreenText = scriptSegment.slice(0, 35).toUpperCase();

    const scene: VideoScene = {
      sceneNumber: idx + 1,
      startSecond: interval.start,
      endSecond: interval.end,
      originalScriptSegment: scriptSegment,
      scenePurpose: shotPurpose,
      visualDescription: `Cảnh quay ${input.visualStyle}: ${subject}, ${characterAction}. Ánh sáng ${lighting}.`,
      setting,
      subject,
      characterAction,
      facialExpression,
      emotion,
      cameraShot,
      cameraAngle,
      cameraMovement,
      lensAndDepth: "35mm prime lens, f/1.8 shallow depth of field, creamy bokeh",
      lighting,
      action: characterAction,
      voiceover: scriptSegment,
      onScreenText,
      soundDesign: isFirst ? "Whoosh impact SFX + upbeat electronic rhythm" : "Subtle click SFX + smooth ambient riser",
      transition: isLast ? "Fade out to outro" : "Fast whip-pan motion blur",
      prompt: `Cinematic ${input.visualStyle} shot of ${subject}, ${characterAction}, in ${setting}, ${cameraShot}, ${cameraAngle} angle, ${cameraMovement}, ${lighting}.`,
      negativePrompt: "blurry, low quality, artifacts, watermark, jitter, distorted anatomy, warped hands",
      continuityNotes: `Duy trì ánh sáng nhất quán, liên tục về trang phục và màu sắc qua các cảnh`,
      isLocked: false,
    };

    // Compile model prompts
    scene.modelPrompts = buildAllModelPrompts(scene, input);
    scene.prompts = buildStructuredModelPrompts(scene, input);
    return scene;
  });

  const voiceoverFull = scenes
    .map((s) => s.originalScriptSegment || s.voiceover)
    .filter(Boolean)
    .join(" ");

  const rawOutput = {
    title: `Kịch bản video: ${firstSentence.slice(0, 50)}`,
    summary: `Kịch bản ${input.contentType} thời lượng ${duration}s định dạng ${input.aspectRatio} cho ${input.publishingPlatform}. Phong cách ${input.visualStyle}.`,
    contentType: input.contentType,
    visualStyle: input.visualStyle,
    publishingPlatform: input.publishingPlatform,
    promptModel: input.promptModel || "all",
    videoModel: input.videoModel || "both",
    aspectRatio: input.aspectRatio,
    durationSeconds: input.durationSeconds,
    tone: input.voiceTone || input.tone || "Tự nhiên, chân thật",
    targetAudience: `Khán giả quan tâm đến nội dung ${input.contentType} trên nền tảng ${input.publishingPlatform}`,
    hook: scenes[0]?.originalScriptSegment || firstSentence,
    scenes,
    voiceoverFull,
    cta: input.cta || input.callToAction || "Theo dõi hoặc để lại bình luận để nhận thêm thông tin chi tiết!",
    caption: `${firstSentence}\n\n👉 Kịch bản và prompt video được tối ưu hóa bởi AI Mở Universal Video Prompt Studio.\n\n#AIMo #${input.publishingPlatform} #${input.contentType}`,
    keywords: input.seoEnabled
      ? [firstSentence.slice(0, 30), input.contentType, input.publishingPlatform, "kịch bản video", "prompt video"]
      : [],
    hashtags: ["#AIMo", "#VideoPromptStudio", `#${input.publishingPlatform}`, "#KichBanVideo"],
    warnings: [
      "Kịch bản xây dựng dựa trên dữ liệu bạn cung cấp; vui lòng kiểm tra tính chính xác và bản quyền trước khi sản xuất.",
    ],
    missingInformation: [
      "Nếu video có đạo cụ hoặc sản phẩm thực tế, hãy chuẩn bị trước mẫu vật để đảm bảo tính đồng nhất giữa các cảnh.",
    ],
    generatedAt: new Date().toISOString(),
    requestId,
  };

  return videoPromptOutputSchema.parse(rawOutput);
}

// ─────────────────────────────────────────────────────────────────────────────
// Service Interface & Temporal Normalization
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalizes temporal boundaries across scenes to guarantee strict continuity:
 * 1. scene[0] always starts at 0.
 * 2. scene[i].startSecond always equals scene[i-1].endSecond.
 * 3. scene[i].endSecond is always strictly greater than scene[i].startSecond.
 * 4. lastScene.endSecond always matches totalDurationSeconds.
 * 5. sceneNumber is monotonically increasing: 1, 2, ..., N.
 */
export function normalizeTemporalBoundaries(
  rawScenes: VideoScene[],
  totalDurationSeconds: number
): VideoScene[] {
  if (!rawScenes || rawScenes.length === 0) return [];

  const count = rawScenes.length;
  const duration = Math.max(totalDurationSeconds, count);

  // Clone scenes and normalize scene numbers
  const scenes: VideoScene[] = rawScenes.map((s, idx) => ({
    ...s,
    sceneNumber: idx + 1,
  }));

  // Step 1: Ensure first scene starts at 0
  scenes[0].startSecond = 0;

  // Step 2: Ensure contiguous positive-duration intervals
  for (let i = 0; i < count; i++) {
    if (i > 0) {
      scenes[i].startSecond = scenes[i - 1].endSecond;
    }
    if (scenes[i].endSecond <= scenes[i].startSecond) {
      scenes[i].endSecond = scenes[i].startSecond + 1;
    }
  }

  // Step 3: Reconcile last scene with totalDurationSeconds
  const lastIdx = count - 1;
  const currentEnd = scenes[lastIdx].endSecond;

  if (currentEnd !== duration) {
    if (duration > scenes[lastIdx].startSecond) {
      scenes[lastIdx].endSecond = duration;
    } else {
      // Redistribute evenly across all scenes
      const baseDur = Math.max(1, Math.floor(duration / count));
      const remainder = duration - baseDur * count;
      let curr = 0;
      for (let i = 0; i < count; i++) {
        const d = baseDur + (i === count - 1 ? remainder : 0);
        scenes[i].startSecond = curr;
        scenes[i].endSecond = curr + d;
        curr += d;
      }
    }
  }

  return scenes;
}

/**
 * Normalizes variations in raw LLM output shapes into a canonical shape matching rawVideoPromptOutputSchema.
 */
export function normalizeRawOutputShape(
  raw: any,
  input: PromptKichBanInput,
  requestId: string
): any {
  if (!raw || typeof raw !== "object") return raw;
  const out = { ...raw };

  const meta = out.videoMetadata || out.project;
  if (meta && typeof meta === "object") {
    out.title = out.title || meta.title;
    out.summary = out.summary || meta.summary || meta.description;
    out.contentType = out.contentType || meta.contentType || input.contentType;
    out.visualStyle = out.visualStyle || meta.visualStyle || input.visualStyle;
    out.publishingPlatform =
      out.publishingPlatform ||
      meta.publishingPlatform ||
      meta.platform ||
      input.publishingPlatform;
    out.aspectRatio = out.aspectRatio || meta.aspectRatio || input.aspectRatio;
    out.durationSeconds =
      out.durationSeconds || meta.durationSeconds || input.durationSeconds;
    out.tone = out.tone || meta.tone || input.voiceTone || input.tone;
  }

  // Normalize scenes array
  const rawSceneList = Array.isArray(out.scenes)
    ? out.scenes
    : Array.isArray(out.storyboard)
    ? out.storyboard
    : [];

  const scriptContent = (input.scriptText || input.inputText || "").trim();
  const fallbackBeats = splitScriptIntoBeats(scriptContent, Math.max(1, rawSceneList.length));

  out.scenes = rawSceneList.map((s: any, idx: number) => {
    let start = typeof s.startSecond === "number" ? s.startSecond : typeof s.startTime === "number" ? s.startTime : 0;
    let end = typeof s.endSecond === "number" ? s.endSecond : typeof s.endTime === "number" ? s.endTime : start + (s.durationSeconds || s.duration || 5);
    if (typeof s.timeRange === "string") {
      const match = s.timeRange.match(/(\d+)\D+(\d+)/);
      if (match) {
        start = Number(match[1]);
        end = Number(match[2]);
      }
    }

    const onScreenText = Array.isArray(s.onScreenText)
      ? s.onScreenText.join(" • ")
      : typeof s.onScreenText === "string"
      ? s.onScreenText
      : typeof s.text === "string"
      ? s.text
      : "";

    const voiceover =
      s.voiceover ||
      s.script ||
      s.dialogue ||
      (typeof s.voiceOver === "string" ? s.voiceOver : "") ||
      "";

    const originalScriptSegment =
      s.originalScriptSegment ||
      voiceover ||
      s.scriptBeat ||
      fallbackBeats[idx] ||
      "";

    const visual = s.visualDescription || s.visual || s.description || "Hình ảnh chi tiết phân cảnh";
    const characterAction = s.characterAction || s.action || s.motion || visual;

    return {
      sceneNumber: typeof s.sceneNumber === "number" ? s.sceneNumber : idx + 1,
      startSecond: start,
      endSecond: Math.max(start + 1, end),
      originalScriptSegment,
      scenePurpose: s.scenePurpose || s.purpose || s.goal || visual,
      visualDescription: visual,
      setting: s.setting || s.location || `Không gian quay ${input.visualStyle}`,
      subject: s.subject || s.product || "Chủ thể chính trong phân cảnh",
      characterAction,
      facialExpression: s.facialExpression || s.facial || "",
      emotion: s.emotion || "Tự nhiên",
      cameraShot: s.cameraShot || s.shot || s.shotType || "Medium shot",
      cameraAngle: s.cameraAngle || s.angle || "Eye-level",
      cameraMovement: s.cameraMovement || s.movement || s.camera || "Slow push-in",
      lensAndDepth: s.lensAndDepth || s.lens || "35mm prime, f/1.8",
      lighting: s.lighting || s.light || "Cinematic soft natural light",
      action: characterAction,
      voiceover: voiceover || originalScriptSegment,
      onScreenText,
      soundDesign: s.soundDesign || s.sound || s.audio || s.sfx || "Ambient soundscape",
      transition: s.transition || "Smooth cut",
      prompt: s.prompt || visual,
      negativePrompt: s.negativePrompt || "",
      continuityNotes: s.continuityNotes || s.continuity || "Duy trì ánh sáng và trang phục liền mạch",
      isLocked: Boolean(s.isLocked),
    };
  });

  out.title = out.title || `Kịch bản video ${input.contentType}`;
  out.summary = out.summary || `Kịch bản ${input.contentType} thời lượng ${input.durationSeconds}s`;
  out.tone = out.tone || input.voiceTone || input.tone || "Tự nhiên, chân thật";
  out.targetAudience = out.targetAudience || `Khán giả trên ${input.publishingPlatform}`;
  out.hook = out.hook || out.scenes[0]?.originalScriptSegment || out.title;
  out.voiceoverFull = out.voiceoverFull || out.scenes.map((s: any) => s.originalScriptSegment || s.voiceover).filter(Boolean).join(" ");
  out.cta = out.cta || input.cta || input.callToAction || "Theo dõi để cập nhật video mới nhất!";
  out.caption = out.caption || `${out.title}\n\n#AIMo #${input.publishingPlatform} #${input.contentType}`;
  out.hashtags = Array.isArray(out.hashtags) && out.hashtags.length > 0 ? out.hashtags : ["#AIMo", `#${input.publishingPlatform}`];
  out.keywords = Array.isArray(out.keywords) ? out.keywords : input.seoEnabled ? [input.contentType, input.publishingPlatform] : [];
  out.warnings = Array.isArray(out.warnings) ? out.warnings : [];
  out.missingInformation = Array.isArray(out.missingInformation) ? out.missingInformation : [];
  out.generatedAt = out.generatedAt || new Date().toISOString();
  out.requestId = requestId;

  return out;
}

/**
 * Validates, normalizes and applies strict Zod invariant checks on prompt output.
 */
export function validateAndNormalizeOutput(rawOutput: unknown): VideoPromptOutput {
  if (
    rawOutput &&
    typeof rawOutput === "object" &&
    "scenes" in rawOutput &&
    "durationSeconds" in rawOutput
  ) {
    const candidate = rawOutput as { scenes?: VideoScene[]; durationSeconds?: number };
    if (Array.isArray(candidate.scenes) && typeof candidate.durationSeconds === "number") {
      candidate.scenes = normalizeTemporalBoundaries(
        candidate.scenes,
        candidate.durationSeconds
      );
    }
  }

  const result = videoPromptOutputSchema.safeParse(rawOutput);
  if (!result.success) {
    const errorMessages = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new PromptKichBanError("invalid_response", {
      details: errorMessages,
    });
  }
  return result.data;
}

/**
 * Compiles model-specific prompts across all scenes according to the selected model.
 */
export function compileModelPrompts(
  output: VideoPromptOutput,
  selectedModel: PromptModel | VideoModel
): VideoPromptOutput {
  const updatedScenes = output.scenes.map((scene) => {
    const prompts = buildAllModelPrompts(scene, {
      visualStyle: output.visualStyle,
      aspectRatio: output.aspectRatio,
    });
    const structuredPrompts = buildStructuredModelPrompts(scene, {
      visualStyle: output.visualStyle,
      aspectRatio: output.aspectRatio,
    });

    const primaryPrompt =
      selectedModel === "veo3"
        ? prompts.veo3
        : selectedModel === "grok"
        ? prompts.grok
        : selectedModel === "seedance-2"
        ? prompts.seedance2
        : selectedModel === "seedance-2-5"
        ? prompts.seedance25
        : selectedModel === "muse"
        ? prompts.muse
        : scene.prompt || prompts.veo3;

    return {
      ...scene,
      modelPrompts: prompts,
      prompts: structuredPrompts,
      prompt: primaryPrompt,
    };
  });

  return {
    ...output,
    promptModel: selectedModel as PromptModel,
    videoModel: (selectedModel === "veo3" || selectedModel === "grok" ? selectedModel : "both") as VideoModel,
    scenes: updatedScenes,
  };
}

/**
 * Main generation service entry point.
 * Dispatches to deterministic mock or live AI provider based on environment.
 */
export async function generatePromptKichBan(
  input: PromptKichBanInput
): Promise<VideoPromptOutput> {
  const env = getPromptKichBanEnv();
  const requestId = randomUUID();
  const chosenModel = input.videoModel || (input.promptModel === "grok" ? "grok" : input.promptModel === "veo3" ? "veo3" : "both");

  // If mock mode is requested:
  if (env.provider === "mock") {
    const mockOutput = generateDeterministicMock(input, requestId);
    return compileModelPrompts(mockOutput, chosenModel);
  }

  // If live provider is requested but API key is missing:
  if (!env.apiKey) {
    const isStrict =
      process.env.PROMPTKICHBAN_FAIL_ON_MISSING_KEY === "true" ||
      (process.env.NODE_ENV === "production" &&
        process.env.PROMPTKICHBAN_AI_ALLOW_MOCK_FALLBACK !== "true");

    if (isStrict) {
      throw new PromptKichBanError("config", {
        details: `Nhà cung cấp "${env.provider}" yêu cầu API key, nhưng chưa được cấu hình.`,
        requestId,
      });
    }
    console.warn(
      `[PromptKichBan] Provider "${env.provider}" được chọn nhưng thiếu API key. Tự động chuyển tiếp an toàn sang deterministic mock.`
    );
    const mockOutput = generateDeterministicMock(input, requestId);
    return compileModelPrompts(mockOutput, chosenModel);
  }

  // Live provider execution — optimized for token economy & speed
  const systemPrompt = `You are a professional visual director and viral short-form video producer at AI Mở Universal Video Prompt Studio.
Analyze the user's provided script and generate a structured video storyboard and script in JSON format that matches the raw schema.

STRICT PRINCIPLES:
1. SCRIPT PRESERVATION: The user's input script is the core source of truth. Divide the script into logical beats and map them into 'originalScriptSegment' for each scene verbatim. DO NOT rewrite, paraphrase, translate, or invent false dialogue.
2. NO HALLUCINATIONS: Do not fabricate specific prices, discounts, addresses, phone numbers, or shop endorsements unless explicitly provided in the script. If details are missing, state neutral assumptions in 'missingInformation'.
3. NO DEFAULT BRANDING: This is a general-purpose tool. Do NOT assume any specific brand, mobile phone store, or phone model unless mentioned in the user script.
4. PERFORMANCE MODE: Respect '${input.performanceMode}':
   - 'no-person': Focus purely on product, macro textures, environment, graphic elements. No actors.
   - 'hands-or-POV': First-person POV, hands manipulating items, close-up details.
   - 'person-no-face-focus': Person present but framed from shoulders, over-the-shoulder, back, silhouette.
   - 'presenter-on-camera': Direct on-camera presenter, natural expressions and gestures.
5. CINEMATOGRAPHY: For each scene, specify concise visualDescription, setting, subject, characterAction, facialExpression, emotion, cameraShot, cameraAngle, cameraMovement, lensAndDepth, lighting, soundDesign, transition, and continuityNotes.
6. TIMELINE: Total duration must be exactly ${input.durationSeconds} seconds. Generate between 3 to 6 contiguous scenes from second 0 to ${input.durationSeconds} (scene[0].startSecond = 0, scene[i].startSecond = scene[i-1].endSecond, lastScene.endSecond = ${input.durationSeconds}).
7. Output ONLY a valid JSON object matching the schema. Do NOT wrap in markdown fences or add conversational text.`;

  const promptInputPayload = {
    script: input.scriptText || input.inputText,
    contentType: input.contentType,
    visualStyle: input.visualStyle,
    platform: input.publishingPlatform,
    aspectRatio: input.aspectRatio,
    durationSeconds: input.durationSeconds,
    performanceMode: input.performanceMode,
    characterDescription: input.characterDescription,
    pacing: input.pacing,
    seoEnabled: input.seoEnabled,
    cta: input.cta || input.callToAction,
    additionalRequirements: input.additionalRequirements,
  };

  const userPrompt = `Input:
${JSON.stringify(promptInputPayload)}

Instructions:
Generate the structured video storyboard and script now as a single valid JSON object matching the required schema. Output ONLY valid JSON.`;

  try {
    const rawResult = await executeAiCompletion(
      systemPrompt,
      userPrompt,
      rawVideoPromptOutputSchema,
      requestId,
      (raw) => normalizeRawOutputShape(raw, input, requestId)
    );

    const normalizedScenes = normalizeTemporalBoundaries(
      rawResult.scenes,
      input.durationSeconds
    );

    const withPrompts = {
      ...rawResult,
      durationSeconds: input.durationSeconds,
      scenes: normalizedScenes.map((scene) => ({
        ...scene,
        modelPrompts: buildAllModelPrompts(scene, input),
        prompts: buildStructuredModelPrompts(scene, input),
      })),
    };

    const validated = validateAndNormalizeOutput(withPrompts);
    return compileModelPrompts(validated, chosenModel);
  } catch (err) {
    if (err instanceof PromptKichBanError) throw err;
    throw new PromptKichBanError("unknown", { cause: err, requestId });
  }
}

/**
 * Regenerates an individual scene while strictly preserving temporal continuity.
 */
export function regenerateScene(
  output: VideoPromptOutput,
  sceneNumber: number,
  options?: { customNotes?: string }
): VideoPromptOutput {
  const sceneIndex = output.scenes.findIndex((s) => s.sceneNumber === sceneNumber);
  if (sceneIndex === -1) {
    throw new PromptKichBanError("validation", {
      details: `Không tìm thấy phân cảnh số ${sceneNumber}`,
    });
  }

  const existingScene = output.scenes[sceneIndex];
  if (existingScene.isLocked) {
    return output; // Do not modify locked scenes
  }

  const seed = `${output.requestId}|${sceneNumber}|${Date.now()}`;
  const rng = new SeededRandom(seed);

  const variations = [
    "Macro close-up shot emphasizing key product details and surface textures",
    "Dynamic smooth slow-motion tracking shot highlighting physical interactions",
    "Refined camera perspective with enhanced depth of field and soft background bokeh",
    "Presenter or subject executing precise focal action under professional cinematic lighting",
  ];

  const updatedAction = `Action refocused: ${rng.pick(variations)}`;

  const updatedScene: VideoScene = {
    ...existingScene,
    visualDescription: `${rng.pick(variations)}. ${options?.customNotes || ""}`.trim(),
    action: updatedAction,
    characterAction: updatedAction,
    cameraShot: "Dynamic Close-up",
    cameraMovement: "Subtle orbital camera tracking",
  };

  updatedScene.modelPrompts = buildAllModelPrompts(updatedScene, {
    visualStyle: output.visualStyle,
    aspectRatio: output.aspectRatio,
  });
  updatedScene.prompts = buildStructuredModelPrompts(updatedScene, {
    visualStyle: output.visualStyle,
    aspectRatio: output.aspectRatio,
  });

  const newScenes = [...output.scenes];
  newScenes[sceneIndex] = updatedScene;

  return validateAndNormalizeOutput({
    ...output,
    scenes: newScenes,
  });
}
