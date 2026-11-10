import "server-only";
import { randomUUID } from "node:crypto";
import type { ZodType, ZodTypeDef } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// PromptKichBan AI Config & Error Definition
// ─────────────────────────────────────────────────────────────────────────────

export type PromptKichBanErrorCode =
  | "config"
  | "timeout"
  | "rate_limit"
  | "quota"
  | "upstream"
  | "invalid_response"
  | "validation"
  | "safety"
  | "not_found"
  | "unknown";

const USER_MESSAGES: Record<PromptKichBanErrorCode, string> = {
  config: "Dịch vụ AI chưa được cấu hình đúng. Vui lòng liên hệ quản trị viên.",
  timeout: "Quá trình tạo kịch bản mất nhiều thời gian hơn dự kiến. Vui lòng thử lại sau.",
  rate_limit: "Hệ thống AI đang nhận nhiều yêu cầu. Vui lòng thử lại sau ít phút.",
  quota: "Bạn đã đạt giới hạn tạo kịch bản miễn phí trong hôm nay. Hạn mức sẽ đặt lại vào ngày mai.",
  upstream: "Không thể kết nối đến nhà cung cấp AI. Vui lòng thử lại sau.",
  invalid_response: "Kịch bản tạo ra chưa đạt chuẩn cấu trúc yêu cầu. Vui lòng thử lại.",
  validation: "Dữ liệu yêu cầu tạo kịch bản không hợp lệ.",
  safety: "Nội dung yêu cầu bị bộ lọc an toàn của AI từ chối. Vui lòng điều chỉnh từ ngữ hoặc ý tưởng và thử lại.",
  not_found: "Không tìm thấy kịch bản yêu cầu hoặc bạn không có quyền truy cập.",
  unknown: "Đã xảy ra lỗi không xác định khi tạo kịch bản.",
};

const HTTP_STATUSES: Record<PromptKichBanErrorCode, number> = {
  config: 503,
  timeout: 504,
  rate_limit: 429,
  quota: 429,
  upstream: 502,
  invalid_response: 502,
  validation: 400,
  safety: 400,
  not_found: 404,
  unknown: 500,
};

export class PromptKichBanError extends Error {
  readonly code: PromptKichBanErrorCode;
  readonly status: number;
  readonly userMessage: string;
  readonly retryable: boolean;
  readonly requestId: string;
  readonly details?: string;

  constructor(
    code: PromptKichBanErrorCode,
    options?: { cause?: unknown; details?: string; requestId?: string }
  ) {
    super(`PromptKichBanError(${code})`, options?.cause ? { cause: options.cause } : undefined);
    this.name = "PromptKichBanError";
    this.code = code;
    this.status = HTTP_STATUSES[code] ?? 500;
    this.userMessage = USER_MESSAGES[code] ?? USER_MESSAGES.unknown;
    this.retryable = code === "timeout" || code === "rate_limit" || code === "upstream";
    this.requestId = options?.requestId ?? randomUUID();
    this.details = options?.details;
  }

