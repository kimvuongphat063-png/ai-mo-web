"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PageHeader,
  Stepper,
  Panel,
  Field,
  inputClass,
  textareaClass,
  Button,
  Alert,
  EmptyState,
  Spinner,
} from "@/components/studio/ui";
import { Wand2, Sparkles } from "lucide-react";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  targetCustomer: string;
};

type SellingAngle = {
  id: string;
  label: string;
  hook: string;
  rationale: string;
};

type ProductAnalysis = {
  sellingAngles: SellingAngle[];
};

export default function NewScriptPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [angles, setAngles] = useState<SellingAngle[]>([]);
  const [loadingAngles, setLoadingAngles] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [retryable, setRetryable] = useState(false);

  const [formData, setFormData] = useState({
    selectedAngleId: "",
    platform: "tiktok" as "tiktok" | "reels" | "shorts" | "facebook",
    goal: "conversion" as "awareness" | "engagement" | "conversion" | "lead",
    durationSeconds: 30,
    format: "ugc" as
      | "ugc"
      | "review"
      | "unbox"
      | "problem-solution"
      | "tutorial"
      | "comparison"
      | "storytelling"
      | "testimonial",
    presenter: "",
    tone: "",
    cta: "",
    complianceConstraints: "",
  });

  // Load products on mount
  useEffect(() => {
    fetch("/api/studio/products")
      .then((r) => r.json())
      .then((data) => {
        if (data.products) setProducts(data.products);
      })
      .catch(() => setError("Không thể tải danh sách sản phẩm"));
  }, []);

  // Load angles when product is selected
  useEffect(() => {
    if (!selectedProductId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAngles([]);
      return;
    }

    setLoadingAngles(true);
    setError("");
    fetch(`/api/studio/products/${selectedProductId}/analyze`, {
      method: "POST",
    })
      .then((r) => r.json())
      .then((data: ProductAnalysis) => {
        if (data.sellingAngles) {
          setAngles(data.sellingAngles);
          if (data.sellingAngles.length > 0) {
            setFormData((prev) => ({
              ...prev,
              selectedAngleId: data.sellingAngles[0].id,
            }));
          }
        }
      })
      .catch(() => setError("Không thể tải góc bán hàng"))
      .finally(() => setLoadingAngles(false));
  }, [selectedProductId]);

  const handleGenerate = async () => {
    if (!selectedProductId || !formData.selectedAngleId) {
      setError("Vui lòng chọn sản phẩm và góc bán hàng");
      return;
    }

    setGenerating(true);
    setError("");
    setRetryable(false);

    try {
      const res = await fetch("/api/studio/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productProfileId: selectedProductId,
          ...formData,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Server returns a user-friendly Vietnamese message plus a retryable flag.
        setRetryable(Boolean(data.retryable));
        throw new Error(data.error || "Không thể tạo script");
      }

      router.push(`/app/scripts/${data.script.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
      setGenerating(false);
    }
  };

  const steps = ["Chọn Sản Phẩm", "Chọn Góc Bán Hàng", "Cấu Hình Script"];

  return (
    <>
      <PageHeader
        title="Tạo Script Mới"
        description="Tạo kịch bản video được tối ưu hóa bằng AI cho sản phẩm của bạn"
        backHref="/app/scripts"
        backLabel="Scripts"
      />

      <div className="mb-6">
        <Stepper steps={steps} current={step} />
      </div>

      {error && (
        <Alert tone="error" title="Lỗi" className="mb-6">
          {error}
          {retryable && (
            <p className="mt-1 text-xs opacity-90">
              Sự cố tạm thời — bạn có thể bấm tạo lại sau ít phút.
            </p>
          )}
        </Alert>
      )}

      {/* Step 0: Select Product */}
      {step === 0 && (
        <Panel title="Chọn Sản Phẩm">
          <div className="p-6">
            {products.length === 0 ? (
              <EmptyState
                icon={Wand2}
                title="Chưa có sản phẩm"
                description="Tạo sản phẩm đầu tiên để bắt đầu"
                action={
                  <Button
                    variant="primary"
                    onClick={() => router.push("/app/products/new")}
                  >
                    Tạo Sản Phẩm
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4">
                <Field label="Sản phẩm" htmlFor="product" required>
                  <select
                    id="product"
                    value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      setStep(1);
                    }}
                    className={inputClass}
                  >
                    <option value="">-- Chọn sản phẩm --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            )}
          </div>
        </Panel>
      )}

      {/* Step 1: Select Selling Angle */}
      {step === 1 && selectedProductId && (
        <Panel
          title="Chọn Góc Bán Hàng"
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStep(0);
                setSelectedProductId("");
              }}
            >
              Đổi sản phẩm
            </Button>
          }
        >
          <div className="p-6">
            {loadingAngles ? (
              <div className="flex items-center justify-center gap-2 py-12 text-muted">
                <Spinner />
                <span className="text-sm">Đang phân tích sản phẩm...</span>
              </div>
            ) : angles.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="Không tìm thấy góc bán hàng"
                description="Hãy chạy phân tích AI cho sản phẩm này"
                action={
                  <Button
                    variant="secondary"
                    onClick={() =>
                      router.push(`/app/products/${selectedProductId}`)
                    }
                  >
                    Phân Tích Sản Phẩm
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {angles.map((angle) => (
                    <label
                      key={angle.id}
                      className="block cursor-pointer rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent has-[:checked]:border-accent has-[:checked]:bg-accent-subtle/20"
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="angle"
                          value={angle.id}
                          checked={formData.selectedAngleId === angle.id}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              selectedAngleId: e.target.value,
                            }))
                          }
                          className="mt-1 accent-accent"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="mb-1 font-medium text-text">
                            {angle.label}
                          </p>
                          <p className="mb-2 text-sm text-text-2">
                            Hook: {angle.hook}
                          </p>
                          <p className="text-xs text-muted">
                            {angle.rationale}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {formData.selectedAngleId && (
                  <div className="flex justify-end pt-4">
                    <Button onClick={() => setStep(2)}>
                      Tiếp Theo: Cấu Hình
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Panel>
      )}

      {/* Step 2: Configure Script */}
      {step === 2 && selectedProductId && formData.selectedAngleId && (
        <div className="space-y-6">
          <Panel
            title="Cấu Hình Script"
            actions={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(1)}
              >
                Đổi góc bán hàng
              </Button>
            }
          >
            <div className="p-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Nền Tảng" htmlFor="platform" required>
                  <select
                    id="platform"
                    value={formData.platform}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        platform: e.target.value as typeof formData.platform,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="tiktok">TikTok</option>
                    <option value="reels">Instagram Reels</option>
                    <option value="shorts">YouTube Shorts</option>
                    <option value="facebook">Facebook</option>
                  </select>
                </Field>

                <Field label="Mục Tiêu" htmlFor="goal" required>
                  <select
                    id="goal"
                    value={formData.goal}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        goal: e.target.value as typeof formData.goal,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="awareness">Awareness (Nhận biết)</option>
                    <option value="engagement">
                      Engagement (Tương tác)
                    </option>
                    <option value="conversion">
                      Conversion (Chuyển đổi)
                    </option>
                    <option value="lead">Lead (Thu thập lead)</option>
                  </select>
                </Field>

                <Field
                  label="Độ Dài Video (giây)"
                  htmlFor="duration"
                  hint="15-300 giây"
                  required
                >
                  <input
                    id="duration"
                    type="number"
                    min="15"
                    max="300"
                    step="5"
                    value={formData.durationSeconds}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        durationSeconds: Number(e.target.value),
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Định Dạng" htmlFor="format" required>
                  <select
                    id="format"
                    value={formData.format}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        format: e.target.value as typeof formData.format,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="ugc">UGC</option>
                    <option value="review">Review</option>
                    <option value="unbox">Unbox</option>
                    <option value="problem-solution">
                      Problem-Solution
                    </option>
                    <option value="tutorial">Tutorial</option>
                    <option value="comparison">Comparison</option>
                    <option value="storytelling">Storytelling</option>
                    <option value="testimonial">Testimonial</option>
                  </select>
                </Field>

                <Field
                  label="Người Trình Bày"
                  htmlFor="presenter"
                  hint="VD: KOL 25-35 tuổi, năng động"
                >
                  <input
                    id="presenter"
                    type="text"
                    value={formData.presenter}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        presenter: e.target.value,
                      }))
                    }
                    placeholder="Tùy chọn"
                    className={inputClass}
                  />
                </Field>

                <Field
                  label="Giọng Điệu"
                  htmlFor="tone"
                  hint="VD: Thân thiện, hài hước, chuyên nghiệp"
                >
                  <input
                    id="tone"
                    type="text"
                    value={formData.tone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tone: e.target.value,
                      }))
                    }
                    placeholder="Tùy chọn"
                    className={inputClass}
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field
                    label="Call-to-Action"
                    htmlFor="cta"
                    hint="VD: Nhấn link mô tả để mua ngay"
                  >
                    <input
                      id="cta"
                      type="text"
                      value={formData.cta}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          cta: e.target.value,
                        }))
                      }
                      placeholder="Tùy chọn"
                      className={inputClass}
                    />
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <Field
                    label="Ràng Buộc Tuân Thủ"
                    htmlFor="compliance"
                    hint="VD: Không được claim về y tế, không so sánh với đối thủ"
                  >
                    <textarea
                      id="compliance"
                      value={formData.complianceConstraints}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          complianceConstraints: e.target.value,
                        }))
                      }
                      placeholder="Tùy chọn"
                      rows={3}
                      className={textareaClass}
                    />
                  </Field>
                </div>
              </div>
            </div>
          </Panel>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Quay Lại
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              loading={generating}
            >
              {generating ? (
                <>Đang tạo script...</>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Tạo Script với AI
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
