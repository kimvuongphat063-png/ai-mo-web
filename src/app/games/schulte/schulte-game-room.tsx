"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Maximize2,
  Minimize2,
  ExternalLink,
  Share2,
  RotateCcw,
  Sparkles,
  Zap,
  Eye,
  Brain,
  Trophy,
  CheckCircle2,
  Volume2,
  ShieldCheck,
  Flame,
  ArrowRight,
  BookOpen,
  TrendingUp,
} from "lucide-react";

export function SchulteGameRoom() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [key, setKey] = useState(0); // for reload iframe
  const iframeContainerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(async () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      if (typeof document !== "undefined") {
        document.body.style.overflow = "hidden";
        try {
          const el = iframeContainerRef.current as any;
          if (el) {
            if (el.requestFullscreen) await el.requestFullscreen().catch(() => {});
            else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen().catch(() => {});
          }
        } catch {}
      }
    } else {
      setIsFullscreen(false);
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
        try {
          if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
            if (document.exitFullscreen) await document.exitFullscreen().catch(() => {});
            else if ((document as any).webkitExitFullscreen) await (document as any).webkitExitFullscreen().catch(() => {});
          }
        } catch {}
      }
    }
  }, [isFullscreen]);

  // Synchronize state when user presses ESC key or uses browser native controls
  useEffect(() => {
    const handleFsChange = () => {
      const isNativeFs = Boolean(
        document.fullscreenElement || (document as any).webkitFullscreenElement
      );
      if (!isNativeFs && isFullscreen) {
        setIsFullscreen(false);
        document.body.style.overflow = "";
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
        document.body.style.overflow = "";
      }
    };

    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  const handleReload = () => {
    setKey((prev) => prev + 1);
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "https://www.heyaimo.com/games/schulte";
    const shareData = {
      title: "Thử Thách Vòng Số Schulte Focus 60 Giây — AI Mở Studio",
      text: "Tôi vừa kích hoạt 100% não bộ với Bảng Schulte Focus! Cùng vào so tài kỷ lục xem ai tìm xong nhanh hơn nhé!",
      url,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-10">
      {/* ── BREADCRUMBS ── */}
      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
        <Link href="/" className="hover:text-white transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <Link href="/games" className="hover:text-white transition-colors">
          Kho Game Web Trí Tuệ
        </Link>
        <span>/</span>
        <span className="text-[#d4ff00] font-semibold">Vòng Số Schulte Focus</span>
      </div>

      {/* ── HERO BANNER HEADER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-[#101420]/95 backdrop-blur-2xl border border-[#d946ef]/40 p-6 sm:p-10 shadow-[0_20px_60px_rgba(217,70,239,0.18)]">
        {/* Cyber Neon Glows */}
        <div className="absolute -top-32 -left-20 w-80 h-80 rounded-full bg-[#d946ef]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-20 w-80 h-80 rounded-full bg-[#d4ff00]/15 blur-3xl pointer-events-none" />
        
        {/* Tech Grid Pattern */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(217,70,239,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(212,255,0,0.15) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#d946ef]/20 to-[#d4ff00]/20 border border-[#d4ff00]/50 text-[#d4ff00] text-xs font-mono font-bold tracking-wide shadow-[0_0_15px_rgba(212,255,0,0.2)]">
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>LEAD MAGNET ĐỘC QUYỀN · TÂM ĐIỂM LUYỆN NÃO 2026</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Vòng Số Schulte Focus <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#d946ef] via-purple-300 to-[#d4ff00] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(217,70,239,0.4)]">
                Luyện Não Đỉnh Cao & Tăng Tốc Đọc 300%
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              Phương pháp huấn luyện bí mật của các phi hành gia và kỷ lục gia tốc đọc thế giới. 
              Mở rộng thị trường thị giác ngoại vi, triệt tiêu đọc thầm và đưa não bộ vào trạng thái tập trung sâu (Flow State) chỉ trong 60 giây.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                100% Miễn phí & Cục bộ
              </span>
              <span className="flex items-center gap-1.5 text-[#d4ff00] bg-[#d4ff00]/10 px-3 py-1.5 rounded-xl border border-[#d4ff00]/30">
                <CheckCircle2 className="w-4 h-4 text-[#d4ff00]" />
                Không quảng cáo · Không cài đặt
              </span>
              <span className="flex items-center gap-1.5 text-[#d946ef] bg-[#d946ef]/10 px-3 py-1.5 rounded-xl border border-[#d946ef]/30">
                <Volume2 className="w-4 h-4 text-[#d946ef]" />
                Nhạc sóng não tập trung Web Audio
              </span>
            </div>
          </div>

          {/* Quick Stats Pill Panel */}
          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto shrink-0 font-mono text-center">
            <div className="bg-[#090c14]/90 border border-white/10 rounded-2xl p-4 shadow-lg">
              <span className="text-[11px] text-slate-400 block mb-1">MỤC TIÊU VÀNG</span>
              <span className="text-2xl font-black text-[#d4ff00]">&lt; 30s</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Bảng 5 × 5</span>
            </div>
            <div className="bg-[#090c14]/90 border border-white/10 rounded-2xl p-4 shadow-lg">
              <span className="text-[11px] text-slate-400 block mb-1">TỐC ĐỘ ĐỌC</span>
              <span className="text-2xl font-black text-[#d946ef]">+300%</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Mở rộng tầm mắt</span>
            </div>
            <div className="bg-[#090c14]/90 border border-white/10 rounded-2xl p-4 shadow-lg">
              <span className="text-[11px] text-slate-400 block mb-1">CHẾ ĐỘ CHƠI</span>
              <span className="text-2xl font-black text-cyan-400">3 Dạng</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Lưới · Vòng · Bóng</span>
            </div>
            <div className="bg-[#090c14]/90 border border-white/10 rounded-2xl p-4 shadow-lg">
              <span className="text-[11px] text-slate-400 block mb-1">CẤP ĐỘ MỞ</span>
              <span className="text-2xl font-black text-emerald-400">8 Cấp</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">3x3 đến 9x9</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE GAME STAGE COCKPIT ── */}
      <div
        ref={iframeContainerRef}
        className={
          isFullscreen
            ? "fixed inset-0 z-[999999] w-screen h-[100dvh] bg-[#090c14] flex flex-col p-2 sm:p-3 overflow-hidden shadow-2xl"
            : "space-y-3"
        }
      >
        {/* Cockpit Window Control Header */}
        <div className={`bg-[#121624] border border-[#d946ef]/40 rounded-2xl p-2.5 sm:px-5 sm:py-3 flex flex-wrap items-center justify-between gap-2 shadow-lg shrink-0 ${
          isFullscreen ? "mb-2" : ""
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
              <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            </div>
            <span className="text-xs sm:text-sm font-black text-white font-mono flex items-center gap-2">
              <span>SCHULTE_FOCUS_V1.EXE</span>
              <span className="w-2 h-2 rounded-full bg-[#d4ff00] animate-ping" />
            </span>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-2 flex-wrap ml-auto">
            <button
              type="button"
              onClick={handleReload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/15 text-xs font-bold transition-all"
              title="Tải lại bảng chơi mới"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lượt mới</span>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#d946ef]/20 hover:bg-[#d946ef] text-[#d946ef] hover:text-white border border-[#d946ef]/50 text-xs font-bold transition-all shadow-[0_0_12px_rgba(217,70,239,0.25)]"
              title="Phóng to toàn màn hình"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Thu nhỏ</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Toàn màn hình</span>
                </>
              )}
            </button>

            <a
              href="/games/schulte-focus.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all"
              title="Mở game ở tab mới độc lập"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mở tab mới</span>
            </a>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#d4ff00] hover:bg-[#b8e000] text-black font-black text-xs transition-all shadow-[0_0_15px_rgba(212,255,0,0.3)] hover:scale-105 active:scale-95"
              title="Sao chép link để thách đấu bạn bè"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? "Đã chép link! ✓" : "Thách đấu"}</span>
            </button>
          </div>
        </div>

        {/* Embedded Schulte Game Iframe */}
        <div className={`relative overflow-hidden border-2 border-[#d946ef]/50 shadow-[0_25px_70px_rgba(0,0,0,0.8)] bg-[#090c14] ${
          isFullscreen
            ? "flex-1 w-full h-[calc(100%-60px)] min-h-0 rounded-2xl"
            : "rounded-3xl"
        }`}>
          <iframe
            key={key}
            src="/games/schulte-focus.html"
            title="Bảng số Schulte Focus"
            allow="fullscreen; autoplay; audio"
            className={
              isFullscreen
                ? "w-full h-full min-h-full border-0 block bg-[#f6f5fb]"
                : "w-full h-[780px] sm:h-[860px] md:h-[920px] border-0 block bg-[#f6f5fb]"
            }
          />
        </div>
      </div>

      {/* ── SCIENTIFIC FOUNDATION & SPEED READING GUIDE ── */}
      <div className="space-y-6 pt-6">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-[#d4ff00]" />
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Khoa Học Luyện Não & Bí Quyết Tăng Tốc Đọc 300%
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="bg-[#101420] border border-white/10 hover:border-[#d946ef]/50 rounded-2xl p-5 space-y-3 transition-all hover:-translate-y-1 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-[#d946ef]/15 text-[#d946ef] flex items-center justify-center border border-[#d946ef]/30">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Mở Rộng Thị Trường Ngoại Vi</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Khi chơi bảng Schulte, hãy giữ cố định tầm nhìn tại <strong>ô số ở tâm</strong>. 
              Sử dụng tầm nhìn bao quát (peripheral vision) để dò các số còn lại thay vì đảo mắt liên tục. 
              Kỹ thuật này giúp bạn thu nhận cả câu văn chỉ trong 1 điểm dừng mắt (fixation).
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-[#101420] border border-white/10 hover:border-[#d4ff00]/50 rounded-2xl p-5 space-y-3 transition-all hover:-translate-y-1 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-[#d4ff00]/15 text-[#d4ff00] flex items-center justify-center border border-[#d4ff00]/30">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Triệt Tiêu Thói Quen Đọc Thầm</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Đọc thầm (subvocalization) giới hạn tốc độ đọc ở mức 200–250 từ/phút (tương đương tốc độ nói). 
              Luyện Schulte với nhịp bấm nhanh buộc não xử lý hình ảnh trực tiếp qua mắt mà không phát âm thành tiếng, đẩy tốc độ đọc lên 600–800 từ/phút.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#101420] border border-white/10 hover:border-cyan-400/50 rounded-2xl p-5 space-y-3 transition-all hover:-translate-y-1 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-cyan-400/15 text-cyan-400 flex items-center justify-center border border-cyan-400/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Kích Hoạt Trạng Thái Dòng Chảy</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              60 giây tập trung cao độ sẽ kích hoạt lưu lượng máu lên vỏ não trước trán (Prefrontal Cortex), 
              xua tan sương mù não (brain fog) và chuẩn bị tinh thần tối ưu trước khi bước vào ca làm việc hay học tập quan trọng.
            </p>
          </div>
        </div>

        {/* ── BENCHMARK STANDARDS TABLE ── */}
        <div className="bg-[#101420] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-5 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-black text-white">Thang Chuẩn Kỷ Lục Quốc Tế (Bảng 5 × 5)</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">Tham chiếu Hiệp hội Tốc đọc & Não bộ Quốc tế</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-xs font-bold text-emerald-400 block mb-1">XUẤT SẮC · ĐẲNG CẤP</span>
              <span className="text-2xl font-black text-white font-mono">&lt; 25 Giây</span>
              <p className="text-[11px] text-slate-400 mt-1">Khả năng nắm bắt văn bản tức thì, thị trường ngoại vi hoàn hảo.</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#d4ff00]/10 border border-[#d4ff00]/30">
              <span className="text-xs font-bold text-[#d4ff00] block mb-1">RẤT TỐT · CHUYÊN GIA</span>
              <span className="text-2xl font-black text-white font-mono">25 – 35 Giây</span>
              <p className="text-[11px] text-slate-400 mt-1">Phản xạ nhạy bén, tốc độ xử lý thông tin gấp đôi người bình thường.</p>
            </div>
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
              <span className="text-xs font-bold text-cyan-400 block mb-1">TRUNG BÌNH KHÁ</span>
              <span className="text-2xl font-black text-white font-mono">35 – 50 Giây</span>
              <p className="text-[11px] text-slate-400 mt-1">Mức phản xạ phổ thông. Chỉ cần 5 ngày luyện tập là rút xuống &lt; 30s.</p>
            </div>
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30">
              <span className="text-xs font-bold text-purple-400 block mb-1">CẦN RÈN LUYỆN</span>
              <span className="text-2xl font-black text-white font-mono">&gt; 50 Giây</span>
              <p className="text-[11px] text-slate-400 mt-1">Mắt còn thói quen nhảy đảo từng ô. Hãy thả lỏng và nhìn vào tâm điểm.</p>
            </div>
          </div>
        </div>

        {/* ── DAILY 10-MINUTE ROUTINE & RECOMMENDATIONS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#101420] border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#d946ef]" />
              <h3 className="text-base sm:text-lg font-black text-white">Lộ Trình Huấn Luyện 10 Phút Mỗi Ngày</h3>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#d946ef]/20 text-[#d946ef] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span><strong>Khởi động (2 phút):</strong> 2 lượt bảng 3x3 và 4x4 để mắt làm quen với nhịp điệu ánh sáng và âm thanh.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#d946ef]/20 text-[#d946ef] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span><strong>Đột phá tốc độ (5 phút):</strong> 4 lượt bảng chuẩn 5x5. Nhìn thẳng vào ô trung tâm, chỉ di chuyển nhận thức, giữ mắt tĩnh.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#d946ef]/20 text-[#d946ef] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                <span><strong>Thử thách đa giác quan (3 phút):</strong> Bật chế độ <em>Vòng xoay (Wheel)</em> hoặc <em>Bong bóng trôi (Bubble)</em> để tăng phản xạ với mục tiêu chuyển động.</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#101420] border border-white/10 rounded-3xl p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#d4ff00]" />
                <h3 className="text-base sm:text-lg font-black text-white">Hệ Sinh Thái Sáng Tạo AI Mở Studio</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Schulte Focus là một trong 65+ ứng dụng web & công cụ thực chiến được thiết kế nhằm nâng cao năng suất trí tuệ. 
                Bạn muốn tạo ra những công cụ, game trí tuệ hoặc ứng dụng AI mang thương hiệu riêng của bạn?
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/games"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
              >
                <span>Xem 65+ game khác</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/tools"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#d4ff00] hover:bg-[#b8e000] text-black text-xs font-extrabold transition-all shadow-md shadow-[#d4ff00]/20"
              >
                <span>Khám phá Công cụ AI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
