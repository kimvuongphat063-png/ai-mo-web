"use client";
import { ThemeToggle } from "./theme-toggle";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CONTACT_INFO } from "@/lib/organization";
import {
  Menu,
  X,
  ArrowRight,
  Search,
  Sparkles,
  ChevronDown,
  Cpu,
  Layers,
  Gamepad2,
  GraduationCap,
  Package,
  Zap,
  BookOpen,
  Flame,
  ShoppingBag,
  Calculator,
  DollarSign,
  BarChart3,
  Database,
  Target,
  Trophy,
} from "lucide-react";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Cpu,
  Calculator,
  DollarSign,
  ShoppingBag,
  BarChart3,
  Database,
  Target,
  Zap,
  Layers,
  Trophy,
  BookOpen,
  Gamepad2,
  Flame,
  GraduationCap,
  Package,
};
import { useState, useRef, useEffect } from "react";
import { AuthNav } from "./auth-nav";
import { useSearch } from "./home-search-context";

export function Logo() {
  return (
    <Link href="/" className="logo flex items-center gap-2.5 shrink-0 group select-none" aria-label="AI MỞ — Trang chủ">
      <div className="relative">
        <img
          src="/mascot/v2-mascot-avatar.png"
          alt="AI Mở Mascot"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover shadow-[0_0_12px_rgba(212,255,0,0.3)] group-hover:shadow-[0_0_20px_rgba(212,255,0,0.6)] group-hover:scale-105 transition-all border border-[#d4ff00]/40"
        />
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#d4ff00] border-2 border-[#090c14] animate-pulse" />
      </div>
      <div className="flex flex-col">
        <span className="font-black tracking-tight text-xl sm:text-2xl leading-none flex items-center gap-1">
          <span className="text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.25)]">AI</span>
          <span className="text-[#d4ff00] drop-shadow-[0_0_12px_rgba(212,255,0,0.7)]">MỞ</span>
        </span>
        <span className="text-[9.5px] font-mono font-bold tracking-wider text-slate-400 group-hover:text-[#00e5ff] transition-colors mt-0.5">
          STUDIO TECH
        </span>
      </div>
    </Link>
  );
}
interface DropdownChild {
  href: string;
  label: string;
  desc?: string;
  badge?: string;
  highlight?: boolean;
}

interface NavItem {
  key: string;
  label: string;
  href: string;
  badge?: string;
  children?: DropdownChild[];
}

const navItems: NavItem[] = [
  {
    key: "tools",
    label: "Công cụ AI",
    href: "/tools",
    children: [
      {
        href: "/promptkichban",
        label: "PromptKichBan Studio",
        desc: "Tạo prompt video AI & kịch bản phân cảnh 3 màn",
        badge: "HOT",
        highlight: true,
      },
      {
        href: "/tools",
        label: "Kho công cụ AI Mở",
        desc: "Bộ ứng dụng AI thực tế giải quyết công việc hàng ngày",
      },
      {
        href: "/apps",
        label: "Tính lãi đơn Shopee / TikTok",
        desc: "Tính lãi thật từng đơn, khấu trừ trọn gói phí sàn",
      },
      {
        href: "/apps",
        label: "Định giá bán sản phẩm",
        desc: "Xác định điểm hòa vốn & tối ưu biên lợi nhuận",
      },
    ],
  },
  {
    key: "apps",
    label: "App miễn phí",
    href: "/apps",
  },
  {
    key: "games",
    label: "Game",
    href: "/games",
    badge: "65+",
  },
  {
    key: "learn",
    label: "Học AI",
    href: "/guides",
    children: [
      {
        href: "/guides",
        label: "Kiến thức AI & Blog",
        desc: "Bài viết thực chiến, cẩm nang 12 skill Claude Code cho Vibe Coding",
        badge: "Blog",
        highlight: true,
      },
      {
        href: "/learning-paths/bat-dau-voi-ai",
        label: "Lộ trình học AI (3 chặng)",
        desc: "Từ con số 0 đến tự xây dựng trợ lý AI công việc cá nhân",
      },
      {
        href: "/courses",
        label: "Khóa học AI thực chiến",
        desc: "Học bằng cách tạo ra sản phẩm thật dùng được ngay",
      },
      {
        href: "/free-resources",
        label: "Tài nguyên & Prompt mẫu",
        desc: "Kho prompt starter kit và tài liệu chọn lọc miễn phí",
      },
    ],
  },
  {
    key: "products",
    label: "Sản phẩm số",
    href: "/products",
    children: [
      {
        href: "/products",
        label: "Kho sản phẩm số",
        desc: "Template prompt, bộ giải pháp và tài nguyên thực chiến",
      },
      {
        href: "/bundles",
        label: "Bộ giải pháp (Bundles)",
        desc: "Trọn gói công cụ và khóa học tiết kiệm chi phí",
      },
      {
        href: "/free-resources",
        label: "Tài nguyên số tải về",
        desc: "Tải file và template ứng dụng ngay vào công việc",
      },
    ],
  },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<Record<string, boolean>>({
    learn: true,
    tools: false,
    apps: false,
    products: false,
    games: false,
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { query, setQuery } = useSearch();
  const router = useRouter();
  const pathname = usePathname();

  const handleMouseEnter = (key: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(key);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 180);
  };

  const toggleMobileGroup = (key: string) => {
    setMobileExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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

  // Close menus on route change
  useEffect(() => {
    setOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  return (
    <header className="site-header sticky top-0 z-50 bg-[#090c14]/98 backdrop-blur-xl border-b border-white/12 shadow-[0_4px_30px_rgba(0,0,0,0.8)] transition-all">
      <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 2xl:px-8 flex items-center justify-between py-3 gap-3">
        {/* Left: Brand Logo */}
        <Logo />

        {/* Center: Desktop Navigation with Dropdowns */}
        <nav
          id="main-nav"
          aria-label="Điều hướng chính"
          className="hidden lg:flex items-center gap-1.5 xl:gap-2 ml-2"
        >
          {navItems.map((item) => {
            const hasChildren = Boolean(item.children && item.children.length > 0);
            const isOpen = activeDropdown === item.key;

            if (!hasChildren) {
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className="py-2 px-3.5 text-[13.5px] font-bold text-slate-200 hover:text-[#d4ff00] hover:bg-white/8 transition-all rounded-full whitespace-nowrap inline-flex items-center gap-1.5 border border-transparent hover:border-[#d4ff00]/30"
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#d4ff00]/10 text-[#d4ff00] border border-[#d4ff00]/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            }

            return (
              <div
                key={item.key}
                className="relative"
                onMouseEnter={() => handleMouseEnter(item.key)}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  href={item.href}
                  className={`py-2 px-3.5 text-[13.5px] font-bold transition-all rounded-full whitespace-nowrap inline-flex items-center gap-1.5 border border-transparent hover:border-[#d4ff00]/30 ${
                    isOpen
                      ? "text-[#d4ff00] bg-white/5"
                      : "text-slate-200 hover:text-[#d4ff00] hover:bg-white/8"
                  }`}
                  onClick={(e) => {
                    if (window.innerWidth >= 1024 && !isOpen) {
                      e.preventDefault();
                      setActiveDropdown(item.key);
                    }
                  }}
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                >
                  <span>{item.label}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-[#d4ff00]" : ""
                    }`}
                  />
                  {item.badge && (
                    <span className="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/15">
                      {item.badge}
                    </span>
                  )}
                </Link>

                {/* Dropdown Menu Panel */}
                {isOpen && item.children && (
                  <div
                    className="absolute top-full left-0 mt-2 w-80 bg-[#0d121f]/98 backdrop-blur-2xl rounded-2xl border border-white/15 shadow-2xl p-2 z-50 text-white animate-in fade-in slide-in-from-top-2 duration-150"
                    onMouseEnter={() => handleMouseEnter(item.key)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="space-y-1">
                      {item.children.map((sub) => (
                        <Link
                          key={sub.href + sub.label}
                          href={sub.href}
                          onClick={() => setActiveDropdown(null)}
                          className={`group flex items-start gap-2.5 p-2.5 rounded-xl transition-all ${
                            sub.highlight
                              ? "bg-white/8 hover:bg-white/12"
                              : "hover:bg-white/5"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[13.5px] font-bold ${
                                  sub.highlight
                                    ? "text-[#d4ff00]"
                                    : "text-white group-hover:text-[#d4ff00]"
                                }`}
                              >
                                {sub.label}
                              </span>
                              {sub.badge && (
                                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-[#d4ff00] text-black">
                                  {sub.badge}
                                </span>
                              )}
                            </div>
                            {sub.desc && (
                              <p className="text-[12px] text-slate-400 leading-snug line-clamp-2 mt-0.5 m-0">
                                {sub.desc}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#d4ff00] group-hover:translate-x-0.5 transition-all mt-1 shrink-0" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
              className="pl-9 pr-7 py-1.5 text-xs sm:text-sm bg-white/5 hover:bg-white/10 focus:bg-[#121826] text-white placeholder:text-slate-500 rounded-full border border-white/10 focus:border-[#d4ff00] focus:ring-1 focus:ring-[#d4ff00]/30 outline-none transition-all w-36 md:w-48 lg:w-56"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Xóa tìm kiếm"
                className="absolute right-2.5 text-neutral-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <ThemeToggle />
          <AuthNav />

          <Link
            href="/#prompt"
            className="hidden sm:inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-black bg-[#d4ff00] hover:bg-[#b8e000] font-black rounded-full shadow-[0_0_20px_rgba(212,255,0,0.45)] hover:shadow-[0_0_28px_rgba(212,255,0,0.7)] hover:scale-105 transition-all whitespace-nowrap"
          >
            <span style={{ color: "#000000", fontWeight: 900 }}>Bắt đầu miễn phí</span>
          </Link>

          {/* Mobile Menu Toggle (< 1024px) */}
          <button
            className="menu-button lg:hidden p-2 text-slate-300 hover:text-white transition-colors rounded-xl hover:bg-white/10 border border-white/15"
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
          className="lg:hidden border-t border-white/10 bg-[#0d121f] text-white px-4 py-4 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto"
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
              className="w-full pl-9 pr-7 py-2 text-sm bg-white/5 text-white placeholder:text-slate-500 rounded-full border border-white/10 focus:border-[#d4ff00] outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 text-neutral-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Mobile Navigation List with Accordion */}
          <div className="space-y-1">
            {navItems.map((item) => {
              if (!item.children || item.children.length === 0) {
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between py-2.5 px-3 text-sm font-bold text-slate-200 hover:text-[#d4ff00] rounded-xl hover:bg-white/5"
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#d4ff00]/10 text-[#d4ff00] border border-[#d4ff00]/30">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              }

              const isExpanded = Boolean(mobileExpanded[item.key]);

              return (
                <div key={item.key} className="border-b border-white/10 pb-1">
                  <div className="flex items-center justify-between py-2 px-3">
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="text-sm font-bold text-white hover:text-[#d4ff00]"
                    >
                      {item.label}
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleMobileGroup(item.key)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                      aria-label={`Mở rộng ${item.label}`}
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? "rotate-180 text-[#d4ff00]" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="pl-4 pr-2 py-1 space-y-1 bg-white/5 rounded-xl mb-1">
                      {item.children.map((sub) => (
                        <Link
                          key={sub.href + sub.label}
                          href={sub.href}
                          onClick={() => setOpen(false)}
                          className="flex items-start justify-between py-2 px-2.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-[#d4ff00] hover:bg-white/5"
                        >
                          <div>
                            <div className="font-bold flex items-center gap-1.5">
                              <span>{sub.label}</span>
                              {sub.badge && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-[#d4ff00] text-black">
                                  {sub.badge}
                                </span>
                              )}
                            </div>
                            {sub.desc && (
                              <p className="text-[11px] text-slate-500 font-normal m-0 line-clamp-1">
                                {sub.desc}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="w-3 h-3 text-neutral-400 mt-0.5 shrink-0" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-white/10 flex flex-col gap-2.5">
            <AuthNav isMobile onNavigate={() => setOpen(false)} />
            <Link
              href="/promptkichban"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-black bg-[#d4ff00] rounded-xl shadow-md shadow-[#d4ff00]/20"
            >
              <span>Vào PromptKichBan Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer bg-neutral-950 text-neutral-300 text-sm border-t border-neutral-800 mt-auto">
      <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 2xl:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 mb-10">
          {/* Cột 1: Thông tin tổ chức & Liên hệ chính thức (theo đúng thứ tự chuẩn SEO) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-2">
              <span className="font-black text-white text-2xl tracking-tight block">
                AI <span className="text-[#d4ff00]">MỞ</span>
              </span>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-md">
                Nền tảng thực hành sản phẩm số & công cụ AI tiếng Việt. Học AI bằng cách tạo ra thứ dùng được vào công việc hàng ngày.
              </p>
            </div>

            {/* Khối thông tin liên hệ chuẩn SEO theo thứ tự bắt buộc */}
            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2.5 text-xs text-neutral-300">
              {/* 1. Tên tổ chức */}
              <div className="flex items-start gap-2">
                <span className="text-neutral-400 shrink-0 font-medium">Tên tổ chức:</span>
                <strong className="text-white font-bold">{CONTACT_INFO.organizationName}</strong>
              </div>

              {/* 2. Hotline/Zalo */}
              <div className="flex items-start gap-2 flex-wrap">
                <span className="text-neutral-400 shrink-0 font-medium">Hotline/Zalo:</span>
                <span className="text-white font-semibold">
                  {CONTACT_INFO.hotline.display} ({CONTACT_INFO.hotline.name})
                </span>
                <span className="text-neutral-600">—</span>
                <a
                  href={CONTACT_INFO.hotline.telLink}
                  className="text-[#d4ff00] hover:text-[#d4ff00]/80 underline underline-offset-2 font-medium transition-colors"
                  title="Bấm để gọi hotline"
                >
                  Bấm để gọi
                </a>
                <span className="text-neutral-600">·</span>
                <a
                  href={CONTACT_INFO.hotline.zaloLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#d4ff00] hover:text-[#d4ff00]/80 underline underline-offset-2 font-medium transition-colors"
                  title="Bấm để mở Zalo"
                >
                  Mở Zalo
                </a>
              </div>

              {/* 3. Email liên hệ chính */}
              <div className="flex items-start gap-2 flex-wrap">
                <span className="text-neutral-400 shrink-0 font-medium">Email liên hệ:</span>
                <a
                  href={CONTACT_INFO.emailPrimary.link}
                  className="text-[#d4ff00] hover:text-[#d4ff00]/80 underline underline-offset-2 font-medium break-all transition-colors"
                  title="Gửi email liên hệ"
                >
                  {CONTACT_INFO.emailPrimary.address}
                </a>
              </div>

              {/* 3b. Email hỗ trợ kèm ghi chú phản hồi trong một ngày làm việc */}
              <div className="flex items-start gap-2 flex-wrap">
                <span className="text-neutral-400 shrink-0 font-medium">Email hỗ trợ:</span>
                <a
                  href={CONTACT_INFO.emailSupport.link}
                  className="text-[#d4ff00] hover:text-[#d4ff00]/80 underline underline-offset-2 font-medium break-all transition-colors"
                  title="Gửi email hỗ trợ"
                >
                  {CONTACT_INFO.emailSupport.address}
                </a>
                <span className="text-neutral-400 italic">
                  ({CONTACT_INFO.emailSupport.note})
                </span>
              </div>

              {/* 4. Facebook */}
              <div className="flex items-start gap-2 flex-wrap">
                <span className="text-neutral-400 shrink-0 font-medium">Facebook:</span>
                <a
                  href={CONTACT_INFO.facebook.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#d4ff00] hover:text-[#d4ff00]/80 underline underline-offset-2 font-medium break-all transition-colors"
                  title="Ghé thăm Facebook AI Mở"
                >
                  {CONTACT_INFO.facebook.url}
                </a>
              </div>

              {/* 5. Địa chỉ (mở Google Maps) */}
              <div className="flex items-start gap-2 flex-wrap">
                <span className="text-neutral-400 shrink-0 font-medium">Địa chỉ:</span>
                <a
                  href={CONTACT_INFO.address.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-200 hover:text-white underline underline-offset-2 transition-colors leading-relaxed"
                  title="Mở địa chỉ trên Google Maps"
                >
                  {CONTACT_INFO.address.full}
                </a>
              </div>

              {/* 6. Link tới trang /lien-he */}
              <div className="pt-2 border-t border-neutral-800/90 flex items-center justify-between">
                <Link
                  href="/lien-he"
                  className="inline-flex items-center gap-1.5 text-[#d4ff00] hover:text-[#d4ff00]/80 font-bold transition-colors"
                >
                  <span>→ Xem trang Liên hệ chi tiết (/lien-he)</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Cột 2: Công cụ & Ứng dụng */}
          <div className="lg:col-span-2 md:col-span-1">
            <h3 className="font-semibold text-white text-xs uppercase tracking-wider mb-3">Công cụ & Ứng dụng</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/promptkichban" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d4ff00]"></span>
                  PromptKichBan Studio
                </Link>
              </li>
              <li>
                <Link href="/apps" className="hover:text-white transition-colors">
                  95+ App HTML miễn phí
                </Link>
              </li>
              <li>
                <Link href="/tools" className="hover:text-white transition-colors">
                  Kho công cụ AI Mở
                </Link>
              </li>
              <li>
                <Link href="/games" className="hover:text-white transition-colors">
                  Kho Game Web Trí Tuệ (65+)
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Học tập & Kiến thức */}
          <div className="lg:col-span-2 md:col-span-1">
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

          {/* Cột 4: Tài khoản & Hỗ trợ */}
          <div className="lg:col-span-3 md:col-span-1">
            <h3 className="font-semibold text-white text-xs uppercase tracking-wider mb-3">Tài khoản & Hỗ trợ</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/lien-he" className="text-[#d4ff00] hover:text-[#d4ff00]/80 font-semibold transition-colors flex items-center gap-1">
                  <span>Trang liên hệ & Gửi yêu cầu</span>
                </Link>
              </li>
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
                  Trung tâm trợ giúp
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Dòng bản quyền chân trang */}
        <div className="pt-6 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-3">
          <span>© 2026 AI MỞ. Bản quyền thuộc về AI Mở Studio. Không bán tài khoản lậu.</span>
          <div className="flex gap-4">
            <Link href="/lien-he" className="text-neutral-400 hover:text-white transition-colors font-medium">Liên hệ</Link>
            <Link href="/terms" className="hover:text-neutral-300 transition-colors">Điều khoản</Link>
            <Link href="/privacy" className="hover:text-neutral-300 transition-colors">Quyền riêng tư</Link>
            <Link href="/help" className="hover:text-neutral-300 transition-colors">Hỗ trợ</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
