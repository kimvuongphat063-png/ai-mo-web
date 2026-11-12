import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  const searchParams = request.nextUrl.searchParams;
  const next = searchParams.get("next") || "/apps";

  // If GOOGLE_CLIENT_ID is not configured in Vercel environment variables yet,
  // redirect with a clear and helpful notice rather than crashing.
  if (!clientId || clientId.trim() === "") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "google_oauth_pending");
    return NextResponse.redirect(loginUrl);
  }

  // Determine external host for redirect_uri — always match the URI registered in Google Console
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
  const redirectUri = isLocal
    ? `http://${host}/api/auth/google/callback`
    : "https://ai-mo-web.vercel.app/api/auth/google/callback";

  // CSRF state containing next url and random nonce
  const nonce = randomBytes(16).toString("hex");
  const statePayload = Buffer.from(JSON.stringify({ nonce, next })).toString("base64url");

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("access_type", "offline");
  googleAuthUrl.searchParams.set("prompt", "select_account");
  googleAuthUrl.searchParams.set("state", statePayload);

  const response = NextResponse.redirect(googleAuthUrl.toString());

  // Set CSRF verification cookie
  response.cookies.set("aimo_google_oauth_state", nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 15, // 15 minutes
  });

  return response;
}
