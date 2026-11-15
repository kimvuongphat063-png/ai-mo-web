"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  X,
  Play,
  Download,
  Lock,
  Calculator,
  Briefcase,
  GraduationCap,
  Keyboard,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowRight,
  FileCode2,
  ExternalLink,
  LayoutGrid,
  List,
  Flame,
  Zap,
  Receipt,
  Factory,
  Megaphone,
} from "lucide-react";
import type { HtmlAppWithManifest } from "@/lib/apps-manifest";
import type { AppSuiteKey } from "@/lib/apps-data";
import { SUITE_DEFINITIONS } from "@/lib/apps-data";
import { triggerCoffeePopup } from "./donate-coffee";

interface Props {
  apps: HtmlAppWithManifest[];
  isLoggedIn?: boolean;
}

// Map specialized visual imagery or mockup styles to apps for maximum visual punch
const APP_MOCKUP_METAS: Record<
  string,
  {
    image?: string;
    gradient: string;
    pillBg: string;
    pillText: string;
    tagline: string;
  }
> = {
  "lai-that-tung-don": {
    image: "/images/home/bento-profit-calc.jpg",
    gradient: "from-blue-600 to-indigo-700",
    pillBg: "bg-blue-50 text-blue-700 border-blue-200/80",
    pillText: "Phổ biến nhất",
    tagline: "Khấu trừ phí sàn Shopee/TikTok · Lợi nhuận ròng",
  },
  "gia-ban-khuyen-mai": {
    image: "/images/home/bento-pricing-tool.jpg",
    gradient: "from-indigo-600 to-purple-700",
    pillBg: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    pillText: "Điểm hòa vốn",
    tagline: "Mô phỏng 3 kịch bản Flash Sale không lỗ",
  },
  "bang-bao-gia-a4": {
    image: "/images/home/article-apps-offline.jpg",
    gradient: "from-sky-600 to-blue-700",
    pillBg: "bg-sky-50 text-sky-700 border-sky-200/80",
    pillText: "B2B Pro",
    tagline: "Xuất file PDF & Excel báo giá khách hàng 2 phút",
  },
  "ctv-affiliate": {
    gradient: "from-blue-500 via-indigo-600 to-blue-700",
    pillBg: "bg-blue-50 text-blue-700 border-blue-200/80",
    pillText: "Sổ hoa hồng",
    tagline: "Đối soát hoa hồng CTV và thanh toán minh bạch",
  },
  "quan-ly-dai-ly": {
    gradient: "from-indigo-600 via-blue-600 to-slate-800",
    pillBg: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    pillText: "Chiết khấu",
    tagline: "Quản lý công nợ, hạn mức và volume thưởng quý",
  },
  "ngan-sach-gia-dinh": {
    gradient: "from-emerald-600 to-teal-700",
    pillBg: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    pillText: "6 phong bì",
    tagline: "Theo dõi thu chi 12 tháng, bảo mật cục bộ",
  },
  "cham-soc-khach-hang": {
    gradient: "from-teal-600 to-emerald-700",
    pillBg: "bg-teal-50 text-teal-700 border-teal-200/80",
    pillText: "Tái mua hàng",
    tagline: "Nhắc lịch bảo dưỡng, nhật ký tương tác khách",
  },
  "sop-checklist": {
    gradient: "from-green-600 to-teal-700",
    pillBg: "bg-green-50 text-green-700 border-green-200/80",
    pillText: "Quy trình SOP",
    tagline: "Checklist kiểm soát chất lượng không bỏ sót bước",
  },
  "ke-hoach-tuan": {
    gradient: "from-teal-500 to-cyan-700",
    pillBg: "bg-teal-50 text-teal-700 border-teal-200/80",
    pillText: "Timeboxing",
    tagline: "Phân bổ ưu tiên và đo lường tỷ lệ hoàn thành",
  },
  "may-ra-de-toan-cap-1": {
    image: "/images/home/action-apps-free.jpg",
    gradient: "from-purple-600 to-pink-600",
    pillBg: "bg-purple-50 text-purple-700 border-purple-200/80",
    pillText: "GDPT 2018",
    tagline: "Sinh đề thi Toán Lớp 1 - 5 kèm ma trận đáp án A4",
  },
  "giai-toan-cap-2": {
    gradient: "from-violet-600 to-purple-800",
    pillBg: "bg-violet-50 text-violet-700 border-violet-200/80",
    pillText: "Động cơ BigInt",
    tagline: "Giải chi tiết từng bước, chấm điểm tương tác",
  },
  "toan-lop-4-hk1": {
    gradient: "from-fuchsia-600 to-purple-700",
    pillBg: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/80",
    pillText: "Ôn tập HK1",
    tagline: "Bộ đề ôn tập phân số, 4 phép tính có lời văn",
  },
  "luyen-go-10-ngon": {
    gradient: "from-cyan-600 to-blue-700",
    pillBg: "bg-cyan-50 text-cyan-700 border-cyan-200/80",
    pillText: "Đo WPM chuẩn",
    tagline: "Luyện công thái học bàn phím, phản xạ gõ nhanh",
  },
};

