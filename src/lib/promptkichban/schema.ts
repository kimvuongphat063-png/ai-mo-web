import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Central Enums & Types — Universal Video Prompt Studio
// ─────────────────────────────────────────────────────────────────────────────

export const CONTENT_TYPES = [
  "tvc",
  "review",
  "product-review",
  "tutorial",
  "tips",
  "sales",
  "podcast",
  "storytelling",
  "education",
  "entertainment",
  "trend",
  "custom",
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const VISUAL_STYLES = [
  "cinematic",
  "tech-cinematic",
  "ugc",
  "documentary",
  "luxury",
  "clean-commercial",
  "lifestyle",
  "educational",
  "energetic-social",
  "custom",
] as const;
export type VisualStyle = (typeof VISUAL_STYLES)[number];

export const PUBLISHING_PLATFORMS = [
  "tiktok",
  "reels",
  "shorts",
  "youtube",
  "facebook",
  "custom",
] as const;
export type PublishingPlatform = (typeof PUBLISHING_PLATFORMS)[number];

export const VIDEO_MODELS = ["veo3", "grok", "both"] as const;
export type VideoModel = (typeof VIDEO_MODELS)[number];

export const PROMPT_MODELS = [
  "veo3",
  "grok",
  "both",
  "seedance-2",
  "seedance-2-5",
  "muse",
  "all",
] as const;
export type PromptModel = (typeof PROMPT_MODELS)[number];

export const ASPECT_RATIOS = ["9:16", "16:9", "1:1", "4:5"] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];

export const PERFORMANCE_MODES = [
  "no-person",
  "hands-or-POV",
  "person-no-face-focus",
  "presenter-on-camera",
  "custom",
] as const;
export type PerformanceMode = (typeof PERFORMANCE_MODES)[number];

export const PACING_OPTIONS = ["slow", "balanced", "fast"] as const;
export type PacingOption = (typeof PACING_OPTIONS)[number];

export const VOICE_GENDERS = ["male", "female", "neutral"] as const;
export type VoiceGender = (typeof VOICE_GENDERS)[number];

export const VOICE_REGIONS = ["north", "central", "south", "neutral"] as const;
export type VoiceRegion = (typeof VOICE_REGIONS)[number];

export const VOICE_AGES = ["young", "adult", "mature"] as const;
export type VoiceAge = (typeof VOICE_AGES)[number];

export const VOICE_ROLES = [
  "expert",
  "salesperson",
  "storyteller",
  "reviewer",
  "narrator",
] as const;
export type VoiceRole = (typeof VOICE_ROLES)[number];

export const SPEAKING_SPEEDS = ["slow", "normal", "fast"] as const;
export type SpeakingSpeed = (typeof SPEAKING_SPEEDS)[number];

export const EMOTIONS = [
  "energetic",
  "trustworthy",
  "friendly",
  "humorous",
  "emotional",
  "premium",
  "neutral",
] as const;
export type Emotion = (typeof EMOTIONS)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Input Schema
// ─────────────────────────────────────────────────────────────────────────────

const MAX_INPUT_CHARS = 12_000;

export const rawPromptKichBanInputSchema = z.object({
  // Primary universal input
  scriptText: z
    .string()
    .trim()
    .max(MAX_INPUT_CHARS, `Nội dung kịch bản không được vượt quá ${MAX_INPUT_CHARS} ký tự`)
    .optional(),
  // Legacy backward-compat alias
  inputText: z
    .string()
    .trim()
    .max(MAX_INPUT_CHARS, `Nội dung không được vượt quá ${MAX_INPUT_CHARS} ký tự`)
    .optional(),

  contentType: z.enum(CONTENT_TYPES).default("review"),
  visualStyle: z.enum(VISUAL_STYLES).default("cinematic"),
  publishingPlatform: z.enum(PUBLISHING_PLATFORMS).default("tiktok"),

  videoModel: z.enum(VIDEO_MODELS).default("both"),
  promptModel: z.enum(PROMPT_MODELS).default("all"),

  aspectRatio: z.enum(ASPECT_RATIOS).default("9:16"),
  durationSeconds: z
    .number()
    .int("Thời lượng phải là số nguyên")
    .min(15, "Thời lượng tối thiểu là 15 giây")
    .max(300, "Thời lượng tối đa là 300 giây")
    .default(30),

  performanceMode: z.enum(PERFORMANCE_MODES).default("hands-or-POV"),
  characterDescription: z.string().trim().max(1000).optional(),
  voiceLanguage: z.string().trim().default("vi"),
  voiceTone: z.string().trim().optional(),
  pacing: z.enum(PACING_OPTIONS).default("balanced"),
  seoEnabled: z.boolean().default(false),
  cta: z.string().trim().max(300).optional(),

  // Optional legacy voiceover parameters with defaults
  voiceGender: z.enum(VOICE_GENDERS).default("neutral").optional(),
  voiceRegion: z.enum(VOICE_REGIONS).default("south").optional(),
  voiceAge: z.enum(VOICE_AGES).default("young").optional(),
  voiceRole: z.enum(VOICE_ROLES).default("reviewer").optional(),
  speakingSpeed: z.enum(SPEAKING_SPEEDS).default("normal").optional(),
  emotion: z.enum(EMOTIONS).default("friendly").optional(),
  language: z.string().trim().default("vi").optional(),
  tone: z.string().trim().default("Tự nhiên, chân thật").optional(),
  callToAction: z.string().trim().max(300).optional(),
  additionalRequirements: z.string().trim().max(1000).optional(),
});

