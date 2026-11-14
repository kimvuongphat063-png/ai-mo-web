"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  User as UserIcon,
  LogOut,
  BookOpen,
  Library,
  Shield,
  ChevronDown,
  Sparkles,
  ShoppingBag,
} from "lucide-react";

interface User {
  userId?: string;
  email?: string;
  name?: string;
  role?: "admin" | "learner";
}

interface AuthNavProps {
  isMobile?: boolean;
  onNavigate?: () => void;
}

export function AuthNav({ isMobile, onNavigate }: AuthNavProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUser(data?.user ?? null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    window.addEventListener("focus", fetchSession);
    window.addEventListener("auth-change", fetchSession);
    return () => {
      window.removeEventListener("focus", fetchSession);
      window.removeEventListener("auth-change", fetchSession);
    };
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error(e);
    }
    setUser(null);
    if (onNavigate) onNavigate();
    window.dispatchEvent(new Event("auth-change"));
    router.push("/");
    router.refresh();
  };

  // Helper: extract initials from user name or email
  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email && email.trim()) {
      return email.slice(0, 2).toUpperCase();
    }
    return "AI";
  };

  // Helper: display short name
  const getDisplayName = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      return parts[parts.length - 1];
    }
    if (email) {
      return email.split("@")[0];
    }
    return "Thành viên";
  };

  // ── MOBILE VIEW ─────────────────────────────────────────────────────────────
  if (isMobile) {
    if (loading) {
      return (
        <div className="flex items-center gap-2 py-1">
          <div className="w-24 h-4 bg-neutral-200 animate-pulse rounded" />
        </div>
      );
    }

    if (!user) {
      return (
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            onClick={onNavigate}
            className="font-semibold text-neutral-800 hover:text-blue-600 transition-colors"
          >
            Đăng nhập
          </Link>
          <span className="text-neutral-300">•</span>
          <Link
            href="/register"
            onClick={onNavigate}
            className="font-bold text-[#155EEF] hover:underline"
          >
            Đăng ký miễn phí
          </Link>
        </div>
      );
    }

    const isAdmin = user.role === "admin";
    const initials = getInitials(user.name, user.email);

    return (
      <div className="w-full space-y-3 pt-2">
        <div className="flex items-center gap-3 p-3 bg-blue-50/70 border border-blue-100 rounded-2xl">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#155EEF] to-[#3B82F6] text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-neutral-900 truncate">
                {user.name || "Thành viên AI Mở"}
              </span>
              {isAdmin ? (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                  Admin
                </span>
              ) : (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
                  Học viên
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 truncate">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
          <Link
            href="/account/learning"
            onClick={onNavigate}
            className="flex items-center gap-1.5 p-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-neutral-800"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>Khóa học của tôi</span>
          </Link>
          <Link
            href="/account/library"
            onClick={onNavigate}
            className="flex items-center gap-1.5 p-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-neutral-800"
          >
            <Library className="w-3.5 h-3.5 text-blue-600" />
            <span>Kho App & File</span>
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              onClick={onNavigate}
              className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 col-span-2"
            >
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span>Bảng điều khiển Admin</span>
            </Link>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Đăng xuất tài khoản</span>
        </button>
      </div>
    );
  }

  // ── DESKTOP VIEW ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="hidden sm:flex items-center gap-2">
        <div className="w-20 h-8 bg-neutral-100 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="hidden sm:flex items-center gap-2">
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-3.5 py-2 text-sm font-semibold text-neutral-700 hover:text-neutral-950 transition-colors"
        >
          Đăng nhập
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center justify-center px-3.5 py-2 text-sm font-bold text-[#155EEF] bg-[#EAF2FF] border border-[#155EEF]/20 rounded-xl hover:bg-blue-100 transition-colors shadow-2xs"
        >
          Đăng ký
        </Link>
      </div>
    );
  }

  const isAdmin = user.role === "admin";
  const initials = getInitials(user.name, user.email);
  const displayName = getDisplayName(user.name, user.email);

  return (
    <div className="relative hidden sm:block" ref={menuRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2.5 py-1 px-1.5 pr-3 rounded-full border border-neutral-200/90 hover:border-blue-400 bg-white hover:bg-blue-50/40 transition-all shadow-2xs cursor-pointer group"
        aria-expanded={dropdownOpen}
        aria-haspopup="true"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#155EEF] to-[#3B82F6] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs ring-2 ring-blue-100 group-hover:scale-105 transition-transform">
          {initials}
        </div>
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-neutral-800 leading-tight max-w-[120px] truncate">
              {displayName}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${isAdmin ? "bg-amber-500" : "bg-emerald-500"}`}
            />
          </div>
          <span className="text-[10px] text-neutral-500 font-medium leading-none">
            {isAdmin ? "Admin" : "Học viên"}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180 text-blue-600" : ""}`}
        />
      </button>

      {/* Floating Dropdown Card */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-neutral-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-neutral-100 flex items-center gap-3 bg-neutral-50/50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#155EEF] to-[#3B82F6] text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-neutral-900 truncate">
                  {user.name || "Thành viên AI Mở"}
                </p>
              </div>
              <p className="text-xs text-neutral-500 truncate" title={user.email}>
                {user.email}
              </p>
              <div className="mt-1">
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <Shield className="w-2.5 h-2.5" />
                    Quản trị viên hệ thống
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#155EEF] border border-blue-200">
                    <Sparkles className="w-2.5 h-2.5" />
                    Học viên chính thức
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="py-1 text-xs font-semibold text-neutral-700">
            <Link
              href="/account/learning"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 hover:bg-neutral-50 hover:text-blue-600 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-blue-500" />
              <span>Góc học tập & Khóa học</span>
            </Link>

            <Link
              href="/account/library"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 hover:bg-neutral-50 hover:text-blue-600 transition-colors"
            >
              <Library className="w-4 h-4 text-emerald-500" />
              <span>Kho App & Tài nguyên của tôi</span>
            </Link>

            <Link
              href="/account/orders"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 hover:bg-neutral-50 hover:text-blue-600 transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-purple-500" />
              <span>Đơn hàng & Sản phẩm số</span>
            </Link>

            <Link
              href="/promptkichban"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 hover:bg-neutral-50 hover:text-blue-600 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>PromptKichBan Studio</span>
            </Link>

            {isAdmin && (
              <>
                <div className="my-1 border-t border-neutral-100" />
                <div className="px-4 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
                  Lối tắt Quản trị
                </div>
                <Link
                  href="/admin"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-1.5 hover:bg-neutral-50 text-neutral-800 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  <span>Tổng quan Quản trị</span>
                </Link>
                <Link
                  href="/admin/articles"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-1.5 hover:bg-neutral-50 text-neutral-800 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>Bài viết Blog & Chèn ảnh</span>
                </Link>
                <Link
                  href="/admin/products"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-1.5 hover:bg-neutral-50 text-neutral-800 transition-colors"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-purple-600" />
                  <span>Quản lý Sản phẩm số & App</span>
                </Link>
                <Link
                  href="/admin-cards"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-1.5 hover:bg-neutral-50 text-neutral-800 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đổi Ảnh & Chữ Trang Chủ</span>
                </Link>
              </>
            )}
          </div>

          {/* Logout Section */}
          <div className="pt-1 mt-1 border-t border-neutral-100">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất tài khoản</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
