"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { useSearch } from "../home-search-context";
import { useHomeImages, CardImageEditor } from "./home-images-context";

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

const tools = [
  {
    id: "bento-prompt",
    big: true,
    img: "/images/home/bento-prompt-studio.jpg",
    alt: "Chủ shop livestream giới thiệu sản phẩm qua đèn vòng và điện thoại",
    badge: "Miễn phí",
    badgeColor: "green" as const,
    title: "PromptKichBan — Tạo kịch bản & prompt video từ ý tưởng",
    desc: "Công cụ chủ lực của AI Mở: nhập ý tưởng hoặc mô tả sản phẩm, nhận trọn bộ đầu ra sẵn sàng dán vào công cụ tạo video AI.",
    checks: [
      "Kịch bản chia cảnh kèm timecode và lời thoại",
      "Storyboard từng cảnh: góc máy, chuyển động camera",
      "Prompt tiếng Anh tối ưu cho Veo 3, Grok, Seedance 2 / 2.5",
      "Kèm negative prompt, caption và hashtag đăng bài",
    ],
    link: "/promptkichban",
    linkLabel: "Dùng ngay",
    guideLink: "/guides",
    searchable: "promptkichban prompt kich ban video veo grok seedance storyboard kịch bản",
  },
  {
    id: "bento-profit",
    img: "/images/home/bento-profit-calc.jpg",
    alt: "Dashboard doanh thu và lợi nhuận trên màn hình laptop",
    badge: "Sẵn dùng",
    badgeColor: "green" as const,
    title: "Tính lãi thật từng đơn",
    desc: "Trừ đủ giá vốn, phí ship và phí sàn để thấy lãi thật của từng đơn hàng, thay vì nhìn doanh thu ảo.",
    link: "/apps/tinh-loi-nhuan-don-hang",
    linkLabel: "Dùng ngay",
    searchable: "tính lãi thật từng đơn lợi nhuận phí ship sàn dashboard doanh thu",
  },
  {
    id: "bento-pricing",
    img: "/images/home/bento-pricing-tool.jpg",
    alt: "Chủ shop online đóng gói sản phẩm chuẩn bị gửi đơn hàng",
    badge: "Sẵn dùng",
    badgeColor: "green" as const,
    title: "Định giá bán & khuyến mãi",
    desc: "Tính giá bán và mức giảm an toàn để chạy khuyến mãi mà không âm vào tiền lãi của shop.",
    link: "/apps/dinh-gia-ban-combo",
    linkLabel: "Dùng ngay",
    searchable: "định giá bán khuyến mãi giá sản phẩm đóng gói đơn hàng shop online",
  },
  {
    id: "bento-apps",
    wide: true,
    img: "/images/home/bento-apps-hub.jpg",
    alt: "Điện thoại với các biểu tượng ứng dụng đầy màu sắc bay xung quanh",
    badge: "14+ app",
    badgeColor: "amber" as const,
    title: "Kho app HTML miễn phí",
    desc: "14+ ứng dụng nhỏ chạy thẳng trên trình duyệt điện thoại và máy tính: mở là dùng, không cài đặt, không đăng ký.",
    link: "/apps",
    linkLabel: "Mở kho app",
    searchable: "app html miễn phí kho ứng dụng trình duyệt điện thoại",
  },
];

export function BentoTools() {
  const { query } = useSearch();
  const { getImage } = useHomeImages();
  const q = norm(query.trim());

  const filtered = tools.filter((t) => {
    if (!q) return true;
    return norm(t.searchable + " " + t.title + " " + t.desc).includes(q);
  });

  return (
    <section className="block container max-w-[1240px] mx-auto px-4 sm:px-5 pt-14 sm:pt-16" id="cong-cu">
      <div className="max-w-[640px] mb-7">
        <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#0057ff] mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#7c4dff]" />
          Công cụ nổi bật
        </span>
        <h2 className="text-[clamp(24px,3vw,34px)] font-extrabold tracking-tight leading-tight text-[#0c1526] mb-2">
          Công cụ AI &amp; app tính toán cho người bán hàng
        </h2>
        <p className="text-[15.5px] text-[#68779a] m-0">
          Mỗi công cụ đều có ảnh thật của việc nó làm — nhìn 2 giây là hiểu.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="bentoGrid">
        {filtered.map((t) => (
          <article
            key={t.id}
            className={`tool bg-white border border-[#dde6f8] rounded-[26px] overflow-hidden shadow-[0_8px_24px_-12px_rgba(21,52,140,.18)] flex flex-col ${
              t.big ? "sm:col-span-2 sm:row-span-2" : ""
            } ${t.wide ? "sm:col-span-2" : ""}`}
            data-searchable={t.searchable}
          >
            <div className="relative">
              <CardImageEditor cardId={t.id} cardTitle={t.title} />
              <span
                className={`absolute top-3.5 left-3.5 z-[2] text-xs font-extrabold px-3 py-1 rounded-full ${
                  t.badgeColor === "green"
                    ? "bg-[#e3f7ee] text-[#0e9f6e]"
                    : "bg-[#fdf1dc] text-[#b97a0c]"
                }`}
              >
                {t.badge}
              </span>
              <Image
                src={getImage(t.id, t.img)}
                alt={t.alt}
                width={600}
                height={t.big ? 300 : 150}
                className={`w-full object-cover ${t.big ? "h-[220px] sm:h-[300px]" : "h-[140px] sm:h-[150px]"}`}
              />
            </div>
            <div className="p-5 flex flex-col gap-2 flex-1">
              <h3 className={`font-extrabold text-[#0c1526] m-0 ${t.big ? "text-[19px] sm:text-[21px]" : "text-lg"}`}>
                {t.title}
              </h3>
              <p className="text-sm text-[#68779a] m-0 flex-1">{t.desc}</p>
              {t.checks && (
                <ul className="mt-1 space-y-2 list-none p-0">
                  {t.checks.map((c, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-[#3c4a68] items-start">
                      <Check className="w-4 h-4 text-[#0e9f6e] shrink-0 mt-0.5" />
                      {c}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex items-center gap-3.5 mt-2.5 flex-wrap">
                <Link
                  href={t.link}
                  className="inline-flex items-center gap-1.5 text-[14.5px] font-extrabold text-[#0057ff] min-h-[36px] hover:gap-2 transition-all"
                >
                  {t.linkLabel}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {t.guideLink && (
                  <Link
                    href={t.guideLink}
                    className="text-sm font-semibold text-[#3c4a68] hover:text-[#0057ff] transition-colors min-h-[36px] inline-flex items-center"
                  >
                    Xem hướng dẫn
                  </Link>
                )}
              </div>
            </div>
          </article>
        ))}

        {q && filtered.length === 0 && (
          <p className="col-span-full text-center text-[#68779a] py-7 border border-dashed border-[#dde6f8] rounded-[18px] bg-white text-[14.5px]">
            Không tìm thấy công cụ khớp với từ khóa — thử &quot;video&quot;, &quot;lãi&quot; hoặc &quot;giá&quot;.
          </p>
        )}
      </div>
    </section>
  );
}
