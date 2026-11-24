import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, Sparkles, Plus, BookOpen, Flame, CheckCircle2 } from "lucide-react";

import { isPublic, readCms, type CmsArticle } from "@/lib/cms";
import { getSession } from "@/lib/auth";

/* ── Modern Tech Editorial Card for Standard Articles ── */
function ArticleCard({ article }: { article: CmsArticle }) {
  return (
    <Link
      id={`article-${article.slug}`}
      href={`/guides/${article.slug}`}
      className="group relative bg-[#101420]/90 backdrop-blur-xl border border-white/10 hover:border-[#f59e0b]/60 rounded-3xl overflow-hidden shadow-lg hover:shadow-[0_15px_40px_rgba(245,158,11,0.15)] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5"
    >
      <div>
        {/* Cover Image Header (16:9) */}
        <div className="relative w-full aspect-[16/9] overflow-hidden bg-neutral-950 border-b border-white/10">
          {article.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1e1035] to-[#0f172a] flex items-center justify-center">
              <span className="font-mono text-xl font-bold text-[#f59e0b]">AI MỞ GUIDES</span>
            </div>
          )}

          {/* Category Pill Tag (Top Left) */}
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#090c14]/85 backdrop-blur-md text-[#f59e0b] border border-[#f59e0b]/40 shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-mascot-ring" />
              {article.category}
            </span>
          </div>

          {/* Read Time Tag (Top Right) */}
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-mono font-semibold bg-black/80 backdrop-blur-md text-slate-300 border border-white/15">
              <Clock3 className="w-3 h-3 text-slate-400" />
              {article.readTime} phút
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 sm:p-6 space-y-2.5">
          <h2 className="text-base sm:text-lg font-black text-white group-hover:text-[#f59e0b] transition-colors leading-snug line-clamp-2">
            {article.title}
          </h2>
          <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed line-clamp-2">
            {article.excerpt}
          </p>
        </div>
      </div>

      {/* Card Footer: Author + CTA */}
      <div className="px-5 sm:px-6 pb-5 pt-3 border-t border-white/8 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mascot/v2-mascot-avatar.png"
            alt="AI Mở"
            className="w-5 h-5 rounded-full object-cover border border-[#f59e0b]/40"
          />
          <span className="font-mono text-slate-400 text-[11px]">AI MỞ Studio</span>
        </div>

        <span className="inline-flex items-center gap-1 font-bold text-[#f59e0b] group-hover:translate-x-1 transition-transform">
          <span>Đọc bài</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  );
}

