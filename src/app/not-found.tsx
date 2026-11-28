import Link from "next/link";
import { ArrowLeft, Compass, Layers, MessageSquare } from "lucide-react";

export default function NotFound() {
  return (
    <main id="main-content" className="max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
      <div className="rounded-3xl bg-[#101420] border border-white/10 p-8 sm:p-12 shadow-2xl space-y-6">
        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#d4ff00]/15 border border-[#d4ff00]/30 text-[#d4ff00] text-xs font-mono font-bold uppercase tracking-wider">
          Lỗi 404 · Không tìm thấy trang
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Trang bạn tìm không tồn tại hoặc đã chuyển chỗ
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
          Đường dẫn này có thể đã được cập nhật sang công cụ mới. Bạn có thể quay về Trang chủ hoặc mở nhanh Kho App miễn phí và Sản phẩm số của AI Mở Studio bên dưới.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#d4ff00] text-black font-extrabold text-sm hover:brightness-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về Trang chủ</span>
          </Link>
          <Link
            href="/apps"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all"
          >
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Kho 97 App Offline</span>
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all"
          >
            <Layers className="w-4 h-4 text-sky-400" />
            <span>Sản phẩm số</span>
          </Link>
          <Link
            href="/lien-he"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all"
          >
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span>Liên hệ hỗ trợ</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
