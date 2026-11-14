"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useHomeImages, CardImageEditor } from "./home-images-context";

const cards = [
  {
    id: "explore-1",
    img: "/images/home/article-serum-case-study.jpg",
    alt: "Người mẫu nhỏ giọt serum dưỡng da lên tay",
    title: "PromptKichBan Studio",
    desc: "Tạo kịch bản, storyboard và prompt video từ ý tưởng.",
    link: "/promptkichban",
    linkLabel: "Dùng thử",
  },
  {
    id: "explore-2",
    img: "/images/home/article-apps-offline.jpg",
    alt: "Nhiều điện thoại hiển thị biểu tượng ứng dụng đầy màu sắc",
    title: "14+ App HTML miễn phí",
    desc: "Kho ứng dụng nhỏ chạy ngay trên trình duyệt.",
    link: "/apps",
    linkLabel: "Mở kho app",
  },
  {
    id: "explore-3",
    img: "/images/home/explore-courses.jpg",
    alt: "Học viên học trực tuyến trên laptop và ghi chép trong quán cà phê",
    title: "Lộ trình học AI",
    desc: "Học theo dự án thật, có sản phẩm ở cuối mỗi chặng.",
    link: "/guides",
    linkLabel: "Xem lộ trình",
  },
  {
    id: "explore-4",
    img: "/images/home/explore-games.jpg",
    alt: "Minh họa game trình duyệt nhiều màu sắc quanh chiếc laptop",
    title: "Game web giải trí",
    desc: "Đang hoàn thiện — những game nhỏ làm bằng AI, chơi ngay trên web.",
    link: "/games",
    linkLabel: "Sắp ra mắt",
  },
];

export function ExploreMore() {
  const { getImage } = useHomeImages();

  return (
    <section className="w-full max-w-[1240px] mx-auto px-4 sm:px-5 pt-14 sm:pt-16 pb-4" id="kham-pha">
      <div className="max-w-[640px] mb-7">
        <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#0057ff] mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#7c4dff]" />
          Đi tiếp
        </span>
        <h2 className="text-[clamp(24px,3vw,34px)] font-extrabold tracking-tight leading-tight text-[#0c1526] mb-2">
          Khám phá thêm trên AI Mở
        </h2>
        <p className="text-[15.5px] text-[#68779a] m-0">
          Bốn lối đi rõ ràng thay cho khoảng trắng cũ: mỗi ô là một điểm đến cụ thể.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c) => (
          <div
            key={c.id}
            className="bg-white border border-[#dde6f8] rounded-[18px] overflow-hidden shadow-[0_8px_24px_-12px_rgba(21,52,140,.18)] flex flex-col"
          >
            <div className="relative">
              <CardImageEditor cardId={c.id} cardTitle={c.title} />
              <Image
                src={getImage(c.id, c.img)}
                alt={c.alt}
                width={320}
                height={128}
                className="w-full h-[120px] sm:h-[128px] object-cover"
              />
            </div>
            <div className="p-4 sm:p-5 flex flex-col flex-1">
              <h3 className="text-base font-extrabold text-[#0c1526] mb-1">{c.title}</h3>
              <p className="text-[13.5px] text-[#68779a] mb-3 m-0">{c.desc}</p>
              <Link
                href={c.link}
                className="mt-auto inline-flex items-center gap-1.5 text-sm font-extrabold text-[#0057ff] min-h-[36px] pt-2.5"
              >
                {c.linkLabel}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* CTA Band */}
      <div className="mt-16 rounded-[28px] bg-gradient-to-r from-[#eaf1ff] via-[#f0eaff] to-[#e2f8fd] border border-[#dde6f8] px-7 sm:px-10 py-9 flex flex-col sm:flex-row items-center gap-6 sm:gap-7">
        <div className="flex-1">
          <h2 className="text-[clamp(20px,2.6vw,28px)] font-extrabold tracking-tight text-[#0c1526] mb-1.5">
            Sẵn sàng tạo video đầu tiên bằng AI?
          </h2>
          <p className="text-[15px] text-[#3c4a68] max-w-[560px] m-0">
            Gõ một ý tưởng vào ô prompt ở đầu trang — 30 giây sau bạn có kịch bản, storyboard và prompt sẵn sàng cho Veo 3, Grok hoặc Seedance.
          </p>
        </div>
        <Link
          href="/#top"
          className="inline-flex items-center gap-2 bg-[#0057ff] hover:bg-[#0043c7] text-white px-6 py-3 rounded-full font-bold text-[14.5px] shadow-[0_12px_24px_-12px_rgba(0,87,255,.55)] transition-colors min-h-[48px] whitespace-nowrap shrink-0"
        >
          Thử PromptKichBan miễn phí
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
