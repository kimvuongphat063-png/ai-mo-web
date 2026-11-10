import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, Sparkles } from "lucide-react";

import { isPublic, readCms, type CmsArticle } from "@/lib/cms";

type GuideCardStyle = CSSProperties & { "--guide-accent": string };

function ArticleCard({ article, featured = false }: { article: CmsArticle; featured?: boolean }) {
  const style: GuideCardStyle = { "--guide-accent": article.accent };

  return (
    <Link
      id={`article-${article.slug}`}
      href={`/guides/${article.slug}`}
      className={featured ? "guide-card guide-card-featured" : "guide-card"}
      style={style}
    >
      <div className="guide-card-art" aria-hidden="true">
        <span>{article.category}</span>
        <b>{featured ? "01" : "AI"}</b>
      </div>
      <div className="guide-card-body">
        <div className="guide-meta">
          <span>{article.category}</span>
          <span><Clock3 aria-hidden="true" /> {article.readTime} phút đọc</span>
        </div>
        <h2>{article.title}</h2>
        <p>{article.excerpt}</p>
        <span className="guide-read">Đọc bài <ArrowRight aria-hidden="true" /></span>
      </div>
    </Link>
  );
}

export default async function Page() {
  const articles = (await readCms()).articles
    .filter(isPublic)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const featured = articles.find((article) => article.featured) || articles[0];
  const rest = articles.filter((article) => article.id !== featured?.id);
  const categories = [...new Set(articles.map((article) => article.category))];

  return (
    <main id="main-content" className="guides-page">
      <section className="guides-intro container">
        <div>
          <span className="eyebrow"><Sparkles aria-hidden="true" /> AI MỞ · 2026</span>
          <h1>Góc học AI</h1>
          <p>Những hướng dẫn ngắn, có ngữ cảnh và không thổi phồng — để bạn đọc xong là làm được.</p>
        </div>
        <div className="guides-intro-note">
          <b>{articles.length.toString().padStart(2, "0")}</b>
          <span>bài viết<br />được chọn lọc</span>
        </div>
      </section>

      <nav className="guide-topics container" aria-label="Chủ đề bài viết">
        <span>Khám phá theo chủ đề</span>
        {categories.map((category) => {
          const firstArticle = articles.find((article) => article.category === category);
          return firstArticle && <a href={`#article-${firstArticle.slug}`} key={category}>{category}</a>;
        })}
      </nav>

      {featured && (
        <section className="guide-feature container">
          <div className="guide-feature-label"><span>BÀI ĐƯỢC QUAN TÂM</span><i>01</i></div>
          <ArticleCard article={featured} featured />
        </section>
      )}

      <section className="guide-library container">
        <div className="guide-library-head">
          <div><span className="eyebrow">THƯ VIỆN THỰC HÀNH</span><h2>Đọc theo việc bạn đang làm.</h2></div>
          <p>Mỗi bài là một khung tư duy nhỏ: rõ ràng, thực dụng và có thể áp dụng ngay hôm nay.</p>
        </div>
        {rest.length > 0 ? (
          <div className="guide-grid">{rest.map((article) => <ArticleCard article={article} key={article.id} />)}</div>
        ) : (
          <p className="guide-empty">Bài viết mới đang được biên tập. Hãy quay lại sau.</p>
        )}
      </section>
    </main>
  );
}
