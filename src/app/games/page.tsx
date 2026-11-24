import Image from "next/image";
import Link from "next/link";
import {
  Gamepad2,
  ShieldCheck,
  CheckCircle2,
  Volume2,
  Maximize2,
  ArrowRight,
  Flame,
  Zap,
  Play,
  Brain,
  Eye,
  Trophy,
  Sparkles,
} from "lucide-react";
import type { Metadata } from "next";
import { GAMES_DATA, GAME_COLLECTIONS } from "@/lib/games-data";
import { GamesClientView } from "@/components/games-client-view";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Kho 65+ Mini Game Web Trí Tuệ & Bảng Số Schulte Focus — AI Mở Studio",
  description:
    "Kho 65+ trò chơi web tương tác giúp rèn luyện tư duy logic, trí nhớ và phản xạ. Nổi bật với Game Schulte Focus tăng tốc đọc 300% & mở rộng thị giác ngoại vi. 100% không quảng cáo, chạy mượt mà trên mọi thiết bị.",
  alternates: {
    canonical: "https://www.heyaimo.com/games",
  },
};

export default async function GamesPage() {
  const session = await getSession();
  const isLoggedIn = Boolean(session);

  return (
    <main id="main-content" className="container py-8 sm:py-12 space-y-10 max-w-7xl mx-auto px-4 sm:px-6">
      {/* ── BREADCRUMBS ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
        <Link href="/" className="hover:text-white transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <span className="text-white font-semibold">Kho Game Web Trí Tuệ & Schulte Focus</span>
      </div>

      {/* ── TOP HERO SPOTLIGHT: SCHULTE FOCUS LEAD MAGNET ──────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#12162a]/95 via-[#0d1222]/95 to-[#15102a]/95 backdrop-blur-2xl border-2 border-[#d946ef]/40 p-6 sm:p-10 shadow-[0_20px_60px_rgba(217,70,239,0.22)]">
        {/* Cyber Grid Lines & Neon Glows */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(217,70,239,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(212,255,0,0.18) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute -top-32 -left-20 w-80 h-80 rounded-full bg-[#d946ef]/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-20 w-80 h-80 rounded-full bg-[#d4ff00]/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Slogan, Value Prop & Direct Action */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#d946ef]/25 to-[#d4ff00]/25 border border-[#d4ff00]/60 text-[#d4ff00] text-xs font-mono font-bold tracking-wide shadow-[0_0_15px_rgba(212,255,0,0.25)] animate-pulse">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>HOT LEAD MAGNET · TÂM ĐIỂM LUYỆN NÃO 2026</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[11px] font-mono">
                <Brain className="w-3.5 h-3.5 text-[#d946ef]" />
                Kích hoạt 100% não bộ
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-[1.12]">
              Vòng Số Schulte Focus <br />
              <span className="bg-gradient-to-r from-[#d946ef] via-pink-400 to-[#d4ff00] bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(217,70,239,0.4)]">
                Luyện Não & Tăng Tốc Đọc 300%
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-2xl">
              Thử thách 60 giây kích hoạt toàn bộ thị giác ngoại vi và thùy trán. 
              Công cụ rèn luyện phản xạ đỉnh cao của các phi hành gia và kỷ lục gia thế giới — 
              chơi ngay trực tiếp trên trình duyệt, không cần cài đặt!
            </p>

            <div className="flex flex-wrap gap-2.5 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                100% Miễn phí & Cục bộ
              </span>
              <span className="flex items-center gap-1.5 text-[#d4ff00] bg-[#d4ff00]/10 px-3 py-1.5 rounded-xl border border-[#d4ff00]/30">
                <Eye className="w-4 h-4 text-[#d4ff00]" />
                Mở rộng góc nhìn 360°
              </span>
              <span className="flex items-center gap-1.5 text-[#d946ef] bg-[#d946ef]/10 px-3 py-1.5 rounded-xl border border-[#d946ef]/30">
                <Zap className="w-4 h-4 text-[#d946ef]" />
                Nhạc sóng não tập trung
              </span>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/games/schulte"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#d946ef] via-purple-600 to-[#d946ef] hover:brightness-110 text-white text-xs sm:text-sm font-black shadow-[0_0_25px_rgba(217,70,239,0.5)] transition-all hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 fill-current text-[#d4ff00]" />
                <span>Chơi Schulte Focus Ngay ⚡</span>
              </Link>

              <a
                href="/games/play.html?g=schulte-focus"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-bold transition-all border border-white/15"
                title="Mở toàn màn hình độc lập"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Toàn màn hình</span>
              </a>

              <a
                href="#danh-sach-game"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-3 py-2 font-mono"
              >
                <span>Kho 65+ game bên dưới</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Right Column: Interactive Schulte Mini Preview Cockpit */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="w-full max-w-md bg-[#090c14]/90 backdrop-blur-xl border-2 border-[#d946ef]/50 rounded-3xl p-5 shadow-[0_15px_40px_rgba(0,0,0,0.8)] relative overflow-hidden group">
              {/* Window Bar */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/90" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/90" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/90" />
                  <span className="ml-2 font-mono text-[11px] text-slate-300 font-bold">SCHULTE_PREVIEW.SYS</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#d4ff00]/15 text-[#d4ff00] border border-[#d4ff00]/30">
                  LIVE READY
                </span>
              </div>

              {/* 3x3 Interactive Demo Grid Representation */}
              <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-black/50 border border-white/10 aspect-square max-w-[280px] mx-auto mb-4">
                {[
                  { n: 1, c: "text-[#d4ff00] border-[#d4ff00]/40 bg-[#d4ff00]/10" },
                  { n: 8, c: "text-slate-300 border-white/10 bg-white/5" },
                  { n: 3, c: "text-slate-300 border-white/10 bg-white/5" },
                  { n: 4, c: "text-slate-300 border-white/10 bg-white/5" },
                  { n: 5, c: "text-white border-[#d946ef] bg-[#d946ef]/30 shadow-[0_0_15px_rgba(217,70,239,0.5)] font-black text-2xl" },
                  { n: 6, c: "text-slate-300 border-white/10 bg-white/5" },
                  { n: 7, c: "text-slate-300 border-white/10 bg-white/5" },
                  { n: 2, c: "text-cyan-400 border-cyan-400/40 bg-cyan-400/10" },
                  { n: 9, c: "text-slate-300 border-white/10 bg-white/5" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl border flex items-center justify-center font-mono font-bold text-lg select-none transition-transform group-hover:scale-105 ${item.c}`}
                  >
                    {item.n}
                  </div>
                ))}
              </div>

              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px] pt-1 border-t border-white/10">
                <div className="bg-white/5 p-2 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">MỤC TIÊU</span>
                  <span className="text-[#d4ff00] font-bold">&lt; 30 Giây</span>
                </div>
                <div className="bg-white/5 p-2 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">TỐC ĐỌC</span>
                  <span className="text-[#d946ef] font-bold">+300%</span>
                </div>
                <div className="bg-white/5 p-2 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">CHẾ ĐỘ</span>
                  <span className="text-cyan-400 font-bold">Lưới · Vòng</span>
                </div>
              </div>

              {/* Direct Play Overlay Button on hover */}
              <Link
                href="/games/schulte"
                className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d946ef] to-[#a21caf] hover:brightness-110 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <span>Vào Phòng Game Schulte Focus</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── GAMER MASCOT HOST STAGE ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-5 sm:p-7 rounded-3xl bg-[#101420]/80 border border-[#d946ef]/30 shadow-lg relative overflow-hidden">
        <div className="space-y-2 text-center sm:text-left z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d946ef]/15 text-[#d946ef] border border-[#d946ef]/30 text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI MỞ · GAMER TECH HOST</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Kho 65+ Mini Game Web Rèn Luyện Trí Tuệ & Phản Xạ
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            &ldquo;Chơi game để giải trí nhưng rèn luyện tư duy logic, mở rộng trường nhìn và tốc độ xử lý thông tin!&rdquo;
          </p>
        </div>

        <div className="relative w-full max-w-[200px] h-[190px] sm:h-[210px] flex items-end justify-center z-10 mt-4 sm:mt-0 select-none group">
          <div className="absolute bottom-2 w-32 h-7 rounded-[100%] border border-[#d946ef]/50 bg-[#d946ef]/20 blur-[2px] animate-mascot-ring" />
          <div className="absolute bottom-0 w-20 h-4 rounded-[100%] bg-[#d946ef]/40 blur-lg" />
          <Image
            src="/mascot/v2-fullbody-games.png"
            alt="Linh vật Game AI Mở"
            width={190}
            height={400}
            className="relative z-10 w-auto h-full max-h-[190px] sm:max-h-[210px] object-contain object-bottom drop-shadow-[0_12px_24px_rgba(0,0,0,0.95)] group-hover:scale-110 active:scale-110 active:-translate-y-2 transition-all duration-300 animate-mascot-float-2"
            priority
          />
        </div>
      </div>

      {/* ── CLIENT INTERACTIVE GAMES VIEW (65+ GAMES) ───────────────────── */}
      <GamesClientView games={GAMES_DATA} collections={GAME_COLLECTIONS} isLoggedIn={isLoggedIn} />
    </main>
  );
}
