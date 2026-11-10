"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { StudioNav, type StudioNavItem } from "./studio-nav";
import { Tooltip } from "./ui";

/**
 * Mobile-only sticky top bar + slide-in drawer for the Studio workspace.
 * Hidden on lg+ where the fixed sidebar takes over.
 */
export function StudioTopBar({ items }: { items: StudioNavItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-surface px-4">
        <Tooltip label="Mở menu điều hướng">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            className="flex h-9 w-9 items-center justify-center rounded-md text-text-2 hover:bg-surface-2"
          >
            <Menu className="h-5 w-5" />
          </button>
        </Tooltip>
        <Link href="/app" className="text-sm font-semibold text-text">
          AI MỞ Studio
        </Link>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-border bg-surface shadow-lg">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <Link
                href="/app"
                onClick={() => setOpen(false)}
                className="text-sm font-semibold text-text"
              >
                AI MỞ Studio
              </Link>
              <Tooltip label="Đóng menu" side="bottom">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-text-2 hover:bg-surface-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </Tooltip>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <StudioNav items={items} onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
