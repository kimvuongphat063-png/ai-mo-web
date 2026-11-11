import Link from "next/link";
import { Laptop, ArrowRight, ShieldCheck, Download, CheckCircle2 } from "lucide-react";
import { HTML_APPS } from "@/lib/apps-data";
import { AppsClientView } from "@/components/apps-client-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "14+ App HTML Miễn Phí & Dùng Thử",
  description:
    "Bộ sưu tập ứng dụng web HTML độc lập, chạy offline, bảo mật tuyệt đối, không cần cài đặt phức tạp cho kinh doanh, quản lý và học tập.",
};

export default function AppsPage() {
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

      {/* Grid of Apps with Live Search & Filter */}
      <AppsClientView apps={HTML_APPS} />

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
