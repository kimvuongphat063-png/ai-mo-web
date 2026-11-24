import type { Metadata } from "next";
import { SchulteGameRoom } from "./schulte-game-room";

export const metadata: Metadata = {
  title: "Vòng Số Schulte Focus — Luyện Não Đỉnh Cao & Tăng Tốc Đọc 300% | AI Mở Studio",
  description:
    "Thử thách 60 giây kích hoạt 100% não bộ với Bảng số Schulte Focus (Vòng Số). Mở rộng thị trường thị giác ngoại vi, triệt tiêu đọc thầm và tăng tốc độ đọc lên 300%. Chơi miễn phí trực tiếp trên web, không quảng cáo, không cần cài đặt.",
  keywords: [
    "schulte table",
    "bảng số schulte",
    "vòng số schulte",
    "luyện não",
    "tốc đọc",
    "speed reading",
    "tập trung sâu",
    "thị giác ngoại vi",
    "game trí tuệ",
    "ai mo studio",
  ],
  alternates: {
    canonical: "https://www.heyaimo.com/games/schulte",
  },
  openGraph: {
    title: "Vòng Số Schulte Focus — Luyện Não Đỉnh Cao & Tăng Tốc Đọc 300%",
    description:
      "Thử thách 60 giây kích hoạt 100% não bộ với Bảng số Schulte Focus độc quyền. Mở rộng thị trường thị giác ngoại vi và tăng tốc độ đọc 300%.",
    url: "https://www.heyaimo.com/games/schulte",
    siteName: "AI Mở Studio",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vòng Số Schulte Focus — Luyện Não Đỉnh Cao | AI Mở Studio",
    description:
      "Thử thách 60 giây kích hoạt não bộ và tăng tốc đọc 300% với Bảng số Schulte Focus.",
  },
};

export default function SchulteGamePage() {
  return (
    <main id="main-content" className="container py-8 sm:py-12 space-y-10 max-w-7xl mx-auto px-4 sm:px-6">
      <SchulteGameRoom />
    </main>
  );
}
