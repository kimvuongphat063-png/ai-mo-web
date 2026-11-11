"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Clapperboard,
  Sparkles,
  ChevronDown,
  Copy,
  Check,
  HelpCircle,
} from "lucide-react";

export function HomeHeroDemo() {
  const [copied, setCopied] = useState(false);
  const promptText =
    "Cinematic product video, wireless headphones AI MỞ Pro, modern and premium design, active noise cancellation, long battery life up to 40 hours, showcase in 3 scenes: product reveal, key audio features, dynamic studio lighting, 16:9, ultra-detailed 4k.";

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-lg border border-white/80 w-full max-w-2xl space-y-3.5 relative z-10">
      {/* Header của Demo Card */}
      <div className="flex items-center justify-between border-b border-neutral-100 pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#155EEF] to-[#00A3FF] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Clapperboard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-[#0F172A]">PromptKichBan</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Miễn phí
              </span>
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-1">
              Tạo kịch bản, storyboard và prompt video từ ý tưởng, mô tả sản phẩm
            </p>
          </div>
        </div>

        <div className="w-6 h-6 rounded-full border border-neutral-200 text-neutral-400 flex items-center justify-center text-xs hover:bg-neutral-50 cursor-pointer transition-colors">
          <HelpCircle className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* 3 Cột: Nhập thông tin video → Kịch bản & storyboard → Prompt video */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
        {/* CỘT 1: Nhập thông tin video */}
        <div className="md:col-span-4 bg-slate-50/80 rounded-xl p-3 border border-slate-200/60 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#155EEF]">
            <span className="w-4 h-4 rounded-full bg-[#155EEF] text-white text-[10px] flex items-center justify-center font-bold shadow-xs">
              1
            </span>
            <span>Nhập thông tin video</span>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-700">
              Mô tả video / Sản phẩm <span className="text-red-500">*</span>
            </label>
            <div className="bg-white rounded-lg border border-slate-200 p-2 text-[10.5px] text-slate-800 leading-snug shadow-2xs">
              <p>
                Video giới thiệu tai nghe không dây AI MỞ Pro: thiết kế hiện đại, chống ồn, pin lâu đến 40 giờ, phù hợp làm việc và giải trí
                <span className="inline-block w-1.5 h-3 bg-[#155EEF] ml-0.5 animate-pulse" />
              </p>
              <span className="block text-right text-[9px] text-slate-400 mt-1 font-mono">
                116 / 500
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-700">
              Thời lượng mong muốn
            </label>
            <div className="bg-white rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] text-slate-800 flex items-center justify-between shadow-2xs">
              <span className="font-medium">Khoảng 30 giây</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-700">
              Phong cách video
            </label>
            <div className="bg-white rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] text-slate-800 flex items-center justify-between shadow-2xs">
              <span className="font-medium">Cinematic sản phẩm</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
          </div>

          <button
            type="button"
            className="w-full mt-1 py-2 px-3 rounded-lg bg-gradient-to-r from-[#155EEF] to-[#0084FF] hover:from-[#124bbf] hover:to-[#0070d6] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:shadow-[0_0_15px_rgba(21,94,239,0.35)] transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tạo kịch bản & prompt</span>
          </button>
        </div>

        {/* CỘT 2: Kịch bản & storyboard */}
        <div className="md:col-span-5 bg-slate-50/80 rounded-xl p-3 border border-slate-200/60 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#155EEF]">
            <span className="w-4 h-4 rounded-full bg-[#155EEF] text-white text-[10px] flex items-center justify-center font-bold shadow-xs">
              2
            </span>
            <span>
              Kịch bản & storyboard{" "}
              <span className="text-[10px] font-normal text-slate-500">
                (3 cảnh – 30s)
              </span>
            </span>
          </div>

          <div className="space-y-2">
            {/* Cảnh 1 */}
            <div className="flex items-start gap-2 bg-white rounded-lg p-1.5 border border-slate-200/80 shadow-2xs hover:border-blue-200 transition-colors">
              <div className="w-14 h-12 relative rounded-md overflow-hidden shrink-0 bg-slate-100">
                <Image
                  src="/images/headphones-main.jpg"
                  alt="Giới thiệu sản phẩm"
                  fill
                  className="object-cover"
                  sizes="56px"
                />
                <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[8px] font-bold px-1 rounded">
                  0:00 - 0:08
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 font-bold text-[11px] text-slate-900">
                  <span className="w-3.5 h-3.5 rounded bg-blue-100 text-[#155EEF] flex items-center justify-center text-[9px] font-mono">
                    1
                  </span>
                  <span className="truncate">Giới thiệu sản phẩm</span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                  Cận cảnh tai nghe AI MỞ Pro, xoay nhẹ, hiện logo và tên sản phẩm.
                </p>
              </div>
            </div>

            {/* Cảnh 2 */}
            <div className="flex items-start gap-2 bg-white rounded-lg p-1.5 border border-slate-200/80 shadow-2xs hover:border-blue-200 transition-colors">
              <div className="w-14 h-12 relative rounded-md overflow-hidden shrink-0 bg-slate-100">
                <Image
                  src="/images/headphones-detail.jpg"
                  alt="Tính năng nổi bật"
                  fill
                  className="object-cover"
                  sizes="56px"
                />
                <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[8px] font-bold px-1 rounded">
                  0:08 - 0:20
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 font-bold text-[11px] text-slate-900">
                  <span className="w-3.5 h-3.5 rounded bg-blue-100 text-[#155EEF] flex items-center justify-center text-[9px] font-mono">
                    2
                  </span>
                  <span className="truncate">Tính năng nổi bật</span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                  Thể hiện chống ồn, âm thanh sống động và pin đến 40 giờ bằng biểu tượng rõ ràng.
                </p>
              </div>
            </div>

            {/* Cảnh 3 */}
            <div className="flex items-start gap-2 bg-white rounded-lg p-1.5 border border-slate-200/80 shadow-2xs hover:border-blue-200 transition-colors">
              <div className="w-14 h-12 relative rounded-md overflow-hidden shrink-0 bg-slate-100">
                <Image
                  src="/images/headphones-desk.jpg"
                  alt="Ứng dụng & kêu gọi"
                  fill
                  className="object-cover"
                  sizes="56px"
                />
                <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[8px] font-bold px-1 rounded">
                  0:20 - 0:30
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 font-bold text-[11px] text-slate-900">
                  <span className="w-3.5 h-3.5 rounded bg-blue-100 text-[#155EEF] flex items-center justify-center text-[9px] font-mono">
                    3
                  </span>
                  <span className="truncate">Ứng dụng & kêu gọi</span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                  Sử dụng trong làm việc và giải trí, hiện thông điệp &quot;AI MỞ Pro - Nghe tốt hơn&quot;.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT 3: Prompt video */}
        <div className="md:col-span-3 bg-slate-50/80 rounded-xl p-3 border border-slate-200/60 space-y-2.5 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#155EEF] mb-2">
              <span className="w-4 h-4 rounded-full bg-[#155EEF] text-white text-[10px] flex items-center justify-center font-bold shadow-xs">
                3
              </span>
              <span>Prompt video</span>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-2.5 text-[10px] text-slate-700 leading-relaxed font-mono shadow-2xs">
              <span className="text-blue-600 font-semibold">Cinematic</span> product video, wireless headphones AI MỞ Pro, modern and premium design, active noise cancellation, showcase in 3 scenes, dynamic studio lighting, <span className="text-purple-600 font-semibold">16:9</span>, <span className="text-emerald-600 font-semibold">4k</span>.
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className={`w-full mt-2 py-2 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer ${
              copied
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-bold">Đã sao chép prompt!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Sao chép prompt</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
