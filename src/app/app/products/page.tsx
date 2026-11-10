import { requirePageRole } from "@/lib/auth";
import { listProducts, listScripts } from "@/lib/studio";
import Link from "next/link";
import { PackageSearch, Plus, ExternalLink } from "lucide-react";
import { PageHeader, ButtonLink, EmptyState, Badge } from "@/components/studio/ui";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : dateFormatter.format(d);
}

export default async function ProductsPage() {
  const session = await requirePageRole();
  const [products, scripts] = await Promise.all([
    listProducts(session.userId),
    listScripts(session.userId),
  ]);

  const scriptCountByProduct = new Map<string, number>();
  for (const script of scripts) {
    scriptCountByProduct.set(
      script.productProfileId,
      (scriptCountByProduct.get(script.productProfileId) ?? 0) + 1
    );
  }

  const sorted = [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <PageHeader
        title="Sản phẩm"
        description="Hồ sơ sản phẩm dùng làm dữ liệu đầu vào cho kịch bản video."
        actions={
          <ButtonLink href="/app/products/new" size="sm">
            <Plus className="h-3.5 w-3.5" />
            Sản phẩm mới
          </ButtonLink>
        }
      />

      <div className="rounded-lg border border-border bg-surface">
        {sorted.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="Chưa có sản phẩm"
            description="Thêm sản phẩm đầu tiên để AI phân tích góc bán và tạo kịch bản video."
            action={
              <ButtonLink href="/app/products/new" size="sm">
                <Plus className="h-3.5 w-3.5" />
                Thêm sản phẩm
              </ButtonLink>
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden w-full text-sm md:table">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted">
                    Tên sản phẩm
                  </th>
                  <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted">
                    Khách hàng mục tiêu
                  </th>
                  <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted">
                    Giá / Ưu đãi
                  </th>
                  <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted">
                    Kịch bản
                  </th>
                  <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted">
                    Ngày tạo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((product) => {
                  const count = scriptCountByProduct.get(product.id) ?? 0;
                  return (
                    <tr key={product.id} className="transition-colors hover:bg-surface-2">
                      <td className="px-4 py-3">
                        <Link
                          href={`/app/products/${product.id}`}
                          className="flex items-center gap-1.5 font-medium text-text hover:text-accent"
                        >
                          <span className="max-w-[22rem] truncate">{product.name}</span>
                          {product.url && <ExternalLink className="h-3 w-3 shrink-0 text-muted" />}
                        </Link>
                        <p className="mt-0.5 max-w-[28rem] truncate text-xs text-muted">
                          {product.description}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-text-2">
                        <span className="block max-w-[14rem] truncate">{product.targetCustomer}</span>
                      </td>
                      <td className="px-4 py-3 text-text-2">
                        <span className="block max-w-[12rem] truncate">
                          {product.priceOffer || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {count > 0 ? (
                          <Badge tone="accent">{count}</Badge>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-text-2">
                        {formatDate(product.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile stacked rows */}
            <ul className="divide-y divide-border md:hidden">
              {sorted.map((product) => {
                const count = scriptCountByProduct.get(product.id) ?? 0;
                return (
                  <li key={product.id}>
                    <Link
                      href={`/app/products/${product.id}`}
                      className="block px-4 py-3 transition-colors hover:bg-surface-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 flex-1 truncate text-sm font-medium text-text">
                          {product.name}
                        </p>
                        {count > 0 && <Badge tone="accent">{count} kịch bản</Badge>}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                        {product.description}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                        <span className="truncate">{product.targetCustomer}</span>
                        {product.priceOffer && <span className="truncate">{product.priceOffer}</span>}
                        <span>{formatDate(product.createdAt)}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
