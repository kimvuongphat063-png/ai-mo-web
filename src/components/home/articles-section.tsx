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
    <section className="w-full max-w-[1240px] xl:max-w-[1400px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 2xl:px-8 pt-14 sm:pt-16" id="bai-viet">
      <div className="max-w-[640px] mb-7">
        <span className="inline-flex items-center gap-2 text-xs font-mono font-extrabold uppercase tracking-wider text-[#d4ff00] mb-3">
          <span className="w-2 h-2 rounded-full bg-[#d4ff00] animate-pulse"></span>
          Kiến thức AI
        </span>
        <h2 className="text-[clamp(24px,3vw,34px)] font-black tracking-tight leading-tight text-white mb-2">
          {content?.articlesTitle || "Bài viết kiến thức AI"}
        </h2>
        <p className="text-[15px] text-slate-400 m-0">
          {content?.articlesDesc || "Ảnh bìa là ảnh thật của đúng chủ đề bài viết — đọc tiêu đề, nhìn ảnh là biết bài nói về việc gì."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" id="articleGrid">
        {filtered.map((a) => (
          <article
            key={a.id}
            className="article bg-[#101420]/80 border border-white/10 rounded-[26px] overflow-hidden shadow-xl flex flex-col transition-all duration-200 hover:-translate-y-1 hover:border-[#d4ff00]/40 hover:shadow-[0_12px_35px_rgba(212,255,0,0.12)]"
            data-searchable={a.searchable}
          >
            <div className="relative">
              <CardImageEditor cardId={a.id} cardTitle={a.title} />
              <Image
                src={getImage(a.id, a.img)}
                alt={a.alt}
                width={400}
                height={180}
                className="w-full h-[160px] sm:h-[180px] object-cover opacity-90 hover:opacity-100 transition-opacity"
              />
            </div>
            <div className="p-5 flex flex-col gap-2 flex-1">
              <span className="text-xs font-mono font-bold text-[#d4ff00] flex items-center gap-2">
                {a.tag}
                <span className="w-[3px] h-[3px] rounded-full bg-slate-500" />
                <span className="text-slate-400 font-semibold">{a.time}</span>
              </span>
              <h3 className="text-[16.5px] font-bold text-white leading-snug m-0 flex-1">
                {a.title}
              </h3>
              <p className="text-[13.5px] text-slate-300 m-0">{a.desc}</p>
            </div>
          </article>
        ))}

        {q && filtered.length === 0 && (
          <p className="col-span-full text-center text-slate-400 py-7 border border-dashed border-white/10 rounded-[18px] bg-[#101420]/50 text-[14.5px]">
            Không có bài viết khớp với từ khóa này.
          </p>
        )}
      </div>
    </section>
  );
}
