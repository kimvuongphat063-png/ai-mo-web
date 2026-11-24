import Image from "next/image";
import type { Product } from "@/lib/store";
import { getStoreProducts } from "@/lib/cms";
import { CatalogClientView } from "./catalog-client-view";

export async function CatalogPage({
  title,
  eyebrow,
  intro,
  filter,
  themeColor = "#d4ff00",
  mascotImage = "/mascot/card-theme-tools.png",
  mascotSpeech = "⚡ Công cụ tinh gọn, giải quyết bài toán thật ngay lập tức!",
  mascotRole = "AI MỞ · CREATIVE DIRECTOR",
}: {
  title: string;
  eyebrow: string;
  intro: string;
  filter: (p: Product) => boolean;
  themeColor?: string;
  mascotImage?: string;
  mascotSpeech?: string;
  mascotRole?: string;
}) {
  const all = (await getStoreProducts()) as Product[];
  const list = all.filter(filter);

  return (
    <main id="main-content" className="container py-10 sm:py-14 space-y-10 max-w-7xl mx-auto px-4 sm:px-6">
      <section 
        className="relative overflow-hidden rounded-3xl bg-[#101420]/90 backdrop-blur-2xl p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] border"
        style={{ borderColor: `${themeColor}35` }}
      >
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div 
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold tracking-wide"
              style={{ backgroundColor: `${themeColor}15`, borderColor: `${themeColor}35`, color: themeColor }}
            >
              <span>{eyebrow}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-[1.15]">{title}</h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">{intro}</p>
            <div className="flex items-center gap-3 pt-2">
              <span className="text-2xl font-black font-mono" style={{ color: themeColor }}>
                {list.length.toString().padStart(2, "0")}
              </span>
              <span className="text-xs text-slate-400 font-semibold leading-tight">
                sản phẩm & tài nguyên<br />chọn lọc thực chiến
              </span>
            </div>
          </div>

          {/* Right: Themed Mascot Host */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center relative">
            <div 
              className="mb-3 px-3.5 py-1.5 rounded-2xl bg-[#090c14]/90 border text-center shadow-lg backdrop-blur-md animate-fade-in max-w-[260px]"
              style={{ borderColor: `${themeColor}40` }}
            >
              <p className="text-[11.5px] font-mono font-semibold leading-snug" style={{ color: themeColor }}>
                "{mascotSpeech}"
              </p>
            </div>
            <div className="relative w-full max-w-[220px] h-[230px] sm:h-[260px] flex items-end justify-center group select-none active:scale-95 transition-transform">
              <div 
                className="absolute bottom-2 w-36 h-8 rounded-[100%] border blur-[2px] animate-pulse" 
                style={{ borderColor: `${themeColor}50`, backgroundColor: `${themeColor}20` }}
              />
              <div 
                className="absolute bottom-0 w-24 h-4 rounded-[100%] blur-lg"
                style={{ backgroundColor: `${themeColor}40` }}
              />
              <Image
                src={mascotImage}
                alt={title}
                width={202}
                height={424}
                className="relative z-10 w-auto h-full max-h-[210px] sm:max-h-[230px] object-contain object-bottom drop-shadow-[0_15px_30px_rgba(0,0,0,0.95)] group-hover:scale-110 active:scale-110 active:-translate-y-2 transition-all duration-300 animate-mascot-float-0"
                priority
              />
            </div>
            <span className="mt-1 text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
              {mascotRole}
            </span>
          </div>
        </div>
        <div 
          className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 bg-radial to-transparent rounded-full blur-3xl pointer-events-none"
          style={{ backgroundImage: `radial-gradient(circle, ${themeColor}25, transparent 70%)` }}
        />
      </section>

      <CatalogClientView initialProducts={list} />
    </main>
  );
}
