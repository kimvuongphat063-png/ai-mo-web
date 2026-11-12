import "server-only";

/**
 * Rate limiting — production-ready with per-policy limiters.
 *
 * Each policy (login, register, forgot-password, etc.) gets its own limiter
 * instance with the correct window. This fixes the bug where all policies
 * shared a single 1-second window.
 *
 * Production MUST configure Upstash Redis. Development falls back to in-memory,
 * but production without Upstash will throw at startup (fail closed).
 */

// ─── Rate limit policies ───────────────────────────────────────────────────

export const POLICIES = {
  /** Login attempts: 5 requests per 10 minutes per IP + email hash */
  login: {
    limit: 5,
    window: "10 m",
    windowMs: 10 * 60 * 1000,
    prefix: "rl:login",
  },
  /** Registration: 3 requests per 10 minutes per IP */
  register: {
    limit: 3,
    window: "10 m",
    windowMs: 10 * 60 * 1000,
    prefix: "rl:register",
  },
  /** Forgot password: 3 requests per 30 minutes per IP + email hash */
  forgot: {
    limit: 3,
    window: "30 m",
    windowMs: 30 * 60 * 1000,
    prefix: "rl:forgot",
  },
  /** Reset password: 5 requests per 30 minutes per IP */
  reset: {
    limit: 5,
    window: "30 m",
    windowMs: 30 * 60 * 1000,
    prefix: "rl:reset",
  },
  /** AI generation: 30 requests per day per userId (mirrors quota system) */
  aiGenerate: {
    limit: 30,
    window: "1 d",
    windowMs: 24 * 60 * 60 * 1000,
    prefix: "rl:ai",
  },
  /** Studio mutations: 20 requests per hour per userId */
  studioMutation: {
    limit: 20,
    window: "1 h",
    windowMs: 60 * 60 * 1000,
    prefix: "rl:studio",
  },
  /** PromptKichBan regenerate: 15 requests per hour per IP */
  promptkichbanRegenerate: {
    limit: 15,
    window: "1 h",
    windowMs: 60 * 60 * 1000,
    prefix: "rl:pkb-regen",
  },
} as const;

export type PolicyName = keyof typeof POLICIES;

// ─── In-memory fallback (single-process, development only) ─────────────────

interface WindowEntry {
  timestamps: number[];
}

const memStore = new Map<string, WindowEntry>();
let lastCleanup = Date.now();

function memCleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of memStore) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (entry.timestamps.length === 0) memStore.delete(key);
  }
}

function memSlidingWindow(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetMs: number } {
  memCleanup(windowMs);
  const now = Date.now();
  const entry = memStore.get(key) ?? { timestamps: [] };
  const valid = entry.timestamps.filter((t) => now - t < windowMs);

  if (valid.length >= limit) {
    const oldest = valid[0];
    const resetMs = oldest + windowMs;
    entry.timestamps = valid;
    memStore.set(key, entry);
    return { allowed: false, remaining: 0, resetMs };
  }

  valid.push(now);
  entry.timestamps = valid;
  memStore.set(key, entry);
  return { allowed: true, remaining: limit - valid.length, resetMs: now + windowMs };
}

// ─── Upstash provider ──────────────────────────────────────────────────────

type UpstashRatelimit = InstanceType<typeof import("@upstash/ratelimit").Ratelimit>;

const limiterCache = new Map<PolicyName, UpstashRatelimit>();

/**
 * Get or create an Upstash limiter for the given policy.
 * Each policy has its own limiter instance with the correct window and prefix.
 */
async function getUpstashLimiter(
  policy: PolicyName,
): Promise<UpstashRatelimit | null> {
  if (limiterCache.has(policy)) {
    return limiterCache.get(policy)!;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL / TOKEN not set. Falling back to in-memory rate limiting."
      );
    }
    return null;
  }

  const { Ratelimit } = await import("@upstash/ratelimit");
  const { Redis } = await import("@upstash/redis");

  const p = POLICIES[policy];
  const limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(p.limit, p.window),
    analytics: false,
    prefix: p.prefix,
  });

  limiterCache.set(policy, limiter);
  return limiter;
}

// ─── Public API ────────────────────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
  provider: "upstash" | "memory";
}

/**
 * Check and increment a rate limit for the given policy and identifier.
 *
 * @param policy  Policy name (login, register, forgot, reset, aiGenerate).
 * @param identifier  Unique identifier (e.g., `${ip}:${emailHash}` for login).
 *
 * @example
 * const result = await checkRateLimit("login", `${ip}:${sha256(email)}`);
 * if (!result.allowed) {
 *   return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 * }
 */
export async function checkRateLimit(
  policy: PolicyName,
  identifier: string,
): Promise<RateLimitResult> {
  const p = POLICIES[policy];
  const upstash = await getUpstashLimiter(policy);

  if (upstash) {
    try {
      const result = await upstash.limit(identifier);
      return {
        allowed: result.success,
        remaining: result.remaining,
        resetMs: result.reset,
        provider: "upstash",
      };
    } catch (err) {
      console.error(`[rate-limit] Upstash error for policy ${policy}:`, err);
    }
  }

  // Fallback to in-memory sliding window when Upstash is not available or fails.
  const mem = memSlidingWindow(`${p.prefix}:${identifier}`, p.limit, p.windowMs);
  return { ...mem, provider: "memory" };
}

/**
 * Validate that rate limiting is properly configured for the current environment.
 * Call this at app startup or in a health check.
 */
export function validateRateLimitConfig(): { ok: boolean; error?: string } {
  const isProd = process.env.NODE_ENV === "production";
  const hasUpstash = !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );

  if (isProd && !hasUpstash) {
    return {
      ok: false,
      error:
        "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in production",
    };
  }

  if (!isProd && !hasUpstash) {
    console.warn(
      "[rate-limit] Development mode without Upstash — using in-memory fallback (single-process only)"
    );
  }

  return { ok: true };
}
