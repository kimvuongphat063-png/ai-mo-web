"use client";

import Link from "next/link";
import { Sparkles, BookOpen, Clock, Home } from "lucide-react";
import { AuthNav } from "@/components/auth-nav";

interface PromptKichBanHeaderProps {
  historyCount: number;
  onOpenHistory: () => void;
  onOpenGuide: () => void;
}

export function PromptKichBanHeader({
  historyCount,
  onOpenHistory,
  onOpenGuide,
}: PromptKichBanHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left: Brand & Title */}
        <div className="flex items-center gap-3">
          <Link
            href="/promptkichban"
            className="flex items-center gap-2 group text-text font-bold tracking-tight text-base"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white shadow-xs group-hover:scale-105 transition-transform">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-text leading-tight flex items-center gap-1.5">
                AI Mở
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-accent-subtle text-accent border border-accent/20">
                  Video Studio
                </span>
              </span>
              <span className="text-[11px] font-normal text-muted">
                Universal Video Prompt Studio
              </span>
            </div>
          </Link>

          {/* Separator */}
          <span className="hidden md:inline-block h-4 w-px bg-border mx-1" aria-hidden />

          {/* Links */}
          <nav className="hidden sm:flex items-center gap-1">
            <Link
              href="/promptkichban"
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-surface-2 text-text transition-colors"
            >
              PromptKichBan
            </Link>
            <button
              type="button"
              onClick={onOpenHistory}
              className="px-2.5 py-1 text-xs font-medium rounded-md text-text-2 hover:bg-surface-2 hover:text-text transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Clock className="h-3.5 w-3.5 text-muted" />
              <span>Thư viện</span>
              {historyCount > 0 && (
                <span className="h-4 min-w-4 px-1 rounded-full bg-accent/10 text-accent text-[10px] font-semibold flex items-center justify-center">
                  {historyCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={onOpenGuide}
              className="px-2.5 py-1 text-xs font-medium rounded-md text-text-2 hover:bg-surface-2 hover:text-text transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="h-3.5 w-3.5 text-muted" />
              <span>Hướng dẫn</span>
            </button>
          </nav>
        </div>

        {/* Right: Store link & AuthNav */}
        <div className="flex items-center gap-2">
          {/* Mobile buttons */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="sm:hidden p-1.5 rounded-md text-text-2 hover:bg-surface-2 transition-colors relative"
            title="Thư viện kịch bản"
            aria-label="Thư viện kịch bản"
          >
            <Clock className="h-4 w-4" />
            {historyCount > 0 && (
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center">
                {historyCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenGuide}
            className="sm:hidden p-1.5 rounded-md text-text-2 hover:bg-surface-2 transition-colors"
            title="Hướng dẫn sử dụng"
            aria-label="Hướng dẫn sử dụng"
          >
            <BookOpen className="h-4 w-4" />
          </button>

          <Link
            href="/"
            className="hidden md:inline-flex items-center gap-1 text-xs text-text-2 hover:text-text px-2.5 py-1 rounded-md hover:bg-surface-2 transition-colors"
          >
            <Home className="h-3.5 w-3.5 text-muted" />
            <span>Trang chủ</span>
          </Link>

          <div className="scale-90 origin-right">
            <AuthNav />
          </div>
        </div>
      </div>
    </header>
  );
}
