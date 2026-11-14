"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Sparkles, Copy, Download, Play, Pause } from "lucide-react";
import { useHomeImages, CardImageEditor } from "./home-images-context";

/* ── Template generator (client-side, no API) ── */
function generateScript(idea: string, model: string) {
  const clean = idea.trim().replace(/\s+/g, " ").slice(0, 120);
  const title =
    clean.split(",")[0].replace(/^video\s+/i, "").trim();
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

/* ── Demo slideshow data ── */
const SLIDES = [
  { src: "/images/home/hero-creator-preview.jpg", cap: "Hậu trường: quay video serum bằng điện thoại", alt: "Người sáng tạo quay video sản phẩm serum" },
  { src: "/images/home/scene-1-serum-pastel.jpg", cap: "Cảnh 1 · Hook — cận cảnh chai serum", alt: "Chai serum trên nền hồng pastel" },
  { src: "/images/home/scene-2-serum-droplet.jpg", cap: "Cảnh 2 · Chất serum — giọt serum trong suốt", alt: "Nhỏ giọt serum lên lòng bàn tay" },
  { src: "/images/home/scene-3-serum-flatlay.jpg", cap: "Cảnh 3 · CTA — flat-lay chốt lời mời", alt: "Bộ sản phẩm skincare chụp flat-lay" },
];

const DEMO_PROMPT = "Cinematic product video, vertical 9:16: a frosted glass serum bottle on a pastel pink set, soft morning light, gentle leaf shadows. Slow dolly-in, then a macro shot of one clear drop falling onto an open palm. Clean skincare commercial look, smooth camera movement, no text.";

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
    <div className="fixed left-1/2 bottom-6 -translate-x-1/2 z-[80] bg-[#0c1526] text-white px-5 py-3 rounded-full text-sm font-semibold shadow-lg animate-fade-in max-w-[calc(100vw-32px)] text-center pointer-events-none">
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

  /* typewriter */
  const [typed, setTyped] = useState("");
  const [typeStarted, setTypeStarted] = useState(false);
  const typeRef = useRef<HTMLParagraphElement>(null);
  const typeTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const { show: showToast, Toast } = useToast();
  const { getImage } = useHomeImages();

  const activeSlides = [
    { src: getImage("hero-preview", "/images/home/hero-creator-preview.jpg"), cap: "Hậu trường: quay video serum bằng điện thoại", alt: "Người sáng tạo quay video sản phẩm serum" },
    { src: getImage("scene-1", "/images/home/scene-1-serum-pastel.jpg"), cap: "Cảnh 1 · Hook — cận cảnh chai serum", alt: "Chai serum trên nền hồng pastel" },
    { src: getImage("scene-2", "/images/home/scene-2-serum-droplet.jpg"), cap: "Cảnh 2 · Chất serum — giọt serum trong suốt", alt: "Nhỏ giọt serum lên lòng bàn tay" },
    { src: getImage("scene-3", "/images/home/scene-3-serum-flatlay.jpg"), cap: "Cảnh 3 · CTA — flat-lay chốt lời mời", alt: "Bộ sản phẩm skincare chụp flat-lay" },
  ];

  /* start typewriter when visible */
  useEffect(() => {
    if (!typeRef.current || typeStarted) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setTypeStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(typeRef.current);
    return () => obs.disconnect();
  }, [typeStarted]);

  useEffect(() => {
    if (!typeStarted) return;
    let i = 0;
    if (typeTimer.current) clearInterval(typeTimer.current);
    typeTimer.current = setInterval(() => {
      i++;
      setTyped(DEMO_PROMPT.slice(0, i));
      if (i >= DEMO_PROMPT.length) {
        if (typeTimer.current) clearInterval(typeTimer.current);
      }
    }, 16);
    return () => { if (typeTimer.current) clearInterval(typeTimer.current); };
  }, [typeStarted]);

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
  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) {
      showToast("Hãy nhập một ý tưởng video trước nhé — hoặc bấm một chip gợi ý bên dưới.");
      return;
    }
    setGenerating(true);
    setTimeout(() => {
      setResult(generateScript(idea, model));
      setGenerating(false);
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
    <section className="w-full max-w-[1240px] mx-auto px-4 sm:px-5 pt-5 sm:pt-7" id="top">
      {/* Hero Panel */}
      <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-r from-[#0b4de8] via-[#2f6bff] to-[#c9d8ff] p-6 sm:p-10 lg:p-14 text-white">
        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.13) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.13) 1px,transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(620px 420px at 88% 108%,#000 0%,transparent 70%)",
            WebkitMaskImage: "radial-gradient(620px 420px at 88% 108%,#000 0%,transparent 70%)",
          }}
        />
        {/* Ambient glow */}
        <div className="absolute -top-40 right-0 w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(0,216,255,.5),transparent_65%)] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* LEFT COLUMN */}
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/30 text-[13px] font-bold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              AI Studio của AI Mở
            </span>

            <h1 className="text-[clamp(32px,4.6vw,54px)] leading-[1.1] font-black tracking-tight">
              Học AI bằng cách
              <br />
              tạo ra{" "}
              <span className="relative whitespace-nowrap">
                thứ dùng được.
                <svg className="absolute left-0 right-0 -bottom-2 w-full h-3" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M2 9 C 60 2, 140 2, 198 8" fill="none" stroke="#38e1ff" strokeWidth="5" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="text-[15px] sm:text-[16.5px] text-white/88 max-w-[480px] leading-relaxed">
              Bộ công cụ AI thực tế, ứng dụng miễn phí và khóa học thực hành giúp bạn học AI nhanh, làm được ngay. Bắt đầu ngay tại đây — gõ ý tưởng, nhận kịch bản và prompt video.
            </p>

            {/* PROMPT BOX */}
            <form
              onSubmit={handleGenerate}
              id="promptForm"
              className="bg-white rounded-[20px] p-2.5 sm:p-3 max-w-[560px] text-[#0c1526] shadow-[0_0_0_1px_rgba(255,255,255,.5),0_24px_50px_-20px_rgba(4,20,80,.55),0_0_42px_-6px_rgba(124,77,255,.55)]"
            >
              <div className="flex gap-2 items-start">
                <span className="w-9 h-9 rounded-xl bg-[#eef3ff] flex items-center justify-center text-[#7c4dff] shrink-0 mt-0.5">
                  <Sparkles className="w-[18px] h-[18px]" />
                </span>
                <textarea
                  rows={2}
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Nhập ý tưởng video của bạn… ví dụ: video giới thiệu serum dưỡng da cho shop online"
                  aria-label="Nhập ý tưởng video của bạn"
                  className="flex-1 border-0 outline-none resize-none text-[15px] leading-relaxed pt-2 pb-1 px-1 bg-transparent placeholder:text-[#93a3c4] text-[#0c1526] min-h-[44px]"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap pt-1.5 px-1">
                {MODELS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModel(m)}
                    aria-pressed={m === model}
                    className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold border transition-colors min-h-[36px] ${
                      m === model
                        ? "bg-[#0c1526] text-white border-[#0c1526]"
                        : "bg-white text-[#3c4a68] border-[#dde6f8] hover:border-[#b9cdf5]"
                    }`}
                  >
                    {m}
                  </button>
                ))}
                <button
                  type="submit"
                  disabled={generating}
                  className="ml-auto inline-flex items-center gap-2 bg-gradient-to-r from-[#0057ff] via-[#7c4dff] to-[#00b8d9] text-white border-0 rounded-full font-extrabold text-[14.5px] px-5 py-2.5 shadow-[0_12px_26px_-10px_rgba(96,64,255,.6)] min-h-[44px] hover:brightness-105 disabled:opacity-75 disabled:cursor-wait transition-all"
                >
                  <Sparkles className="w-4 h-4 fill-current" />
                  {generating ? "Đang tạo…" : result ? "Tạo lại" : "Tạo ngay"}
                </button>
              </div>
            </form>

            {/* SUGGESTION CHIPS */}
            <div className="flex gap-2 flex-wrap max-w-[560px]" id="prompt">
              {CHIPS.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => { setIdea(c.idea); }}
                  className="px-3.5 py-2 rounded-full text-[13px] font-semibold bg-white/15 border border-white/30 text-white hover:bg-white/25 transition-colors min-h-[36px]"
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* GENERATED RESULT */}
            {result && (
              <div className="bg-white text-[#0c1526] rounded-[20px] p-5 max-w-[560px] shadow-[0_18px_44px_-18px_rgba(21,52,140,.22)] animate-fade-in">
                <h3 className="text-base font-bold mb-1">Kịch bản: {result.titleCap}</h3>
                <p className="text-xs text-[#68779a] mb-3">
                  Model: {result.model} · Khổ dọc 9:16 · Thời lượng 30 giây · 3 cảnh
                </p>
                {result.scenes.map((s, i) => (
                  <div key={i} className="flex gap-3 py-2.5 border-t border-dashed border-[#dde6f8] first:border-t-0">
                    <span className="font-mono text-xs font-semibold text-[#0057ff] bg-[#eef3ff] rounded-lg px-2 py-1 h-fit whitespace-nowrap">
                      {s.tc}
                    </span>
                    <p className="text-[13.5px] text-[#3c4a68] m-0">
                      <b className="text-[#0c1526]">{s.name}:</b> {s.text}
                    </p>
                  </div>
                ))}
                <div className="mt-3 bg-[#0d1730] text-[#cfe0ff] rounded-[14px] p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words">
                  {result.prompt}
                </div>
                <div className="flex gap-2.5 mt-3.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleCopy(result.prompt, `Đã copy prompt ✓ Dán vào ${result.model} để tạo video.`)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13.5px] font-bold bg-[#0057ff] text-white shadow-md min-h-[40px] hover:bg-[#0043c7] transition-colors"
                  >
                    <Copy className="w-[15px] h-[15px]" />
                    Copy prompt
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13.5px] font-bold bg-white text-[#0c1526] border border-[#dde6f8] min-h-[40px] hover:border-[#b9cdf5] transition-colors"
                  >
                    <Download className="w-[15px] h-[15px]" />
                    Tải kịch bản (.md)
                  </button>
                </div>
              </div>
            )}

            <p className="flex items-center gap-2 text-[13.5px] text-white/85 pt-1">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="text-[#5eead4]">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Công cụ thực hành · Hướng dẫn tiếng Việt · Không cần cài đặt
            </p>
          </div>

          {/* RIGHT COLUMN — DEMO CARD */}
          <div className="demo-card bg-white rounded-3xl text-[#0c1526] shadow-[0_34px_70px_-28px_rgba(3,16,64,.55)] overflow-hidden lg:rotate-[0.4deg]">
            {/* Demo header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-100/80">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#0057ff] via-[#7c4dff] to-[#00b8d9] flex items-center justify-center text-white shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="3" />
                  <path d="M3 9h18M8 5l2.5 4M14 5l2.5 4" />
                </svg>
              </span>
              <div>
                <h3 className="text-base font-extrabold leading-tight">PromptKichBan Studio</h3>
                <p className="text-xs text-[#68779a]">Tạo kịch bản, storyboard và prompt video chỉ từ ý tưởng</p>
              </div>
              <span className="ml-auto bg-[#e3f7ee] text-[#0e9f6e] font-extrabold text-xs px-3 py-1 rounded-full whitespace-nowrap">
                Miễn phí
              </span>
            </div>

            {/* Media with slideshow */}
            <div className="relative mx-3.5 mt-0.5 rounded-2xl overflow-hidden">
              <CardImageEditor cardId="hero-preview" cardTitle="Video Demo Hero" />
              <Image
                src={activeSlides[slideIdx]?.src || activeSlides[0].src}
                alt={activeSlides[slideIdx]?.alt || activeSlides[0].alt}
                width={600}
                height={238}
                className="w-full h-[200px] sm:h-[238px] object-cover"
                priority
              />
              <span className="absolute top-3 left-3 bg-[rgba(8,15,36,.72)] text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                ▶ Demo · 0:30
              </span>
              <button
                type="button"
                onClick={handlePlay}
                className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-[rgba(5,12,34,.45)] via-transparent"
                aria-label={playing ? "Tạm dừng bản demo" : "Phát bản demo storyboard"}
              >
                <span className="w-14 h-14 rounded-full bg-white/95 text-[#0057ff] flex items-center justify-center shadow-[0_14px_30px_-10px_rgba(0,0,0,.5)]">
                  {playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                </span>
              </button>
              <span className="absolute left-3 bottom-3 text-white text-xs font-semibold drop-shadow-md">
                {activeSlides[slideIdx]?.cap}
              </span>
            </div>

            {/* Storyboard frames */}
            <div className="px-5 pt-3.5 pb-1">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#68779a] mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-[#7c4dff]" />
                Storyboard · Video serum dưỡng da · 30 giây
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: "scene-1", src: getImage("scene-1", "/images/home/scene-1-serum-pastel.jpg"), title: "Cảnh 1 · Hook", tc: "0–3s", desc: "Mở đầu bằng cận cảnh chai serum" },
                  { id: "scene-2", src: getImage("scene-2", "/images/home/scene-2-serum-droplet.jpg"), title: "Cảnh 2 · Chất serum", tc: "3–15s", desc: "Nhỏ giọt, khoe kết cấu trong suốt" },
                  { id: "scene-3", src: getImage("scene-3", "/images/home/scene-3-serum-flatlay.jpg"), title: "Cảnh 3 · CTA", tc: "15–30s", desc: "Flat-lay sản phẩm, chốt lời mời" },
                ].map((f, i) => (
                  <figure
                    key={f.id}
                    className="relative border border-[#dde6f8] rounded-[13px] overflow-hidden bg-white cursor-pointer hover:border-[#0057ff] transition-colors m-0"
                    onClick={() => { setSlideIdx(i + 1); setPlaying(false); }}
                  >
                    <CardImageEditor cardId={f.id} cardTitle={f.title} />
                    <Image src={f.src} alt={f.title} width={200} height={78} className="w-full h-[68px] sm:h-[78px] object-cover" />
                    <figcaption className="p-2 text-[11px] leading-snug text-[#3c4a68]">
                      <b className="block text-[#0c1526] text-[11.5px]">{f.title}</b>
                      <span className="font-mono text-[#0057ff] font-semibold">{f.tc}</span> {f.desc}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>

            {/* Demo prompt with typewriter */}
            <div className="mx-5 mt-3 bg-[#eef3ff] border border-[#dde6f8] rounded-[14px] p-3.5">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#3c4a68] mb-1.5">
                <Sparkles className="w-3 h-3 fill-[#7c4dff] text-[#7c4dff]" />
                Prompt đã tạo · Veo 3
                <button
                  type="button"
                  onClick={() => handleCopy(DEMO_PROMPT, "Đã copy prompt mẫu ✓")}
                  className="ml-auto border border-[#dde6f8] bg-white rounded-lg text-xs font-bold px-2.5 py-1 text-[#0057ff] hover:bg-[#f5f8ff] transition-colors min-h-[28px]"
                >
                  Copy
                </button>
              </div>
              <p ref={typeRef} className="font-mono text-xs leading-relaxed text-[#33436b] min-h-[60px] m-0">
                {typed || <span className="inline-block w-2 h-3.5 bg-[#7c4dff] animate-pulse align-[-2px]" />}
                {typed && typed.length < DEMO_PROMPT.length && (
                  <span className="inline-block w-2 h-3.5 bg-[#7c4dff] animate-pulse align-[-2px] ml-0.5" />
                )}
              </p>
            </div>

            {/* Step pills */}
            <div className="flex gap-2 px-5 py-4 flex-wrap">
              {[
                { n: 1, label: "Nhập ý tưởng", done: true },
                { n: 2, label: "Kịch bản & storyboard", done: true },
                { n: 3, label: "Prompt video", active: true },
              ].map((s) => (
                <span
                  key={s.n}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border-[1.5px] ${
                    s.active
                      ? "border-[#7c4dff] text-[#0c1526] shadow-[0_0_0_3px_rgba(124,77,255,.14)]"
                      : s.done
                        ? "border-[#bcd7ff] text-[#0c1526]"
                        : "border-[#dde6f8] text-[#68779a]"
                  }`}
                >
                  <span
                    className={`w-[19px] h-[19px] rounded-full flex items-center justify-center text-[11px] ${
                      s.active
                        ? "bg-[#7c4dff] text-white"
                        : s.done
                          ? "bg-[#0057ff] text-white"
                          : "bg-[#eef3ff]"
                    }`}
                  >
                    {s.n}
                  </span>
                  {s.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {Toast}
    </section>
  );
}
