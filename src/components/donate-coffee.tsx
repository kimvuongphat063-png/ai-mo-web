"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Coffee, X, Copy, Check, Heart, Sparkles, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { HTML_APPS } from "@/lib/apps-data";
import { PAID_APP_ACCOUNT } from "@/lib/coffee-payment";

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
  const [qrFailed, setQrFailed] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [dynamicTransferCode, setDynamicTransferCode] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<"idle" | "creating" | "pending" | "paid" | "expired" | "error">("idle");
  const [orderError, setOrderError] = useState<string | null>(null);
  const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isCoffeeUnlock = reason === "coffee-unlock";
  const matchedApp = appSlug ? HTML_APPS.find((a) => a.slug === appSlug) : undefined;
  const minAmount = isCoffeeUnlock
    ? Math.max(matchedApp?.coffeePrice || 0, amount || 0) || 20000
    : 0;
  const visiblePresets = isCoffeeUnlock
    ? PRESET_AMOUNTS.filter((item) => item.value >= minAmount)
    : PRESET_AMOUNTS;
  const minAmountShortLabel =
    minAmount >= 1000 && minAmount % 1000 === 0
      ? `${minAmount / 1000}k`
      : `${minAmount.toLocaleString("vi-VN")}đ`;
  const transferCode = isCoffeeUnlock
    ? dynamicTransferCode || "AIMO..."
    : "AIMO CAFE";
  const showPaymentDetails = !isCoffeeUnlock ||
    (Boolean(orderId) && (orderStatus === "pending" || orderStatus === "paid"));

  const triggerDownloadAndUnlock = useCallback(
    (paidOrderId: string) => {
      const targetSlug = appSlug || "";
      if (targetSlug) {
        try {
          localStorage.setItem("aimo_coffee_order_" + targetSlug, paidOrderId);
        } catch {}

        window.dispatchEvent(
          new CustomEvent("aimo-coffee-unlocked", {
            detail: { slug: targetSlug, orderId: paidOrderId },
          })
        );

        // Notify embedded app iframes if listening
        try {
          document.querySelectorAll("iframe").forEach((frame) => {
            frame.contentWindow?.postMessage(
              { type: "AIMO_COFFEE_UNLOCKED", slug: targetSlug, orderId: paidOrderId },
              "*"
            );
          });
        } catch {}

        // Auto-trigger file download
        const downloadUrl = `/api/apps/${targetSlug}/download?orderId=${encodeURIComponent(paidOrderId)}`;
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.setAttribute("download", "");
        link.setAttribute("data-skip-coffee-popup", "true");
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    },
    [appSlug]
  );

  const createOrder = useCallback(
    async (amt: number) => {
      if (!appSlug) return;
      setOrderStatus("creating");
      setOrderError(null);
      setOrderId(null);
      setDynamicTransferCode(null);
      setQrFailed(false);

      try {
        const res = await fetch("/api/coffee/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appSlug, amount: amt }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Không thể tạo mã thanh toán");
        }
        setOrderId(data.orderId);
        setDynamicTransferCode(data.transferCode);
        setQrSrc(data.qrUrl);
        setOrderStatus("pending");
      } catch (err: any) {
        setOrderStatus("error");
        setOrderError(err?.message || "Lỗi kết nối máy chủ thanh toán");
      }
    },
    [appSlug]
  );

  // Reset modal state whenever opened or target app changes
  useEffect(() => {
    if (isOpen) {
      const initialAmount = isCoffeeUnlock
        ? minAmount
        : amount && amount > 0
          ? amount
          : 20000;
      setSelectedAmount(initialAmount);
      if (isCoffeeUnlock && appSlug) {
        createOrder(initialAmount);
      } else {
        setOrderStatus("idle");
        setOrderId(null);
        setDynamicTransferCode(null);
        setOrderError(null);
      }
    } else {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
    return () => {
      if (autoCloseRef.current) {
        clearTimeout(autoCloseRef.current);
        autoCloseRef.current = null;
      }
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isOpen, isCoffeeUnlock, appSlug, amount, minAmount, createOrder]);

  // Poll SePay-verified order status every 2.5 seconds while pending
  useEffect(() => {
    if (!isOpen || !isCoffeeUnlock || orderStatus !== "pending" || !orderId) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/coffee/status/${encodeURIComponent(orderId)}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "paid") {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          setOrderStatus("paid");
          triggerDownloadAndUnlock(orderId);
        } else if (data.status === "expired") {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          setOrderStatus("expired");
        }
      } catch {
        // Ignore transient network errors during polling
      }
    };

    pollRef.current = setInterval(checkStatus, 2500);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isOpen, isCoffeeUnlock, orderStatus, orderId, triggerDownloadAndUnlock]);

  // Update dynamic VietQR for general donate mode (non-coffee-unlock)
  useEffect(() => {
    if (isCoffeeUnlock) return;
    if (selectedAmount > 0) {
      setQrSrc(
        `https://img.vietqr.io/image/seabank-666006668789-compact2.png?amount=${selectedAmount}&addInfo=${encodeURIComponent(
          transferCode
        )}&accountName=TRAN%20NGOC%20HOANG%20ANH`
      );
    } else {
      setQrSrc("/images/donate-qr.jpg");
    }
  }, [isCoffeeUnlock, selectedAmount, transferCode]);

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
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
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

  const downloadHref =
    appSlug && orderId
      ? `/api/apps/${appSlug}/download?orderId=${encodeURIComponent(orderId)}`
      : "#";

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
                ? `☕ Mở khóa Bản Offline Trọn Đời · ${selectedAmount.toLocaleString("vi-VN")}đ`
                : "Tiếp lửa cho AI Mở Studio"}
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
            {isCoffeeUnlock
              ? "Thanh toán để tải bản Offline"
              : "Mời team 1 ly cà phê nhé! ☕"}
          </h3>

          <p className="text-xs text-neutral-600 leading-relaxed max-w-sm mx-auto">
            {isCoffeeUnlock ? (
              <>
                Bạn luôn được dùng trực tiếp trên web hoàn toàn miễn phí. Để tải file{" "}
                <strong className="text-neutral-900 font-bold">
                  &ldquo;{appTitle || "ứng dụng"}&rdquo;
                </strong>{" "}
                (.html) về máy dùng offline vĩnh viễn không cần mạng, vui lòng thanh toán{" "}
                {selectedAmount.toLocaleString("vi-VN")}đ qua mã VietQR bên dưới.
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
            {isCoffeeUnlock ? `Mức thanh toán (từ ${minAmountShortLabel}):` : "Chọn mức cà phê tiếp sức:"}
          </label>
          <div
            className={`grid gap-2 ${
              visiblePresets.length === 1
                ? "grid-cols-1"
                : visiblePresets.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-3"
            }`}
          >
            {visiblePresets.map((item) => {
              const isSelected = selectedAmount === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    if (isCoffeeUnlock && orderStatus === "paid") return;
                    setSelectedAmount(item.value);
                    if (isCoffeeUnlock && appSlug) {
                      createOrder(item.value);
                    }
                  }}
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
          <div className="relative w-48 h-48 bg-white p-2 rounded-xl shadow-xs border border-neutral-200/80 flex items-center justify-center">
            {isCoffeeUnlock && orderStatus === "creating" ? (
              <div className="flex flex-col items-center gap-2 text-neutral-500">
                <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
                <span className="text-[11px] font-semibold">Đang tạo mã VietQR...</span>
              </div>
            ) : isCoffeeUnlock && orderStatus === "error" ? (
              <div className="flex flex-col items-center gap-2 px-3 text-center">
                <span className="text-xs font-bold text-rose-600">{orderError || "Lỗi tạo mã"}</span>
                <button
                  type="button"
                  onClick={() => createOrder(selectedAmount)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Thử lại
                </button>
              </div>
            ) : isCoffeeUnlock && qrFailed ? (
              <span className="text-xs font-semibold text-rose-600">
                Không tải được QR. Vui lòng dùng thông tin chuyển khoản bên dưới.
              </span>
            ) : (
              <>
                <img
                  src={qrSrc}
                  alt={isCoffeeUnlock ? "Mã VietQR BIDV để tải app" : "Mã VietQR ủng hộ SeABank"}
                  className={`w-full h-full object-contain rounded-lg transition-opacity ${
                    isCoffeeUnlock && orderStatus === "expired" ? "opacity-25" : ""
                  }`}
                  onError={() => {
                    if (isCoffeeUnlock) setQrFailed(true);
                    else setQrSrc("/images/donate-qr.jpg");
                  }}
                />
                {isCoffeeUnlock && orderStatus === "expired" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 rounded-xl p-3">
                    <span className="text-xs font-bold text-neutral-800 mb-2">
                      Mã QR đã hết hạn (30 phút)
                    </span>
                    <button
                      type="button"
                      onClick={() => createOrder(selectedAmount)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Tạo mã QR mới
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          {(!isCoffeeUnlock || orderStatus === "pending" || orderStatus === "paid") && <span className="mt-2 text-[11px] text-neutral-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
            <span>
              Mở App ngân hàng hoặc MoMo quét mã ({selectedAmount.toLocaleString("vi-VN")}đ ·{" "}
              <strong className="text-neutral-700 font-mono">{transferCode}</strong>)
            </span>
          </span>}
        </div>

        {/* Coffee-Unlock Auto-Verification Status (100% Automatic via SePay Webhook) */}
        {isCoffeeUnlock && appSlug && (
          <div className="mt-4 space-y-2.5">
            {orderStatus === "paid" ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2 animate-in fade-in duration-200">
                <p className="text-xs sm:text-sm font-extrabold text-emerald-800 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>🎉 Đã nhận thanh toán! File Offline đang tự động tải về...</span>
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
            ) : orderStatus === "pending" ? (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/90 text-center space-y-1">
                <p className="text-xs font-bold text-amber-900 flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 shrink-0" />
                  <span>Đang chờ quét mã VietQR — Tự động tải sau ~3 giây khi tiền vào</span>
                </p>
                <p className="text-[11px] text-amber-700">
                  Vui lòng giữ nguyên nội dung chuyển khoản{" "}
                  <strong className="font-mono">{transferCode}</strong> để hệ thống tự động mở khóa.
                </p>
              </div>
            ) : null}
          </div>
        )}

        {/* Account Details with Copy Buttons */}
        {showPaymentDetails && <div className="mt-4 space-y-2 text-xs">
          {isCoffeeUnlock && dynamicTransferCode && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
              <div>
                <span className="text-[10px] text-amber-700 uppercase block font-semibold">
                  Nội dung chuyển khoản (Bắt buộc)
                </span>
                <span className="font-mono font-black text-sm text-amber-900">
                  {dynamicTransferCode}
                </span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(dynamicTransferCode, "code")}
                className="px-2.5 py-1 text-[11px] font-semibold text-amber-900 bg-amber-200/70 hover:bg-amber-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copiedField === "code" ? (
                  <Check className="w-3 h-3 text-emerald-700" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copiedField === "code" ? "Đã chép" : "Sao chép mã"}</span>
              </button>
            </div>
          )}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-neutral-200">
            <div>
              <span className="text-[10px] text-neutral-400 uppercase block font-semibold">
                Ngân hàng
              </span>
              <span className="font-bold text-neutral-800">
                {isCoffeeUnlock ? PAID_APP_ACCOUNT.bank : "SeABank (Đông Nam Á)"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(isCoffeeUnlock ? PAID_APP_ACCOUNT.bank : "SeABank", "bank")}
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
              <span className="font-mono font-bold text-sm text-[#155EEF]">
                {isCoffeeUnlock ? PAID_APP_ACCOUNT.accountNumber : "666006668789"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(isCoffeeUnlock ? PAID_APP_ACCOUNT.accountNumber : "666006668789", "stk")}
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
        </div>}

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
