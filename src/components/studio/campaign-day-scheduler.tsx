"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Campaign, CampaignItem, Script } from "@/lib/studio";
import {
  Alert,
  Badge,
  Button,
  Field,
  Panel,
  inputClass,
  textareaClass,
} from "@/components/studio/ui";

type DayStatus = CampaignItem["status"];

const statusConfig: Record<
  DayStatus,
  { label: string; tone: "neutral" | "accent" | "warning" | "success" }
> = {
  planned: { label: "Lên lịch", tone: "neutral" },
  scripted: { label: "Có kịch bản", tone: "accent" },
  produced: { label: "Đã quay", tone: "warning" },
  published: { label: "Đã đăng", tone: "success" },
  archived: { label: "Lưu trữ", tone: "neutral" },
};

const STATUS_OPTIONS: DayStatus[] = [
  "planned",
  "scripted",
  "produced",
  "published",
  "archived",
];

type DayDraft = {
  scriptId: string;
  status: DayStatus;
  publishedUrl: string;
  notes: string;
};

function itemToDraft(item: CampaignItem): DayDraft {
  return {
    scriptId: item.scriptId ?? "",
    status: item.status,
    publishedUrl: item.publishedUrl ?? "",
    notes: item.notes ?? "",
  };
}

function scriptTitle(script: Script | undefined, fallbackId?: string) {
  if (!script) return fallbackId ? `Kịch bản ${fallbackId.slice(0, 8)}…` : "—";
  return script.scripts[0]?.title || `Kịch bản ${script.id.slice(0, 8)}…`;
}

