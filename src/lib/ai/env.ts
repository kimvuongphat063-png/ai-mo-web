import { z } from "zod";

/**
 * Server-side AI configuration.
 *
 * Provider API keys are read from `process.env` ONLY here and never exported to
 * the client. Nothing in this file may be imported from a "use client" module —
 * it is reachable exclusively through `@/lib/ai` (which is `server-only`).
 * The `server-only` marker is intentionally omitted so the module stays unit-testable.
 */

export const AI_PROVIDERS = ["mock", "openai", "anthropic", "gemini"] as const;
export type AiProviderName = (typeof AI_PROVIDERS)[number];

const intFromEnv = (fallback: number, min: number, max: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v.trim() === "" ? fallback : Number(v)))
    .pipe(z.number().int().min(min).max(max));

const baseSchema = z.object({
  AI_PROVIDER: z.enum(AI_PROVIDERS).default("mock"),
  AI_MODEL: z.string().trim().min(1).optional(),
  AI_TIMEOUT_MS: intFromEnv(30_000, 1_000, 120_000),
  AI_MAX_RETRIES: intFromEnv(2, 0, 5),
  AI_DAILY_LIMIT: intFromEnv(30, 1, 10_000),
  OPENAI_API_KEY: z.string().trim().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().trim().min(1).optional(),
  GEMINI_API_KEY: z.string().trim().min(1).optional(),
});

export type AiEnv = z.infer<typeof baseSchema> & { apiKey: string | null };

const DEFAULT_MODELS: Record<AiProviderName, string> = {
  mock: "mock",
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-sonnet-latest",
  gemini: "gemini-2.0-flash",
};

const KEY_BY_PROVIDER: Record<AiProviderName, keyof z.infer<typeof baseSchema> | null> = {
  mock: null,
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  gemini: "GEMINI_API_KEY",
};

export class AiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiConfigError";
  }
}

function parse(source: NodeJS.ProcessEnv = process.env): AiEnv {
  const parsed = baseSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    throw new AiConfigError(`Cấu hình AI không hợp lệ — ${issues}`);
  }

  const env = parsed.data;
  const keyName = KEY_BY_PROVIDER[env.AI_PROVIDER];
  const apiKey = keyName ? (env[keyName] as string | undefined) ?? null : null;

  if (keyName && !apiKey) {
    throw new AiConfigError(
      `AI_PROVIDER="${env.AI_PROVIDER}" nhưng thiếu biến môi trường ${keyName}.`
    );
  }

  return {
    ...env,
    AI_MODEL: env.AI_MODEL ?? DEFAULT_MODELS[env.AI_PROVIDER],
    apiKey,
  };
}

let cached: AiEnv | null = null;

/** Validated AI env. Throws AiConfigError on misconfiguration. */
export function aiEnv(): AiEnv {
  if (!cached) cached = parse();
  return cached;
}

/** Startup check — call from instrumentation so misconfig fails fast, not mid-request. */
export function assertAiEnv(): void {
  aiEnv();
}

/** Test-only: force re-read of process.env. */
export function resetAiEnvCache(): void {
  cached = null;
}

/** Safe, client-shareable summary. Never includes secrets. */
export function aiEnvPublicSummary() {
  const env = aiEnv();
  return {
    provider: env.AI_PROVIDER,
    model: env.AI_MODEL,
    timeoutMs: env.AI_TIMEOUT_MS,
    maxRetries: env.AI_MAX_RETRIES,
    dailyLimit: env.AI_DAILY_LIMIT,
    live: env.AI_PROVIDER !== "mock",
  };
}
