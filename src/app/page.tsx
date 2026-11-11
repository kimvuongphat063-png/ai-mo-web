import Link from "next/link";
import Image from "next/image";
import {
  Clapperboard,
  ArrowRight,
  Calculator,
  Tag,
  Check,
  Copy,
  Sparkles,
  Smartphone,
  BookOpen,
  HelpCircle,
  ChevronDown,
} from "lucide-react";

export default function Home() {
  return (
    <main id="main-content" className="bg-[#FAFBFD] text-[#101828] space-y-16 sm:space-y-20 pb-20">
      {/* ─── 1. HERO SECTION (SPLIT COBALT & LIGHT BLUE) ─── */}
      <section className="container max-w-[1360px] mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="rounded-3xl overflow-hidden border border-[#E4E7EC] shadow-sm grid grid-cols-1 lg:grid-cols-12 min-h-[480px]">
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
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-neutral-100 font-bold text-sm shadow-sm transition-all whitespace-nowrap"
                  style={{ color: "#155EEF" }}
                >
                  <span style={{ color: "#155EEF" }}>
                    Dùng thử công cụ miễn phí
                  </span>
                  <ArrowRight className="w-4 h-4" style={{ color: "#155EEF", stroke: "#155EEF" }} />
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

          {/* CỘT PHẢI: NỀN XANH NHẠT (#EAF2FF) VỚI DEMO PROMPTKICHBAN CHI TIẾT */}
          <div className="lg:col-span-7 bg-[#EAF2FF] p-4 sm:p-6 lg:p-7 flex items-center justify-center relative overflow-hidden">
            {/* Background decorative glow */}
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-blue-200/40 rounded-full blur-2xl pointer-events-none" />

            {/* White Mockup Card */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-white/90 w-full max-w-2xl space-y-3.5 relative z-10">
              {/* Header của Demo Card */}
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#155EEF] text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Clapperboard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#101828]">PromptKichBan</h3>
                    <p className="text-[11px] text-neutral-500 line-clamp-1">
                      Tạo kịch bản, storyboard và prompt video từ ý tưởng, mô tả sản phẩm
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D]">
                    Miễn phí
                  </span>
                  <div className="w-6 h-6 rounded-full border border-neutral-200 text-neutral-400 flex items-center justify-center text-xs hover:bg-neutral-50 cursor-pointer">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* 3 Cột: Nhập thông tin video → Kịch bản & storyboard → Prompt video */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                {/* CỘT 1: Nhập thông tin video */}
                <div className="md:col-span-4 bg-neutral-50/70 rounded-xl p-3 border border-neutral-100 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#155EEF]">
                    <span className="w-4 h-4 rounded-full bg-[#155EEF] text-white text-[10px] flex items-center justify-center font-bold">
                      1
                    </span>
                    <span>Nhập thông tin video</span>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-neutral-700">
                      Mô tả video / Sản phẩm <span className="text-red-500">*</span>
                    </label>
                    <div className="bg-white rounded-lg border border-neutral-200 p-2 text-[10.5px] text-neutral-800 leading-snug">
                      <p>
                        Video giới thiệu tai nghe không dây AI MỞ Pro: thiết kế hiện đại, chống ồn, pin lâu đến 40 giờ, phù hợp làm việc và giải trí.
                      </p>
                      <span className="block text-right text-[9px] text-neutral-400 mt-1 font-mono">
                        116 / 500
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-neutral-700">
                      Thời lượng mong muốn
                    </label>
                    <div className="bg-white rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[11px] text-neutral-800 flex items-center justify-between">
                      <span>Khoảng 30 giây</span>
                      <ChevronDown className="w-3 h-3 text-neutral-400" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-neutral-700">
                      Phong cách video
                    </label>
                    <div className="bg-white rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[11px] text-neutral-800 flex items-center justify-between">
                      <span>Cinematic sản phẩm</span>
                      <ChevronDown className="w-3 h-3 text-neutral-400" />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-full mt-1 py-2 px-3 rounded-lg bg-[#155EEF] hover:bg-[#124bbf] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tạo kịch bản & prompt</span>
                  </button>
                </div>

                {/* CỘT 2: Kịch bản & storyboard */}
                <div className="md:col-span-5 bg-neutral-50/70 rounded-xl p-3 border border-neutral-100 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#155EEF]">
                    <span className="w-4 h-4 rounded-full bg-[#155EEF] text-white text-[10px] flex items-center justify-center font-bold">
                      2
                    </span>
                    <span>
                      Kịch bản & storyboard{" "}
                      <span className="text-[10px] font-normal text-neutral-500">
                        (3 cảnh – 30s)
                      </span>
                    </span>
                  </div>

                  <div className="space-y-2">
                    {/* Cảnh 1 */}
                    <div className="flex items-start gap-2 bg-white rounded-lg p-1.5 border border-neutral-200 shadow-2xs">
                      <div className="w-14 h-12 relative rounded-md overflow-hidden shrink-0 bg-neutral-100">
                        <Image
                          src="/images/headphones-main.jpg"
                          alt="Giới thiệu sản phẩm"
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                        <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[8px] font-bold px-1 rounded">
                          0:00 - 0:08
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 font-bold text-[11px] text-neutral-900">
                          <span className="w-3.5 h-3.5 rounded bg-blue-100 text-[#155EEF] flex items-center justify-center text-[9px]">
                            1
                          </span>
                          <span className="truncate">Giới thiệu sản phẩm</span>
                        </div>
                        <p className="text-[10px] text-neutral-500 line-clamp-2 mt-0.5 leading-snug">
                          Cận cảnh tai nghe AI MỞ Pro, xoay nhẹ, hiện logo và tên sản phẩm.
                        </p>
                      </div>
                    </div>

                    {/* Cảnh 2 */}
                    <div className="flex items-start gap-2 bg-white rounded-lg p-1.5 border border-neutral-200 shadow-2xs">
                      <div className="w-14 h-12 relative rounded-md overflow-hidden shrink-0 bg-neutral-100">
                        <Image
                          src="/images/headphones-detail.jpg"
                          alt="Tính năng nổi bật"
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                        <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[8px] font-bold px-1 rounded">
                          0:08 - 0:20
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 font-bold text-[11px] text-neutral-900">
                          <span className="w-3.5 h-3.5 rounded bg-blue-100 text-[#155EEF] flex items-center justify-center text-[9px]">
                            2
                          </span>
                          <span className="truncate">Tính năng nổi bật</span>
                        </div>
                        <p className="text-[10px] text-neutral-500 line-clamp-2 mt-0.5 leading-snug">
                          Thể hiện chống ồn, âm thanh sống động và pin đến 40 giờ bằng biểu tượng rõ ràng.
                        </p>
                      </div>
                    </div>

                    {/* Cảnh 3 */}
                    <div className="flex items-start gap-2 bg-white rounded-lg p-1.5 border border-neutral-200 shadow-2xs">
                      <div className="w-14 h-12 relative rounded-md overflow-hidden shrink-0 bg-neutral-100">
                        <Image
                          src="/images/headphones-desk.jpg"
                          alt="Ứng dụng & kêu gọi"
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                        <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[8px] font-bold px-1 rounded">
                          0:20 - 0:30
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 font-bold text-[11px] text-neutral-900">
                          <span className="w-3.5 h-3.5 rounded bg-blue-100 text-[#155EEF] flex items-center justify-center text-[9px]">
                            3
                          </span>
                          <span className="truncate">Ứng dụng & kêu gọi</span>
                        </div>
                        <p className="text-[10px] text-neutral-500 line-clamp-2 mt-0.5 leading-snug">
                          Sử dụng trong làm việc và giải trí, hiện thông điệp &quot;AI MỞ Pro - Nghe tốt hơn&quot;.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CỘT 3: Prompt video */}
                <div className="md:col-span-3 bg-neutral-50/70 rounded-xl p-3 border border-neutral-100 space-y-2.5 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#155EEF] mb-2">
                      <span className="w-4 h-4 rounded-full bg-[#155EEF] text-white text-[10px] flex items-center justify-center font-bold">
                        3
                      </span>
                      <span>Prompt video</span>
                    </div>

                    <div className="bg-white rounded-lg border border-neutral-200 p-2 text-[10px] text-neutral-600 leading-relaxed font-mono">
                      Cinematic product video, wireless headphones AI MỞ Pro, modern and premium design, noise cancellation, long battery life up to 40 hours, showcase in 3 scenes: product reveal, key features, and dynamic lighting, 16:9, 4k.
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-full mt-2 py-2 px-2.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Sao chép prompt</span>
                  </button>
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
              className="group bg-white hover:bg-[#F8FAFF] border border-[#E4E7EC] hover:border-blue-200 rounded-2xl p-4 sm:p-5 flex items-center justify-center gap-3 transition-all shadow-2xs hover:shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-[#EAF2FF] text-[#155EEF] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Clapperboard className="w-5 h-5" />
              </div>
              <span className="font-bold text-[#101828] group-hover:text-[#155EEF] text-base transition-colors">
                Tạo prompt video →
              </span>
            </Link>

            {/* Nút 2: Dùng app miễn phí */}
            <Link
              href="/apps"
              className="group bg-white hover:bg-[#F8FAFF] border border-[#E4E7EC] hover:border-blue-200 rounded-2xl p-4 sm:p-5 flex items-center justify-center gap-3 transition-all shadow-2xs hover:shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-[#EAF2FF] text-[#155EEF] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="font-bold text-[#101828] group-hover:text-[#155EEF] text-base transition-colors">
                Dùng app miễn phí →
              </span>
            </Link>

            {/* Nút 3: Học AI thực hành */}
            <Link
              href="/guides"
              className="group bg-white hover:bg-[#F8FAFF] border border-[#E4E7EC] hover:border-blue-200 rounded-2xl p-4 sm:p-5 flex items-center justify-center gap-3 transition-all shadow-2xs hover:shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-[#EAF2FF] text-[#155EEF] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
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
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E4E7EC] p-6 sm:p-8 flex flex-col justify-between shadow-2xs space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D]">
                  Miễn phí
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                {/* Trái của card: Logo + Tiêu đề + Mô tả */}
                <div className="space-y-3 max-w-sm">
                  <div className="w-12 h-12 rounded-2xl bg-[#EAF2FF] text-[#155EEF] flex items-center justify-center shrink-0 shadow-xs border border-blue-100">
                    <Clapperboard className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-[#101828] tracking-tight">
                      PromptKichBan
                    </h2>
                    <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed mt-1">
                      Tạo kịch bản, storyboard và prompt video chỉ từ ý tưởng hoặc mô tả sản phẩm. Phù hợp để làm video marketing, giới thiệu sản phẩm, nội dung mạng xã hội.
                    </p>
                  </div>
                </div>

                {/* Phải của card: 4 Lợi ích checkmark */}
                <div className="space-y-2 text-xs text-neutral-700 font-medium sm:border-l sm:border-neutral-100 sm:pl-6 shrink-0">
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#155EEF] shrink-0 font-bold" />
                    Sinh kịch bản video hoàn chỉnh
                  </span>
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#155EEF] shrink-0 font-bold" />
                    Storyboard trực quan, có thời lượng
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
            <Link
              href="/apps/lai-that-tung-don"
              className="group bg-white rounded-2xl border border-[#E4E7EC] p-5 sm:p-6 hover:shadow-md hover:border-blue-200 transition-all flex items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EAF2FF] text-[#155EEF] flex items-center justify-center shrink-0">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#101828] group-hover:text-[#155EEF] transition-colors">
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
              </div>

              <div className="text-neutral-400 group-hover:text-[#155EEF] group-hover:translate-x-0.5 transition-all">
                <ArrowRight className="w-5 h-5" />
              </div>
            </Link>

            {/* Card 2: Định giá bán & khuyến mãi */}
            <Link
              href="/apps/gia-ban-khuyen-mai"
              className="group bg-white rounded-2xl border border-[#E4E7EC] p-5 sm:p-6 hover:shadow-md hover:border-blue-200 transition-all flex items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EAF2FF] text-[#155EEF] flex items-center justify-center shrink-0">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#101828] group-hover:text-[#155EEF] transition-colors">
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
              </div>

              <div className="text-neutral-400 group-hover:text-[#155EEF] group-hover:translate-x-0.5 transition-all">
                <ArrowRight className="w-5 h-5" />
              </div>
            </Link>
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
                alt="Cách viết prompt video hiệu quả để tạo video sản phẩm ấn tượng"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div className="p-4 sm:p-5 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#101828] group-hover:text-[#155EEF] transition-colors leading-snug">
                  Cách viết prompt video hiệu quả để tạo video sản phẩm ấn tượng
                </h3>
                <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                  Công thức prompt, ví dụ thực tế và các lưu ý để tạo video nhất quán, đúng ý.
                </p>
              </div>
              <p className="text-xs text-neutral-400 font-medium pt-2 border-t border-neutral-100">
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
                alt="Lộ trình học AI thực hành cho người mới (từ 0 đến làm được)"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div className="p-4 sm:p-5 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#101828] group-hover:text-[#155EEF] transition-colors leading-snug">
                  Lộ trình học AI thực hành cho người mới (từ 0 đến làm được)
                </h3>
                <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                  Từng bước học và ứng dụng AI vào công việc và kinh doanh, có gợi ý công cụ cụ thể.
                </p>
              </div>
              <p className="text-xs text-neutral-400 font-medium pt-2 border-t border-neutral-100">
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
                alt="5 ý tưởng nội dung video sản phẩm bạn có thể tạo ngay với AI"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div className="p-4 sm:p-5 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#101828] group-hover:text-[#155EEF] transition-colors leading-snug">
                  5 ý tưởng nội dung video sản phẩm bạn có thể tạo ngay với AI
                </h3>
                <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                  Các dạng video dễ làm, hiệu quả và phù hợp cho bán hàng online, có ví dụ minh họa.
                </p>
              </div>
              <p className="text-xs text-neutral-400 font-medium pt-2 border-t border-neutral-100">
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
