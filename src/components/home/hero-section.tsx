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

/* ── 5 Core Ecosystem Modules with Distinct Personas, 3D Assets & Accent Colors ── */
const MODULES = [
  { label: "Công cụ AI", desc: "Tạo kịch bản & prompt video", href: "/tools", icon: Bot, color: "#d4ff00", image: "/mascot/v2-fullbody-tools.png" },
  { label: "App Quản Trị (95+)", desc: "Kế toán, dòng tiền, kho bãi", href: "/apps", icon: Smartphone, color: "#00e5ff", image: "/mascot/v2-fullbody-apps.png" },
  { label: "Game (65+)", desc: "Trí tuệ, phản xạ, logic", href: "/games", icon: Gamepad2, color: "#d946ef", image: "/mascot/v2-fullbody-games.png", badge: "🔥 Schulte HOT" },
  { label: "Học AI", desc: "Lộ trình thực chiến theo dự án", href: "/guides", icon: BookOpen, color: "#f59e0b", image: "/mascot/v2-fullbody-guides.png" },
  { label: "Sản Phẩm Số", desc: "Template & asset sẵn dùng", href: "/products", icon: Package, color: "#10b981", image: "/mascot/v2-fullbody-products.png" },
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

  /* Mascot 3D Mouse Parallax & Interactive State */
  const [mascotPos, setMascotPos] = useState({ x: 0, y: 0 });
  const [mascotHovered, setMascotHovered] = useState(false);
  const [mascotBouncing, setMascotBouncing] = useState(false);
  const [mascotSpeechIdx, setMascotSpeechIdx] = useState(0);

  const MASCOT_MESSAGES = [
    "Chào bạn! Rê chuột để mình xoay 3D tương tác nhé! ✨",
    "Khám phá 5 trụ cột AI Mở với linh vật 3D bên dưới! 🚀",
    "Học AI bằng cách tạo ra thứ dùng được ngay! 💡",
    "Nhập ý tưởng vào Studio bên phải để tạo video 30s! 🎬",
    "Mỗi ngày một công cụ AI mới thực chiến! 🔥"
  ];

  const handleMascotMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMascotPos({ x, y });
    setMascotHovered(true);
  };

  const handleMascotMouseLeave = () => {
    setMascotPos({ x: 0, y: 0 });
    setMascotHovered(false);
  };

  const handleMascotTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, ((touch.clientX - rect.left) / rect.width - 0.5) * 2));
      const y = Math.max(-1, Math.min(1, ((touch.clientY - rect.top) / rect.height - 0.5) * 2));
      setMascotPos({ x, y });
      setMascotHovered(true);
    }
  };

  const handleMascotTouchEnd = () => {
    setTimeout(() => {
      setMascotPos({ x: 0, y: 0 });
      setMascotHovered(false);
    }, 400);
  };

  const handleMascotClick = () => {
    setMascotBouncing(true);
    setTimeout(() => setMascotBouncing(false), 600);
    const next = (mascotSpeechIdx + 1) % MASCOT_MESSAGES.length;
    setMascotSpeechIdx(next);
    showToast(`🤖 Linh vật AI Mở: "${MASCOT_MESSAGES[next]}"`);
  };

  const rotateY = mascotPos.x * 26;
  const rotateX = -mascotPos.y * 20;
  const translateX = mascotPos.x * 14;
  const translateY = mascotPos.y * 10;

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
      {/* ── ATMOSPHERIC DARK TECH BACKGROUND WITH CYBER DEPTH LINES ── */}
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

        {/* Cyber Circuit Depth Lines SVG */}
        <svg 
          className="absolute inset-0 w-full h-full opacity-30" 
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="limeLine" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d4ff00" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#00e5ff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#d4ff00" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="cyanLine" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M 0,120 L 260,120 L 380,240 L 680,240" fill="none" stroke="url(#limeLine)" strokeWidth="1.5" strokeDasharray="6 4" />
          <path d="M 120,0 L 120,180 L 240,300 L 240,700" fill="none" stroke="url(#cyanLine)" strokeWidth="1" />
          <path d="M 820,60 L 960,180 L 1200,180 L 1440,320" fill="none" stroke="url(#limeLine)" strokeWidth="1.5" />
          <path d="M 1240,0 L 1240,140 L 1080,280 L 1080,720" fill="none" stroke="url(#cyanLine)" strokeWidth="1" strokeDasharray="8 6" />
          
          <circle cx="260" cy="120" r="3.5" fill="#d4ff00" />
          <circle cx="960" cy="180" r="3.5" fill="#00e5ff" />
          <circle cx="380" cy="240" r="2.5" fill="#d4ff00" />
        </svg>

        {/* Ambient Glows */}
        <div className="absolute -top-40 left-1/3 w-[720px] h-[480px] rounded-full bg-[radial-gradient(circle,rgba(212,255,0,0.16),transparent_70%)] blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.10),transparent_70%)] blur-[140px]" />
      </div>

      {/* ── FLUID CONTAINER (1240px -> 1400px -> 1536px) ── */}
      <div className="w-full max-w-[1240px] xl:max-w-[1400px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 2xl:px-8">
        
        {/* TWO-COLUMN STUDIO HERO GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-8 xl:gap-10 items-stretch">
          
          {/* ── LEFT COLUMN: SLOGAN + 3D INTERACTIVE MASCOT HOST + 5 PROMINENT 3D ECOSYSTEM CARDS ── */}
          <div className="lg:col-span-7 bg-[#101420]/85 backdrop-blur-2xl rounded-[32px] sm:rounded-[38px] p-6 sm:p-8 xl:p-9 shadow-[0_24px_50px_-15px_rgba(0,0,0,0.6)] flex flex-col justify-between relative overflow-hidden transition-all">
            
            {/* Liquid glass gradient shine */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-black/30 pointer-events-none rounded-[inherit]" />

            <div className="relative z-10">
              {/* Category Signature Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4ff00]/12 border border-[#d4ff00]/35 text-[#d4ff00] text-[11px] sm:text-[12px] font-mono font-bold mb-4 tracking-wide shadow-[0_0_15px_rgba(212,255,0,0.15)]">
                <span className="w-2 h-2 rounded-full bg-[#d4ff00] animate-pulse"></span>
                <span>AI MỞ STUDIO // HỆ SINH THÁI SÁNG TẠO & THỰC CHIẾN</span>
              </div>

              {/* ── TOP HERO ROW: PUNCHY SLOGAN (LEFT) + 3D INTERACTIVE MASCOT HOST (RIGHT) ── */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center mb-6">
                
                {/* Left: Punchy Slogan alone (paragraph and 2 buttons removed as requested) */}
                <div className="md:col-span-7">
                  <h1 className="text-[clamp(22px,3.3vw,42px)] xl:text-[44px] leading-[1.18] font-black tracking-tight text-white m-0">
                    <span className="block whitespace-nowrap">Học AI Bằng Cách</span>
                    <span className="block whitespace-nowrap text-[#d4ff00] drop-shadow-[0_0_25px_rgba(212,255,0,0.4)]">
                      Tạo&nbsp;Ra&nbsp;Thứ&nbsp;Dùng&nbsp;Được.
                    </span>
                  </h1>

                  {/* Micro feature pills */}
                  <div className="flex flex-wrap items-center gap-2 mt-4 text-[11px] font-mono text-slate-300">
                    <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d4ff00]"></span>
                      Không cần code
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff]"></span>
                      Chạy trực tiếp Web
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d946ef]"></span>
                      Tiếng Việt 100%
                    </span>
                  </div>
                </div>

                {/* Right: 3D Interactive Mascot Host with Parallax Tracking & Touch Interaction */}
                <div 
                  className="md:col-span-5 flex flex-col items-center justify-center relative pt-2 pb-1 cursor-pointer select-none"
                  onMouseMove={handleMascotMouseMove}
                  onMouseLeave={handleMascotMouseLeave}
                  onTouchStart={handleMascotClick}
                  onTouchMove={handleMascotTouchMove}
                  onTouchEnd={handleMascotTouchEnd}
                  onClick={handleMascotClick}
                  title="Chạm hoặc rê chuột để tương tác 3D cùng Linh vật AI Mở"
                >
                  {/* Dynamic Speech Bubble */}
                  <div className="mb-2 px-3 py-1 rounded-xl bg-[#090c14]/90 border border-[#d4ff00]/40 text-center max-w-[240px] shadow-[0_6px_20px_rgba(0,0,0,0.6)] backdrop-blur-md animate-fade-in group">
                    <p className="text-[11px] font-mono text-[#d4ff00] font-semibold flex items-center justify-center gap-1">
                      <span>💬</span>
                      <span>"{MASCOT_MESSAGES[mascotSpeechIdx]}"</span>
                    </p>
                  </div>

                  {/* 3D Perspective Stage */}
                  <div 
                    className="relative w-full max-w-[240px] h-[190px] sm:h-[220px] flex items-center justify-center"
                    style={{ perspective: "1000px" }}
                  >
                    {/* Glowing platform rings with perspective */}
                    <div 
                      className="absolute bottom-1 w-44 h-12 border border-[#d4ff00]/40 rounded-[100%] animate-spin" 
                      style={{ animationDuration: "22s" }} 
                    />
                    <div className="absolute bottom-0 w-36 h-8 bg-[#d4ff00]/30 blur-lg rounded-[100%]" />
                    <div className="absolute bottom-2.5 w-48 h-10 border border-[#00e5ff]/20 rounded-[100%]" />

                    {/* 3D Moving Mascot Body (Floats gently when idle, tilts in 3D on hover/touch) */}
                    <div 
                      className={`relative z-10 w-full h-full flex items-center justify-center transition-all ${
                        mascotBouncing ? "-translate-y-4 scale-115" : ""
                      } ${!mascotHovered ? "animate-mascot-float-0" : ""}`}
                      style={{
                        transform: mascotHovered
                          ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate3d(${translateX}px, ${translateY}px, 20px)`
                          : undefined,
                        transition: mascotHovered ? "transform 0.08s ease-out" : "transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)"
                      }}
                    >
                      <Image
                        src="/mascot/v2-aimo-mascot.png"
                        alt="Linh vật AI Mở 3D Tương Tác"
                        width={240}
                        height={240}
                        className="w-auto h-[175px] sm:h-[205px] object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.95)]"
                        priority
                      />
                    </div>

                    {/* Floating Holographic HUD Screen (Counter-parallax depth layer) */}
                    <div 
                      className="absolute top-3 -right-1 bg-black/85 backdrop-blur-md border border-[#d4ff00]/60 px-2.5 py-1 rounded-lg text-[9.5px] font-mono text-[#d4ff00] shadow-[0_4px_16px_rgba(212,255,0,0.25)] flex items-center gap-1.5 z-20 pointer-events-none"
                      style={{
                        transform: `rotateX(${rotateX * 1.3}deg) rotateY(${rotateY * 1.3}deg) translate3d(${-translateX * 1.4}px, ${-translateY * 1.4}px, 40px)`,
                        transition: mascotHovered ? "transform 0.08s ease-out" : "transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)"
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d4ff00] animate-ping" />
                      <span>AI MỞ 3D COMPANION</span>
                    </div>

                    <div 
                      className="absolute bottom-4 -left-2 bg-black/85 backdrop-blur-md border border-[#00e5ff]/50 px-2 py-0.5 rounded-md text-[9px] font-mono text-[#00e5ff] shadow-md z-20 pointer-events-none"
                      style={{
                        transform: `rotateX(${rotateX * 1.2}deg) rotateY(${rotateY * 1.2}deg) translate3d(${-translateX * 1.1}px, ${-translateY * 1.1}px, 30px)`,
                        transition: mascotHovered ? "transform 0.08s ease-out" : "transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)"
                      }}
                    >
                      <span>● CHẠM ĐỂ TƯƠNG TÁC 3D</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* ── 5 PROMINENT ECOSYSTEM CARDS (3D HOLOGRAM FULL-BODY MASCOTS) ── */}
            <div className="relative z-10 pt-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#d4ff00] animate-ping" />
                  <span className="font-extrabold text-white text-sm sm:text-base tracking-tight">
                    5 Trụ Cột Hệ Sinh Thái AI Mở
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#d4ff00]/15 text-[#d4ff00] border border-[#d4ff00]/30 font-bold hidden sm:inline">
                    Linh Vật 3D Tương Tác
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Chạm hoặc rê chuột vào linh vật để tương tác ✨
                </span>
              </div>

              {/* 5 Full-Body 3D Mascot Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 sm:gap-4">
                {MODULES.map((m, idx) => (
                  <Link
                    key={m.href}
                    href={m.href}
                    className="group relative p-2 sm:p-3 rounded-2xl bg-transparent hover:bg-white/[0.04] active:bg-white/[0.08] border-0 transition-all duration-300 hover:-translate-y-3 active:scale-95 flex flex-col items-center text-center overflow-visible select-none"
                    title={`Khám phá ${m.label}`}
                  >
                    {/* Ambient Aura Glow (Active breathing on mobile, intensifies on hover) */}
                    <div 
                      className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full opacity-35 sm:opacity-0 group-hover:opacity-75 blur-3xl transition-opacity duration-500 pointer-events-none animate-mascot-aura"
                      style={{ backgroundColor: m.color }}
                    />
                    
                    {/* Full-Body 3D Mascot Hologram Stage */}
                    <div className="relative w-full h-[200px] sm:h-[235px] xl:h-[255px] flex items-end justify-center z-10 pb-2">
                      {/* Holographic Glowing Platform Ring at feet (Pulsing light effect) */}
                      <div 
                        className="absolute bottom-1 w-24 h-6 rounded-[100%] border border-current opacity-60 sm:opacity-40 group-hover:opacity-100 blur-[1px] transition-all group-hover:scale-125 animate-mascot-ring pointer-events-none"
                        style={{ color: m.color, backgroundColor: `${m.color}25` }}
                      />
                      <div 
                        className="absolute bottom-0 w-16 h-3 rounded-[100%] opacity-40 sm:opacity-30 group-hover:opacity-85 blur-md transition-all pointer-events-none"
                        style={{ backgroundColor: m.color }}
                      />

                      {/* Full Body Character PNG with Staggered Ambient Float on mobile & desktop */}
                      <Image
                        src={m.image}
                        alt={m.label}
                        width={210}
                        height={424}
                        className={`relative z-10 w-auto h-full max-h-[200px] sm:max-h-[235px] xl:max-h-[255px] object-contain object-bottom drop-shadow-[0_12px_24px_rgba(0,0,0,0.95)] group-hover:scale-115 group-hover:-translate-y-2.5 active:scale-110 active:-translate-y-2 transition-all duration-300 animate-mascot-float-${idx}`}
                        priority
                      />
                    </div>

                    {/* Card Title & Desc */}
                    <div className="relative z-10 mt-1 w-full flex flex-col items-center">
                      {"badge" in m && m.badge && (
                        <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#d946ef]/20 text-[#d946ef] border border-[#d946ef]/40 mb-1 shadow-[0_0_8px_rgba(217,70,239,0.3)] animate-pulse">
                          {m.badge}
                        </span>
                      )}
                      <div 
                        className="font-black text-[15px] sm:text-[17px] leading-tight transition-all duration-200 group-hover:drop-shadow-[0_0_12px_currentColor]"
                        style={{ color: m.color }}
                      >
                        {m.label}
                      </div>
                      <div className="text-[11px] text-slate-300 mt-1 line-clamp-1 font-medium group-hover:text-white transition-colors">
                        {m.desc}
                      </div>
                    </div>
                  </Link>
                ))}
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
              <div className="dark-surface-preserve relative rounded-2xl overflow-hidden aspect-[16/9] bg-neutral-950 border border-white/10 shadow-inner">
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
