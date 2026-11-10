import type {
  CampaignInput,
  CampaignPlan,
  PerformanceInput,
  PerformanceInsight,
  ProductAnalysis,
  ProductProfileInput,
  ScriptGeneration,
  ScriptInput,
  SellingAngle,
  SuggestAnglesInput,
} from "@/lib/ai/contract";
import {
  campaignPlanSchema,
  performanceInsightSchema,
  productAnalysisSchema,
  scriptGenerationSchema,
  sellingAngleSchema,
} from "@/lib/ai/contract";

// ─── Deterministic mock implementation ────────────────────────────────────────
// This module MUST stay deterministic and dependency-free: unit tests and the
// `mock` provider both rely on it. Real providers live in `provider.ts` and are
// selected by `AI_PROVIDER` in `index.ts`. All outputs are Zod-validated.

export async function analyzeProduct(
  input: ProductProfileInput
): Promise<ProductAnalysis> {
  const brandName = input.brandContext?.brandName ? `[${input.brandContext.brandName}] ` : "";
  const extraCompliance = input.brandContext?.forbiddenWords?.length 
    ? `Không dùng: ${input.brandContext.forbiddenWords.join(", ")}` 
    : "";

  const result: ProductAnalysis = {
    summary: `${brandName}${input.name} — ${input.description.slice(0, 120)}`,
    customerPains: [
      "Mất nhiều thời gian viết nội dung từ đầu",
      "Thiếu cấu trúc sản xuất rõ ràng cho video ngắn",
      "Không biết chọn góc nội dung phù hợp với từng nền tảng",
    ],
    customerDesires: [
      "Tạo video bán hàng chuyên nghiệp nhanh hơn",
      "Có kịch bản sẵn sàng quay mà không cần thuê agency",
      "Tái sử dụng nội dung cho nhiều chiến dịch",
    ],
    keyBenefits: input.featuresText
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 5),
    proofPoints: input.allowedProof
      ? input.allowedProof.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
      : ["[CẦN XÁC MINH] Chưa có bằng chứng cụ thể được cung cấp"],
    objections: [
      "Lo ngại về giá / ngân sách",
      "Chưa có kinh nghiệm quay video",
      "Không chắc AI có giữ đúng giọng thương hiệu không",
    ],
    sellingAngles: [
      {
        id: "angle-time",
        label: "Tiết kiệm thời gian",
        hook: `Bạn đang mất bao nhiêu giờ để viết một kịch bản video? ${input.name} giúp bạn có kịch bản hoàn chỉnh trong vài phút.`,
        rationale: "Pain point phổ biến nhất với creator và doanh nghiệp nhỏ",
      },
      {
        id: "angle-quality",
        label: "Chất lượng sản xuất",
        hook: `Video của bạn xứng đáng có cấu trúc tốt hơn. ${input.name} tạo timeline, shot list và caption có chiến lược — sẵn sàng quay ngay.`,
        rationale: "Differentiates từ các công cụ chỉ tạo text thuần túy",
      },
      {
        id: "angle-scale",
        label: "Mở rộng nội dung",
        hook: `Một sản phẩm, mười góc video khác nhau. ${input.name} biến thông tin sản phẩm thành chiến dịch nội dung hoàn chỉnh.`,
        rationale: "Phù hợp với agency và KOC cần nhiều biến thể",
      },
    ],
    claimsToVerify: [
      ...(input.claimsToAvoid ? [`[CẦN XÁC MINH] ${input.claimsToAvoid.slice(0, 200)}`] : []),
      ...(input.brandContext?.claimsToAvoid ? [`[CẦN XÁC MINH] ${input.brandContext.claimsToAvoid.slice(0, 200)}`] : [])
    ],
    suggestedCtas: [
      input.brandContext?.defaultCta ?? "Dùng thử miễn phí ngay hôm nay",
      "Tạo kịch bản đầu tiên của bạn",
      "Xem demo 2 phút",
    ],
    missingInformation: [
      ...(!input.priceOffer ? ["Chưa có thông tin giá / ưu đãi cụ thể"] : []),
      ...(!input.affiliateLink
        ? []
        : ["Cần xác minh disclosure affiliate phù hợp quy định"]),
    ],
    complianceNotes: [
      "Không sử dụng các claim tuyệt đối chưa được kiểm chứng",
      "Cần ghi rõ disclosure nếu có liên kết affiliate",
      ...(extraCompliance ? [extraCompliance] : []),
      ...(input.brandContext?.requiredDisclosure ? [`Disclosure bắt buộc: ${input.brandContext.requiredDisclosure}`] : [])
    ],
  };
  return productAnalysisSchema.parse(result);
}

