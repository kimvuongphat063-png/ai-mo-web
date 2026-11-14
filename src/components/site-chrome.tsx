"use client";

import { usePathname } from "next/navigation";
import { Footer, Header } from "./site-shell";
import { DonateCoffeeWidget } from "./donate-coffee";
import { SearchProvider } from "./home-search-context";

/**
 * Renders the public marketing chrome (Header/Footer) for every route
 * EXCEPT the Studio workspace (/app/*), which ships its own shell.
 * See docs/UI-REDESIGN-PLAN.md §4.1.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStudio =
    pathname === "/app" ||
    pathname?.startsWith("/app/") ||
    pathname === "/promptkichban" ||
    pathname?.startsWith("/promptkichban/");

  if (isStudio) {
    return (
      <SearchProvider>
        {children}
        <DonateCoffeeWidget />
      </SearchProvider>
    );
  }

  return (
    <SearchProvider>
      <Header />
      {children}
      <Footer />
      <DonateCoffeeWidget />
    </SearchProvider>
  );
}
