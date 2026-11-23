"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useHomeImages, CardImageEditor } from "./home-images-context";

const actions = [
  {
    id: "action-1",
    img: "/images/home/action-prompt-kich-ban.jpg",
    alt: "Chủ shop quay video giới thiệu sản phẩm bằng điện thoại qua đèn vòng",
    title: "Tạo prompt video",
    desc: "Từ một ý tưởng hoặc mô tả sản phẩm, nhận kịch bản, storyboard và prompt cho Veo 3, Grok, Seedance.",
    link: "/promptkichban",
    linkLabel: "Mở PromptKichBan",
  },
  {
    id: "action-2",
    img: "/images/home/action-apps-free.jpg",
    alt: "Điện thoại nằm ngang với các ô ứng dụng 3D đầy màu sắc bay lên trên nền trắng",
    title: "Dùng app miễn phí",
    desc: "95+ app HTML chạy ngay trên trình duyệt: kế toán, dòng tiền, sản xuất, tính lãi… không cần cài đặt, không cần tài khoản.",
    link: "/apps",
    linkLabel: "Xem kho app",
  },
  {
    id: "action-3",
    img: "/images/home/action-learning-path.jpg",
    alt: "Người học mỉm cười, ghi chép bên laptop khi học trực tuyến tại nhà",
    title: "Học AI thực hành",
    desc: "Lộ trình học theo dự án thật: mỗi bài học kết thúc bằng một sản phẩm bạn dùng hoặc bán được.",
    link: "/#lo-trinh",
    linkLabel: "Xem lộ trình",
  },
];

export function QuickActions() {
  const { getImage, content } = useHomeImages();

  return (
    <section className="w-full max-w-[1240px] xl:max-w-[1400px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 2xl:px-8 pt-14 sm:pt-16">
      <div className="max-w-[640px] mb-7">
        <span className="inline-flex items-center gap-2 text-xs font-mono font-extrabold uppercase tracking-wider text-[#d4ff00] mb-3">
          <span className="w-2 h-2 rounded-full bg-[#d4ff00] animate-pulse"></span>
          Bắt đầu trong 1 phút
        </span>
        <h2 className="text-[clamp(24px,3vw,34px)] font-black tracking-tight leading-tight text-white mb-2">
          {content?.quickActionsTitle || "Bạn muốn làm gì hôm nay?"}
        </h2>
        <p className="text-[15px] text-slate-400 m-0">
          {content?.quickActionsDesc || "Mỗi lựa chọn đều mở ra một công cụ dùng được ngay — kèm ảnh minh họa đúng việc bạn sắp làm."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {actions.map((a) => (
          <article
            key={a.id}
            className="group bg-[#101420]/80 border border-white/10 rounded-[26px] overflow-hidden shadow-xl flex flex-col transition-all duration-200 hover:-translate-y-1 hover:border-[#d4ff00]/40 hover:shadow-[0_12px_35px_rgba(212,255,0,0.12)]"
          >
            <div className="relative">
              <CardImageEditor cardId={a.id} cardTitle={a.title} />
              <Image
                src={getImage(a.id, a.img)}
                alt={a.alt}
                width={400}
                height={168}
                className="w-full h-[160px] sm:h-[168px] object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              />
            </div>
            <div className="p-5 flex flex-col gap-1.5 flex-1">
              <h3 className="text-[17.5px] font-extrabold text-white m-0">{a.title}</h3>
              <p className="text-sm text-slate-300 m-0 flex-1">{a.desc}</p>
              <Link
                href={a.link}
                className="mt-2.5 inline-flex items-center gap-2 text-[14px] font-bold text-[#d4ff00] min-h-[36px] group-hover:gap-3 transition-all"
              >
                {a.linkLabel}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
