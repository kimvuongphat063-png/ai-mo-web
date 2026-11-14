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
    desc: "14+ app HTML chạy ngay trên trình duyệt: tính lãi, định giá, lập kế hoạch… không cần cài đặt, không cần tài khoản.",
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
  const { getImage } = useHomeImages();

  return (
    <section className="w-full max-w-[1240px] mx-auto px-4 sm:px-5 pt-14 sm:pt-16">
      <div className="max-w-[640px] mb-7">
        <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#0057ff] mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#7c4dff]" />
          Bắt đầu trong 1 phút
        </span>
        <h2 className="text-[clamp(24px,3vw,34px)] font-extrabold tracking-tight leading-tight text-[#0c1526] mb-2">
          Bạn muốn làm gì hôm nay?
        </h2>
        <p className="text-[15.5px] text-[#68779a] m-0">
          Mỗi lựa chọn đều mở ra một công cụ dùng được ngay — kèm ảnh minh họa đúng việc bạn sắp làm.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {actions.map((a) => (
          <article
            key={a.id}
            className="group bg-white border border-[#dde6f8] rounded-[26px] overflow-hidden shadow-[0_8px_24px_-12px_rgba(21,52,140,.18)] flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_44px_-18px_rgba(21,52,140,.22)]"
          >
            <div className="relative">
              <CardImageEditor cardId={a.id} cardTitle={a.title} />
              <Image
                src={getImage(a.id, a.img)}
                alt={a.alt}
                width={400}
                height={168}
                className="w-full h-[160px] sm:h-[168px] object-cover"
              />
            </div>
            <div className="p-5 flex flex-col gap-1.5 flex-1">
              <h3 className="text-[17.5px] font-extrabold text-[#0c1526] m-0">{a.title}</h3>
              <p className="text-sm text-[#68779a] m-0 flex-1">{a.desc}</p>
              <Link
                href={a.link}
                className="mt-2.5 inline-flex items-center gap-2 text-[14.5px] font-extrabold text-[#0057ff] min-h-[36px] group-hover:gap-3 transition-all"
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
