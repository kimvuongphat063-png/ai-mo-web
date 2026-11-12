import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, createUser } from "@/lib/user-store";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { syncLeadToGoogleSheet } from "@/lib/lead-sync";
import { randomBytes } from "node:crypto";

export async function GET(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "ai-mo-web.vercel.app";
  const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const redirectUri = `${protocol}://${host}/api/auth/facebook/callback`;

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (errorParam || !code || !stateParam) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", errorDescription || "Đăng nhập Facebook đã bị hủy hoặc không thành công");
    return NextResponse.redirect(loginUrl);
  }

  // 1. Verify CSRF state
  let parsedState: { nonce: string; next: string } | null = null;
  try {
    parsedState = JSON.parse(Buffer.from(stateParam, "base64url").toString("utf8"));
  } catch {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "Trạng thái xác thực Facebook không hợp lệ");
    return NextResponse.redirect(loginUrl);
  }

  const storedNonce = request.cookies.get("aimo_facebook_oauth_state")?.value;
  if (!storedNonce || storedNonce !== parsedState?.nonce) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "Xác thực bảo mật CSRF Facebook thất bại");
    return NextResponse.redirect(loginUrl);
  }

  const appId = process.env.FACEBOOK_CLIENT_ID || process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_CLIENT_SECRET || process.env.FACEBOOK_APP_SECRET;

  if (!appId || !appSecret) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "facebook_oauth_missing_secret");
    return NextResponse.redirect(loginUrl);
  }

  try {
    // 2. Exchange authorization code for Facebook access token
    const tokenUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("[facebook-oauth] Token exchange failed:", tokenData);
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "Không thể lấy mã truy cập từ máy chủ Facebook");
      return NextResponse.redirect(loginUrl);
    }

    // 3. Fetch Facebook User Profile
    const meUrl = new URL("https://graph.facebook.com/v19.0/me");
    meUrl.searchParams.set("fields", "id,name,email,picture.type(large)");
    meUrl.searchParams.set("access_token", tokenData.access_token);

    const meRes = await fetch(meUrl.toString());
    const fbUser = await meRes.json();

    if (!meRes.ok || !fbUser.id) {
      console.error("[facebook-oauth] Profile fetch failed:", fbUser);
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "Không thể đọc hồ sơ tài khoản Facebook");
      return NextResponse.redirect(loginUrl);
    }

    // If account has no public email, use fallback identifier
    const email = fbUser.email
      ? String(fbUser.email).toLowerCase().trim()
      : `fb_${fbUser.id}@facebook.aimo.vn`;
    const name = String(fbUser.name || "Người dùng Facebook").trim();

    // 4. Find or create user
    let user = await findUserByEmail(email);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await createUser({
        email,
        name,
        password: "OAuth_FB_" + randomBytes(16).toString("hex") + "!Aa1",
      });
    }

    // 5. Sync to Google Sheet
    syncLeadToGoogleSheet({
      name,
      email,
      phone: "",
      intent: isNewUser ? "Đăng ký mới qua Facebook" : "Đăng nhập lại qua Facebook",
      method: "Facebook OAuth",
    }).catch((err) => console.warn("[facebook-oauth] Sheet sync error:", err));

    // 6. Build session account
    const account = {
      userId: user.id,
      email: user.email,
      name: user.name ?? name,
      role: (user.isAdmin ? "admin" : "learner") as "admin" | "learner",
      passwordVersion: user.passwordVersion,
    };

    const nextPath =
      parsedState?.next?.startsWith("/") && !parsedState.next.startsWith("//") ? parsedState.next : "/apps";
    const redirectTarget = new URL(nextPath, request.url);
    const response = NextResponse.redirect(redirectTarget);

    // 7. Set authentication session cookie
    response.cookies.set(SESSION_COOKIE, createSessionToken(account), sessionCookieOptions);
    // Delete temporary oauth CSRF cookie
    response.cookies.delete("aimo_facebook_oauth_state");

    return response;
  } catch (err: any) {
    console.error("[facebook-oauth] Callback exception:", err);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "Lỗi xử lý xác thực Facebook: " + (err.message || "vui lòng thử lại"));
    return NextResponse.redirect(loginUrl);
  }
}
