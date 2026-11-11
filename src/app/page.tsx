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
import {
  HeroCyberGrid,
  CurvedUnderline,
  Illustration3DClapperboard,
  Illustration3DCalculator,
  Illustration3DTag,
} from "@/components/ui/mockup-illustrations";

export default function Home() {
  return (
    <main id="main-content" className="bg-[#FAFBFD] text-[#0F172A] space-y-16 sm:space-y-20 pb-20 overflow-x-hidden">
      {/* ─── 1. HERO SECTION (PANORAMIC AI CANVAS WITH CYBER GRID) ─── */}
      <section className="container max-w-[1360px] mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="rounded-[32px] overflow-hidden border border-blue-200/70 shadow-xl grid grid-cols-1 lg:grid-cols-12 min-h-[500px] relative bg-gradient-to-r from-[#0C5CEB] via-[#008BFF] to-[#DCEBFF]">
          {/* Cybernetic 3D perspective grid across the bottom */}
          <HeroCyberGrid />

          {/* Glowing particle / ambient lights */}
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-cyan-400/25 rounded-full blur-3xl pointer-events-none z-0" />
          <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none z-0" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-purple-500/25 rounded-full blur-3xl pointer-events-none z-0" />

          {/* CỘT TRÁI: TEXT & CTA (5 COLS) */}
          <div className="lg:col-span-5 p-7 sm:p-10 lg:p-12 flex flex-col justify-between relative z-10 text-white">
            <div className="space-y-6">
              {/* Nhãn nhỏ AI Studio */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold border border-white/25 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                <span>AI Studio của AI Mở</span>
              </div>

              {/* Headline H1 with neon cyan curved underline */}
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-white leading-[1.18]">
                Học AI bằng cách tạo ra{" "}
                <br />
                <span className="relative inline-block">
                  thứ dùng được.
                  <CurvedUnderline />
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
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-neutral-50 font-bold text-sm shadow-lg hover:shadow-[0_0_25px_rgba(255,255,255,0.45)] transition-all duration-300 transform hover:-translate-y-0.5 whitespace-nowrap cursor-pointer"
                  style={{ color: "#155EEF" }}
                >
                  <span style={{ color: "#155EEF" }}>
                    Dùng thử công cụ miễn phí
                  </span>
                  <ArrowRight className="w-4 h-4" style={{ color: "#155EEF", stroke: "#155EEF" }} />
                </Link>
                <Link
                  href="/learning-paths/bat-dau-voi-ai"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border border-white/50 hover:border-white hover:bg-white/15 text-white font-semibold text-sm transition-all duration-300 backdrop-blur-xs whitespace-nowrap cursor-pointer"
                >
                  <span>Xem lộ trình học</span>
                </Link>
              </div>
            </div>

            {/* Dòng cam kết tin cậy */}
            <div className="pt-8 flex items-center gap-2 text-xs text-white/90 font-medium">
              <span className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center text-white shrink-0 text-[10px] font-bold">
                ✓
              </span>
              <span>Công cụ thực hành · Hướng dẫn tiếng Việt</span>
            </div>
          </div>

          {/* CỘT PHẢI: DEMO PROMPTKICHBAN GLASSMORPHIC (7 COLS) */}
          <div className="lg:col-span-7 p-4 sm:p-6 lg:p-8 flex items-center justify-center relative z-10">
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
              className="group bg-gradient-to-b from-[#F2F7FF] to-[#E8F1FF] hover:from-[#EDF4FF] hover:to-[#DFECFF] border border-[#D9E7FF] hover:border-blue-400 rounded-2xl p-4 sm:p-5 flex items-center justify-center gap-3.5 transition-all duration-300 shadow-2xs hover:shadow-[0_8px_25px_rgba(21,94,239,0.12)] hover:-translate-y-0.5"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center text-[#155EEF] shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Clapperboard className="w-5 h-5" />
              </div>
              <span className="font-bold text-[#0F172A] group-hover:text-[#155EEF] text-base transition-colors">
                Tạo prompt video →
              </span>
            </Link>

            {/* Nút 2: Dùng app miễn phí */}
            <Link
              href="/apps"
              className="group bg-gradient-to-b from-[#F2F7FF] to-[#E8F1FF] hover:from-[#EDF4FF] hover:to-[#DFECFF] border border-[#D9E7FF] hover:border-blue-400 rounded-2xl p-4 sm:p-5 flex items-center justify-center gap-3.5 transition-all duration-300 shadow-2xs hover:shadow-[0_8px_25px_rgba(21,94,239,0.12)] hover:-translate-y-0.5"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center text-[#155EEF] shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="font-bold text-[#0F172A] group-hover:text-[#155EEF] text-base transition-colors">
                Dùng app miễn phí →
              </span>
            </Link>

            {/* Nút 3: Học AI thực hành */}
            <Link
              href="/guides"
              className="group bg-gradient-to-b from-[#F2F7FF] to-[#E8F1FF] hover:from-[#EDF4FF] hover:to-[#DFECFF] border border-[#D9E7FF] hover:border-blue-400 rounded-2xl p-4 sm:p-5 flex items-center justify-center gap-3.5 transition-all duration-300 shadow-2xs hover:shadow-[0_8px_25px_rgba(21,94,239,0.12)] hover:-translate-y-0.5"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center text-[#155EEF] shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
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
          {/* Card Lớn: PromptKichBan (Cột Trái 7/12) */}
          <div className="lg:col-span-7 bg-gradient-to-br from-white via-[#F8FBFF] to-[#E4EFFF] rounded-3xl border border-[#DDE7F5] hover:border-blue-300 p-6 sm:p-8 flex flex-col justify-between shadow-2xs hover:shadow-[0_12px_35px_rgba(21,94,239,0.08)] transition-all duration-300 space-y-6 relative overflow-hidden">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Miễn phí
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                {/* Trái của card: Logo + Tiêu đề + Mô tả */}
                <div className="space-y-3 max-w-sm">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-blue-100 text-[#155EEF] flex items-center justify-center shrink-0 shadow-xs">
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

                {/* Phải của card: 3D Clapperboard Illustration */}
                <div className="shrink-0 self-center sm:self-start">
                  <Illustration3DClapperboard className="w-28 h-28 sm:w-36 sm:h-36" />
                </div>
              </div>

              {/* 4 Lợi ích checkmark */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 font-medium pt-2 border-t border-slate-200/60">
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

            <div className="flex flex-wrap items-center gap-3 pt-3">
              <Link
                href="/promptkichban"
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#155EEF] hover:bg-[#124bbf] text-white font-bold text-xs shadow-sm hover:shadow-[0_0_15px_rgba(21,94,239,0.35)] transition-all duration-300"
              >
                <span>Dùng ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/guides"
                className="inline-flex items-center px-5 py-2.5 rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors shadow-2xs"
              >
                Xem hướng dẫn
              </Link>
            </div>
          </div>

          {/* Cột Phải: 2 Card App Thực Dụng (Cột Phải 5/12) */}
          <div className="lg:col-span-5 flex flex-col gap-4 justify-between">
            {/* Card 1: Tính lãi thật từng đơn */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 hover:shadow-[0_8px_25px_rgba(21,94,239,0.08)] hover:border-blue-200 transition-all duration-300 flex items-center justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#155EEF] flex items-center justify-center shrink-0">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#0F172A]">
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

                <Link
                  href="/apps/lai-that-tung-don"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F172A] hover:text-[#155EEF] group transition-colors"
                >
                  <span>Dùng ngay</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#155EEF] group-hover:translate-x-0.5 transition-all" />
                </Link>
              </div>

              {/* 3D Calculator Illustration */}
              <div className="shrink-0">
                <Illustration3DCalculator className="w-18 h-18 sm:w-20 sm:h-20" />
              </div>
            </div>

            {/* Card 2: Định giá bán & khuyến mãi */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 hover:shadow-[0_8px_25px_rgba(21,94,239,0.08)] hover:border-blue-200 transition-all duration-300 flex items-center justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#155EEF] flex items-center justify-center shrink-0">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#0F172A]">
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

                <Link
                  href="/apps/gia-ban-khuyen-mai"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F172A] hover:text-[#155EEF] group transition-colors"
                >
                  <span>Dùng ngay</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#155EEF] group-hover:translate-x-0.5 transition-all" />
                </Link>
              </div>

              {/* 3D Tag Illustration */}
              <div className="shrink-0">
                <Illustration3DTag className="w-18 h-18 sm:w-20 sm:h-20" />
              </div>
            </div>
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
                alt="Cách viết prompt hiệu quả cho video AI"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div className="p-4 sm:p-5 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#0F172A] group-hover:text-[#155EEF] transition-colors leading-snug">
                  Cách viết prompt hiệu quả cho video AI
                </h3>
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
                alt="Lộ trình học AI thực hành cho người mới"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div className="p-4 sm:p-5 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#0F172A] group-hover:text-[#155EEF] transition-colors leading-snug">
                  Lộ trình học AI thực hành cho người mới
                </h3>
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
                alt="Các công cụ AI miễn phí nên dùng hiện nay"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div className="p-4 sm:p-5 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#0F172A] group-hover:text-[#155EEF] transition-colors leading-snug">
                  Các công cụ AI miễn phí nên dùng hiện nay
                </h3>
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
