"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Upload, Image as ImageIcon, Link as LinkIcon, RotateCcw, X, Check, Loader2 } from "lucide-react";

const DEFAULT_IMAGES: Record<string, string> = {
  "hero-preview": "/images/home/hero-creator-preview.jpg",
  "scene-1": "/images/home/scene-1-serum-pastel.jpg",
  "scene-2": "/images/home/scene-2-serum-droplet.jpg",
  "scene-3": "/images/home/scene-3-serum-flatlay.jpg",
  "action-1": "/images/home/action-prompt-kich-ban.jpg",
  "action-2": "/images/home/action-apps-free.jpg",
  "action-3": "/images/home/action-learning-path.jpg",
  "bento-prompt": "/images/home/bento-prompt-studio.jpg",
  "bento-profit": "/images/home/bento-profit-calc.jpg",
  "bento-pricing": "/images/home/bento-pricing-tool.jpg",
  "bento-apps": "/images/home/bento-apps-hub.jpg",
  "path-main": "/images/home/path-step-1.jpg",
  "article-1": "/images/home/path-step-2.jpg",
  "article-2": "/images/home/path-step-3.jpg",
  "article-3": "/images/home/article-ai-chatbot.jpg",
  "explore-1": "/images/home/article-serum-case-study.jpg",
  "explore-2": "/images/home/article-apps-offline.jpg",
  "explore-3": "/images/home/explore-courses.jpg",
  "explore-4": "/images/home/explore-games.jpg",
};

const CATALOG = [
  { src: "/images/home/hero-creator-preview.jpg", label: "Studio quay serum" },
  { src: "/images/home/scene-1-serum-pastel.jpg", label: "Chai serum pastel" },
  { src: "/images/home/scene-2-serum-droplet.jpg", label: "Giọt serum" },
  { src: "/images/home/scene-3-serum-flatlay.jpg", label: "Flat-lay skincare" },
  { src: "/images/home/action-prompt-kich-ban.jpg", label: "Livestream qua đèn vòng" },
  { src: "/images/home/action-apps-free.jpg", label: "App 3D trên điện thoại" },
  { src: "/images/home/action-learning-path.jpg", label: "Học online tại nhà" },
  { src: "/images/home/bento-prompt-studio.jpg", label: "Studio kịch bản video" },
  { src: "/images/home/bento-profit-calc.jpg", label: "Dashboard doanh thu" },
  { src: "/images/home/bento-pricing-tool.jpg", label: "Đóng gói đơn hàng" },
  { src: "/images/home/bento-apps-hub.jpg", label: "Biểu tượng ứng dụng" },
  { src: "/images/home/path-step-1.jpg", label: "Học viên bên laptop" },
  { src: "/images/home/path-step-2.jpg", label: "Dựng video timeline" },
  { src: "/images/home/path-step-3.jpg", label: "Ghi chép khi học" },
  { src: "/images/home/article-ai-chatbot.jpg", label: "AI trên điện thoại" },
  { src: "/images/home/article-serum-case-study.jpg", label: "Nhỏ giọt serum trên tay" },
  { src: "/images/home/article-apps-offline.jpg", label: "Nhiều màn hình app" },
  { src: "/images/home/explore-courses.jpg", label: "Học ở quán cà phê" },
  { src: "/images/home/explore-games.jpg", label: "Game trên laptop" },
];

export interface HomeContent {
  heroBadge: string;
  heroTitle: string;
  heroDesc: string;
  quickActionsTitle: string;
  quickActionsDesc: string;
  toolsTitle: string;
  toolsDesc: string;
  pathTitle: string;
  pathDesc: string;
  articlesTitle: string;
  articlesDesc: string;
  exploreTitle: string;
  exploreDesc: string;
}

