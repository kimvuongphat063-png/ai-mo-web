"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ArrowRight, Search, Sparkles, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
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
  {
    key: "games",
    label: "Game",
    href: "/games",
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
    <header className="site-header sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-neutral-200/80 transition-all">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between py-3 gap-3">
        {/* Left: Brand Logo */}
        <Logo />

        {/* Center: Desktop Navigation with Dropdowns */}
        <nav
          id="main-nav"
          aria-label="Điều hướng chính"
          className="hidden lg:flex items-center gap-1 xl:gap-1.5 ml-1"
        >
          {navItems.map((item) => {
            const hasChildren = Boolean(item.children && item.children.length > 0);
            const isOpen = activeDropdown === item.key;

            if (!hasChildren) {
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className="py-1.5 px-3 text-sm font-semibold text-neutral-700 hover:text-[#0057ff] transition-colors rounded-full hover:bg-neutral-100/80 whitespace-nowrap inline-flex items-center gap-1.5"
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-[#0057ff] border border-blue-200/60">
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
                  className={`py-1.5 px-3 text-sm font-semibold transition-colors rounded-full whitespace-nowrap inline-flex items-center gap-1 ${
                    isOpen
                      ? "text-[#0057ff] bg-blue-50/80"
                      : "text-neutral-700 hover:text-[#0057ff] hover:bg-neutral-100/80"
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
                      isOpen ? "rotate-180 text-[#0057ff]" : ""
                    }`}
                  />
                  {item.badge && (
                    <span className="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200">
                      {item.badge}
                    </span>
                  )}
                </Link>

                {/* Dropdown Menu Panel */}
                {isOpen && item.children && (
                  <div
                    className="absolute top-full left-0 mt-2 w-80 bg-white/98 backdrop-blur-xl rounded-2xl border border-neutral-200/90 shadow-2xl shadow-blue-900/10 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
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
                              ? "bg-gradient-to-r from-blue-50/90 to-indigo-50/70 hover:from-blue-100 hover:to-indigo-100"
                              : "hover:bg-neutral-100/80"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[13.5px] font-bold ${
                                  sub.highlight
                                    ? "text-[#0057ff]"
                                    : "text-neutral-900 group-hover:text-[#0057ff]"
                                }`}
                              >
                                {sub.label}
                              </span>
                              {sub.badge && (
                                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-[#0057ff] text-white">
                                  {sub.badge}
                                </span>
                              )}
                            </div>
                            {sub.desc && (
                              <p className="text-[12px] text-neutral-500 leading-snug line-clamp-2 mt-0.5 m-0">
                                {sub.desc}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#0057ff] group-hover:translate-x-0.5 transition-all mt-1 shrink-0" />
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
          className="lg:hidden border-t border-neutral-200 bg-white px-4 py-4 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto"
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

          {/* Mobile Navigation List with Accordion */}
          <div className="space-y-1">
            {navItems.map((item) => {
              if (!item.children || item.children.length === 0) {
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between py-2.5 px-3 text-sm font-bold text-neutral-800 hover:text-[#0057ff] rounded-xl hover:bg-neutral-50"
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-[#0057ff] border border-blue-200/60">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              }

              const isExpanded = Boolean(mobileExpanded[item.key]);

              return (
                <div key={item.key} className="border-b border-neutral-100 pb-1">
                  <div className="flex items-center justify-between py-2 px-3">
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="text-sm font-bold text-neutral-900 hover:text-[#0057ff]"
                    >
                      {item.label}
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleMobileGroup(item.key)}
                      className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg"
                      aria-label={`Mở rộng ${item.label}`}
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? "rotate-180 text-[#0057ff]" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="pl-4 pr-2 py-1 space-y-1 bg-neutral-50/70 rounded-xl mb-1">
                      {item.children.map((sub) => (
                        <Link
                          key={sub.href + sub.label}
                          href={sub.href}
                          onClick={() => setOpen(false)}
                          className="flex items-start justify-between py-2 px-2.5 rounded-lg text-xs font-semibold text-neutral-700 hover:text-[#0057ff] hover:bg-white"
                        >
                          <div>
                            <div className="font-bold flex items-center gap-1.5">
                              <span>{sub.label}</span>
                              {sub.badge && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-[#0057ff] text-white">
                                  {sub.badge}
                                </span>
                              )}
                            </div>
                            {sub.desc && (
                              <p className="text-[11px] text-neutral-500 font-normal m-0 line-clamp-1">
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

          <div className="pt-2 border-t border-neutral-100 flex flex-col gap-2.5">
            <AuthNav isMobile onNavigate={() => setOpen(false)} />
            <Link
              href="/promptkichban"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-[#0057ff] rounded-xl shadow-md shadow-blue-500/20"
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
                <Link href="/games" className="hover:text-white transition-colors">
                  Kho Game Web Trí Tuệ (65+)
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
