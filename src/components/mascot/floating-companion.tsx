"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Sparkles, MessageCircle, Play, Gamepad2, PhoneCall, ChevronRight } from "lucide-react";

interface RouteDialogue {
  tag: string;
  message: string;
  actionText: string;
  actionHref: string;
}

const ROUTE_CONTEXTS: Record<string, RouteDialogue> = {
  "/promptkichban": {
    tag: "STUDIO // PROMPT KỊCH BẢN",
    message: "Bạn muốn tạo kịch bản TikTok 30s hay video quảng cáo cho shop online?",
    actionText: "Tạo kịch bản ngay",
    actionHref: "/promptkichban",
  },
  "/tools": {
    tag: "CÔNG CỤ AI // THỰC CHIẾN",
    message: "Khám phá các công cụ tạo video, tách âm và viết prompt nhanh không cần code!",
    actionText: "Khám phá Studio",
    actionHref: "/promptkichban",
  },
  "/apps": {
    tag: "95+ APPS // QUẢN TRỊ & BÁN HÀNG",
    message: "95+ app kinh doanh chạy trực tiếp trên trình duyệt, không cần tài khoản!",
    actionText: "Dùng app miễn phí",
    actionHref: "/apps",
  },
  "/games": {
    tag: "GAMES 65+ // RÈN TRÍ TUỆ",
    message: "Chơi một ván game rèn luyện tư duy sau giờ làm việc căng thẳng nào bạn ơi!",
    actionText: "Vào sảnh Game",
    actionHref: "/games",
  },
  "/guides": {
    tag: "HỌC AI // THEO DỰ ÁN THẬT",
    message: "Học AI từ gốc bằng cách làm ra sản phẩm dùng được trước, hiểu lý thuyết sau!",
    actionText: "Xem lộ trình học",
    actionHref: "/guides",
  },
  "/products": {
    tag: "SẢN PHẨM SỐ // ASSET VAULT",
    message: "Kho template, kịch bản mẫu và prompt đóng gói sẵn, tải về là dùng được ngay!",
    actionText: "Xem kho tài nguyên",
    actionHref: "/products",
  },
  "/lien-he": {
    tag: "HOTLINE // ZALO JACKY TRAN",
    message: "Jacky Tran luôn sẵn sàng phản hồi bạn qua Hotline/Zalo 0988366917 trong 1 ngày làm việc!",
    actionText: "Nhắn Zalo ngay",
    actionHref: "https://zalo.me/0988366917",
  },
};

const DEFAULT_DIALOGUE: RouteDialogue = {
  tag: "AI MỞ // NGƯỜI ĐỒNG HÀNH",
  message: "Chào bạn! Hôm nay bạn muốn sáng tạo video triệu view hay khám phá bộ công cụ mới nào?",
  actionText: "Mở buồng lái Video",
  actionHref: "/promptkichban",
};

export function FloatingMascotCompanion() {
  const pathname = usePathname() || "/";
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [bounce, setBounce] = useState(false);

  // Match route context
  const context = Object.entries(ROUTE_CONTEXTS).find(([route]) =>
    pathname.startsWith(route)
  )?.[1] || DEFAULT_DIALOGUE;

  // Subtle entrance trigger on path change
  useEffect(() => {
    setIsDismissed(false);
    setBounce(true);
    const timer = setTimeout(() => setBounce(false), 800);
    return () => clearTimeout(timer);
  }, [pathname]);

  const handleMascotClick = () => {
    setIsOpen((prev) => !prev);
    setBounce(true);
    setTimeout(() => setBounce(false), 600);
  };

  return (
    <aside
      aria-label="Linh vật AI Mở trợ lý tương tác"
      className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end pointer-events-none select-none font-sans"
    >
      {/* ── EXPANDED DIALOGUE CARD ── */}
      {isOpen && (
        <div className="pointer-events-auto mb-3 w-[290px] sm:w-[320px] rounded-2xl bg-[#0d121f]/95 border border-[#d4ff00]/40 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-fade-in text-white relative">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Đóng bảng tương tác"
            className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#d4ff00] animate-ping" />
            <span className="text-[10px] font-mono font-bold tracking-wider text-[#d4ff00] uppercase">
              {context.tag}
            </span>
          </div>

          <p className="text-xs sm:text-[13px] text-slate-200 leading-relaxed mb-3.5 pr-4">
            {context.message}
          </p>

          <div className="flex items-center gap-2">
            <Link
              href={context.actionHref}
              onClick={() => setIsOpen(false)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#d4ff00] text-black text-xs font-bold hover:bg-[#b8e000] transition-colors shadow-[0_2px_10px_rgba(212,255,0,0.3)]"
            >
              <span>{context.actionText}</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </Link>

            <a
              href="https://zalo.me/0988366917"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Mở Zalo Jacky Tran"
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/15 transition-colors"
              title="Zalo: 0988366917"
            >
              Zalo
            </a>
          </div>
        </div>
      )}

      {/* ── COLLAPSED SPEECH BUBBLE TEASER (Desktop only, if not dismissed) ── */}
      {!isOpen && !isDismissed && (
        <div className="pointer-events-auto hidden md:flex items-center gap-2 mb-2.5 mr-1 py-1.5 px-3 rounded-full bg-[#0d121f]/90 border border-white/15 shadow-xl text-xs backdrop-blur-md animate-fade-in group hover:border-[#d4ff00]/50 transition-colors">
          <span className="text-[11px] font-medium text-slate-200">
            {context.message.length > 55 ? `${context.message.slice(0, 55)}…` : context.message}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsDismissed(true);
            }}
            className="text-slate-400 hover:text-white p-0.5 ml-1"
            title="Đóng gợi ý"
            aria-label="Ẩn gợi ý"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ── MASCOT FLOATING TRIGGER BUTTON ── */}
      <button
        type="button"
        onClick={handleMascotClick}
        aria-label="Mở tương tác Linh vật AI Mở"
        className={`pointer-events-auto relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#090c14] border-2 border-[#d4ff00] p-1 shadow-[0_0_25px_rgba(212,255,0,0.4)] transition-all duration-300 hover:scale-110 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-[#d4ff00] ${
          bounce ? "-translate-y-2 scale-105" : ""
        }`}
      >
        {/* Online Status Indicator */}
        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#090c14]" />
        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping opacity-75" />

        {/* Mascot Avatar (High-resolution face crop) */}
        <div className="w-full h-full rounded-full overflow-hidden relative bg-black">
          <Image
            src="/mascot/v2-mascot-avatar.png"
            alt="Linh vật AI Mở"
            width={64}
            height={64}
            className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-300"
          />
        </div>

        {/* Floating Ring Glow */}
        <span className="absolute inset-0 rounded-full border border-[#d4ff00]/40 animate-pulse pointer-events-none" />
      </button>
    </aside>
  );
}
