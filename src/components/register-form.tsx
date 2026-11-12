"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Lock, Mail, User, Phone, AlertCircle, Compass } from "lucide-react";

export function RegisterForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [intent, setIntent] = useState("all");
  const errorParam = search.get("error");
  const [error, setError] = useState(
    errorParam === "google_oauth_pending"
      ? "Hệ thống đang sẵn sàng cho Google OAuth. Vui lòng thêm GOOGLE_CLIENT_ID trên Vercel hoặc đăng ký qua form bên dưới."
      : errorParam === "facebook_oauth_pending"
      ? "Hệ thống đang sẵn sàng cho Facebook OAuth. Vui lòng thêm FACEBOOK_CLIENT_ID trên Vercel hoặc đăng ký qua form bên dưới."
      : errorParam || ""
  );
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, phone, intent }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.");
        setBusy(false);
        return;
      }

      const next = search.get("next");
      const safeRedirect = next?.startsWith("/") && !next.startsWith("//") ? next : "/apps";
      router.push(safeRedirect);
      router.refresh();
    } catch {
      setError("Lỗi kết nối máy chủ. Vui lòng thử lại sau.");
      setBusy(false);
    }
  }

  return (
    <div className="bg-white/90 backdrop-blur-xl border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-blue-500/5 space-y-6">
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF2FF] text-[#155EEF] text-xs font-bold border border-[#155EEF]/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tài khoản miễn phí</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-neutral-900">
          Đăng ký tài khoản AI MỞ
        </h1>
        <p className="text-xs text-neutral-600 max-w-sm mx-auto">
          Tạo tài khoản để tải trọn bộ 19+ App offline, lưu kịch bản và nhận tài liệu đào tạo.
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
            className="py-2.5 px-3 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-800 font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
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
            className="py-2.5 px-3 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-800 font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
          >
            <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Facebook</span>
          </a>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-neutral-200"></div>
          <span className="bg-white px-2.5 text-[11px] text-neutral-400 font-medium absolute">
            hoặc điền thông tin
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1">
            Họ và tên <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:border-[#155EEF] focus:ring-2 focus:ring-[#155EEF]/10 transition-all bg-neutral-50/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1">
            Số điện thoại / Zalo <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0912 345 678"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:border-[#155EEF] focus:ring-2 focus:ring-[#155EEF]/10 transition-all bg-neutral-50/50"
            />
          </div>
          <span className="text-[10px] text-neutral-400 mt-0.5 block">
            Dùng để nhận tài liệu học tập và hỗ trợ kỹ thuật qua Zalo.
          </span>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1">
            Email của bạn <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:border-[#155EEF] focus:ring-2 focus:ring-[#155EEF]/10 transition-all bg-neutral-50/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1">
            Mật khẩu (tối thiểu 6 ký tự) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:border-[#155EEF] focus:ring-2 focus:ring-[#155EEF]/10 transition-all bg-neutral-50/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1">
            Nhu cầu quan tâm chính
          </label>
          <select
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs text-neutral-900 focus:outline-hidden focus:border-[#155EEF] focus:ring-2 focus:ring-[#155EEF]/10 transition-all bg-neutral-50/50 cursor-pointer"
          >
            <option value="all">Tất cả tài nguyên & App miễn phí</option>
            <option value="education">Ứng dụng Giáo dục & Ôn tập cho con (Toán, Tiếng Anh)</option>
            <option value="business">Công cụ Kinh doanh & Bán lẻ (Tính lãi, Báo giá)</option>
            <option value="video-ai">AI Video & Viết kịch bản (PromptKichBan)</option>
            <option value="courses">Đăng ký tham gia Khóa học AI thực chiến</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 px-4 rounded-xl bg-[#155EEF] hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm shadow-md shadow-[#155EEF]/20 transition-all flex items-center justify-center gap-2 group cursor-pointer mt-2"
        >
          <span>{busy ? "Đang khởi tạo tài khoản..." : "Tạo tài khoản miễn phí ngay"}</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </form>

      <div className="pt-2 border-t border-neutral-100 text-center text-xs text-neutral-500 space-y-2">
        <p>
          Đã có tài khoản?{" "}
          <Link
            href={`/login${search.get("next") ? `?next=${encodeURIComponent(search.get("next")!)}` : ""}`}
            className="text-[#155EEF] font-bold hover:underline"
          >
            Đăng nhập ngay
          </Link>
        </p>
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Bảo mật thông tin · Không gửi email rác</span>
        </div>
      </div>
    </div>
  );
}
