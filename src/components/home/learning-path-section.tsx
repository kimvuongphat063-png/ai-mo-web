"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useHomeImages, CardImageEditor } from "./home-images-context";

export function LearningPath() {
  const { getImage, content } = useHomeImages();

  return (
    <section className="w-full max-w-[1240px] xl:max-w-[1400px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 2xl:px-8 pt-14 sm:pt-16" id="lo-trinh">
      <div className="max-w-[640px] mb-7">
        <span className="inline-flex items-center gap-2 text-xs font-mono font-extrabold uppercase tracking-wider text-[#d4ff00] mb-3">
          <span className="w-2 h-2 rounded-full bg-[#d4ff00] animate-pulse"></span>
          Lộ trình học AI
        </span>
        <h2 className="text-[clamp(24px,3vw,34px)] font-black tracking-tight leading-tight text-white mb-2">
          {content?.pathTitle || "Học bằng cách làm ra sản phẩm"}
        </h2>
        <p className="text-[15px] text-slate-400 m-0">
          {content?.pathDesc || "Ba chặng ngắn, mỗi chặng kết thúc bằng một thứ bạn cầm được trên tay — không học lý thuyết suông."}
        </p>
      </div>

      <div className="bg-[#101420]/80 border border-white/10 rounded-[28px] shadow-2xl grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* Image */}
        <div className="relative min-h-[240px] lg:min-h-[320px]">
          <CardImageEditor cardId="path-main" cardTitle="Ảnh bìa Lộ trình học 3 chặng" />
          <Image
            src={getImage("path-main", "/images/home/path-step-1.jpg")}
            alt="Người học AI đeo tai nghe, học và ghi chép bên laptop"
            fill
            className="object-cover opacity-90"
          />
          <span className="absolute left-4 bottom-4 bg-[#090c14]/90 border border-white/15 rounded-[14px] px-3.5 py-2.5 flex items-center gap-2.5 shadow-xl text-[13px] font-bold text-white backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#d4ff00] animate-ping" />
            Học đến đâu, ra sản phẩm đến đó
          </span>
        </div>

        {/* Steps */}
        <div className="p-7 sm:p-8">
          <h3 className="text-xl font-black text-white mb-1.5">
            Lộ trình 3 chặng cho người mới
          </h3>
          <p className="text-[14px] text-slate-400 mb-5">
            Dành cho chủ shop, người bán hàng online và người mới chạm vào AI lần đầu.
          </p>

          {[
            {
              n: 1,
              title: "Làm quen bằng công cụ có sẵn",
              desc: "Dùng PromptKichBan và kho app miễn phí để thấy AI giúp được việc gì ngay trong tuần đầu.",
            },
            {
              n: 2,
              title: "Viết prompt như người làm nghề",
              desc: "Học cấu trúc prompt, góc máy và chuyển động camera qua bài viết và ví dụ thật từng bước.",
            },
            {
              n: 3,
              title: "Ra sản phẩm hoàn chỉnh",
              desc: "Hoàn thiện một video, một trang bán hàng hoặc một quy trình tự động cho công việc của bạn.",
            },
          ].map((step, i) => (
            <div
              key={step.n}
              className={`flex gap-3.5 py-3.5 ${i > 0 ? "border-t border-dashed border-white/10" : ""}`}
            >
              <span className="w-8 h-8 rounded-xl bg-[#d4ff00]/15 text-[#d4ff00] border border-[#d4ff00]/30 font-mono font-black flex items-center justify-center shrink-0 text-sm">
                {step.n}
              </span>
              <div>
                <b className="block text-[15px] font-bold text-white">{step.title}</b>
                <span className="text-[13px] text-slate-300">{step.desc}</span>
              </div>
            </div>
          ))}

          <div className="mt-5">
            <Link
              href="/guides"
              className="inline-flex items-center gap-2 bg-[#d4ff00] hover:bg-[#b8e000] text-black px-5 py-2.5 rounded-xl font-extrabold text-sm shadow-[0_4px_15px_rgba(212,255,0,0.3)] transition-colors min-h-[44px]"
            >
              Bắt đầu chặng 1
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