export const DEFAULT_HOME_CONTENT: HomeContent = {
  heroBadge: "AI Studio của AI Mở",
  heroTitle: "Học AI bằng cách tạo ra thứ dùng được.",
  heroDesc: "Bộ công cụ AI thực tế, ứng dụng miễn phí và lộ trình thực hành dành cho người làm việc thật. Không lý thuyết suông.",
  quickActionsTitle: "Bắt đầu nhanh với 3 việc phổ biến nhất",
  quickActionsDesc: "Không cần đọc tài liệu dài dòng. Chọn một bài toán và thử ngay trên trình duyệt.",
  toolsTitle: "Bộ công cụ AI giải quyết bài toán thật",
  toolsDesc: "Mỗi công cụ xử lý một việc cụ thể, có thể dùng ngay mà không cần kết nối API phức tạp.",
  pathTitle: "Lộ trình học AI thực chiến",
  pathDesc: "Học theo sản phẩm đầu ra, không học theo tính năng trừu tượng.",
  articlesTitle: "Kiến thức & Hướng dẫn thực hành",
  articlesDesc: "Những bài viết thực chiến, chia sẻ kinh nghiệm dùng AI vào công việc hàng ngày.",
  exploreTitle: "Khám phá thêm trên AI Mở",
  exploreDesc: "Bốn lối đi rõ ràng: mỗi ô là một điểm đến cụ thể.",
};

interface HomeImagesContextType {
  images: Record<string, string>;
  content: HomeContent;
  isEditMode: boolean;
  toggleEditMode: () => void;
  getImage: (cardId: string, fallback?: string) => string;
  openImageModal: (cardId: string, cardTitle: string) => void;
  updateImage: (cardId: string, url: string) => Promise<void>;
  resetImages: () => Promise<void>;
  updateContent: (patch: Partial<HomeContent>) => Promise<void>;
  resetContent: () => Promise<void>;
}

const HomeImagesContext = createContext<HomeImagesContextType>({
  images: DEFAULT_IMAGES,
  content: DEFAULT_HOME_CONTENT,
  isEditMode: false,
  toggleEditMode: () => {},
  getImage: (id, fb) => fb || DEFAULT_IMAGES[id] || "",
  openImageModal: () => {},
  updateImage: async () => {},
  resetImages: async () => {},
  updateContent: async () => {},
  resetContent: async () => {},
});

