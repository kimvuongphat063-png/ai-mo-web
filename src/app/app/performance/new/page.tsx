import { requirePageRole } from "@/lib/auth";
import { listScripts } from "@/lib/studio";
import { FileText } from "lucide-react";
import PerformanceFormClient from "@/components/studio/performance-form-client";
import {
  PageHeader,
  EmptyState,
  ButtonLink,
} from "@/components/studio/ui";

export const dynamic = "force-dynamic";

export default async function NewPerformancePage() {
  const session = await requirePageRole();
  const scripts = await listScripts(session.userId);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Ghi nhận hiệu suất"
        description="Nhập metrics cho kịch bản đã đăng để theo dõi kết quả theo thời gian."
        backHref="/app/performance"
        backLabel="Hiệu suất"
      />

      {scripts.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface">
          <EmptyState
            icon={FileText}
            title="Chưa có kịch bản"
            description="Tạo kịch bản trước khi ghi nhận performance metrics."
            action={
              <ButtonLink href="/app/scripts/new" size="sm">
                Tạo kịch bản
              </ButtonLink>
            }
          />
        </div>
      ) : (
        <PerformanceFormClient scripts={scripts} />
      )}
    </div>
  );
}
