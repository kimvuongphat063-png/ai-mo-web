"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Upload,
  RotateCcw,
  ExternalLink,
  Check,
  Sparkles,
  ArrowRight,
  ImageIcon,
  Loader2,
} from "lucide-react";

interface CardDef {
  id: string;
  tab: string;
  tabName: string;
  title: string;
  desc: string;
  defaultSrc: string;
}

const ALL_CARDS: CardDef[] = [
  // 1. Hero
  {
    id: "hero-preview",
    tab: "hero",
    tabName: "Hero & Demo Video",
    title: "Video Demo Hero (Card phải)",
    desc: "Khung video demo nổi bật góc trên cùng trang chủ",
    defaultSrc: "/images/home/hero-creator-preview.jpg",
  },
  {
    id: "scene-1",
    tab: "hero",
    tabName: "Hero & Demo Video",
    title: "Storyboard Cảnh 1 · Hook",
    desc: "Thumbnail cảnh mở đầu (0-3s)",
    defaultSrc: "/images/home/scene-1-serum-pastel.jpg",
  },
  {
    id: "scene-2",
    tab: "hero",
    tabName: "Hero & Demo Video",
    title: "Storyboard Cảnh 2 · Chất SP",
    desc: "Thumbnail cảnh chi tiết (3-15s)",
    defaultSrc: "/images/home/scene-2-serum-droplet.jpg",
  },
  {
    id: "scene-3",
    tab: "hero",
    tabName: "Hero & Demo Video",
    title: "Storyboard Cảnh 3 · Chốt CTA",
    desc: "Thumbnail cảnh kết thúc (15-30s)",
    defaultSrc: "/images/home/scene-3-serum-flatlay.jpg",
  },

  // 2. Quick Actions
  {
    id: "action-1",
    tab: "actions",
    tabName: "3 Card Hành Động",
    title: "Tạo prompt video",
    desc: "Card lối vào 1: Tạo kịch bản và prompt video",
    defaultSrc: "/images/home/action-prompt-kich-ban.jpg",
  },
  {
    id: "action-2",
    tab: "actions",
    tabName: "3 Card Hành Động",
    title: "Dùng app miễn phí",
    desc: "Card lối vào 2: 14+ app HTML miễn phí",
    defaultSrc: "/images/home/action-apps-free.jpg",
  },
  {
    id: "action-3",
    tab: "actions",
    tabName: "3 Card Hành Động",
    title: "Học AI thực hành",
    desc: "Card lối vào 3: Lộ trình học theo dự án thật",
    defaultSrc: "/images/home/action-learning-path.jpg",
  },

  // 3. Bento Tools
  {
    id: "bento-prompt",
    tab: "tools",
    tabName: "Lưới Công Cụ Bento",
    title: "PromptKichBan Studio (Card Lớn)",
    desc: "Card chính nổi bật chiếm 2 cột trong lưới bento",
    defaultSrc: "/images/home/bento-prompt-studio.jpg",
  },
  {
    id: "bento-profit",
    tab: "tools",
    tabName: "Lưới Công Cụ Bento",
    title: "Tính lãi thật từng đơn",
    desc: "Công cụ tính lợi nhuận đơn hàng sàn thương mại",
    defaultSrc: "/images/home/bento-profit-calc.jpg",
  },
  {
    id: "bento-pricing",
    tab: "tools",
    tabName: "Lưới Công Cụ Bento",
    title: "Định giá bán & khuyến mãi",
    desc: "Công cụ định giá an toàn và lập combo",
    defaultSrc: "/images/home/bento-pricing-tool.jpg",
  },
  {
    id: "bento-apps",
    tab: "tools",
    tabName: "Lưới Công Cụ Bento",
    title: "Kho app HTML miễn phí",
    desc: "Card ngang rộng giới thiệu 14+ app",
    defaultSrc: "/images/home/bento-apps-hub.jpg",
  },

  // 4. Learning Path
  {
    id: "path-main",
    tab: "path",
    tabName: "Lộ Trình Học",
    title: "Ảnh bìa Lộ trình học 3 chặng",
    desc: "Khung ảnh lớn bên trái mục 'Học bằng cách làm ra sản phẩm'",
    defaultSrc: "/images/home/path-step-1.jpg",
  },

  // 5. Articles
  {
    id: "article-1",
    tab: "articles",
    tabName: "Bài Viết Kiến Thức",
    title: "Bài viết 1: Viết prompt video AI",
    desc: "Ảnh bìa bài viết cấu trúc 5 phần của prompt",
    defaultSrc: "/images/home/path-step-2.jpg",
  },
  {
    id: "article-2",
    tab: "articles",
    tabName: "Bài Viết Kiến Thức",
    title: "Bài viết 2: Bắt đầu từ công cụ",
    desc: "Ảnh bìa bài viết học AI từ dự án nhỏ",
    defaultSrc: "/images/home/path-step-3.jpg",
  },
  {
    id: "article-3",
    tab: "articles",
    tabName: "Bài Viết Kiến Thức",
    title: "Bài viết 3: Dùng AI trên điện thoại",
    desc: "Ảnh bìa bài viết 5 việc AI làm trên điện thoại",
    defaultSrc: "/images/home/article-ai-chatbot.jpg",
  },

  // 6. Explore
  {
    id: "explore-1",
    tab: "explore",
    tabName: "Khám Phá Thêm",
    title: "Card 1: PromptKichBan Studio",
    desc: "Khám phá công cụ tạo video",
    defaultSrc: "/images/home/article-serum-case-study.jpg",
  },
  {
    id: "explore-2",
    tab: "explore",
    tabName: "Khám Phá Thêm",
    title: "Card 2: 14+ App HTML miễn phí",
    desc: "Khám phá kho app trực tuyến",
    defaultSrc: "/images/home/article-apps-offline.jpg",
  },
  {
    id: "explore-3",
    tab: "explore",
    tabName: "Khám Phá Thêm",
    title: "Card 3: Lộ trình học AI",
    desc: "Khám phá các khóa học thực hành",
    defaultSrc: "/images/home/explore-courses.jpg",
  },
  {
    id: "explore-4",
    tab: "explore",
    tabName: "Khám Phá Thêm",
    title: "Card 4: Game web giải trí",
    desc: "Khám phá game làm bằng AI",
    defaultSrc: "/images/home/explore-games.jpg",
  },
];

