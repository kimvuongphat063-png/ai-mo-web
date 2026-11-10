import "server-only";
import { getPromptKichBanEnv, PromptKichBanError } from "./ai";

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

/**
 * Check IP-based rate limiting for public prompt generation.
 * Limits unauthenticated requests to PROMPTKICHBAN_DAILY_IP_LIMIT per 24h per IP.
 */
export async function checkPromptKichBanRateLimit(
  clientIp: string
): Promise<{ allowed: boolean; remaining: number; resetMs: number }> {
  const env = getPromptKichBanEnv();
  const limit = env.dailyIpLimit;
  const windowMs = 24 * 60 * 60 * 1000; // 24 hours

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // 1. Upstash Redis path if configured
  if (redisUrl && redisToken) {
    try {
      const { Ratelimit } = await import("@upstash/ratelimit");
      const { Redis } = await import("@upstash/redis");

      const redis = new Redis({ url: redisUrl, token: redisToken });
      const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, "1 d"),
        analytics: false,
        prefix: "rl:promptkichban",
      });

      const res = await ratelimit.limit(clientIp);
      return {
        allowed: res.success,
        remaining: res.remaining,
        resetMs: res.reset,
      };
    } catch (err) {
      console.error("[promptkichban] Redis rate limit error:", err);
      if (process.env.NODE_ENV === "production") {
        throw new PromptKichBanError("rate_limit", { cause: err });
      }
    }
  }

  // 2. In-memory sliding window fallback (dev or single instance)
  memCleanup(windowMs);
  const now = Date.now();
  const key = `promptkb:${clientIp}`;
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
  return {
    allowed: true,
    remaining: limit - valid.length,
    resetMs: now + windowMs,
  };
}
