import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────────────────────

const nonEmpty = z.string().trim().min(1);
const optText = z.string().trim().optional();
const urlOrEmpty = z
  .string()
  .trim()
  .optional()
  .refine((s) => !s || /^https?:\/\/.+/.test(s), "URL phải bắt đầu bằng http/https");

export const productProfileSchema = z.object({
  id: nonEmpty,
  userId: nonEmpty,
  name: nonEmpty,
  url: urlOrEmpty,
  description: nonEmpty,
  priceOffer: optText,
  featuresText: nonEmpty,
  targetCustomer: nonEmpty,
  problemSolved: nonEmpty,
  allowedProof: optText,
  claimsToAvoid: optText,
  affiliateLink: urlOrEmpty,
  brandVoice: optText,
  analysisCache: z.any().optional(),
  analysisFingerprint: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const timelineEntrySchema = z.object({
  startSecond: z.number(),
  endSecond: z.number(),
  purpose: nonEmpty,
  spokenText: z.string().trim().default(""),
  visualDirection: nonEmpty,
  onScreenText: z.string().trim().default(""),
  bRoll: optText,
  cameraAction: optText,
  ctaLine: optText,
});

const scriptItemSchema = z.object({
  title: nonEmpty,
  angle: nonEmpty,
  hook: nonEmpty,
  durationSeconds: z.number().int().min(15).max(300),
  shots: z.array(timelineEntrySchema).min(1),
  alternativeHooks: z.array(z.string()).default([]),
  audioSuggestion: z.string().trim().default(""),
  cta: nonEmpty,
  caption: nonEmpty,
  hashtags: z.array(z.string()).min(0).max(30).default([]),
  disclosureNote: z.string().trim().default(""),
  warnings: z.array(z.string()).default([]),
});

export const scriptSchema = z.object({
  id: nonEmpty,
  userId: nonEmpty,
  productProfileId: nonEmpty,
  platform: z.enum(["tiktok", "reels", "shorts", "facebook"]),
  goal: z.enum(["awareness", "engagement", "conversion", "lead"]),
  durationSeconds: z.number().int().min(15).max(300),
  selectedAngleId: nonEmpty,
  scripts: z.array(scriptItemSchema).min(1).max(3),
  missingInformation: z.array(z.string()).default([]),
  complianceNotes: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const campaignItemSchema = z.object({
  day: z.number().int().min(1),
  scriptId: optText,
  status: z.enum(["planned", "scripted", "produced", "published", "archived"]),
  publishedUrl: optText,
  notes: optText,
});

export const campaignSchema = z.object({
  id: nonEmpty,
  userId: nonEmpty,
  name: nonEmpty,
  startDate: z.string(),
  durationDays: z.union([z.literal(7), z.literal(14), z.literal(30)]),
  platform: z.enum(["tiktok", "reels", "shorts", "facebook", "multi"]),
  goal: z.enum(["awareness", "engagement", "conversion", "lead"]),
  items: z.array(campaignItemSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const brandProfileSchema = z.object({
  userId: nonEmpty,
  companyName: optText,
  brandVoice: optText,
  prohibitedClaims: optText,
  requiredDisclosures: optText,
  preferredFormats: z.array(z.string()),
  targetAudience: optText,
  competitorUrls: z.array(z.string()),
  language: z.enum(["vi", "en"]),
  updatedAt: z.string(),
});

export const performanceMetricSchema = z.object({
  id: nonEmpty,
  userId: nonEmpty,
  scriptId: nonEmpty,
  campaignId: optText,
  recordedAt: z.string(),
  views: z.number().int().min(0),
  likes: z.number().int().min(0),
  comments: z.number().int().min(0),
  shares: z.number().int().min(0),
  clicks: z.number().int().min(0),
  conversions: z.number().int().min(0),
  revenue: z.number().min(0),
  costSpent: z.number().min(0),
  watchTimeSeconds: z.number().int().min(0),
  engagementRate: z.number().min(0),
  ctr: z.number().min(0),
  roas: z.number().min(0),
});

export const studioDbSchema = z.object({
  products: z.array(productProfileSchema),
  scripts: z.array(scriptSchema),
  campaigns: z.array(campaignSchema),
  brandProfiles: z.array(brandProfileSchema),
  performanceMetrics: z.array(performanceMetricSchema),
  updatedAt: z.string(),
});

export type CampaignDayPatch = {
  scriptId?: string | null;
  status?: CampaignItem["status"];
  publishedUrl?: string;
  notes?: string;
};

export type ProductProfile = z.infer<typeof productProfileSchema>;
export type Script = z.infer<typeof scriptSchema>;
export type Campaign = z.infer<typeof campaignSchema>;
export type CampaignItem = z.infer<typeof campaignItemSchema>;
export type BrandProfile = z.infer<typeof brandProfileSchema>;
export type PerformanceMetric = z.infer<typeof performanceMetricSchema>;
export type StudioDb = z.infer<typeof studioDbSchema>;

/** Thrown for ownership / business-rule failures on campaign day mutations. */
export class StudioConflictError extends Error {
  readonly code: "not_found" | "script_not_found" | "day_not_found" | "duplicate_script_day";

  constructor(code: StudioConflictError["code"], message: string) {
    super(message);
    this.name = "StudioConflictError";
    this.code = code;
  }
}

import * as jsonStorage from "./studio-storage/json";
import * as pgStorage from "./studio-storage/postgres";

// ─────────────────────────────────────────────────────────────────────────────
// Adapter Selection
// ─────────────────────────────────────────────────────────────────────────────

function isPostgres(): boolean {
  return process.env.STUDIO_STORAGE === "postgres";
}

// ─────────────────────────────────────────────────────────────────────────────
// Products
// ─────────────────────────────────────────────────────────────────────────────

export async function listProducts(userId: string): Promise<ProductProfile[]> {
  return isPostgres() ? pgStorage.listProducts(userId) : jsonStorage.listProducts(userId);
}

export async function getProduct(userId: string, id: string): Promise<ProductProfile | null> {
  return isPostgres() ? pgStorage.getProduct(userId, id) : jsonStorage.getProduct(userId, id);
}

export async function createProduct(
  userId: string,
  input: Omit<ProductProfile, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<ProductProfile> {
  return isPostgres() ? pgStorage.createProduct(userId, input) : jsonStorage.createProduct(userId, input);
}

export async function updateProduct(
  userId: string,
  id: string,
  input: Partial<Omit<ProductProfile, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<ProductProfile | null> {
  return isPostgres() ? pgStorage.updateProduct(userId, id, input) : jsonStorage.updateProduct(userId, id, input);
}

export async function deleteProduct(userId: string, id: string): Promise<boolean> {
  return isPostgres() ? pgStorage.deleteProduct(userId, id) : jsonStorage.deleteProduct(userId, id);
}

// ─────────────────────────────────────────────────────────────────────────────
// Scripts
// ─────────────────────────────────────────────────────────────────────────────

export async function listScripts(userId: string): Promise<Script[]> {
  return isPostgres() ? pgStorage.listScripts(userId) : jsonStorage.listScripts(userId);
}

export async function getScript(userId: string, id: string): Promise<Script | null> {
  return isPostgres() ? pgStorage.getScript(userId, id) : jsonStorage.getScript(userId, id);
}

export async function createScript(
  userId: string,
  input: Omit<Script, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<Script> {
  return isPostgres() ? pgStorage.createScript(userId, input) : jsonStorage.createScript(userId, input);
}

export async function updateScript(
  userId: string,
  id: string,
  input: Partial<Omit<Script, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<Script | null> {
  return isPostgres() ? pgStorage.updateScript(userId, id, input) : jsonStorage.updateScript(userId, id, input);
}

export async function deleteScript(userId: string, id: string): Promise<boolean> {
  return isPostgres() ? pgStorage.deleteScript(userId, id) : jsonStorage.deleteScript(userId, id);
}

// ─────────────────────────────────────────────────────────────────────────────
// Campaigns
// ─────────────────────────────────────────────────────────────────────────────

export async function listCampaigns(userId: string): Promise<Campaign[]> {
  return isPostgres() ? pgStorage.listCampaigns(userId) : jsonStorage.listCampaigns(userId);
}

export async function getCampaign(userId: string, id: string): Promise<Campaign | null> {
  return isPostgres() ? pgStorage.getCampaign(userId, id) : jsonStorage.getCampaign(userId, id);
}

export async function createCampaign(
  userId: string,
  input: Omit<Campaign, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<Campaign> {
  return isPostgres() ? pgStorage.createCampaign(userId, input) : jsonStorage.createCampaign(userId, input);
}

export async function updateCampaign(
  userId: string,
  id: string,
  input: Partial<Omit<Campaign, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<Campaign | null> {
  return isPostgres() ? pgStorage.updateCampaign(userId, id, input) : jsonStorage.updateCampaign(userId, id, input);
}

export async function updateCampaignDay(
  userId: string,
  campaignId: string,
  day: number,
  patch: CampaignDayPatch
): Promise<Campaign> {
  return isPostgres()
    ? pgStorage.updateCampaignDay(userId, campaignId, day, patch)
    : jsonStorage.updateCampaignDay(userId, campaignId, day, patch);
}

export async function deleteCampaign(userId: string, id: string): Promise<boolean> {
  return isPostgres() ? pgStorage.deleteCampaign(userId, id) : jsonStorage.deleteCampaign(userId, id);
}

// ─────────────────────────────────────────────────────────────────────────────
// Brand Profile
// ─────────────────────────────────────────────────────────────────────────────

export async function getBrandProfile(userId: string): Promise<BrandProfile | null> {
  return isPostgres() ? pgStorage.getBrandProfile(userId) : jsonStorage.getBrandProfile(userId);
}

export async function upsertBrandProfile(
  userId: string,
  input: Omit<BrandProfile, "userId" | "updatedAt">
): Promise<BrandProfile> {
  return isPostgres() ? pgStorage.upsertBrandProfile(userId, input) : jsonStorage.upsertBrandProfile(userId, input);
}

// ─────────────────────────────────────────────────────────────────────────────
// Performance Metrics
// ─────────────────────────────────────────────────────────────────────────────

export async function listPerformanceMetrics(
  userId: string,
  filters?: { scriptId?: string; campaignId?: string }
): Promise<PerformanceMetric[]> {
  return isPostgres()
    ? pgStorage.listPerformanceMetrics(userId, filters)
    : jsonStorage.listPerformanceMetrics(userId, filters);
}

export async function createPerformanceMetric(
  userId: string,
  input: Omit<PerformanceMetric, "id" | "userId">
): Promise<PerformanceMetric> {
  return isPostgres()
    ? pgStorage.createPerformanceMetric(userId, input)
    : jsonStorage.createPerformanceMetric(userId, input);
}
