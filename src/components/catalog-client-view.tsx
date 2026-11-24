"use client";

import { useState, useMemo } from "react";
import { Search, X, Filter } from "lucide-react";
import type { Product } from "@/lib/store";
import { ProductCard } from "./product-ui";

interface Props {
  initialProducts: Product[];
}

export function CatalogClientView({ initialProducts }: Props) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    initialProducts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [initialProducts]);

  // Filtered list
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialProducts.filter((product) => {
      const matchCategory =
        selectedCategory === "all" || product.category === selectedCategory;
      if (!matchCategory) return false;
      if (!q) return true;

      const nameMatch = product.name?.toLowerCase().includes(q);
      const descMatch = product.description?.toLowerCase().includes(q);
      const badgeMatch = product.badge?.toLowerCase().includes(q);
      const categoryMatch = product.category?.toLowerCase().includes(q);

      return nameMatch || descMatch || badgeMatch || categoryMatch;
    });
  }, [initialProducts, query, selectedCategory]);

  return (
    <section className="container space-y-6">
      {/* Controls: Search and Filters */}
      <div className="bg-[#101420] rounded-2xl border border-white/10/90 p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên, kỹ năng hoặc nội dung..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-[#0d1420]/50"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-slate-300 rounded-md"
              aria-label="Xóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        {categories.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === "all"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-white/5 text-slate-400 hover:bg-white/10/8/80"
              }`}
            >
              Tất cả ({initialProducts.length})
            </button>
            {categories.map((cat) => {
              const count = initialProducts.filter((p) => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-white/5 text-slate-400 hover:bg-white/10/8/80"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Results Count Summary */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Hiển thị <strong>{filtered.length}</strong> / {initialProducts.length} sản phẩm
        </span>
        {(query || selectedCategory !== "all") && (
          <button
            onClick={() => {
              setQuery("");
              setSelectedCategory("all");
            }}
            className="text-[#d4ff00] hover:underline font-semibold"
          >
            Đặt lại bộ lọc
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="product-grid">
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-[#101420] rounded-2xl border border-white/10/80 p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-white/5 text-neutral-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">
            Không tìm thấy sản phẩm phù hợp
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc để xem toàn bộ danh mục.
          </p>
          <button
            onClick={() => {
              setQuery("");
              setSelectedCategory("all");
            }}
            className="px-4 py-2 rounded-xl bg-[#d4ff00]/10 text-[#d4ff00] hover:bg-blue-100 font-semibold text-xs transition-colors"
          >
            Xem tất cả sản phẩm
          </button>
        </div>
      )}
    </section>
  );
}
