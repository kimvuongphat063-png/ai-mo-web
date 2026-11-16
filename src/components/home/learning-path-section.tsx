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
        <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#0057ff] mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#7c4dff]" />
          Lộ trình học AI
        </span>
        <h2 className="text-[clamp(24px,3vw,34px)] font-extrabold tracking-tight leading-tight text-[#0c1526] mb-2">
          {content?.pathTitle || "Học bằng cách làm ra sản phẩm"}
        </h2>
        <p className="text-[15.5px] text-[#68779a] m-0">
          {content?.pathDesc || "Ba chặng ngắn, mỗi chặng kết thúc bằng một thứ bạn cầm được trên tay — không học lý thuyết suông."}
        </p>
      </div>

      <div className="bg-white border border-[#dde6f8] rounded-[28px] shadow-[0_8px_24px_-12px_rgba(21,52,140,.18)] grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* Image */}
        <div className="relative min-h-[240px] lg:min-h-[320px]">
          <CardImageEditor cardId="path-main" cardTitle="Ảnh bìa Lộ trình học 3 chặng" />
          <Image
            src={getImage("path-main", "/images/home/path-step-1.jpg")}
            alt="Người học AI đeo tai nghe, học và ghi chép bên laptop"
            fill
            className="object-cover"
          />
          <span className="absolute left-4 bottom-4 bg-white/95 rounded-[14px] px-3.5 py-2.5 flex items-center gap-2.5 shadow-[0_8px_24px_-12px_rgba(21,52,140,.18)] text-[13px] font-bold text-[#0c1526]">
            <Sparkles className="w-4.5 h-4.5 text-[#7c4dff]" />
            Học đến đâu, ra sản phẩm đến đó
          </span>
        </div>

        {/* Steps */}
        <div className="p-7 sm:p-8">
          <h3 className="text-xl font-extrabold text-[#0c1526] mb-1.5">
            Lộ trình 3 chặng cho người mới
          </h3>
          <p className="text-[14.5px] text-[#68779a] mb-5">
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
              className={`flex gap-3.5 py-3.5 ${i > 0 ? "border-t border-dashed border-[#dde6f8]" : ""}`}
            >
              <span className="w-8 h-8 rounded-xl bg-[#eef3ff] text-[#0057ff] font-extrabold flex items-center justify-center shrink-0 text-sm">
                {step.n}
              </span>
              <div>
                <b className="block text-[15px] text-[#0c1526]">{step.title}</b>
                <span className="text-[13.5px] text-[#68779a]">{step.desc}</span>
              </div>
            </div>
          ))}

          <div className="mt-5">
            <Link
              href="/guides"
              className="inline-flex items-center gap-2 bg-[#0057ff] hover:bg-[#0043c7] text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-md shadow-blue-500/20 transition-colors min-h-[44px]"
            >
              Bắt đầu chặng 1
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