export const promptKichBanInputSchema = rawPromptKichBanInputSchema
  .transform((val) => {
    // Normalize scriptText and inputText aliases
    const text = (val.scriptText || val.inputText || "").trim();
    const effectiveModel = val.videoModel || (val.promptModel === "grok" ? "grok" : val.promptModel === "veo3" ? "veo3" : "both");
    const effectivePromptModel: PromptModel =
      val.promptModel || (effectiveModel === "veo3" ? "veo3" : effectiveModel === "grok" ? "grok" : "all");

    return {
      ...val,
      scriptText: text,
      inputText: text, // sync both fields
      videoModel: effectiveModel,
      promptModel: effectivePromptModel,
      tone: val.voiceTone || val.tone || "Tự nhiên, chân thật",
      callToAction: val.cta || val.callToAction,
      language: val.voiceLanguage || val.language || "vi",
    };
  })
  .superRefine((val, ctx) => {
    if (!val.scriptText || val.scriptText.length < 20) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nội dung hoặc kịch bản video phải có tối thiểu 20 ký tự",
        path: ["inputText"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nội dung hoặc kịch bản video phải có tối thiểu 20 ký tự",
        path: ["scriptText"],
      });
    }
  });

export type PromptKichBanInput = z.infer<typeof promptKichBanInputSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Output Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const modelPromptSchema = z.object({
  veo3: z.string().trim().min(1, "Veo 3 prompt không được để trống"),
  grok: z.string().trim().min(1, "Grok prompt không được để trống"),
  seedance2: z.string().trim().default(""),
  seedance25: z.string().trim().default(""),
  muse: z.string().trim().default(""),
});

export type ModelPrompts = z.infer<typeof modelPromptSchema>;

export const sceneModelPromptItemSchema = z.object({
  model: z.enum(["veo3", "grok"]),
  prompt: z.string().trim().min(1, "Prompt không được để trống"),
  negativePrompt: z.string().trim().default(""),
  notes: z.string().trim().default(""),
});

export type SceneModelPromptItem = z.infer<typeof sceneModelPromptItemSchema>;

export const videoSceneSchema = z.object({
  sceneNumber: z.number().int().min(1, "Số thứ tự cảnh phải >= 1"),
  startSecond: z.number().int().min(0, "Thời điểm bắt đầu phải >= 0"),
  endSecond: z.number().int().min(1, "Thời điểm kết thúc phải >= 1"),
  originalScriptSegment: z.string().trim().default(""),
  scenePurpose: z.string().trim().min(1, "Mục đích cảnh không được để trống"),
  visualDescription: z.string().trim().min(1, "Mô tả hình ảnh không được để trống"),
  setting: z.string().trim().min(1, "Bối cảnh không được để trống"),
  subject: z.string().trim().min(1, "Chủ thể không được để trống"),
  characterAction: z.string().trim().default(""),
  facialExpression: z.string().trim().default(""),
  emotion: z.string().trim().default(""),
  cameraShot: z.string().trim().min(1, "Góc máy không được để trống"),
  cameraAngle: z.string().trim().default("Eye-level"),
  cameraMovement: z.string().trim().min(1, "Chuyển động camera không được để trống"),
  lensAndDepth: z.string().trim().min(1, "Ống kính / độ sâu trường ảnh không được để trống"),
  lighting: z.string().trim().min(1, "Ánh sáng không được để trống"),
  action: z.string().trim().default(""),
  voiceover: z.string().trim().default(""),
  onScreenText: z.string().trim().default(""),
  soundDesign: z.string().trim().min(1, "Âm thanh / SFX không được để trống"),
  transition: z.string().trim().min(1, "Chuyển cảnh không được để trống"),
  prompt: z.string().trim().min(1, "Prompt mặc định không được để trống"),
  negativePrompt: z.string().trim().default(""),
  continuityNotes: z.string().trim().default(""),
  isLocked: z.boolean().default(false).optional(),
  modelPrompts: modelPromptSchema.optional(),
  prompts: z.array(sceneModelPromptItemSchema).optional(),
});

