"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X, CheckCircle2, Play } from "lucide-react";
import type { HtmlAppItem } from "@/lib/apps-data";

interface Props {
  apps: HtmlAppItem[];
}

export function AppsClientView({ apps }: Props) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { key: "all", label: "Tất cả công cụ" },
    { key: "kinh-doanh", label: "Kinh doanh & Bán lẻ" },
    { key: "quan-ly", label: "Quản lý & Tài chính" },
    { key: "ky-nang", label: "Kỹ năng & Năng suất" },
    { key: "hoc-tap", label: "Học tập & Giáo dục" },
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return apps.filter((app) => {
      const matchCategory =
        selectedCategory === "all" || app.category === selectedCategory;
      if (!matchCategory) return false;
      if (!q) return true;

      const titleMatch = app.title.toLowerCase().includes(q);
      const summaryMatch = app.summary.toLowerCase().includes(q);
      const categoryMatch = app.categoryLabel.toLowerCase().includes(q);
      const highlightsMatch = app.highlights.some((h: string) =>
        h.toLowerCase().includes(q)
      );

      return titleMatch || summaryMatch || categoryMatch || highlightsMatch;
    });
  }, [apps, query, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Search & Category Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm ứng dụng theo tên hoặc chức năng..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-neutral-50/50"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-neutral-700 rounded-md"
              aria-label="Xóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => {
            const count =
              cat.key === "all"
                ? apps.length
                : apps.filter((a) => a.category === cat.key).length;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.key
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80"
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Counter summary */}
      <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
        <span>
          Hiển thị <strong>{filtered.length}</strong> / {apps.length} ứng dụng
        </span>
        {(query || selectedCategory !== "all") && (
          <button
            onClick={() => {
              setQuery("");
              setSelectedCategory("all");
            }}
            className="text-blue-600 hover:underline font-semibold"
          >
            Đặt lại bộ lọc
          </button>
        )}
      </div>

      {/* Grid of Apps */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((app) => (
            <div
              key={app.slug}
              className="group bg-white rounded-2xl border border-neutral-200/90 p-6 flex flex-col justify-between hover:shadow-md hover:border-neutral-300 transition-all"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 uppercase tracking-wide">
                    {app.categoryLabel}
                  </span>
                  {app.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        app.badge === "Thử nghiệm"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-blue-100 text-blue-800 border border-blue-200"
                      }`}
                    >
                      {app.badge}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-neutral-900 group-hover:text-blue-600 transition-colors">
                    <Link href={`/apps/${app.slug}`}>{app.title}</Link>
                  </h3>
                  <p className="text-xs text-neutral-600 mt-2 line-clamp-3 leading-relaxed">
                    {app.summary}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                    Đặc điểm nổi bật:
                  </span>
                  <ul className="text-xs text-neutral-600 space-y-1">
                    {app.highlights.slice(0, 3).map((h: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-neutral-100 flex items-center justify-between gap-3">
                <Link
                  href={`/apps/${app.slug}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Dùng thử & Hướng dẫn</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200/80 p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-neutral-900">
            Không tìm thấy ứng dụng phù hợp
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc để xem toàn bộ danh mục ứng dụng.
          </p>
          <button
            onClick={() => {
              setQuery("");
              setSelectedCategory("all");
            }}
            className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold text-xs transition-colors"
          >
            Xem tất cả ứng dụng
          </button>
        </div>
      )}
    </div>
  );
}
