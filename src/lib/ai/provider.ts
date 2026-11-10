import "server-only";
import type { ZodType, ZodTypeDef } from "zod";
import { aiEnv } from "@/lib/ai/env";
import { AiError } from "@/lib/ai/errors";

/**
 * Minimal, dependency-free chat adapter for OpenAI / Anthropic / Gemini.
 * Every provider is normalised to: (system, user) -> JSON text -> Zod parse.
 */

export interface ChatRequest {
  system: string;
  user: string;
  maxTokens?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

    if (res.status === 429) throw new AiError("rate_limit");
    if (res.status >= 500) {
      throw new AiError("upstream", { details: `HTTP ${res.status}` });
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new AiError("upstream", { details: `HTTP ${res.status} ${text.slice(0, 300)}` });
    }
    return await res.json();
  } catch (err) {
    if (err instanceof AiError) throw err;
    if (err instanceof Error && err.name === "AbortError") throw new AiError("timeout", { cause: err });
    throw new AiError("upstream", { cause: err });
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

async function callProvider(req: ChatRequest): Promise<string> {
  const env = aiEnv();
  const timeout = env.AI_TIMEOUT_MS;
  const maxTokens = req.maxTokens ?? 4_000;

  switch (env.AI_PROVIDER) {
    case "openai": {
      const json = await postJson(
        "https://api.openai.com/v1/chat/completions",
        { authorization: `Bearer ${env.apiKey}` },
        {
          model: env.AI_MODEL,
          max_tokens: maxTokens,
          temperature: 0.7,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: req.system },
            { role: "user", content: req.user },
          ],
        },
        timeout
      );
      const text = pick(json, ["choices", 0, "message", "content"]);
      if (typeof text !== "string") throw new AiError("invalid_response");
      return text;
    }

    case "anthropic": {
      const json = await postJson(
        "https://api.anthropic.com/v1/messages",
        { "x-api-key": env.apiKey ?? "", "anthropic-version": "2023-06-01" },
        {
          model: env.AI_MODEL,
          max_tokens: maxTokens,
          system: req.system,
          messages: [{ role: "user", content: req.user }],
        },
        timeout
      );
      const text = pick(json, ["content", 0, "text"]);
      if (typeof text !== "string") throw new AiError("invalid_response");
      return text;
    }

    case "gemini": {
      const json = await postJson(
        `https://generativelanguage.googleapis.com/v1beta/models/${env.AI_MODEL}:generateContent`,
        { "x-goog-api-key": env.apiKey ?? "" },
        {
          systemInstruction: { parts: [{ text: req.system }] },
          contents: [{ role: "user", parts: [{ text: req.user }] }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            responseMimeType: "application/json",
          },
        },
        timeout
      );
      const text = pick(json, ["candidates", 0, "content", "parts", 0, "text"]);
      if (typeof text !== "string") throw new AiError("invalid_response");
      return text;
    }

    default:
      throw new AiError("config", { details: `Provider ${env.AI_PROVIDER} không hỗ trợ chat` });
  }
}

/** Strip markdown fences some models still emit around JSON. */
function extractJson(text: string): unknown {
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
    throw new AiError("invalid_response", { cause: err });
  }
}

/**
 * Call the configured provider, retry transient failures with exponential
 * backoff, then validate the payload with the supplied Zod schema.
 */
export async function generateStructured<T>(
  req: ChatRequest,
  schema: ZodType<T, ZodTypeDef, unknown>
): Promise<T> {
  const env = aiEnv();
  let lastError: AiError = new AiError("unknown");

  for (let attempt = 0; attempt <= env.AI_MAX_RETRIES; attempt += 1) {
    try {
      const text = await callProvider(req);
      const parsed = schema.safeParse(extractJson(text));
      if (parsed.success) return parsed.data;
      lastError = new AiError("invalid_response", {
        details: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      });
    } catch (err) {
      lastError = err instanceof AiError ? err : new AiError("unknown", { cause: err });
      if (!lastError.retryable && lastError.code !== "invalid_response") throw lastError;
    }

    if (attempt < env.AI_MAX_RETRIES) {
      await sleep(Math.min(500 * 2 ** attempt, 4_000));
    }
  }

  throw lastError;
}
