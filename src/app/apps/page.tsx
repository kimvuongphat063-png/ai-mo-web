import Link from "next/link";
import { Laptop, ArrowRight, ShieldCheck, Download, CheckCircle2, Cpu, Sparkles, Terminal } from "lucide-react";
import { getAllAppsWithManifest } from "@/lib/apps-manifest";
import { AppsClientView } from "@/components/apps-client-view";
import { getSession } from "@/lib/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "19+ App Miễn Phí Chạy Offline — AI MỞ Studio",
  description:
    "Bộ sưu tập công cụ số và động cơ giải toán offline độc lập. Bảo mật dữ liệu 100% trên thiết bị cá nhân, chạy mượt mà không cần internet.",
  alternates: {
    canonical: "https://ai-mo-web.vercel.app/apps",
  },
};

export default async function AppsPage() {
  const session = await getSession();
  const appsWithManifest = getAllAppsWithManifest();

  return (
    <main id="main-content" className="container py-10 sm:py-14 space-y-12">
      {/* ── HEADER HERO SECTION ────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-b from-[#EAF2FF]/60 via-white to-white border border-[#155EEF]/15 p-6 sm:p-10 shadow-xs">
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF2FF] border border-[#155EEF]/20 text-[#155EEF] text-xs font-bold tracking-wide">
            <Cpu className="w-3.5 h-3.5" />
            <span>Workspace Công cụ Thuật toán & Giáo dục số</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-900 leading-[1.15]">
            19+ Ứng dụng độc lập{" "}
            <span className="text-[#155EEF]">chạy 100% offline</span>
          </h1>

          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed max-w-2xl">
            Các công cụ giải quyết bài toán thật: máy ra đề Toán cấp 1 & 2 chuẩn GDPT 2018, tính lãi đơn sàn TMĐT, định giá khuyến mãi, bảng báo giá B2B và luyện gõ 10 ngón. Chạy trực tiếp trên trình duyệt, không gửi dữ liệu ra ngoài.
          </p>

          <div className="flex flex-wrap gap-3 pt-2 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              100% Cục bộ · Zero Telemetry
            </span>
            <span className="flex items-center gap-1.5 text-[#155EEF] bg-[#EAF2FF] px-3 py-1.5 rounded-xl border border-[#155EEF]/20">
              <CheckCircle2 className="w-4 h-4 text-[#155EEF]" />
              Không quảng cáo · Không server ngoài
            </span>
            <span className="flex items-center gap-1.5 text-neutral-700 bg-neutral-100 px-3 py-1.5 rounded-xl border border-neutral-200">
              <Download className="w-4 h-4 text-neutral-600" />
              Tải file về máy dùng vĩnh viễn
            </span>
          </div>
        </div>

        {/* Decorative background grid blur */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 bg-radial from-[#155EEF]/10 to-transparent rounded-full blur-2xl pointer-events-none" />
      </section>

      {/* ── LIVE INTERACTIVE APPS CLIENT VIEW ─────────────────────────── */}
      <AppsClientView apps={appsWithManifest} isLoggedIn={Boolean(session)} />

      {/* ── BANNER CTA TO STUDIO PROMPT ───────────────────────────────── */}
      <section className="rounded-3xl bg-linear-to-br from-neutral-900 via-neutral-900 to-blue-950 text-white p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-neutral-800">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Studio của AI MỞ</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Muốn biến ý tưởng thành kịch bản video AI chuyên nghiệp?
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            Dùng thử PromptKichBan: Công cụ tự động tạo kịch bản, storyboard từng phân cảnh và prompt video tối ưu cho Sora, Kling, Runway, Luma.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
          <Link
            href="/studio/prompt-kich-ban"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#155EEF] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md shadow-[#155EEF]/30"
          >
            <span>Dùng thử Studio Prompt</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/courses"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/10"
          >
            <span>Xem khóa học AI</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
