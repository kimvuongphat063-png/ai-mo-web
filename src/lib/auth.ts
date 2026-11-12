import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { constantTimeEqual, createSignedValue, verifySignedValue } from "@/lib/signing";
import {
  DEMO_IDENTITIES,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  SESSION_ABSOLUTE_SECONDS,
  sessionCookieOptions,
  getSecret,
  type Role,
  type Session,
} from "@/lib/auth-shared";
import { verifyPassword } from "@/lib/auth-password";
import { findUserByEmail, getPasswordVersion } from "@/lib/user-store";

// Re-exported so existing `@/lib/auth` importers keep working unchanged.
export { SESSION_COOKIE, sessionCookieOptions };
export type { Role, Session };

/**
 * Demo-mode fallback hashes for the two built-in accounts.
 * These are Argon2id hashes of the known demo passwords — no plaintext.
 * Only used when DATABASE_URL is not configured (pure demo/dev mode).
 */
const DEMO_HASHES: Record<string, { hash: string; userId: string }> = {
  "admin@aimo.vn": {
    hash: "$argon2id$v=19$m=19456,t=2,p=1$O2EQNlfhaHQ3QQtFE5SXwg$lhrSIwluH0VGmjYhQSd0T7GHqbP38T1ch8+fG+TTMTw",
    userId: "admin-demo",
  },
  "hocvien@aimo.vn": {
    hash: "$argon2id$v=19$m=19456,t=2,p=1$EtJAMTXx8ST/ojqNUw7diw$HbE78L9jfHbp02OrkB4QuDLm57OMaWtD8gkX817fpME",
    userId: "learner-demo",
  },
};

export async function authenticate(email: string, password: string): Promise<{
  userId: string;
  email: string;
  name: string;
  role: Role;
  passwordVersion: number;
} | null> {
  const normalized = email.trim().toLowerCase();

  // 1. Try database first when DATABASE_URL is configured.
  if (process.env.DATABASE_URL) {
    try {
      const user = await findUserByEmail(normalized);
      if (user && user.passwordHash) {
        const valid = await verifyPassword(user.passwordHash, password);
        if (valid) {
          const identity = DEMO_IDENTITIES.find((d) => d.userId === user.id);
          return {
            userId: user.id,
            email: user.email,
            name: identity?.name ?? user.name ?? user.email,
            role: user.isAdmin ? "admin" : "learner",
            passwordVersion: user.passwordVersion,
          };
        }
      }
    } catch (dbErr) {
      console.warn("[auth] Database lookup failed, falling back to demo accounts:", dbErr);
    }
  }

  // 2. Fallback: demo-only Argon2id hashes (no DB or demo accounts).
  const entry = DEMO_HASHES[normalized];
  if (!entry) return null;
  const valid = await verifyPassword(entry.hash, password);
  if (!valid) return null;

  const identity = DEMO_IDENTITIES.find((d) => d.userId === entry.userId);
  if (!identity) return null;
  return {
    userId: identity.userId,
    email: identity.email,
    name: identity.name,
    role: identity.role,
    passwordVersion: 0,
  };
}

export function createSessionToken(account: {
  userId: string;
  email: string;
  name: string;
  role: Role;
  passwordVersion: number;
}) {
  const now = Math.floor(Date.now() / 1000);
  const session: Session = {
    userId: account.userId,
    email: account.email,
    name: account.name,
    role: account.role,
    v: account.passwordVersion,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    abs: now + SESSION_ABSOLUTE_SECONDS,
  };
  return createSignedValue(session, getSecret());
}

export async function verifySessionToken(token?: string | null): Promise<Session | null> {
  const value = verifySignedValue<Session>(token, getSecret());
  if (!value) return null;

  const now = Math.floor(Date.now() / 1000);

  // Sliding TTL check.
  if (value.exp <= now) return null;

  // Absolute lifetime check.
  if (value.abs <= now) return null;

  // Validate session identity against current user state.
  if (process.env.DATABASE_URL) {
    try {
      const currentVersion = await getPasswordVersion(value.userId);
      if (currentVersion !== null) {
        if (value.v !== currentVersion) return null; // password changed
        return value;
      }
    } catch (dbErr) {
      console.warn("[auth] getPasswordVersion error, checking fallback:", dbErr);
    }
  }

  // Demo mode (no DB or demo accounts): check against the fixed demo identities.
  const identity = DEMO_IDENTITIES.find((d) => d.userId === value.userId);
  if (!identity) return null;
  if (value.v !== 0) return null;
  if (identity.email !== value.email || identity.role !== value.role) return null;
  return value;
}

export async function getSession() {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function requirePageRole(role?: Role) {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(role === "admin" ? "/admin" : "/account/learning")}`);
  if (role && session.role !== role) redirect(session.role === "admin" ? "/admin" : "/account/learning");
  return session;
}

export async function authorizeApi(role?: Role): Promise<
  | { session: Session; error: null }
  | { session: null; error: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return { session: null, error: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }) };
  }
  if (role && session.role !== role) {
    return { session: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session, error: null };
}
