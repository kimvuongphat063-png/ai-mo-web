import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock3 } from "lucide-react";
import { ArticleMarkdown } from "@/components/article-markdown";

import { findCmsArticle, isPublic, readCms } from "@/lib/cms";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await findCmsArticle(slug);
  if (!article) return {};
  return {
    title: article.seo.title || article.title,
    description: article.seo.description || article.description,
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await findCmsArticle(slug);
  if (!article) notFound();

  let articles: any[] = [];
  try {
    const cms = await readCms();
    articles = (cms.articles || []).filter(isPublic).sort((a, b) => a.sortOrder - b.sortOrder);
  } catch (err) {
    console.error("[guides/slug] Failed to read articles:", err);
  }
  const currentIndex = articles.findIndex((item) => item.id === article.id);
  const nextArticle = articles.length > 1 && currentIndex >= 0 ? articles[(currentIndex + 1) % articles.length] : null;

  return (
    <main id="main-content" className="min-h-screen bg-[#FAFBFD] pb-16 sm:pb-24">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        {/* Top Breadcrumb & Back Link */}
        <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-neutral-200/70 text-xs sm:text-sm">
          <Link
            href="/guides"
            className="inline-flex items-center gap-1.5 font-bold text-neutral-600 hover:text-[#0057ff] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Góc học AI</span>
          </Link>
          <div className="flex items-center gap-2 text-neutral-400 text-xs">
            <span>AI MỞ</span>
            <span>/</span>
            <span className="text-neutral-700 font-semibold">{article.category}</span>
          </div>
        </div>

        {/* Article Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2.5 mb-3.5">
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#0057ff] text-xs font-extrabold border border-blue-200/60 uppercase tracking-wide">
              {article.category}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 text-xs font-semibold">
              <Clock3 className="w-3.5 h-3.5 text-neutral-500" />
              <span>{article.readTime} phút đọc</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-black tracking-tight text-neutral-900 leading-[1.25] sm:leading-[1.22] my-3">
            {article.title}
          </h1>

          <div className="flex items-center gap-3 pt-3 text-xs sm:text-sm text-neutral-500">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#0057ff] to-blue-400 flex items-center justify-center text-white text-[11px] font-bold shadow-xs">
              AI
            </div>
            <div>
              <span className="text-neutral-400">Biên soạn bởi </span>
              <strong className="text-neutral-800 font-bold">{article.author || "AI MỞ Studio"}</strong>
            </div>
          </div>

          {/* Lead Summary (Single clean rendering, no duplication) */}
          {(article.description || article.excerpt) && (
            <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-transparent border-l-4 border-[#0057ff] text-neutral-700 text-base sm:text-lg leading-relaxed font-normal shadow-2xs">
              {article.description || article.excerpt}
            </div>
          )}
        </header>

        {/* Featured Cover Image */}
        {article.image && (
          <div className="mb-10 overflow-hidden rounded-2xl sm:rounded-3xl border border-neutral-200/80 bg-white shadow-xs p-1.5 sm:p-2.5">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-auto object-contain max-h-[560px] rounded-xl sm:rounded-2xl mx-auto"
              loading="eager"
            />
          </div>
        )}

        {/* Article Body */}
        <article className="bg-white rounded-2xl sm:rounded-3xl border border-neutral-200/80 p-5 sm:p-8 md:p-12 shadow-xs">
          <ArticleMarkdown content={article.content} />
        </article>

        {/* Next Article Card */}
        {nextArticle && nextArticle.id !== article.id && (
          <section className="mt-12 sm:mt-16 pt-8 border-t border-neutral-200/80" aria-label="Bài viết tiếp theo">
            <div className="text-xs font-extrabold uppercase tracking-widest text-neutral-400 mb-3">
              Bài viết gợi ý tiếp theo
            </div>
            <Link
              href={`/guides/${nextArticle.slug}`}
              className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white border border-neutral-200/90 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#0057ff] bg-blue-50 px-2 py-0.5 rounded-full">
                    {nextArticle.category}
                  </span>
                  <span className="text-xs text-neutral-400">· {nextArticle.readTime} phút đọc</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 group-hover:text-[#0057ff] transition-colors leading-snug">
                  {nextArticle.title}
                </h3>
                {nextArticle.excerpt && (
                  <p className="text-xs sm:text-sm text-neutral-500 line-clamp-2 max-w-2xl m-0">
                    {nextArticle.excerpt}
                  </p>
                )}
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0057ff] group-hover:translate-x-1 transition-transform shrink-0 self-end sm:self-center">
                <span>Đọc bài</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </section>
        )}
      </div>
      {/* JSON-LD Structured Data for Search Engines & GEO (Generative Engines) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: article.title,
            description: article.description,
            image: article.image ? `https://www.heyaimo.com${article.image}` : undefined,
            author: {
              "@type": "Organization",
              name: article.author || "AI MỞ Studio",
              url: "https://www.heyaimo.com",
            },
            publisher: {
              "@type": "Organization",
              name: "AI MỞ",
              url: "https://www.heyaimo.com",
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://www.heyaimo.com/guides/${article.slug}`,
            },
            articleSection: article.category,
            timeRequired: `PT${article.readTime}M`,
          }),
        }}
      />
    </main>
  );
}
