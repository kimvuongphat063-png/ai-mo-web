import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { listPerformanceMetrics, listScripts } from "@/lib/studio";
import { BarChart3, Plus } from "lucide-react";
import {
  PageHeader,
  Stat,
  EmptyState,
  ButtonLink,
  Badge,
} from "@/components/studio/ui";

export const dynamic = "force-dynamic";

export default async function PerformancePage() {
  const session = await requirePageRole();
  const [metrics, scripts] = await Promise.all([
    listPerformanceMetrics(session.userId),
    listScripts(session.userId),
  ]);

  const totalViews = metrics.reduce((sum, m) => sum + m.views, 0);
  const totalLikes = metrics.reduce((sum, m) => sum + m.likes, 0);
  const totalComments = metrics.reduce((sum, m) => sum + m.comments, 0);
  const totalShares = metrics.reduce((sum, m) => sum + m.shares, 0);
  const totalClicks = metrics.reduce((sum, m) => sum + m.clicks, 0);
  const totalConversions = metrics.reduce((sum, m) => sum + m.conversions, 0);

  const avgEngagement =
    metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.engagementRate, 0) / metrics.length
      : 0;
  const avgCTR =
    metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.ctr, 0) / metrics.length
      : 0;
  const avgROAS =
    metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.roas, 0) / metrics.length
      : 0;

  const sortedMetrics = [...metrics].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  );

  const scriptTitle = (scriptId: string) => {
    const script = scripts.find((s) => s.id === scriptId);
    return script?.scripts[0]?.title || "Kịch bản không rõ";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hiệu suất"
        description="Theo dõi views, engagement, CTR và ROAS theo từng kịch bản đã đăng."
        actions={
          scripts.length > 0 ? (
            <ButtonLink href="/app/performance/new" size="sm">
              <Plus className="h-3.5 w-3.5" />
              Ghi nhận metrics
            </ButtonLink>
          ) : undefined
        }
      />

      {metrics.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface">
          <EmptyState
            icon={BarChart3}
            title="Chưa có dữ liệu hiệu suất"
            description={
              scripts.length > 0
                ? "Ghi nhận metrics cho kịch bản đã đăng để theo dõi kết quả theo thời gian."
                : "Tạo và đăng kịch bản trước, rồi quay lại để ghi nhận hiệu suất."
            }
            action={
              scripts.length > 0 ? (
                <ButtonLink href="/app/performance/new" size="sm">
                  <Plus className="h-3.5 w-3.5" />
                  Ghi nhận đầu tiên
                </ButtonLink>
              ) : (
                <ButtonLink href="/app/scripts/new" size="sm" variant="secondary">
                  Tạo kịch bản
                </ButtonLink>
              )
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Tổng views" value={totalViews.toLocaleString("vi-VN")} />
            <Stat
              label="Engagement TB"
              value={`${avgEngagement.toFixed(2)}%`}
            />
            <Stat
              label="Chuyển đổi"
              value={totalConversions.toLocaleString("vi-VN")}
            />
            <Stat label="ROAS TB" value={`${avgROAS.toFixed(2)}x`} />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Likes" value={totalLikes.toLocaleString("vi-VN")} />
            <Stat label="Comments" value={totalComments.toLocaleString("vi-VN")} />
            <Stat label="Shares" value={totalShares.toLocaleString("vi-VN")} />
            <Stat label="Clicks" value={totalClicks.toLocaleString("vi-VN")} />
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm text-text-2">
                {metrics.length} bản ghi · CTR TB {avgCTR.toFixed(2)}%
              </p>
              <ButtonLink href="/app/performance/new" size="sm" variant="secondary">
                <Plus className="h-3.5 w-3.5" />
                Thêm
              </ButtonLink>
            </div>

            <table className="hidden w-full text-left text-sm md:table">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-xs text-text-2">
                  <th className="px-4 py-2.5 font-medium">Kịch bản</th>
                  <th className="px-4 py-2.5 font-medium">Ngày</th>
                  <th className="px-4 py-2.5 font-medium text-right tabular-nums">Views</th>
                  <th className="px-4 py-2.5 font-medium text-right tabular-nums">Eng.</th>
                  <th className="px-4 py-2.5 font-medium text-right tabular-nums">CTR</th>
                  <th className="px-4 py-2.5 font-medium text-right tabular-nums">CV</th>
                  <th className="px-4 py-2.5 font-medium text-right tabular-nums">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {sortedMetrics.map((metric) => (
                  <tr key={metric.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/app/scripts/${metric.scriptId}`}
                        className="font-medium text-text hover:text-accent"
                      >
                        {scriptTitle(metric.scriptId)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-2 tabular-nums">
                      {new Date(metric.recordedAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-right text-text tabular-nums">
                      {metric.views.toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-right text-text-2 tabular-nums">
                      {metric.engagementRate.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-right text-text-2 tabular-nums">
                      {metric.ctr.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-right text-text tabular-nums">
                      {metric.conversions.toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-right text-text tabular-nums">
                      {metric.roas.toFixed(2)}x
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-border md:hidden">
              {sortedMetrics.map((metric) => (
                <li key={metric.id} className="px-4 py-3">
                  <Link
                    href={`/app/scripts/${metric.scriptId}`}
                    className="text-sm font-medium text-text hover:text-accent"
                  >
                    {scriptTitle(metric.scriptId)}
                  </Link>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-text-2">
                    <span className="tabular-nums">
                      {new Date(metric.recordedAt).toLocaleDateString("vi-VN")}
                    </span>
                    <Badge tone="neutral">
                      {metric.views.toLocaleString("vi-VN")} views
                    </Badge>
                    <span className="tabular-nums">{metric.engagementRate.toFixed(2)}% eng</span>
                    <span className="tabular-nums">{metric.roas.toFixed(2)}x ROAS</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
