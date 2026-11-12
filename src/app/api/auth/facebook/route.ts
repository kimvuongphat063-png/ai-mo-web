import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

export async function GET(request: NextRequest) {
  const appId = process.env.FACEBOOK_CLIENT_ID || process.env.FACEBOOK_APP_ID;

  const searchParams = request.nextUrl.searchParams;
  const next = searchParams.get("next") || "/apps";

  // If FACEBOOK_CLIENT_ID is not configured in Vercel environment variables yet,
  // redirect with a friendly notice rather than crashing.
  if (!appId || appId.trim() === "") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "facebook_oauth_pending");
    return NextResponse.redirect(loginUrl);
  }

  // Determine external host for redirect_uri
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "ai-mo-web.vercel.app";
  const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const redirectUri = `${protocol}://${host}/api/auth/facebook/callback`;

  // CSRF state containing next url and random nonce
  const nonce = randomBytes(16).toString("hex");
  const statePayload = Buffer.from(JSON.stringify({ nonce, next })).toString("base64url");

  const facebookAuthUrl = new URL("https://www.facebook.com/v19.0/dialog/oauth");
  facebookAuthUrl.searchParams.set("client_id", appId);
  facebookAuthUrl.searchParams.set("redirect_uri", redirectUri);
  facebookAuthUrl.searchParams.set("response_type", "code");
  facebookAuthUrl.searchParams.set("scope", "email,public_profile");
  facebookAuthUrl.searchParams.set("state", statePayload);

  const response = NextResponse.redirect(facebookAuthUrl.toString());

  // Set CSRF verification cookie
  response.cookies.set("aimo_facebook_oauth_state", nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 15, // 15 minutes
  });

  return response;
}
