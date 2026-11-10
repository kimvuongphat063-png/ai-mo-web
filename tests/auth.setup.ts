import {
  DEMO_IDENTITIES,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  SESSION_ABSOLUTE_SECONDS,
  sessionCookieOptions,
} from "@/lib/auth-shared";
import { createSignedValue } from "@/lib/signing";
import type { Role, Session } from "@/lib/auth-shared";

/**
 * Create an authenticated session cookie for Playwright tests.
 * Uses the demo learner account by default.
 *
 * Imports from `auth-shared` rather than `auth` because the latter carries an
 * `import "server-only"` guard that cannot be loaded from a Playwright process.
 */
export async function createAuthCookie(role: Role = "learner") {
  const identity = DEMO_IDENTITIES.find((acc) => acc.role === role);
  if (!identity) throw new Error(`No demo account found for role: ${role}`);

  const secret = process.env.AUTH_SECRET || "aimo-local-demo-hmac-secret-change-before-deployment";

  const now = Math.floor(Date.now() / 1000);
  const session: Session = {
    userId: identity.userId,
    email: identity.email,
    name: identity.name,
    role: identity.role,
    // passwordVersion must match the identity's current version: demo
    // identities verify as 0, and a freshly-created DB user has
    // passwordVersion 0 (schema default). A mismatch invalidates the session.
    v: 0,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    abs: now + SESSION_ABSOLUTE_SECONDS,
  };

  const token = await createSignedValue(session, secret);

  // Next.js writes sameSite lowercase ("lax"); Playwright's addCookies requires
  // the capitalized form. Map rather than cast — a bare cast type-checks but
  // fails at runtime with "expected one of (Strict|Lax|None)".
  const sameSiteMap = { strict: "Strict", lax: "Lax", none: "None" } as const;
  const sameSite = sameSiteMap[sessionCookieOptions.sameSite];

  return {
    name: SESSION_COOKIE,
    value: token,
    domain: "127.0.0.1",
    path: sessionCookieOptions.path,
    httpOnly: sessionCookieOptions.httpOnly,
    secure: sessionCookieOptions.secure,
    sameSite,
  };
}
