import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, Monitor, ShieldCheck, Star } from "lucide-react";
import { Product, money } from "@/lib/store";
import { BuyAction, CheckList, ProductArt } from "./product-ui";

export function DetailPage({ product }: { product: Product }) {
  const backHref =
    product.ownership === "affiliate"
      ? "/affiliate"
      : product.kind === "course"
        ? "/courses"
        : product.kind === "bundle"
          ? "/bundles"
          : product.kind === "resource"
            ? "/free-resources"
            : "/tools";

  return (
    <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
      {/* Hero */}
      <section className="rounded-3xl bg-[#101420] border border-white/10 p-6 sm:p-10 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-5">
          <Link
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-[#d4ff00] transition-colors"
            href={backHref}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh mục</span>
          </Link>

          <div className="space-y-2">
            <span className="inline-block text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              {product.badge ? `${product.badge} · ` : ""}
              {product.category}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {product.name}
            </h1>
            <p className="text-base text-slate-300 leading-relaxed">{product.longDescription}</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
            <div className="inline-flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <b className="text-white">{product.rating}</b>
              <span className="text-slate-400">({product.reviews} đánh giá)</span>
            </div>
            <span className="text-white/20">•</span>
            <div className="flex items-baseline gap-2">
              <strong className="text-2xl font-black text-white">
                {product.ownership === "affiliate" ? product.pricingModel : money(product.price)}
              </strong>
              {product.compareAt && product.compareAt > product.price ? (
                <del className="text-sm text-slate-500">{money(product.compareAt)}</del>
              ) : null}
            </div>
          </div>

          {product.formats && product.formats.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.formats.map((f) => (
                <span
                  key={f}
                  className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-slate-300"
                >
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-xl">
            <ProductArt product={product} className="min-h-[240px]" />
          </div>
        </div>
      </section>

      {/* Body + Single Sticky Action Card */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-3xl bg-[#101420] border border-white/10 p-6 sm:p-8 space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              CHI TIẾT SẢN PHẨM
            </span>
            <h2 className="text-2xl font-black text-white">{heading(product)}</h2>
            <p className="text-slate-300 leading-relaxed">{product.description}</p>

            {product.outcomes && product.outcomes.length > 0 && (
              <div className="pt-3 space-y-3">
                <h3 className="text-lg font-bold text-white">Sau sản phẩm này, bạn có thể</h3>
                <CheckList items={product.outcomes} />
              </div>
            )}

            {product.bundleContents && product.bundleContents.length > 0 && (
              <div className="pt-3 space-y-3">
                <h3 className="text-lg font-bold text-white">Trọn bộ gồm</h3>
                <CheckList items={product.bundleContents} />
              </div>
            )}
          </div>

          {product.curriculum && product.curriculum.length > 0 && (
            <Curriculum product={product} />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {product.compatibility && (
              <Spec title="Tương thích" icon={<Monitor className="w-4 h-4 text-sky-400" />} items={product.compatibility} />
            )}
            {product.requirements && (
              <Spec title="Yêu cầu hệ thống" icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />} items={product.requirements} />
            )}
            {product.usage && (
              <Spec title="Hạn mức sử dụng" items={product.usage} />
            )}
            {product.changelog && (
              <Spec title="Lịch sử cập nhật" items={product.changelog} />
            )}
          </div>

          {product.privacy && (
            <div className="rounded-2xl bg-[#101420] border border-emerald-500/25 p-5 flex items-start gap-3 text-sm text-slate-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <b className="text-white block mb-1">Quyền riêng tư &amp; Dữ liệu</b>
                {product.privacy}
              </p>
            </div>
          )}

          {product.pros && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-[#101420] border border-white/10 p-6 space-y-3">
                <h3 className="text-lg font-bold text-white">Điểm mạnh</h3>
                <CheckList items={product.pros} />
              </div>
              <div className="rounded-2xl bg-[#101420] border border-white/10 p-6 space-y-3">
                <h3 className="text-lg font-bold text-white">Cần cân nhắc</h3>
                <ul className="space-y-2 text-sm text-slate-300 list-disc pl-5">
                  {product.cons?.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {product.bestFor && (
            <div className="rounded-2xl bg-[#101420] border border-white/10 p-6 space-y-1.5">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                PHÙ HỢP NHẤT VỚI
              </span>
              <h3 className="text-lg font-bold text-white">{product.bestFor}</h3>
            </div>
          )}
        </div>

        <aside className="lg:col-span-4 lg:sticky lg:top-24 rounded-3xl bg-[#101420] border border-white/10 p-6 space-y-5 shadow-xl">
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              Bạn nhận được
            </span>
            <CheckList items={product.features} />
          </div>
          <div className="pt-4 border-t border-white/10 space-y-1 text-sm text-slate-300">
            <b className="text-white block">{product.pricingModel}</b>
            <span className="text-xs text-slate-400">Cập nhật gần nhất: {product.updated}</span>
          </div>
          <BuyAction product={product} />
        </aside>
      </section>
    </main>
  );
}

function heading(p: Product) {
  return p.kind === "course"
    ? "Một lộ trình, không phải chồng video."
    : p.kind === "affiliate"
      ? "Đánh giá minh bạch trước khi bạn rời AI MỞ."
      : p.kind === "desktop"
        ? "Phần mềm gọn để công việc trôi chảy."
        : "Mọi thứ bạn cần để bắt đầu.";
}

function Curriculum({ product }: { product: Product }) {
  return (
    <div className="rounded-3xl bg-[#101420] border border-white/10 p-6 sm:p-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xl font-bold text-white">Nội dung khóa học</h3>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {product.duration}
          </span>
          {product.level && <span>• {product.level}</span>}
        </div>
      </div>
      <div className="space-y-3">
        {product.curriculum?.map((m, i) => (
          <details
            key={m.title}
            open={i === 0}
            className="rounded-2xl bg-white/5 border border-white/10 p-4"
          >
            <summary className="cursor-pointer font-bold text-white text-sm flex items-center justify-between gap-2">
              <span>{m.title}</span>
              <b className="text-xs text-emerald-400">{m.lessons.length} bài</b>
            </summary>
            <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
              {m.lessons.map((l) => (
                <div
                  className="flex items-center justify-between gap-3 text-xs text-slate-300"
                  key={l.slug}
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{l.title}</span>
                    {l.preview && (
                      <em className="not-italic px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[10px] font-bold">
                        Học thử
                      </em>
                    )}
                  </span>
                  <small className="text-slate-400 font-mono">{l.duration}</small>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

function Spec({
  title,
  items,
  icon,
}: {
  title: string;
  items: string[];
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-[#101420] border border-white/10 p-6 space-y-3">
      <h3 className="text-base font-bold text-white flex items-center gap-2">
        {icon}
        <span>{title}</span>
      </h3>
      <ul className="space-y-1.5 text-sm text-slate-300 list-disc pl-5">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  );
}