export default function CampaignDayScheduler({
  campaign,
  scripts,
}: {
  campaign: Campaign;
  scripts: Script[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(campaign.items);
  const [drafts, setDrafts] = useState<Record<number, DayDraft>>(() => {
    const initial: Record<number, DayDraft> = {};
    for (const item of campaign.items) initial[item.day] = itemToDraft(item);
    return initial;
  });
  const [busyDay, setBusyDay] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const scriptMap = useMemo(() => {
    const map = new Map<string, Script>();
    for (const s of scripts) map.set(s.id, s);
    return map;
  }, [scripts]);

  const startDate = useMemo(() => new Date(campaign.startDate), [campaign.startDate]);
  const now = useMemo(() => new Date(), []);

  function updateDraft(day: number, patch: Partial<DayDraft>) {
    setDrafts((prev) => ({
      ...prev,
      [day]: { ...prev[day], ...patch },
    }));
  }

  async function patchDay(day: number, body: Record<string, unknown>, successMsg: string) {
    setBusyDay(day);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/studio/campaigns/${campaign.id}/days`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day, ...body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Không cập nhật được ngày");
      }
      const next: Campaign = data.campaign;
      setItems(next.items);
      const nextDrafts: Record<number, DayDraft> = {};
      for (const item of next.items) nextDrafts[item.day] = itemToDraft(item);
      setDrafts(nextDrafts);
      setNotice(successMsg);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setBusyDay(null);
    }
  }

  async function handleSave(day: number) {
    const draft = drafts[day];
    if (!draft) return;
    await patchDay(
      day,
      {
        scriptId: draft.scriptId || null,
        status: draft.status,
        publishedUrl: draft.publishedUrl,
        notes: draft.notes,
      },
      `Đã lưu ngày ${day}`
    );
  }

  async function handleRemove(day: number) {
    await patchDay(
      day,
      {
        scriptId: null,
        status: "planned",
        publishedUrl: "",
        notes: "",
      },
      `Đã gỡ gán ngày ${day}`
    );
  }

  return (
    <div className="space-y-3">
      <Alert tone="info">
        Một kịch bản có thể gán cho nhiều ngày khác nhau. Không gán trùng cùng một kịch bản
        hai lần trên cùng một ngày.
      </Alert>

      {error && (
        <Alert tone="error" title="Không lưu được">
          {error}
        </Alert>
      )}
      {notice && !error && <Alert tone="success">{notice}</Alert>}

      <Panel title="Lịch theo ngày">
        {items.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted">
            Chiến dịch chưa có ngày nào.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => {
              const draft = drafts[item.day] ?? itemToDraft(item);
              const itemDate = new Date(startDate);
              itemDate.setDate(itemDate.getDate() + item.day - 1);
              const isToday = itemDate.toDateString() === now.toDateString();
              const isPast = itemDate < now && !isToday;
              const status = statusConfig[item.status] ?? statusConfig.planned;
              const assigned = scriptMap.get(item.scriptId ?? "");
              const busy = busyDay === item.day;
              const empty = !item.scriptId;

              return (
                <li
                  key={item.day}
                  data-testid={`campaign-day-${item.day}`}
                  className={
                    isToday
                      ? "border-l-2 border-l-accent bg-accent-subtle/40 px-4 py-4"
                      : "px-4 py-4"
                  }
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-text tabular-nums">
                          Ngày {item.day}
                        </span>
                        <span className="text-xs text-muted">
                          {itemDate.toLocaleDateString("vi-VN", {
                            weekday: "short",
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </span>
                        <Badge tone={status.tone}>{status.label}</Badge>
                        {isToday && <Badge tone="accent">Hôm nay</Badge>}
                        {isPast && item.status === "planned" && (
                          <Badge tone="warning">Quá hạn</Badge>
                        )}
                      </div>

                      <p
                        className="mt-1 text-sm text-text-2"
                        data-testid={`day-${item.day}-script-label`}
                      >
                        {empty ? (
                          <span className="text-muted">Chưa gán kịch bản</span>
                        ) : (
                          <Link
                            href={`/app/scripts/${item.scriptId}`}
                            className="text-accent hover:underline"
                          >
                            {scriptTitle(assigned, item.scriptId)}
                          </Link>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Field label="Kịch bản" htmlFor={`script-${item.day}`}>
                      <select
                        id={`script-${item.day}`}
                        data-testid={`day-${item.day}-script`}
                        className={inputClass}
                        value={draft.scriptId}
                        disabled={busy}
                        onChange={(e) => updateDraft(item.day, { scriptId: e.target.value })}
                      >
                        <option value="">— Chưa gán —</option>
                        {scripts.map((script) => (
                          <option key={script.id} value={script.id}>
                            {scriptTitle(script)} — {script.platform} / {script.durationSeconds}s
                          </option>
                        ))}
                        {item.scriptId && !scriptMap.has(item.scriptId) && (
                          <option value={item.scriptId}>
                            (Đã xoá) {item.scriptId.slice(0, 8)}…
                          </option>
                        )}
                      </select>
                    </Field>

                    <Field label="Trạng thái" htmlFor={`status-${item.day}`}>
                      <select
                        id={`status-${item.day}`}
                        data-testid={`day-${item.day}-status`}
                        className={inputClass}
                        value={draft.status}
                        disabled={busy}
                        onChange={(e) =>
                          updateDraft(item.day, { status: e.target.value as DayStatus })
                        }
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {statusConfig[s].label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="URL đã đăng" htmlFor={`url-${item.day}`}>
                      <input
                        id={`url-${item.day}`}
                        data-testid={`day-${item.day}-url`}
                        type="url"
                        className={inputClass}
                        placeholder="https://..."
                        value={draft.publishedUrl}
                        disabled={busy}
                        onChange={(e) =>
                          updateDraft(item.day, { publishedUrl: e.target.value })
                        }
                      />
                    </Field>

                    <Field label="Ghi chú" htmlFor={`notes-${item.day}`}>
                      <textarea
                        id={`notes-${item.day}`}
                        data-testid={`day-${item.day}-notes`}
                        className={textareaClass}
                        rows={2}
                        value={draft.notes}
                        disabled={busy}
                        onChange={(e) => updateDraft(item.day, { notes: e.target.value })}
                      />
                    </Field>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span data-testid={`day-${item.day}-save`}>
                      <Button size="sm" loading={busy} onClick={() => handleSave(item.day)}>
                        Lưu ngày {item.day}
                      </Button>
                    </span>
                    <span data-testid={`day-${item.day}-remove`}>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy || empty}
                        onClick={() => handleRemove(item.day)}
                      >
                        Gỡ gán
                      </Button>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
