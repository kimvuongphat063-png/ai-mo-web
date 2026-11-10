import { notFound } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { getCampaign, listScripts } from "@/lib/studio";
import { FileText, Video } from "lucide-react";
import {
  PageHeader,
  Stat,
  ButtonLink,
} from "@/components/studio/ui";
import CampaignDayScheduler from "@/components/studio/campaign-day-scheduler";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

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

export default async function CampaignDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requirePageRole();
  // Store signature is getCampaign(userId, id)
  const campaign = await getCampaign(session.userId, id);

  if (!campaign) notFound();

  const scripts = await listScripts(session.userId);

  const startDate = new Date(campaign.startDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + campaign.durationDays);

  const completedCount = campaign.items.filter((i) => i.status === "published").length;
  const inProgressCount = campaign.items.filter(
    (i) => i.status === "produced" || i.status === "scripted"
  ).length;
  const plannedCount = campaign.items.filter((i) => i.status === "planned").length;
  const assignedCount = campaign.items.filter((i) => Boolean(i.scriptId)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={campaign.name}
        description={`${platformLabel[campaign.platform] ?? campaign.platform} · ${
          goalLabel[campaign.goal] ?? campaign.goal
        } · ${startDate.toLocaleDateString("vi-VN")} → ${endDate.toLocaleDateString("vi-VN")}`}
        backHref="/app/campaigns"
        backLabel="Chiến dịch"
        actions={
          <>
            <ButtonLink href="/app/scripts" variant="secondary" size="sm">
              <FileText className="h-3.5 w-3.5" />
              Xem kịch bản
            </ButtonLink>
            <ButtonLink href="/app/scripts/new" size="sm">
              <Video className="h-3.5 w-3.5" />
              Tạo kịch bản
            </ButtonLink>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Tổng ngày" value={campaign.durationDays} />
        <Stat label="Đã gán KB" value={assignedCount} />
        <Stat label="Đã đăng" value={completedCount} />
        <Stat label="Đang làm / chưa" value={`${inProgressCount} / ${plannedCount}`} />
      </div>

      <CampaignDayScheduler campaign={campaign} scripts={scripts} />
    </div>
  );
}
