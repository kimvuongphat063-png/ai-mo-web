"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Coffee, X, Copy, Check, Heart, Sparkles, ShieldCheck } from "lucide-react";

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: "download" | "general";
}

const PRESET_AMOUNTS = [
  { label: "20.000đ", value: 20000, desc: "1 ly cà phê đen đá ☕" },
  { label: "50.000đ", value: 50000, desc: "1 ly sinh tố năng lượng 🥤" },
  { label: "100.000đ", value: 100000, desc: "Nuôi server 1 tháng 🚀" },
];

export function DonateModal({ isOpen, onClose, reason = "general" }: DonateModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(20000);
  const [qrSrc, setQrSrc] = useState<string>("/images/donate-qr.jpg");

  // Update dynamic VietQR if user changes amount, fallback to local image
  useEffect(() => {
    if (selectedAmount > 0) {
      setQrSrc(
        `https://img.vietqr.io/image/seabank-666006668789-compact2.png?amount=${selectedAmount}&addInfo=AIMO%20CAFE&accountName=TRAN%20NGOC%20HOANG%20ANH`
      );
    } else {
      setQrSrc("/images/donate-qr.jpg");
    }
  }, [selectedAmount]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDismiss = () => {
    // Save to localStorage: don't auto-popup for 7 days
    try {
      localStorage.setItem("aimo_donate_dismissed_until", String(Date.now() + 7 * 86400 * 1000));
    } catch {}
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-neutral-200 animate-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2 text-center pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
            <Coffee className="w-3.5 h-3.5 text-amber-600" />
            <span>Tiếp lửa cho AI Mở Studio</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
            Mời team 1 ly cà phê nhé! ☕
          </h3>

          <p className="text-xs text-neutral-600 leading-relaxed max-w-xs mx-auto">
            {reason === "download" ? (
              <>
                <span className="text-emerald-600 font-bold">🎉 Tải app thành công!</span> Toàn bộ app tại AI Mở đều miễn phí & offline. Mời team 1 ly cà phê để tiếp thêm năng lượng nhé!
              </>
            ) : (
              "Mọi công cụ & kiến thức tại AI Mở đều miễn phí. Sự đồng hành của bạn giúp duy trì máy chủ và phát triển thêm nhiều app mới mỗi tuần!"
            )}
          </p>
        </div>

        {/* Preset Amount Selector */}
        <div className="mt-4 space-y-1.5">
          <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block text-center">
            Chọn mức cà phê tiếp sức:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_AMOUNTS.map((item) => {
              const isSelected = selectedAmount === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setSelectedAmount(item.value)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center border cursor-pointer ${
                    isSelected
                      ? "bg-amber-500 text-white border-amber-600 shadow-xs scale-[1.02]"
                      : "bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-200"
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* VietQR Code Card */}
        <div className="mt-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200/90 flex flex-col items-center text-center">
          <div className="relative w-48 h-48 bg-white p-2 rounded-xl shadow-xs border border-neutral-200/80">
            <img
              src={qrSrc}
              alt="Mã VietQR Donate SeABank"
              className="w-full h-full object-contain rounded-lg"
              onError={() => setQrSrc("/images/donate-qr.jpg")}
            />
          </div>
          <span className="mt-2 text-[11px] text-neutral-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Mở App ngân hàng hoặc MoMo quét mã là xong
          </span>
        </div>

        {/* Account Details with Copy Buttons */}
        <div className="mt-4 space-y-2 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-neutral-200">
            <div>
              <span className="text-[10px] text-neutral-400 uppercase block font-semibold">Ngân hàng</span>
              <span className="font-bold text-neutral-800">SeABank (Đông Nam Á)</span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard("SeABank", "bank")}
              className="px-2.5 py-1 text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              {copiedField === "bank" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedField === "bank" ? "Đã chép" : "Sao chép"}</span>
            </button>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-neutral-200">
            <div>
              <span className="text-[10px] text-neutral-400 uppercase block font-semibold">Số tài khoản</span>
              <span className="font-mono font-bold text-sm text-[#155EEF]">666006668789</span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard("666006668789", "stk")}
              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-[#155EEF] hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              {copiedField === "stk" ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
              <span>{copiedField === "stk" ? "Đã chép" : "Sao chép STK"}</span>
            </button>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-neutral-200">
            <div>
              <span className="text-[10px] text-neutral-400 uppercase block font-semibold">Chủ tài khoản</span>
              <span className="font-bold text-neutral-800">TRAN NGOC HOANG ANH</span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard("TRAN NGOC HOANG ANH", "name")}
              className="px-2.5 py-1 text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              {copiedField === "name" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedField === "name" ? "Đã chép" : "Sao chép"}</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-neutral-500">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>Biết ơn sự đồng hành của bạn!</span>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 py-1 px-3 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            Để dịp khác nhé
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Global Floating Coffee Button + Automatic Event Listener
 */
export function DonateCoffeeWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<"download" | "general">("general");

  useEffect(() => {
    // Listen for custom trigger event
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ reason?: "download" | "general" }>;
      setReason(customEvent.detail?.reason || "general");
      setIsOpen(true);
    };

    window.addEventListener("open-donate-coffee", handleOpen);

    // Global click listener for any download link to trigger donate modal nicely after 1.5s
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href") || "";
      if (href.includes("/api/apps/") && href.includes("/download")) {
        // Check if recently dismissed in last 2 days
        try {
          const dismissedUntil = localStorage.getItem("aimo_donate_dismissed_until");
          if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
            return;
          }
        } catch {}

        setTimeout(() => {
          setReason("download");
          setIsOpen(true);
        }, 1800);
      }
    };

    document.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("open-donate-coffee", handleOpen);
      document.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <>
      {/* Floating Coffee Button */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={() => {
            setReason("general");
            setIsOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-white hover:bg-amber-50 text-neutral-800 hover:text-amber-900 border border-amber-200/90 shadow-lg shadow-amber-500/10 hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer group"
          title="Mời AI Mở Studio 1 ly cà phê ☕"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700 group-hover:scale-110 transition-transform">
            ☕
          </span>
          <span className="text-xs font-bold tracking-tight pr-1">
            Mời cà phê
          </span>
        </button>
      </div>

      {/* Modal */}
      <DonateModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        reason={reason}
      />
    </>
  );
}
