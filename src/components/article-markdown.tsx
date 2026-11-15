"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ArticleMarkdownProps {
  content: string;
}

export function ArticleMarkdown({ content }: ArticleMarkdownProps) {
  if (!content) return null;

  return (
    <div className="article-markdown-body text-[#0c1526] leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl sm:text-3xl font-black mt-10 mb-4 text-[#0c1526] tracking-tight" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl sm:text-2xl font-extrabold mt-9 mb-3.5 text-[#0c1526] tracking-tight pb-2 border-b border-neutral-200/70" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg sm:text-xl font-bold mt-7 mb-2.5 text-[#0c1526] tracking-tight" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="text-[15.5px] text-neutral-800 leading-relaxed mb-4.5" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-6 mb-5 space-y-1.5 text-[15px] text-neutral-800" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-6 mb-5 space-y-1.5 text-[15px] text-neutral-800" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed pl-1" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-[#0057ff] bg-blue-50/70 py-3.5 px-4 rounded-r-2xl my-5 text-neutral-800 text-[15px] italic shadow-2xs" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-7 rounded-2xl border border-neutral-200/90 shadow-2xs bg-white">
              <table className="w-full text-left border-collapse text-sm" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-neutral-50/90 border-b border-neutral-200 text-neutral-900 font-bold" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-neutral-100" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="p-3.5 font-extrabold text-neutral-900 text-xs sm:text-sm tracking-wide uppercase bg-neutral-100/60" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="p-3.5 text-neutral-800 align-top text-xs sm:text-sm" {...props} />
          ),
          a: ({ node, href, children, ...props }) => {
            const isExternal = href?.startsWith("http");
            return (
              <a
                href={href}
                className="text-[#0057ff] font-semibold underline decoration-blue-300 underline-offset-3 hover:text-[#0040be] hover:decoration-blue-600 transition-colors"
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                {...props}
              >
                {children}
              </a>
            );
          },
          img: ({ node, src, alt, ...props }) => {
            if (!src) return null;
            return (
              <figure className="my-7">
                <div className="overflow-hidden rounded-2xl border border-neutral-200/90 shadow-xs bg-slate-50/60 p-1 sm:p-2">
                  <img
                    src={src}
                    alt={alt || "Hình minh họa bài viết"}
                    className="w-full h-auto object-contain max-h-[580px] rounded-xl mx-auto"
                    loading="lazy"
                    {...props}
                  />
                </div>
                {alt && (
                  <figcaption className="text-center text-xs text-neutral-500 mt-2 font-medium italic">
                    {alt}
                  </figcaption>
                )}
              </figure>
            );
          },
          code: ({ node, className, children, ...props }) => {
            const isCodeBlock = className?.includes("language-");
            if (isCodeBlock) {
              return (
                <div className="my-5 rounded-2xl overflow-hidden border border-neutral-800 bg-[#0c1526] text-neutral-100 shadow-md">
                  <div className="px-4 py-2 bg-neutral-900/90 border-b border-neutral-800 text-[11px] font-mono text-neutral-400 flex items-center justify-between">
                    <span>MÃ NGUỒN</span>
                  </div>
                  <pre className="p-4 overflow-x-auto text-[13px] font-mono leading-relaxed">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              );
            }
            return (
              <code className="px-1.5 py-0.5 rounded-md bg-neutral-100 text-[#0057ff] font-mono text-[13px] font-semibold border border-neutral-200/60" {...props}>
                {children}
              </code>
            );
          },
          hr: () => <hr className="my-8 border-neutral-200/80" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
