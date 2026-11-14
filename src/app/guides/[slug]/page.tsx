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

  const articles = (await readCms()).articles.filter(isPublic).sort((a, b) => a.sortOrder - b.sortOrder);
  const currentIndex = articles.findIndex((item) => item.id === article.id);
  const nextArticle = articles[(currentIndex + 1) % articles.length];

  return (
    <main id="main-content" className="article-page">
      <header className="article-header container">
        <Link href="/guides" className="article-back"><ArrowLeft aria-hidden="true" />Góc học AI</Link>
        <div className="article-heading">
          <div className="article-kicker"><span>{article.category}</span><span><Clock3 aria-hidden="true" /> {article.readTime} phút đọc</span></div>
          <h1>{article.title}</h1>
          <p>{article.excerpt}</p>
          <div className="article-byline"><span>Biên soạn bởi</span><strong>{article.author}</strong></div>
        </div>
      </header>

      <div className="article-rule container" aria-hidden="true"><span>AI MỞ / THỰC HÀNH</span><i /></div>

      <article className="article-content container">
        <aside aria-label="Thông tin bài viết">
          <span>Chủ đề</span>
          <strong>{article.category}</strong>
          <span>Thời gian</span>
          <strong>{article.readTime} phút</strong>
        </aside>
        <div className="article-prose">
          <p className="article-lead">{article.description}</p>
          {article.image && (
            <div className="mb-8 overflow-hidden rounded-2xl border border-neutral-200/80 shadow-xs">
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-auto object-cover max-h-[520px]"
                loading="eager"
              />
            </div>
          )}
          <ArticleMarkdown content={article.content} />
        </div>
      </article>

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
              logo: {
                "@type": "ImageObject",
                url: "https://www.heyaimo.com/favicon.ico",
              },
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

      {nextArticle && nextArticle.id !== article.id && (
        <section className="article-next container" aria-label="Bài viết tiếp theo">
          <span>Đọc tiếp</span>
          <Link href={`/guides/${nextArticle.slug}`}><span>{nextArticle.category}</span><strong>{nextArticle.title}</strong><ArrowRight aria-hidden="true" /></Link>
        </section>
      )}
    </main>
  );
}
