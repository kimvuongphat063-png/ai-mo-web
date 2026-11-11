"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Lock, Mail, User, AlertCircle } from "lucide-react";

export function RegisterForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
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
    <div className="bg-white/80 backdrop-blur-xl border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-blue-500/5 space-y-6">
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tài khoản miễn phí</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-neutral-900">
          Bắt đầu cùng AI MỞ
        </h1>
        <p className="text-xs text-neutral-600 max-w-sm mx-auto">
          Đăng ký miễn phí để tải trọn bộ App HTML offline, lưu kịch bản và truy cập kho tài nguyên số.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1.5">
            Họ và tên
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-neutral-50/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1.5">
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
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-neutral-50/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1.5">
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
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-neutral-50/50"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group cursor-pointer"
        >
          <span>{busy ? "Đang khởi tạo tài khoản..." : "Tạo tài khoản miễn phí"}</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </form>

      <div className="pt-2 border-t border-neutral-100 text-center text-xs text-neutral-500 space-y-2">
        <p>
          Đã có tài khoản?{" "}
          <Link
            href={`/login${search.get("next") ? `?next=${encodeURIComponent(search.get("next")!)}` : ""}`}
            className="text-blue-600 font-bold hover:underline"
          >
            Đăng nhập ngay
          </Link>
        </p>
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Bảo mật thông tin · Không gửi email spam</span>
        </div>
      </div>
    </div>
  );
}
