"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";
import {
  PageHeader,
  Panel,
  Field,
  Button,
  ButtonLink,
  Alert,
  SectionLabel,
  inputClass,
} from "@/components/studio/ui";

type Platform = "tiktok" | "reels" | "shorts" | "facebook" | "multi";
type Goal = "awareness" | "engagement" | "conversion" | "lead";
type Duration = 7 | 14 | 30;

export default function NewCampaignPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    startDate: new Date().toISOString().split("T")[0],
    durationDays: 7 as Duration,
    platform: "tiktok" as Platform,
    goal: "conversion" as Goal,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Vui lòng nhập tên chiến dịch");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/studio/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Không thể tạo chiến dịch");
      }

      const { campaign } = await res.json();
      router.push(`/app/campaigns/${campaign.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Tạo chiến dịch"
        description="Lên lịch nội dung 7, 14 hoặc 30 ngày. Gán kịch bản sau khi tạo."
        backHref="/app/campaigns"
        backLabel="Chiến dịch"
      />

      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Panel>
          <div className="space-y-5 p-4">
            <SectionLabel>Thông tin chiến dịch</SectionLabel>

            <Field label="Tên chiến dịch" htmlFor="name" required>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="VD: Ra mắt sản phẩm mùa xuân"
                className={inputClass}
                disabled={creating}
                required
              />
            </Field>

            <Field label="Ngày bắt đầu" htmlFor="startDate" required>
              <input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className={inputClass}
                disabled={creating}
                required
              />
            </Field>

            <div>
              <p className="mb-1.5 text-sm font-medium text-text">
                Thời lượng <span className="text-error">*</span>
              </p>
              <div className="grid grid-cols-3 gap-2">
                {([7, 14, 30] as Duration[]).map((days) => {
                  const active = formData.durationDays === days;
                  return (
                    <button
                      key={days}
                      type="button"
                      disabled={creating}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, durationDays: days }))
                      }
                      className={
                        active
                          ? "h-9 rounded-md border border-accent bg-accent-subtle text-sm font-medium text-accent"
                          : "h-9 rounded-md border border-border bg-surface text-sm text-text-2 hover:bg-surface-2"
                      }
                    >
                      {days} ngày
                    </button>
                  );
                })}
              </div>
            </div>

            <Field label="Nền tảng" htmlFor="platform" required>
              <select
                id="platform"
                value={formData.platform}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    platform: e.target.value as Platform,
                  }))
                }
                className={inputClass}
                disabled={creating}
              >
                <option value="tiktok">TikTok</option>
                <option value="reels">Instagram Reels</option>
                <option value="shorts">YouTube Shorts</option>
                <option value="facebook">Facebook</option>
                <option value="multi">Đa nền tảng</option>
              </select>
            </Field>

            <Field label="Mục tiêu" htmlFor="goal" required>
              <select
                id="goal"
                value={formData.goal}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    goal: e.target.value as Goal,
                  }))
                }
                className={inputClass}
                disabled={creating}
              >
                <option value="awareness">Nhận diện</option>
                <option value="engagement">Tương tác</option>
                <option value="conversion">Chuyển đổi</option>
                <option value="lead">Thu lead</option>
              </select>
            </Field>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface-2 px-4 py-3">
            <p className="text-xs text-muted">
              Sẽ tạo {formData.durationDays} ngày placeholder. Gán script hoặc AI plan sau.
            </p>
            <div className="flex items-center gap-2">
              <ButtonLink href="/app/campaigns" variant="secondary" size="sm">
                Hủy
              </ButtonLink>
              <Button type="submit" size="sm" loading={creating}>
                <Calendar className="h-3.5 w-3.5" />
                Tạo chiến dịch
              </Button>
            </div>
          </div>
        </Panel>
      </form>
    </div>
  );
}
