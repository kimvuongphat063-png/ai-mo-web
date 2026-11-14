"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ArrowRight, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { AuthNav } from "./auth-nav";
import { useSearch } from "./home-search-context";

export function Logo() {
  return (
    <Link href="/" className="logo flex items-center gap-2 shrink-0 group" aria-label="AI MỞ — Trang chủ">
      <span
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-r from-[#0057ff] via-[#7c4dff] to-[#00b8d9] flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform"
        aria-hidden="true"
      >
        <Sparkles className="w-4 h-4 fill-current" />
      </span>
      <span className="font-black tracking-tight text-xl sm:text-2xl text-neutral-900">
        AI <span className="text-[#0057ff]">MỞ</span>
      </span>
    </Link>
  );
}

interface NavItem {
  href: string;
  label: string;
  badge?: string;
}

const navItems: NavItem[] = [
  { href: "/#cong-cu", label: "Công cụ AI" },
  { href: "/apps", label: "App miễn phí" },
  { href: "/#lo-trinh", label: "Học AI" },
  { href: "/products", label: "Sản phẩm số" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { query, setQuery } = useSearch();
  const router = useRouter();
  const pathname = usePathname();

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (pathname === "/") {
        const el = document.getElementById("cong-cu");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      } else {
        router.push("/#cong-cu");
      }
    }
  };

  return (
    <header className="site-header sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-neutral-200/80 transition-all">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between py-3 gap-3">
        {/* Left: Brand Logo */}
        <Logo />

        {/* Center: Desktop Navigation */}
        <nav
          id="main-nav"
          aria-label="Điều hướng chính"
          className="hidden lg:flex items-center gap-1 xl:gap-2 ml-1"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="py-1.5 px-3 text-sm font-semibold text-neutral-700 hover:text-[#0057ff] transition-colors rounded-full hover:bg-neutral-100/80 whitespace-nowrap"
            >
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Right: Search, Auth & CTA */}
        <div className="nav-actions flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
          {/* Header Search Input */}
          <div className="relative hidden sm:flex items-center">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
            <input
              id="siteSearch"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Tìm công cụ, bài viết…"
              aria-label="Tìm kiếm công cụ hoặc bài viết"
              className="pl-9 pr-7 py-1.5 text-xs sm:text-sm bg-[#eef3ff] hover:bg-[#e6edfc] focus:bg-white text-neutral-900 placeholder:text-neutral-500 rounded-full border border-[#dde6f8] focus:border-[#0057ff] focus:ring-2 focus:ring-[#0057ff]/20 outline-none transition-all w-36 md:w-48 lg:w-56"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Xóa tìm kiếm"
                className="absolute right-2.5 text-neutral-400 hover:text-neutral-700 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <AuthNav />

          <Link
            href="/#prompt"
            className="hidden xs:inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#0057ff] hover:bg-[#0043c7] rounded-full shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 transition-all whitespace-nowrap"
          >
            <span>Bắt đầu miễn phí</span>
          </Link>

          {/* Mobile Menu Toggle (< 1024px) */}
          <button
            className="menu-button lg:hidden p-2 text-neutral-700 hover:text-neutral-900 transition-colors rounded-xl hover:bg-neutral-100 border border-neutral-200/60"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="main-nav-mobile"
            aria-label={open ? "Đóng menu" : "Mở menu"}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div
          id="main-nav-mobile"
          className="lg:hidden border-t border-neutral-200 bg-white px-5 py-4 space-y-3 shadow-xl"
        >
          {/* Mobile Search */}
          <div className="relative flex items-center sm:hidden pb-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchKeyDown(e);
                  setOpen(false);
                }
              }}
              placeholder="Tìm công cụ, bài viết…"
              aria-label="Tìm kiếm di động"
              className="w-full pl-9 pr-7 py-2 text-sm bg-[#eef3ff] text-neutral-900 placeholder:text-neutral-500 rounded-full border border-[#dde6f8] focus:border-[#0057ff] outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 text-neutral-400 hover:text-neutral-700 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between py-2.5 px-3 text-sm font-semibold text-neutral-800 hover:text-[#0057ff] rounded-xl hover:bg-neutral-50 transition-colors"
              >
                <span>{item.label}</span>
                <span className="text-neutral-400 text-xs">→</span>
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-neutral-100 flex flex-col gap-3">
            <AuthNav isMobile onNavigate={() => setOpen(false)} />
            <Link
              href="/#prompt"
              onClick={() => setOpen(false)}
              className="w-full text-center py-2.5 text-sm font-bold text-white bg-[#0057ff] hover:bg-[#0043c7] rounded-full shadow-md shadow-blue-500/20"
            >
              Bắt đầu miễn phí
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
