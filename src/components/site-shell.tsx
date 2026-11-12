"use client";
import Link from "next/link";
import { ShoppingBag, Menu, X, ChevronDown, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useCart } from "./cart-provider";
import { AuthNav } from "./auth-nav";

export function Logo() {
  return (
    <Link href="/" className="logo flex items-center gap-1.5 shrink-0" aria-label="AI MỞ — Trang chủ">
      <span className="font-black tracking-tight text-2xl text-neutral-900">
        AI <span className="text-blue-600">MỞ</span>
      </span>
    </Link>
  );
}

interface NavItem {
  href: string;
  label: string;
  hasDropdown?: boolean;
  badge?: string;
}

const navItems: NavItem[] = [
  { href: "/tools", label: "Công cụ AI", hasDropdown: true },
  { href: "/apps", label: "App miễn phí", hasDropdown: true },
  { href: "/guides", label: "Học AI", hasDropdown: true },
  { href: "/games", label: "Game", badge: "Sắp ra mắt" },
  { href: "/products", label: "Sản phẩm số", hasDropdown: true },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { items } = useCart();

  return (
    <header className="site-header sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 transition-all">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between py-3.5 gap-4">
        {/* Left: Brand Logo */}
        <Logo />

        {/* Center: Desktop Navigation (>= 1024px) */}
        <nav
          id="main-nav"
          aria-label="Điều hướng chính"
          className="hidden lg:flex items-center gap-1.5 xl:gap-3"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex items-center gap-1 py-1.5 px-3 text-sm font-semibold text-neutral-800 hover:text-blue-600 transition-colors rounded-lg hover:bg-neutral-50 whitespace-nowrap"
            >
              <span>{item.label}</span>
              {item.hasDropdown && (
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 mt-0.5" />
              )}
              {item.badge && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="nav-actions flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center justify-center px-3.5 py-2 text-sm font-semibold text-neutral-700 hover:text-neutral-950 transition-colors"
          >
            Đăng nhập
          </Link>

          <Link
            href="/register"
            className="hidden sm:inline-flex items-center justify-center px-3.5 py-2 text-sm font-bold text-[#155EEF] bg-[#EAF2FF] border border-[#155EEF]/20 rounded-xl hover:bg-blue-100 transition-colors"
          >
            Đăng ký
          </Link>

          <Link
            href="/tools"
            className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 text-sm font-bold text-white bg-[#155EEF] hover:bg-[#124bbf] rounded-xl shadow-sm transition-all whitespace-nowrap"
          >
            <span>Khám phá công cụ</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/cart"
            className="cart-link relative flex items-center justify-center p-2 text-neutral-700 hover:text-neutral-900 transition-colors rounded-lg hover:bg-neutral-100"
            aria-label={`Giỏ hàng có ${items.length} sản phẩm`}
          >
            <ShoppingBag className="w-5 h-5" />
            {items.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {items.length}
              </span>
            )}
          </Link>

          {/* Mobile Menu Toggle (< 1024px) */}
          <button
            className="menu-button lg:hidden p-2 text-neutral-700 hover:text-neutral-900 transition-colors rounded-lg hover:bg-neutral-100"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="main-nav-mobile"
            aria-label={open ? "Đóng menu" : "Mở menu"}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div
          id="main-nav-mobile"
          className="lg:hidden border-t border-neutral-200 bg-white px-5 py-5 space-y-3 shadow-xl"
        >
          <div className="grid grid-cols-1 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between py-2.5 px-3 text-sm font-semibold text-neutral-800 hover:text-blue-600 rounded-xl hover:bg-neutral-50 transition-colors"
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="font-semibold text-neutral-800 hover:underline"
              >
                Đăng nhập
              </Link>
              <span>•</span>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="font-bold text-[#155EEF] hover:underline"
              >
                Đăng ký miễn phí
              </Link>
            </div>
            <Link
              href="/promptkichban"
              onClick={() => setOpen(false)}
              className="text-blue-600 font-bold flex items-center gap-1"
            >
              <span>Prompt Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer bg-neutral-950 text-neutral-400 text-sm border-t border-neutral-800">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="space-y-3">
            <span className="font-black text-white text-xl tracking-tight">
              AI <span className="text-blue-500">MỞ</span>
            </span>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Nền tảng thực hành sản phẩm số & công cụ AI tiếng Việt. Học AI bằng cách tạo ra thứ dùng được vào công việc hàng ngày.
            </p>
            <div className="text-xs text-neutral-500">
              Dự án sản phẩm số độc lập · AI Mở Studio
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-white text-xs uppercase tracking-wider mb-3">Công cụ & Ứng dụng</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/promptkichban" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  PromptKichBan Studio
                </Link>
              </li>
              <li>
                <Link href="/apps" className="hover:text-white transition-colors">
                  14+ App HTML miễn phí
                </Link>
              </li>
              <li>
                <Link href="/tools" className="hover:text-white transition-colors">
                  Kho công cụ AI Mở
                </Link>
              </li>
              <li>
                <Link href="/games" className="hover:text-white transition-colors text-neutral-500">
                  Game web giải trí (Sắp có)
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white text-xs uppercase tracking-wider mb-3">Học tập & Kiến thức</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/guides" className="hover:text-white transition-colors">
                  Bài viết & Hướng dẫn thực hành
                </Link>
              </li>
              <li>
                <Link href="/learning-paths/bat-dau-voi-ai" className="hover:text-white transition-colors">
                  Lộ trình: Bắt đầu với AI
                </Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-white transition-colors">
                  Khóa học AI thực chiến
                </Link>
              </li>
              <li>
                <Link href="/free-resources" className="hover:text-white transition-colors">
                  Tài nguyên & Prompt mẫu
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white text-xs uppercase tracking-wider mb-3">Tài khoản & Hỗ trợ</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Đăng nhập tài khoản
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Chính sách quyền riêng tư
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-white transition-colors">
                  Trung tâm trợ giúp & Liên hệ
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-6 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-3">
          <span>© 2026 AI MỞ. Bản quyền thuộc về AI Mở Studio. Không bán tài khoản lậu.</span>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-neutral-300 transition-colors">Điều khoản</Link>
            <Link href="/privacy" className="hover:text-neutral-300 transition-colors">Quyền riêng tư</Link>
            <Link href="/help" className="hover:text-neutral-300 transition-colors">Hỗ trợ</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
