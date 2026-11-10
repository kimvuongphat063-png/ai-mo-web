import { requirePageRole } from "@/lib/auth";
import { LogOut, Shield } from "lucide-react";
import {
  PageHeader,
  Panel,
  Badge,
  Alert,
  ButtonLink,
  Button,
} from "@/components/studio/ui";
import { SessionTimeRemaining } from "./SessionTimeRemaining";
import { aiEnvPublicSummary, getUsage } from "@/lib/ai";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requirePageRole();
  const expiresAt = new Date(session.exp * 1000);
  const aiEnv = aiEnvPublicSummary();
  const usage = await getUsage(session.userId);
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader
        title="Cài đặt"
        description="Thông tin tài khoản demo và phiên đăng nhập hiện tại."
      />

      <Alert tone="info" title="Tài khoản demo">
        Dữ liệu studio lưu tạm trong{" "}
        <code className="rounded bg-surface-2 px-1 py-0.5 text-xs">data/studio.json</code>.
        Production cần auth thật và database.
      </Alert>

      <Panel title="Tài khoản">
        <dl className="divide-y divide-border">
          <div className="flex items-start justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-text-2">Họ tên</dt>
            <dd className="text-sm font-medium text-text">{session.name}</dd>
          </div>
          <div className="flex items-start justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-text-2">Email</dt>
            <dd className="text-sm font-medium text-text">{session.email}</dd>
          </div>
          <div className="flex items-start justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-text-2">User ID</dt>
            <dd className="font-mono text-xs text-text">{session.userId}</dd>
          </div>
          <div className="flex items-start justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-text-2">Vai trò</dt>
            <dd className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-muted" />
              <Badge tone={session.role === "admin" ? "accent" : "neutral"}>
                {session.role}
              </Badge>
            </dd>
          </div>
        </dl>
      </Panel>

      <Panel title="Phiên đăng nhập">
        <dl className="divide-y divide-border">
          <div className="flex items-start justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-text-2">Hết hạn lúc</dt>
            <dd className="text-sm tabular-nums text-text">
              {expiresAt.toLocaleString("vi-VN")}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-text-2">Thời gian còn lại</dt>
            <dd className="text-sm font-medium text-text">
              <SessionTimeRemaining exp={session.exp} />
            </dd>
          </div>
        </dl>
      </Panel>

      <Panel title="Tình trạng AI">
        <dl className="divide-y divide-border">
          <div className="flex items-start justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-text-2">Chế độ hiện tại</dt>
            <dd className="text-sm font-medium text-text">
              {aiEnv.live
                ? isDev
                  ? `Live AI (${aiEnv.provider})`
                  : "Live AI"
                : "Mock"}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-text-2">Số lượt sử dụng hôm nay</dt>
            <dd className="text-sm font-medium text-text">
              {usage.used} / {usage.limit}
            </dd>
          </div>
        </dl>
      </Panel>

      <div className="flex flex-wrap gap-2">
        <ButtonLink href="/app" variant="secondary" size="sm">
          Về dashboard
        </ButtonLink>
        <form action="/api/auth/logout" method="POST">
          <Button type="submit" variant="danger" size="sm">
            <LogOut className="h-3.5 w-3.5" />
            Đăng xuất
          </Button>
        </form>
      </div>
    </div>
  );
}
