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
  FileText,
  Save,
} from "lucide-react";
import { DEFAULT_HOME_CONTENT, type HomeContent } from "@/types/home-content";

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
    desc: "Công cụ tính lãi sàn Shopee / TikTok",
    defaultSrc: "/images/home/bento-profit-calc.jpg",
  },
  {
    id: "bento-pricing",
    tab: "tools",
    tabName: "Lưới Công Cụ Bento",
    title: "Định giá bán sản phẩm",
    desc: "Công cụ tìm điểm hòa vốn và giá bán",
    defaultSrc: "/images/home/bento-pricing-tool.jpg",
  },
  {
    id: "bento-apps",
    tab: "tools",
    tabName: "Lưới Công Cụ Bento",
    title: "Kho app miễn phí",
    desc: "Lối vào kho 14+ app chạy trực tiếp trên web",
    defaultSrc: "/images/home/bento-apps-hub.jpg",
  },

  // 4. Learning Path
  {
    id: "path-main",
    tab: "path",
    tabName: "Lộ Trình Học",
    title: "Ảnh chính: Lộ trình 3 chặng",
    desc: "Ảnh lớn học viên thực hành bên cạnh 3 bước",
    defaultSrc: "/images/home/path-step-1.jpg",
  },

  // 5. Articles
  {
    id: "article-1",
    tab: "articles",
    tabName: "Bài Viết Kiến Thức",
    title: "Bài viết 1: Viết prompt có cấu trúc",
    desc: "Ảnh bìa bài hướng dẫn prompt 5 lớp",
    defaultSrc: "/images/home/path-step-2.jpg",
  },
  {
    id: "article-2",
    tab: "articles",
    tabName: "Bài Viết Kiến Thức",
    title: "Bài viết 2: 5 dữ liệu không đưa vào chatbot",
    desc: "Ảnh bìa bài viết an toàn dữ liệu AI",
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
  { id: "content", label: "📝 Tiêu đề & Nội dung" },
];

