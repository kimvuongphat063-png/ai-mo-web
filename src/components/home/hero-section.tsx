"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, Copy, Download, Play, Pause, Check } from "lucide-react";
import { useHomeImages, CardImageEditor } from "./home-images-context";

/* ── Template generator (client-side, no API) ── */
function generateScript(idea: string, model: string) {
  const clean = idea.trim().replace(/\s+/g, " ").slice(0, 120);
  const title = clean.split(",")[0].replace(/^video\s+/i, "").trim();
  const titleCap = title.charAt(0).toUpperCase() + title.slice(1);

  const scenes = [
    { tc: "0–3s", name: "Hook", text: `Mở đầu bắt mắt đúng chủ đề "${titleCap}" — cận cảnh chủ thể chính, chữ lớn trên màn hình trong 3 giây đầu.` },
    { tc: "3–15s", name: "Nội dung chính", text: "Quay cận từng chi tiết quan trọng, lời thoại ngắn gọn, mỗi ý một cảnh, chuyển động máy chậm và đều." },
    { tc: "15–30s", name: "Chốt CTA", text: "Khung hình tổng kết sản phẩm/dịch vụ, hiện lời kêu gọi hành động và thông tin liên hệ của shop." },
  ];

  const prompt = `Vertical video 9:16, 30 seconds. Topic: ${clean}. Scene 1 (0-3s) hook close-up of the main subject, bright natural light. Scene 2 (3-15s) slow dolly-in on key details, clean composition, smooth camera movement. Scene 3 (15-30s) wide closing shot with clear call-to-action. Realistic commercial look, soft shadows, no watermark, no distorted hands, no extra text.`;

  return { titleCap, scenes, prompt, model };
}

function buildMd(titleCap: string, scenes: { tc: string; name: string; text: string }[], prompt: string, model: string) {
  return `# Kịch bản video — ${titleCap}\n\n- Model: ${model}\n- Khổ: dọc 9:16\n- Thời lượng: 30 giây\n\n## Các cảnh\n\n${scenes.map((s, i) => `${i + 1}. **${s.tc} · ${s.name}:** ${s.text}`).join("\n")}\n\n## Prompt (${model})\n\n${prompt}\n`;
}

/* ── Chips ── */
const CHIPS = [
  { label: "Video quảng cáo sản phẩm", idea: "Video quảng cáo sản phẩm cho shop online, quay cận cảnh sản phẩm" },
  { label: "Kịch bản TikTok 30s", idea: "Kịch bản TikTok 30 giây giới thiệu sản phẩm, nhịp nhanh thu hút" },
  { label: "Review đồ uống", idea: "Video review đồ uống, quay cận ly nước và cảm nhận" },
  { label: "Post UGC", idea: "Video UGC người dùng thật chia sẻ trải nghiệm sản phẩm" },
];

const MODELS = ["Veo 3", "Grok", "Seedance 2.5"];

const STICKERS = [
  { label: "Công cụ AI", href: "/tools", src: "/stickers/sticker-cong-cu-ai.png", width: 207, height: 221 },
  { label: "App miễn phí", href: "/apps", src: "/stickers/sticker-app-mien-phi.png", width: 184, height: 222 },
  { label: "Game", href: "/games", src: "/stickers/sticker-game.png", width: 204, height: 224 },
  { label: "Học AI", href: "/guides", src: "/stickers/sticker-hoc-ai.png", width: 202, height: 228 },
  { label: "Sản phẩm số", href: "/products", src: "/stickers/sticker-san-pham-so.png", width: 213, height: 217 },
];

/* ── Toast helper ── */
function useToast() {
  const [msg, setMsg] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((text: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMsg(text);
    timer.current = setTimeout(() => setMsg(""), 2600);
  }, []);

  const Toast = msg ? (
    <div className="fixed left-1/2 bottom-6 -translate-x-1/2 z-[80] bg-[#0c1526] text-white px-5 py-3 rounded-full text-sm font-semibold shadow-xl animate-fade-in max-w-[calc(100vw-32px)] text-center pointer-events-none">
      {msg}
    </div>
  ) : null;

  return { show, Toast };
}

