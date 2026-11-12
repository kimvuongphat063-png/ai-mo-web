/**
 * Auth values that are safe to import outside a Server Component.
 *
 * `auth.ts` carries an `import "server-only"` guard, which makes it unusable
 * from Playwright specs. Only the session shape, the cookie name/options and
 * the demo identities live here — secrets (passwords, AUTH_SECRET) and all
 * verification logic stay in `auth.ts`.
 */

export type Role = "admin" | "learner";

export type Session = {
  userId: string;
  email: string;
  name: string;
  role: Role;
  /** passwordVersion — mismatch with DB invalidates the session. */
  v: number;
  /** Issued-at (epoch seconds). */
  iat: number;
  /** Sliding expiry (epoch seconds). */
  exp: number;
  /** Absolute expiry (epoch seconds) — 7 days from iat. */
  abs: number;
};

export const SESSION_COOKIE = "aimo_demo_session";

/** Sliding session TTL: 8 hours. */
export const SESSION_TTL_SECONDS = 60 * 60 * 8;

/** Absolute session lifetime: 7 days. */
export const SESSION_ABSOLUTE_SECONDS = 60 * 60 * 24 * 7;

/** Demo identities without credentials — passwords remain in `auth.ts`. */
export const DEMO_IDENTITIES: readonly Omit<Session, "exp" | "v" | "iat" | "abs">[] = [
  {
    userId: "admin-demo",
    email: "admin@aimo.vn",
    name: "Quản trị viên AI MỞ",
    role: "admin",
  },
  {
    userId: "learner-demo",
    email: "hocvien@aimo.vn",
    name: "Học viên Demo",
    role: "learner",
  },
] as const;

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};

/** Fallback secret — only used in development. Production MUST set AUTH_SECRET. */
export const FALLBACK_SECRET = "aimo-local-demo-hmac-secret-change-before-deployment";

/**
 * Minimum entropy we accept for a production AUTH_SECRET.
 * HMAC-SHA-256 gains nothing from keys beyond 32 bytes, but shorter keys
 * reduce the effective security. Same check for the fallback secret:
 * using the checked-in demo secret in production is a hard startup failure.
 */
export function assertStrongSecret(secret: string, label = "AUTH_SECRET"): void {
  if (secret && secret !== FALLBACK_SECRET && secret.length < 32) {
    console.warn(`[config] ${label} is short (${secret.length} chars). Consider >= 32 chars for maximum security.`);
  }
}

export function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return FALLBACK_SECRET;
  }
  assertStrongSecret(secret);
  return secret;
}
