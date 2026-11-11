import Link from "next/link";
import Image from "next/image";
import {
  Clapperboard,
  ArrowRight,
  Calculator,
  Tag,
  Check,
  Sparkles,
  Smartphone,
  BookOpen,
} from "lucide-react";
import { HomeHeroDemo } from "@/components/home-hero-demo";

export default function Home() {
  return (
    <main id="main-content" className="bg-[#FAFBFD] text-[#0F172A] space-y-16 sm:space-y-20 pb-20">
      {/* ─── 1. HERO SECTION (SPLIT COBALT & LIGHT BLUE) ─── */}
      <section className="container max-w-[1360px] mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm grid grid-cols-1 lg:grid-cols-12 min-h-[480px]">
          {/* CỘT TRÁI: NỀN XANH COBALT (#155EEF) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#155EEF] via-[#1050D8] to-[#0D44B8] text-white p-7 sm:p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden">
            {/* Sparkle decorative background elements & Glow */}
            <div className="absolute top-4 right-8 text-white/20 select-none pointer-events-none hidden sm:block">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 0L27 18L45 21L29 27L27 45L21 29L3 27L19 21L24 0Z" fill="currentColor" />
              </svg>
            </div>
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-blue-300/15 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-5 relative z-10">
              {/* Nhãn nhỏ */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold border border-white/20 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                <span>AI Studio của AI Mở</span>
              </div>

              {/* Headline H1 */}
              <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-black tracking-tight text-white leading-[1.18]">
                Học AI bằng cách tạo ra{" "}
                <br />
                <span className="bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
                  thứ dùng được.
                </span>
              </h1>

              {/* Mô tả ngắn */}
              <p className="text-sm sm:text-base text-white/90 leading-relaxed max-w-md font-normal">
                Bộ công cụ AI thực tế, ứng dụng miễn phí và khóa học thực hành giúp bạn học AI nhanh, làm được ngay và tạo ra sản phẩm có giá trị sử dụng.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link
                  href="/promptkichban"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-neutral-50 font-bold text-sm shadow-md hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] transition-all duration-300 transform hover:-translate-y-0.5 whitespace-nowrap cursor-pointer"
                  style={{ color: "#155EEF" }}
                >
                  <span style={{ color: "#155EEF" }}>
                    Dùng thử công cụ miễn phí
                  </span>
                  <ArrowRight className="w-4 h-4" style={{ color: "#155EEF", stroke: "#155EEF" }} />
                </Link>
                <Link
                  href="/learning-paths/bat-dau-voi-ai"
                  className="inline-flex items-center justify-center px-5 py-3.5 rounded-xl border border-white/40 hover:border-white hover:bg-white/10 text-white font-semibold text-sm transition-all duration-300 backdrop-blur-xs whitespace-nowrap"
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

          {/* CỘT PHẢI: NỀN XANH NHẠT (#EAF2FF) VỚI DEMO PROMPTKICHBAN TƯƠNG TÁC */}
          <div className="lg:col-span-7 bg-[#EAF2FF] p-4 sm:p-6 lg:p-7 flex items-center justify-center relative overflow-hidden">
            {/* Background decorative glow */}
            <div className="absolute -top-16 -right-16 w-72 h-72 bg-blue-300/40 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-cyan-200/40 rounded-full blur-3xl pointer-events-none" />

            <HomeHeroDemo />
          </div>
        </div>
      </section>

      {/* ─── 2. LỐI VÀO THEO NHU CẦU: "BẠN MUỐN LÀM GÌ HÔM NAY?" ─── */}
      <section className="container max-w-[1360px] mx-auto px-4 sm:px-6">
        <div className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] text-center tracking-tight">
            Bạn muốn làm gì hôm nay?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {/* Nút 1: Tạo prompt video */}
            <Link
              href="/promptkichban"
              className="group bg-white hover:bg-[#F8FAFF] border border-slate-200/80 hover:border-blue-300 rounded-2xl p-4 sm:p-5 flex items-center justify-center gap-3 transition-all duration-300 shadow-2xs hover:shadow-[0_8px_25px_rgba(21,94,239,0.08)] hover:-translate-y-0.5"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#155EEF] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 group-hover:bg-[#155EEF] group-hover:text-white transition-all duration-300">
                <Clapperboard className="w-5 h-5" />
              </div>
              <span className="font-bold text-[#0F172A] group-hover:text-[#155EEF] text-base transition-colors">
                Tạo prompt video →
              </span>
            </Link>

            {/* Nút 2: Dùng app miễn phí */}
            <Link
              href="/apps"
              className="group bg-white hover:bg-[#F8FAFF] border border-slate-200/80 hover:border-blue-300 rounded-2xl p-4 sm:p-5 flex items-center justify-center gap-3 transition-all duration-300 shadow-2xs hover:shadow-[0_8px_25px_rgba(21,94,239,0.08)] hover:-translate-y-0.5"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#155EEF] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 group-hover:bg-[#155EEF] group-hover:text-white transition-all duration-300">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="font-bold text-[#0F172A] group-hover:text-[#155EEF] text-base transition-colors">
                Dùng app miễn phí →
              </span>
            </Link>

            {/* Nút 3: Học AI thực hành */}
            <Link
              href="/guides"
              className="group bg-white hover:bg-[#F8FAFF] border border-slate-200/80 hover:border-blue-300 rounded-2xl p-4 sm:p-5 flex items-center justify-center gap-3 transition-all duration-300 shadow-2xs hover:shadow-[0_8px_25px_rgba(21,94,239,0.08)] hover:-translate-y-0.5"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#155EEF] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 group-hover:bg-[#155EEF] group-hover:text-white transition-all duration-300">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="font-bold text-[#0F172A] group-hover:text-[#155EEF] text-base transition-colors">
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
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 hover:border-blue-200 p-6 sm:p-8 flex flex-col justify-between shadow-2xs hover:shadow-[0_8px_30px_rgba(21,94,239,0.06)] transition-all duration-300 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Miễn phí
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                {/* Trái của card: Logo + Tiêu đề + Mô tả */}
                <div className="space-y-3 max-w-sm">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#155EEF] to-[#00A3FF] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Clapperboard className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-[#0F172A] tracking-tight">
                      PromptKichBan
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-1">
                      Tạo kịch bản, storyboard và prompt video chỉ từ ý tưởng hoặc mô tả sản phẩm. Phù hợp để làm video marketing, giới thiệu sản phẩm, nội dung mạng xã hội.
                    </p>
                  </div>
                </div>

                {/* Phải của card: 4 Lợi ích checkmark */}
                <div className="space-y-2.5 text-xs text-slate-700 font-medium sm:border-l sm:border-slate-100 sm:pl-6 shrink-0">
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
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#155EEF] to-[#0084FF] hover:from-[#124bbf] hover:to-[#0070d6] text-white font-bold text-xs shadow-sm hover:shadow-[0_0_15px_rgba(21,94,239,0.35)] transition-all duration-300"
              >
                <span>Dùng ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/guides"
                className="inline-flex items-center px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors shadow-2xs"
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
              className="group bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 hover:shadow-[0_8px_25px_rgba(21,94,239,0.07)] hover:border-blue-200 transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#155EEF] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#0F172A] group-hover:text-[#155EEF] transition-colors">
                        Tính lãi thật từng đơn
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Sẵn dùng
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tính lãi sau phí vận chuyển, phí sàn, chiết khấu.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-slate-400 group-hover:text-[#155EEF] group-hover:translate-x-1 transition-all">
                <ArrowRight className="w-5 h-5" />
              </div>
            </Link>

            {/* Card 2: Định giá bán & khuyến mãi */}
            <Link
              href="/apps/gia-ban-khuyen-mai"
              className="group bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 hover:shadow-[0_8px_25px_rgba(21,94,239,0.07)] hover:border-blue-200 transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#155EEF] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#0F172A] group-hover:text-[#155EEF] transition-colors">
                        Định giá bán & khuyến mãi
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Sẵn dùng
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Gợi ý giá bán tối ưu và xây dựng chương trình khuyến mãi.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-slate-400 group-hover:text-[#155EEF] group-hover:translate-x-1 transition-all">
                <ArrowRight className="w-5 h-5" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 4. SECTION: "BÀI VIẾT KIẾN THỨC AI" ─── */}
      <section className="container max-w-[1360px] mx-auto px-4 sm:px-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#0F172A]">
            Bài viết kiến thức AI
          </h2>
          <Link
            href="/guides"
            className="text-xs sm:text-sm font-bold text-slate-600 hover:text-[#155EEF] flex items-center gap-1 transition-colors"
          >
            <span>Xem tất cả bài viết</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <Link
            href="/guides"
            className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-[0_8px_25px_rgba(21,94,239,0.08)] hover:border-blue-200 transition-all duration-300 hover:-translate-y-1 flex flex-col"
          >
            <div className="relative w-full h-44 bg-slate-100 overflow-hidden">
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
                <h3 className="text-sm sm:text-base font-bold text-[#0F172A] group-hover:text-[#155EEF] transition-colors leading-snug">
                  Cách viết prompt video hiệu quả để tạo video sản phẩm ấn tượng
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  Công thức prompt, ví dụ thực tế và các lưu ý để tạo video nhất quán, đúng ý.
                </p>
              </div>
              <p className="text-xs text-slate-400 font-medium pt-2 border-t border-slate-100">
                Hướng dẫn · 5 phút đọc
              </p>
            </div>
          </Link>

          {/* Card 2 */}
          <Link
            href="/learning-paths/bat-dau-voi-ai"
            className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-[0_8px_25px_rgba(21,94,239,0.08)] hover:border-blue-200 transition-all duration-300 hover:-translate-y-1 flex flex-col"
          >
            <div className="relative w-full h-44 bg-slate-100 overflow-hidden">
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
                <h3 className="text-sm sm:text-base font-bold text-[#0F172A] group-hover:text-[#155EEF] transition-colors leading-snug">
                  Lộ trình học AI thực hành cho người mới (từ 0 đến làm được)
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  Từng bước học và ứng dụng AI vào công việc và kinh doanh, có gợi ý công cụ cụ thể.
                </p>
              </div>
              <p className="text-xs text-slate-400 font-medium pt-2 border-t border-slate-100">
                Lộ trình · 7 phút đọc
              </p>
            </div>
          </Link>

          {/* Card 3 */}
          <Link
            href="/guides"
            className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-[0_8px_25px_rgba(21,94,239,0.08)] hover:border-blue-200 transition-all duration-300 hover:-translate-y-1 flex flex-col"
          >
            <div className="relative w-full h-44 bg-slate-100 overflow-hidden">
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
                <h3 className="text-sm sm:text-base font-bold text-[#0F172A] group-hover:text-[#155EEF] transition-colors leading-snug">
                  5 ý tưởng nội dung video sản phẩm bạn có thể tạo ngay với AI
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  Các dạng video dễ làm, hiệu quả và phù hợp cho bán hàng online, có ví dụ minh họa.
                </p>
              </div>
              <p className="text-xs text-slate-400 font-medium pt-2 border-t border-slate-100">
                Gợi ý công cụ · 6 phút đọc
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* ─── 5. SECTION: "KHÁM PHÁ THÊM TRÊN AI MỞ" ─── */}
      <section className="container max-w-[1360px] mx-auto px-4 sm:px-6 pt-2">
        <div className="border-t border-slate-200/80 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span className="font-extrabold text-base sm:text-lg text-[#0F172A] tracking-tight">
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
              className="text-slate-600 hover:text-[#0F172A] pb-1 transition-colors"
            >
              App miễn phí
            </Link>
            <Link
              href="/courses"
              className="text-slate-600 hover:text-[#0F172A] pb-1 transition-colors"
            >
              Khóa học
            </Link>
            <Link
              href="/products"
              className="text-slate-600 hover:text-[#0F172A] pb-1 transition-colors"
            >
              Sản phẩm số
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
