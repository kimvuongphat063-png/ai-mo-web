import Link from "next/link";
import {
  Gamepad2,
  ShieldCheck,
  CheckCircle2,
  Volume2,
  Maximize2,
  ArrowRight,
} from "lucide-react";
import type { Metadata } from "next";
import { GAMES_DATA, GAME_COLLECTIONS } from "@/lib/games-data";
import { GamesClientView } from "@/components/games-client-view";

export const metadata: Metadata = {
  title: "65+ Mini Game Web Trí Tuệ & Luyện Tư Duy — AI Mở Studio",
  description:
    "Kho 65+ trò chơi web tương tác giúp rèn luyện tư duy logic, trí nhớ, ngôn ngữ và phản xạ. 100% không quảng cáo, chạy mượt mà trên mọi thiết bị.",
  alternates: {
    canonical: "https://www.heyaimo.com/games",
  },
};

export default function GamesPage() {
  return (
    <main id="main-content" className="container py-10 sm:py-14 space-y-10 max-w-7xl mx-auto px-4 sm:px-6">
      {/* ── BREADCRUMBS ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
        <Link href="/" className="hover:text-neutral-900 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <span className="text-neutral-900 font-semibold">Kho Game Web Trí Tuệ</span>
      </div>

      {/* ── HERO BANNER ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-b from-[#EAF2FF]/70 via-white to-white border border-[#0057ff]/15 p-6 sm:p-10 shadow-xs">
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF2FF] border border-[#0057ff]/20 text-[#0057ff] text-xs font-bold tracking-wide">
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Kho Game Giáo Dục & Trí Tuệ Số · AI Mở Studio</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-900 leading-[1.15]">
            65+ Trò chơi web{" "}
            <span className="text-[#0057ff]">rèn luyện tư duy & trí nhớ</span>
          </h1>

          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed max-w-2xl">
            Tuyển tập mini game nhẹ nhàng, lành mạnh dành cho bé và cả gia đình: luyện phản xạ số học, học chữ cái tiếng Việt, nối số vẽ tranh, xếp hình logic và đàn cầu vồng. Chạy 100% trực tiếp trên trình duyệt không cần cài đặt.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-1 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              100% Miễn phí & Cục bộ
            </span>
            <span className="flex items-center gap-1.5 text-[#0057ff] bg-[#EAF2FF] px-3 py-1.5 rounded-xl border border-[#0057ff]/20">
              <CheckCircle2 className="w-4 h-4 text-[#0057ff]" />
              Không quảng cáo · Không popup
            </span>
            <span className="flex items-center gap-1.5 text-purple-800 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200">
              <Volume2 className="w-4 h-4 text-purple-600" />
              Giọng đọc AI & Âm thanh Web Audio
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <a
              href="#danh-sach-game"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0057ff] hover:bg-[#0043c7] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#0057ff]/20 transition-all"
            >
              <span>Xem danh sách 65 game</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="/games/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-bold transition-all shadow-sm"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Giao diện Game Hub gốc (Dark Mode)</span>
            </a>
          </div>
        </div>

        {/* Decorative background blur */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 bg-radial from-[#0057ff]/10 to-transparent rounded-full blur-2xl pointer-events-none" />
      </section>

      {/* ── CLIENT INTERACTIVE GAMES VIEW ──────────────────────────────── */}
      <GamesClientView games={GAMES_DATA} collections={GAME_COLLECTIONS} />
    </main>
  );
}
