import { NextRequest, NextResponse } from "next/server";

const COOKIE = "aimo_demo_session";
const FALLBACK_SECRET = "aimo-local-demo-hmac-secret-change-before-deployment";
type Payload = { role?: "admin" | "learner"; exp?: number };

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function verifiedRole(token?: string): Promise<Payload["role"] | null> {
  if (!token) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;
  try {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(process.env.AUTH_SECRET || FALLBACK_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const valid = await crypto.subtle.verify("HMAC", key, decodeBase64Url(signature), new TextEncoder().encode(payload));
    if (!valid) return null;
    const value = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload))) as Payload;
    if (!value.exp || value.exp <= Math.floor(Date.now() / 1000)) return null;
    return value.role === "admin" || value.role === "learner" ? value.role : null;
  } catch { return null; }
}

export async function proxy(request: NextRequest) {
  const role = await verifiedRole(request.cookies.get(COOKIE)?.value);
  const required = request.nextUrl.pathname.startsWith("/admin") ? "admin" : "learner";
  if (!role) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  if (role !== required) return NextResponse.redirect(new URL(role === "admin" ? "/admin" : "/account/learning", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/account/:path*", "/learn/:path*"] };