  toJSON() {
    return {
      error: this.userMessage,
      code: this.code,
      retryable: this.retryable,
      requestId: this.requestId,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Environment Resolution (Server-Only)
// ─────────────────────────────────────────────────────────────────────────────

export interface PromptKichBanEnv {
  provider: "mock" | "openai" | "anthropic" | "gemini" | "vietapi";
  model?: string;
  baseUrl?: string;
  timeoutMs: number;
  maxRetries: number;
  dailyIpLimit: number;
  maxInputLength: number;
  apiKey: string | null;
}

export interface AiExecutionMeta {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  model?: string;
  latencyMs?: number;
}

let lastExecutionMeta: AiExecutionMeta | null = null;

export function getLastAiExecutionMeta(): AiExecutionMeta | null {
  return lastExecutionMeta;
}

export function getPromptKichBanEnv(): PromptKichBanEnv {
  const provider = (
    process.env.PROMPTKICHBAN_AI_PROVIDER ||
    process.env.AI_PROVIDER ||
    "mock"
  ).toLowerCase().trim() as PromptKichBanEnv["provider"];

  let apiKey: string | null = null;
  if (provider === "openai") {
    apiKey = process.env.PROMPTKICHBAN_OPENAI_API_KEY || process.env.OPENAI_API_KEY || null;
  } else if (provider === "anthropic") {
    apiKey = process.env.PROMPTKICHBAN_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || null;
  } else if (provider === "gemini") {
    apiKey = process.env.PROMPTKICHBAN_GEMINI_API_KEY || process.env.GEMINI_API_KEY || null;
  } else if (provider === "vietapi") {
    apiKey = process.env.PROMPTKICHBAN_AI_API_KEY || null;
  }

  const rawTimeout = process.env.PROMPTKICHBAN_AI_TIMEOUT_MS || process.env.AI_TIMEOUT_MS;
  const timeoutMs = rawTimeout
    ? Math.max(1000, Math.min(120000, Number(rawTimeout) || 30000))
    : 30000;

  const rawRetries =
    process.env.PROMPTKICHBAN_AI_MAX_RETRIES !== undefined
      ? process.env.PROMPTKICHBAN_AI_MAX_RETRIES
      : process.env.AI_MAX_RETRIES;
  const maxRetries =
    rawRetries !== undefined
      ? Math.max(0, Math.min(5, Number(rawRetries) || 0))
      : 2;

  const dailyIpLimit = Number(process.env.PROMPTKICHBAN_DAILY_IP_LIMIT) || 3;
  const maxInputLength = Number(process.env.PROMPTKICHBAN_MAX_INPUT_LENGTH) || 12_000;

  const defaultModels: Record<string, string> = {
    mock: "mock",
    openai: "gpt-4o-mini",
    anthropic: "claude-3-5-sonnet-latest",
    gemini: "gemini-2.0-flash",
    vietapi: "deepseek-v4-flash",
  };

  const model =
    process.env.PROMPTKICHBAN_AI_MODEL ||
    process.env.AI_MODEL ||
    defaultModels[provider] ||
    "mock";

  // VietAPI (and other OpenAI-compatible providers) allow a custom base URL
  const baseUrl = process.env.PROMPTKICHBAN_AI_BASE_URL || undefined;

  return {
    provider,
    model,
    baseUrl,
    timeoutMs,
    maxRetries,
    dailyIpLimit,
    maxInputLength,
    apiKey,
  };
}

/**
 * Startup assertion for PromptKichBan configuration.
 * Called in instrumentation.ts to ensure production fails fast and loudly
 * if a live provider is selected without its required API key.
 */
export function assertPromptKichBanEnv(): void {
  const env = getPromptKichBanEnv();
  if (process.env.NODE_ENV === "production") {
    if (env.provider !== "mock" && !env.apiKey) {
      if (process.env.PROMPTKICHBAN_AI_ALLOW_MOCK_FALLBACK !== "true") {
        throw new Error(
          `[promptkichban] Provider "${env.provider}" is configured for production but PROMPTKICHBAN_AI_API_KEY is missing. Configure the key or set PROMPTKICHBAN_AI_ALLOW_MOCK_FALLBACK=true to allow fallback.`
        );
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP Caller with Retries, Safety & Timeout
// ─────────────────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function sanitizeErrorString(str: string): string {
  // Strip potential api keys, tokens, or email addresses
  return str
    .replace(/[a-zA-Z0-9_-]{20,}/g, (match) => `${match.slice(0, 4)}...${match.slice(-4)}`)
    .slice(0, 300);
}

async function postJson(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  timeoutMs: number
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });

    if (res.status === 429) throw new PromptKichBanError("rate_limit");
    if (res.status >= 500) {
      throw new PromptKichBanError("upstream", { details: `HTTP ${res.status}` });
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const sanitized = sanitizeErrorString(text);
      if (res.status === 401 || res.status === 403) {
        throw new PromptKichBanError("config", {
          details: `HTTP ${res.status} Authentication failed: ${sanitized}`,
        });
      }
      throw new PromptKichBanError("upstream", {
        details: `HTTP ${res.status} ${sanitized}`,
      });
    }

    return await res.json();
  } catch (err) {
    if (err instanceof PromptKichBanError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new PromptKichBanError("timeout", { cause: err });
    }
    throw new PromptKichBanError("upstream", { cause: err });
  } finally {
    clearTimeout(timer);
  }
}

function pick(obj: unknown, path: (string | number)[]): unknown {
  return path.reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key as string];
    return undefined;
  }, obj);
}

