"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LogIn, Mail, Lock, AlertCircle, ArrowRight, Sparkles, ShieldCheck, UserCheck } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const errorParam = search.get("error");
  const [error, setError] = useState(
    errorParam === "google_oauth_pending"
      ? "Hệ thống đang sẵn sàng cho Google OAuth. Vui lòng thêm GOOGLE_CLIENT_ID trên Vercel hoặc dùng tài khoản bên dưới."
      : errorParam === "facebook_oauth_pending"
      ? "Hệ thống đang sẵn sàng cho Facebook OAuth. Vui lòng thêm FACEBOOK_CLIENT_ID trên Vercel hoặc dùng tài khoản bên dưới."
      : errorParam || ""
  );
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      setBusy(false);

      if (!response.ok) {
        setError(result.error || "Email hoặc mật khẩu không chính xác.");
        return;
      }

      const requested = search.get("next");
      const safe = requested?.startsWith("/") && !requested.startsWith("//") ? requested : null;
      window.location.assign(safe || (result.user.role === "admin" ? "/admin" : "/apps"));
    } catch {
      setBusy(false);
      setError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
    }
  }

  return (
    <div className="bg-white/90 backdrop-blur-xl border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-blue-500/5 space-y-6">
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF2FF] text-[#155EEF] text-xs font-bold border border-[#155EEF]/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Hệ thống Thành viên AI MỞ</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-neutral-900">
          Đăng nhập tài khoản
        </h1>
        <p className="text-xs text-neutral-600 max-w-sm mx-auto">
          Truy cập tài nguyên học tập, tải file app offline và sử dụng các công cụ AI.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* ── SOCIAL SIGN-IN OPTIONS ───────────────────────────────────── */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2.5">
          <a
            href={`/api/auth/google${search.get("next") ? `?next=${encodeURIComponent(search.get("next")!)}` : ""}`}
            style={{ color: "#0f172a" }}
            className="py-2.5 px-3 rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 text-slate-900 font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google</span>
          </a>

          <a
            href={`/api/auth/facebook${search.get("next") ? `?next=${encodeURIComponent(search.get("next")!)}` : ""}`}
            style={{ color: "#0f172a" }}
            className="py-2.5 px-3 rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 text-slate-900 font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
          >
            <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Facebook</span>
          </a>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-neutral-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider absolute">
            Hoặc dùng mật khẩu
          </span>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1.5">
            Email tài khoản
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:border-[#155EEF] focus:ring-2 focus:ring-[#155EEF]/10 transition-all bg-neutral-50/50"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-neutral-700">
              Mật khẩu
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] text-[#155EEF] hover:underline font-semibold"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:border-[#155EEF] focus:ring-2 focus:ring-[#155EEF]/10 transition-all bg-neutral-50/50"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 px-4 rounded-xl bg-[#155EEF] hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm shadow-md shadow-[#155EEF]/20 transition-all flex items-center justify-center gap-2 group cursor-pointer"
        >
          <span>{busy ? "Đang xác thực..." : "Đăng nhập ngay"}</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </form>

      {/* ── FOOTER LINK TO REGISTER ──────────────────────────────────── */}
      <div className="pt-2 border-t border-neutral-100 text-center text-xs text-neutral-600 space-y-2">
        <p>
          Chưa có tài khoản?{" "}
          <Link
            href={`/register${search.get("next") ? `?next=${encodeURIComponent(search.get("next")!)}` : ""}`}
            className="text-[#155EEF] font-bold hover:underline"
          >
            Tạo tài khoản miễn phí ngay →
          </Link>
        </p>
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Bảo mật phiên đăng nhập 100%</span>
        </div>
      </div>
    </div>
  );
}
