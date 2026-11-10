"use client";

import { useEffect, useState } from "react";
import { Save, X } from "lucide-react";
import {
  PageHeader,
  Panel,
  Field,
  Button,
  Alert,
  Badge,
  SectionLabel,
  Skeleton,
  inputClass,
  textareaClass,
} from "@/components/studio/ui";

type FormData = {
  companyName: string;
  brandVoice: string;
  prohibitedClaims: string;
  requiredDisclosures: string;
  preferredFormats: string[];
  targetAudience: string;
  competitorUrls: string[];
  language: "vi" | "en";
};

const emptyForm: FormData = {
  companyName: "",
  brandVoice: "",
  prohibitedClaims: "",
  requiredDisclosures: "",
  preferredFormats: [],
  targetAudience: "",
  competitorUrls: [],
  language: "vi",
};

export default function BrandMemoryPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [formatInput, setFormatInput] = useState("");
  const [urlInput, setUrlInput] = useState("");

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await fetch("/api/studio/brand");
        if (!res.ok) throw new Error("Không tải được Brand Memory");
        const data = await res.json();
        if (!active) return;

        if (data.profile) {
          setFormData({
            companyName: data.profile.companyName || "",
            brandVoice: data.profile.brandVoice || "",
            prohibitedClaims: data.profile.prohibitedClaims || "",
            requiredDisclosures: data.profile.requiredDisclosures || "",
            preferredFormats: data.profile.preferredFormats || [],
            targetAudience: data.profile.targetAudience || "",
            competitorUrls: data.profile.competitorUrls || [],
            language: data.profile.language || "vi",
          });
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Lỗi không xác định");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/studio/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Không lưu được Brand Memory");
      }

      setSuccessMessage("Đã lưu Brand Memory");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setSaving(false);
    }
  }

  function addFormat() {
    const value = formatInput.trim();
    if (!value || formData.preferredFormats.includes(value)) return;
    setFormData((prev) => ({
      ...prev,
      preferredFormats: [...prev.preferredFormats, value],
    }));
    setFormatInput("");
  }

  function removeFormat(format: string) {
    setFormData((prev) => ({
      ...prev,
      preferredFormats: prev.preferredFormats.filter((f) => f !== format),
    }));
  }

  function addUrl() {
    const value = urlInput.trim();
    if (!value || formData.competitorUrls.includes(value)) return;
    setFormData((prev) => ({
      ...prev,
      competitorUrls: [...prev.competitorUrls, value],
    }));
    setUrlInput("");
  }

  function removeUrl(url: string) {
    setFormData((prev) => ({
      ...prev,
      competitorUrls: prev.competitorUrls.filter((u) => u !== url),
    }));
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Brand Memory"
        description="Giọng điệu, ràng buộc và disclosure dùng lại khi AI tạo kịch bản."
      />

      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert tone="success" className="mb-4">
          {successMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Panel>
          <div className="space-y-5 p-4">
            <SectionLabel>Thương hiệu</SectionLabel>

            <Field label="Tên công ty / thương hiệu" htmlFor="companyName">
              <input
                id="companyName"
                type="text"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, companyName: e.target.value }))
                }
                className={inputClass}
                placeholder="VD: AI MỞ Studio"
              />
            </Field>

            <div>
              <p className="mb-1.5 text-sm font-medium text-text">Ngôn ngữ chính</p>
              <div className="flex gap-4">
                {(
                  [
                    { value: "vi", label: "Tiếng Việt" },
                    { value: "en", label: "English" },
                  ] as const
                ).map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm text-text">
                    <input
                      type="radio"
                      name="language"
                      value={opt.value}
                      checked={formData.language === opt.value}
                      onChange={() =>
                        setFormData((prev) => ({ ...prev, language: opt.value }))
                      }
                      className="h-4 w-4 accent-[var(--color-accent)]"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <Field
              label="Brand voice & tone"
              htmlFor="brandVoice"
              hint="Mô tả giọng điệu để AI giữ nhất quán giữa các kịch bản."
            >
              <textarea
                id="brandVoice"
                value={formData.brandVoice}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, brandVoice: e.target.value }))
                }
                rows={4}
                className={textareaClass}
                placeholder="VD: Thân thiện, chuyên nghiệp, gần gũi người Việt..."
              />
            </Field>

            <Field label="Đối tượng khách hàng" htmlFor="targetAudience">
              <textarea
                id="targetAudience"
                value={formData.targetAudience}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, targetAudience: e.target.value }))
                }
                rows={3}
                className={textareaClass}
                placeholder="VD: Chủ shop online 25–40 tuổi, quan tâm AI marketing..."
              />
            </Field>

            <SectionLabel>Compliance</SectionLabel>

            <Field label="Từ ngữ / tuyên bố bị cấm" htmlFor="prohibitedClaims">
              <textarea
                id="prohibitedClaims"
                value={formData.prohibitedClaims}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    prohibitedClaims: e.target.value,
                  }))
                }
                rows={3}
                className={textareaClass}
                placeholder="VD: Không dùng 'chữa bệnh', 'số 1 thế giới'..."
              />
            </Field>

            <Field label="Disclosure bắt buộc" htmlFor="requiredDisclosures">
              <textarea
                id="requiredDisclosures"
                value={formData.requiredDisclosures}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    requiredDisclosures: e.target.value,
                  }))
                }
                rows={3}
                className={textareaClass}
                placeholder="VD: #Quảng_cáo, #Ad, Hiệu quả tùy cơ địa..."
              />
            </Field>

            <SectionLabel>Định dạng & đối thủ</SectionLabel>

            <div>
              <p className="mb-1.5 text-sm font-medium text-text">Định dạng video ưa thích</p>
              <div className="mb-2 flex gap-2">
                <input
                  type="text"
                  value={formatInput}
                  onChange={(e) => setFormatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addFormat();
                    }
                  }}
                  className={inputClass}
                  placeholder="VD: UGC, Review, Tutorial..."
                />
                <Button type="button" variant="secondary" size="sm" onClick={addFormat}>
                  Thêm
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {formData.preferredFormats.map((format) => (
                  <Badge key={format} tone="accent" className="gap-1 pr-1">
                    {format}
                    <button
                      type="button"
                      onClick={() => removeFormat(format)}
                      className="rounded p-0.5 hover:bg-accent/10"
                      aria-label={`Xóa ${format}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium text-text">URL đối thủ</p>
              <div className="mb-2 flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addUrl();
                    }
                  }}
                  className={inputClass}
                  placeholder="https://..."
                />
                <Button type="button" variant="secondary" size="sm" onClick={addUrl}>
                  Thêm
                </Button>
              </div>
              <ul className="space-y-1.5">
                {formData.competitorUrls.map((url) => (
                  <li
                    key={url}
                    className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface-2 px-3 py-2"
                  >
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-xs text-accent hover:underline"
                    >
                      {url}
                    </a>
                    <button
                      type="button"
                      onClick={() => removeUrl(url)}
                      className="text-muted hover:text-text"
                      aria-label={`Xóa ${url}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border bg-surface-2 px-4 py-3">
            <p className="text-xs text-muted">
              AI sẽ áp dụng brand voice và ràng buộc này mỗi lần tạo kịch bản.
            </p>
            <Button type="submit" size="sm" loading={saving}>
              <Save className="h-3.5 w-3.5" />
              Lưu Brand Memory
            </Button>
          </div>
        </Panel>
      </form>
    </div>
  );
}
