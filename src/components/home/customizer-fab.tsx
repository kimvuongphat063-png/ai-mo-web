"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit3, RotateCcw, X, Check, Camera, ExternalLink } from "lucide-react";
import { useHomeImages } from "./home-images-context";

const ACCENTS = [
  { id: "goc", label: "Xanh dương gốc", bg: "linear-gradient(135deg,#0057ff,#7c4dff 55%,#00b8d9)" },
  { id: "tim", label: "Tím AI", bg: "linear-gradient(135deg,#7c3aed,#a855f7 55%,#6366f1)" },
  { id: "ngoc", label: "Ngọc lục", bg: "linear-gradient(135deg,#059669,#10b981 55%,#06b6d4)" },
  { id: "hoanghon", label: "Hoàng hôn", bg: "linear-gradient(135deg,#ea580c,#f59e0b 55%,#ef4444)" },
  { id: "hong", label: "Hồng", bg: "linear-gradient(135deg,#db2777,#ec4899 55%,#8b5cf6)" },
];

const TINTS = [
  { id: "xanh", label: "Xanh nhạt", hex: "#f4f7ff" },
  { id: "tim", label: "Tím nhạt", hex: "#f8f5ff" },
  { id: "mint", label: "Mint", hex: "#f0fdf9" },
  { id: "hong", label: "Hồng nhạt", hex: "#fff5f8" },
];

export function CustomizerFab() {
  const [open, setOpen] = useState(false);
  const [activeAccent, setActiveAccent] = useState("goc");
  const [activeTint, setActiveTint] = useState("xanh");
  const { isEditMode, toggleEditMode, resetImages } = useHomeImages();

  const applyAccent = (accId: string) => {
    setActiveAccent(accId);
    const root = document.documentElement;
    if (accId === "tim") {
      root.style.setProperty("--blue", "#7c3aed");
      root.style.setProperty("--violet", "#a855f7");
    } else if (accId === "ngoc") {
      root.style.setProperty("--blue", "#059669");
      root.style.setProperty("--violet", "#10b981");
    } else if (accId === "hoanghon") {
      root.style.setProperty("--blue", "#ea580c");
      root.style.setProperty("--violet", "#f59e0b");
    } else if (accId === "hong") {
      root.style.setProperty("--blue", "#db2777");
      root.style.setProperty("--violet", "#ec4899");
    } else {
      root.style.removeProperty("--blue");
      root.style.removeProperty("--violet");
    }
  };

  const applyTint = (tintId: string, hex: string) => {
    setActiveTint(tintId);
    const main = document.getElementById("main-content");
    if (main) {
      main.style.backgroundColor = hex;
    }
  };

  const handleReset = () => {
    setActiveAccent("goc");
    setActiveTint("xanh");
    const root = document.documentElement;
    root.style.removeProperty("--blue");
    root.style.removeProperty("--violet");
    const main = document.getElementById("main-content");
    if (main) {
      main.style.backgroundColor = "#f4f7ff";
    }
    resetImages();
  };

  return (
    <>
      {/* Floating FAB Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`fixed left-4 bottom-5 z-40 rounded-full px-4 py-2.5 text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-xl border border-white/20 transition-all ${
          open || isEditMode
            ? "bg-[#0057ff] text-white"
            : "bg-[#0c1526] text-white hover:bg-neutral-800"
        }`}
        aria-label="Mở bảng tuỳ chỉnh & quản trị ảnh"
      >
        <Edit3 className="w-4 h-4 text-[#7dd3fc]" />
        <span>{isEditMode ? "Đang Quản Trị Ảnh" : "Tuỳ chỉnh"}</span>
      </button>

      {/* Floating Customizer Drawer */}
      {open && (
        <aside
          className="fixed left-4 bottom-18 z-50 w-[min(350px,calc(100vw-32px))] max-h-[75vh] overflow-y-auto bg-white border border-[#dde6f8] rounded-3xl shadow-2xl p-5 text-[#0c1526] animate-fade-in"
          aria-label="Bảng tuỳ chỉnh giao diện và quản trị ảnh"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#dde6f8]">
            <div>
              <h3 className="text-base font-black m-0">Quản Trị &amp; Tuỳ Chỉnh</h3>
              <p className="text-[11px] text-[#68779a] mt-0.5">Thay ảnh card, đổi màu và nền trang</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Admin Image Toggle */}
          <div className="mt-4 p-3 bg-[#eef3ff] rounded-2xl border border-[#dde6f8]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#0c1526] flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#0057ff]" />
                Đổi ảnh trực quan
              </span>
              <button
                type="button"
                onClick={toggleEditMode}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isEditMode ? "bg-[#0057ff]" : "bg-neutral-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isEditMode ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            <p className="text-[11px] text-[#68779a] mt-1.5 leading-snug">
              Bật lên để hiện nút <b>&quot;Đổi ảnh&quot;</b> trực tiếp trên từng card của trang chủ.
            </p>

            <Link
              href="/admin-cards"
              target="_blank"
              className="mt-2.5 w-full py-1.5 px-3 rounded-xl bg-white hover:bg-neutral-50 text-xs font-bold text-[#0057ff] border border-[#dde6f8] flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
            >
              <span>Trang quản lý toàn bộ 19 ảnh</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Accent Color Swatches */}
          <div className="mt-4">
            <span className="text-xs font-bold text-[#3c4a68] block mb-2">Màu nhấn thương hiệu</span>
            <div className="flex items-center gap-2">
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  title={a.label}
                  onClick={() => applyAccent(a.id)}
                  style={{ background: a.bg }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                    activeAccent === a.id
                      ? "ring-2 ring-offset-2 ring-neutral-800 scale-110"
                      : "hover:scale-105"
                  }`}
                >
                  {activeAccent === a.id && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Background Tint */}
          <div className="mt-4">
            <span className="text-xs font-bold text-[#3c4a68] block mb-2">Tông màu nền trang</span>
            <div className="grid grid-cols-2 gap-2">
              {TINTS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTint(t.id, t.hex)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all text-left ${
                    activeTint === t.id
                      ? "bg-neutral-900 text-white border-neutral-900"
                      : "bg-white text-neutral-700 border-[#dde6f8] hover:border-neutral-400"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reset button */}
          <div className="mt-5 pt-3 border-t border-[#dde6f8] flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-neutral-900 py-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Đặt lại ban đầu
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-bold px-4 py-1.5 rounded-full bg-[#0057ff] text-white hover:bg-[#0043c7]"
            >
              Xong
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
