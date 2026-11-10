import { requirePageRole } from "@/lib/auth";
import { listProducts, listScripts } from "@/lib/studio";
import Link from "next/link";
import {
  PackageSearch,
  FileText,
  Plus,
  ArrowRight,
  Clock,
} from "lucide-react";
import {
  PageHeader,
  Stat,
  Panel,
  EmptyState,
  ButtonLink,
} from "@/components/studio/ui";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return dateFormatter.format(d);
}

export default async function StudioDashboard() {
  const session = await requirePageRole();

  const [products, scripts] = await Promise.all([
    listProducts(session.userId),
    listScripts(session.userId),
  ]);

  const latestProducts = [...products]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);
  const latestScripts = [...scripts]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const newestIso = [
    ...products.map((p) => p.createdAt),
    ...scripts.map((s) => s.createdAt),
  ].sort((a, b) => b.localeCompare(a))[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Workspace của ${session.name} — tạo hồ sơ sản phẩm và kịch bản video ngắn.`}
        actions={
          <>
            <ButtonLink href="/app/products/new" variant="secondary" size="sm">
              <Plus className="h-3.5 w-3.5" />
              Sản phẩm mới
            </ButtonLink>
            <ButtonLink href="/app/scripts/new" variant="primary" size="sm">
              <FileText className="h-3.5 w-3.5" />
              Kịch bản mới
            </ButtonLink>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Sản phẩm" value={products.length} />
        <Stat label="Kịch bản" value={scripts.length} />
        <Stat
          label="Sản phẩm có kịch bản"
          value={new Set(scripts.map((s) => s.productProfileId)).size}
          hint={products.length > 0 ? `trên ${products.length} sản phẩm` : undefined}
        />
        <Stat
          label="Hoạt động gần nhất"
          value={newestIso ? formatDate(newestIso) : "—"}
          hint={newestIso ? undefined : "Chưa có dữ liệu"}
        />
      </div>

      {/* Recent lists */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Sản phẩm gần đây"
          actions={
            <Link
              href="/app/products"
              className="inline-flex items-center gap-1 text-xs font-medium text-text-2 transition-colors hover:text-text"
            >
              Xem tất cả
              <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          {latestProducts.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="Chưa có sản phẩm"
              description="Bắt đầu bằng cách phân tích sản phẩm đầu tiên của bạn."
              action={
                <ButtonLink href="/app/products/new" variant="secondary" size="sm">
                  <Plus className="h-3.5 w-3.5" />
                  Thêm sản phẩm
                </ButtonLink>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {latestProducts.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/app/products/${product.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text">{product.name}</p>
                      <p className="truncate text-xs text-muted">
                        {product.description.length > 90
                          ? `${product.description.slice(0, 90)}…`
                          : product.description}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted">
                      <Clock className="h-3 w-3" />
                      {formatDate(product.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Kịch bản gần đây"
          actions={
            <Link
              href="/app/scripts"
              className="inline-flex items-center gap-1 text-xs font-medium text-text-2 transition-colors hover:text-text"
            >
              Xem tất cả
              <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          {latestScripts.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Chưa có kịch bản"
              description="Tạo kịch bản video từ một hồ sơ sản phẩm đã phân tích."
              action={
                <ButtonLink href="/app/scripts/new" variant="secondary" size="sm">
                  <Plus className="h-3.5 w-3.5" />
                  Tạo kịch bản
                </ButtonLink>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {latestScripts.map((script) => (
                <li key={script.id}>
                  <Link
                    href={`/app/scripts/${script.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text">
                        {script.scripts[0]?.title ?? script.id}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {script.platform} · {script.durationSeconds}s ·{" "}
                        {script.scripts.length} phiên bản
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted">
                      <Clock className="h-3 w-3" />
                      {formatDate(script.createdAt)}
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