export function extractJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const start = cleaned.search(/[[{]/);
  const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  const candidate = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  try {
    return JSON.parse(candidate);
  } catch (err) {
    throw new PromptKichBanError("invalid_response", { cause: err });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Live AI Invoker
// ─────────────────────────────────────────────────────────────────────────────

async function callLiveProvider(
  systemPrompt: string,
  userPrompt: string,
  env: PromptKichBanEnv
): Promise<string> {
  if (!env.apiKey && env.provider !== "mock") {
    throw new PromptKichBanError("config", {
      details: `Provider ${env.provider} requires API key, but none is set.`,
    });
  }

  const timeout = env.timeoutMs;
  const maxTokens = 8_192;

  switch (env.provider) {
    case "openai": {
      const json = await postJson(
        "https://api.openai.com/v1/chat/completions",
        { authorization: `Bearer ${env.apiKey}` },
        {
          model: env.model,
          max_tokens: maxTokens,
          temperature: 0.7,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        },
        timeout
      );
      const text = pick(json, ["choices", 0, "message", "content"]);
      if (typeof text !== "string") throw new PromptKichBanError("invalid_response");
      return text;
    }

    case "anthropic": {
      const json = await postJson(
        "https://api.anthropic.com/v1/messages",
        { "x-api-key": env.apiKey ?? "", "anthropic-version": "2023-06-01" },
        {
          model: env.model,
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        },
        timeout
      );
      const text = pick(json, ["content", 0, "text"]);
      if (typeof text !== "string") throw new PromptKichBanError("invalid_response");
      return text;
    }

    case "gemini": {
      const json = await postJson(
        `https://generativelanguage.googleapis.com/v1beta/models/${env.model}:generateContent`,
        { "x-goog-api-key": env.apiKey ?? "" },
        {
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.7,
            responseMimeType: "application/json",
          },
        },
        timeout
      );

      // Inspect prompt-level safety block
      const promptFeedback = (json as Record<string, unknown>)?.promptFeedback as
        | { blockReason?: string }
        | undefined;
      if (promptFeedback?.blockReason) {
        throw new PromptKichBanError("safety", {
          details: `Gemini promptFeedback block: ${promptFeedback.blockReason}`,
        });
      }

      // Inspect candidate-level safety or truncation
      const candidateList = (json as Record<string, unknown>)?.candidates as
        | Array<{
            finishReason?: string;
            content?: { parts?: Array<{ text?: string }> };
          }>
        | undefined;

      const firstCandidate = candidateList?.[0];
      if (
        firstCandidate?.finishReason === "SAFETY" ||
        firstCandidate?.finishReason === "RECITATION"
      ) {
        throw new PromptKichBanError("safety", {
          details: `Gemini candidate finishReason: ${firstCandidate.finishReason}`,
        });
      }

      const text = firstCandidate?.content?.parts?.[0]?.text;
      if (typeof text !== "string" || !text.trim()) {
        throw new PromptKichBanError("invalid_response", {
          details: `Empty or malformed Gemini response (finishReason: ${firstCandidate?.finishReason || "unknown"})`,
        });
      }
      const jsonObj = json && typeof json === "object" ? (json as Record<string, unknown>) : null;
      const geminiUsage = jsonObj?.usageMetadata as Record<string, number | undefined> | undefined;
      lastExecutionMeta = {
        promptTokens: geminiUsage?.promptTokenCount ?? undefined,
        completionTokens: geminiUsage?.candidatesTokenCount ?? undefined,
        totalTokens: geminiUsage?.totalTokenCount ?? undefined,
        model: env.model,
      };
      return text;
    }

    case "vietapi": {
      // VietAPI uses OpenAI-compatible chat completions with a custom base URL
      const vietapiBaseUrl = env.baseUrl || "https://api.vietapi.tech/v1";
      const json = await postJson(
        `${vietapiBaseUrl}/chat/completions`,
        { authorization: `Bearer ${env.apiKey}` },
        {
          model: env.model,
          max_tokens: maxTokens,
          temperature: 0.7,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        },
        timeout
      );
      const text = pick(json, ["choices", 0, "message", "content"]);
      if (typeof text !== "string") throw new PromptKichBanError("invalid_response");
      const jsonObj = json && typeof json === "object" ? (json as Record<string, unknown>) : null;
      const vietUsage = jsonObj?.usage as Record<string, number | undefined> | undefined;
      lastExecutionMeta = {
        promptTokens: vietUsage?.prompt_tokens ?? undefined,
        completionTokens: vietUsage?.completion_tokens ?? undefined,
        totalTokens: vietUsage?.total_tokens ?? undefined,
        model: (typeof jsonObj?.model === "string" ? jsonObj.model : null) || env.model,
      };
      return text;
    }

    default:
      throw new PromptKichBanError("config", {
        details: `Provider ${env.provider} is not supported for live call`,
      });
  }
}

/**
 * Execute a structured chat completion with automatic retries and Zod schema validation.
 */
export async function executeAiCompletion<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: ZodType<T, ZodTypeDef, unknown>,
  requestId: string,
  preNormalize?: (raw: unknown) => unknown
): Promise<T> {
  const env = getPromptKichBanEnv();
  let lastError: PromptKichBanError = new PromptKichBanError("unknown", { requestId });

  for (let attempt = 0; attempt <= env.maxRetries; attempt++) {
    try {
      const callStart = Date.now();
      const rawText = await callLiveProvider(systemPrompt, userPrompt, env);
      if (lastExecutionMeta) {
        lastExecutionMeta.latencyMs = Date.now() - callStart;
      }
      const rawJson = extractJson(rawText);
      const candidate = preNormalize ? preNormalize(rawJson) : rawJson;
      const parsed = schema.safeParse(candidate);

      if (parsed.success) {
        return parsed.data;
      }

      lastError = new PromptKichBanError("invalid_response", {
        requestId,
        details: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      });
    } catch (err) {
      if (err instanceof PromptKichBanError) {
        lastError = err;
      } else {
        lastError = new PromptKichBanError("unknown", { cause: err, requestId });
      }

      if (!lastError.retryable && lastError.code !== "invalid_response") {
        throw lastError;
      }
    }

    if (attempt < env.maxRetries) {
      await sleep(Math.min(500 * 2 ** attempt, 4_000));
    }
  }

  throw lastError;
}
