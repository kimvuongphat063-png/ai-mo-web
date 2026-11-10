import { requirePageRole } from "@/lib/auth";
import { getProduct, listScripts } from "@/lib/studio";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Sparkles, FileText } from "lucide-react";
import ProductBrainClient from "@/components/studio/product-brain-client";
import { PageHeader, Panel, ButtonLink, Badge } from "@/components/studio/ui";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 px-4 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted sm:pt-0.5">
        {label}
      </dt>
      <dd className="whitespace-pre-wrap text-sm leading-relaxed text-text">{value}</dd>
    </div>
  );
}

export default async function ProductDetailPage({ params }: Props) {
  const session = await requirePageRole();
  const { id } = await params;
  const product = await getProduct(session.userId, id);

  if (!product) {
    notFound();
  }

  const allScripts = await listScripts(session.userId);
  const relatedScripts = allScripts
    .filter((s) => s.productProfileId === product.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={product.name}
        description={product.targetCustomer}
        backHref="/app/products"
        backLabel="Sản phẩm"
        actions={
          <>
            {product.url && (
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-sm font-medium text-text transition-colors hover:bg-surface-2"
              >
                Xem sản phẩm
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <ButtonLink href={`/app/scripts/new?productId=${product.id}`} size="sm">
              <Sparkles className="h-3.5 w-3.5" />
              Tạo kịch bản
            </ButtonLink>
          </>
        }
      />

      <div className="space-y-4">
        <Panel title="Hồ sơ sản phẩm">
          <dl className="divide-y divide-border">
            <DetailRow label="Mô tả" value={product.description} />
            {product.priceOffer && <DetailRow label="Giá / Ưu đãi" value={product.priceOffer} />}
            <DetailRow label="Tính năng chính" value={product.featuresText} />
            <DetailRow label="Khách hàng mục tiêu" value={product.targetCustomer} />
            <DetailRow label="Vấn đề giải quyết" value={product.problemSolved} />
            {product.allowedProof && (
              <DetailRow label="Bằng chứng được phép" value={product.allowedProof} />
            )}
            {product.claimsToAvoid && (
              <DetailRow label="Tuyên bố cần tránh" value={product.claimsToAvoid} />
            )}
            {product.brandVoice && <DetailRow label="Giọng thương hiệu" value={product.brandVoice} />}
            {product.affiliateLink && (
              <DetailRow label="Link affiliate" value={product.affiliateLink} />
            )}
            <DetailRow label="Ngày tạo" value={dateFormatter.format(new Date(product.createdAt))} />
          </dl>
        </Panel>

        {/* AI analysis */}
        <ProductBrainClient productId={product.id} />

        {/* Related scripts */}
        <Panel
          title={
            <span className="flex items-center gap-2">
              Kịch bản từ sản phẩm này
              {relatedScripts.length > 0 && <Badge tone="neutral">{relatedScripts.length}</Badge>}
            </span>
          }
          actions={
            <Link
              href={`/app/scripts/new?productId=${product.id}`}
              className="text-xs font-medium text-text-2 transition-colors hover:text-text"
            >
              Tạo mới
            </Link>
          }
        >
          {relatedScripts.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted">
              Chưa có kịch bản nào cho sản phẩm này.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {relatedScripts.map((script) => (
                <li key={script.id}>
                  <Link
                    href={`/app/scripts/${script.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-muted" />
                      <span className="truncate text-sm font-medium text-text">
                        {script.scripts[0]?.title ?? script.id}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs text-muted">
                      {script.platform} · {script.durationSeconds}s
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
