import Link from "next/link";
import { Laptop, ArrowRight, ShieldCheck, Download, Play, CheckCircle2, Search } from "lucide-react";
import { HTML_APPS } from "@/lib/apps-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "14+ App HTML Miễn Phí & Dùng Thử",
  description: "Bộ sưu tập ứng dụng web HTML độc lập, chạy offline, bảo mật tuyệt đối, không cần cài đặt phức tạp cho kinh doanh, quản lý và học tập.",
};

export default function AppsPage() {
  const categories = [
    { key: "all", label: "Tất cả công cụ" },
    { key: "kinh-doanh", label: "Kinh doanh & Bán lẻ" },
    { key: "quan-ly", label: "Quản lý & Tài chính" },
    { key: "ky-nang", label: "Kỹ năng & Năng suất" },
    { key: "hoc-tap", label: "Học tập & Giáo dục" },
  ];

  return (
    <main id="main-content" className="container py-12 space-y-12">
      {/* Header */}
      <section className="max-w-3xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Laptop className="w-3.5 h-3.5" />
          <span>Thư viện ứng dụng thực dụng</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">
          14+ App HTML Miễn Phí Chạy Offline
        </h1>
        <p className="text-base text-neutral-600 leading-relaxed">
          Các công cụ giải quyết bài toán thật: tính lãi đơn hàng, định giá khuyến mãi, lập báo giá, luyện gõ 10 ngón. Hoạt động độc lập trên trình duyệt, không gửi dữ liệu lên server, bảo mật 100% trên thiết bị của bạn.
        </p>

        <div className="flex flex-wrap gap-4 pt-2 text-xs text-neutral-600 font-medium">
          <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            100% Dữ liệu lưu cục bộ
          </span>
          <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            Không quảng cáo / Không API ngoài
          </span>
          <span className="flex items-center gap-1.5 text-neutral-700 bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-200">
            <Download className="w-4 h-4 text-neutral-600" />
            Có thể tải file về dùng mãi mãi
          </span>
        </div>
      </section>

      {/* Grid of Apps */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
          <h2 className="text-lg font-bold text-neutral-900">
            Danh sách ứng dụng ({HTML_APPS.length})
          </h2>
          <span className="text-xs text-neutral-500">Miễn phí · Mở là dùng</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {HTML_APPS.map((app) => (
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
                    {app.highlights.slice(0, 3).map((h, idx) => (
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
      </section>

      {/* Banner CTA to Video Prompt Studio */}
      <section className="rounded-3xl bg-gradient-to-br from-neutral-900 to-neutral-800 text-white p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
            Công cụ AI chủ lực
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Bạn cần tạo video ngắn bằng AI?
          </h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            Dán kịch bản vào PromptKichBan Studio — hệ thống tự động phân cảnh, giữ nguyên vẹn câu chữ thoại gốc và xuất prompt điện ảnh cho Google Veo 3 & xAI Grok.
          </p>
        </div>
        <Link
          href="/promptkichban"
          className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg hover:shadow-blue-500/25"
        >
          <span>Mở PromptKichBan Studio</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </main>
  );
}
