"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  ExternalLink,
  Sparkles,
  Clock,
  Check,
  X,
  Eye,
  EyeOff,
  Loader2,
  Image as ImageIcon,
  UploadCloud,
  FileText,
  Table as TableIcon,
} from "lucide-react";
import type { CmsArticle } from "@/lib/cms";
import { ArticleMarkdown } from "@/components/article-markdown";

interface Props {
  initialArticles: CmsArticle[];
}

export function AdminArticlesClient({ initialArticles }: Props) {
  const [articles, setArticles] = useState<CmsArticle[]>(initialArticles);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<CmsArticle | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase()) ||
      a.slug.toLowerCase().includes(query.toLowerCase())
  );

  const startCreate = () => {
    const id = `article-${Date.now()}`;
    const newArt: CmsArticle = {
      id,
      slug: `bai-viet-${Date.now().toString().slice(-6)}`,
      title: "",
      description: "",
      excerpt: "",
      content: "",
      category: "Kiến thức AI",
      readTime: 5,
      author: "AI MỞ Studio",
      status: "published",
      featured: false,
      sortOrder: articles.length + 1,
      image: "/images/blog/12-skill-claude-code.jpg",
      accent: "#0057ff",
      seo: { title: "", description: "" },
    };
    setEditing(newArt);
    setIsNew(true);
    setActiveTab("edit");
  };

  const startEdit = (article: CmsArticle) => {
    setEditing(structuredClone(article));
    setIsNew(false);
    setActiveTab("edit");
  };

  const toSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  };

  const handleTitleChange = (val: string) => {
    if (!editing) return;
    const patch: Partial<CmsArticle> = { title: val };
    if (isNew) {
      patch.slug = toSlug(val);
      patch.description = val;
    }
    setEditing({ ...editing, ...patch });
  };

  // Insert image markdown tag into content at cursor position
  const insertImageTag = (caption: string, url: string) => {
    if (!editing) return;
    const tag = `\n\n![${caption}](${url})\n\n`;
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const current = editing.content;
      const updated = current.substring(0, start) + tag + current.substring(end);
      setEditing({ ...editing, content: updated });
    } else {
      setEditing({ ...editing, content: editing.content + tag });
    }
    showToast("Đã chèn ảnh vào bài viết ✓");
  };

  // Handle in-content image upload
  const handleContentImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const caption = file.name.replace(/\.[^/.]+$/, "");
      insertImageTag(caption, result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Handle banner image upload
  const handleBannerImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    const reader = new FileReader();
    reader.onload = () => {
      setEditing({ ...editing, image: reader.result as string });
      showToast("Đã cập nhật ảnh bìa đại diện ✓");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const saveArticle = async () => {
    if (!editing) return;
    if (!editing.title.trim()) {
      showToast("Vui lòng nhập tiêu đề bài viết!");
      return;
    }
    if (!editing.slug.trim()) {
      showToast("Vui lòng nhập slug bài viết!");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        ...editing,
        description: editing.description || editing.excerpt || editing.title,
        seo: {
          title: editing.seo?.title || editing.title,
          description: editing.seo?.description || editing.excerpt || editing.title,
        },
      };

      const url = isNew
        ? "/api/admin/cms/articles"
        : `/api/admin/cms/articles/${encodeURIComponent(editing.id)}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể lưu bài viết.");
      }

      if (isNew) {
        setArticles([data, ...articles]);
        showToast("Đã xuất bản bài viết mới thành công!");
      } else {
        setArticles(articles.map((item) => (item.id === data.id ? data : item)));
        showToast("Đã cập nhật bài viết thành công!");
      }
      setEditing(null);
    } catch (err: any) {
      showToast(err.message || "Lỗi lưu bài viết.");
    } finally {
      setBusy(false);
    }
  };

  const deleteArticle = async (article: CmsArticle) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bài viết "${article.title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/cms/articles/${encodeURIComponent(article.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Không thể xóa bài viết.");
      setArticles(articles.filter((a) => a.id !== article.id));
      showToast(`Đã xóa "${article.title}".`);
    } catch (err: any) {
      showToast(err.message || "Lỗi xóa bài.");
    }
  };

  const toggleStatus = async (article: CmsArticle) => {
    const nextStatus = article.status === "published" ? "draft" : "published";
    try {
      const res = await fetch(`/api/admin/cms/articles/${encodeURIComponent(article.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...article, status: nextStatus }),
      });
      if (!res.ok) throw new Error("Không thể đổi trạng thái.");
      const updated = await res.json();
      setArticles(articles.map((a) => (a.id === updated.id ? updated : a)));
      showToast(nextStatus === "published" ? "Đã xuất bản công khai" : "Đã chuyển về bản nháp");
    } catch (err: any) {
      showToast(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0c1526] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 font-bold text-sm animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Bar: Search & Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề, danh mục hoặc slug..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-[#0057ff] focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0057ff] hover:bg-[#0043c7] text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Viết bài mới</span>
        </button>
      </div>

      {/* Articles Table */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase font-extrabold border-b border-neutral-200">
              <tr>
                <th className="px-5 py-3.5">Tiêu đề bài viết</th>
                <th className="px-4 py-3.5">Danh mục</th>
                <th className="px-4 py-3.5">Thời lượng</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-bold text-neutral-900 line-clamp-1">{a.title}</div>
                    <div className="text-xs text-neutral-400 font-mono mt-0.5">/guides/{a.slug}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-[#0057ff]">
                      {a.category}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-neutral-500 flex items-center gap-1.5 pt-5">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{a.readTime} phút đọc</span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                        a.status === "published"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {a.status === "published" ? "Đã xuất bản" : "Bản nháp"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/guides/${a.slug}`}
                        target="_blank"
                        className="p-1.5 text-neutral-500 hover:text-[#0057ff] hover:bg-neutral-100 rounded-lg transition-colors"
                        title="Xem bài viết trên web"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleStatus(a)}
                        className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                        title={a.status === "published" ? "Ẩn bài" : "Xuất bản"}
                      >
                        {a.status === "published" ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(a)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Chỉnh sửa bài viết"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteArticle(a)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa bài viết"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-neutral-400">
                    Không tìm thấy bài viết nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Modal Editor with Live Preview & Image Uploader */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <h2 className="text-xl font-black text-neutral-900 flex items-center gap-2">
                  <span>{isNew ? "Viết bài chia sẻ mới" : "Chỉnh sửa bài viết"}</span>
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Đăng tải lên mục Kiến thức AI (/guides) chuẩn SEO & GEO
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-2 text-neutral-400 hover:text-neutral-700 rounded-xl hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-sm">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Tiêu đề bài viết *
                </label>
                <input
                  type="text"
                  value={editing.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Ví dụ: Cẩm nang 12 Skill Claude Code cho dân Vibe Coding..."
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:border-[#0057ff] outline-none font-bold text-base"
                />
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Slug đường dẫn (URL) *
                  </label>
                  <input
                    type="text"
                    value={editing.slug}
                    onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                    className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Danh mục
                  </label>
                  <input
                    type="text"
                    value={editing.category}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    placeholder="Kiến thức AI, Kỹ năng, Hướng dẫn..."
                    className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Thời gian đọc (phút)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editing.readTime}
                    onChange={(e) => setEditing({ ...editing, readTime: Number(e.target.value) || 5 })}
                    className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Featured Image (Ảnh bìa) Section */}
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#0057ff]" />
                    <span>Ảnh bìa đại diện (Featured Thumbnail)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg text-xs font-bold text-neutral-700 shadow-2xs transition-colors cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-[#0057ff]" />
                    <span>Chọn ảnh từ máy tính</span>
                  </button>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerImageFile}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={editing.image || ""}
                    onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                    placeholder="URL ảnh hoặc /images/blog/..."
                    className="flex-1 px-3 py-1.5 bg-white border border-neutral-200 rounded-xl text-xs font-mono"
                  />
                  {editing.image && (
                    <div className="w-14 h-10 rounded-lg overflow-hidden border border-neutral-200 shrink-0 bg-white">
                      <img
                        src={editing.image}
                        alt="Preview ảnh bìa"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Tóm tắt ngắn (Excerpt)
                </label>
                <textarea
                  rows={2}
                  value={editing.excerpt}
                  onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                  placeholder="Đoạn văn ngắn xuất hiện trên thẻ tóm tắt..."
                  className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl outline-none text-xs"
                />
              </div>

              {/* Content Editor Toolbar & Live Preview Switcher */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-neutral-100">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab("edit")}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        activeTab === "edit"
                          ? "bg-[#0057ff] text-white"
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Soạn thảo Markdown</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("preview")}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        activeTab === "preview"
                          ? "bg-[#0057ff] text-white"
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem trước bài viết (Live Preview)</span>
                    </button>
                  </div>

                  {activeTab === "edit" && (
                    <div className="flex items-center gap-2">
                      {/* Insert Image Button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0057ff] rounded-lg text-xs font-bold border border-blue-200 transition-colors cursor-pointer"
                        title="Tải ảnh từ máy tính chèn vào bài viết"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>🖼️ Chèn ảnh vào bài viết</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleContentImageFile}
                      />
                    </div>
                  )}
                </div>

                {/* Edit Mode */}
                {activeTab === "edit" && (
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      rows={14}
                      value={editing.content}
                      onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                      placeholder="Viết nội dung bài viết theo cú pháp Markdown:
# Tiêu đề lớn
## Tiêu đề con
- Gạch đầu dòng
![Mô tả ảnh](url-anh)
| Bảng | Cột |..."
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none font-mono text-xs sm:text-sm leading-relaxed focus:bg-white focus:border-[#0057ff]"
                    />
                  </div>
                )}

                {/* Preview Mode */}
                {activeTab === "preview" && (
                  <div className="min-h-[360px] max-h-[500px] overflow-y-auto p-5 bg-white border border-neutral-200 rounded-2xl shadow-inner">
                    {editing.image && (
                      <div className="mb-6 overflow-hidden rounded-2xl border border-neutral-200 shadow-xs max-h-[340px]">
                        <img
                          src={editing.image}
                          alt={editing.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <h1 className="text-2xl font-black text-neutral-900 mb-3">{editing.title || "Tiêu đề bài viết"}</h1>
                    <p className="text-neutral-500 text-sm mb-6 pb-4 border-b border-neutral-100">{editing.excerpt}</p>
                    <ArticleMarkdown content={editing.content || "*Chưa có nội dung.*"} />
                  </div>
                )}
              </div>

              {/* Status & Author */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={editing.status}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-semibold"
                  >
                    <option value="published">Đã xuất bản (Công khai)</option>
                    <option value="draft">Bản nháp (Chỉ admin thấy)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Tác giả
                  </label>
                  <input
                    type="text"
                    value={editing.author || "AI MỞ Studio"}
                    onChange={(e) => setEditing({ ...editing, author: e.target.value })}
                    className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-5 py-2.5 rounded-xl text-neutral-600 hover:bg-neutral-100 font-bold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={saveArticle}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0057ff] hover:bg-[#0043c7] text-white rounded-xl font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{isNew ? "Tạo & Xuất bản" : "Lưu thay đổi"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
