import { z } from "zod";

// ─── Shared primitives ────────────────────────────────────────────────────────
const nonEmpty = z.string().trim().min(1).max(2_000);
const shortStr = z.string().trim().max(300).default("");
const strList = z.array(z.string().trim().min(1).max(500)).max(50).default([]);

// ─── Product Analysis ─────────────────────────────────────────────────────────
export const productAnalysisSchema = z.object({
  summary: nonEmpty,
  customerPains: strList,
  customerDesires: strList,
  keyBenefits: strList,
  proofPoints: strList,
  objections: strList,
  sellingAngles: z.array(
    z.object({
      id: z.string(),
      label: nonEmpty,
      hook: nonEmpty,
      rationale: nonEmpty,
    })
  ).min(1).max(10),
  claimsToVerify: strList,
  suggestedCtas: strList,
  missingInformation: strList,
  complianceNotes: strList,
});
export type ProductAnalysis = z.infer<typeof productAnalysisSchema>;

// ─── Selling Angles ───────────────────────────────────────────────────────────
export const sellingAngleSchema = z.object({
  id: z.string(),
  label: nonEmpty,
  hook: nonEmpty,
  rationale: nonEmpty,
});
export type SellingAngle = z.infer<typeof sellingAngleSchema>;

// ─── Script Shot ──────────────────────────────────────────────────────────────
export const scriptShotSchema = z.object({
  startSecond: z.number().int().min(0),
  endSecond: z.number().int().min(1),
  purpose: nonEmpty,
  spokenText: z.string().trim().max(2_000).default(""),
  visualDirection: nonEmpty,
  onScreenText: z.string().trim().max(300).default(""),
  bRoll: z.string().trim().max(500).optional(),
  cameraAction: z.string().trim().max(300).optional(),
});
export type ScriptShot = z.infer<typeof scriptShotSchema>;

// ─── Script Generation ────────────────────────────────────────────────────────
export const scriptItemSchema = z.object({
  title: nonEmpty,
  angle: nonEmpty,
  hook: nonEmpty,
  durationSeconds: z.number().int().min(15).max(300),
  shots: z.array(scriptShotSchema).min(1).max(30),
  alternativeHooks: strList,
  audioSuggestion: shortStr,
  cta: nonEmpty,
  caption: nonEmpty,
  hashtags: strList,
  disclosureNote: shortStr,
  warnings: strList,
});
export type ScriptItem = z.infer<typeof scriptItemSchema>;

export const scriptGenerationSchema = z.object({
  scripts: z.array(scriptItemSchema).min(1).max(3),
  missingInformation: strList,
  complianceNotes: strList,
});
export type ScriptGeneration = z.infer<typeof scriptGenerationSchema>;

// ─── Campaign Plan ────────────────────────────────────────────────────────────
export const campaignDaySchema = z.object({
  day: z.number().int().min(1).max(30),
  topic: nonEmpty,
  angle: nonEmpty,
  format: nonEmpty,
  goal: nonEmpty,
  notes: shortStr,
});
export const campaignPlanSchema = z.object({
  name: nonEmpty,
  summary: nonEmpty,
  days: z.array(campaignDaySchema).min(1).max(30),
  missingInformation: strList,
});
export type CampaignPlan = z.infer<typeof campaignPlanSchema>;

// ─── Performance Insight ──────────────────────────────────────────────────────
export const performanceInsightSchema = z.object({
  category: z.enum(["hook", "cta", "duration", "format", "content", "general"]),
  observation: nonEmpty,
  suggestion: nonEmpty,
  confidence: z.enum(["low", "medium", "high"]),
  caveat: shortStr,
});
export type PerformanceInsight = z.infer<typeof performanceInsightSchema>;

// ─── Brand Context ────────────────────────────────────────────────────────────
export const brandContextSchema = z.object({
  brandName: z.string().optional(),
  targetAudience: z.string().optional(),
  voiceTone: z.string().optional(),
  preferredWords: z.array(z.string()).optional(),
  forbiddenWords: z.array(z.string()).optional(),
  defaultCta: z.string().optional(),
  requiredDisclosure: z.string().optional(),
  claimsToAvoid: z.string().optional(),
  exampleCopy: z.string().optional(),
});
export type BrandContext = z.infer<typeof brandContextSchema>;

// ─── AI Service Input Types ───────────────────────────────────────────────────
export interface ProductProfileInput {
  name: string;
  description: string;
  priceOffer?: string;
  featuresText: string;
  targetCustomer: string;
  problemSolved: string;
  allowedProof: string;
  claimsToAvoid: string;
  affiliateLink?: string;
  brandVoice?: string;
  brandContext?: BrandContext;
}

export interface SuggestAnglesInput {
  productAnalysis: ProductAnalysis;
  platform: string;
  goal: string;
}

export interface ScriptInput {
  product: ProductProfileInput;
  analysis: ProductAnalysis;
  selectedAngle: SellingAngle;
  platform: "tiktok" | "reels" | "shorts" | "facebook";
  goal: "awareness" | "engagement" | "conversion" | "lead";
  durationSeconds: number;
  format: "ugc" | "review" | "unbox" | "problem-solution" | "tutorial" | "comparison" | "storytelling" | "testimonial";
  presenter?: string;
  tone?: string;
  cta?: string;
  brandVoice?: string;
  complianceConstraints?: string;
  brandContext?: BrandContext;
}

export interface CampaignInput {
  product: ProductProfileInput;
  analysis: ProductAnalysis;
  platform: string;
  goal: string;
  durationDays: 7 | 14 | 30;
}

export interface PerformanceInput {
  scriptTitle: string;
  scriptAngle?: string;
  metrics: {
    views?: number;
    watchThroughRate?: number;
    avgWatchTime?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    clicks?: number;
    leads?: number;
    orders?: number;
    commission?: number;
  };
}
