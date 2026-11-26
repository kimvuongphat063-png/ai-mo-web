"use client";

import { useState, useEffect, useRef } from "react";
import { Coffee, X, Copy, Check, Heart, Sparkles, CheckCircle2, Download } from "lucide-react";
import { HTML_APPS } from "@/lib/apps-data";

export type CoffeePopupReason = "download" | "general" | "coffee-unlock";

export interface TriggerCoffeePopupOptions {
  reason?: CoffeePopupReason;
  appSlug?: string;
  appTitle?: string;
  amount?: number;
}

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: CoffeePopupReason;
  appSlug?: string;
  appTitle?: string;
  amount?: number;
}

const PRESET_AMOUNTS = [
  { label: "20.000đ", value: 20000, desc: "1 ly cà phê đen đá ☕" },
  { label: "50.000đ", value: 50000, desc: "1 ly sinh tố năng lượng 🥤" },
  { label: "100.000đ", value: 100000, desc: "Nuôi server 1 tháng 🚀" },
];

export function DonateModal({
  isOpen,
  onClose,
  reason = "general",
  appSlug,
  appTitle,
  amount = 20000,
}: DonateModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(amount || 20000);
  const [qrSrc, setQrSrc] = useState<string>("/images/donate-qr.jpg");
  const [confirmedUnlock, setConfirmedUnlock] = useState<boolean>(false);
  const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isCoffeeUnlock = reason === "coffee-unlock";
  const transferCode = isCoffeeUnlock
    ? `AIMO ${(appSlug || "APP").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12)}`
    : "AIMO CAFE";

  // Reset modal state whenever opened or target app changes
  useEffect(() => {
    if (isOpen) {
      setConfirmedUnlock(false);
      setSelectedAmount(amount && amount > 0 ? amount : 20000);
    }
    return () => {
      if (autoCloseRef.current) {
        clearTimeout(autoCloseRef.current);
        autoCloseRef.current = null;
      }
    };
  }, [isOpen, reason, appSlug, amount]);

  // Update dynamic VietQR if user changes amount or transfer note, fallback to local image
  useEffect(() => {
    if (selectedAmount > 0) {
      setQrSrc(
        `https://img.vietqr.io/image/seabank-666006668789-compact2.png?amount=${selectedAmount}&addInfo=${encodeURIComponent(
          transferCode
        )}&accountName=TRAN%20NGOC%20HOANG%20ANH`
      );
    } else {
      setQrSrc("/images/donate-qr.jpg");
    }
  }, [selectedAmount, transferCode]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDismiss = () => {
    if (autoCloseRef.current) {
      clearTimeout(autoCloseRef.current);
      autoCloseRef.current = null;
    }
    // Only suppress auto-popup for general/download modes; NEVER block coffee-unlock from reopening
    if (!isCoffeeUnlock) {
      try {
        localStorage.setItem(
          "aimo_donate_dismissed_until",
          String(Date.now() + 7 * 86400 * 1000)
        );
      } catch {}
    }
    onClose();
  };

  const handleConfirmCoffeeDownload = () => {
    const targetSlug = appSlug || "";
    if (targetSlug) {
      try {
        localStorage.setItem("aimo_coffee_unlocked_" + targetSlug, "1");
      } catch {}

      window.dispatchEvent(
        new CustomEvent("aimo-coffee-unlocked", { detail: { slug: targetSlug } })
      );

      // Notify embedded app iframes if listening
      try {
        document.querySelectorAll("iframe").forEach((frame) => {
          frame.contentWindow?.postMessage(
            { type: "AIMO_COFFEE_UNLOCKED", slug: targetSlug },
            "*"
          );
        });
      } catch {}
    }

    setConfirmedUnlock(true);

    if (autoCloseRef.current) clearTimeout(autoCloseRef.current);
    autoCloseRef.current = setTimeout(() => {
      onClose();
    }, 3500);
  };

  const downloadHref = appSlug ? `/api/apps/${appSlug}/download?coffee=1` : "#";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-neutral-200 animate-in zoom-in-95 duration-200 overflow-hidden max-h-[92vh] overflow-y-auto no-scrollbar"
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
            <Coffee className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              {isCoffeeUnlock
                ? "☕ Mở khóa Bản Offline Trọn Đời · 20.000đ"
                : "Tiếp lửa cho AI Mở Studio"}
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
            {isCoffeeUnlock
              ? "Mời AI Mở 1 ly cà phê 20k nhé! ☕"
              : "Mời team 1 ly cà phê nhé! ☕"}
          </h3>

          <p className="text-xs text-neutral-600 leading-relaxed max-w-sm mx-auto">
            {isCoffeeUnlock ? (
              <>
                Bạn luôn được dùng trực tiếp trên web hoàn toàn miễn phí. Để tải file{" "}
                <strong className="text-neutral-900 font-bold">
                  &ldquo;{appTitle || "ứng dụng"}&rdquo;
                </strong>{" "}
                (.html) về máy dùng offline vĩnh viễn không cần mạng, hãy mời team 1 ly cà phê
                20.000đ qua mã VietQR bên dưới nhé!
              </>
            ) : reason === "download" ? (
              <>
                <span className="text-emerald-600 font-bold">🎉 Tải app thành công!</span> Toàn
                bộ app tại AI Mở đều miễn phí & offline. Mời team 1 ly cà phê để tiếp thêm năng
                lượng nhé!
              </>
            ) : (
              "Mọi công cụ & kiến thức tại AI Mở đều miễn phí. Sự đồng hành của bạn giúp duy trì máy chủ và phát triển thêm nhiều app mới mỗi tuần!"
            )}
          </p>
        </div>

        {/* Preset Amount Selector */}
        <div className="mt-4 space-y-1.5">
          <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block text-center">
            {isCoffeeUnlock ? "Mức cà phê mở khóa (mặc định 20k):" : "Chọn mức cà phê tiếp sức:"}
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
            <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
            <span>
              Mở App ngân hàng hoặc MoMo quét mã ({selectedAmount.toLocaleString("vi-VN")}đ ·{" "}
              <strong className="text-neutral-700 font-mono">{transferCode}</strong>)
            </span>
          </span>
        </div>

        {/* Coffee-Unlock Instant Confirm & Download Action (Hướng 1 — không chờ duyệt) */}
        {isCoffeeUnlock && appSlug && (
          <div className="mt-4 space-y-2.5">
            {confirmedUnlock ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2 animate-in fade-in duration-200">
                <p className="text-xs sm:text-sm font-extrabold text-emerald-800 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>🎉 Cảm ơn bạn rất nhiều! File Offline đang được tải về máy...</span>
                </p>
                <div className="flex items-center justify-center gap-3 pt-0.5">
                  <a
                    href={downloadHref}
                    download
                    data-skip-coffee-popup="true"
                    className="text-[11px] font-bold text-emerald-700 underline hover:text-emerald-900"
                  >
                    Bấm vào đây nếu trình duyệt chưa tự tải
                  </a>
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ) : (
              <a
                href={downloadHref}
                download
                data-skip-coffee-popup="true"
                onClick={handleConfirmCoffeeDownload}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 !text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-center cursor-pointer"
              >
                <Download className="w-4 h-4 !text-white shrink-0" />
                <span className="!text-white">☕ Tôi đã mời cà phê 20k — Tải file ngay</span>
              </a>
            )}
          </div>
        )}

        {/* Account Details with Copy Buttons */}
        <div className="mt-4 space-y-2 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-neutral-200">
            <div>
              <span className="text-[10px] text-neutral-400 uppercase block font-semibold">
                Ngân hàng
              </span>
              <span className="font-bold text-neutral-800">SeABank (Đông Nam Á)</span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard("SeABank", "bank")}
              className="px-2.5 py-1 text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              {copiedField === "bank" ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              <span>{copiedField === "bank" ? "Đã chép" : "Sao chép"}</span>
            </button>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-neutral-200">
            <div>
              <span className="text-[10px] text-neutral-400 uppercase block font-semibold">
                Số tài khoản
              </span>
              <span className="font-mono font-bold text-sm text-[#155EEF]">666006668789</span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard("666006668789", "stk")}
              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-[#155EEF] hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              {copiedField === "stk" ? (
                <Check className="w-3 h-3 text-emerald-300" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              <span>{copiedField === "stk" ? "Đã chép" : "Sao chép STK"}</span>
            </button>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-neutral-200">
            <div>
              <span className="text-[10px] text-neutral-400 uppercase block font-semibold">
                Chủ tài khoản
              </span>
              <span className="font-bold text-neutral-800">TRAN NGOC HOANG ANH</span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard("TRAN NGOC HOANG ANH", "name")}
              className="px-2.5 py-1 text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              {copiedField === "name" ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
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
            {isCoffeeUnlock ? "Đóng lại" : "Để dịp khác nhé"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper to programmatically open the coffee donate / offline-unlock modal from any component
 */
export function triggerCoffeePopup(
  input: CoffeePopupReason | TriggerCoffeePopupOptions = "download"
) {
  if (typeof window !== "undefined") {
    const detail: TriggerCoffeePopupOptions =
      typeof input === "string" ? { reason: input } : { reason: "download", ...input };
    window.dispatchEvent(new CustomEvent("open-donate-coffee", { detail }));
  }
}

/**
 * Global Floating Coffee Button + Automatic Event & Iframe Message Listener
 */
export function DonateCoffeeWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<CoffeePopupReason>("general");
  const [appSlug, setAppSlug] = useState<string | undefined>(undefined);
  const [appTitle, setAppTitle] = useState<string | undefined>(undefined);
  const [amount, setAmount] = useState<number>(20000);

  useEffect(() => {
    // Listen for custom trigger event (e.g. from app/game download or coffee-unlock)
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<TriggerCoffeePopupOptions>;
      const detail = customEvent.detail || {};
      setReason(detail.reason || "general");
      setAppSlug(detail.appSlug);
      setAppTitle(detail.appTitle);
      setAmount(detail.amount && detail.amount > 0 ? detail.amount : 20000);
      setIsOpen(true);
    };

    window.addEventListener("open-donate-coffee", handleOpen);

    // Listen for postMessage from embedded HTML apps inside iframe
    const handleMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "object") return;
      if (e.data.type === "AIMO_OPEN_COFFEE_DOWNLOAD") {
        const requestedSlug = typeof e.data.slug === "string" ? e.data.slug : "";
        const matchedApp =
          HTML_APPS.find((a) => a.slug === requestedSlug) ||
          HTML_APPS.find((a) => window.location.pathname === `/apps/${a.slug}`);

        setReason("coffee-unlock");
        setAppSlug(matchedApp?.slug || requestedSlug || undefined);
        setAppTitle(
          matchedApp?.title ||
            (typeof e.data.title === "string" ? e.data.title : "Ứng dụng Offline AI Mở")
        );
        setAmount(
          matchedApp?.coffeePrice ||
            (typeof e.data.amount === "number" && e.data.amount > 0 ? e.data.amount : 20000)
        );
        setIsOpen(true);
      }
    };

    window.addEventListener("message", handleMessage);

    // Global click listener for any free download link (apps or games)
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href") || "";
      // Ignore coffee-unlock confirmed links (?coffee=1) so modal doesn't re-open over itself
      if (href.includes("coffee=1") || target.dataset.skipCoffeePopup === "true") {
        return;
      }

      const isDownloadLink =
        (href.includes("/api/apps/") || href.includes("/api/games/")) &&
        href.includes("/download");

      if (isDownloadLink) {
        setTimeout(() => {
          setReason("download");
          setAppSlug(undefined);
          setAppTitle(undefined);
          setAmount(20000);
          setIsOpen(true);
        }, 300);
      }
    };

    document.addEventListener("click", handleClick);

    // Smart auto-popup after 5 minutes of active browsing with engagement (scroll >= 35%)
    let timerElapsed = false;
    const triggerIfEligible = () => {
      try {
        const dismissedUntil = localStorage.getItem("aimo_donate_dismissed_until");
        if (dismissedUntil && Number(dismissedUntil) > Date.now()) return;

        const sessionShown = sessionStorage.getItem("aimo_donate_session_shown");
        if (sessionShown) return;

        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = docHeight > 0 ? window.scrollY / docHeight : 0;
        if (scrolled >= 0.35) {
          sessionStorage.setItem("aimo_donate_session_shown", "1");
          setReason("general");
          setAppSlug(undefined);
          setAppTitle(undefined);
          setAmount(20000);
          setIsOpen(true);
          window.removeEventListener("scroll", handleScrollCheck);
        }
      } catch {}
    };

    const handleScrollCheck = () => {
      if (timerElapsed) {
        triggerIfEligible();
      }
    };

    window.addEventListener("scroll", handleScrollCheck, { passive: true });

    const smartTimer = setTimeout(() => {
      timerElapsed = true;
      triggerIfEligible();
    }, 5 * 60 * 1000);

    return () => {
      window.removeEventListener("open-donate-coffee", handleOpen);
      window.removeEventListener("message", handleMessage);
      document.removeEventListener("click", handleClick);
      window.removeEventListener("scroll", handleScrollCheck);
      clearTimeout(smartTimer);
    };
  }, []);

  return (
    <>
      {/* Floating Coffee Button */}
      <div className="fixed bottom-20 left-4 sm:bottom-20 sm:left-6 z-40">
        <button
          type="button"
          onClick={() => {
            setReason("general");
            setAppSlug(undefined);
            setAppTitle(undefined);
            setAmount(20000);
            setIsOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#121826]/90 hover:bg-[#1a2236] text-slate-200 hover:text-white border border-amber-400/40 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 cursor-pointer group backdrop-blur-md"
          title="Mời AI Mở Studio 1 ly cà phê ☕"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform text-xs">
            ☕
          </span>
          <span className="text-xs font-bold tracking-tight pr-1">Mời cà phê</span>
        </button>
      </div>

      {/* Modal */}
      <DonateModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        reason={reason}
        appSlug={appSlug}
        appTitle={appTitle}
        amount={amount}
      />
    </>
  );
}
