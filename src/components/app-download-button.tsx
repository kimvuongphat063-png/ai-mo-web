"use client";

import { useState, useEffect } from "react";
import { Download, Lock, CheckCircle2 } from "lucide-react";
import { triggerCoffeePopup } from "./donate-coffee";

interface AppDownloadButtonProps {
  slug: string;
  title: string;
  fileName: string;
  fileSizeFormatted: string;
  coffeePrice?: number;
  isLoggedIn: boolean;
}

export function AppDownloadButton({
  slug,
  title,
  fileName,
  fileSizeFormatted,
  coffeePrice,
  isLoggedIn,
}: AppDownloadButtonProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const isCoffeeApp = Boolean(coffeePrice && coffeePrice > 0);

  useEffect(() => {
    if (!isCoffeeApp) return;

    const checkUnlocked = () => {
      try {
        setIsUnlocked(localStorage.getItem(`aimo_coffee_unlocked_${slug}`) === "1");
      } catch {}
    };

    checkUnlocked();

    const handleUnlockedEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ slug?: string }>;
      if (!customEvent.detail?.slug || customEvent.detail.slug === slug) {
        checkUnlocked();
      }
    };

    window.addEventListener("aimo-coffee-unlocked", handleUnlockedEvent);
    window.addEventListener("storage", checkUnlocked);

    // Auto-open VietQR 20k modal if redirected from /api/apps/[slug]/download without ?coffee=1
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("coffee") === "1") {
        triggerCoffeePopup({
          reason: "coffee-unlock",
          appSlug: slug,
          appTitle: title,
          amount: coffeePrice,
        });
        params.delete("coffee");
        const nextSearch = params.toString();
        const cleanUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
        window.history.replaceState({}, "", cleanUrl);
      }
    } catch {}

    return () => {
      window.removeEventListener("aimo-coffee-unlocked", handleUnlockedEvent);
      window.removeEventListener("storage", checkUnlocked);
    };
  }, [slug, title, coffeePrice, isCoffeeApp]);

  if (isCoffeeApp) {
    const formattedPrice = `${(coffeePrice || 20000).toLocaleString("vi-VN")}đ`;

    if (isUnlocked) {
      return (
        <a
          href={`/api/apps/${slug}/download?coffee=1`}
          download={fileName}
          data-skip-coffee-popup="true"
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 !text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/25 hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          title={`Tải lại file ${fileName} về máy`}
        >
          <CheckCircle2 className="w-4 h-4 !text-white shrink-0" />
          <span className="!text-white">✓ Đã mở khóa — Tải lại file (.html)</span>
          <span className="px-1.5 py-0.5 rounded-md bg-white/20 !text-white text-[10px] font-mono font-normal">
            {fileSizeFormatted}
          </span>
        </a>
      );
    }

    return (
      <button
        type="button"
        onClick={() =>
          triggerCoffeePopup({
            reason: "coffee-unlock",
            appSlug: slug,
            appTitle: title,
            amount: coffeePrice,
          })
        }
        className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-400 hover:from-amber-400 hover:via-amber-500 hover:to-yellow-500 !text-neutral-950 border border-amber-500/80 font-black text-xs sm:text-sm shadow-md shadow-amber-500/25 hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
        style={{ color: "#171717" }}
        title={`Mời ly cà phê ${formattedPrice} để tải bản Offline trọn đời`}
      >
        <span className="font-black" style={{ color: "#171717" }}>
          ☕ Tải bản Offline về máy · {formattedPrice}
        </span>
        <span
          className="px-1.5 py-0.5 rounded-md bg-black/10 text-[10px] font-mono font-bold"
          style={{ color: "#171717" }}
        >
          {fileSizeFormatted}
        </span>
      </button>
    );
  }

  const downloadUrl = isLoggedIn
    ? `/api/apps/${slug}/download`
    : `/login?next=${encodeURIComponent(`/apps/${slug}`)}`;

  if (isLoggedIn) {
    return (
      <a
        href={downloadUrl}
        download={fileName}
        className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 !text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/25 hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
        title={`Tải file ${fileName} về máy`}
      >
        <Download className="w-4 h-4 !text-white" />
        <span className="!text-white">Tải file về máy (.html)</span>
        <span className="px-1.5 py-0.5 rounded-md bg-white/20 !text-white text-[10px] font-mono font-normal">
          {fileSizeFormatted}
        </span>
      </a>
    );
  }

  return (
    <a
      href={downloadUrl}
      className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#155EEF] via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 !text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/25 hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
      title="Đăng nhập tài khoản miễn phí để tải file"
    >
      <Lock className="w-4 h-4 text-amber-300 shrink-0" />
      <span className="!text-white">Đăng nhập để tải file (.html)</span>
      <span className="px-1.5 py-0.5 rounded-md bg-white/20 !text-white text-[10px] font-semibold">
        Miễn phí
      </span>
    </a>
  );
}
