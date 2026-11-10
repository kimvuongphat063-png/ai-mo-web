import Link from "next/link";
import { Gamepad2, Sparkles, ArrowLeft, Clock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Web Giải Trí — Sắp ra mắt",
  description: "Khu vực trò chơi web giải trí và rèn luyện tư duy AI trên AI Mở đang được tuyển chọn và hoàn thiện nội dung.",
};

export default function GamesPage() {
  return (
    <main id="main-content" className="container py-16 max-w-4xl">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
          <Clock className="w-3.5 h-3.5" />
          <span>Khu vực đang chuẩn bị nội dung</span>
        </div>

        <div className="w-16 h-16 mx-auto rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-lg">
          <Gamepad2 className="w-8 h-8" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">
          Game Web Giải Trí & Luyện Tư Duy
        </h1>

        <p className="text-base text-neutral-600 max-w-xl mx-auto leading-relaxed">
          Chúng tôi đang tuyển chọn và kiểm thử các mini game giải trí nhẹ nhàng, giúp rèn luyện phản xạ ngôn ngữ và tư duy logic cho người dùng. Mục này sẽ mở khi nội dung đạt chuẩn trải nghiệm tốt trên mobile và desktop.
        </p>

        <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200 text-left max-w-md mx-auto space-y-3">
          <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Trong lúc chờ đợi, bạn có thể:
          </h2>
          <ul className="text-xs text-neutral-600 space-y-2 list-disc pl-5">
            <li>
              Trải nghiệm app luyện kỹ năng:{" "}
              <Link href="/apps/luyen-go-10-ngon" className="text-blue-600 hover:underline font-medium">
                Luyện gõ phím 10 ngón
              </Link>
            </li>
            <li>
              Thử thách phản xạ từ vựng:{" "}
              <Link href="/apps/tu-vung-tieng-anh" className="text-blue-600 hover:underline font-medium">
                Luyện từ vựng tiếng Anh
              </Link>
            </li>
            <li>
              Tạo kịch bản video AI:{" "}
              <Link href="/promptkichban" className="text-blue-600 hover:underline font-medium">
                PromptKichBan Studio
              </Link>
            </li>
          </ul>
        </div>

        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    </main>
  );
}