export async function suggestAngles(
  input: SuggestAnglesInput
): Promise<SellingAngle[]> {
  return input.productAnalysis.sellingAngles.map((a: SellingAngle) =>
    sellingAngleSchema.parse(a)
  );
}

export async function generateScripts(
  input: ScriptInput
): Promise<ScriptGeneration> {
  const dur = input.durationSeconds;
  const thirds = Math.floor(dur / 3);

  const makeScript = (
    variant: "A" | "B" | "C",
    angle: string,
    hook: string
  ): ScriptGeneration["scripts"][number] => {
    let scriptHook = hook;
    if (input.brandContext?.brandName) scriptHook = `[${input.brandContext.brandName}] ${scriptHook}`;
    if (input.brandContext?.preferredWords?.length) scriptHook = `${scriptHook} ${input.brandContext.preferredWords[0]}`;

    let scriptCta = input.cta ?? input.analysis.suggestedCtas[0] ?? "Thử ngay hôm nay";
    if (input.brandContext?.defaultCta) scriptCta = input.brandContext.defaultCta;

    return {
      title: `Kịch bản ${variant} — ${angle}`,
      angle,
      hook: scriptHook,
      durationSeconds: dur,
      shots: [
        {
          startSecond: 0,
          endSecond: thirds,
          purpose: "Hook — thu hút chú ý",
          spokenText: scriptHook,
          visualDirection: "Gương mặt presenter nhìn thẳng camera, biểu cảm tự nhiên",
          onScreenText: scriptHook.slice(0, 60),
          bRoll: "Cảnh sản phẩm hoặc kết quả trực quan",
          cameraAction: "Medium close-up, ánh sáng tốt",
        },
        {
          startSecond: thirds,
          endSecond: thirds * 2,
          purpose: "Thân bài — lợi ích / bằng chứng",
          spokenText: `${input.product.name} giúp bạn ${input.analysis.keyBenefits[0] ?? "[lợi ích chính]"}.`,
          visualDirection: "Screencast hoặc demo sản phẩm",
          onScreenText: input.analysis.keyBenefits[0] ?? "",
          bRoll: "Demo tính năng chính",
        },
        {
          startSecond: thirds * 2,
          endSecond: dur,
          purpose: "CTA",
          spokenText: scriptCta,
          visualDirection: "Text overlay CTA rõ ràng, presenter chỉ vào link",
          onScreenText: scriptCta,
        },
      ],
      alternativeHooks: input.analysis.sellingAngles
        .filter((a: SellingAngle) => a.id !== input.selectedAngle.id)
        .map((a: SellingAngle) => a.hook)
        .slice(0, 5),
      audioSuggestion: "Nhạc nền nhẹ, upbeat, BPM 100-120, không lời",
      cta: scriptCta,
      caption: `${scriptHook}\n\n${input.product.description}\n\n${scriptCta}`,
      hashtags: [
        "#aimo",
        "#videobanhang",
        `#${input.platform}`,
        "#contentcreator",
        "#aigioithieu",
      ],
      disclosureNote: input.product.affiliateLink
        ? "Video này có chứa liên kết affiliate. Chúng tôi có thể nhận hoa hồng nếu bạn mua qua link."
        : (input.brandContext?.requiredDisclosure ?? ""),
      warnings: input.analysis.claimsToVerify.slice(0, 2),
    };
  };

  const result: ScriptGeneration = {
    scripts: [
      makeScript("A", input.selectedAngle.label, input.selectedAngle.hook),
      makeScript(
        "B",
        input.analysis.sellingAngles[1]?.label ?? "Góc B",
        input.analysis.sellingAngles[1]?.hook ?? `${input.product.name} — góc nội dung thứ hai`
      ),
      makeScript(
        "C",
        input.analysis.sellingAngles[2]?.label ?? "Góc C",
        input.analysis.sellingAngles[2]?.hook ?? `${input.product.name} — góc nội dung thứ ba`
      ),
    ],
    missingInformation: input.analysis.missingInformation,
    complianceNotes: input.analysis.complianceNotes,
  };
  return scriptGenerationSchema.parse(result);
}

