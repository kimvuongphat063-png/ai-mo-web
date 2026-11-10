import type {
  PromptKichBanInput,
  VideoScene,
  ModelPrompts,
  SceneModelPromptItem,
} from "./schema";

// ─────────────────────────────────────────────────────────────────────────────
// Shared Helpers & Negative Prompt Defaults
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_NEGATIVE_PROMPT =
  "blurry, distorted anatomy, warped hands, flickering, extra limbs, low resolution, bad lighting, watermark, text overlay artifacts, jitter, unnatural morphing, cartoonish artifacts";

function sceneDuration(scene: VideoScene): number {
  return Math.max(1, scene.endSecond - scene.startSecond);
}

function cleanText(text?: string): string {
  return (text || "").trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Google Veo 3 Compiler
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compiles a scene into an optimized prompt for Google Veo 3.
 * Veo 3 excels with cinematic bracketed syntax [Tags], explicit camera kinetics,
 * and high-fidelity temporal physics.
 */
export function buildVeoPrompt(
  scene: VideoScene,
  input: Pick<PromptKichBanInput, "visualStyle" | "aspectRatio">
): string {
  const dur = sceneDuration(scene);
  const subject = cleanText(scene.subject);
  const action = cleanText(scene.characterAction) || cleanText(scene.action);
  const facial = cleanText(scene.facialExpression);
  const emotion = cleanText(scene.emotion);
  const setting = cleanText(scene.setting);
  const cameraShot = cleanText(scene.cameraShot);
  const cameraAngle = cleanText(scene.cameraAngle) || "Eye-level";
  const cameraMovement = cleanText(scene.cameraMovement);
  const lens = cleanText(scene.lensAndDepth);
  const lighting = cleanText(scene.lighting);
  const visualStyle = cleanText(input.visualStyle);
  const continuity = cleanText(scene.continuityNotes) || cleanText(scene.transition) || "Smooth continuous motion";
  const scriptBeat = cleanText(scene.originalScriptSegment) || cleanText(scene.voiceover);
  const voContext = scriptBeat
    ? `Narrative beat: "${scriptBeat}"`
    : "Non-verbal focused sequence";
  const negative = cleanText(scene.negativePrompt) || DEFAULT_NEGATIVE_PROMPT;

  const actorDetails = [facial, emotion].filter(Boolean).join(", ");
  const actionClause = actorDetails ? `${action} (expression: ${actorDetails})` : action;

  return [
    `[Subject & Action]: ${subject}, ${actionClause}.`,
    `[Setting & Environment]: ${setting}.`,
    `[Cinematography]: ${cameraShot}, ${cameraAngle} angle, ${cameraMovement}, ${lens}.`,
    `[Lighting & Color]: ${lighting}, professional ${visualStyle} grade.`,
    `[Motion Continuity]: ${continuity}, natural realistic physics.`,
    `[Context]: ${voContext}.`,
    `[Technical Specs]: Aspect ratio ${input.aspectRatio}, duration ${dur}s, 4K resolution, 24fps photoreal cinematic render.`,
    `--no ${negative}`,
  ].join(" ");
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. xAI Grok Video Compiler
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compiles a scene into an optimized prompt for xAI Grok Video.
 * Grok Video prefers punchy, high-contrast visual narratives with explicit
 * scene dynamics and direct negative guidance.
 */
export function buildGrokPrompt(
  scene: VideoScene,
  input: Pick<PromptKichBanInput, "visualStyle" | "aspectRatio">
): string {
  const dur = sceneDuration(scene);
  const subject = cleanText(scene.subject);
  const action = cleanText(scene.characterAction) || cleanText(scene.action);
  const facial = cleanText(scene.facialExpression);
  const emotion = cleanText(scene.emotion);
  const setting = cleanText(scene.setting);
  const cameraShot = cleanText(scene.cameraShot);
  const cameraAngle = cleanText(scene.cameraAngle) || "Eye-level";
  const cameraMovement = cleanText(scene.cameraMovement);
  const lens = cleanText(scene.lensAndDepth);
  const lighting = cleanText(scene.lighting);
  const visualStyle = cleanText(input.visualStyle);
  const motion = cleanText(scene.continuityNotes) || cleanText(scene.transition) || "fluid cinematic flow";
  const scriptBeat = cleanText(scene.originalScriptSegment) || cleanText(scene.voiceover);
  const voiceContext = scriptBeat
    ? `Audio context: "${scriptBeat}"`
    : "Ambient soundscape";
  const negative = cleanText(scene.negativePrompt) || DEFAULT_NEGATIVE_PROMPT;

  const moodDetails = [facial, emotion].filter(Boolean).join(" with ");

  return [
    `High-fidelity ${visualStyle} video capture.`,
    `Subject: ${subject}${moodDetails ? ` (${moodDetails})` : ""}.`,
    `Setting: ${setting}.`,
    `Action: ${action}.`,
    `Camera: ${cameraShot} at ${cameraAngle} angle with ${cameraMovement}, ${lens}.`,
    `Lighting: ${lighting}.`,
    `Motion: ${motion}, stable camera stabilization.`,
    `Scene Purpose: ${cleanText(scene.scenePurpose)}. ${voiceContext}.`,
    `Specs: ${input.aspectRatio} format, ${dur} seconds runtime.`,
    `Negative: ${negative}.`,
  ].join(" ");
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Seedance 2.0 / 2.5 (ByteDance) Compiler
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compiles a scene into an optimized prompt for ByteDance Seedance (Jimeng).
 */
export function buildSeedancePrompt(
  scene: VideoScene,
  input: Pick<PromptKichBanInput, "visualStyle" | "aspectRatio">,
  version: "2.0" | "2.5" = "2.5"
): string {
  const dur = sceneDuration(scene);
  const subject = cleanText(scene.subject);
  const action = cleanText(scene.characterAction) || cleanText(scene.action);
  const setting = cleanText(scene.setting);
  const cameraShot = cleanText(scene.cameraShot);
  const cameraMovement = cleanText(scene.cameraMovement);
  const lens = cleanText(scene.lensAndDepth);
  const lighting = cleanText(scene.lighting);
  const visualStyle = cleanText(input.visualStyle);
  const continuity = cleanText(scene.continuityNotes) || cleanText(scene.transition) || "seamless transition";
  const voContext = cleanText(scene.originalScriptSegment) || cleanText(scene.voiceover);
  const negative = cleanText(scene.negativePrompt) || DEFAULT_NEGATIVE_PROMPT;

  if (version === "2.0") {
    return [
      `[Style]: ${visualStyle}`,
      `[Subject]: ${subject}`,
      `[Scene]: ${setting}`,
      `[Action]: ${action}`,
      `[Shot]: ${cameraShot}`,
      `[Camera Movement]: ${cameraMovement}`,
      `[Optics]: ${lens}`,
      `[Lighting]: ${lighting}`,
      `[Motion Continuity]: ${continuity}`,
      voContext ? `[Dialogue]: ${voContext}` : "",
      `[Format]: ${input.aspectRatio}, ${dur}s, ultra-detailed, Masterpiece`,
      `--neg ${negative}`,
    ]
      .filter(Boolean)
      .join(" | ");
  }

  return [
    `At [0s-${dur}s], ${subject} is in ${setting}, engaged in ${action}.`,
    `Cinematography employs a ${cameraShot} executed with a ${cameraMovement}, captured on a ${lens}.`,
    `Atmospheric ${lighting} defines the aesthetic, creating a pristine ${visualStyle} look.`,
    `Motion progression: ${continuity}. ${voContext ? `Scene voiceover: "${voContext}".` : ""}`,
    `Specs: Aspect ratio ${input.aspectRatio}, duration ${dur} seconds, hyperrealistic texture, smooth 60fps physics.`,
    `--neg ${negative}`,
  ].join(" ");
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Tencent Muse Compiler
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compiles a scene into an optimized prompt for Tencent Muse.
 */
export function buildMusePrompt(
  scene: VideoScene,
  input: Pick<PromptKichBanInput, "visualStyle" | "aspectRatio">
): string {
  const dur = sceneDuration(scene);
  const subject = cleanText(scene.subject);
  const action = cleanText(scene.characterAction) || cleanText(scene.action);
  const setting = cleanText(scene.setting);
  const cameraShot = cleanText(scene.cameraShot);
  const cameraMovement = cleanText(scene.cameraMovement);
  const lens = cleanText(scene.lensAndDepth);
  const lighting = cleanText(scene.lighting);
  const visualStyle = cleanText(input.visualStyle);
  const motionContinuity = cleanText(scene.continuityNotes) || cleanText(scene.transition) || "smooth studio pan";
  const voContext = cleanText(scene.originalScriptSegment) || cleanText(scene.voiceover);
  const negative = cleanText(scene.negativePrompt) || DEFAULT_NEGATIVE_PROMPT;

  return [
    `Commercial master shot in ${visualStyle} style.`,
    `Subject: ${subject}.`,
    `Setting: ${setting}.`,
    `Action: ${action}.`,
    `Cinematography: ${cameraShot}, ${cameraMovement}.`,
    `Optical Profile: ${lens}.`,
    `Lighting Architecture: ${lighting}.`,
    `Temporal Continuity: ${motionContinuity}.`,
    `Context: ${voContext ? `Narrative focus: "${voContext}"` : "Pure visual storytelling"}.`,
    `Parameters: ${input.aspectRatio}, ${dur}s sequence, octane render quality, 8k textures.`,
    `Negative Prompt: ${negative}.`,
  ].join(" ");
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Build Structured Model Prompts (Veo 3 & Grok Focus)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds structured model prompt objects for Google Veo 3 and xAI Grok.
 */
export function buildStructuredModelPrompts(
  scene: VideoScene,
  input: Pick<PromptKichBanInput, "visualStyle" | "aspectRatio">
): SceneModelPromptItem[] {
  return [
    {
      model: "veo3",
      prompt: buildVeoPrompt(scene, input),
      negativePrompt: cleanText(scene.negativePrompt) || DEFAULT_NEGATIVE_PROMPT,
      notes: "Google Veo 3: Cấu trúc thẻ ngoặc [Subject & Action], [Cinematography], [Lighting & Color], [Specs] với negative tags chuẩn.",
    },
    {
      model: "grok",
      prompt: buildGrokPrompt(scene, input),
      negativePrompt: cleanText(scene.negativePrompt) || DEFAULT_NEGATIVE_PROMPT,
      notes: "xAI Grok Video: Cấu trúc mô tả động thái chuyển động, độ tương phản cao, đặc tả nhịp thị giác.",
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Build All Model Prompts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates prompt variations for all supported AI video generation models.
 */
export function buildAllModelPrompts(
  scene: VideoScene,
  input: Pick<PromptKichBanInput, "visualStyle" | "aspectRatio">
): ModelPrompts {
  return {
    veo3: buildVeoPrompt(scene, input),
    grok: buildGrokPrompt(scene, input),
    seedance2: buildSeedancePrompt(scene, input, "2.0"),
    seedance25: buildSeedancePrompt(scene, input, "2.5"),
    muse: buildMusePrompt(scene, input),
  };
}
