"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import {
  PageHeader,
  Panel,
  Field,
  Alert,
  Button,
  inputClass,
  textareaClass,
} from "@/components/studio/ui";

type FormState = {
  name: string;
  url: string;
  description: string;
  priceOffer: string;
  featuresText: string;
  targetCustomer: string;
  problemSolved: string;
  allowedProof: string;
  claimsToAvoid: string;
  affiliateLink: string;
  brandVoice: string;
};

const initialState: FormState = {
  name: "",
  url: "",
  description: "",
  priceOffer: "",
  featuresText: "",
  targetCustomer: "",
  problemSolved: "",
  allowedProof: "",
  claimsToAvoid: "",
  affiliateLink: "",
  brandVoice: "",
};

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<FormState>(initialState);
  const formRef = useRef<HTMLFormElement>(null);

  const busy = saving || analyzing;

  const updateField = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const submit = async (e: React.FormEvent | null, runAnalysis: boolean) => {
    e?.preventDefault();
    setError("");
    if (runAnalysis) setAnalyzing(true);
    else setSaving(true);

    try {
      const createRes = await fetch("/api/studio/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!createRes.ok) {
        const errData = await createRes.json().catch(() => ({}));
        throw new Error(errData.error || "Không thể tạo sản phẩm");
      }

      const { product } = await createRes.json();

      if (runAnalysis) {
        const analyzeRes = await fetch(`/api/studio/products/${product.id}/analyze`, {
          method: "POST",
        });
        if (!analyzeRes.ok) {
          console.error("Analysis failed but product was created");
        }
      }

      router.push(`/app/products/${product.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      setSaving(false);
      setAnalyzing(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Sản phẩm mới"
        description="Điền thông tin sản phẩm. AI sẽ phân tích và đề xuất góc bán."
        backHref="/app/products"
        backLabel="Sản phẩm"
      />

      <form ref={formRef} onSubmit={(e) => submit(e, false)} className="space-y-4">
        <Panel title="Thông tin cơ bản">
          <div className="space-y-4 p-4">
            <Field label="Tên sản phẩm" htmlFor="name" required>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="VD: Gói ChatGPT Pro"
                className={inputClass}
              />
            </Field>

            <Field label="Đường dẫn sản phẩm" htmlFor="url" hint="Bắt đầu bằng http:// hoặc https://">
              <input
                type="url"
                id="url"
                value={formData.url}
                onChange={(e) => updateField("url", e.target.value)}
                placeholder="https://example.com/product"
                className={inputClass}
              />
            </Field>

            <Field label="Mô tả sản phẩm" htmlFor="description" required>
              <textarea
                id="description"
                required
                rows={4}
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Sản phẩm là gì và hoạt động thế nào..."
                className={textareaClass}
              />
            </Field>

            <Field label="Giá / Ưu đãi" htmlFor="priceOffer">
              <input
                type="text"
                id="priceOffer"
                value={formData.priceOffer}
                onChange={(e) => updateField("priceOffer", e.target.value)}
                placeholder="VD: 499.000đ/tháng hoặc giảm 50% cho 100 khách đầu"
                className={inputClass}
              />
            </Field>
          </div>
        </Panel>

        <Panel title="Định vị & khách hàng">
          <div className="space-y-4 p-4">
            <Field label="Tính năng chính" htmlFor="featuresText" required hint="Mỗi tính năng một dòng">
              <textarea
                id="featuresText"
                required
                rows={4}
                value={formData.featuresText}
                onChange={(e) => updateField("featuresText", e.target.value)}
                placeholder="Liệt kê các tính năng chính..."
                className={textareaClass}
              />
            </Field>

            <Field label="Khách hàng mục tiêu" htmlFor="targetCustomer" required>
              <input
                type="text"
                id="targetCustomer"
                required
                value={formData.targetCustomer}
                onChange={(e) => updateField("targetCustomer", e.target.value)}
                placeholder="VD: Chủ shop nhỏ, sinh viên, nhà sáng tạo nội dung"
                className={inputClass}
              />
            </Field>

            <Field label="Vấn đề giải quyết" htmlFor="problemSolved" required>
              <textarea
                id="problemSolved"
                required
                rows={3}
                value={formData.problemSolved}
                onChange={(e) => updateField("problemSolved", e.target.value)}
                placeholder="Sản phẩm giải quyết nỗi đau nào của khách hàng?"
                className={textareaClass}
              />
            </Field>

            <Field label="Giọng thương hiệu" htmlFor="brandVoice">
              <input
                type="text"
                id="brandVoice"
                value={formData.brandVoice}
                onChange={(e) => updateField("brandVoice", e.target.value)}
                placeholder="VD: Chuyên nghiệp, thân thiện, giáo dục"
                className={inputClass}
              />
            </Field>
          </div>
        </Panel>

        <Panel title="Tuân thủ & liên kết">
          <div className="space-y-4 p-4">
            <Field
              label="Bằng chứng được phép dùng"
              htmlFor="allowedProof"
              hint="Chứng thực, số liệu đã kiểm chứng có thể nhắc trong video"
            >
              <textarea
                id="allowedProof"
                rows={3}
                value={formData.allowedProof}
                onChange={(e) => updateField("allowedProof", e.target.value)}
                placeholder="VD: 1.200 khách đã dùng, đánh giá 4.8/5..."
                className={textareaClass}
              />
            </Field>

            <Field
              label="Tuyên bố cần tránh"
              htmlFor="claimsToAvoid"
              hint="Cam kết y tế, thu nhập bảo đảm, so sánh tuyệt đối..."
            >
              <textarea
                id="claimsToAvoid"
                rows={3}
                value={formData.claimsToAvoid}
                onChange={(e) => updateField("claimsToAvoid", e.target.value)}
                placeholder="Những tuyên bố bị cấm hoặc phải tránh..."
                className={textareaClass}
              />
            </Field>

            <Field label="Link affiliate" htmlFor="affiliateLink">
              <input
                type="url"
                id="affiliateLink"
                value={formData.affiliateLink}
                onChange={(e) => updateField("affiliateLink", e.target.value)}
                placeholder="https://affiliate.com/track/yourlink"
                className={inputClass}
              />
            </Field>
          </div>
        </Panel>

        {error && <Alert tone="error">{error}</Alert>}

        {/* Sticky action bar */}
        <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface px-4 py-3 sm:-mx-6 sm:px-6">
          <p className="text-xs text-muted">
            <span className="text-error">*</span> Trường bắt buộc
          </p>
          <div className="flex items-center gap-2">
            <Button type="submit" variant="secondary" size="sm" loading={saving} disabled={busy}>
              Lưu
            </Button>
            <Button
              type="button"
              size="sm"
              loading={analyzing}
              disabled={busy}
              onClick={() => {
                const form = formRef.current;
                if (form && !form.checkValidity()) {
                  form.reportValidity();
                  return;
                }
                void submit(null, true);
              }}
            >
              {!analyzing && <Sparkles className="h-3.5 w-3.5" />}
              Lưu & phân tích AI
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