export type VideoScene = z.infer<typeof videoSceneSchema>;

export const rawVideoPromptOutputSchema = z.object({
  title: z.string().trim().min(1, "Tiêu đề kịch bản không được để trống"),
  summary: z.string().trim().min(1, "Tóm tắt kịch bản không được để trống"),
  contentType: z.enum(CONTENT_TYPES).default("review"),
  visualStyle: z.enum(VISUAL_STYLES).default("cinematic"),
  publishingPlatform: z.enum(PUBLISHING_PLATFORMS).default("tiktok"),
  promptModel: z.enum(PROMPT_MODELS).default("all"),
  videoModel: z.enum(VIDEO_MODELS).default("both").optional(),
  aspectRatio: z.enum(ASPECT_RATIOS).default("9:16"),
  durationSeconds: z.number().int().min(15).max(300),
  tone: z.string().trim().default("Tự nhiên, chân thật"),
  targetAudience: z.string().trim().min(1, "Đối tượng khán giả mục tiêu không được để trống"),
  hook: z.string().trim().min(1, "Câu Hook mở đầu không được để trống"),
  scenes: z.array(videoSceneSchema).min(1, "Kịch bản phải có ít nhất 1 phân cảnh"),
  voiceoverFull: z.string().trim().min(1, "Lời thoại đầy đủ không được để trống"),
  cta: z.string().trim().min(1, "Kêu gọi hành động (CTA) không được để trống"),
  caption: z.string().trim().min(1, "Nội dung caption đăng bài không được để trống"),
  keywords: z.array(z.string().trim()).default([]),
  hashtags: z.array(z.string().trim().min(1)).min(1, "Phải có ít nhất 1 hashtag"),
  modelPrompts: z.record(z.string(), z.string()).optional(),
  warnings: z.array(z.string().trim()).default([]),
  missingInformation: z.array(z.string().trim()).default([]),
  generatedAt: z.string(),
  requestId: z.string().min(1),
});

/**
 * Strict refinement enforcing temporal continuity and structural integrity:
 * 1. scenes must not be empty.
 * 2. scene[0] starts at 0.
 * 3. endSecond > startSecond for every scene.
 * 4. scenes are continuous without gaps or overlaps (scene[i].startSecond === scene[i-1].endSecond).
 * 5. last scene ends exactly at durationSeconds.
 * 6. total duration does not exceed 300 seconds.
 */
export const videoPromptOutputSchema = rawVideoPromptOutputSchema.superRefine((val, ctx) => {
  const { scenes, durationSeconds } = val;

  if (durationSeconds > 300) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Tổng thời lượng video không được vượt quá 300 giây",
      path: ["durationSeconds"],
    });
  }

  if (scenes.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Kịch bản không có phân cảnh nào",
      path: ["scenes"],
    });
    return;
  }

  if (scenes[0].startSecond !== 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Phân cảnh đầu tiên phải bắt đầu từ 0 giây (hiện tại là ${scenes[0].startSecond}s)`,
      path: ["scenes", 0, "startSecond"],
    });
  }

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];

    if (scene.endSecond <= scene.startSecond) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Phân cảnh ${scene.sceneNumber} có endSecond (${scene.endSecond}s) không lớn hơn startSecond (${scene.startSecond}s)`,
        path: ["scenes", i, "endSecond"],
      });
    }

    if (i > 0) {
      const prevScene = scenes[i - 1];
      if (scene.startSecond !== prevScene.endSecond) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Phân cảnh ${scene.sceneNumber} (${scene.startSecond}s) không liên tục với phân cảnh trước (${prevScene.endSecond}s)`,
          path: ["scenes", i, "startSecond"],
        });
      }
    }
  }

  const lastScene = scenes[scenes.length - 1];
  if (lastScene.endSecond !== durationSeconds) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Phân cảnh cuối kết thúc ở ${lastScene.endSecond}s nhưng thời lượng tổng là ${durationSeconds}s`,
      path: ["scenes", scenes.length - 1, "endSecond"],
    });
  }
});

export type VideoPromptOutput = z.infer<typeof videoPromptOutputSchema>;
