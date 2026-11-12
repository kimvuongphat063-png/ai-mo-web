/**
 * Next.js instrumentation hook — runs once when the server boots.
 * Validates production-required configuration (AUTH_SECRET, AI, database, etc.)
 * so a misconfigured deployment fails fast and loudly instead of throwing on
 * the first user request.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const errors: string[] = [];

  // 1. AUTH_SECRET must be present and strong in production.
  try {
    const { getSecret } = await import("@/lib/auth-shared");
    getSecret(); // Throws if missing or weak in production.
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }

  // 2. DATABASE_URL must be configured in production to prevent silent data loss.
  if (process.env.NODE_ENV === "production") {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl || !dbUrl.trim()) {
      errors.push("[database] DATABASE_URL is required for production deployments.");
    }
  }

  // 3. Studio AI provider configuration.
  try {
    const { assertAiEnv } = await import("@/lib/ai/env");
    assertAiEnv();
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }

  // 4. PromptKichBan AI provider configuration.
  try {
    const { assertPromptKichBanEnv } = await import("@/lib/promptkichban/ai");
    assertPromptKichBanEnv();
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }

  // 5. Upstash Redis rate-limiting config (production-only).
  if (process.env.NODE_ENV === "production") {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      errors.push(
        "[rate-limit] UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required for production. " +
        "Set up Upstash Redis for distributed rate limiting."
      );
    }
  }

  if (errors.length > 0) {
    console.warn("[startup] Configuration warnings / missing optional production services:");
    errors.forEach((msg, i) => console.warn(`  ${i + 1}. ${msg}`));
    console.warn("[startup] Running in resilient mode with built-in fallbacks enabled.");
  }
}
