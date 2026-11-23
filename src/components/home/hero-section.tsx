"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, Copy, Download, Play, Pause, Check, ArrowRight, Bot, Smartphone, Gamepad2, BookOpen, Package, Layers } from "lucide-react";
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

/* ── Quick Chips ── */
const CHIPS = [
  { label: "Video quảng cáo sản phẩm", idea: "Video quảng cáo sản phẩm cho shop online, quay cận cảnh sản phẩm" },
  { label: "Kịch bản TikTok 30s", idea: "Kịch bản TikTok 30 giây giới thiệu sản phẩm, nhịp nhanh thu hút" },
  { label: "Review đồ uống", idea: "Video review đồ uống, quay cận ly nước và cảm nhận" },
  { label: "Post UGC", idea: "Video UGC người dùng thật chia sẻ trải nghiệm sản phẩm" },
];

const MODELS = ["Veo 3", "Kling 1.5", "Sora", "Grok"];

/* ── 5 Core Ecosystem Modules with Distinct Personas & Accent Colors ── */
const MODULES = [
  { label: "Công cụ AI", desc: "Đạo diễn kịch bản", href: "/tools", icon: Bot, tag: "Studio", color: "#d4ff00", persona: "Đạo Diễn" },
  { label: "App Quản Trị", desc: "95+ app bán hàng", href: "/apps", icon: Smartphone, tag: "Free", color: "#00e5ff", persona: "Kính AR" },
  { label: "Games 65+", desc: "Trí tuệ, phản xạ", href: "/games", icon: Gamepad2, tag: "Hot", color: "#d946ef", persona: "Gamer" },
  { label: "Học AI", desc: "Dự án thực chiến", href: "/guides", icon: BookOpen, tag: "Guide", color: "#f59e0b", persona: "Gia Sư" },
  { label: "Sản Phẩm Số", desc: "Template, kịch bản", href: "/products", icon: Package, tag: "Asset", color: "#10b981", persona: "Thủ Kho" },
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
    <div className="fixed left-1/2 bottom-6 -translate-x-1/2 z-[80] bg-[#121826] text-white px-5 py-3 rounded-full text-sm font-semibold border border-white/15 shadow-2xl animate-fade-in max-w-[calc(100vw-32px)] text-center pointer-events-none">
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
      showToast("Hãy nhập một ý tưởng video trước nhé — hoặc chọn một gợi ý bên dưới.");
      return;
    }
    setGenerating(true);
    setTimeout(() => {
      setResult(generateScript(idea, model));
      setGenerating(false);
      showToast("Đã tạo kịch bản & prompt thành công ✓");
    }, 500);
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
    <section className="relative w-full overflow-hidden bg-[#090c14] text-slate-100 pt-5 pb-12 sm:pt-8 sm:pb-16 border-b border-white/10" id="top">
      {/* ── ATMOSPHERIC DARK TECH BACKGROUND ── */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Subtle Tech Grid */}
        <div 
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage: "linear-gradient(rgba(212,255,0,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(212,255,0,0.12) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
            maskImage: "radial-gradient(ellipse 85% 65% at 50% 25%, black 40%, transparent 90%)",
            WebkitMaskImage: "radial-gradient(ellipse 85% 65% at 50% 25%, black 40%, transparent 90%)"
          }}
        />

        {/* Top Center Ambient Glow (Acid Lime Accent) */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[480px] rounded-full bg-[radial-gradient(circle,rgba(212,255,0,0.14),transparent_70%)] blur-[120px]" />
        
        {/* Subtle Cyber Blue Secondary Glow */}
        <div className="absolute top-[20%] right-[-10%] w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.08),transparent_70%)] blur-[140px]" />
      </div>

      {/* ── FLUID CONTAINER (1240px -> 1400px -> 1536px) ── */}
      <div className="w-full max-w-[1240px] xl:max-w-[1400px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 2xl:px-8">
        
        {/* TWO-COLUMN STUDIO HERO GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-8 xl:gap-10 items-stretch">
          
          {/* ── LEFT COLUMN: POSITIONING & ECOSYSTEM TILES ── */}
          <div className="lg:col-span-7 bg-[#101420]/80 backdrop-blur-xl rounded-[28px] sm:rounded-[36px] p-6 sm:p-9 xl:p-10 border border-white/10 shadow-[0_24px_50px_-15px_rgba(0,0,0,0.7)] flex flex-col justify-between relative overflow-hidden transition-all">
            
            <div>
              {/* Category Signature Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4ff00]/10 border border-[#d4ff00]/30 text-[#d4ff00] text-[11px] sm:text-[12px] font-mono font-bold mb-4 sm:mb-5 tracking-wide">
                <span className="w-2 h-2 rounded-full bg-[#d4ff00] animate-pulse"></span>
                <span>AI MỞ STUDIO // NỀN TẢNG THỰC CHIẾN</span>
              </div>

              {/* ── MASCOT HERO HOST GREETING ── */}
              <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl bg-black/45 border border-[#d4ff00]/30 mb-5 max-w-lg shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#090c14] border border-[#d4ff00]/50 p-0.5 shrink-0 overflow-hidden shadow-[0_0_15px_rgba(212,255,0,0.3)]">
                  <Image
                    src="/mascot/mascot-hero.jpg"
                    alt="Linh vật AI Mở"
                    width={48}
                    height={48}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-mono font-bold text-[#d4ff00] flex items-center gap-1.5 uppercase tracking-wider">
                    <span>LINH VẬT AI MỞ</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-300">Live Companion</span>
                  </div>
                  <p className="text-xs text-slate-200 mt-0.5 font-medium truncate sm:whitespace-normal">
                    "Chào bạn! Hãy nhập ý tưởng vào Studio bên phải để tạo video ngay nhé!"
                  </p>
                </div>
              </div>

              {/* Punchy Headline */}
              <h1 className="text-[clamp(28px,3.8vw,48px)] xl:text-[46px] 2xl:text-[50px] leading-[1.12] font-black tracking-tight text-white mb-4 sm:mb-5">
                Học AI Bằng Cách<br />
                <span className="text-[#d4ff00]">Tạo Ra Thứ Dùng Được.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed mb-6">
                Tạo kịch bản video TikTok 30s, viết prompt hình ảnh chuẩn chỉ, chạy app quản trị doanh nghiệp và lập trình game độc bản. Không cần code phức tạp.
              </p>

              {/* Primary & Secondary Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pb-6 border-b border-white/10">
                <a
                  href="#prompt-studio"
                  className="inline-flex items-center justify-center gap-2 bg-[#d4ff00] text-black font-extrabold text-[14px] sm:text-[14.5px] px-6 py-3 rounded-xl shadow-[0_10px_25px_-5px_rgba(212,255,0,0.35)] hover:bg-[#b8e000] hover:-translate-y-0.5 active:translate-y-0 transition-all text-center"
                >
                  <span>Dùng Thử PromptKichBan</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </a>

                <Link
                  href="/guides"
                  className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-semibold text-[14px] sm:text-[14.5px] px-5 py-3 rounded-xl border border-white/15 hover:border-white/30 transition-all text-center"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-[#d4ff00]" />
                  <span>Xem Lộ Trình Học</span>
                </Link>
              </div>
            </div>

            {/* 5 Core Ecosystem Modules (Distinct Thematic Cards) */}
            <div className="pt-6">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d4ff00]"></span>
                  <span>5 Nhánh Hệ Sinh Thái · Bấm Để Khám Phá</span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal hidden sm:inline">Phân vai đặc trưng</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {MODULES.map((m) => {
                  const Icon = m.icon;
                  return (
                    <Link
                      key={m.href}
                      href={m.href}
                      className="group p-2.5 sm:p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 transition-all flex flex-col justify-between"
                      style={{
                        borderColor: undefined,
                      }}
                      title={`Khám phá ${m.label} (${m.persona})`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 transition-colors" style={{ color: m.color }} />
                        <span 
                          className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border transition-all"
                          style={{
                            color: m.color,
                            backgroundColor: `${m.color}15`,
                            borderColor: `${m.color}35`,
                          }}
                        >
                          {m.persona}
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-white text-[12px] sm:text-[12.5px] group-hover:text-white transition-colors truncate">
                          {m.label}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {m.desc}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN: PROMPTKICHBAN STUDIO COCKPIT WIDGET ── */}
          <div id="prompt-studio" className="lg:col-span-5 bg-[#121624]/90 backdrop-blur-xl rounded-[28px] sm:rounded-[36px] p-5 sm:p-7 border border-white/15 shadow-[0_24px_50px_-15px_rgba(0,0,0,0.7)] flex flex-col justify-between relative overflow-hidden transition-all">
            
            <div>
              {/* Studio Window Bar */}
              <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-3.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
                  <span className="font-extrabold text-white ml-1.5 tracking-tight text-sm">PromptKichBan Studio</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#d4ff00]/10 text-[#d4ff00] border border-[#d4ff00]/30 font-bold">
                  FREE STUDIO
                </span>
              </div>

              {/* Video Player Preview */}
              <div className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-neutral-950 border border-white/10 shadow-inner">
                <CardImageEditor cardId="hero-preview" cardTitle="Video Demo Hero" />
                <Image
                  src={activeSlides[slideIdx]?.src || activeSlides[0].src}
                  alt={activeSlides[slideIdx]?.alt || activeSlides[0].alt}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 700px"
                  className="w-full h-full object-cover transition-opacity duration-300"
                  priority
                />
                <span className="absolute top-2.5 left-2.5 bg-black/75 text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded-md backdrop-blur-sm border border-white/10">
                  ▶ Demo · 0:30
                </span>
                <button
                  type="button"
                  onClick={handlePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/40 transition-all cursor-pointer group"
                  aria-label={playing ? "Tạm dừng bản demo" : "Phát bản demo storyboard"}
                >
                  <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#d4ff00] text-black flex items-center justify-center shadow-[0_8px_20px_rgba(212,255,0,0.35)] group-hover:scale-110 transition-transform">
                    {playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                  </span>
                </button>
                <span className="absolute left-3 bottom-2.5 text-white text-[11px] sm:text-xs font-semibold drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] truncate max-w-[90%]">
                  {activeSlides[slideIdx]?.cap}
                </span>
              </div>

              {/* Storyboard 3 Frames */}
              <div className="pt-3 pb-2">
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                  <span>Storyboard · Serum Dưỡng Da · 30s</span>
                  <span className="text-[#d4ff00] font-bold">9:16 Dọc</span>
                </div>
                <div className="grid grid-cols-3 gap-2 w-full">
                  {[
                    { id: "scene-1", src: getImage("scene-1", "/images/home/scene-1-serum-pastel.jpg"), title: "Cảnh 1 · Hook", tc: "0–3s", desc: "Cận cảnh chai serum" },
                    { id: "scene-2", src: getImage("scene-2", "/images/home/scene-2-serum-droplet.jpg"), title: "Cảnh 2 · Chất serum", tc: "3–15s", desc: "Giọt serum trong suốt" },
                    { id: "scene-3", src: getImage("scene-3", "/images/home/scene-3-serum-flatlay.jpg"), title: "Cảnh 3 · CTA", tc: "15–30s", desc: "Flat-lay chốt lời mời" },
                  ].map((f, i) => (
                    <figure
                      key={f.id}
                      className="min-w-0 relative border border-white/10 rounded-xl overflow-hidden bg-black/40 cursor-pointer hover:border-[#d4ff00] transition-all m-0 group"
                      onClick={() => { setSlideIdx(i + 1); setPlaying(false); }}
                    >
                      <CardImageEditor cardId={f.id} cardTitle={f.title} />
                      <div className="relative w-full h-[54px] sm:h-[68px]">
                        <Image src={f.src} alt={f.title} fill sizes="220px" className="object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <figcaption className="p-1.5 text-[10px] sm:text-[10.5px] leading-snug text-slate-300">
                        <b className="block text-white truncate">{f.title}</b>
                        <span className="font-mono text-[#d4ff00] font-semibold">{f.tc}</span> <span className="hidden xs:inline">{f.desc}</span>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            </div>

            {/* Prompt Generator Cockpit Form */}
            <div className="mt-2 bg-black/40 border border-white/15 rounded-2xl p-3.5 shadow-lg">
              <form onSubmit={handleGenerate}>
                <div className="mb-2">
                  <textarea
                    rows={2}
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="Nhập ý tưởng video của bạn… ví dụ: Video review quán cà phê phong cách Nhật"
                    aria-label="Nhập ý tưởng video của bạn"
                    className="w-full border-0 outline-none resize-none text-[13px] sm:text-[13.5px] leading-relaxed p-1 bg-transparent placeholder:text-slate-500 text-slate-100 font-mono"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-white/10">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {MODELS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setModel(m)}
                        aria-pressed={m === model}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold border transition-all ${
                          m === model
                            ? "bg-[#d4ff00] text-black border-[#d4ff00] shadow-sm shadow-[#d4ff00]/30"
                            : "bg-white/5 text-slate-400 border-white/10 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={generating}
                    className="inline-flex items-center gap-1.5 bg-[#d4ff00] hover:bg-[#b8e000] text-black rounded-lg font-extrabold text-[12.5px] sm:text-[13px] px-4 py-1.5 shadow-md shadow-[#d4ff00]/20 disabled:opacity-50 transition-all ml-auto"
                  >
                    <span>{generating ? "Đang tạo…" : result ? "Tạo lại" : "Tạo Prompt Ngay"}</span>
                    <span>⚡</span>
                  </button>
                </div>
              </form>
            </div>

            {/* GENERATED SCRIPT RESULT */}
            {result && (
              <div className="mt-3 bg-black/60 border border-[#d4ff00]/40 rounded-xl p-3.5 animate-fade-in text-left">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="text-xs font-bold text-white truncate">Kịch bản: {result.titleCap}</h4>
                  <span className="text-[10px] font-mono text-[#d4ff00] bg-[#d4ff00]/10 px-2 py-0.5 rounded border border-[#d4ff00]/30">
                    {result.model} · 30s
                  </span>
                </div>
                <div className="space-y-1.5 mb-2.5 text-[11px] text-slate-300">
                  {result.scenes.map((s, i) => (
                    <div key={i}>
                      <b className="text-[#d4ff00]">{s.tc} · {s.name}:</b> {s.text}
                    </div>
                  ))}
                </div>
                <div className="bg-black/90 text-[#d4ff00] rounded-lg p-2.5 font-mono text-[11px] leading-relaxed break-words max-h-28 overflow-y-auto border border-white/10">
                  {result.prompt}
                </div>
                <div className="flex gap-2 mt-2.5">
                  <button
                    type="button"
                    onClick={() => handleCopy(result.prompt, `Đã copy prompt cho ${result.model} ✓`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-[#d4ff00] text-black hover:bg-[#b8e000] transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    Copy prompt
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-white/10 text-white border border-white/15 hover:bg-white/20 transition-colors"
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
        <div className="mt-8 sm:mt-10 flex flex-col items-center gap-3">
          <div className="flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap">
            {CHIPS.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => {
                  setIdea(c.idea);
                  showToast(`Đã chọn: "${c.label}" ✓`);
                }}
                className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[12px] sm:text-[13px] font-semibold bg-white/[0.04] text-slate-300 border border-white/10 hover:border-[#d4ff00] hover:text-[#d4ff00] hover:bg-white/[0.08] transition-all"
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center text-center gap-2 text-[12px] sm:text-[13px] font-mono text-slate-400 px-2 flex-wrap">
            <Check className="w-4 h-4 text-[#d4ff00] stroke-[2.5] shrink-0" />
            <span>Công cụ thực hành · Hướng dẫn tiếng Việt · Chạy trực tiếp trên trình duyệt</span>
          </div>
        </div>

      </div>

      {Toast}
    </section>
  );
}
