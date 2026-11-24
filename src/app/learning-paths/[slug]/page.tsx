import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, Sparkles, BookOpen, Clock, Target, ShieldCheck } from "lucide-react";

export default function Page() {
  const steps = [
    {
      num: "01",
      title: "Chặng 1 — Hiểu đúng để không phụ thuộc",
      desc: "Nhận diện khả năng, giới hạn, rủi ro bảo mật dữ liệu và viết prompt 5 lớp chuẩn chuyên gia. Tự tin kiểm soát AI thay vì bị phụ thuộc vào câu trả lời ngẫu nhiên.",
      output: "Bộ nguyên tắc ứng dụng AI & Template Prompt 5 lớp cho cá nhân.",
      tag: "Tuần 1 · Tư duy gốc",
    },
    {
      num: "02",
      title: "Chặng 2 — Xây dựng một Workflow thật",
      desc: "Chọn một bài toán thực tế đang tốn nhiều thời gian nhất của bạn (viết kịch bản, làm báo cáo, xử lý bảng tính) và huấn luyện AI làm trợ lý đắc lực đồng hành.",
      output: "Quy trình tự động hóa tác vụ thật kèm Checklist kiểm chứng độ chính xác.",
      tag: "Tuần 2 · Thực hành chuyên sâu",
    },
    {
      num: "03",
      title: "Chặng 3 — Đóng gói thành hệ thống vận hành",
      desc: "Chuẩn hóa thư viện prompt, tài liệu nội bộ và các ứng dụng offline độc lập để tái sử dụng mỗi ngày hoặc chuyển giao cho đội ngũ.",
      output: "Hệ thống số hóa công việc có thể tái sử dụng và chia sẻ.",
      tag: "Tuần 3 · Tự động hóa",
    },
  ];

  return (
    <main id="main-content" className="container py-10 sm:py-14 space-y-12 max-w-5xl mx-auto px-4 sm:px-6">
      {/* ── HERO BANNER ────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-[#101420]/90 backdrop-blur-2xl border border-[#f59e0b]/30 p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>LỘ TRÌNH 21 NGÀY · THỰC CHIẾN TỪ GỐC</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-[1.15]">
              Bắt đầu với AI,{" "}
              <span className="text-[#f59e0b] drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                không đi đường vòng.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              Mỗi tuần một năng lực cốt lõi, mỗi chặng một sản phẩm đầu ra dùng được ngay vào công việc. Bạn biết chính xác mình đang học gì và vì sao nó tạo ra kết quả.
            </p>

            <div className="flex flex-wrap gap-3 pt-2 text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                <Clock className="w-3.5 h-3.5 text-[#f59e0b]" />
                30–45 phút / ngày
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                Đầu ra sản phẩm thật
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00e5ff]" />
                Không cần biết lập trình
              </span>
            </div>
          </div>

          {/* Right: Mascot Gia Sư Host */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center relative">
            <div className="mb-3 px-3.5 py-1.5 rounded-2xl bg-[#090c14]/90 border border-[#f59e0b]/40 text-center shadow-lg backdrop-blur-md animate-fade-in max-w-[260px]">
              <p className="text-[11.5px] font-mono text-[#f59e0b] font-semibold leading-snug">
                🎓 "Cùng mình chinh phục AI trong 21 ngày thực chiến nhé!"
              </p>
            </div>
            <div className="relative w-full max-w-[200px] h-[190px] sm:h-[210px] flex items-end justify-center group">
              <div className="absolute bottom-2 w-36 h-8 rounded-[100%] border border-[#f59e0b]/50 bg-[#f59e0b]/20 blur-[2px] animate-pulse" />
              <Image
                src="/mascot/v2-fullbody-guides.png"
                alt="Linh vật Lộ trình AI"
                width={200}
                height={424}
                className="relative z-10 w-auto h-full max-h-[190px] sm:max-h-[210px] object-contain object-bottom drop-shadow-[0_15px_30px_rgba(0,0,0,0.95)]"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 CHẶNG TIẾN TRÌNH HỌC TẬP (STEPPED CARDS) ────────────────── */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] animate-ping" />
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Chi Tiết Lộ Trình 3 Chặng
          </h2>
        </div>

        <div className="space-y-5">
          {steps.map((s) => (
            <div
              key={s.num}
              className="p-6 sm:p-7 rounded-3xl bg-[#101420]/80 backdrop-blur-xl border border-white/10 hover:border-[#f59e0b]/40 transition-all duration-300 shadow-lg space-y-4 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/8 pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30 font-mono font-black flex items-center justify-center text-sm">
                    {s.num}
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white group-hover:text-[#f59e0b] transition-colors">
                    {s.title}
                  </h3>
                </div>
                <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10 w-fit">
                  {s.tag}
                </span>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                {s.desc}
              </p>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center gap-3 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><b>Sản phẩm đầu ra:</b> {s.output}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CAM KẾT & ACTION BOTTOM BAR ───────────────────────────────── */}
      <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#121624] to-[#181126] border border-white/15 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <h3 className="text-lg sm:text-xl font-black text-white">
            Sẵn sàng bắt đầu hành trình làm chủ AI?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
            Tham gia lộ trình ngay hôm nay để nhận trọn bộ tài liệu, mẫu prompt và công cụ thực hành độc quyền từ AI Mở Studio.
          </p>
        </div>

        <Link
          href="/courses/ai-thuc-chien-21-ngay"
          style={{ color: "#000000", fontWeight: 900 }}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#d4ff00] hover:bg-[#b8e000] !text-black font-black text-sm shadow-[0_0_25px_rgba(212,255,0,0.4)] hover:shadow-[0_0_35px_rgba(212,255,0,0.65)] hover:scale-105 transition-all whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span style={{ color: "#000000", fontWeight: 900 }}>Bắt đầu lộ trình ngay</span>
          <ArrowRight className="w-4 h-4 stroke-[3] !text-black" style={{ color: "#000000" }} />
        </Link>
      </section>
    </main>
  );
}
