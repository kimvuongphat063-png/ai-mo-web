"use client";

import { useState } from "react";
import { Sparkles, Target, AlertTriangle } from "lucide-react";
import type { ProductAnalysis } from "@/lib/ai/contract";
import { Panel, Button, Alert, EmptyState, Skeleton } from "@/components/studio/ui";

type Props = {
  productId: string;
  initialAnalysis?: ProductAnalysis;
};

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2 text-sm text-text-2">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ListBlock({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{title}</p>
      <BulletList items={items} />
    </div>
  );
}

type Usage = { used: number; limit: number; remaining: number };

export default function ProductBrainClient({ productId, initialAnalysis }: Props) {
  const [analysis, setAnalysis] = useState<ProductAnalysis | undefined>(initialAnalysis);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retryable, setRetryable] = useState(false);
  const [usage, setUsage] = useState<Usage | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError("");
    setRetryable(false);

    try {
      const res = await fetch(`/api/studio/products/${productId}/analyze`, {
        method: "POST",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setRetryable(Boolean(data.retryable));
        throw new Error(data.error || "Không thể phân tích sản phẩm");
      }

      setAnalysis(data.analysis);
      if (data.usage) setUsage(data.usage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const notes = [
    { label: "Tuyên bố cần kiểm chứng", items: analysis?.claimsToVerify },
    { label: "Thông tin còn thiếu", items: analysis?.missingInformation },
    { label: "Lưu ý tuân thủ", items: analysis?.complianceNotes },
  ].filter((n) => n.items && n.items.length > 0);

  return (
    <Panel
      title="Phân tích AI"
      actions={
        <Button size="sm" variant={analysis ? "secondary" : "primary"} loading={loading} onClick={runAnalysis}>
          {!loading && <Sparkles className="h-3.5 w-3.5" />}
          {analysis ? "Phân tích lại" : "Phân tích với AI"}
        </Button>
      }
    >
      {error && (
        <div className="space-y-2 p-4">
          <Alert tone="error">{error}</Alert>
          {retryable && (
            <Button size="sm" variant="secondary" onClick={runAnalysis} loading={loading}>
              Thử lại
            </Button>
          )}
        </div>
      )}

      {usage && (
        <div className="border-b border-border px-4 py-2 text-xs text-muted">
          Đã dùng {usage.used}/{usage.limit} lượt AI hôm nay — còn {usage.remaining} lượt.
        </div>
      )}

      {loading && !analysis && (
        <div className="space-y-2 p-4">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {!analysis && !loading && !error && (
        <EmptyState
          icon={Sparkles}
          title="Chưa phân tích"
          description="Chạy phân tích AI để nhận góc bán, nỗi đau khách hàng và đề xuất CTA."
        />
      )}

      {analysis && (
        <div className="divide-y divide-border">
          {/* Summary */}
          <div className="p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Tóm tắt</p>
            <p className="text-sm leading-relaxed text-text">{analysis.summary}</p>
          </div>

          {/* Selling angles */}
          {analysis.sellingAngles && analysis.sellingAngles.length > 0 && (
            <div className="p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                Góc bán ({analysis.sellingAngles.length})
              </p>
              <ul className="divide-y divide-border rounded-md border border-border">
                {analysis.sellingAngles.map((angle) => (
                  <li key={angle.id} className="p-3">
                    <div className="flex items-start gap-2">
                      <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text">{angle.label}</p>
                        <p className="mt-0.5 text-sm text-accent">{angle.hook}</p>
                        <p className="mt-1 text-sm text-text-2">{angle.rationale}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Insight grid */}
          <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x">
            <ListBlock title="Nỗi đau khách hàng" items={analysis.customerPains} />
            <ListBlock title="Mong muốn khách hàng" items={analysis.customerDesires} />
            <ListBlock title="Lợi ích chính" items={analysis.keyBenefits} />
            <ListBlock title="Bằng chứng" items={analysis.proofPoints} />
            <ListBlock title="Phản đối thường gặp" items={analysis.objections} />
            <ListBlock title="CTA đề xuất" items={analysis.suggestedCtas} />
          </div>

          {/* Compliance notes */}
          {notes.length > 0 && (
            <div className="space-y-3 p-4">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                <p className="text-xs font-medium uppercase tracking-wide text-warning">
                  Cần lưu ý
                </p>
              </div>
              {notes.map((note) => (
                <div key={note.label}>
                  <p className="mb-1 text-sm font-medium text-text">{note.label}</p>
                  <BulletList items={note.items ?? []} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
