import Image from "next/image";
import Link from "next/link";
import { Laptop, ArrowRight, ShieldCheck, Download, CheckCircle2, Cpu, Sparkles, Terminal } from "lucide-react";
import { getAllAppsWithManifest } from "@/lib/apps-manifest";
import { AppsClientView } from "@/components/apps-client-view";
import { getSession } from "@/lib/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "95+ App Miễn Phí Chạy Offline — AI MỞ Studio",
  description:
    "Bộ sưu tập 95+ công cụ số, kế toán quản trị, dòng tiền, sản xuất, kho bãi và động cơ giải toán offline độc lập. Bảo mật dữ liệu 100% trên thiết bị cá nhân, chạy mượt mà không cần internet.",
  alternates: {
    canonical: "https://www.heyaimo.com/apps",
  },
};

export default async function AppsPage() {
  const session = await getSession();
  const appsWithManifest = getAllAppsWithManifest();

  return (
    <main id="main-content" className="container py-10 sm:py-14 space-y-12">
      {/* ── HEADER HERO SECTION ────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-[#101420]/90 backdrop-blur-2xl border border-[#00e5ff]/30 p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        {/* Cyber Grid Lines */}
        <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,229,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.15) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff] text-xs font-bold tracking-wide shadow-[0_0_15px_rgba(0,229,255,0.15)]">
              <span className="w-2 h-2 rounded-full bg-[#00e5ff] animate-mascot-ring" />
              <span>Kho 95+ App Quản Trị, Giáo Dục & Công Cụ Số Độc Lập</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-[1.15]">
              95+ Ứng dụng độc lập{" "}
              <span className="text-[#00e5ff] drop-shadow-[0_0_20px_rgba(0,229,255,0.4)]">chạy 100% offline</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              Các công cụ giải quyết bài toán thật: kế toán quản trị, dự báo dòng tiền 13 tuần, định mức sản xuất BOM, kho bãi FEFO, tính lãi TMĐT, máy ra đề Toán GDPT 2018 và luyện gõ 10 ngón. Chạy trực tiếp trên trình duyệt, không gửi dữ liệu ra ngoài.
            </p>

            <div className="flex flex-wrap gap-3 pt-2 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-300 bg-emerald-500/10 px-3.5 py-1.5 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                100% Cục bộ · Zero Telemetry
              </span>
              <span className="flex items-center gap-1.5 text-[#00e5ff] bg-[#00e5ff]/10 px-3.5 py-1.5 rounded-xl border border-[#00e5ff]/30">
                <CheckCircle2 className="w-4 h-4 text-[#00e5ff]" />
                Không quảng cáo · Không server ngoài
              </span>
              <span className="flex items-center gap-1.5 text-slate-300 bg-white/5 px-3.5 py-1.5 rounded-xl border border-white/10">
                <Download className="w-4 h-4 text-slate-400" />
                Tải file về máy dùng vĩnh viễn
              </span>
            </div>
          </div>

          {/* Right: Themed 3D Hologram Mascot Host */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center relative">
            {/* Mascot Chat Bubble */}
            <div className="mb-3 px-3.5 py-1.5 rounded-2xl bg-[#090c14]/90 border border-[#00e5ff]/40 text-center shadow-lg backdrop-blur-md animate-fade-in max-w-[260px]">
              <p className="text-[11.5px] font-mono text-[#00e5ff] font-semibold leading-snug">
                🤖 "95+ app bảo mật 100%, không lưu telemetry trên server!"
              </p>
            </div>

            {/* Mascot Stage */}
            <div className="relative w-full max-w-[220px] h-[230px] sm:h-[260px] flex items-end justify-center group select-none active:scale-95 transition-transform">
              <div className="absolute bottom-2 w-36 h-8 rounded-[100%] border border-[#00e5ff]/50 bg-[#00e5ff]/20 blur-[2px] animate-pulse" />
              <div className="absolute bottom-0 w-24 h-4 rounded-[100%] bg-[#00e5ff]/40 blur-lg" />
              <Image
                src="/mascot/v2-fullbody-apps.png"
                alt="Linh vật App Quản Trị AI Mở"
                width={200}
                height={424}
                className="relative z-10 w-auto h-full max-h-[210px] sm:max-h-[230px] object-contain object-bottom drop-shadow-[0_15px_30px_rgba(0,0,0,0.95)] group-hover:scale-110 active:scale-110 active:-translate-y-2 transition-all duration-300 animate-mascot-float-1"
                priority
              />
            </div>
            <span className="mt-1 text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
              AI MỞ · ADMIN TECH HOST
            </span>
          </div>
        </div>

        {/* Ambient glow */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 bg-radial from-[#00e5ff]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* ── LIVE INTERACTIVE APPS CLIENT VIEW ─────────────────────────── */}
      <AppsClientView apps={appsWithManifest} isLoggedIn={Boolean(session)} />

      {/* ── BANNER CTA TO STUDIO PROMPT ───────────────────────────────── */}
      <section className="rounded-3xl bg-linear-to-br from-neutral-900 via-neutral-900 to-blue-950 text-white p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-neutral-800">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4ff00]/10 text-[#d4ff00] border border-[#d4ff00]/30 text-xs font-semibold">
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
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#d4ff00] hover:bg-[#b8e000] text-black text-xs font-bold transition-all shadow-md shadow-[#d4ff00]/30"
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
