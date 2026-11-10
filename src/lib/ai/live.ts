import "server-only";
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
  BrandContext,
} from "@/lib/ai/contract";
import {
  campaignPlanSchema,
  performanceInsightSchema,
  productAnalysisSchema,
  scriptGenerationSchema,
  sellingAngleSchema,
} from "@/lib/ai/contract";
import { generateStructured } from "@/lib/ai/provider";
import { z } from "zod";

function buildSystemPrompt(brandContext?: BrandContext) {
  const base = [
    "Bạn là chuyên gia sáng tạo nội dung video ngắn bán hàng tại Việt Nam.",
    "Luôn trả lời bằng tiếng Việt tự nhiên, đúng giọng thương hiệu được cung cấp.",
    "TUYỆT ĐỐI KHÔNG bịa số liệu, chứng nhận y tế hoặc cam kết kết quả.",
    "Nếu thiếu dữ kiện, hãy ghi vào `missingInformation` thay vì suy đoán.",
    "Mọi claim chưa được kiểm chứng phải đưa vào `claimsToVerify` với tiền tố [CẦN XÁC MINH].",
    "Nếu có liên kết affiliate, bắt buộc thêm disclosure.",
    "CHỈ trả về JSON hợp lệ đúng schema được mô tả, không thêm lời dẫn hay markdown.",
  ];

  if (brandContext) {
    base.push("--- HƯỚNG DẪN THƯƠNG HIỆU ---");
    if (brandContext.brandName) base.push(`Tên thương hiệu: ${brandContext.brandName}`);
    if (brandContext.voiceTone) base.push(`Giọng điệu: ${brandContext.voiceTone}`);
    if (brandContext.targetAudience) base.push(`Đối tượng mục tiêu: ${brandContext.targetAudience}`);
    if (brandContext.preferredWords?.length) base.push(`Từ vựng ưu tiên: ${brandContext.preferredWords.join(", ")}`);
    if (brandContext.forbiddenWords?.length) base.push(`Từ CẤM sử dụng: ${brandContext.forbiddenWords.join(", ")}`);
    if (brandContext.claimsToAvoid) base.push(`Các claim tuyệt đối tránh: ${brandContext.claimsToAvoid}`);
    if (brandContext.requiredDisclosure) base.push(`Disclosure bắt buộc: ${brandContext.requiredDisclosure}`);
    base.push("Lưu ý: Hướng dẫn thương hiệu không được phép ghi đè các quy định cấm claim y tế hoặc cam kết kết quả vô căn cứ.");
  }

  return base.join("\n");
}

const json = (value: unknown) => JSON.stringify(value, null, 2);

export async function analyzeProduct(
  input: ProductProfileInput
): Promise<ProductAnalysis> {
  return generateStructured(
    {
      system: buildSystemPrompt(input.brandContext),
      user: [
        "Phân tích sản phẩm sau để chuẩn bị nội dung video bán hàng.",
        json(input),
        "",
        "Trả về JSON với các khoá: summary (string), customerPains, customerDesires,",
        "keyBenefits, proofPoints, objections, claimsToVerify, suggestedCtas,",
        "missingInformation, complianceNotes (mảng chuỗi), và sellingAngles",
        "(mảng 3-5 phần tử gồm id, label, hook, rationale — id dạng slug ví dụ 'angle-time').",
      ].join("\n"),
    },
    productAnalysisSchema
  );
}

export async function suggestAngles(
  input: SuggestAnglesInput
): Promise<SellingAngle[]> {
  return generateStructured(
    {
      system: buildSystemPrompt(),
      user: [
        `Đề xuất góc bán hàng cho nền tảng ${input.platform}, mục tiêu ${input.goal}.`,
        json(input.productAnalysis),
        "",
        'Trả về JSON: { "angles": [{ id, label, hook, rationale }] } với 3-6 phần tử.',
      ].join("\n"),
      maxTokens: 2_000,
    },
    z.object({ angles: z.array(sellingAngleSchema).min(1).max(10) })
  ).then((r) => r.angles);
}

export async function generateScripts(
  input: ScriptInput
): Promise<ScriptGeneration> {
  return generateStructured(
    {
      system: buildSystemPrompt(input.brandContext),
      user: [
        `Viết 3 biến thể kịch bản video ${input.durationSeconds} giây cho ${input.platform},`,
        `định dạng ${input.format}, mục tiêu ${input.goal}.`,
        json({
          product: input.product,
          analysis: input.analysis,
          selectedAngle: input.selectedAngle,
          presenter: input.presenter,
          tone: input.tone,
          cta: input.cta,
          brandVoice: input.brandVoice,
          complianceConstraints: input.complianceConstraints,
        }),
        "",
        "Trả về JSON: { scripts: [...3 phần tử...], missingInformation: [], complianceNotes: [] }.",
        "Mỗi script gồm: title, angle, hook, durationSeconds (số nguyên = thời lượng yêu cầu),",
        "shots (mảng, mỗi phần tử có startSecond, endSecond là số nguyên liên tục phủ kín thời lượng,",
        "purpose, spokenText, visualDirection, onScreenText, bRoll, cameraAction),",
        "alternativeHooks, audioSuggestion, cta, caption, hashtags, disclosureNote, warnings.",
      ].join("\n"),
      maxTokens: 8_000,
    },
    scriptGenerationSchema
  );
}

export async function generateCampaign(
  input: CampaignInput
): Promise<CampaignPlan> {
  return generateStructured(
    {
      system: buildSystemPrompt(),
      user: [
        `Lập kế hoạch nội dung ${input.durationDays} ngày trên ${input.platform}, mục tiêu ${input.goal}.`,
        json({ product: input.product, analysis: input.analysis }),
        "",
        `Trả về JSON: { name, summary, days: [${input.durationDays} phần tử { day, topic, angle, format, goal, notes }], missingInformation: [] }.`,
        "day chạy từ 1 tăng dần, không trùng lặp.",
      ].join("\n"),
      maxTokens: 6_000,
    },
    campaignPlanSchema
  );
}

export async function analyzePerformance(
  input: PerformanceInput
): Promise<PerformanceInsight[]> {
  return generateStructured(
    {
      system: buildSystemPrompt(),
      user: [
        "Phân tích hiệu suất video dựa trên chỉ số người dùng cung cấp.",
        json(input),
        "",
        'Trả về JSON: { "insights": [{ category, observation, suggestion, confidence, caveat }] }.',
        "category ∈ hook|cta|duration|format|content|general; confidence ∈ low|medium|high.",
        "Luôn nêu caveat về giới hạn dữ liệu, không khẳng định quan hệ nhân quả.",
      ].join("\n"),
      maxTokens: 2_000,
    },
    z.object({ insights: z.array(performanceInsightSchema).min(1).max(10) })
  ).then((r) => r.insights);
}
