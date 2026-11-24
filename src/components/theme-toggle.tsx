"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("aimo-theme") as "dark" | "light" | null;
    if (saved) {
      setTheme(saved);
      applyTheme(saved);
    } else {
      applyTheme("dark");
    }
  }, []);

  const applyTheme = (t: "dark" | "light") => {
    const root = document.documentElement;
    const body = document.body;
    if (t === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
      body.classList.remove("dark-theme");
      body.classList.add("light-theme");
      root.style.setProperty("--paper", "#FAFBFD");
      root.style.setProperty("--ink", "#0F172A");
      root.setAttribute("data-theme", "light");
      body.setAttribute("data-theme", "light");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
      body.classList.remove("light-theme");
      body.classList.add("dark-theme");
      root.style.setProperty("--paper", "#090c14");
      root.style.setProperty("--ink", "#F8FAFC");
      root.setAttribute("data-theme", "dark");
      body.setAttribute("data-theme", "dark");
    }
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("aimo-theme", next);
    applyTheme(next);
  };

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
      title={theme === "dark" ? "Chế độ: Đang Tối (Bấm để đổi sang Sáng)" : "Chế độ: Đang Sáng (Bấm để đổi sang Tối)"}
      className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
        theme === "dark"
          ? "bg-white/8 hover:bg-white/15 text-slate-200 border-white/15 hover:border-[#d4ff00]/40"
          : "bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300 shadow-xs"
      }`}
    >
      {theme === "dark" ? (
        <>
          <Sun className="w-3.5 h-3.5 text-[#d4ff00] animate-spin-slow" />
          <span className="hidden md:inline text-[11px] font-mono text-[#d4ff00]">Tối</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden md:inline text-[11px] font-mono text-blue-700">Sáng</span>
        </>
      )}
    </button>
  );
}