const TABS = [
  { id: "all", label: "Tất cả vị trí (19)" },
  { id: "hero", label: "Hero & Video (4)" },
  { id: "actions", label: "3 Card Hành động (3)" },
  { id: "tools", label: "Lưới Bento (4)" },
  { id: "path", label: "Lộ trình học (1)" },
  { id: "articles", label: "Bài viết mới (3)" },
  { id: "explore", label: "Khám phá thêm (4)" },
];

export default function AdminCardsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [images, setImages] = useState<Record<string, string>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  // Load current image mappings
  useEffect(() => {
    fetch("/api/admin/home-images")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.images) {
          setImages(data.images);
          localStorage.setItem("aimo_home_images", JSON.stringify(data.images));
        }
      })
      .catch(() => {});
  }, []);

  const handleFileUpload = async (cardId: string, file: File) => {
    setUploadingId(cardId);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("cardId", cardId);

    try {
      const res = await fetch("/api/admin/home-images", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.ok && data.url) {
        const next = { ...images, [cardId]: data.url };
        setImages(next);
        localStorage.setItem("aimo_home_images", JSON.stringify(next));
        showToast(`Đã tải ảnh mới thành công cho ${cardId}! ✓`);
      } else {
        showToast(data.error || "Lỗi tải ảnh lên.");
      }
    } catch {
      showToast("Lỗi kết nối khi tải ảnh.");
    } finally {
      setUploadingId(null);
    }
  };

  const handleResetCard = async (cardId: string, defSrc: string) => {
    const next = { ...images, [cardId]: defSrc };
    setImages(next);
    localStorage.setItem("aimo_home_images", JSON.stringify(next));

    try {
      await fetch("/api/admin/home-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, url: defSrc }),
      });
      showToast(`Đã khôi phục ảnh gốc cho ${cardId}! ✓`);
    } catch {}
  };

  const handleResetAll = async () => {
    if (!confirm("Anh có chắc muốn khôi phục toàn bộ 19 ảnh về mặc định ban đầu không?")) return;
    const defaults: Record<string, string> = {};
    ALL_CARDS.forEach((c) => {
      defaults[c.id] = c.defaultSrc;
    });
    setImages(defaults);
    localStorage.removeItem("aimo_home_images");

    try {
      await fetch("/api/admin/home-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      showToast("Đã khôi phục toàn bộ 19 ảnh về gốc! ✓");
    } catch {}
  };

  const filteredCards =
    activeTab === "all" ? ALL_CARDS : ALL_CARDS.filter((c) => c.tab === activeTab);

  return (
    <div className="min-h-screen bg-[#f4f7ff] text-[#0c1526] pb-24">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed left-1/2 bottom-8 -translate-x-1/2 z-[100] bg-[#0c1526] text-white px-6 py-3 rounded-full text-sm font-bold shadow-2xl animate-fade-in pointer-events-none">
          {toastMsg}
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#dde6f8] py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-r from-[#0057ff] via-[#7c4dff] to-[#00b8d9] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5 fill-current" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#0c1526] tracking-tight">
                Quản trị Hình ảnh Trang chủ
              </h1>
              <p className="text-xs text-[#68779a]">
                Tự do thay đổi ảnh cho từng card, từng section — cập nhật tức thì trên website
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleResetAll}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#dde6f8] bg-white hover:bg-neutral-50 text-xs font-bold text-neutral-700 transition-colors shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Đặt lại toàn bộ ảnh gốc
            </button>
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#0057ff] hover:bg-[#0043c7] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-105"
            >
              <span>Xem trang chủ trực tiếp</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="max-w-7xl mx-auto mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? "bg-[#0c1526] text-white shadow-sm"
                  : "bg-white text-[#3c4a68] border border-[#dde6f8] hover:bg-neutral-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card) => {
            const currentImg = images[card.id] || card.defaultSrc;
            const isCustom = currentImg !== card.defaultSrc;
            const isUploading = uploadingId === card.id;

            return (
              <div
                key={card.id}
                className="bg-white border border-[#dde6f8] rounded-3xl overflow-hidden shadow-[0_8px_24px_-12px_rgba(21,52,140,.18)] flex flex-col hover:shadow-lg transition-all"
              >
                {/* Image Preview & Upload Overlay */}
                <div className="relative h-52 w-full bg-neutral-100 group overflow-hidden">
                  <Image
                    src={currentImg}
                    alt={card.title}
                    fill
                    className="object-cover group-hover:scale-102 transition-transform duration-300"
                  />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="bg-[#0c1526]/85 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                      {card.tabName}
                    </span>
                    {isCustom && (
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                        Đã tuỳ chỉnh
                      </span>
                    )}
                  </div>

                  {/* Upload Overlay Button */}
                  <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity backdrop-blur-2xs">
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-7 h-7 mb-1 drop-shadow-md" />
                        <span className="text-xs font-bold drop-shadow-md">
                          Bấm để tải ảnh mới lên
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      disabled={isUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(card.id, file);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Card Info & Controls */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-extrabold text-[#0c1526] leading-snug m-0">
                        {card.title}
                      </h3>
                      <p className="text-xs text-[#68779a] mt-1">{card.desc}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                    {/* Upload button */}
                    <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0057ff] hover:bg-[#0043c7] text-white text-xs font-bold cursor-pointer transition-colors shadow-xs">
                      {isUploading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>{isUploading ? "Đang tải..." : "Tải ảnh từ máy"}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        disabled={isUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(card.id, file);
                        }}
                        className="hidden"
                      />
                    </label>

                    {/* Reset button if custom */}
                    {isCustom && (
                      <button
                        type="button"
                        onClick={() => handleResetCard(card.id, card.defaultSrc)}
                        title="Khôi phục ảnh ban đầu"
                        className="text-xs font-bold text-neutral-500 hover:text-red-600 inline-flex items-center gap-1 py-1.5 px-2.5 rounded-lg hover:bg-neutral-100 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Ảnh gốc</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
