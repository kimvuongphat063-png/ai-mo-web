import { NextResponse, type NextRequest } from "next/server";

/**
 * CSRF protection via Origin/Host validation.
 *
 * Browsers send an `Origin` header on cross-origin POST/PUT/PATCH/DELETE.
 * Requests whose Origin/Referer does not match the app's own origin are
 * rejected with 403 — this is the primary defense for cookie-authenticated
 * state-changing requests alongside SameSite=Lax cookies.
 *
 * Pure and unit-testable: no request object required, only the raw headers.
 */

export const CSRF_ERROR = "CSRF validation failed";

const METHOD_CSRF = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function hostnameOf(url: string | undefined | null): string | null {
  if (!url) return null;
  try {
    // Use .hostname, not .host — .host includes the port ("localhost:3000"),
    // which would never match the port-stripped expected host and would 403
    // every same-origin request on a non-default port.
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function allowedHosts(env: NodeJS.ProcessEnv = process.env): Set<string> {
  const hosts = new Set<string>();
  if (env.APP_URL) hosts.add(hostnameOf(env.APP_URL) ?? "");
  if (env.ALLOWED_ORIGINS) {
    for (const raw of env.ALLOWED_ORIGINS.split(",")) {
      const h = hostnameOf(raw.trim());
      if (h) hosts.add(h);
    }
  }
  return hosts;
}

/**
 * Validate that a mutation request originates from our own origin.
 *
 * @returns `{ ok: true }` or `{ ok: false }` — never throws.
 */
export function isMutationOriginAllowed(opts: {
  method: string;
  host?: string | null;
  origin?: string | null;
  referer?: string | null;
  env?: NodeJS.ProcessEnv;
}): { ok: boolean; reason?: string } {
  const { method, host, origin, referer, env } = opts;
  const upper = method.toUpperCase();

  // Only state-changing methods are subject to CSRF checks.
  if (!METHOD_CSRF.has(upper)) {
    return { ok: true };
  }

  const expectedHost = host ? host.split(":")[0].toLowerCase() : null;
  const additional = allowedHosts(env);
  const originHost = hostnameOf(origin);
  const refererHost = hostnameOf(referer);

  // Trust the Origin header if present and valid.
  if (originHost) {
    if (expectedHost && originHost === expectedHost) return { ok: true };
    if (additional.has(originHost)) return { ok: true };
    return { ok: false, reason: "origin-mismatch" };
  }

  // Fall back to Referer (some proxies strip Origin).
  if (refererHost) {
    if (expectedHost && refererHost === expectedHost) return { ok: true };
    if (additional.has(refererHost)) return { ok: true };
    return { ok: false, reason: "referer-mismatch" };
  }

  // No Origin and no Referer on a mutation — most likely a scripted/client
  // request that did not come through a browser navigation. Reject to be safe.
  return { ok: false, reason: "missing-origin" };
}

/**
 * Next.js route helper: rejects cross-origin mutation requests.
 * Returns null when the request is allowed, otherwise a 403 response.
 */
export function requireSameOrigin(request: NextRequest | Request): NextResponse | null {
  const headers = request.headers;
  const method = request.method;
  const host = headers.get("host");
  const origin = headers.get("origin");
  const referer = headers.get("referer");

  const result = isMutationOriginAllowed({ method, host, origin, referer });
  if (result.ok) return null;
  return NextResponse.json({ error: CSRF_ERROR }, { status: 403 });
}
