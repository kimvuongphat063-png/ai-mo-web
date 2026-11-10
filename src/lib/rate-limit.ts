/**
 * Re-export from rate-limit-v2 for backward compatibility.
 * This module is kept for existing imports but delegates to the new implementation.
 *
 * @deprecated Import from "@/lib/rate-limit-v2" directly for new code.
 */

export { checkRateLimit, validateRateLimitConfig, POLICIES as LIMITS } from "./rate-limit-v2";
export type { RateLimitResult, PolicyName as RateLimitKey } from "./rate-limit-v2";
