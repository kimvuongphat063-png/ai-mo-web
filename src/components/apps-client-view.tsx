"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
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
} from "lucide-react";
import type { HtmlAppWithManifest } from "@/lib/apps-manifest";
import type { AppSuiteKey } from "@/lib/apps-data";
import { SUITE_DEFINITIONS } from "@/lib/apps-data";

interface Props {
  apps: HtmlAppWithManifest[];
  isLoggedIn?: boolean;
}

export function AppsClientView({ apps, isLoggedIn = false }: Props) {
  const [query, setQuery] = useState("");
  const [selectedSuite, setSelectedSuite] = useState<string>("all");
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
      label: "Kinh doanh & Định giá",
      icon: Calculator,
      count: apps.filter((a) => a.suite === "commercial").length,
    },
    {
      key: "operations",
      label: "Vận hành & Quản trị",
      icon: Briefcase,
      count: apps.filter((a) => a.suite === "operations").length,
    },
    {
      key: "education",
      label: "Giáo dục & Toán học",
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

  function getSuiteIcon(suite: AppSuiteKey) {
    switch (suite) {
      case "commercial":
        return Calculator;
      case "operations":
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
      {/* ── TẦNG 1: COMMAND CENTER (SEARCH & SUITE FILTER TOOLBAR) ────────── */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-neutral-200/90 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box with ⌘K */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm công cụ theo tên, chức năng hoặc thuật toán..."
              className="w-full pl-10 pr-20 py-2.5 rounded-2xl border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:border-[#155EEF] focus:ring-2 focus:ring-[#155EEF]/10 transition-all bg-neutral-50/60"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {query ? (
                <button
                  onClick={() => setQuery("")}
                  className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md"
                  aria-label="Xóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-mono text-neutral-400 bg-neutral-100 border border-neutral-200 rounded-md">
                  ⌘K
                </kbd>
              )}
            </div>
          </div>

          {/* Quick Counter */}
          <div className="flex items-center justify-between md:justify-end gap-3 text-xs text-neutral-500 font-medium">
            <span>
              Tìm thấy <strong className="text-neutral-900 font-bold">{filteredApps.length}</strong> / {apps.length} công cụ
            </span>
            {(query || selectedSuite !== "all") && (
              <button
                onClick={() => {
                  setQuery("");
                  setSelectedSuite("all");
                }}
                className="text-[#155EEF] hover:underline font-semibold cursor-pointer"
              >
                Đặt lại
              </button>
            )}
          </div>
        </div>

        {/* Suite Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-neutral-100">
          {suiteFilters.map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedSuite === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => setSelectedSuite(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#155EEF] text-white shadow-sm shadow-[#155EEF]/20"
                    : "bg-neutral-100/80 text-neutral-600 hover:bg-neutral-200/70"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-neutral-500"}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? "bg-white/20 text-white" : "bg-neutral-200/80 text-neutral-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TẦNG 2: SPOTLIGHT SHOWCASE (CHỈ HIỂN THỊ KHI KHÔNG SEARCH HOẶC Ở TAB ALL) ── */}
      {!query && selectedSuite === "all" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#155EEF]" />
              <h2 className="text-sm font-bold tracking-wider text-neutral-900 uppercase">
                Spotlight · Công cụ trọng điểm nổi bật
              </h2>
            </div>
            <span className="text-xs text-neutral-500 font-mono">
              Offline Zero-Telemetry
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredApps.slice(0, 6).map((app) => {
              const SuiteIcon = getSuiteIcon(app.suite);
              return (
                <div
                  key={app.slug}
                  className="group relative bg-white rounded-3xl border border-neutral-200/90 p-6 flex flex-col justify-between hover:shadow-xl hover:border-[#155EEF]/40 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="space-y-4">
                    {/* Header Strip */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-[#EAF2FF] text-[#155EEF] flex items-center justify-center shrink-0 border border-[#155EEF]/10 group-hover:bg-[#155EEF] group-hover:text-white transition-colors">
                          <SuiteIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                            {app.suiteLabel}
                          </span>
                          <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 inline-block mt-0.5">
                            ⚡ {app.fileSizeFormatted} · Offline
                          </span>
                        </div>
                      </div>

                      {app.badge && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#155EEF] border border-[#155EEF]/20 uppercase tracking-wide">
                          {app.badge}
                        </span>
                      )}
                    </div>

                    {/* Title & Summary */}
                    <div>
                      <h3 className="text-base font-extrabold text-neutral-900 group-hover:text-[#155EEF] transition-colors line-clamp-1">
                        <Link href={`/apps/${app.slug}`}>{app.title}</Link>
                      </h3>
                      <p className="mt-1.5 text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                        {app.summary}
                      </p>
                    </div>

                    {/* Highlights bullet chips */}
                    <div className="space-y-1.5 pt-1">
                      {app.highlights.slice(0, 2).map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-xs text-neutral-600"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#155EEF] shrink-0" />
                          <span className="truncate">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dual Action Strip */}
                  <div className="pt-5 mt-5 border-t border-neutral-100 flex items-center gap-2">
                    <Link
                      href={`/apps/${app.slug}`}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#155EEF] hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-[#155EEF]/20 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Khởi chạy</span>
                    </Link>

                    <a
                      href={isLoggedIn ? `/api/apps/${app.slug}/download` : `/login?next=/apps/${app.slug}`}
                      className="py-2 px-3 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      title={isLoggedIn ? `Tải file ${app.fileName} về máy` : "Đăng nhập để tải file"}
                    >
                      {isLoggedIn ? (
                        <Download className="w-3.5 h-3.5 text-neutral-600" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                      <span>Tải file</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── TẦNG 3: SUITE MATRIX (DANH SÁCH TOÀN BỘ CÔNG CỤ HOẶC KẾT QUẢ TÌM KIẾM) ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <h2 className="text-sm font-bold tracking-wider text-neutral-900 uppercase">
              {query
                ? `Kết quả tìm kiếm ("${query}")`
                : selectedSuite === "all"
                ? "Ma trận công cụ chi tiết (All Algorithmic Tools)"
                : `Danh mục: ${SUITE_DEFINITIONS[selectedSuite as AppSuiteKey]?.label ?? selectedSuite}`}
            </h2>
          </div>
          <span className="text-xs text-neutral-500">
            {filteredApps.length} công cụ sẵn sàng
          </span>
        </div>

        {filteredApps.length > 0 ? (
          <div className="bg-white rounded-3xl border border-neutral-200/90 divide-y divide-neutral-100 overflow-hidden shadow-sm">
            {filteredApps.map((app) => {
              const SuiteIcon = getSuiteIcon(app.suite);
              return (
                <div
                  key={app.slug}
                  className="group p-4 sm:p-5 hover:bg-neutral-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left: Icon & Info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0 border border-neutral-200/70 group-hover:bg-[#EAF2FF] group-hover:text-[#155EEF] group-hover:border-[#155EEF]/20 transition-all">
                      <SuiteIcon className="w-5 h-5" />
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
                      className="py-2 px-3 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-600 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                      title={isLoggedIn ? `Tải file ${app.fileName}` : "Đăng nhập để tải file"}
                    >
                      {isLoggedIn ? (
                        <Download className="w-3.5 h-3.5" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                      <span className="hidden sm:inline">Tải về</span>
                    </a>
                  </div>
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
