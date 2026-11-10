"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import type { Script } from "@/lib/studio";
import {
  Panel,
  Field,
  Button,
  ButtonLink,
  Alert,
  SectionLabel,
  inputClass,
} from "@/components/studio/ui";

type MetricForm = {
  scriptId: string;
  views: string;
  likes: string;
  comments: string;
  shares: string;
  clicks: string;
  conversions: string;
  revenue: string;
  costSpent: string;
  watchTimeSeconds: string;
  engagementRate: string;
  ctr: string;
  roas: string;
};

const emptyForm: MetricForm = {
  scriptId: "",
  views: "",
  likes: "",
  comments: "",
  shares: "",
  clicks: "",
  conversions: "",
  revenue: "",
  costSpent: "",
  watchTimeSeconds: "",
  engagementRate: "",
  ctr: "",
  roas: "",
};

export default function PerformanceFormClient({ scripts }: { scripts: Script[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<MetricForm>(emptyForm);

  function update(field: keyof MetricForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.scriptId) {
      setError("Vui lòng chọn kịch bản");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        scriptId: form.scriptId,
        views: Number(form.views || 0),
        likes: Number(form.likes || 0),
        comments: Number(form.comments || 0),
        shares: Number(form.shares || 0),
        clicks: Number(form.clicks || 0),
        conversions: Number(form.conversions || 0),
        revenue: Number(form.revenue || 0),
        costSpent: Number(form.costSpent || 0),
        watchTimeSeconds: Number(form.watchTimeSeconds || 0),
        engagementRate: Number(form.engagementRate || 0),
        ctr: Number(form.ctr || 0),
        roas: Number(form.roas || 0),
      };

      const res = await fetch("/api/studio/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Không lưu được metrics");
      }

      router.push("/app/performance");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
      setSaving(false);
    }
  }

  const reachFields: Array<{
    key: keyof MetricForm;
    label: string;
    placeholder: string;
    step?: string;
  }> = [
    { key: "views", label: "Views", placeholder: "10000" },
    { key: "likes", label: "Likes", placeholder: "500" },
    { key: "comments", label: "Comments", placeholder: "120" },
    { key: "shares", label: "Shares", placeholder: "45" },
    { key: "clicks", label: "Clicks", placeholder: "300" },
    { key: "watchTimeSeconds", label: "Watch time (giây)", placeholder: "8500" },
  ];

  const businessFields: Array<{
    key: keyof MetricForm;
    label: string;
    placeholder: string;
    step?: string;
  }> = [
    { key: "conversions", label: "Conversions", placeholder: "25" },
    { key: "revenue", label: "Doanh thu (VNĐ)", placeholder: "5000000" },
    { key: "costSpent", label: "Chi phí ads (VNĐ)", placeholder: "1000000" },
    { key: "engagementRate", label: "Engagement rate (%)", placeholder: "6.5", step: "0.01" },
    { key: "ctr", label: "CTR (%)", placeholder: "3.2", step: "0.01" },
    { key: "roas", label: "ROAS (x)", placeholder: "4.5", step: "0.01" },
  ];

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}

      <Panel>
        <div className="space-y-5 p-4">
          <SectionLabel>Kịch bản</SectionLabel>
          <Field label="Chọn kịch bản" htmlFor="scriptId" required>
            <select
              id="scriptId"
              value={form.scriptId}
              onChange={(e) => update("scriptId", e.target.value)}
              className={inputClass}
              disabled={saving}
            >
              <option value="">-- Chọn kịch bản đã đăng --</option>
              {scripts.map((script) => (
                <option key={script.id} value={script.id}>
                  {script.scripts[0]?.title || "Untitled"} — {script.platform} /{" "}
                  {script.durationSeconds}s
                </option>
              ))}
            </select>
          </Field>

          <SectionLabel>Reach & engagement</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reachFields.map((field) => (
              <Field key={field.key} label={field.label} htmlFor={field.key}>
                <input
                  id={field.key}
                  type="number"
                  min={0}
                  step={field.step || "1"}
                  value={form[field.key]}
                  onChange={(e) => update(field.key, e.target.value)}
                  className={inputClass}
                  placeholder={field.placeholder}
                  disabled={saving}
                />
              </Field>
            ))}
          </div>

          <SectionLabel>Kinh doanh</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {businessFields.map((field) => (
              <Field key={field.key} label={field.label} htmlFor={field.key}>
                <input
                  id={field.key}
                  type="number"
                  min={0}
                  step={field.step || "1"}
                  value={form[field.key]}
                  onChange={(e) => update(field.key, e.target.value)}
                  className={inputClass}
                  placeholder={field.placeholder}
                  disabled={saving}
                />
              </Field>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface-2 px-4 py-3">
          <ButtonLink href="/app/performance" variant="secondary" size="sm">
            Hủy
          </ButtonLink>
          <Button type="submit" size="sm" loading={saving}>
            <Save className="h-3.5 w-3.5" />
            Lưu metrics
          </Button>
        </div>
      </Panel>
    </form>
  );
}
