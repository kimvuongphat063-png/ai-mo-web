import { notFound, permanentRedirect } from "next/navigation";
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
  Cpu,
  Lock,
  FileCode2,
  HardDrive,
  WifiOff,
  Terminal,
} from "lucide-react";
import { HTML_APPS } from "@/lib/apps-data";
import { getAppManifest } from "@/lib/apps-manifest";
import { getSession } from "@/lib/auth";
import { AppDownloadButton } from "@/components/app-download-button";
import type { Metadata } from "next";

const LEGACY_APP_REDIRECTS: Record<string, string> = {
  "dinh-gia-ban-combo": "/apps/gia-ban-khuyen-mai",
  "tinh-loi-nhuan-don-hang": "/apps/lai-that-tung-don",
};

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
  if (LEGACY_APP_REDIRECTS[slug]) {
    permanentRedirect(LEGACY_APP_REDIRECTS[slug]);
  }
  const app = HTML_APPS.find((a) => a.slug === slug);
  if (!app) return { title: "Không tìm thấy ứng dụng" };

  return {
    title: `${app.title} — App HTML Miễn Phí Chạy Offline`,
    description: `${app.summary} Sử dụng trực tiếp trên web hoặc tải file HTML về máy dùng offline 100% không cần mạng.`,
    alternates: {
      canonical: `https://heyaimo.com/apps/${app.slug}`,
    },
  };
}

export default async function AppDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (LEGACY_APP_REDIRECTS[slug]) {
    permanentRedirect(LEGACY_APP_REDIRECTS[slug]);
  }
  const app = HTML_APPS.find((a) => a.slug === slug);
  if (!app) notFound();

  const session = await getSession();
  const manifest = getAppManifest(app);
  const otherApps = HTML_APPS.filter((a) => a.slug !== slug).slice(0, 3);
  const playUrl = `/html-apps/${app.fileName}`;

  return (
    <main id="main-content" className="container py-8 sm:py-12 space-y-10">
      {/* ── BREADCRUMBS & NAVIGATION ───────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
        <Link href="/" className="hover:text-neutral-900 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <Link href="/apps" className="hover:text-neutral-900 transition-colors">
          App miễn phí
        </Link>
        <span>/</span>
        <span className="text-neutral-900 font-semibold truncate">{app.title}</span>
      </div>

      {/* ── HEADER CARD ────────────────────────────────────────────────── */}
      <section className="bg-white rounded-3xl border border-neutral-200/90 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EAF2FF] text-[#155EEF] border border-[#155EEF]/20">
              {app.suiteLabel}
            </span>
            {app.badge && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-[#155EEF] border border-[#155EEF]/20">
                {app.badge}
              </span>
            )}
            <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              ⚡ {manifest.fileSizeFormatted} · Offline-Ready
            </span>
          </div>

          <div className="flex items-center gap-3">
            <AppDownloadButton
              slug={app.slug}
              title={app.title}
              fileName={app.fileName}
              fileSizeFormatted={manifest.fileSizeFormatted}
              coffeePrice={app.coffeePrice}
              isLoggedIn={Boolean(session)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-neutral-900">
            {app.title}
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed max-w-3xl">
            {app.description}
          </p>
        </div>

        {/* ── TECHNICAL METADATA STRIP ─────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-500 text-[11px] font-semibold uppercase tracking-wider">
              <FileCode2 className="w-3.5 h-3.5 text-[#155EEF]" />
              <span>Dung lượng</span>
            </div>
            <p className="font-mono font-bold text-neutral-900">{manifest.fileSizeFormatted}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-500 text-[11px] font-semibold uppercase tracking-wider">
              <WifiOff className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mạng kết nối</span>
            </div>
            <p className="font-semibold text-emerald-800">100% Offline</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-500 text-[11px] font-semibold uppercase tracking-wider">
              <HardDrive className="w-3.5 h-3.5 text-purple-600" />
              <span>Lưu trữ</span>
            </div>
            <p className="font-semibold text-neutral-900">Cục bộ (LocalStorage)</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-500 text-[11px] font-semibold uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5 text-cyan-600" />
              <span>Động cơ</span>
            </div>
            <p className="font-semibold text-neutral-900 truncate" title={app.engineSpec}>
              {app.engineSpec || "Thuật toán độc lập"}
            </p>
          </div>
        </div>

        {/* Suitable For & Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
          <div className="bg-white rounded-2xl p-4 border border-neutral-200 space-y-1.5">
            <span className="font-bold text-neutral-900 uppercase tracking-wider block text-[11px]">
              🎯 Phù hợp nhất cho:
            </span>
            <p className="text-neutral-600 leading-relaxed">{app.suitableFor}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-neutral-200 space-y-1.5">
            <span className="font-bold text-neutral-900 uppercase tracking-wider block text-[11px]">
              ⚡ Tính năng chính:
            </span>
            <ul className="text-neutral-600 space-y-1">
              {app.highlights.map((h, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#155EEF] shrink-0" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── ONLINE SANDBOX PLAYER ─────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <Laptop className="w-5 h-5 text-[#155EEF]" />
              Dùng thử trực tiếp trên web
            </h2>
            <p className="text-xs text-neutral-500">
              Chạy trong môi trường bảo mật độc lập (Iframe Sandbox - Không gửi dữ liệu)
            </p>
          </div>

          <a
            href={playUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-[#155EEF] hover:underline flex items-center gap-1.5"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Mở toàn màn hình tab mới</span>
          </a>
        </div>

        <div className="w-full bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-md">
          <iframe
            src={playUrl}
            title={app.title}
            className="w-full h-[650px] sm:h-[750px] border-0"
            sandbox="allow-scripts allow-forms allow-downloads allow-modals allow-same-origin"
            loading="lazy"
          />
        </div>
      </section>

      {/* ── USAGE GUIDE & FAQ ─────────────────────────────────────────── */}
      <section className="bg-neutral-50/80 rounded-3xl border border-neutral-200/90 p-6 sm:p-8 space-y-6">
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
              Bạn nhấn nút <strong>Tải file về máy</strong> ở trên. File tải về là một trang HTML độc lập. Bạn chỉ cần click đúp mở bằng Chrome, Safari, Edge hoặc Cốc Cốc để dùng ngay mà không cần internet.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-neutral-900 text-sm">
              Dữ liệu của tôi được lưu ở đâu?
            </h3>
            <p className="leading-relaxed">
              Toàn bộ dữ liệu bạn nhập (đơn hàng, chi phí, học viên, bài tập) được lưu trực tiếp trong bộ nhớ cục bộ (localStorage) của trình duyệt trên máy bạn. AI MỞ không lưu trữ và không bao giờ đọc được dữ liệu này.
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

      {/* ── OTHER APPS RECOMMENDATION ──────────────────────────────────── */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900">
            Các ứng dụng hữu ích khác
          </h2>
          <Link href="/apps" className="text-xs font-bold text-[#155EEF] hover:underline">
            Xem tất cả {HTML_APPS.length} công cụ →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {otherApps.map((oa) => (
            <Link
              key={oa.slug}
              href={`/apps/${oa.slug}`}
              className="p-4 rounded-2xl bg-white border border-neutral-200/90 hover:border-[#155EEF]/40 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">
                  {oa.suiteLabel}
                </span>
                <h3 className="text-sm font-bold text-neutral-900 mt-1 line-clamp-1">
                  {oa.title}
                </h3>
                <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                  {oa.summary}
                </p>
              </div>
              <span className="text-xs font-bold text-[#155EEF] mt-3 block">
                Khám phá ngay →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
