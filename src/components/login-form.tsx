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
  const [error, setError] = useState("");
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
      router.push(safe || (result.user.role === "admin" ? "/admin" : "/apps"));
      router.refresh();
    } catch {
      setBusy(false);
      setError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
    }
  }

  function fillDemo(e: string, p: string) {
    setEmail(e);
    setPassword(p);
    setError("");
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

      {/* ── TÀI KHOẢN DÙNG THỬ (DEMO CLICK-TO-FILL) ───────────────────── */}
      <div className="rounded-2xl bg-neutral-50 border border-neutral-200/80 p-3.5 space-y-2">
        <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
          ⚡ Bấm để điền nhanh tài khoản mẫu:
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => fillDemo("hocvien@aimo.vn", "Hocvien@2026!")}
            className="p-2 rounded-xl bg-white border border-neutral-200 hover:border-[#155EEF] hover:bg-[#EAF2FF]/50 text-left transition-all cursor-pointer"
          >
            <span className="font-bold text-neutral-900 block text-xs">🎓 Học viên Demo</span>
            <span className="text-[10px] text-neutral-500 font-mono block truncate">hocvien@aimo.vn</span>
          </button>

          <button
            type="button"
            onClick={() => fillDemo("admin@aimo.vn", "Admin@2026!")}
            className="p-2 rounded-xl bg-white border border-neutral-200 hover:border-[#155EEF] hover:bg-[#EAF2FF]/50 text-left transition-all cursor-pointer"
          >
            <span className="font-bold text-neutral-900 block text-xs">👑 Admin Demo</span>
            <span className="text-[10px] text-neutral-500 font-mono block truncate">admin@aimo.vn</span>
          </button>
        </div>
      </div>

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
