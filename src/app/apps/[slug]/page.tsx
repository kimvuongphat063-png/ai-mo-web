import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Download,
  ShieldCheck,
  CheckCircle2,
  Maximize2,
  ArrowLeft,
  Sparkles,
  Info,
  HelpCircle,
  Laptop,
} from "lucide-react";
import { HTML_APPS } from "@/lib/apps-data";
import type { Metadata } from "next";

export function generateStaticParams() {
  return HTML_APPS.map((app) => ({
    slug: app.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const app = HTML_APPS.find((a) => a.slug === slug);
  if (!app) return { title: "Không tìm thấy ứng dụng" };

  return {
    title: `${app.title} — App HTML Miễn Phí`,
    description: `${app.summary} Sử dụng trực tiếp trên web hoặc tải file HTML về máy dùng offline không cần mạng.`,
    alternates: {
      canonical: `https://ai-mo-web.vercel.app/apps/${app.slug}`,
    },
  };
}

export default async function AppDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const app = HTML_APPS.find((a) => a.slug === slug);
  if (!app) notFound();

  const otherApps = HTML_APPS.filter((a) => a.slug !== slug).slice(0, 3);
  const downloadUrl = `/html-apps/${app.fileName}`;

  return (
    <main id="main-content" className="container py-8 sm:py-12 space-y-10">
      {/* Breadcrumbs & Navigation */}
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <Link href="/" className="hover:text-neutral-900 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <Link href="/apps" className="hover:text-neutral-900 transition-colors">
          App miễn phí
        </Link>
        <span>/</span>
        <span className="text-neutral-900 font-medium truncate">{app.title}</span>
      </div>

      {/* Header Info */}
      <section className="bg-white rounded-3xl border border-neutral-200/90 p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {app.categoryLabel}
            </span>
            {app.badge && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {app.badge}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <a
              href={downloadUrl}
              download={app.fileName}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file về máy (.html)</span>
            </a>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900">
            {app.title}
          </h1>
          <p className="text-base text-neutral-600 leading-relaxed max-w-3xl">
            {app.description}
          </p>
        </div>

        {/* Suitable For & Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-neutral-100 text-xs">
          <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100 space-y-1.5">
            <span className="font-bold text-neutral-900 uppercase tracking-wider block text-[11px]">
              🎯 Phù hợp nhất cho:
            </span>
            <p className="text-neutral-600 leading-relaxed">{app.suitableFor}</p>
          </div>
          <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100 space-y-1.5">
            <span className="font-bold text-neutral-900 uppercase tracking-wider block text-[11px]">
              ⚡ Tính năng chính:
            </span>
            <ul className="text-neutral-600 space-y-1">
              {app.highlights.map((h, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Security badge notice */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 pt-2">
          <span className="flex items-center gap-1 text-emerald-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            An toàn: Không gửi dữ liệu ra máy chủ ngoài
          </span>
          <span className="flex items-center gap-1 text-neutral-600">
            <Info className="w-4 h-4 text-neutral-400" />
            Dữ liệu được lưu trong trình duyệt của bạn (localStorage)
          </span>
        </div>
      </section>

      {/* Online Sandbox Player */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <Laptop className="w-5 h-5 text-blue-600" />
              Dùng thử trực tiếp trên web
            </h2>
            <p className="text-xs text-neutral-500">
              Chạy trong môi trường bảo mật độc lập (Iframe Sandbox)
            </p>
          </div>
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Mở toàn màn hình tab mới
          </a>
        </div>

        <div className="w-full bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm">
          <iframe
            src={downloadUrl}
            title={app.title}
            className="w-full h-[640px] sm:h-[720px] border-0"
            sandbox="allow-scripts allow-forms allow-downloads"
            loading="lazy"
          />
        </div>
      </section>

      {/* Usage Guide & FAQ */}
      <section className="bg-neutral-50 rounded-3xl border border-neutral-200 p-6 sm:p-8 space-y-6">
        <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-neutral-700" />
          Hướng dẫn & Câu hỏi thường gặp
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-neutral-600">
          <div className="space-y-2">
            <h3 className="font-bold text-neutral-900 text-sm">
              Làm thế nào để dùng khi không có mạng?
            </h3>
            <p className="leading-relaxed">
              Bạn nhấn nút <strong>Tải file về máy</strong> ở trên. File tải về là một trang HTML độc lập. Bạn chỉ cần click đúp mở bằng Chrome, Cốc Cốc, Safari hoặc Edge để dùng ngay mà không cần kết nối internet.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-neutral-900 text-sm">
              Dữ liệu của tôi được lưu ở đâu?
            </h3>
            <p className="leading-relaxed">
              Toàn bộ dữ liệu bạn nhập (đơn hàng, chi phí, học viên, bài tập) được lưu trực tiếp trong bộ nhớ cục bộ (localStorage) của trình duyệt trên máy bạn. AI Mở không lưu trữ và không bao giờ đọc được dữ liệu này.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-neutral-900 text-sm">
              Làm sao để chuyển dữ liệu sang máy khác?
            </h3>
            <p className="leading-relaxed">
              Trong mỗi ứng dụng đều có nút <strong>Sao lưu JSON</strong> hoặc <strong>Xuất dữ liệu</strong>. Khi sang máy mới, bạn chỉ cần mở app và bấm <strong>Khôi phục dữ liệu</strong> để nạp lại toàn bộ.
            </p>
          </div>
        </div>
      </section>

      {/* Other Apps Recommendation */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900">
            Các ứng dụng hữu ích khác
          </h2>
          <Link href="/apps" className="text-xs font-semibold text-blue-600 hover:underline">
            Xem tất cả
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {otherApps.map((oa) => (
            <Link
              key={oa.slug}
              href={`/apps/${oa.slug}`}
              className="p-4 rounded-2xl bg-white border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold text-neutral-500 uppercase">
                  {oa.categoryLabel}
                </span>
                <h3 className="text-sm font-bold text-neutral-900 mt-1 line-clamp-1">
                  {oa.title}
                </h3>
                <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                  {oa.summary}
                </p>
              </div>
              <span className="text-xs font-semibold text-blue-600 mt-3 block">
                Dùng thử →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
