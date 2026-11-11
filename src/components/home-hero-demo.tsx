"use client";

import { Clapperboard, Sparkles } from "lucide-react";
import { Illustration3DClapperboard } from "@/components/ui/mockup-illustrations";

export function HomeHeroDemo() {
  return (
    <div className="bg-white/85 backdrop-blur-xl rounded-3xl p-5 sm:p-7 shadow-2xl border border-white/80 w-full max-w-[580px] space-y-4 relative z-10 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(21,94,239,0.18)]">
      {/* ── Header của Demo Card ── */}
      <div className="flex items-center justify-between border-b border-neutral-100/80 pb-3 gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#EFF6FF] text-[#155EEF] flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
            <Clapperboard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#0F172A] tracking-tight">
              PromptKichBan
            </h3>
            <p className="text-xs text-slate-500">
              Tạo kịch bản, storyboard và prompt video chỉ từ ý tưởng
            </p>
          </div>
        </div>

        {/* 3D Clapper Badge on right */}
        <div className="relative shrink-0">
          <Illustration3DClapperboard className="w-11 h-11" />
        </div>
      </div>

      {/* ── Stepper: 3 Pills connected with Arrows ── */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-semibold overflow-x-auto py-1">
        <div className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full bg-[#155EEF] text-white shrink-0 shadow-xs">
          <span className="w-3.5 h-3.5 rounded-full bg-white/20 text-white flex items-center justify-center text-[9px] font-bold">
            1
          </span>
          <span>Nhập thông tin video</span>
        </div>
        <span className="text-neutral-400 shrink-0 font-bold">→</span>

        <div className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full bg-[#155EEF] text-white shrink-0 shadow-xs">
          <span className="w-3.5 h-3.5 rounded-full bg-white/20 text-white flex items-center justify-center text-[9px] font-bold">
            2
          </span>
          <span>Kịch bản & storyboard</span>
        </div>
        <span className="text-neutral-400 shrink-0 font-bold">→</span>

        <div className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full bg-[#155EEF] text-white shrink-0 shadow-xs">
          <span className="w-3.5 h-3.5 rounded-full bg-white/20 text-white flex items-center justify-center text-[9px] font-bold">
            3
          </span>
          <span>Prompt video</span>
        </div>
      </div>

      {/* ── Horizontal Track Bar with Arrows: ◄ ────── ► ── */}
      <div className="relative flex items-center justify-between text-neutral-400 px-1 select-none">
        <span className="text-[10px] text-neutral-400">◄</span>
        <div className="flex-1 h-2 bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 rounded-full mx-1.5 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-[#155EEF]/40 to-[#00A3FF]/40 rounded-full" />
        </div>
        <span className="text-[10px] text-neutral-400">►</span>
      </div>

      {/* ── 3 Visual Flow Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-11 gap-2.5 items-center pt-1">
        {/* Card 1: Ý tưởng video */}
        <div className="sm:col-span-3 bg-neutral-50/90 rounded-2xl p-3 border border-neutral-200/70 space-y-1.5 shadow-2xs">
          <span className="text-[10px] font-bold text-neutral-500 block">
            Ý tưởng video
          </span>
          <div className="text-[11px] text-slate-800 leading-snug font-medium min-h-[44px]">
            Giới thiệu sản phẩm chăm sóc da{" "}
            <span className="inline-block w-0.5 h-3.5 bg-[#155EEF] ml-0.5 animate-pulse align-middle" />
          </div>
        </div>

        {/* Mũi tên 1 */}
        <div className="sm:col-span-1 hidden sm:flex justify-center text-neutral-400 font-bold text-sm">
          →
        </div>

        {/* Card 2: Storyboard (2 khung ảnh SVG + 2 text lines) */}
        <div className="sm:col-span-3 bg-neutral-50/90 rounded-2xl p-2.5 border border-neutral-200/70 space-y-2 shadow-2xs">
          <div className="grid grid-cols-2 gap-1.5">
            <div className="h-11 rounded-xl bg-blue-100/70 border border-blue-200/60 flex items-center justify-center text-blue-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect width="18" height="14" x="3" y="5" rx="3" />
                <circle cx="8" cy="10" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
            <div className="h-11 rounded-xl bg-blue-100/70 border border-blue-200/60 flex items-center justify-center text-blue-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect width="18" height="14" x="3" y="5" rx="3" />
                <circle cx="8" cy="10" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
          </div>
          <div className="space-y-1">
            <div className="h-1.5 bg-neutral-200 rounded-full w-full" />
            <div className="h-1.5 bg-neutral-200 rounded-full w-3/4" />
          </div>
        </div>

        {/* Mũi tên 2 */}
        <div className="sm:col-span-1 hidden sm:flex justify-center text-neutral-400 font-bold text-sm">
          →
        </div>

        {/* Card 3: Prompt video (3 lines) */}
        <div className="sm:col-span-3 bg-neutral-50/90 rounded-2xl p-3 border border-neutral-200/70 space-y-2 shadow-2xs">
          <div className="flex items-center gap-1 text-[11px] text-blue-600 font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Prompt video</span>
          </div>
          <div className="space-y-1.5 pt-0.5">
            <div className="h-2 bg-neutral-300 rounded-full w-full" />
            <div className="h-2 bg-neutral-200 rounded-full w-5/6" />
            <div className="h-2 bg-neutral-200 rounded-full w-4/6" />
          </div>
        </div>
      </div>
    </div>
  );
}