export default function AdminCardsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [images, setImages] = useState<Record<string, string>>({});
  const [content, setContent] = useState<HomeContent>(DEFAULT_HOME_CONTENT);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [savingContent, setSavingContent] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  // Load current image mappings & content
  useEffect(() => {
    // 1. Load from localStorage
    const savedImg = localStorage.getItem("aimo_home_images");
    if (savedImg) {
      try {
        setImages(JSON.parse(savedImg));
      } catch {}
    }
    const savedContent = localStorage.getItem("aimo_home_content");
    if (savedContent) {
      try {
        setContent(JSON.parse(savedContent));
      } catch {}
    }

    // 2. Fetch from API
    fetch("/api/admin/home-images")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          if (data.images) {
            setImages(data.images);
            localStorage.setItem("aimo_home_images", JSON.stringify(data.images));
          }
          if (data.content) {
            setContent(data.content);
            localStorage.setItem("aimo_home_content", JSON.stringify(data.content));
          }
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
        // Fallback local data URL
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          const next = { ...images, [cardId]: dataUrl };
          setImages(next);
          localStorage.setItem("aimo_home_images", JSON.stringify(next));
          showToast(`Đã lưu ảnh mới vào trình duyệt! ✓`);
        };
        reader.readAsDataURL(file);
      }
    } catch {
      // Fallback local data URL
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const next = { ...images, [cardId]: dataUrl };
        setImages(next);
        localStorage.setItem("aimo_home_images", JSON.stringify(next));
        showToast(`Đã lưu ảnh mới vào trình duyệt! ✓`);
      };
      reader.readAsDataURL(file);
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

  const handleSaveContent = async () => {
    setSavingContent(true);
    localStorage.setItem("aimo_home_content", JSON.stringify(content));
    try {
      const res = await fetch("/api/admin/home-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_content", content }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast("Đã lưu tiêu đề & nội dung trang chủ thành công! ✓");
      } else {
        showToast("Đã lưu vào bộ nhớ trình duyệt ✓");
      }
    } catch {
      showToast("Đã lưu vào bộ nhớ trình duyệt ✓");
    } finally {
      setSavingContent(false);
    }
  };

  const handleResetContent = async () => {
    if (!confirm("Khôi phục toàn bộ tiêu đề trang chủ về mặc định?")) return;
    setContent(DEFAULT_HOME_CONTENT);
    localStorage.removeItem("aimo_home_content");
    try {
      await fetch("/api/admin/home-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_content" }),
      });
      showToast("Đã khôi phục tiêu đề mặc định!");
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
                Quản trị Giao diện & Nội dung Trang chủ
              </h1>
              <p className="text-xs text-[#68779a]">
                Tùy chỉnh 19 vị trí hình ảnh và nội dung tiêu đề trực quan theo từng phần.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/admin/articles"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0057ff] bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-200/60"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Quản lý Blog Kiến Thức</span>
            </Link>
            {activeTab !== "content" ? (
              <button
                type="button"
                onClick={handleResetAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Khôi phục ảnh gốc</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetContent}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại chữ mặc định</span>
              </button>
            )}
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0057ff] hover:bg-[#0043c7] rounded-xl shadow-md shadow-blue-500/20 transition-all"
            >
              <span>Xem trang chủ</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 space-y-6">
        {/* Tab Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-extrabold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-[#0057ff] text-white shadow-md shadow-blue-500/20"
                  : "bg-white text-neutral-600 border border-[#dde6f8] hover:border-[#0057ff] hover:text-[#0057ff]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1-7: CARDS IMAGES GRID */}
        {activeTab !== "content" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map((card) => {
              const currentSrc = images[card.id] || card.defaultSrc;
              const isCustomized = currentSrc !== card.defaultSrc;
              const isUploading = uploadingId === card.id;

              return (
                <div
                  key={card.id}
                  className="bg-white border border-[#dde6f8] rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
                >
                  {/* Card Thumbnail */}
                  <div className="relative w-full h-48 bg-neutral-100 overflow-hidden group">
                    <Image
                      src={currentSrc}
                      alt={card.title}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3 z-10">
                      {isCustomized ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#0e9f6e] text-white flex items-center gap-1 shadow-xs">
                          <Check className="w-3 h-3" /> Đã tùy chỉnh
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-black/60 text-white backdrop-blur-xs">
                          Ảnh gốc
                        </span>
                      )}
                    </div>

                    {/* Tab Tag */}
                    <div className="absolute top-3 right-3 z-10">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/90 text-neutral-700 backdrop-blur-xs shadow-xs">
                        {card.tabName}
                      </span>
                    </div>

                    {isUploading && (
                      <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Đang tải ảnh lên...</span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex flex-col flex-1 gap-2">
                    <div className="flex-1">
                      <h3 className="font-extrabold text-base text-[#0c1526] leading-snug">
                        {card.title}
                      </h3>
                      <p className="text-xs text-[#68779a] mt-1 leading-relaxed">
                        {card.desc}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2 mt-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#0057ff] hover:bg-[#0043c7] shadow-xs shadow-blue-500/15 transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Tải ảnh mới</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(card.id, file);
                          }}
                        />
                      </label>

                      {isCustomized && (
                        <button
                          type="button"
                          onClick={() => handleResetCard(card.id, card.defaultSrc)}
                          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title="Khôi phục ảnh gốc"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Đặt lại</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 8: TEXT CONTENT & TITLES MANAGER */}
        {activeTab === "content" && (
          <div className="bg-white border border-[#dde6f8] rounded-3xl p-6 sm:p-8 shadow-xs space-y-8">
            <div>
              <h2 className="text-xl font-black text-[#0c1526] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#0057ff]" />
                <span>Chỉnh sửa Tiêu đề & Nội dung Trang Chủ</span>
              </h2>
              <p className="text-xs text-[#68779a] mt-1">
                Thay đổi trực tiếp tiêu đề H1, slogan, badge và mô tả của từng section. Bấm "Lưu thay đổi" để áp dụng lên trang chủ.
              </p>
            </div>

            {/* 1. HERO SECTION */}
            <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-4">
              <h3 className="text-sm font-extrabold uppercase text-[#0057ff] tracking-wider">
                1. Phần Hero (Đầu trang)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Nhãn Badge nhỏ (Sparkle)
                  </label>
                  <input
                    type="text"
                    value={content.heroBadge}
                    onChange={(e) => setContent({ ...content, heroBadge: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Tiêu đề chính H1
                  </label>
                  <input
                    type="text"
                    value={content.heroTitle}
                    onChange={(e) => setContent({ ...content, heroTitle: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-sm font-bold text-[#0c1526]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Mô tả ngắn Hero
                </label>
                <textarea
                  rows={2}
                  value={content.heroDesc}
                  onChange={(e) => setContent({ ...content, heroDesc: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* 2. QUICK ACTIONS */}
            <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-4">
              <h3 className="text-sm font-extrabold uppercase text-neutral-800 tracking-wider">
                2. Phần 3 Card Hành Động Nhanh
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Tiêu đề section
                  </label>
                  <input
                    type="text"
                    value={content.quickActionsTitle}
                    onChange={(e) => setContent({ ...content, quickActionsTitle: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Mô tả phụ
                  </label>
                  <input
                    type="text"
                    value={content.quickActionsDesc}
                    onChange={(e) => setContent({ ...content, quickActionsDesc: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 3. BENTO TOOLS */}
            <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-4">
              <h3 className="text-sm font-extrabold uppercase text-neutral-800 tracking-wider">
                3. Phần Lưới Công Cụ Bento
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Tiêu đề section
                  </label>
                  <input
                    type="text"
                    value={content.toolsTitle}
                    onChange={(e) => setContent({ ...content, toolsTitle: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Mô tả phụ
                  </label>
                  <input
                    type="text"
                    value={content.toolsDesc}
                    onChange={(e) => setContent({ ...content, toolsDesc: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 4. LEARNING PATH */}
            <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-4">
              <h3 className="text-sm font-extrabold uppercase text-neutral-800 tracking-wider">
                4. Phần Lộ Trình Học AI
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Tiêu đề section
                  </label>
                  <input
                    type="text"
                    value={content.pathTitle}
                    onChange={(e) => setContent({ ...content, pathTitle: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Mô tả phụ
                  </label>
                  <input
                    type="text"
                    value={content.pathDesc}
                    onChange={(e) => setContent({ ...content, pathDesc: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleResetContent}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100"
              >
                Đặt lại như ban đầu
              </button>
              <button
                type="button"
                disabled={savingContent}
                onClick={handleSaveContent}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0057ff] hover:bg-[#0043c7] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                {savingContent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Lưu thay đổi nội dung</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
