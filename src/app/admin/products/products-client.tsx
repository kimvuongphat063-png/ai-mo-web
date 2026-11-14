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
  Check,
  X,
  Eye,
  EyeOff,
  Loader2,
  Image as ImageIcon,
  UploadCloud,
  Laptop,
  Globe,
  Package,
  BookOpen,
  DollarSign,
  Layers,
} from "lucide-react";
import type { CmsProduct } from "@/lib/cms";

interface Props {
  initialProducts: CmsProduct[];
}

export function AdminProductsClient({ initialProducts }: Props) {
  const [products, setProducts] = useState<CmsProduct[]>(initialProducts);
  const [query, setQuery] = useState("");
  const [selectedKind, setSelectedKind] = useState<string>("all");
  const [editing, setEditing] = useState<any | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const filtered = products.filter((p) => {
    const matchQuery =
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.slug.toLowerCase().includes(query.toLowerCase()) ||
      p.category?.toLowerCase().includes(query.toLowerCase());
    const matchKind = selectedKind === "all" || p.kind === selectedKind;
    return matchQuery && matchKind;
  });

  const startCreate = () => {
    const id = `prod-${Date.now()}`;
    const newProd: any = {
      id,
      slug: `san-pham-${Date.now().toString().slice(-6)}`,
      title: "",
      summary: "",
      description: "",
      longDescription: "",
      kind: "desktop",
      ownership: "owned",
      price: 0,
      compareAt: 0,
      pricingModel: "Thanh toán một lần",
      category: "Công cụ",
      creator: "AI MỞ Studio",
      badge: "HOT",
      rating: 5,
      reviews: 1,
      formats: ["Ứng dụng"],
      features: ["Tự động hóa tác vụ", "Không cần cài đặt phức tạp"],
      updated: "2026",
      status: "published",
      featured: true,
      sortOrder: products.length + 1,
      image: "/images/home/card-profit-calc.jpg",
      accent: "#0057ff",
      platform: ["Windows 10/11", "macOS"],
      requirements: ["RAM 4GB trở lên"],
      changelog: ["Bản phát hành chính thức 2026"],
      seo: { title: "", description: "" },
    };
    setEditing(newProd);
    setIsNew(true);
  };

  const startEdit = (product: CmsProduct) => {
    setEditing(structuredClone(product));
    setIsNew(false);
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
    const patch: any = { title: val };
    if (isNew) {
      patch.slug = toSlug(val);
      patch.summary = val;
      patch.description = val;
      patch.longDescription = val;
    }
    setEditing({ ...editing, ...patch });
  };

  const handleThumbnailFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    const reader = new FileReader();
    reader.onload = () => {
      setEditing({ ...editing, image: reader.result as string });
      showToast("Đã chọn ảnh sản phẩm ✓");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const saveProduct = async () => {
    if (!editing) return;
    if (!editing.title.trim()) {
      showToast("Vui lòng nhập tên sản phẩm!");
      return;
    }
    if (!editing.slug.trim()) {
      showToast("Vui lòng nhập slug URL!");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        ...editing,
        summary: editing.summary || editing.description || editing.title,
        description: editing.description || editing.summary || editing.title,
        longDescription: editing.longDescription || editing.description || editing.title,
        price: Number(editing.price) || 0,
        compareAt: editing.compareAt ? Number(editing.compareAt) : undefined,
        seo: {
          title: editing.seo?.title || editing.title,
          description: editing.seo?.description || editing.summary || editing.title,
        },
      };

      const url = isNew
        ? "/api/admin/cms/products"
        : `/api/admin/cms/products/${encodeURIComponent(editing.id)}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể lưu sản phẩm.");
      }

      if (isNew) {
        setProducts([data, ...products]);
        showToast("Đã tạo sản phẩm số mới thành công!");
      } else {
        setProducts(products.map((item) => (item.id === data.id ? data : item)));
        showToast("Đã cập nhật sản phẩm thành công!");
      }
      setEditing(null);
    } catch (err: any) {
      showToast(err.message || "Lỗi lưu sản phẩm.");
    } finally {
      setBusy(false);
    }
  };

  const deleteProduct = async (product: CmsProduct) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${product.title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/cms/products/${encodeURIComponent(product.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Không thể xóa sản phẩm.");
      setProducts(products.filter((p) => p.id !== product.id));
      showToast(`Đã xóa "${product.title}".`);
    } catch (err: any) {
      showToast(err.message || "Lỗi xóa sản phẩm.");
    }
  };

  const toggleStatus = async (product: CmsProduct) => {
    const nextStatus = product.status === "published" ? "draft" : "published";
    try {
      const res = await fetch(`/api/admin/cms/products/${encodeURIComponent(product.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...product, status: nextStatus }),
      });
      if (!res.ok) throw new Error("Không thể đổi trạng thái.");
      const updated = await res.json();
      setProducts(products.map((p) => (p.id === updated.id ? updated : p)));
      showToast(nextStatus === "published" ? "Đã xuất bản sản phẩm" : "Đã chuyển về bản nháp");
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const formatMoney = (n: number) => {
    if (n === 0) return "Miễn phí";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0c1526] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 font-bold text-sm animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Filter & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên sản phẩm, danh mục..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-[#0057ff]"
            />
          </div>

          <select
            value={selectedKind}
            onChange={(e) => setSelectedKind(e.target.value)}
            className="px-3 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-700 outline-none"
          >
            <option value="all">Tất cả loại ({products.length})</option>
            <option value="desktop">App Desktop</option>
            <option value="webapp">App Trực tuyến</option>
            <option value="resource">Tài nguyên số / Template</option>
            <option value="course">Khóa học</option>
            <option value="bundle">Gói Combo / Bundle</option>
          </select>
        </div>

        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0057ff] hover:bg-[#0043c7] text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm sản phẩm số mới</span>
        </button>
      </div>

      {/* Products Grid Table */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase font-extrabold border-b border-neutral-200">
              <tr>
                <th className="px-5 py-3.5">Tên sản phẩm</th>
                <th className="px-4 py-3.5">Loại hình</th>
                <th className="px-4 py-3.5">Giá bán</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0057ff] shrink-0 font-bold text-xs">
                        {p.kind === "desktop" ? (
                          <Laptop className="w-5 h-5" />
                        ) : p.kind === "webapp" ? (
                          <Globe className="w-5 h-5" />
                        ) : p.kind === "course" ? (
                          <BookOpen className="w-5 h-5" />
                        ) : (
                          <Package className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-neutral-900 line-clamp-1">{p.title}</div>
                        <div className="text-xs text-neutral-400 font-mono">
                          {p.badge && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-50 text-[#0057ff] mr-1.5">
                              {p.badge}
                            </span>
                          )}
                          {p.category}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-semibold bg-neutral-100 text-neutral-700 capitalize">
                      {p.kind === "desktop"
                        ? "App Desktop (Máy tính)"
                        : p.kind === "webapp"
                        ? "Ứng dụng Web"
                        : p.kind === "course"
                        ? "Khóa học"
                        : p.kind === "resource"
                        ? "Tài nguyên / File"
                        : p.kind === "bundle"
                        ? "Gói Combo"
                        : p.kind}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-bold text-neutral-900 text-xs">
                    {formatMoney(p.price)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                        p.status === "published"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {p.status === "published" ? "Đang bán" : "Bản nháp"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/products`}
                        target="_blank"
                        className="p-1.5 text-neutral-500 hover:text-[#0057ff] hover:bg-neutral-100 rounded-lg transition-colors"
                        title="Xem trang sản phẩm"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleStatus(p)}
                        className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                        title={p.status === "published" ? "Ẩn sản phẩm" : "Mở bán"}
                      >
                        {p.status === "published" ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(p)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Chỉnh sửa sản phẩm"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProduct(p)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa sản phẩm"
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
                    Chưa có sản phẩm nào trong danh mục này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Edit / Create Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-7 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <h2 className="text-xl font-black text-neutral-900">
                  {isNew ? "Thêm sản phẩm số mới" : "Chỉnh sửa sản phẩm"}
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Quản lý ứng dụng desktop, webapp, tài nguyên số hoặc khóa học
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

            <div className="space-y-4 text-sm">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Tên sản phẩm *
                </label>
                <input
                  type="text"
                  value={editing.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Ví dụ: PromptDesk — Ứng dụng Desktop tạo kịch bản AI..."
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:border-[#0057ff] font-bold text-base"
                />
              </div>

              {/* Grid 1: Slug, Kind, Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Slug URL *
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
                    Loại sản phẩm *
                  </label>
                  <select
                    value={editing.kind}
                    onChange={(e) => setEditing({ ...editing, kind: e.target.value })}
                    className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-semibold"
                  >
                    <option value="desktop">App Desktop (Máy tính)</option>
                    <option value="webapp">Ứng dụng Web trực tuyến</option>
                    <option value="resource">Tài nguyên số (File/Template)</option>
                    <option value="course">Khóa học thực chiến</option>
                    <option value="bundle">Gói combo (Bundle)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Danh mục
                  </label>
                  <input
                    type="text"
                    value={editing.category || "Công cụ"}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Grid 2: Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Giá bán (VNĐ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={editing.price ?? 0}
                    onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-bold"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">Điền 0 nếu chia sẻ miễn phí</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Giá gốc niêm yết (nếu giảm giá)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={editing.compareAt || ""}
                    onChange={(e) => setEditing({ ...editing, compareAt: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Ví dụ: 499000"
                    className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Badge nổi bật
                  </label>
                  <input
                    type="text"
                    value={editing.badge || ""}
                    onChange={(e) => setEditing({ ...editing, badge: e.target.value })}
                    placeholder="HOT, PRO, MIỄN PHÍ..."
                    className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Thumbnail Image */}
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#0057ff]" />
                    <span>Ảnh minh họa sản phẩm (Thumbnail)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg text-xs font-bold text-neutral-700 shadow-2xs transition-colors cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-[#0057ff]" />
                    <span>Chọn ảnh từ máy tính</span>
                  </button>
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleThumbnailFile}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={editing.image || ""}
                    onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                    placeholder="URL ảnh hoặc /images/home/..."
                    className="flex-1 px-3 py-1.5 bg-white border border-neutral-200 rounded-xl text-xs font-mono"
                  />
                  {editing.image && (
                    <div className="w-14 h-10 rounded-lg overflow-hidden border border-neutral-200 shrink-0 bg-white">
                      <img
                        src={editing.image}
                        alt="Preview sản phẩm"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Description */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Mô tả ngắn sản phẩm *
                </label>
                <textarea
                  rows={2}
                  value={editing.summary || editing.description || ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      summary: e.target.value,
                      description: e.target.value,
                    })
                  }
                  placeholder="Giới thiệu công dụng chính của ứng dụng / sản phẩm này..."
                  className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl outline-none text-xs"
                />
              </div>

              {/* Features list (Each line one feature) */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Tính năng nổi bật (Mỗi dòng một tính năng)
                </label>
                <textarea
                  rows={3}
                  value={(editing.features || []).join("\n")}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      features: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="Tính năng 1: Tạo kịch bản TikTok 30s tự động
Tính năng 2: Xuất file kịch bản DOCX/MD
Tính năng 3: Chạy offline an toàn 100%"
                  className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl outline-none text-xs font-mono"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Trạng thái mở bán
                </label>
                <select
                  value={editing.status}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value as any })}
                  className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-semibold"
                >
                  <option value="published">Đang mở bán (Hiển thị công khai)</option>
                  <option value="draft">Bản nháp (Tạm ẩn)</option>
                </select>
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
                onClick={saveProduct}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0057ff] hover:bg-[#0043c7] text-white rounded-xl font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{isNew ? "Tạo sản phẩm" : "Lưu thay đổi"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
