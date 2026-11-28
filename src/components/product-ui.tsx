"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, ExternalLink, ShoppingBag } from "lucide-react";
import { Product, money } from "@/lib/store";
import { useCart } from "./cart-provider";

const KIND_LABELS: Record<string, string> = {
  course: "KHÓA HỌC",
  desktop: "DESKTOP APP",
  webapp: "WEB APP",
  resource: "TÀI NGUYÊN",
  bundle: "BỘ GIẢI PHÁP",
  affiliate: "ĐỐI TÁC",
};

export function ProductArt({ product, className = "" }: { product: Product; className?: string }) {
  const accent = product.color || "#10b981";
  return (
    <div
      className={`relative overflow-hidden p-5 min-h-[156px] flex flex-col justify-between border-b border-white/10 ${className}`}
      style={{
        background: `radial-gradient(circle at 85% 15%, ${accent}33, rgba(13, 18, 30, 0.96) 70%)`,
      }}
    >
      <div className="flex items-center justify-between gap-2 text-[10.5px] font-mono font-bold tracking-wider uppercase text-slate-300">
        <span
          className="px-2 py-0.5 rounded-md border"
          style={{
            backgroundColor: `${accent}1a`,
            borderColor: `${accent}45`,
            color: accent,
          }}
        >
          {KIND_LABELS[product.kind] || product.kind.toUpperCase()}
        </span>
        <span className="text-slate-400">AI MỞ — 2026</span>
      </div>

      <div className="my-3">
        <strong className="block text-lg font-black tracking-tight text-white/95 truncate">
          {product.imageLabel || product.name}
        </strong>
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#090d16]/80 border border-white/10 text-[11px] text-slate-400">
        <span className="tracking-widest text-[9px]" style={{ color: accent }}>
          ● ● ●
        </span>
        <span className="truncate font-medium text-slate-300">{product.name}</span>
      </div>
    </div>
  );
}

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const href =
    product.ownership === "affiliate"
      ? `/affiliate/${product.slug}`
      : `/${
          product.kind === "course"
            ? "courses"
            : product.kind === "bundle"
              ? "bundles"
              : product.kind === "resource"
                ? "free-resources"
                : "tools"
        }/${product.slug}`;

  return (
    <article
      className={`group rounded-2xl bg-[#101420] border border-white/10 hover:border-emerald-400/40 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 shadow-lg card-${index % 4}`}
    >
      <Link href={href} className="flex flex-col h-full">
        <ProductArt product={product} />
        <div className="p-5 flex-1 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-block text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
              {product.badge || product.category}
            </span>
            <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug">
              {product.name}
            </h3>
            <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
            {product.formats && product.formats.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {product.formats.slice(0, 3).map((fmt) => (
                  <span
                    key={fmt}
                    className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] text-slate-300"
                  >
                    {fmt}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
            <div>
              <b className="text-base font-extrabold text-white">
                {product.ownership === "affiliate" ? product.pricingModel : money(product.price)}
              </b>
              {product.compareAt && product.compareAt > product.price ? (
                <span className="ml-2 text-xs text-slate-500 line-through">
                  {money(product.compareAt)}
                </span>
              ) : null}
            </div>
            <span className="w-8 h-8 rounded-xl bg-white/5 group-hover:bg-emerald-500 group-hover:text-slate-950 text-slate-300 flex items-center justify-center transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function BuyAction({ product }: { product: Product }) {
  const { add } = useCart();
  if (product.ownership === "affiliate") {
    return (
      <div className="space-y-2">
        <a
          className="inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-950 font-bold text-sm hover:bg-slate-200 transition-colors"
          href={`/api/affiliate/click?slug=${product.slug}`}
          target="_blank"
          rel="sponsored noopener"
        >
          Đến trang {product.vendor} <ExternalLink className="w-4 h-4" />
        </a>
        {product.disclosure && (
          <small className="block text-xs text-slate-400 leading-relaxed">
            {product.disclosure}
          </small>
        )}
      </div>
    );
  }
  return (
    <button
      className="inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-400 text-slate-950 font-bold text-sm hover:bg-emerald-300 transition-colors cursor-pointer"
      onClick={() => add(product.slug)}
    >
      <ShoppingBag className="w-4 h-4" />
      {product.price === 0 ? "Thêm vào thư viện" : "Thêm vào giỏ — " + money(product.price)}
    </button>
  );
}

export function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm text-slate-300">
      {items.map((x) => (
        <li key={x} className="flex items-start gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>{x}</span>
        </li>
      ))}
    </ul>
  );
}

export function ArrowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
    >
      {children}
      <ArrowRight className="w-4 h-4" />
    </Link>
  );
}