export function HeroSection() {
  const [idea, setIdea] = useState("");
  const [model, setModel] = useState("Veo 3");
  const [result, setResult] = useState<ReturnType<typeof generateScript> | null>(null);
  const [generating, setGenerating] = useState(false);

  /* demo slideshow */
  const [slideIdx, setSlideIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const slideTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const { show: showToast, Toast } = useToast();
  const { getImage, content } = useHomeImages();

  const activeSlides = [
    { src: getImage("hero-preview", "/images/home/hero-creator-preview.jpg"), cap: "Hậu trường: quay video serum bằng điện thoại", alt: "Người sáng tạo quay video sản phẩm serum" },
    { src: getImage("scene-1", "/images/home/scene-1-serum-pastel.jpg"), cap: "Cảnh 1 · Hook — cận cảnh chai serum", alt: "Chai serum trên nền hồng pastel" },
    { src: getImage("scene-2", "/images/home/scene-2-serum-droplet.jpg"), cap: "Cảnh 2 · Chất serum — giọt serum trong suốt", alt: "Nhỏ giọt serum lên lòng bàn tay" },
    { src: getImage("scene-3", "/images/home/scene-3-serum-flatlay.jpg"), cap: "Cảnh 3 · CTA — flat-lay chốt lời mời", alt: "Bộ sản phẩm skincare chụp flat-lay" },
  ];

  /* slideshow controls */
  useEffect(() => {
    if (slideTimer.current) clearInterval(slideTimer.current);
    if (playing) {
      slideTimer.current = setInterval(() => {
        setSlideIdx((prev) => (prev + 1) % activeSlides.length);
      }, 2800);
    }
    return () => { if (slideTimer.current) clearInterval(slideTimer.current); };
  }, [playing, activeSlides.length]);

  const handlePlay = () => {
    if (!playing) {
      setSlideIdx(1);
      setPlaying(true);
    } else {
      setPlaying(false);
    }
  };

  /* generate */
  const handleGenerate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!idea.trim()) {
      showToast("Hãy nhập một ý tưởng video trước nhé — hoặc bấm một chip gợi ý bên dưới.");
      return;
    }
    setGenerating(true);
    setTimeout(() => {
      setResult(generateScript(idea, model));
      setGenerating(false);
      showToast("✨ Đã tạo kịch bản & prompt thành công!");
    }, 600);
  };

  const handleCopy = (text: string, msg: string) => {
    navigator.clipboard?.writeText(text).then(
      () => showToast(msg),
      () => showToast("Chưa copy được — hãy copy thủ công.")
    );
  };

  const handleDownload = () => {
    if (!result) return;
    const md = buildMd(result.titleCap, result.scenes, result.prompt, result.model);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kich-ban-video.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 800);
    showToast("Đã tải file kịch bản (.md) ✓");
  };

  return (
    <section className="relative w-full overflow-hidden pt-4 pb-10 sm:pt-7 sm:pb-14" id="top">
      {/* ── FULL-WIDTH ATMOSPHERIC MESH GRADIENT & GRID ── */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Center Sky Radial Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140vw] max-w-[1920px] h-[780px] bg-[radial-gradient(ellipse_75%_60%_at_50%_0%,rgba(195,228,255,0.7),transparent_75%)]" />
        
        {/* Left Peripheral Glow (Subtle Cyan for Ultra-wide screens) */}
        <div className="hidden xl:block absolute top-[12%] left-[-6%] w-[580px] h-[580px] rounded-full bg-[radial-gradient(circle,rgba(56,225,255,0.2),transparent_70%)] blur-[95px]" />
        
        {/* Right Peripheral Glow (Subtle Indigo/Purple for Ultra-wide screens) */}
        <div className="hidden xl:block absolute top-[22%] right-[-6%] w-[580px] h-[580px] rounded-full bg-[radial-gradient(circle,rgba(124,77,255,0.16),transparent_70%)] blur-[95px]" />

        {/* Ambient Subtle Grid */}
        <div 
          className="absolute inset-0 opacity-45"
          style={{
            backgroundImage: "linear-gradient(rgba(0,87,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(0,87,255,0.045) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
            maskImage: "radial-gradient(ellipse 90% 75% at 50% 30%, black 35%, transparent 88%)",
            WebkitMaskImage: "radial-gradient(ellipse 90% 75% at 50% 30%, black 35%, transparent 88%)"
          }}
        />
      </div>

      {/* ── RESPONSIVE FLUID CONTAINER (1240px -> 1400px -> 1536px) ── */}
      <div className="w-full max-w-[1240px] xl:max-w-[1400px] 2xl:max-w-[1536px] mx-auto px-3.5 sm:px-6 2xl:px-8 transition-all duration-300">
        
        {/* TWO-CARD HERO GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 lg:gap-8 2xl:gap-10 items-stretch">
          
          {/* ── LEFT CARD ── */}
          <div className="bg-white rounded-[28px] sm:rounded-[36px] 2xl:rounded-[40px] p-4.5 sm:p-8 lg:p-10 xl:p-11 2xl:p-12 border border-[#dde7f6] shadow-[0_24px_60px_-20px_rgba(16,52,138,0.08),0_4px_16px_-4px_rgba(16,52,138,0.03)] flex flex-col justify-between relative overflow-hidden transition-all">
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-[#eef5ff] border border-[#cce0ff] text-[#0057ff] text-[12px] sm:text-[13px] xl:text-[13.5px] font-extrabold mb-4 sm:mb-6 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                {content?.heroBadge || "AI Studio của AI Mở"}
              </div>

              {/* Headline */}
              <h1 className="text-[clamp(28px,3.8vw,48px)] xl:text-[46px] 2xl:text-[50px] leading-[1.14] font-black tracking-tight text-[#091a3e] mb-4 sm:mb-6">
                {content?.heroTitle ? (
                  content.heroTitle
                ) : (
                  <>
                    Học AI bằng cách<br />
                    tạo ra{" "}
                    <span className="relative whitespace-nowrap inline-block">
                      thứ dùng được.
                      <svg
                        className="absolute left-0 right-0 -bottom-2 sm:-bottom-2.5 w-full h-3 sm:h-3.5 pointer-events-none"
                        viewBox="0 0 200 12"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M2 9 C 60 2, 140 2, 198 8"
                          fill="none"
                          stroke="#2cd4ff"
                          strokeWidth="5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  </>
                )}
              </h1>
            </div>

            {/* 3D Stickers Cluster (Row 1: 3, Row 2: 2) — Fluid Width Scaling */}
            <div className="w-full my-auto py-2 sm:py-5 xl:py-7">
              <div className="w-full max-w-[500px] xl:max-w-[580px] 2xl:max-w-[640px] mx-auto flex flex-col gap-2.5 sm:gap-4 xl:gap-5">
                {/* Row 1: 3 Stickers */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3.5 xl:gap-4 w-full">
                  {STICKERS.slice(0, 3).map((st) => (
                    <Link
                      key={st.href}
                      href={st.href}
                      className="min-w-0 group flex flex-col items-center justify-center p-0.5 sm:p-1 rounded-2xl transition-all duration-300 hover:-translate-y-2 active:translate-y-0"
                      title={`Khám phá ${st.label}`}
                    >
                      <div className="relative w-full aspect-[1/1.08] max-w-[155px] xl:max-w-[178px] 2xl:max-w-[195px] flex items-center justify-center transition-all duration-300 group-hover:scale-105">
                        <Image
                          src={st.src}
                          alt={st.label}
                          width={st.width}
                          height={st.height}
                          className="w-full h-auto max-h-[140px] object-contain drop-shadow-[0_8px_16px_rgba(12,38,92,0.12)] group-hover:drop-shadow-[0_16px_28px_rgba(0,87,255,0.26)] transition-all duration-300"
                          priority
                        />
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Row 2: 2 Stickers Centered (matching exact sticker size of row 1) */}
                <div className="flex justify-center items-center gap-2 sm:gap-3.5 xl:gap-4 w-full">
                  {STICKERS.slice(3, 5).map((st) => (
                    <Link
                      key={st.href}
                      href={st.href}
                      className="min-w-0 group flex flex-col items-center justify-center p-0.5 sm:p-1 rounded-2xl w-[calc((100%-2*0.5rem)/3)] sm:w-[calc((100%-2*0.875rem)/3)] xl:w-[calc((100%-2*1rem)/3)] max-w-[155px] xl:max-w-[178px] 2xl:max-w-[195px] transition-all duration-300 hover:-translate-y-2 active:translate-y-0"
                      title={`Khám phá ${st.label}`}
                    >
                      <div className="relative w-full aspect-[1/1.08] flex items-center justify-center transition-all duration-300 group-hover:scale-105">
                        <Image
                          src={st.src}
                          alt={st.label}
                          width={st.width}
                          height={st.height}
                          className="w-full h-auto max-h-[140px] object-contain drop-shadow-[0_8px_16px_rgba(12,38,92,0.12)] group-hover:drop-shadow-[0_16px_28px_rgba(0,87,255,0.26)] transition-all duration-300"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Left CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-4 pt-3 sm:pt-4">
              <Link
                href="/tools"
                className="inline-flex items-center justify-center gap-2 bg-[#0057ff] text-white text-[14px] sm:text-[14.5px] xl:text-[15px] font-extrabold px-5 sm:px-6 xl:px-7 py-3 sm:py-3.5 rounded-full shadow-[0_10px_24px_-6px_rgba(0,87,255,0.45)] hover:bg-[#0046d5] hover:shadow-[0_14px_30px_-6px_rgba(0,87,255,0.55)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-center"
              >
                <Sparkles className="w-4 h-4 fill-current shrink-0" />
                <span>Dùng thử công cụ miễn phí</span>
              </Link>
              <Link
                href="/guides"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#1a253c] text-[14px] sm:text-[14.5px] xl:text-[15px] font-extrabold px-5 sm:px-6 xl:px-7 py-3 sm:py-3.5 rounded-full border border-[#dde6f8] hover:bg-[#f6f9fe] hover:border-[#b9cdf5] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-center"
              >
                <Play className="w-3.5 h-3.5 fill-current text-[#0057ff] shrink-0" />
                <span>Xem lộ trình học</span>
              </Link>
            </div>
          </div>

          {/* ── RIGHT CARD (PromptKichBan Studio) ── */}
          <div className="bg-white rounded-[28px] sm:rounded-[36px] 2xl:rounded-[40px] p-4.5 sm:p-6 xl:p-7 2xl:p-8 border border-[#dde7f6] shadow-[0_24px_60px_-20px_rgba(16,52,138,0.08),0_4px_16px_-4px_rgba(16,52,138,0.03)] flex flex-col justify-between relative overflow-hidden transition-all">
            
            <div>
              {/* Studio Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-neutral-100/80">
                <span className="w-8 h-8 sm:w-9 sm:h-9 xl:w-10 xl:h-10 rounded-xl bg-gradient-to-r from-[#7c4dff] via-[#6366f1] to-[#00b8d9] flex items-center justify-center text-white shrink-0 shadow-md">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="3" />
                    <path d="M3 9h18M8 5l2.5 4M14 5l2.5 4" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] sm:text-base xl:text-[17px] font-extrabold leading-tight text-[#0c1526] truncate">PromptKichBan Studio</h3>
                  <p className="text-[11px] sm:text-xs xl:text-[12.5px] text-[#68779a] truncate">Tạo kịch bản, storyboard và prompt video chỉ từ ý tưởng</p>
                </div>
                <span className="ml-auto bg-[#e6f9f0] text-[#0ba566] border border-[#b7f0d4] font-extrabold text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-full whitespace-nowrap">
                  Miễn phí
                </span>
              </div>

              {/* Video Player Preview */}
              <div className="relative mt-3 rounded-2xl overflow-hidden aspect-[16/9] bg-neutral-900 shadow-inner">
                <CardImageEditor cardId="hero-preview" cardTitle="Video Demo Hero" />
                <Image
                  src={activeSlides[slideIdx]?.src || activeSlides[0].src}
                  alt={activeSlides[slideIdx]?.alt || activeSlides[0].alt}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 700px"
                  className="w-full h-full object-cover transition-opacity duration-300"
                  priority
                />
                <span className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 bg-[rgba(8,15,36,0.72)] text-white text-[11px] sm:text-xs font-bold px-2.5 py-0.5 sm:py-1 rounded-full backdrop-blur-sm shadow">
                  ▶ Demo · 0:30
                </span>
                <button
                  type="button"
                  onClick={handlePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-all cursor-pointer group"
                  aria-label={playing ? "Tạm dừng bản demo" : "Phát bản demo storyboard"}
                >
                  <span className="w-12 h-12 sm:w-14 sm:h-14 xl:w-15 xl:h-15 rounded-full bg-white/95 text-[#0057ff] flex items-center justify-center shadow-[0_12px_28px_rgba(0,0,0,0.35)] group-hover:scale-110 transition-transform">
                    {playing ? <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />}
                  </span>
                </button>
                <span className="absolute left-3 bottom-2.5 sm:bottom-3 text-white text-[11px] sm:text-xs xl:text-[12.5px] font-semibold drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] truncate max-w-[90%]">
                  {activeSlides[slideIdx]?.cap}
                </span>
              </div>

              {/* Storyboard 3 Frames */}
              <div className="pt-3 pb-1.5 sm:pb-2">
                <div className="flex items-center gap-1.5 text-[10.5px] sm:text-[11px] xl:text-[11.5px] font-extrabold uppercase tracking-wider text-[#68779a] mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#7c4dff]" />
                  Storyboard · Video serum dưỡng da · 30 giây
                </div>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 xl:gap-3 w-full">
                  {[
                    { id: "scene-1", src: getImage("scene-1", "/images/home/scene-1-serum-pastel.jpg"), title: "Cảnh 1 · Hook", tc: "0–3s", desc: "Mở đầu bằng cận cảnh chai serum" },
                    { id: "scene-2", src: getImage("scene-2", "/images/home/scene-2-serum-droplet.jpg"), title: "Cảnh 2 · Chất serum", tc: "3–15s", desc: "Nhỏ giọt, khoe kết cấu trong suốt" },
                    { id: "scene-3", src: getImage("scene-3", "/images/home/scene-3-serum-flatlay.jpg"), title: "Cảnh 3 · CTA", tc: "15–30s", desc: "Flat-lay sản phẩm, chốt lời mời" },
                  ].map((f, i) => (
                    <figure
                      key={f.id}
                      className="min-w-0 relative border border-[#dde6f8] rounded-xl sm:rounded-[13px] overflow-hidden bg-white cursor-pointer hover:border-[#0057ff] hover:shadow-sm transition-all m-0"
                      onClick={() => { setSlideIdx(i + 1); setPlaying(false); }}
                    >
                      <CardImageEditor cardId={f.id} cardTitle={f.title} />
                      <div className="relative w-full h-[54px] sm:h-[72px] xl:h-[80px]">
                        <Image src={f.src} alt={f.title} fill sizes="220px" className="object-cover" />
                      </div>
                      <figcaption className="p-1.5 sm:p-2 xl:p-2.5 text-[10px] sm:text-[10.5px] xl:text-[11px] leading-snug text-[#3c4a68]">
                        <b className="block text-[#0c1526] text-[10.5px] sm:text-[11px] xl:text-[11.5px] truncate">{f.title}</b>
                        <span className="font-mono text-[#0057ff] font-semibold">{f.tc}</span> <span className="hidden xs:inline">{f.desc}</span>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Prompt Generator Box */}
            <div className="mt-2 bg-white border border-[#d4e2f8] rounded-[20px] sm:rounded-[22px] p-3 sm:p-4 xl:p-4.5 shadow-[0_12px_32px_-10px_rgba(0,87,255,0.12),0_2px_10px_rgba(0,0,0,0.03)]">
              <form onSubmit={handleGenerate}>
                <div className="flex items-start gap-2.5 mb-2">
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#f0f4ff] flex items-center justify-center text-[#7c4dff] shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                  </span>
                  <textarea
                    rows={2}
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="Nhập ý tưởng video của bạn… ví dụ: video giới thiệu serum dưỡng da cho shop online"
                    aria-label="Nhập ý tưởng video của bạn"
                    className="flex-1 border-0 outline-none resize-none text-[13px] sm:text-[14px] xl:text-[14.5px] leading-relaxed py-0.5 px-1 bg-transparent placeholder:text-[#8da1c4] text-[#0c1526]"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-dashed border-[#e8eef8]">
                  <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                    {MODELS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setModel(m)}
                        aria-pressed={m === model}
                        className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-[12px] xl:text-[12.5px] font-bold border transition-colors ${
                          m === model
                            ? "bg-[#0c1526] text-white border-[#0c1526]"
                            : "bg-white text-[#4a5877] border-[#dde6f8] hover:border-[#b9cdf5]"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <button
                    type="submit"
                    disabled={generating}
                    className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#0057ff] to-[#7c4dff] text-white rounded-full font-extrabold text-[12.5px] sm:text-[13px] xl:text-[13.5px] px-4 py-1.5 sm:py-2 shadow-[0_6px_18px_rgba(124,77,255,0.35)] hover:brightness-105 disabled:opacity-70 transition-all ml-auto"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                    {generating ? "Đang tạo…" : result ? "Tạo lại" : "Tạo ngay"}
                  </button>
                </div>
              </form>
            </div>

            {/* GENERATED SCRIPT MODAL / RESULT BOX (IF ACTIVE) */}
            {result && (
              <div className="mt-3 bg-[#f8fbff] border border-[#cbe0ff] rounded-2xl p-4 animate-fade-in text-left">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="text-sm font-extrabold text-[#0c1526]">Kịch bản: {result.titleCap}</h4>
                  <span className="text-[11px] font-mono text-[#0057ff] bg-[#eef5ff] px-2 py-0.5 rounded-md">
                    {result.model} · 30s
                  </span>
                </div>
                <div className="space-y-2 mb-3">
                  {result.scenes.map((s, i) => (
                    <div key={i} className="text-xs text-[#3c4a68]">
                      <b className="text-[#0057ff]">{s.tc} · {s.name}:</b> {s.text}
                    </div>
                  ))}
                </div>
                <div className="bg-[#0d1730] text-[#cfe0ff] rounded-xl p-3 font-mono text-[11.5px] leading-relaxed break-words max-h-28 overflow-y-auto">
                  {result.prompt}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => handleCopy(result.prompt, `Đã copy prompt cho ${result.model} ✓`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#0057ff] text-white shadow-sm hover:bg-[#0043c7]"
                  >
                    <Copy className="w-3 h-3" />
                    Copy prompt
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white text-[#0c1526] border border-[#dde6f8] hover:border-[#b9cdf5]"
                  >
                    <Download className="w-3 h-3" />
                    Tải .md
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* ── BOTTOM IDEA CHIPS & TRUST BAR ── */}
        <div className="mt-6 sm:mt-9 xl:mt-11 flex flex-col items-center gap-3">
          <div className="flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap">
            {CHIPS.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => {
                  setIdea(c.idea);
                  showToast(`Đã chọn: "${c.label}" ✓`);
                }}
                className="px-3.5 sm:px-4 xl:px-4.5 py-1.5 sm:py-2 rounded-full text-[12px] sm:text-[13px] xl:text-[13.5px] font-bold bg-white text-[#3d4a66] border border-[#dbe5f4] shadow-[0_2px_6px_rgba(16,52,138,0.04)] hover:bg-[#0057ff] hover:text-white hover:border-[#0057ff] hover:-translate-y-0.5 transition-all duration-150"
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center text-center gap-2 text-[12px] sm:text-[13.5px] xl:text-[14px] font-semibold text-[#556987] px-2 flex-wrap">
            <Check className="w-4 h-4 text-[#0da678] stroke-[2.5] shrink-0" />
            <span>Công cụ thực hành · Hướng dẫn tiếng Việt · Không cần cài đặt</span>
          </div>
        </div>
      </div>

      {Toast}
    </section>
  );
}