export function HomeImagesProvider({ children }: { children: React.ReactNode }) {
  const [images, setImages] = useState<Record<string, string>>(DEFAULT_IMAGES);
  const [content, setContent] = useState<HomeContent>(DEFAULT_HOME_CONTENT);
  const [isEditMode, setIsEditMode] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [activeCardId, setActiveCardId] = useState("");
  const [activeCardTitle, setActiveCardTitle] = useState("");
  const [selectedSrc, setSelectedSrc] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"upload" | "catalog" | "url">("upload");
  const [uploading, setUploading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2800);
  };

  // 1. Load on mount
  useEffect(() => {
    const saved = localStorage.getItem("aimo_home_images");
    if (saved) {
      try {
        setImages((prev) => ({ ...prev, ...JSON.parse(saved) }));
      } catch {}
    }

    const savedContent = localStorage.getItem("aimo_home_content");
    if (savedContent) {
      try {
        setContent((prev) => ({ ...prev, ...JSON.parse(savedContent) }));
      } catch {}
    }

    // Also fetch from API
    fetch("/api/admin/home-images")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          if (data.images) {
            setImages((prev) => ({ ...prev, ...data.images }));
            localStorage.setItem("aimo_home_images", JSON.stringify(data.images));
          }
          if (data.content) {
            setContent((prev) => ({ ...prev, ...data.content }));
            localStorage.setItem("aimo_home_content", JSON.stringify(data.content));
          }
        }
      })
      .catch(() => {});
  }, []);

  const getImage = useCallback(
    (cardId: string, fallback?: string) => {
      return images[cardId] || fallback || DEFAULT_IMAGES[cardId] || "/images/home/hero-creator-preview.jpg";
    },
    [images]
  );

  const toggleEditMode = () => {
    setIsEditMode((prev) => {
      const next = !prev;
      if (next) showToast("Đã bật chế độ Quản trị ảnh — bấm vào nút camera trên từng card để đổi ảnh!");
      else showToast("Đã tắt chế độ Quản trị ảnh.");
      return next;
    });
  };

  const openImageModal = (cardId: string, cardTitle: string) => {
    setActiveCardId(cardId);
    setActiveCardTitle(cardTitle);
    setSelectedSrc(images[cardId] || DEFAULT_IMAGES[cardId] || "");
    setCustomUrl("");
    setModalOpen(true);
  };

  const updateImage = async (cardId: string, newUrl: string) => {
    const updated = { ...images, [cardId]: newUrl };
    setImages(updated);
    localStorage.setItem("aimo_home_images", JSON.stringify(updated));

    try {
      await fetch("/api/admin/home-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, url: newUrl }),
      });
      showToast("Đã cập nhật ảnh thành công! ✓");
    } catch {
      showToast("Đã lưu vào bộ nhớ trình duyệt ✓");
    }
  };

  const resetImages = async () => {
    setImages(DEFAULT_IMAGES);
    localStorage.removeItem("aimo_home_images");
    try {
      await fetch("/api/admin/home-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      showToast("Đã khôi phục toàn bộ ảnh gốc ✓");
    } catch {
      showToast("Đã đặt lại ảnh mặc định ✓");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("cardId", activeCardId);

    try {
      const res = await fetch("/api/admin/home-images", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.ok && data.url) {
        setSelectedSrc(data.url);
        updateImage(activeCardId, data.url);
        setModalOpen(false);
      } else {
        showToast(data.error || "Lỗi tải ảnh lên.");
      }
    } catch {
      // Local preview fallback if API fails
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setSelectedSrc(dataUrl);
        updateImage(activeCardId, dataUrl);
        setModalOpen(false);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const handleApplySelected = () => {
    const targetUrl = activeTab === "url" && customUrl.trim() ? customUrl.trim() : selectedSrc;
    if (targetUrl) {
      updateImage(activeCardId, targetUrl);
      setModalOpen(false);
    }
  };

  const updateContent = async (patch: Partial<HomeContent>) => {
    const updated = { ...content, ...patch };
    setContent(updated);
    localStorage.setItem("aimo_home_content", JSON.stringify(updated));

    try {
      await fetch("/api/admin/home-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_content", content: patch }),
      });
      showToast("Đã lưu nội dung trang chủ thành công! ✓");
    } catch {
      showToast("Đã lưu vào bộ nhớ trình duyệt ✓");
    }
  };

  const resetContent = async () => {
    setContent(DEFAULT_HOME_CONTENT);
    localStorage.removeItem("aimo_home_content");
    try {
      await fetch("/api/admin/home-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_content" }),
      });
      showToast("Đã khôi phục nội dung gốc ✓");
    } catch {
      showToast("Đã đặt lại nội dung mặc định ✓");
    }
  };

  return (
    <HomeImagesContext.Provider
      value={{
        images,
        content,
        isEditMode,
        toggleEditMode,
        getImage,
        openImageModal,
        updateImage,
        resetImages,
        updateContent,
        resetContent,
      }}
    >
      {children}

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed left-1/2 bottom-8 -translate-x-1/2 z-[100] bg-[#0c1526] text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-2xl animate-fade-in pointer-events-none text-center">
          {toastMsg}
        </div>
      )}

      {/* Visual Image Manager Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setModalOpen(false)}
            aria-label="Đóng bảng đổi ảnh"
          />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[88vh] overflow-y-auto p-5 sm:p-7 z-10 text-[#0c1526]">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <h3 className="text-lg font-black text-[#0c1526] m-0">Đổi ảnh: {activeCardTitle}</h3>
                <p className="text-xs text-[#68779a] mt-0.5">
                  ID: <span className="font-mono font-bold text-[#0057ff]">{activeCardId}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Preview */}
            <div className="mt-4 flex items-center gap-4 p-3 bg-[#f4f7ff] rounded-2xl border border-[#dde6f8]">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-neutral-200 shrink-0 border border-white shadow-xs">
                <Image
                  src={selectedSrc || "/images/home/hero-creator-preview.jpg"}
                  alt="Ảnh đang chọn"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold text-[#0057ff] uppercase tracking-wider block">
                  Ảnh đang chọn
                </span>
                <p className="text-xs text-[#3c4a68] truncate font-mono mt-0.5">{selectedSrc}</p>
                <button
                  type="button"
                  onClick={() => {
                    const def = DEFAULT_IMAGES[activeCardId];
                    if (def) setSelectedSrc(def);
                  }}
                  className="mt-1 text-[11px] font-bold text-[#68779a] hover:text-[#0057ff] inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Dùng ảnh mặc định
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-5 flex border-b border-neutral-200 gap-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab("upload")}
                className={`pb-2.5 flex items-center gap-1.5 transition-colors ${
                  activeTab === "upload"
                    ? "border-b-2 border-[#0057ff] text-[#0057ff]"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                <Upload className="w-4 h-4" />
                Tải ảnh từ máy tính
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("catalog")}
                className={`pb-2.5 flex items-center gap-1.5 transition-colors ${
                  activeTab === "catalog"
                    ? "border-b-2 border-[#0057ff] text-[#0057ff]"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                Kho ảnh mẫu ({CATALOG.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("url")}
                className={`pb-2.5 flex items-center gap-1.5 transition-colors ${
                  activeTab === "url"
                    ? "border-b-2 border-[#0057ff] text-[#0057ff]"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                Nhập link URL
              </button>
            </div>

            {/* Tab 1: Upload */}
            {activeTab === "upload" && (
              <div className="py-6">
                <label className="border-2 border-dashed border-[#dde6f8] hover:border-[#0057ff] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#fbfdff] hover:bg-[#f0f6ff]">
                  {uploading ? (
                    <Loader2 className="w-8 h-8 text-[#0057ff] animate-spin mb-2" />
                  ) : (
                    <Upload className="w-8 h-8 text-[#0057ff] mb-2" />
                  )}
                  <span className="text-sm font-bold text-[#0c1526]">
                    {uploading ? "Đang xử lý tải ảnh..." : "Bấm để chọn ảnh từ máy tính"}
                  </span>
                  <span className="text-xs text-[#68779a] mt-1">
                    Hỗ trợ định dạng JPG, PNG, WebP (tối đa 5MB)
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Tab 2: Catalog */}
            {activeTab === "catalog" && (
              <div className="py-4">
                <p className="text-xs text-[#68779a] mb-3">
                  Bấm vào ảnh mẫu bất kỳ để áp dụng ngay:
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {CATALOG.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedSrc(item.src)}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all group text-left ${
                        selectedSrc === item.src
                          ? "border-[#0057ff] ring-2 ring-blue-400/30"
                          : "border-transparent hover:border-neutral-300"
                      }`}
                    >
                      <div className="relative h-16 w-full">
                        <Image src={item.src} alt={item.label} fill className="object-cover" />
                        {selectedSrc === item.src && (
                          <div className="absolute inset-0 bg-[#0057ff]/40 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                      <span className="block text-[10px] font-medium p-1 bg-white truncate">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: URL */}
            {activeTab === "url" && (
              <div className="py-5 space-y-3">
                <label className="text-xs font-bold text-[#3c4a68] block">
                  Đường dẫn ảnh trực tiếp (URL):
                </label>
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => {
                    setCustomUrl(e.target.value);
                    if (e.target.value.startsWith("http") || e.target.value.startsWith("/")) {
                      setSelectedSrc(e.target.value);
                    }
                  }}
                  placeholder="https://example.com/anh-cua-ban.jpg"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#f4f7ff] border border-[#dde6f8] rounded-xl outline-none focus:border-[#0057ff]"
                />
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 rounded-full"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleApplySelected}
                className="px-5 py-2 text-xs font-bold bg-[#0057ff] hover:bg-[#0043c7] text-white rounded-full shadow-md shadow-blue-500/20"
              >
                Áp dụng ảnh này
              </button>
            </div>
          </div>
        </div>
      )}
    </HomeImagesContext.Provider>
  );
}

export function useHomeImages() {
  return useContext(HomeImagesContext);
}

/**
 * Nút Camera Overlay trực quan hiển thị trên từng card khi isEditMode = true
 */
export function CardImageEditor({ cardId, cardTitle }: { cardId: string; cardTitle: string }) {
  const { isEditMode, openImageModal } = useHomeImages();

  if (!isEditMode) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openImageModal(cardId, cardTitle);
      }}
      className="absolute top-2 right-2 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0c1526]/90 hover:bg-[#0057ff] text-white text-xs font-bold shadow-lg backdrop-blur-md border border-white/30 transition-all hover:scale-105 animate-pulse"
      title={`Bấm để đổi ảnh cho: ${cardTitle}`}
    >
      <Upload className="w-3.5 h-3.5" />
      <span>Đổi ảnh</span>
    </button>
  );
}
