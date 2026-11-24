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
    gradient: "from-slate-900 to-[#0d1627]",
    pillBg: "bg-[#d4ff00]/10 text-[#d4ff00] border-[#d4ff00]/30/80",
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
    pillBg: "bg-[#d4ff00]/10 text-[#d4ff00] border-[#d4ff00]/30/80",
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
    gradient: "from-slate-900 to-[#0a1e24]",
    pillBg: "bg-teal-50 text-teal-700 border-teal-200/80",
    pillText: "Timeboxing",
    tagline: "Phân bổ ưu tiên và đo lường tỷ lệ hoàn thành",
  },
  "may-ra-de-toan-cap-1": {
    image: "/images/home/action-apps-free.jpg",
    gradient: "from-slate-900 to-[#220d24]",
    pillBg: "bg-purple-50 text-purple-700 border-purple-200/80",
    pillText: "GDPT 2018",
    tagline: "Sinh đề thi Toán Lớp 1 - 5 kèm ma trận đáp án A4",
  },
  "giai-toan-cap-2": {
    gradient: "from-slate-900 to-[#170e28]",
    pillBg: "bg-violet-50 text-violet-700 border-violet-200/80",
    pillText: "Động cơ BigInt",
    tagline: "Giải chi tiết từng bước, chấm điểm tương tác",
  },
  "toan-lop-4-hk1": {
    gradient: "from-slate-900 to-[#200c25]",
    pillBg: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/80",
    pillText: "Ôn tập HK1",
    tagline: "Bộ đề ôn tập phân số, 4 phép tính có lời văn",
  },
  "luyen-go-10-ngon": {
    gradient: "from-slate-900 to-[#0b1c2b]",
    pillBg: "bg-cyan-50 text-cyan-700 border-cyan-200/80",
    pillText: "Đo WPM chuẩn",
    tagline: "Luyện công thái học bàn phím, phản xạ gõ nhanh",
  },
};

// Modern category themes for App Icons (Apple / Game Hub style)
const SUITE_THEMES: Record<
  string,
  {
    gradient: string;
    shadow: string;
    glow: string;
    pillBg: string;
    pillText: string;
    pillBorder: string;
    icon: typeof Calculator;
  }
> = {
  commercial: {
    gradient: "from-emerald-400 via-emerald-500 to-teal-700",
    shadow: "shadow-[0_8px_24px_rgba(16,185,129,0.35)]",
    glow: "bg-emerald-500",
    pillBg: "bg-emerald-500/15",
    pillText: "text-emerald-300",
    pillBorder: "border-emerald-500/30",
    icon: Calculator,
  },
  finance: {
    gradient: "from-cyan-400 via-sky-500 to-blue-600",
    shadow: "shadow-[0_8px_24px_rgba(6,182,212,0.35)]",
    glow: "bg-cyan-500",
    pillBg: "bg-cyan-500/15",
    pillText: "text-cyan-300",
    pillBorder: "border-cyan-500/30",
    icon: Receipt,
  },
  production: {
    gradient: "from-amber-400 via-orange-500 to-red-600",
    shadow: "shadow-[0_8px_24px_rgba(249,115,22,0.35)]",
    glow: "bg-orange-500",
    pillBg: "bg-orange-500/15",
    pillText: "text-orange-300",
    pillBorder: "border-orange-500/30",
    icon: Factory,
  },
  marketing: {
    gradient: "from-pink-500 via-rose-500 to-purple-600",
    shadow: "shadow-[0_8px_24px_rgba(236,72,153,0.35)]",
    glow: "bg-pink-500",
    pillBg: "bg-pink-500/15",
    pillText: "text-pink-300",
    pillBorder: "border-pink-500/30",
    icon: Megaphone,
  },
  governance: {
    gradient: "from-purple-500 via-indigo-600 to-violet-700",
    shadow: "shadow-[0_8px_24px_rgba(168,85,247,0.35)]",
    glow: "bg-purple-500",
    pillBg: "bg-purple-500/15",
    pillText: "text-purple-300",
    pillBorder: "border-purple-500/30",
    icon: Briefcase,
  },
  education: {
    gradient: "from-blue-500 via-indigo-500 to-sky-600",
    shadow: "shadow-[0_8px_24px_rgba(59,130,246,0.35)]",
    glow: "bg-blue-500",
    pillBg: "bg-blue-500/15",
    pillText: "text-blue-300",
    pillBorder: "border-blue-500/30",
    icon: GraduationCap,
  },
  cognitive: {
    gradient: "from-violet-500 via-purple-600 to-cyan-500",
    shadow: "shadow-[0_8px_24px_rgba(139,92,246,0.35)]",
    glow: "bg-violet-500",
    pillBg: "bg-violet-500/15",
    pillText: "text-violet-300",
    pillBorder: "border-violet-500/30",
    icon: Keyboard,
  },
};

