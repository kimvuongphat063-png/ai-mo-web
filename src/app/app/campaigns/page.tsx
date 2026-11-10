import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { listCampaigns } from "@/lib/studio";
import { Calendar, Plus } from "lucide-react";
import { PageHeader, Badge, EmptyState, ButtonLink } from "@/components/studio/ui";

export const dynamic = "force-dynamic";

const platformLabel: Record<string, string> = {
  tiktok: "TikTok",
  reels: "Reels",
  shorts: "Shorts",
  facebook: "Facebook",
  multi: "Đa nền tảng",
};

const goalLabel: Record<string, string> = {
  awareness: "Nhận diện",
  engagement: "Tương tác",
  conversion: "Chuyển đổi",
  lead: "Thu lead",
};

function campaignStatus(startDateIso: string, durationDays: number) {
  const now = new Date();
  const start = new Date(startDateIso);
  const end = new Date(start);
  end.setDate(end.getDate() + durationDays);

  if (Number.isNaN(start.getTime())) {
    return { label: "Không rõ", tone: "neutral" as const };
  }
  if (now > end) return { label: "Hoàn tất", tone: "success" as const };
  if (now >= start) return { label: "Đang chạy", tone: "accent" as const };
  return { label: "Lên lịch", tone: "neutral" as const };
}

export default async function CampaignsPage() {
  const session = await requirePageRole();
  const campaigns = await listCampaigns(session.userId);
  const sorted = [...campaigns].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <PageHeader
        title="Chiến dịch"
        description={`${campaigns.length} lịch nội dung 7/14/30 ngày gắn với kịch bản video.`}
        actions={
          <ButtonLink href="/app/campaigns/new" size="sm">
            <Plus className="h-3.5 w-3.5" />
            Tạo chiến dịch
          </ButtonLink>
        }
      />

      {sorted.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface">
          <EmptyState
            icon={Calendar}
            title="Chưa có chiến dịch"
            description="Tạo lịch 7, 14 hoặc 30 ngày để theo dõi sản xuất và đăng bài theo ngày."
            action={
              <ButtonLink href="/app/campaigns/new" size="sm">
                <Plus className="h-3.5 w-3.5" />
                Tạo chiến dịch đầu tiên
              </ButtonLink>
            }
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <table className="hidden w-full text-left text-sm md:table">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-xs text-text-2">
                <th className="px-4 py-2.5 font-medium">Tên</th>
                <th className="px-4 py-2.5 font-medium">Nền tảng</th>
                <th className="px-4 py-2.5 font-medium">Mục tiêu</th>
                <th className="px-4 py-2.5 font-medium">Trạng thái</th>
                <th className="px-4 py-2.5 font-medium text-right tabular-nums">Tiến độ</th>
                <th className="px-4 py-2.5 font-medium text-right tabular-nums">Bắt đầu</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((campaign) => {
                const published = campaign.items.filter((i) => i.status === "published").length;
                const status = campaignStatus(campaign.startDate, campaign.durationDays);
                return (
                  <tr key={campaign.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/app/campaigns/${campaign.id}`}
                        className="font-medium text-text hover:text-accent"
                      >
                        {campaign.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted">{campaign.durationDays} ngày</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="neutral">
                        {platformLabel[campaign.platform] ?? campaign.platform}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-text-2">
                      {goalLabel[campaign.goal] ?? campaign.goal}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-text-2 tabular-nums">
                      {published}/{campaign.durationDays}
                    </td>
                    <td className="px-4 py-3 text-right text-text-2 tabular-nums">
                      {new Date(campaign.startDate).toLocaleDateString("vi-VN")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <ul className="divide-y divide-border md:hidden">
            {sorted.map((campaign) => {
              const published = campaign.items.filter((i) => i.status === "published").length;
              const status = campaignStatus(campaign.startDate, campaign.durationDays);
              return (
                <li key={campaign.id}>
                  <Link href={`/app/campaigns/${campaign.id}`} className="block px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-text">{campaign.name}</p>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-text-2">
                      <Badge tone="neutral">
                        {platformLabel[campaign.platform] ?? campaign.platform}
                      </Badge>
                      <span>{goalLabel[campaign.goal] ?? campaign.goal}</span>
                      <span>•</span>
                      <span className="tabular-nums">
                        {published}/{campaign.durationDays} ngày
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      Bắt đầu {new Date(campaign.startDate).toLocaleDateString("vi-VN")}
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
