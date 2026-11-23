import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./refinement.css";
import { CartProvider } from "@/components/cart-provider";
import { SiteChrome } from "@/components/site-chrome";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const sans = Inter({
  subsets: ["vietnamese", "latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.heyaimo.com"),
  title: {
    default: "AI MỞ — Học AI từ gốc, dùng được vào việc",
    template: "%s — AI MỞ",
  },
  description:
    "Hệ sinh thái AI tiếng Việt cho người mới: khóa học, công cụ và tài nguyên thực hành.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${sans.variable} ${mono.variable}`}>
      <body className="font-sans antialiased bg-[#090c14] text-slate-100 selection:bg-[#d4ff00]/20 selection:text-[#d4ff00]">
        <a className="skip-link" href="#main-content">
          Bỏ qua điều hướng
        </a>
        <CartProvider>
          <SiteChrome>{children}</SiteChrome>
        </CartProvider>
      </body>
    </html>
  );
}
