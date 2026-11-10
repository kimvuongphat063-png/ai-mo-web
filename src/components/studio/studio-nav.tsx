"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

export type StudioNavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

/**
 * Workspace navigation shared by the desktop sidebar and the mobile drawer.
 * Active item = exact match on /app, prefix match elsewhere.
 */
export function StudioNav({
  items,
  onNavigate,
}: {
  items: StudioNavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="space-y-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/app"
            ? pathname === "/app"
            : pathname?.startsWith(item.href) ?? false;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "flex items-center gap-2.5 rounded-md bg-accent-subtle px-2.5 py-2 text-sm font-medium text-accent"
                : "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-text-2 transition-colors hover:bg-surface-2 hover:text-text"
            }
          >
            <Icon className={active ? "h-4 w-4 text-accent" : "h-4 w-4 text-muted"} />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