export function AppsClientView({ apps, isLoggedIn = false }: Props) {
  const [query, setQuery] = useState("");
  const [selectedSuite, setSelectedSuite] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K keyboard shortcut to focus search input
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const suiteFilters = [
    { key: "all", label: "Tất cả công cụ", icon: Layers, count: apps.length },
    {
      key: "commercial",
      label: "Kinh doanh & Bán lẻ",
      icon: Calculator,
      count: apps.filter((a) => a.suite === "commercial").length,
    },
    {
      key: "finance",
      label: "Tài chính & Thuế",
      icon: Receipt,
      count: apps.filter((a) => a.suite === "finance").length,
    },
    {
      key: "production",
      label: "Sản xuất & Kho",
      icon: Factory,
      count: apps.filter((a) => a.suite === "production").length,
    },
    {
      key: "marketing",
      label: "Marketing",
      icon: Megaphone,
      count: apps.filter((a) => a.suite === "marketing").length,
    },
    {
      key: "governance",
      label: "Hợp đồng & Quản trị",
      icon: Briefcase,
      count: apps.filter((a) => a.suite === "governance").length,
    },
    {
      key: "education",
      label: "Giáo dục & Học tập",
      icon: GraduationCap,
      count: apps.filter((a) => a.suite === "education").length,
    },
    {
      key: "cognitive",
      label: "Kỹ năng & Tốc độ",
      icon: Keyboard,
      count: apps.filter((a) => a.suite === "cognitive").length,
    },
  ];

  const quickTags = [
    { label: "🛒 Tính lãi Shopee / TikTok", query: "lãi thật", suite: "commercial" },
    { label: "💰 Dòng tiền 13 tuần", query: "dòng tiền", suite: "finance" },
    { label: "🧾 Bảng kê hóa đơn", query: "hóa đơn", suite: "finance" },
    { label: "🏭 Định mức BOM", query: "định mức", suite: "production" },
    { label: "📦 Vị trí kho", query: "vị trí hàng", suite: "production" },
    { label: "📢 Hiệu quả quảng cáo", query: "quảng cáo", suite: "marketing" },
    { label: "📑 Theo dõi hợp đồng", query: "hợp đồng", suite: "governance" },
    { label: "📐 Máy ra đề Toán Cấp 1", query: "toán cấp 1", suite: "education" },
    { label: "⚡ Giải Toán Cấp 2 BigInt", query: "toán cấp 2", suite: "education" },
    { label: "⌨️ Luyện gõ 10 ngón", query: "gõ 10 ngón", suite: "cognitive" },
  ];

  const featuredApps = useMemo(() => {
    return apps
      .filter((a) => a.isFeatured)
      .sort((a, b) => (a.featuredRank ?? 99) - (b.featuredRank ?? 99));
  }, [apps]);

  const filteredApps = useMemo(() => {
    const q = query.trim().toLowerCase();
    return apps.filter((app) => {
      const matchSuite = selectedSuite === "all" || app.suite === selectedSuite;
      if (!matchSuite) return false;
      if (!q) return true;

      const titleMatch = app.title.toLowerCase().includes(q);
      const summaryMatch = app.summary.toLowerCase().includes(q);
      const suiteMatch = app.suiteLabel.toLowerCase().includes(q);
      const engineMatch = app.engineSpec?.toLowerCase().includes(q) ?? false;
      const highlightsMatch = app.highlights.some((h) => h.toLowerCase().includes(q));

      return titleMatch || summaryMatch || suiteMatch || engineMatch || highlightsMatch;
    });
  }, [apps, query, selectedSuite]);

  // Group apps by category for thematic presentation
  const groupedApps = useMemo(() => {
    const groups: {
      suite: AppSuiteKey;
      title: string;
      desc: string;
      icon: typeof Calculator;
      apps: HtmlAppWithManifest[];
    }[] = [
      {
        suite: "commercial",
        title: "Kinh doanh & Bán lẻ (E-Commerce, F&B & B2B)",
        desc: "Bộ công cụ tính lãi ròng, chống bán lỗ trên sàn TMĐT, quản lý đơn hàng, F&B, spa và lập báo giá xuất Excel/PDF tức thì.",
        icon: Calculator,
        apps: filteredApps.filter((a) => a.suite === "commercial"),
      },
      {
        suite: "finance",
        title: "Tài chính, Kế toán & Nghĩa vụ Thuế",
        desc: "Hệ thống dự báo dòng tiền 13 tuần, quản lý công nợ, đối chiếu sao kê ngân hàng, bảng kê hóa đơn và quyết toán thuế.",
        icon: Receipt,
        apps: filteredApps.filter((a) => a.suite === "finance"),
      },
      {
        suite: "production",
        title: "Sản xuất, Mua hàng & Quản trị Kho vận",
        desc: "Định mức vật tư BOM, lệnh sản xuất phân xưởng, kế hoạch nguyên liệu, KCS chất lượng theo lô và quản trị kho FEFO.",
        icon: Factory,
        apps: filteredApps.filter((a) => a.suite === "production"),
      },
      {
        suite: "marketing",
        title: "Tiếp thị & Tăng trưởng (Marketing & Growth)",
        desc: "Đo lường hiệu quả quảng cáo ROAS đa kênh, lịch nội dung content, phễu tuyển sinh và quản trị mục tiêu OKR.",
        icon: Megaphone,
        apps: filteredApps.filter((a) => a.suite === "marketing"),
      },
      {
        suite: "governance",
        title: "Hợp đồng, Vận hành & Quản trị Doanh nghiệp",
        desc: "Theo dõi hợp đồng kinh tế, ngân sách năm, báo cáo quản trị CEO, quản lý tài sản cho thuê và nhật ký nhắc việc.",
        icon: Briefcase,
        apps: filteredApps.filter((a) => a.suite === "governance"),
      },
      {
        suite: "education",
        title: "Giáo dục & Thuật toán Toán học",
        desc: "Máy sinh đề thi A4 GDPT 2018, giải toán THCS BigInt, ôn tập ngoại ngữ và bộ công cụ quản lý trường học, trung tâm đào tạo.",
        icon: GraduationCap,
        apps: filteredApps.filter((a) => a.suite === "education"),
      },
      {
        suite: "cognitive",
        title: "Kỹ năng & Tốc độ làm việc",
        desc: "Ứng dụng rèn luyện công thái học bàn phím 10 ngón và gia tăng tốc độ gõ phím đạt chuẩn WPM.",
        icon: Keyboard,
        apps: filteredApps.filter((a) => a.suite === "cognitive"),
      },
    ];

    // If a specific suite is selected, only keep that group
    if (selectedSuite !== "all") {
      return groups.filter((g) => g.suite === selectedSuite && g.apps.length > 0);
    }
    return groups.filter((g) => g.apps.length > 0);
  }, [filteredApps, selectedSuite]);

  function getSuiteIcon(suite: AppSuiteKey) {
    switch (suite) {
      case "commercial":
        return Calculator;
      case "finance":
        return Receipt;
      case "production":
        return Factory;
      case "marketing":
        return Megaphone;
      case "governance":
        return Briefcase;
      case "education":
        return GraduationCap;
      case "cognitive":
        return Keyboard;
      default:
        return Cpu;
    }
  }

  return (
    <div className="space-y-12">
      {/* ── TẦNG 1: COMMAND CENTER (BỘ ĐIỀU HƯỚNG & TÌM KIẾM TRỰC QUAN) ────────── */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-neutral-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        {/* Thanh tìm kiếm toàn diện với ⌘K và Live Count */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#155EEF] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm công cụ theo tên, chức năng hoặc môn học (vd: Tính lãi đơn, Shopee, Báo giá, Toán cấp 1, BigInt...)..."
            className="w-full pl-11 pr-32 sm:pr-36 py-3 rounded-2xl border border-neutral-200/90 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:border-[#155EEF] focus:ring-3 focus:ring-[#155EEF]/10 transition-all bg-white shadow-2xs"
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {query && (
              <button
                onClick={() => setQuery("")}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md transition-colors cursor-pointer"
                aria-label="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#155EEF] bg-[#EAF2FF] border border-[#155EEF]/20 rounded-lg">
              <Sparkles className="w-3 h-3 text-[#155EEF]" />
              <span>{filteredApps.length} app</span>
            </span>
            <kbd className="hidden md:inline-flex items-center px-2 py-1 text-[10px] font-mono text-neutral-400 bg-neutral-100 border border-neutral-200 rounded-md">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Danh mục tất cả công cụ để người dùng thấy ngay & nhấn vô */}
        <div className="pt-2 border-t border-neutral-100 space-y-2.5">
          <div className="flex items-center justify-between text-xs flex-wrap gap-2">
            <span className="font-extrabold text-neutral-800 text-xs sm:text-sm flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#155EEF]" />
              <span>Khám phá trọn bộ {apps.length} công cụ theo chuyên ngành:</span>
            </span>
            <div className="flex items-center gap-2.5 text-xs text-neutral-500">
              <span>
                Tìm thấy <strong className="text-neutral-900 font-bold">{filteredApps.length}</strong> / {apps.length} công cụ
              </span>
              {(query || selectedSuite !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setSelectedSuite("all");
                  }}
                  className="text-[#155EEF] hover:underline font-bold cursor-pointer"
                >
                  Đặt lại
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedSuite("all");
                setQuery("");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedSuite === "all" && !query
                  ? "bg-[#155EEF] text-white shadow-xs"
                  : "bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 border border-neutral-200/70"
              }`}
            >
              <span>⚡ Tất cả công cụ</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedSuite === "all" && !query ? "bg-white/20 text-white" : "bg-neutral-200 text-neutral-700"}`}>
                {apps.length}
              </span>
            </button>

            {suiteFilters.filter((t) => t.key !== "all").map((tab) => {
              const count = tab.count;
              if (count === 0) return null;
              const isSelected = selectedSuite === tab.key && !query;
              const SuiteIcon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setSelectedSuite(tab.key);
                    setQuery("");
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-[#155EEF] text-white shadow-xs"
                      : "bg-neutral-100/90 hover:bg-neutral-200/80 text-neutral-700 border border-neutral-200/70 hover:border-neutral-300"
                  }`}
                >
                  <SuiteIcon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? "bg-white/20 text-white" : "bg-neutral-200 text-neutral-700"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── TẦNG 2: SPOTLIGHT SHOWCASE (KHI Ở TAB ALL VÀ CHƯA TÌM KIẾM) ── */}
      {!query && selectedSuite === "all" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#155EEF] animate-pulse" />
              <h2 className="text-sm font-extrabold tracking-wider text-neutral-900 uppercase">
                Spotlight · Công cụ trọng điểm nổi bật
              </h2>
            </div>
            <span className="text-xs text-neutral-500 font-mono">
              Offline 100% · Không Server
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredApps.slice(0, 3).map((app) => {
              const SuiteIcon = getSuiteIcon(app.suite);
              const meta = APP_MOCKUP_METAS[app.slug];
              return (
                <div
                  key={app.slug}
                  className="group relative bg-white rounded-3xl border border-neutral-200/90 overflow-hidden flex flex-col justify-between hover:shadow-xl hover:border-[#155EEF]/50 hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Thumbnail Banner */}
                  <div className="relative h-44 w-full bg-gradient-to-tr from-neutral-900 via-neutral-800 to-blue-950 overflow-hidden">
                    {meta?.image ? (
                      <Image
                        src={meta.image}
                        alt={app.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                      />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-tr ${meta?.gradient || "from-blue-600 to-indigo-700"} flex items-center justify-center p-6 text-white`}>
                        <div className="text-center space-y-1">
                          <SuiteIcon className="w-12 h-12 mx-auto text-white/90 drop-shadow-md" />
                          <span className="text-xs font-bold text-white/80 block uppercase tracking-wider">{app.suiteLabel}</span>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="bg-white/95 text-neutral-900 font-mono text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                        ⚡ {app.fileSizeFormatted}
                      </span>
                      {app.badge && (
                        <span className="bg-[#155EEF] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-xs uppercase tracking-wide">
                          {app.badge}
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <span className="text-[11px] font-medium text-blue-200 block truncate">
                        {meta?.tagline || app.suiteLabel}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base sm:text-lg font-extrabold text-neutral-900 group-hover:text-[#155EEF] transition-colors leading-snug">
                        <Link href={`/apps/${app.slug}`}>{app.title}</Link>
                      </h3>
                      <p className="mt-1.5 text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                        {app.summary}
                      </p>

                      <div className="space-y-1.5 pt-3 border-t border-neutral-100 mt-3">
                        {app.highlights.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-neutral-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#155EEF] shrink-0" />
                            <span className="truncate">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Strip */}
                    <div className="pt-4 mt-2 border-t border-neutral-100 flex items-center gap-2">
                      <Link
                        href={`/apps/${app.slug}`}
                        className="flex-1 py-2.5 px-3.5 rounded-xl bg-[#155EEF] hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm shadow-[#155EEF]/20 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Khởi chạy app</span>
                      </Link>

                      <a
                        href={isLoggedIn ? `/api/apps/${app.slug}/download` : `/login?next=/apps/${app.slug}`}
                        onClick={() => {
                          if (isLoggedIn) {
                            triggerCoffeePopup("download");
                          }
                        }}
                        className={`py-2.5 px-3.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                          isLoggedIn
                            ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300"
                        }`}
                        title={isLoggedIn ? `Tải file ${app.fileName} về máy` : "Đăng nhập để tải file"}
                      >
                        {isLoggedIn ? (
                          <Download className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-amber-600" />
                        )}
                        <span>{isLoggedIn ? "Tải file" : "Đăng nhập tải"}</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── TẦNG 3: BỘ SƯU TẬP THEO CHỦ ĐỀ & CHẾ ĐỘ HIỂN THỊ (GRID / LIST) ── */}
      <section className="space-y-8">
        {/* Header bar with View Mode Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <h2 className="text-base sm:text-lg font-black tracking-tight text-neutral-900">
                {query
                  ? `Kết quả tìm kiếm cho: "${query}"`
                  : selectedSuite === "all"
                  ? `Danh mục toàn bộ ${apps.length} công cụ & ứng dụng theo chủ đề`
                  : `Chủ đề: ${SUITE_DEFINITIONS[selectedSuite as AppSuiteKey]?.label ?? selectedSuite}`}
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Tất cả đều chạy độc lập 100% trong trình duyệt, không cài đặt, không gửi dữ liệu ra máy chủ ngoài.
            </p>
          </div>

          {/* View Mode Toggle: Grid vs List */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl border border-neutral-200/70 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-[#155EEF] shadow-xs"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Lưới thẻ</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-white text-[#155EEF] shadow-xs"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Danh sách</span>
            </button>
          </div>
        </div>

        {/* THEMATIC GROUPS RENDERING */}
        {groupedApps.length > 0 ? (
          <div className="space-y-12">
            {groupedApps.map((group) => {
              const GroupIcon = group.icon;
              return (
                <div key={group.suite} className="space-y-5">
                  {/* Category Section Header Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-neutral-50 via-blue-50/30 to-white border border-neutral-200/80">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 shadow-2xs flex items-center justify-center text-[#155EEF] shrink-0">
                        <GroupIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-neutral-900">
                          {group.title}
                        </h3>
                        <p className="text-xs text-neutral-500 line-clamp-1">
                          {group.desc}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-neutral-500 bg-white px-3 py-1 rounded-full border border-neutral-200 shrink-0 self-start sm:self-auto">
                      {group.apps.length} ứng dụng
                    </span>
                  </div>

                  {/* DISPLAY MODE: GRID VIEW */}
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {group.apps.map((app) => {
                        const meta = APP_MOCKUP_METAS[app.slug];
                        return (
                          <div
                            key={app.slug}
                            className="group bg-white rounded-3xl border border-neutral-200/90 overflow-hidden flex flex-col justify-between hover:shadow-xl hover:border-[#155EEF]/50 hover:-translate-y-1 transition-all duration-300"
                          >
                            {/* Card Visual Header */}
                            <div className="relative h-36 w-full bg-gradient-to-tr from-neutral-900 to-slate-800 overflow-hidden">
                              {meta?.image ? (
                                <Image
                                  src={meta.image}
                                  alt={app.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
                                />
                              ) : (
                                <div className={`absolute inset-0 bg-gradient-to-br ${meta?.gradient || "from-blue-600 to-indigo-700"} p-5 flex flex-col justify-between text-white`}>
                                  <div className="flex items-center justify-between">
                                    <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center">
                                      <GroupIcon className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="font-mono text-[11px] font-semibold bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-md text-white/90">
                                      ⚡ {app.fileSizeFormatted}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider block">
                                      {app.engineSpec || "Thuật toán Cục bộ"}
                                    </span>
                                    <span className="text-xs font-extrabold text-white block truncate drop-shadow-sm">
                                      {meta?.tagline || app.title}
                                    </span>
                                  </div>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                              <div className="absolute top-3 left-3 flex items-center gap-2">
                                {app.badge && (
                                  <span className="bg-[#155EEF] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs uppercase tracking-wide">
                                    {app.badge}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-5 sm:p-6 space-y-3.5 flex-1 flex flex-col justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-neutral-400">
                                  <span className="font-semibold text-neutral-500">{app.suiteLabel}</span>
                                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-mono text-[10.5px]">
                                    ✓ Offline
                                  </span>
                                </div>

                                <h4 className="text-base font-extrabold text-neutral-900 group-hover:text-[#155EEF] transition-colors leading-snug">
                                  <Link href={`/apps/${app.slug}`}>{app.title}</Link>
                                </h4>

                                <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                                  {app.summary}
                                </p>

                                <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                                  {app.highlights.slice(0, 2).map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-[11.5px] text-neutral-600">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-[#155EEF] shrink-0" />
                                      <span className="truncate">{item}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Card Actions */}
                              <div className="pt-4 border-t border-neutral-100 flex items-center gap-2">
                                <Link
                                  href={`/apps/${app.slug}`}
                                  className="flex-1 py-2 px-3 rounded-xl bg-[#155EEF] hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-[#155EEF]/20 cursor-pointer"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                  <span>Khởi chạy</span>
                                </Link>

                                <a
                                  href={isLoggedIn ? `/api/apps/${app.slug}/download` : `/login?next=/apps/${app.slug}`}
                                  onClick={() => {
                                    if (isLoggedIn) {
                                      triggerCoffeePopup("download");
                                    }
                                  }}
                                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                                    isLoggedIn
                                      ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300"
                                      : "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300"
                                  }`}
                                  title={isLoggedIn ? `Tải file ${app.fileName} về máy` : "Đăng nhập để tải file"}
                                >
                                  {isLoggedIn ? (
                                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                                  )}
                                  <span>Tải file</span>
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* DISPLAY MODE: MATRIX LIST VIEW */
                    <div className="bg-white rounded-3xl border border-neutral-200/90 divide-y divide-neutral-100 overflow-hidden shadow-sm">
                      {group.apps.map((app) => (
                        <div
                          key={app.slug}
                          className="group p-4 sm:p-5 hover:bg-neutral-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          {/* Left: Icon & Info */}
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="w-11 h-11 rounded-2xl bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0 border border-neutral-200/70 group-hover:bg-[#EAF2FF] group-hover:text-[#155EEF] group-hover:border-[#155EEF]/20 transition-all">
                              <GroupIcon className="w-5 h-5" />
                            </div>

                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Link
                                  href={`/apps/${app.slug}`}
                                  className="text-sm sm:text-base font-extrabold text-neutral-900 hover:text-[#155EEF] transition-colors truncate"
                                >
                                  {app.title}
                                </Link>

                                {app.badge && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#155EEF] border border-[#155EEF]/20">
                                    {app.badge}
                                  </span>
                                )}

                                <span className="text-[11px] font-mono font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
                                  ⚡ {app.fileSizeFormatted}
                                </span>
                              </div>

                              <p className="text-xs text-neutral-600 line-clamp-1">
                                {app.summary}
                              </p>

                              <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-400 pt-0.5">
                                <span className="text-neutral-500 font-medium">
                                  {app.suiteLabel}
                                </span>
                                <span>•</span>
                                <span>{app.engineSpec || "Thuật toán offline độc lập"}</span>
                                <span>•</span>
                                <span className="text-emerald-700 font-medium">Bảo mật thiết bị</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-2 shrink-0 sm:self-center pl-15 sm:pl-0">
                            <Link
                              href={`/apps/${app.slug}`}
                              className="py-2 px-3.5 rounded-xl bg-neutral-100 hover:bg-[#EAF2FF] hover:text-[#155EEF] text-neutral-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Mở app</span>
                            </Link>

                            <a
                              href={isLoggedIn ? `/api/apps/${app.slug}/download` : `/login?next=/apps/${app.slug}`}
                              onClick={() => {
                                if (isLoggedIn) {
                                  triggerCoffeePopup("download");
                                }
                              }}
                              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                                isLoggedIn
                                  ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300"
                              }`}
                              title={isLoggedIn ? `Tải file ${app.fileName}` : "Đăng nhập để tải file"}
                            >
                              {isLoggedIn ? (
                                <Download className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Lock className="w-3.5 h-3.5 text-amber-600" />
                              )}
                              <span className="hidden sm:inline">{isLoggedIn ? "Tải về" : "Đăng nhập"}</span>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-neutral-200/90 p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-800">
              Không tìm thấy công cụ phù hợp với từ khóa &ldquo;{query}&rdquo;
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Vui lòng thử tìm với từ khóa chung hơn hoặc chọn lại danh mục công cụ.
            </p>
            <button
              onClick={() => {
                setQuery("");
                setSelectedSuite("all");
              }}
              className="px-4 py-2 rounded-xl bg-[#155EEF] text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Xem tất cả 19 công cụ
            </button>
          </div>
        )}
      </section>

      {/* ── TẦNG 4: ARCHITECTURE & ZERO-TELEMETRY GUARANTEE STRIP ────────── */}
      <section className="rounded-3xl border border-neutral-200/80 bg-linear-to-b from-neutral-50/80 to-white p-6 sm:p-8 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#155EEF] uppercase tracking-wider">
              Kiến trúc thuật toán độc lập (Zero-Telemetry Architecture)
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-neutral-900">
              Tại sao công cụ của AI MỞ chạy hoàn toàn trên máy bạn?
            </h3>
            <p className="text-xs text-neutral-600 max-w-2xl leading-relaxed">
              Mỗi ứng dụng được đóng gói thành một file HTML duy nhất chứa toàn bộ mã nguồn, font chữ và động cơ toán học. Dữ liệu kinh doanh, ngân sách, học tập không gửi tới bất kỳ máy chủ nào. Khi mất mạng hay lưu trữ offline, phần mềm vẫn hoạt động trọn đời.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-neutral-200 text-xs font-medium text-neutral-700 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Cục bộ 100%</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-neutral-200 text-xs font-medium text-neutral-700 shadow-2xs">
              <FileCode2 className="w-4 h-4 text-[#155EEF]" />
              <span>Single-File HTML</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
