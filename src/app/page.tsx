import Link from "next/link";
import Image from "next/image";
import {
  Clapperboard,
  ArrowRight,
  Calculator,
  Tag,
  Check,
  CheckCircle2,
  Copy,
  Sparkles,
  Smartphone,
  BookOpen,
  HelpCircle,
  Percent,
} from "lucide-react";

export default function Home() {
  return (
    <main id="main-content" className="bg-[#FAFBFD] text-[#101828] space-y-16 sm:space-y-20 pb-20">
      {/* ─── 1. HERO SECTION (SPLIT COBALT & LIGHT BLUE) ─── */}
      <section className="container max-w-[1360px] mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="rounded-3xl overflow-hidden border border-[#E4E7EC] shadow-sm grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
          {/* CỘT TRÁI: NỀN XANH COBALT (#155EEF) */}
          <div className="lg:col-span-5 bg-[#155EEF] text-white p-7 sm:p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden">
            {/* Sparkle decorative background elements */}
            <div className="absolute top-4 right-8 text-white/20 select-none pointer-events-none hidden sm:block">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 0L27 18L45 21L29 27L27 45L21 29L3 27L19 21L24 0Z" fill="currentColor" />
              </svg>
            </div>

            <div className="space-y-5 relative z-10">
              {/* Nhãn nhỏ */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-white text-xs font-medium border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>AI Studio của AI Mở</span>
              </div>

              {/* Headline H1 */}
              <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-black tracking-tight text-white leading-[1.18]">
                Học AI bằng cách tạo ra{" "}
                <br />
                <span>thứ dùng được.</span>
              </h1>

              {/* Mô tả ngắn */}
              <p className="text-sm sm:text-base text-white/90 leading-relaxed max-w-md font-normal">
                Bộ công cụ AI thực tế, ứng dụng miễn phí và khóa học thực hành giúp bạn học AI nhanh, làm được ngay và tạo ra sản phẩm có giá trị sử dụng.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link
                  href="/promptkichban"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-neutral-100 !text-[#155EEF] font-bold text-sm shadow-sm transition-all whitespace-nowrap"
                  style={{ color: "#155EEF" }}
                >
                  <span className="!text-[#155EEF]" style={{ color: "#155EEF" }}>
                    Dùng thử công cụ miễn phí
                  </span>
                  <ArrowRight className="w-4 h-4 !text-[#155EEF]" style={{ color: "#155EEF" }} />
                </Link>
                <Link
                  href="/learning-paths/bat-dau-voi-ai"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-white/60 hover:bg-white/10 text-white font-semibold text-sm transition-all whitespace-nowrap"
                >
                  <span>Xem lộ trình học</span>
                </Link>
              </div>
            </div>

            {/* Dòng cam kết tin cậy */}
            <div className="pt-6 flex items-center gap-2 text-xs text-white/85 font-medium relative z-10">
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0 text-[10px] font-bold">
                ✓
              </span>
              <span>Công cụ thực hành · Hướng dẫn tiếng Việt</span>
            </div>
          </div>

          {/* CỘT PHẢI: NỀN XANH NHẠT (#EAF2FF) VỚI DEMO PROMPTKICHBAN 3 BƯỚC */}
          <div className="lg:col-span-7 bg-[#EAF2FF] p-5 sm:p-8 lg:p-10 flex items-center justify-center relative overflow-hidden">
            {/* Background decorative glow */}
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-blue-200/40 rounded-full blur-2xl pointer-events-none" />

            {/* White Mockup Card */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-md border border-white/90 w-full max-w-xl space-y-4 relative z-10">
              {/* Header của Demo Card */}
              <div className="flex items-start justify-between border-b border-neutral-100 pb-3 gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EAF2FF] text-[#155EEF] flex items-center justify-center shrink-0 shadow-2xs">
                    <Clapperboard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-[#101828]">PromptKichBan</h3>
                    <p className="text-[11px] sm:text-xs text-neutral-500">
                      Tạo kịch bản, storyboard và prompt video chỉ từ ý tưởng
                    </p>
                  </div>
                </div>

                {/* 3D Clapper Icon graphic */}
                <div className="relative shrink-0 hidden sm:block">
                  <div className="w-12 h-10 bg-gradient-to-tr from-[#155EEF] to-[#60A5FA] rounded-xl flex items-center justify-center shadow-md rotate-3 text-white">
                    <Clapperboard className="w-6 h-6 drop-shadow-sm" />
                  </div>
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 absolute -top-1 -right-1 animate-pulse" />
                </div>
              </div>

              {/* Hàng 3 bước hình viên thuốc (Pills) */}
              <div className="flex items-center justify-between gap-1 sm:gap-2 text-[10px] sm:text-xs font-semibold overflow-x-auto py-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#155EEF] text-white shrink-0 shadow-2xs">
                  <span className="w-3.5 h-3.5 rounded-full bg-white/20 text-white flex items-center justify-center text-[9px] font-bold">1</span>
                  <span>Nhập thông tin video</span>
                </div>
                <span className="text-neutral-400 shrink-0 font-bold">→</span>
                <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#155EEF] text-white shrink-0 shadow-2xs">
                  <span className="w-3.5 h-3.5 rounded-full bg-white/20 text-white flex items-center justify-center text-[9px] font-bold">2</span>
                  <span>Kịch bản & storyboard</span>
                </div>
                <span className="text-neutral-400 shrink-0 font-bold">→</span>
                <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#155EEF] text-white shrink-0 shadow-2xs">
                  <span className="w-3.5 h-3.5 rounded-full bg-white/20 text-white flex items-center justify-center text-[9px] font-bold">3</span>
                  <span>Prompt video</span>
                </div>
              </div>

              {/* 3 Khối mô phỏng luồng chuyển đổi */}
              <div className="grid grid-cols-1 sm:grid-cols-11 gap-2.5 items-center pt-1">
                {/* Khối 1: Ý tưởng video */}
                <div className="sm:col-span-3 bg-neutral-50 rounded-xl p-2.5 border border-neutral-200/80 space-y-1">
                  <span className="text-[10px] font-bold text-neutral-500 block">Ý tưởng video</span>
                  <div className="text-[11px] text-neutral-800 leading-snug font-medium min-h-[44px]">
                    Giới thiệu sản phẩm chăm sóc da <span className="inline-block w-0.5 h-3 bg-[#155EEF] animate-pulse"></span>
                  </div>
                </div>

                {/* Mũi tên 1 */}
                <div className="sm:col-span-1 hidden sm:flex justify-center text-neutral-400 font-bold">
                  →
                </div>

                {/* Khối 2: Storyboard (2 khung ảnh) */}
                <div className="sm:col-span-3 bg-neutral-50 rounded-xl p-2 border border-neutral-200/80 space-y-1.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="h-10 rounded-lg bg-blue-100/70 border border-blue-200/60 flex items-center justify-center text-blue-500">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="18" height="14" x="3" y="5" rx="2" />
                        <circle cx="8" cy="10" r="1.5" />
                        <path d="m21 15-5-5L5 21" />
                      </svg>
                    </div>
                    <div className="h-10 rounded-lg bg-blue-100/70 border border-blue-200/60 flex items-center justify-center text-blue-500">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="18" height="14" x="3" y="5" rx="2" />
                        <circle cx="8" cy="10" r="1.5" />
                        <path d="m21 15-5-5L5 21" />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 bg-neutral-200 rounded-full w-full" />
                    <div className="h-1.5 bg-neutral-200 rounded-full w-3/4" />
                  </div>
                </div>

                {/* Mũi tên 2 */}
                <div className="sm:col-span-1 hidden sm:flex justify-center text-neutral-400 font-bold">
                  →
                </div>

                {/* Khối 3: Prompt video */}
                <div className="sm:col-span-3 bg-neutral-50 rounded-xl p-2.5 border border-neutral-200/80 space-y-1.5">
                  <div className="flex items-center gap-1 text-[10px] text-blue-600 font-semibold">
                    <Sparkles className="w-3 h-3" />
                    <span>Prompt video</span>
                  </div>
                  <div className="space-y-1.5 pt-0.5">
                    <div className="h-2 bg-neutral-300 rounded-full w-full" />
                    <div className="h-2 bg-neutral-200 rounded-full w-5/6" />
                    <div className="h-2 bg-neutral-200 rounded-full w-4/6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. LỐI VÀO THEO NHU CẦU: "BẠN MUỐN LÀM GÌ HÔM NAY?" ─── */}
      <section className="container max-w-[1360px] mx-auto px-4 sm:px-6">
        <div className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black text-[#101828] text-center tracking-tight">
            Bạn muốn làm gì hôm nay?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {/* Nút 1: Tạo prompt video */}
            <Link
              href="/promptkichban"
              className="group bg-[#EAF2FF] hover:bg-[#dbe9fe] border border-blue-100 rounded-2xl p-4 sm:p-5 flex items-center justify-center gap-3 transition-all shadow-2xs"
            >
              <div className="w-10 h-10 rounded-xl bg-white text-[#155EEF] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Clapperboard className="w-5 h-5" />
              </div>
              <span className="font-bold text-[#101828] group-hover:text-[#155EEF] text-base transition-colors">
                Tạo prompt video →
              </span>
            </Link>

            {/* Nút 2: Dùng app miễn phí */}
            <Link
              href="/apps"
              className="group bg-[#EAF2FF] hover:bg-[#dbe9fe] border border-blue-100 rounded-2xl p-4 sm:p-5 flex items-center justify-center gap-3 transition-all shadow-2xs"
            >
              <div className="w-10 h-10 rounded-xl bg-white text-[#155EEF] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="font-bold text-[#101828] group-hover:text-[#155EEF] text-base transition-colors">
                Dùng app miễn phí →
              </span>
            </Link>

            {/* Nút 3: Học AI thực hành */}
            <Link
              href="/guides"
              className="group bg-[#EAF2FF] hover:bg-[#dbe9fe] border border-blue-100 rounded-2xl p-4 sm:p-5 flex items-center justify-center gap-3 transition-all shadow-2xs"
            >
              <div className="w-10 h-10 rounded-xl bg-white text-[#155EEF] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="font-bold text-[#101828] group-hover:text-[#155EEF] text-base transition-colors">
                Học AI thực hành →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 3. CÁC CÔNG CỤ NỔI BẬT ─── */}
      <section className="container max-w-[1360px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Card Lớn: PromptKichBan */}
          <div className="lg:col-span-7 bg-gradient-to-br from-[#EAF2FF] via-[#F4F8FF] to-white rounded-3xl border border-blue-100 p-6 sm:p-8 flex flex-col justify-between shadow-2xs space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D]">
                  Miễn phí
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white text-[#155EEF] flex items-center justify-center shrink-0 shadow-xs border border-blue-100">
                    <Clapperboard className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-[#101828] tracking-tight">
                      PromptKichBan
                    </h2>
                    <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed mt-1 max-w-md">
                      Tạo kịch bản, storyboard và prompt video chỉ từ ý tưởng hoặc mô tả sản phẩm. Phù hợp để làm video marketing, giới thiệu sản phẩm, nội dung mạng xã hội.
                    </p>
                  </div>
                </div>

                {/* 3D Clapper graphic badge */}
                <div className="relative shrink-0 hidden sm:block">
                  <div className="w-14 h-12 bg-gradient-to-tr from-[#155EEF] to-[#60A5FA] rounded-2xl flex items-center justify-center shadow-md rotate-6 text-white">
                    <Clapperboard className="w-7 h-7 drop-shadow-sm" />
                  </div>
                  <Sparkles className="w-4 h-4 text-blue-400 absolute -top-1 -right-1 animate-pulse" />
                </div>
              </div>

              {/* 4 Lợi ích checkmark */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-700 pt-2 border-t border-neutral-200/60 font-medium">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#155EEF] shrink-0 font-bold" />
                  Sinh kịch bản video hoàn chỉnh
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#155EEF] shrink-0 font-bold" />
                  Storyboard trực quan, có chất lượng
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#155EEF] shrink-0 font-bold" />
                  Prompt tối ưu cho AI tạo video
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#155EEF] shrink-0 font-bold" />
                  Dễ dùng, có ví dụ mẫu
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/promptkichban"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#155EEF] hover:bg-[#124bbf] text-white font-bold text-xs shadow-sm transition-all"
              >
                <span>Dùng ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/guides"
                className="inline-flex items-center px-4 py-2.5 rounded-xl border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 font-semibold text-xs transition-colors shadow-2xs"
              >
                Xem hướng dẫn
              </Link>
            </div>
          </div>

          {/* Cột Phải: 2 Card App Thực Dụng */}
          <div className="lg:col-span-5 flex flex-col gap-4 justify-between">
            {/* Card 1: Tính lãi thật từng đơn */}
            <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 sm:p-6 hover:shadow-md transition-all flex items-center justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EAF2FF] text-[#155EEF] flex items-center justify-center shrink-0">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#101828]">
                        Tính lãi thật từng đơn
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D]">
                        Sẵn dùng
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Tính lãi sau phí vận chuyển, phí sàn, chiết khấu.
                    </p>
                  </div>
                </div>

                <div>
                  <Link
                    href="/apps/lai-that-tung-don"
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg border border-neutral-200 text-xs font-semibold text-[#101828] hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
                  >
                    <span>Dùng ngay</span>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                  </Link>
                </div>
              </div>

              {/* 3D Calculator icon illustration */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-100 to-blue-50 border border-blue-200 flex flex-col items-center justify-center shrink-0 shadow-2xs">
                <Calculator className="w-8 h-8 text-[#155EEF]" />
              </div>
            </div>

            {/* Card 2: Định giá bán & khuyến mãi */}
            <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 sm:p-6 hover:shadow-md transition-all flex items-center justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EAF2FF] text-[#155EEF] flex items-center justify-center shrink-0">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#101828]">
                        Định giá bán & khuyến mãi
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D]">
                        Sẵn dùng
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Gợi ý giá bán tối ưu và xây dựng chương trình khuyến mãi.
                    </p>
                  </div>
                </div>

                <div>
                  <Link
                    href="/apps/gia-ban-khuyen-mai"
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg border border-neutral-200 text-xs font-semibold text-[#101828] hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
                  >
                    <span>Dùng ngay</span>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                  </Link>
                </div>
              </div>

              {/* 3D Discount Tag icon illustration */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-100 to-blue-50 border border-blue-200 flex flex-col items-center justify-center shrink-0 shadow-2xs relative">
                <Percent className="w-8 h-8 text-[#155EEF]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. SECTION: "BÀI VIẾT KIẾN THỨC AI" ─── */}
      <section className="container max-w-[1360px] mx-auto px-4 sm:px-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#101828]">
            Bài viết kiến thức AI
          </h2>
          <Link
            href="/guides"
            className="text-xs sm:text-sm font-bold text-neutral-600 hover:text-[#155EEF] flex items-center gap-1 transition-colors"
          >
            <span>Xem tất cả bài viết</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <Link
            href="/guides"
            className="group bg-white rounded-2xl border border-[#E4E7EC] overflow-hidden hover:shadow-md hover:border-neutral-300 transition-all flex flex-col"
          >
            <div className="relative w-full h-44 bg-neutral-100 overflow-hidden">
              <Image
                src="/images/laptop-video.jpg"
                alt="Cách viết prompt hiệu quả cho video AI"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div className="p-4 sm:p-5 space-y-2 flex-1 flex flex-col justify-between">
              <h3 className="text-sm sm:text-base font-bold text-[#101828] group-hover:text-[#155EEF] transition-colors leading-snug">
                Cách viết prompt hiệu quả cho video AI
              </h3>
              <p className="text-xs text-neutral-500 font-medium">
                Hướng dẫn · 5 phút đọc
              </p>
            </div>
          </Link>

          {/* Card 2 */}
          <Link
            href="/learning-paths/bat-dau-voi-ai"
            className="group bg-white rounded-2xl border border-[#E4E7EC] overflow-hidden hover:shadow-md hover:border-neutral-300 transition-all flex flex-col"
          >
            <div className="relative w-full h-44 bg-neutral-100 overflow-hidden">
              <Image
                src="/images/notebook-plan.jpg"
                alt="Lộ trình học AI thực hành cho người mới"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div className="p-4 sm:p-5 space-y-2 flex-1 flex flex-col justify-between">
              <h3 className="text-sm sm:text-base font-bold text-[#101828] group-hover:text-[#155EEF] transition-colors leading-snug">
                Lộ trình học AI thực hành cho người mới
              </h3>
              <p className="text-xs text-neutral-500 font-medium">
                Lộ trình · 7 phút đọc
              </p>
            </div>
          </Link>

          {/* Card 3 */}
          <Link
            href="/guides"
            className="group bg-white rounded-2xl border border-[#E4E7EC] overflow-hidden hover:shadow-md hover:border-neutral-300 transition-all flex flex-col"
          >
            <div className="relative w-full h-44 bg-neutral-100 overflow-hidden">
              <Image
                src="/images/headphones-desk.jpg"
                alt="Các công cụ AI miễn phí nên dùng hiện nay"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div className="p-4 sm:p-5 space-y-2 flex-1 flex flex-col justify-between">
              <h3 className="text-sm sm:text-base font-bold text-[#101828] group-hover:text-[#155EEF] transition-colors leading-snug">
                Các công cụ AI miễn phí nên dùng hiện nay
              </h3>
              <p className="text-xs text-neutral-500 font-medium">
                Gợi ý công cụ · 6 phút đọc
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* ─── 5. SECTION: "KHÁM PHÁ THÊM TRÊN AI MỞ" ─── */}
      <section className="container max-w-[1360px] mx-auto px-4 sm:px-6 pt-2">
        <div className="border-t border-[#E4E7EC] pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span className="font-extrabold text-base sm:text-lg text-[#101828] tracking-tight">
            Khám phá thêm trên AI Mở
          </span>

          <div className="flex items-center gap-6 text-xs sm:text-sm font-semibold">
            <Link
              href="/tools"
              className="text-[#155EEF] border-b-2 border-[#155EEF] pb-1 font-bold"
            >
              Công cụ AI
            </Link>
            <Link
              href="/apps"
              className="text-neutral-600 hover:text-[#101828] pb-1 transition-colors"
            >
              App miễn phí
            </Link>
            <Link
              href="/courses"
              className="text-neutral-600 hover:text-[#101828] pb-1 transition-colors"
            >
              Khóa học
            </Link>
            <Link
              href="/products"
              className="text-neutral-600 hover:text-[#101828] pb-1 transition-colors"
            >
              Sản phẩm số
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}