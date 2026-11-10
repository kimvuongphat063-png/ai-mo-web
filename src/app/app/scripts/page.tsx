import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { listScripts } from "@/lib/studio";
import { FileVideo, Plus } from "lucide-react";
import { PageHeader, Badge, EmptyState, ButtonLink } from "@/components/studio/ui";

export const dynamic = "force-dynamic";

const platformLabel: Record<string, string> = {
  tiktok: "TikTok",
  reels: "Reels",
  shorts: "Shorts",
  facebook: "Facebook",
};

const goalLabel: Record<string, string> = {
  awareness: "Nhận diện",
  engagement: "Tương tác",
  conversion: "Chuyển đổi",
  lead: "Thu lead",
};

export default async function ScriptsPage() {
  const session = await requirePageRole();
  const scripts = await listScripts(session.userId);

  return (
    <div>
      <PageHeader
        title="Kịch bản"
        description={`${scripts.length} kịch bản video do AI tạo từ hồ sơ sản phẩm.`}
        actions={
          <ButtonLink href="/app/scripts/new" size="sm">
            <Plus className="h-3.5 w-3.5" />
            Tạo kịch bản
          </ButtonLink>
        }
      />

      {scripts.length === 0 ? (
        <EmptyState
          icon={FileVideo}
          title="Chưa có kịch bản"
          description="Tạo kịch bản video đầu tiên từ một hồ sơ sản phẩm. Mỗi kịch bản gồm các biến thể, cảnh quay theo giây, hook và CTA."
          action={
            <ButtonLink href="/app/scripts/new" size="sm">
              <Plus className="h-3.5 w-3.5" />
              Tạo kịch bản đầu tiên
            </ButtonLink>
          }
        />
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-border bg-surface">
          {/* Desktop table */}
          <table className="hidden w-full text-left text-sm md:table">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-xs text-text-2">
                <th className="px-4 py-2.5 font-medium">Tiêu đề</th>
                <th className="px-4 py-2.5 font-medium">Nền tảng</th>
                <th className="px-4 py-2.5 font-medium">Mục tiêu</th>
                <th className="px-4 py-2.5 font-medium text-right tabular-nums">Thời lượng</th>
                <th className="px-4 py-2.5 font-medium text-right tabular-nums">Biến thể</th>
                <th className="px-4 py-2.5 font-medium text-right tabular-nums">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {scripts.map((script) => {
                const firstVariantTitle = script.scripts[0]?.title || "Kịch bản chưa đặt tên";
                const totalShots = script.scripts.reduce(
                  (acc, variant) => acc + variant.shots.length,
                  0
                );
                return (
                  <tr key={script.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/app/scripts/${script.id}`}
                        className="font-medium text-text hover:text-accent"
                      >
                        {firstVariantTitle}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted">
                        {totalShots} cảnh quay
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="neutral">{platformLabel[script.platform] ?? script.platform}</Badge>
                    </td>
                    <td className="px-4 py-3 text-text-2">
                      {goalLabel[script.goal] ?? script.goal}
                    </td>
                    <td className="px-4 py-3 text-right text-text-2 tabular-nums">
                      {script.durationSeconds}s
                    </td>
                    <td className="px-4 py-3 text-right text-text-2 tabular-nums">
                      {script.scripts.length}
                    </td>
                    <td className="px-4 py-3 text-right text-text-2 tabular-nums">
                      {new Date(script.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Mobile stacked list */}
          <ul className="divide-y divide-border md:hidden">
            {scripts.map((script) => {
              const firstVariantTitle = script.scripts[0]?.title || "Kịch bản chưa đặt tên";
              const totalShots = script.scripts.reduce(
                (acc, variant) => acc + variant.shots.length,
                0
              );
              return (
                <li key={script.id}>
                  <Link href={`/app/scripts/${script.id}`} className="block px-4 py-3">
                    <p className="text-sm font-medium text-text">{firstVariantTitle}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-text-2">
                      <Badge tone="neutral">
                        {platformLabel[script.platform] ?? script.platform}
                      </Badge>
                      <span>{goalLabel[script.goal] ?? script.goal}</span>
                      <span>•</span>
                      <span className="tabular-nums">{script.durationSeconds}s</span>
                      <span>•</span>
                      <span>{script.scripts.length} biến thể</span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {totalShots} cảnh quay •{" "}
                      {new Date(script.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
