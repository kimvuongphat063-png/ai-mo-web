import type { Metadata } from "next";
import { Be_Vietnam_Pro, Lora } from "next/font/google";
import "./globals.css";
import "./refinement.css";
import { CartProvider } from "@/components/cart-provider";
import { SiteChrome } from "@/components/site-chrome";
const sans=Be_Vietnam_Pro({subsets:["vietnamese"],variable:"--font-sans",weight:["400","500","600","700","800"]});
const serif=Lora({subsets:["vietnamese"],variable:"--font-serif"});
export const metadata:Metadata={metadataBase:new URL("https://aimo.vn"),title:{default:"AI MỞ — Học AI từ gốc, dùng được vào việc",template:"%s — AI MỞ"},description:"Hệ sinh thái AI tiếng Việt cho người mới: khóa học, công cụ và tài nguyên thực hành."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi"><body className={`${sans.variable} ${serif.variable}`}><a className="skip-link" href="#main-content">Bỏ qua điều hướng</a><CartProvider><SiteChrome>{children}</SiteChrome></CartProvider></body></html>}