export async function generateCampaign(
  input: CampaignInput
): Promise<CampaignPlan> {
  const angles = input.analysis.sellingAngles;
  const days = Array.from({ length: input.durationDays }, (_, i) => {
    const angle = angles[i % angles.length];
    return {
      day: i + 1,
      topic: angle.label,
      angle: angle.hook,
      format:
        i % 3 === 0
          ? "problem-solution"
          : i % 3 === 1
          ? "review"
          : "testimonial",
      goal: i < Math.floor(input.durationDays / 3) ? "awareness" : "conversion",
      notes: "",
    };
  });

  const result: CampaignPlan = {
    name: `Chiến dịch ${input.product.name} — ${input.durationDays} ngày`,
    summary: `Kế hoạch nội dung ${input.durationDays} ngày cho ${input.product.name} trên ${input.platform}, mục tiêu ${input.goal}.`,
    days,
    missingInformation: input.analysis.missingInformation,
  };
  return campaignPlanSchema.parse(result);
}

export async function analyzePerformance(
  input: PerformanceInput
): Promise<PerformanceInsight[]> {
  const { metrics } = input;
  const insights: PerformanceInsight[] = [];

  if (metrics.watchThroughRate !== undefined) {
    const good = metrics.watchThroughRate >= 50;
    insights.push(
      performanceInsightSchema.parse({
        category: "hook",
        observation: `Watch-through rate: ${metrics.watchThroughRate}%`,
        suggestion: good
          ? "Hook đang hoạt động tốt. Thử A/B test thêm các biến thể để tối ưu hơn nữa."
          : "Watch-through rate thấp — thử hook ngắn hơn (dưới 3 giây) và đặt câu hỏi trực tiếp.",
        confidence: "medium",
        caveat:
          "Insight dựa trên dữ liệu bạn nhập. Cần ít nhất 1.000 lượt xem để kết luận thống kê.",
      })
    );
  }

  if (metrics.clicks !== undefined && metrics.views !== undefined && metrics.views > 0) {
    const ctr = (metrics.clicks / metrics.views) * 100;
    insights.push(
      performanceInsightSchema.parse({
        category: "cta",
        observation: `CTR ước tính: ${ctr.toFixed(2)}%`,
        suggestion:
          ctr < 1
            ? "CTR thấp — thử đặt CTA sớm hơn trong video (giây thứ 10-15) và dùng câu lệnh cụ thể."
            : "CTR ổn. Thử thêm urgency hoặc social proof vào CTA.",
        confidence: "medium",
        caveat: "CTR phụ thuộc nhiều vào nền tảng và loại tài khoản.",
      })
    );
  }

  if (insights.length === 0) {
    insights.push(
      performanceInsightSchema.parse({
        category: "general",
        observation: "Chưa đủ dữ liệu để phân tích chi tiết",
        suggestion:
          "Nhập thêm chỉ số như views, watch-through rate và clicks để nhận insight cụ thể hơn.",
        confidence: "low",
        caveat: "AI chỉ đưa insight dựa trên dữ liệu đã nhập, không khẳng định nhân quả.",
      })
    );
  }

  return insights;
}