function getAppSpecificIcon(app: HtmlAppWithManifest) {
  const slug = app.slug.toLowerCase();
  if (slug.includes("toan") || slug.includes("math")) return GraduationCap;
  if (slug.includes("go-10-ngon") || slug.includes("typing") || slug.includes("keyboard")) return Keyboard;
  if (slug.includes("lai-that") || slug.includes("gia-ban") || slug.includes("calc")) return Calculator;
  if (slug.includes("bao-gia") || slug.includes("hoa-don") || slug.includes("invoice") || slug.includes("sao-ke")) return Receipt;
  if (slug.includes("kho") || slug.includes("san-xuat") || slug.includes("bom") || slug.includes("fefo")) return Factory;
  if (slug.includes("quang-cao") || slug.includes("marketing") || slug.includes("content") || slug.includes("roas")) return Megaphone;
  if (slug.includes("hop-dong") || slug.includes("quan-tri") || slug.includes("sop") || slug.includes("dai-ly")) return Briefcase;
  return SUITE_THEMES[app.suite]?.icon || Cpu;
}

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
      <div className="bg-[#101420]/90 backdrop-blur-md rounded-3xl border border-white/10/90 p-5 sm:p-6 shadow-xs space-y-4">
        {/* Thanh tìm kiếm toàn diện với ⌘K và Live Count */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#00e5ff] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm công cụ theo tên, chức năng hoặc môn học (vd: Tính lãi đơn, Shopee, Báo giá, Toán cấp 1, BigInt...)..."
            className="w-full pl-11 pr-32 sm:pr-36 py-3 rounded-2xl border border-white/10/90 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-[#d4ff00] focus:ring-3 focus:ring-[#155EEF]/10 transition-all bg-[#101420] shadow-2xs"
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {query && (
              <button
                onClick={() => setQuery("")}
                className="p-1 text-neutral-400 hover:text-slate-300 rounded-md transition-colors cursor-pointer"
                aria-label="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#00e5ff] bg-[#d4ff00]/10 border border-[#d4ff00]/20 rounded-lg">
              <Sparkles className="w-3 h-3 text-[#00e5ff]" />
              <span>{filteredApps.length} app</span>
            </span>
            <kbd className="hidden md:inline-flex items-center px-2 py-1 text-[10px] font-mono text-neutral-400 bg-white/5 border border-white/10 rounded-md">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Danh mục tất cả công cụ để người dùng thấy ngay & nhấn vô */}
        <div className="pt-2 border-t border-white/8 space-y-2.5">
          <div className="flex items-center justify-between text-xs flex-wrap gap-2">
            <span className="font-extrabold text-slate-200 text-xs sm:text-sm flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#00e5ff]" />
              <span>Khám phá trọn bộ {apps.length} công cụ theo chuyên ngành:</span>
            </span>
            <div className="flex items-center gap-2.5 text-xs text-slate-500">
              <span>
                Tìm thấy <strong className="text-white font-bold">{filteredApps.length}</strong> / {apps.length} công cụ
              </span>
              {(query || selectedSuite !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setSelectedSuite("all");
                  }}
                  className="text-[#00e5ff] hover:underline font-bold cursor-pointer"
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
                  ? "bg-[#d4ff00] text-white shadow-xs"
                  : "bg-white/5 hover:bg-white/10/8/80 text-slate-300 border border-white/10/70"
              }`}
            >
              <span>⚡ Tất cả công cụ</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedSuite === "all" && !query ? "bg-[#101420]/20 text-white" : "bg-white/8 text-slate-300"}`}>
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
                      ? "bg-[#d4ff00] text-white shadow-xs"
                      : "bg-white/5/90 hover:bg-white/10/8/80 text-slate-300 border border-white/10/70 hover:border-white/15"
                  }`}
                >
                  <SuiteIcon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? "bg-[#101420]/20 text-white" : "bg-white/8 text-slate-300"}`}>
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
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#d4ff00] animate-pulse" />
              <h2 className="text-sm font-extrabold tracking-wider text-white uppercase">
                Spotlight · Công cụ trọng điểm nổi bật
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
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
                  className="group relative bg-[#101420] rounded-3xl border border-white/10/90 overflow-hidden flex flex-col justify-between hover:shadow-xl hover:border-[#d4ff00]/50 hover:-translate-y-1 transition-all duration-300"
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
                      <div className={`absolute inset-0 bg-gradient-to-tr ${meta?.gradient || "from-slate-900 to-[#0d1627]"} flex items-center justify-center p-6 text-white`}>
                        <div className="text-center space-y-1">
                          <SuiteIcon className="w-12 h-12 mx-auto text-white/90 drop-shadow-md" />
                          <span className="text-xs font-bold text-white/80 block uppercase tracking-wider">{app.suiteLabel}</span>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="bg-[#101420]/95 text-white font-mono text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                        ⚡ {app.fileSizeFormatted}
                      </span>
                      {app.badge && (
                        <span className="bg-[#d4ff00] text-black text-[10px] font-black px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(212,255,0,0.3)] uppercase tracking-wide">
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
                      <h3 className="text-base sm:text-lg font-extrabold text-white group-hover:text-[#00e5ff] transition-colors leading-snug">
                        <Link href={`/apps/${app.slug}`}>{app.title}</Link>
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {app.summary}
                      </p>

                      <div className="space-y-1.5 pt-3 border-t border-white/8 mt-3">
                        {app.highlights.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-slate-400">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#00e5ff] shrink-0" />
                            <span className="truncate">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Strip */}
                    <div className="pt-4 mt-2 border-t border-white/8 flex items-center gap-2">
                      <Link
                        href={`/apps/${app.slug}`}
                        className="flex-1 py-2.5 px-3.5 rounded-xl bg-[#00e5ff]/15 hover:bg-[#00e5ff] text-[#00e5ff] hover:text-black border border-[#00e5ff]/40 text-xs font-black transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.15)] hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] cursor-pointer"
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
                            ? "bg-emerald-100 hover:bg-emerald-200 !text-neutral-900 border-emerald-300"
                            : "bg-[#fef9c3] hover:bg-[#fef08a] !text-neutral-900 border-amber-300"
                        }`}
                        style={{ color: "#171717" }}
                        title={isLoggedIn ? `Tải file ${app.fileName} về máy` : "Đăng nhập để tải file"}
                      >
                        {isLoggedIn ? (
                          <Download className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                        )}
                        <span className="text-neutral-900 font-bold" style={{ color: "#171717" }}>
                          {isLoggedIn ? "Tải file" : "Đăng nhập tải"}
                        </span>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                {query
                  ? `Kết quả tìm kiếm cho: "${query}"`
                  : selectedSuite === "all"
                  ? `Danh mục toàn bộ ${apps.length} công cụ & ứng dụng theo chủ đề`
                  : `Chủ đề: ${SUITE_DEFINITIONS[selectedSuite as AppSuiteKey]?.label ?? selectedSuite}`}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tất cả đều chạy độc lập 100% trong trình duyệt, không cài đặt, không gửi dữ liệu ra máy chủ ngoài.
            </p>
          </div>

          {/* View Mode Toggle: Grid vs List */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10/70 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-[#101420] text-[#00e5ff] shadow-xs"
                  : "text-slate-500 hover:text-slate-200"
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
                  ? "bg-[#101420] text-[#00e5ff] shadow-xs"
                  : "text-slate-500 hover:text-slate-200"
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-neutral-50 via-blue-50/30 to-white border border-white/10/80">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#101420] border border-white/10 shadow-2xs flex items-center justify-center text-[#00e5ff] shrink-0">
                        <GroupIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-white">
                          {group.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {group.desc}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-[#101420] px-3 py-1 rounded-full border border-white/10 shrink-0 self-start sm:self-auto">
                      {group.apps.length} ứng dụng
                    </span>
                  </div>

                  {/* DISPLAY MODE: GRID VIEW */}
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {group.apps.map((app) => {
                        const meta = APP_MOCKUP_METAS[app.slug];
                        const suiteTheme = SUITE_THEMES[app.suite] || SUITE_THEMES.commercial;
                        const AppIcon = getAppSpecificIcon(app);
                        return (
                          <div
                            key={app.slug}
                            className="group bg-[#101420] rounded-3xl border border-white/10 hover:border-[#d4ff00]/50 hover:shadow-[0_8px_30px_rgba(212,255,0,0.12)] overflow-hidden flex flex-col justify-between hover:-translate-y-1 transition-all duration-300"
                          >
                            {/* Card Visual Header: Modern Apple/Game Hub App Icon Header */}
                            <div className="relative p-5 pb-4 bg-gradient-to-b from-white/[0.06] via-white/[0.02] to-transparent border-b border-white/8 overflow-hidden">
                              {/* Ambient glowing orb for category vibe */}
                              <div
                                className={`absolute -top-6 -left-6 w-32 h-32 rounded-full ${suiteTheme.glow} blur-2xl opacity-35 pointer-events-none`}
                              />

                              <div className="relative z-10 flex items-start justify-between gap-3">
                                {/* Modern App Icon (Apple/Game Hub style) */}
                                <div
                                  className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr ${suiteTheme.gradient} p-0.5 shadow-lg ${suiteTheme.shadow} ring-1 ring-white/30 group-hover:scale-105 group-hover:rotate-1 transition-all duration-300 shrink-0 flex items-center justify-center`}
                                >
                                  <AppIcon className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-md" />
                                </div>

                                {/* Top Right Badges */}
                                <div className="flex flex-col items-end gap-1.5">
                                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                    {app.badge && (
                                      <span className="bg-[#d4ff00] text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(212,255,0,0.3)] uppercase tracking-wide">
                                        {app.badge}
                                      </span>
                                    )}
                                    <span
                                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${suiteTheme.pillBg} ${suiteTheme.pillText} border ${suiteTheme.pillBorder}`}
                                    >
                                      {app.suiteLabel}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                                      ⚡ {app.fileSizeFormatted}
                                    </span>
                                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                                      Offline
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Tagline / Engine spec strip */}
                              <div className="mt-3.5 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px]">
                                <span className="text-slate-400 font-medium truncate max-w-[210px]">
                                  {meta?.tagline || app.engineSpec || "Thuật toán xử lý cục bộ 100%"}
                                </span>
                                <span className="text-[#00e5ff] font-semibold text-[10.5px] group-hover:underline flex items-center gap-0.5 shrink-0">
                                  Khám phá →
                                </span>
                              </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-5 sm:p-6 space-y-3.5 flex-1 flex flex-col justify-between">
                              <div className="space-y-2">
                                <h4 className="text-base font-extrabold text-white group-hover:text-[#00e5ff] transition-colors leading-snug">
                                  <Link href={`/apps/${app.slug}`}>{app.title}</Link>
                                </h4>

                                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                  {app.summary}
                                </p>

                                <div className="space-y-1.5 pt-2 border-t border-white/8">
                                  {app.highlights.slice(0, 2).map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-[11.5px] text-slate-400">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00e5ff] shrink-0" />
                                      <span className="truncate">{item}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Card Actions */}
                              <div className="pt-4 border-t border-white/8 flex items-center gap-2">
                                <Link
                                  href={`/apps/${app.slug}`}
                                  className="flex-1 py-2 px-3 rounded-xl bg-[#00e5ff]/15 hover:bg-[#00e5ff] text-[#00e5ff] hover:text-black border border-[#00e5ff]/40 text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(0,229,255,0.12)] hover:shadow-[0_0_18px_rgba(0,229,255,0.35)] cursor-pointer"
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
                                      ? "bg-emerald-100 hover:bg-emerald-200 !text-neutral-900 border-emerald-300"
                                      : "bg-[#fef9c3] hover:bg-[#fef08a] !text-neutral-900 border-amber-300"
                                  }`}
                                  style={{ color: "#171717" }}
                                  title={isLoggedIn ? `Tải file ${app.fileName} về máy` : "Đăng nhập để tải file"}
                                >
                                  {isLoggedIn ? (
                                    <Download className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                                  ) : (
                                    <Lock className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                                  )}
                                  <span className="text-neutral-900 font-bold" style={{ color: "#171717" }}>
                                    Tải file
                                  </span>
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* DISPLAY MODE: MATRIX LIST VIEW */
                    <div className="bg-[#101420] rounded-3xl border border-white/10/90 divide-y divide-neutral-100 overflow-hidden shadow-sm">
                      {group.apps.map((app) => (
                        <div
                          key={app.slug}
                          className="group p-4 sm:p-5 hover:bg-[#0d1420]/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          {/* Left: Icon & Info */}
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="w-11 h-11 rounded-2xl bg-white/5 text-slate-300 flex items-center justify-center shrink-0 border border-white/10/70 group-hover:bg-[#d4ff00]/10 group-hover:text-[#00e5ff] group-hover:border-[#d4ff00]/20 transition-all">
                              <GroupIcon className="w-5 h-5" />
                            </div>

                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Link
                                  href={`/apps/${app.slug}`}
                                  className="text-sm sm:text-base font-extrabold text-white hover:text-[#00e5ff] transition-colors truncate"
                                >
                                  {app.title}
                                </Link>

                                {app.badge && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#d4ff00]/10 text-[#00e5ff] border border-[#d4ff00]/20">
                                    {app.badge}
                                  </span>
                                )}

                                <span className="text-[11px] font-mono font-medium text-slate-500 bg-white/5 px-2 py-0.5 rounded-md">
                                  ⚡ {app.fileSizeFormatted}
                                </span>
                              </div>

                              <p className="text-xs text-slate-400 line-clamp-1">
                                {app.summary}
                              </p>

                              <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-400 pt-0.5">
                                <span className="text-slate-500 font-medium">
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
                              className="py-2 px-3.5 rounded-xl bg-white/5 hover:bg-[#d4ff00]/10 hover:text-[#00e5ff] text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
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
                                  ? "bg-emerald-100 hover:bg-emerald-200 !text-neutral-900 border-emerald-300"
                                  : "bg-[#fef9c3] hover:bg-[#fef08a] !text-neutral-900 border-amber-300"
                              }`}
                              style={{ color: "#171717" }}
                              title={isLoggedIn ? `Tải file ${app.fileName}` : "Đăng nhập để tải file"}
                            >
                              {isLoggedIn ? (
                                <Download className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                              ) : (
                                <Lock className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                              )}
                              <span className="hidden sm:inline text-neutral-900 font-bold" style={{ color: "#171717" }}>{isLoggedIn ? "Tải về" : "Đăng nhập"}</span>
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
          <div className="bg-[#101420] rounded-3xl border border-white/10/90 p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 text-neutral-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-200">
              Không tìm thấy công cụ phù hợp với từ khóa &ldquo;{query}&rdquo;
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Vui lòng thử tìm với từ khóa chung hơn hoặc chọn lại danh mục công cụ.
            </p>
            <button
              onClick={() => {
                setQuery("");
                setSelectedSuite("all");
              }}
              className="px-4 py-2 rounded-xl bg-[#d4ff00] text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Xem tất cả 19 công cụ
            </button>
          </div>
        )}
      </section>

      {/* ── TẦNG 4: ARCHITECTURE & ZERO-TELEMETRY GUARANTEE STRIP ────────── */}
      <section className="rounded-3xl border border-white/10/80 bg-linear-to-b from-neutral-50/80 to-white p-6 sm:p-8 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#00e5ff] uppercase tracking-wider">
              Kiến trúc thuật toán độc lập (Zero-Telemetry Architecture)
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-white">
              Tại sao công cụ của AI MỞ chạy hoàn toàn trên máy bạn?
            </h3>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Mỗi ứng dụng được đóng gói thành một file HTML duy nhất chứa toàn bộ mã nguồn, font chữ và động cơ toán học. Dữ liệu kinh doanh, ngân sách, học tập không gửi tới bất kỳ máy chủ nào. Khi mất mạng hay lưu trữ offline, phần mềm vẫn hoạt động trọn đời.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#101420] border border-white/10 text-xs font-medium text-slate-300 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Cục bộ 100%</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#101420] border border-white/10 text-xs font-medium text-slate-300 shadow-2xs">
              <FileCode2 className="w-4 h-4 text-[#00e5ff]" />
              <span>Single-File HTML</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
