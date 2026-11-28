import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { CatalogPage } from "@/components/catalog";
import { HTML_APPS } from "@/lib/apps-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sản phẩm số & Tài nguyên AI — AI MỞ",
  description:
    "Kho sản phẩm số thực chiến: công cụ HTML độc lập, template, prompt, skill, bộ giải pháp và khóa học cơ bản giúp bạn ứng dụng ngay vào công việc.",
  alternates: {
    canonical: "https://www.heyaimo.com/products",
  },
};

export default function ProductsPage() {
  const readyTools = HTML_APPS.filter((app) => app.isFeatured && app.status === "ready").slice(0, 3);

  return (
    <div className="space-y-2">
      <CatalogPage
        title="Sản phẩm số & Tài nguyên thực chiến"
        eyebrow="TOOL · PROMPT · SKILL · TEMPLATE · BỘ GIẢI PHÁP · KHÓA CƠ BẢN"
        intro="Kho sản phẩm số thực chiến, bộ prompt/skill đóng gói và công cụ độc lập giúp chủ shop & người làm kinh doanh tiết kiệm hàng chục giờ mỗi tuần."
        filter={() => true}
        themeColor="#10b981"
        mascotImage="/mascot/v2-fullbody-products.png"
        mascotSpeech="📦 Kho báu template, skill & công cụ đóng gói sẵn — dùng được ngay!"
        mascotRole="AI MỞ · ASSET VAULT HOST"
      />

      {readyTools.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-14">
          <div className="rounded-3xl bg-[#101420]/90 border border-emerald-500/25 p-6 sm:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Đang mở dùng thử &amp; tải Offline ngay</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  Bộ Công Cụ Thực Chiến AI Mở Studio
                </h2>
              </div>
              <Link
                href="/apps"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300"
              >
                Xem toàn bộ Kho Công Cụ <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {readyTools.map((app) => (
                <Link
                  key={app.slug}
                  href={`/apps/${app.slug}`}
                  className="group rounded-2xl bg-[#0b101b] border border-white/10 hover:border-emerald-400/50 p-5 flex flex-col justify-between gap-4 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-bold uppercase text-emerald-400">
                        {app.categoryLabel}
                      </span>
                      {app.badge && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
                          {app.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {app.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {app.summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="font-bold text-white">
                      {app.coffeePrice
                        ? `Dùng thử Free · Tải ${app.coffeePrice.toLocaleString("vi-VN")}đ`
                        : "Miễn phí"}
                    </span>
                    <span className="text-emerald-400 font-semibold inline-flex items-center gap-1">
                      Mở ngay <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
