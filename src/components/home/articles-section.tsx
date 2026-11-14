"use client";

import Image from "next/image";
import { Sparkles } from "lucide-react";
import { useSearch } from "../home-search-context";
import { useHomeImages, CardImageEditor } from "./home-images-context";

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

const articles = [
  {
    id: "article-1",
    img: "/images/home/path-step-2.jpg",
    alt: "Màn hình phần mềm dựng video với timeline nhiều lớp clip",
    tag: "Hướng dẫn",
    time: "5 phút đọc",
    title: "Viết prompt video AI sao cho ra đúng cảnh quay mình muốn",
    desc: "Cấu trúc 5 phần của một prompt video tốt: chủ thể, hành động, góc máy, ánh sáng và chuyển động camera.",
    searchable: "prompt video ai hướng dẫn veo seedance cảnh quay storyboard",
  },
  {
    id: "article-2",
    img: "/images/home/path-step-3.jpg",
    alt: "Học viên đeo tai nghe học trực tuyến và ghi chép vào sổ",
    tag: "Lộ trình",
    time: "7 phút đọc",
    title: "Người mới học AI: bắt đầu từ công cụ, đừng bắt đầu từ lý thuyết",
    desc: "Vì sao làm ra một sản phẩm nhỏ trong tuần đầu quan trọng hơn đọc mười bài giới thiệu về AI.",
    searchable: "lộ trình học ai người mới bắt đầu công cụ thực hành",
  },
  {
    id: "article-3",
    img: "/images/home/article-ai-chatbot.jpg",
    alt: "Người dùng trò chuyện với trợ lý AI trên điện thoại ngoài phố",
    tag: "Gợi ý công cụ",
    time: "6 phút đọc",
    title: "Dùng AI ngay trên điện thoại: 5 việc làm được trong hôm nay",
    desc: "Viết caption, lên ý tưởng video, tính giá bán… những việc AI xử lý tốt ngay trên chiếc điện thoại bạn đang cầm.",
    searchable: "ai trên điện thoại chatbot ứng dụng gợi ý công cụ di động",
  },
];

export function ArticlesSection() {
  const { query } = useSearch();
  const { getImage, content } = useHomeImages();
  const q = norm(query.trim());

  const filtered = articles.filter((a) => {
    if (!q) return true;
    return norm(a.searchable + " " + a.title + " " + a.desc).includes(q);
  });

  return (
    <section className="w-full max-w-[1240px] mx-auto px-4 sm:px-5 pt-14 sm:pt-16" id="bai-viet">
      <div className="max-w-[640px] mb-7">
        <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#0057ff] mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#7c4dff]" />
          Kiến thức AI
        </span>
        <h2 className="text-[clamp(24px,3vw,34px)] font-extrabold tracking-tight leading-tight text-[#0c1526] mb-2">
          {content?.articlesTitle || "Bài viết kiến thức AI"}
        </h2>
        <p className="text-[15.5px] text-[#68779a] m-0">
          {content?.articlesDesc || "Ảnh bìa là ảnh thật của đúng chủ đề bài viết — đọc tiêu đề, nhìn ảnh là biết bài nói về việc gì."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" id="articleGrid">
        {filtered.map((a) => (
          <article
            key={a.id}
            className="article bg-white border border-[#dde6f8] rounded-[26px] overflow-hidden shadow-[0_8px_24px_-12px_rgba(21,52,140,.18)] flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_44px_-18px_rgba(21,52,140,.22)]"
            data-searchable={a.searchable}
          >
            <div className="relative">
              <CardImageEditor cardId={a.id} cardTitle={a.title} />
              <Image
                src={getImage(a.id, a.img)}
                alt={a.alt}
                width={400}
                height={180}
                className="w-full h-[160px] sm:h-[180px] object-cover"
              />
            </div>
            <div className="p-5 flex flex-col gap-2 flex-1">
              <span className="text-xs font-bold text-[#0057ff] flex items-center gap-2">
                {a.tag}
                <span className="w-[3px] h-[3px] rounded-full bg-[#68779a]" />
                <span className="text-[#68779a] font-semibold">{a.time}</span>
              </span>
              <h3 className="text-[16.5px] font-extrabold text-[#0c1526] leading-snug m-0 flex-1">
                {a.title}
              </h3>
              <p className="text-[13.5px] text-[#68779a] m-0">{a.desc}</p>
            </div>
          </article>
        ))}

        {q && filtered.length === 0 && (
          <p className="col-span-full text-center text-[#68779a] py-7 border border-dashed border-[#dde6f8] rounded-[18px] bg-white text-[14.5px]">
            Không có bài viết khớp với từ khóa này.
          </p>
        )}
      </div>
    </section>
  );
}
