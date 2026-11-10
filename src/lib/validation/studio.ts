import { z } from "zod";

// ─── Shared primitives ─────────────────────────────────────────────────────────
const nonEmpty = z.string().trim().min(1, "Trường này là bắt buộc").max(2_000);
const optText  = z.string().trim().max(2_000).default("");
const urlOrEmpty = z
  .string()
  .trim()
  .max(500)
  .refine((v) => !v || /^https?:\/\/.+/.test(v), "URL không hợp lệ")
  .default("");

// ─── ProductProfile form ───────────────────────────────────────────────────────
export const productProfileFormSchema = z.object({
  name:           nonEmpty.max(200, "Tối đa 200 ký tự"),
  url:            urlOrEmpty,
  description:    nonEmpty.max(2_000),
  priceOffer:     z.string().trim().max(300).default(""),
  featuresText:   nonEmpty.max(2_000),
  targetCustomer: nonEmpty.max(500),
  problemSolved:  nonEmpty.max(1_000),
  allowedProof:   z.string().trim().max(1_000).default(""),
  claimsToAvoid:  z.string().trim().max(1_000).default(""),
  affiliateLink:  urlOrEmpty,
  brandVoice:     z.string().trim().max(1_000).default(""),
});
export type ProductProfileFormValues = z.infer<typeof productProfileFormSchema>;

// ─── Script Wizard form ────────────────────────────────────────────────────────
export const scriptWizardFormSchema = z.object({
  productProfileId: nonEmpty,
  selectedAngleId:  nonEmpty,
  platform:  z.enum(["tiktok","reels","shorts","facebook"], {
    errorMap: () => ({ message: "Chọn nền tảng" }),
  }),
  goal:      z.enum(["awareness","engagement","conversion","lead"], {
    errorMap: () => ({ message: "Chọn mục tiêu" }),
  }),
  durationSeconds: z.number().int().min(15).max(300),
  format: z.enum([
    "ugc","review","unbox","problem-solution","tutorial","comparison","storytelling","testimonial",
  ], { errorMap: () => ({ message: "Chọn định dạng" }) }),
  presenter:            z.string().trim().max(200).default(""),
  tone:                 z.string().trim().max(200).default(""),
  cta:                  z.string().trim().max(300).default(""),
  complianceConstraints: z.string().trim().max(1_000).default(""),
});
export type ScriptWizardFormValues = z.infer<typeof scriptWizardFormSchema>;

// ─── Campaign form ─────────────────────────────────────────────────────────────
export const campaignFormSchema = z.object({
  name:             nonEmpty.max(200),
  startDate:        nonEmpty.max(40),
  productProfileId: z.string().trim().max(100).default(""),
  platform:  z.enum(["tiktok","reels","shorts","facebook","multi"]),
  goal:      z.enum(["awareness","engagement","conversion","lead"]),
  durationDays: z.union([z.literal(7), z.literal(14), z.literal(30)]),
  owner:    z.string().trim().max(200).default(""),
  deadline: z.string().trim().max(40).default(""),
  note:     z.string().trim().max(1_000).default(""),
});
export type CampaignFormValues = z.infer<typeof campaignFormSchema>;

/**
 * Campaign day assignment / status update.
 *
 * Policy:
 * - One slot per day (day number is unique within a campaign).
 * - Same script may be reused on **different** days of the same campaign.
 * - Same script cannot be assigned twice to the **same** day (idempotent re-save OK).
 * - `scriptId: null` or `""` clears the assignment for that day.
 */
export const campaignDayStatusSchema = z.enum([
  "planned",
  "scripted",
  "produced",
  "published",
  "archived",
]);

export const campaignDayUpdateSchema = z
  .object({
    day: z.coerce.number().int().min(1).max(30),
    /** Omit to leave unchanged; null/"" clears the script assignment. */
    scriptId: z
      .union([z.string().trim().min(1).max(100), z.literal(""), z.null()])
      .optional(),
    status: campaignDayStatusSchema.optional(),
    publishedUrl: z
      .string()
      .trim()
      .max(500)
      .refine((v) => !v || /^https?:\/\/.+/.test(v), "URL không hợp lệ")
      .optional(),
    notes: z.string().trim().max(2_000).optional(),
  })
  .refine(
    (v) =>
      v.scriptId !== undefined ||
      v.status !== undefined ||
      v.publishedUrl !== undefined ||
      v.notes !== undefined,
    { message: "Cần ít nhất một trường để cập nhật" }
  );

export type CampaignDayUpdateValues = z.infer<typeof campaignDayUpdateSchema>;

// ─── Brand Memory form ─────────────────────────────────────────────────────────
export const brandMemoryFormSchema = z.object({
  brandName:       nonEmpty.max(200),
  audience:        nonEmpty.max(500),
  preferredWords:  z.string().trim().max(1_000).default(""),
  forbiddenWords:  z.string().trim().max(1_000).default(""),
  tone:            z.string().trim().max(300).default(""),
  language:        z.enum(["vi","en"]).default("vi"),
  cta:             z.string().trim().max(300).default(""),
  disclosure:      z.string().trim().max(1_000).default(""),
  exampleScript:   z.string().trim().max(5_000).default(""),
});
export type BrandMemoryFormValues = z.infer<typeof brandMemoryFormSchema>;

// ─── Performance Metric form ───────────────────────────────────────────────────
export const performanceMetricFormSchema = z.object({
  scriptId:         z.string().trim().max(100).default(""),
  views:            z.coerce.number().int().min(0).optional(),
  watchThroughRate: z.coerce.number().min(0).max(100).optional(),
  avgWatchTime:     z.coerce.number().min(0).optional(),
  likes:            z.coerce.number().int().min(0).optional(),
  comments:         z.coerce.number().int().min(0).optional(),
  shares:           z.coerce.number().int().min(0).optional(),
  clicks:           z.coerce.number().int().min(0).optional(),
  leads:            z.coerce.number().int().min(0).optional(),
  orders:           z.coerce.number().int().min(0).optional(),
  commission:       z.coerce.number().min(0).optional(),
  notes:            z.string().trim().max(2_000).default(""),
});
export type PerformanceMetricFormValues = z.infer<typeof performanceMetricFormSchema>;