/* ── High-Impact Featured Spotlight Card ── */
function FeaturedSpotlightCard({ article }: { article: CmsArticle }) {
  return (
    <Link
      id={`article-${article.slug}`}
      href={`/guides/${article.slug}`}
      className="group relative block bg-[#101420]/95 backdrop-blur-2xl border-2 border-[#f59e0b]/40 hover:border-[#f59e0b] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] transition-all duration-300 hover:shadow-[0_25px_60px_rgba(245,158,11,0.2)] hover:-translate-y-1 p-5 sm:p-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
        {/* Left Column: Cover Image */}
        <div className="lg:col-span-6 relative aspect-[16/10] rounded-2xl overflow-hidden bg-neutral-950 border border-white/10 shadow-lg group-hover:border-[#f59e0b]/40 transition-colors">
          {article.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          )}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#090c14]/90 backdrop-blur-md text-[#d4ff00] border border-[#d4ff00]/40 shadow-lg">
              <Flame className="w-3.5 h-3.5 text-[#d4ff00] animate-pulse" />
              SPOTLIGHT · BÀI ĐỌC NHIỀU NHẤT
            </span>
          </div>
        </div>

        {/* Right Column: Editorial Summary */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/35">
              {article.category}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono text-slate-400 bg-white/5 border border-white/10">
              <Clock3 className="w-3.5 h-3.5" />
              {article.readTime} phút đọc
            </span>
          </div>

          <h2 className="text-xl sm:text-3xl font-black text-white group-hover:text-[#f59e0b] transition-colors leading-tight">
            {article.title}
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed line-clamp-3">
            {article.excerpt}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#f59e0b] group-hover:bg-amber-400 text-black font-extrabold text-xs sm:text-sm shadow-md shadow-[#f59e0b]/25 transition-all group-hover:scale-105">
              <span>Đọc bài viết ngay</span>
              <ArrowRight className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Đầy đủ Prompt mẫu & Code
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function Page() {
  const session = await getSession();
  const isAdmin = session?.role === "admin";
  let articles: CmsArticle[] = [];
  try {
    const cms = await readCms();
    articles = (cms.articles || [])
      .filter(isPublic)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch (err) {
    console.error("[guides] Failed to read articles from CMS:", err);
  }
  const featured = articles.find((article) => article.featured) || articles[0];
  const rest = featured ? articles.filter((article) => article.id !== featured.id) : [];
  const categories = [...new Set(articles.map((article) => article.category))];

  return (
    <main id="main-content" className="container py-8 sm:py-12 space-y-12 max-w-7xl mx-auto px-4 sm:px-6">
      {isAdmin && (
        <aside className="bg-blue-50 border-b border-blue-200 py-2.5 px-4 rounded-2xl" aria-label="Thanh quản trị">
          <div className="container flex items-center justify-between text-xs font-semibold text-blue-900">
            <span className="flex items-center gap-1.5 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#0057ff]" />
              Bạn đang đăng nhập quyền Quản trị viên
            </span>
            <Link
              href="/admin/articles"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0057ff] hover:bg-[#0043c7] text-white rounded-lg font-bold shadow-xs transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Viết bài mới & Quản lý Blog</span>
            </Link>
          </div>
        </aside>
      )}

      {/* ── HERO BANNER: SCHOLAR MASCOT STAGE ── */}
      <section className="relative overflow-hidden rounded-3xl bg-[#101420]/90 backdrop-blur-2xl border border-[#f59e0b]/30 p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        {/* Subtle Tech Grid */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none" 
          style={{ backgroundImage: "linear-gradient(rgba(245,158,11,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.15) 1px, transparent 1px)", backgroundSize: "32px 32px" }} 
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Góc Học AI & Lộ Trình Thực Chiến · AI MỞ Studio</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-[1.15]">
              Học AI Bằng Cách{" "}
              <span className="text-[#f59e0b] drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]">Tạo Ra Sản Phẩm Thật</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              Những bài hướng dẫn thực chiến, giải quyết bài toán thật, không lý thuyết suông. Đọc xong là thực hành tạo ra sản phẩm được ngay.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="text-2xl font-black text-[#f59e0b] font-mono">{articles.length.toString().padStart(2, "0")}</span>
              <span className="text-xs text-slate-400 font-semibold leading-tight">bài viết & hướng dẫn<br />chọn lọc thực chiến</span>
            </div>
          </div>

          {/* Right: Themed Scholar Mascot Host */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center relative">
            <div className="mb-3 px-3.5 py-1.5 rounded-2xl bg-[#090c14]/90 border border-[#f59e0b]/40 text-center shadow-lg backdrop-blur-md animate-fade-in max-w-[260px]">
              <p className="text-[11.5px] font-mono text-[#f59e0b] font-semibold leading-snug">
                🎓 "Học từ gốc, hiểu bản chất, tạo ra kết quả thực tế!"
              </p>
            </div>
            <div className="relative w-full max-w-[220px] h-[230px] sm:h-[260px] flex items-end justify-center group select-none active:scale-95 transition-transform">
              <div className="absolute bottom-2 w-36 h-8 rounded-[100%] border border-[#f59e0b]/50 bg-[#f59e0b]/20 blur-[2px] animate-pulse" />
              <div className="absolute bottom-0 w-24 h-4 rounded-[100%] bg-[#f59e0b]/40 blur-lg" />
              <Image
                src="/mascot/v2-fullbody-guides.png"
                alt="Linh vật Học AI Mở"
                width={200}
                height={424}
                className="relative z-10 w-auto h-full max-h-[210px] sm:max-h-[230px] object-contain object-bottom drop-shadow-[0_15px_30px_rgba(0,0,0,0.95)] group-hover:scale-110 active:scale-110 active:-translate-y-2 transition-all duration-300 animate-mascot-float-3"
                priority
              />
            </div>
            <span className="mt-1 text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
              AI MỞ · SCHOLAR HOST
            </span>
          </div>
        </div>
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 bg-radial from-[#f59e0b]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* ── TOPICS FILTER PILL BAR ── */}
      <nav className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none" aria-label="Chủ đề bài viết">
        <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mr-2 shrink-0">
          Chủ đề:
        </span>
        {categories.map((category) => {
          const firstArticle = articles.find((article) => article.category === category);
          return (
            firstArticle && (
              <a
                href={`#article-${firstArticle.slug}`}
                key={category}
                className="px-4 py-2 rounded-full text-xs font-bold transition-all border border-white/10 hover:border-[#f59e0b] hover:text-[#f59e0b] bg-white/5 hover:bg-[#f59e0b]/10 shrink-0 text-slate-300"
              >
                {category}
              </a>
            )
          );
        })}
      </nav>

      {/* ── FEATURED SPOTLIGHT ARTICLE ── */}
      {featured && (
        <section className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5 font-bold text-white">
              <Sparkles className="w-4 h-4 text-[#f59e0b]" />
              Bài viết tâm điểm
            </span>
            <span className="text-[#f59e0b] font-bold">01 / {articles.length}</span>
          </div>
          <FeaturedSpotlightCard article={featured} />
        </section>
      )}

      {/* ── ARTICLES LIBRARY GRID (3 COLUMNS) ── */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#f59e0b] uppercase tracking-wider mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Thư viện thực hành</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Đọc theo việc bạn đang làm.</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md">
            Mỗi bài là một khung tư duy nhỏ: rõ ràng, thực dụng và có thể áp dụng ngay hôm nay.
          </p>
        </div>

        {rest.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((article) => (
              <ArticleCard article={article} key={article.id} />
            ))}
          </div>
        ) : (
          <p className="text-center py-12 text-slate-400 font-mono text-sm bg-white/5 rounded-3xl border border-white/10">
            Bài viết mới đang được biên tập. Hãy quay lại sau.
          </p>
        )}
      </section>
    </main>
  );
}
