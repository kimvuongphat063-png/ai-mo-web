import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, createUser } from "@/lib/user-store";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { syncLeadToGoogleSheet } from "@/lib/lead-sync";
import { randomBytes } from "node:crypto";

export async function GET(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "ai-mo-web.vercel.app";
  const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const errorParam = searchParams.get("error");

  if (errorParam || !code || !stateParam) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "Đăng nhập Google đã bị hủy hoặc không thành công");
    return NextResponse.redirect(loginUrl);
  }

  // 1. Verify CSRF state
  let parsedState: { nonce: string; next: string } | null = null;
  try {
    parsedState = JSON.parse(Buffer.from(stateParam, "base64url").toString("utf8"));
  } catch {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "Trạng thái xác thực Google không hợp lệ");
    return NextResponse.redirect(loginUrl);
  }

  const storedNonce = request.cookies.get("aimo_google_oauth_state")?.value;
  if (!storedNonce || storedNonce !== parsedState?.nonce) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "Xác thực bảo mật CSRF Google thất bại");
    return NextResponse.redirect(loginUrl);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "google_oauth_missing_secret");
    return NextResponse.redirect(loginUrl);
  }

  try {
    // 2. Exchange authorization code for Google access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("[google-oauth] Token exchange failed:", tokenData);
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "Không thể lấy mã truy cập từ máy chủ Google");
      return NextResponse.redirect(loginUrl);
    }

    // 3. Fetch Google User Profile
    const userinfoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userinfoRes.json();

    if (!userinfoRes.ok || !googleUser.email) {
      console.error("[google-oauth] Userinfo fetch failed:", googleUser);
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "Không thể đọc thông tin tài khoản Gmail");
      return NextResponse.redirect(loginUrl);
    }

    const email = String(googleUser.email).toLowerCase().trim();
    const name = String(googleUser.name || email.split("@")[0]).trim();

    // 4. Find or create user
    let user = await findUserByEmail(email);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await createUser({
        email,
        name,
        password: "OAuth_" + randomBytes(16).toString("hex") + "!Aa1",
      });
    }

    // 5. Sync to Google Sheet
    syncLeadToGoogleSheet({
      name,
      email,
      phone: "",
      intent: isNewUser ? "Đăng ký mới qua Gmail" : "Đăng nhập lại qua Gmail",
      method: "Google OAuth (Gmail)",
    }).catch((err) => console.warn("[google-oauth] Sheet sync error:", err));

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
    response.cookies.delete("aimo_google_oauth_state");

    return response;
  } catch (err: any) {
    console.error("[google-oauth] Callback exception:", err);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "Lỗi xử lý xác thực Google: " + (err.message || "vui lòng thử lại"));
    return NextResponse.redirect(loginUrl);
  }
}
