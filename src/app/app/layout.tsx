import { requirePageRole } from "@/lib/auth";
import Link from "next/link";
import {
  LayoutDashboard,
  PackageSearch,
  FileText,
  CalendarDays,
  Palette,
  TrendingUp,
} from "lucide-react";
import { StudioNav } from "@/components/studio/studio-nav";
import { StudioTopBar } from "@/components/studio/studio-topbar";

const navigation = [
  { name: "Dashboard", href: "/app", icon: LayoutDashboard },
  { name: "Products", href: "/app/products", icon: PackageSearch },
  { name: "Scripts", href: "/app/scripts", icon: FileText },
  { name: "Campaigns", href: "/app/campaigns", icon: CalendarDays },
  { name: "Brand", href: "/app/brand", icon: Palette },
  { name: "Performance", href: "/app/performance", icon: TrendingUp },
];

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePageRole();

  return (
    <div className="min-h-screen bg-bg">
      {/* Mobile top bar + drawer */}
      <StudioTopBar items={navigation} />

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-60 flex-col border-r border-border bg-surface lg:flex">
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-border px-4">
          <Link href="/app" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-accent text-xs font-bold text-white">
              AI
            </div>
            <span className="text-sm font-semibold text-text">AI MỞ Studio</span>
          </Link>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto p-3">
          <StudioNav items={navigation} />
        </div>

        {/* User block + site link */}
        <div className="border-t border-border p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-xs font-medium text-text">
              {session.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text">{session.name}</p>
              <p className="truncate text-xs text-muted">{session.email}</p>
            </div>
          </div>
          <Link
            href="/"
            className="block text-xs text-muted transition-colors hover:text-text"
          >
            ← Back to AI MỞ
          </Link>
        </div>
      </aside>

      {/* Main content — offset by sidebar on desktop */}
      <main className="lg:pl-60">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
