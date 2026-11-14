import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { unstable_noStore as noStore } from "next/cache";
import { z } from "zod";

import { migrateLegacyCms } from "@/lib/cms-seed";
import { parseYouTubeId } from "@/lib/youtube";
export { parseYouTubeId } from "@/lib/youtube";

export const statusSchema = z.enum(["draft", "published", "archived"]);
export const productKindSchema = z.enum(["course", "desktop", "webapp", "affiliate", "bundle", "resource"]);
export const entityTypeSchema = z.enum(["products", "courses", "paths", "tools", "affiliates", "bundles", "resources", "articles"]);
const requiredText = z.string().trim().min(1).max(5_000);
const longText = z.string().trim().min(1).max(500_000);
const shortText = requiredText.max(180);
const slugSchema = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang").max(100);
const urlSchema = z.string().trim().url().max(500);
const stringList = z.array(z.string().trim().min(1).max(500)).max(100).default([]);
const seoSchema = z.object({ title: z.string().trim().max(300).default(""), description: z.string().trim().max(1000).default("") }).default({ title: "", description: "" });

const commonSchema = z.object({
  id: z.string().trim().min(1).max(100), slug: slugSchema, title: shortText,
  description: requiredText.max(1_200), status: statusSchema.default("draft"), featured: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(100_000).default(0), image: z.string().trim().max(500).default(""),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#ff6547"), seo: seoSchema,
});
const commerceSchema = z.object({
  price: z.number().int().min(0).max(1_000_000_000).default(0), compareAt: z.number().int().min(0).max(1_000_000_000).optional(),
  pricingModel: shortText.default("Thanh toán một lần"), category: shortText.default("Sản phẩm"), creator: shortText.default("AI MỞ Studio"),
  badge: z.string().trim().max(100).default(""), rating: z.number().min(0).max(5).default(5), reviews: z.number().int().min(0).default(0),
  formats: stringList, features: stringList, updated: z.string().trim().max(40).default(""),
});

export const lessonSchema = z.object({
  id: z.string().trim().min(1).max(100), slug: slugSchema, title: shortText, duration: z.string().regex(/^\d{1,3}:\d{2}$/, "Thời lượng phải có dạng 08:12"),
  youtube: z.string().trim().max(500).default("").refine((value) => !value || Boolean(parseYouTubeId(value)), "YouTube URL hoặc ID không hợp lệ"),
  summary: z.string().trim().max(1_200).default(""), exercise: z.string().trim().max(5_000).default(""), resources: stringList,
  preview: z.boolean().default(false), sortOrder: z.number().int().min(0).default(0), status: statusSchema.default("published"),
});
export const moduleSchema = z.object({ id: z.string().trim().min(1).max(100), title: shortText, description: z.string().trim().max(1_200).default(""), sortOrder: z.number().int().min(0).default(0), lessons: z.array(lessonSchema).max(200).default([]) });

const productBase = commonSchema.merge(commerceSchema).extend({ summary: requiredText.max(500), longDescription: z.string().trim().min(1).max(50_000), ownership: z.enum(["owned", "affiliate"]).default("owned") });
const courseSchema = productBase.extend({ kind: z.literal("course"), ownership: z.literal("owned").default("owned"), level: shortText, duration: shortText, outcomes: stringList, modules: z.array(moduleSchema).max(50).default([]) });
const desktopSchema = productBase.extend({ kind: z.literal("desktop"), ownership: z.literal("owned").default("owned"), platform: stringList, requirements: stringList, changelog: stringList });
const webappSchema = productBase.extend({ kind: z.literal("webapp"), ownership: z.literal("owned").default("owned"), platform: stringList, requirements: stringList, changelog: stringList, usage: stringList, privacy: z.string().trim().max(2_000).default("") });
const affiliateSchema = productBase.extend({ kind: z.literal("affiliate"), ownership: z.literal("affiliate").default("affiliate"), vendor: shortText, affiliateUrl: urlSchema, disclosure: requiredText.max(1_000), pros: stringList, cons: stringList, bestFor: requiredText.max(1_000), clicks: z.number().int().min(0).default(0) });
const bundleSchema = productBase.extend({ kind: z.literal("bundle"), ownership: z.literal("owned").default("owned"), productIds: stringList, bundleContents: stringList });
const resourceSchema = productBase.extend({ kind: z.literal("resource"), ownership: z.literal("owned").default("owned"), downloadUrl: z.string().trim().max(500).default(""), fileType: z.string().trim().max(80).default("PDF") });
export const productSchema = z.discriminatedUnion("kind", [courseSchema, desktopSchema, webappSchema, affiliateSchema, bundleSchema, resourceSchema]);

export const pathSchema = commonSchema.extend({ excerpt: requiredText.max(500), audience: shortText, duration: shortText, steps: z.array(z.object({ id: z.string().min(1), title: shortText, description: z.string().trim().max(1_000).default(""), productId: z.string().trim().max(100).default(""), sortOrder: z.number().int().min(0).default(0) })).max(100).default([]) });
export const articleSchema = commonSchema.extend({ excerpt: requiredText.max(500), content: longText, category: shortText, readTime: z.number().int().min(1).max(999), author: shortText.default("AI MỞ Studio") });

export const cmsSchema = z.object({
  version: z.literal(2).default(2), updatedAt: z.string().datetime().default(() => new Date().toISOString()),
  homepage: z.object({ eyebrow: shortText, title: shortText, description: requiredText.max(500), primaryLabel: shortText, primaryHref: z.string().regex(/^\/[a-z0-9/_-]*$/), stats: z.array(z.object({ value: shortText.max(30), label: shortText.max(80) })).min(1).max(6) }),
  products: z.array(productSchema).max(1_000).default([]), paths: z.array(pathSchema).max(200).default([]), articles: z.array(articleSchema).max(1_000).default([]),
}).superRefine((cms, ctx) => {
  const ids = new Map<string, string>(); const slugs = new Map<string, string>();
  const check = (items: { id: string; slug: string }[], key: "products" | "paths" | "articles") => {
    items.forEach((item, index) => {
      const idOwner = ids.get(item.id); const slugOwner = slugs.get(item.slug);
      if (idOwner) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key, index, "id"], message: `ID đã được dùng trong ${idOwner}` });
      if (slugOwner) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key, index, "slug"], message: `Slug đã được dùng trong ${slugOwner}` });
      ids.set(item.id, key); slugs.set(item.slug, key);
    });
  };
  check(cms.products, "products"); check(cms.paths, "paths"); check(cms.articles, "articles");
  cms.products.filter((p) => p.kind === "course").forEach((course, productIndex) => { const lessonSlugs = new Set<string>(); course.modules.flatMap((module) => module.lessons).forEach((lesson) => { if (lessonSlugs.has(lesson.slug)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["products", productIndex, "modules"], message: "Slug bài học bị trùng trong khóa học" }); lessonSlugs.add(lesson.slug); }); });
  const productIds = new Set(cms.products.map((p) => p.id));
  cms.paths.forEach((pathItem, pathIndex) => pathItem.steps.forEach((step, stepIndex) => { if (step.productId && !productIds.has(step.productId)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["paths", pathIndex, "steps", stepIndex, "productId"], message: "Sản phẩm liên kết không tồn tại" }); }));
});

export type CmsContent = z.infer<typeof cmsSchema>;
export type CmsProduct = z.infer<typeof productSchema>;
export type CmsCourse = z.infer<typeof courseSchema>;
export type CmsPath = z.infer<typeof pathSchema>;
export type CmsArticle = z.infer<typeof articleSchema>;
export type CmsEntityType = z.infer<typeof entityTypeSchema>;
const cmsPath = path.join(process.cwd(), "data", "cms.json");
const tmpCmsPath = path.join("/tmp", "cms.json");
let inMemoryCms: CmsContent | null = null;
let writeQueue: Promise<unknown> = Promise.resolve();

async function loadCms(): Promise<CmsContent> {
  if (inMemoryCms) return inMemoryCms;
  try {
    const raw = JSON.parse(await readFile(tmpCmsPath, "utf8"));
    inMemoryCms = cmsSchema.parse(migrateLegacyCms(raw));
    return inMemoryCms;
  } catch {
    // fallback to repo file
  }
  const raw = JSON.parse(await readFile(cmsPath, "utf8"));
  const migrated = cmsSchema.parse(migrateLegacyCms(raw));
  inMemoryCms = migrated;
  return migrated;
}

async function persistCms(input: unknown): Promise<CmsContent> {
  const value = cmsSchema.parse({ ...(input as object), version: 2, updatedAt: new Date().toISOString() });
  inMemoryCms = value;
  try {
    await mkdir(path.dirname(cmsPath), { recursive: true });
    const temp = `${cmsPath}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    await rename(temp, cmsPath);
  } catch {
    // Fallback on read-only environments (e.g. Vercel Serverless)
    try {
      await writeFile(tmpCmsPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    } catch {
      // inMemoryCms is already stored
    }
  }
  return value;
}
function enqueue<T>(task: () => Promise<T>): Promise<T> { const operation = writeQueue.then(task, task); writeQueue = operation.catch(() => undefined); return operation; }
export async function readCms(): Promise<CmsContent> { noStore(); await writeQueue; return loadCms(); }
export async function writeCms(input: unknown): Promise<CmsContent> { return enqueue(() => persistCms(input)); }
export const isPublic = (item: { status: z.infer<typeof statusSchema> }) => item.status === "published";
export async function getPublicProducts(): Promise<CmsProduct[]>;
export async function getPublicProducts<K extends CmsProduct["kind"]>(kind: K): Promise<Extract<CmsProduct, { kind: K }>[]>;
export async function getPublicProducts(kind?: CmsProduct["kind"]) { return (await readCms()).products.filter((item) => isPublic(item) && (!kind || item.kind === kind)).sort((a, b) => a.sortOrder - b.sortOrder); }
export function toStoreProduct(item: CmsProduct) { return { id: item.id, slug: item.slug, name: item.title, kind: item.kind, ownership: item.ownership, category: item.category, categorySlug: item.kind === "course" ? "courses" : item.kind === "affiliate" ? "affiliate" : item.kind === "bundle" ? "bundles" : item.kind === "resource" ? "free-resources" : "tools", price: item.price, compareAt: item.compareAt, pricingModel: item.pricingModel, rating: item.rating, reviews: item.reviews, badge: item.badge || undefined, color: item.accent, description: item.summary, longDescription: item.longDescription, formats: item.formats, features: item.features, creator: item.creator, updated: item.updated, imageLabel: item.title.toUpperCase(), ...(item.kind === "course" ? { outcomes: item.outcomes, duration: item.duration, level: item.level, curriculum: item.modules.map((m) => ({ title: m.title, lessons: m.lessons.map((l) => ({ slug: l.slug, title: l.title, duration: l.duration, preview: l.preview })) })) } : {}), ...(item.kind === "desktop" ? { compatibility: item.platform, requirements: item.requirements, changelog: item.changelog } : {}), ...(item.kind === "webapp" ? { compatibility: item.platform, requirements: item.requirements, changelog: item.changelog, usage: item.usage, privacy: item.privacy } : {}), ...(item.kind === "affiliate" ? { vendor: item.vendor, affiliateUrl: item.affiliateUrl, disclosure: item.disclosure, pros: item.pros, cons: item.cons, bestFor: item.bestFor } : {}), ...(item.kind === "bundle" ? { bundleContents: item.bundleContents } : {}) }; }
export async function getStoreProducts() { return (await getPublicProducts()).map(toStoreProduct); }
export async function findCmsProduct(slugValue: string, includeUnpublished = false) { return (await readCms()).products.find((item) => item.slug === slugValue && (includeUnpublished || isPublic(item))); }
export async function findCmsCourse(slugValue: string, includeUnpublished = false) { const item = await findCmsProduct(slugValue, includeUnpublished); return item?.kind === "course" ? item : undefined; }
export async function findCmsArticle(slugValue: string, includeUnpublished = false) { return (await readCms()).articles.find((item) => item.slug === slugValue && (includeUnpublished || isPublic(item))); }
export async function mutateCms(mutator: (cms: CmsContent) => CmsContent | Promise<CmsContent>) { return enqueue(async () => persistCms(await mutator(await loadCms()))); }
export function collectionFor(type: CmsEntityType, cms: CmsContent) { if (type === "paths") return cms.paths; if (type === "articles") return cms.articles; const kinds: Record<Exclude<CmsEntityType, "products" | "paths" | "articles">, CmsProduct["kind"]> = { courses: "course", tools: "desktop", affiliates: "affiliate", bundles: "bundle", resources: "resource" }; if (type === "products") return cms.products; if (type === "tools") return cms.products.filter((p) => p.kind === "desktop" || p.kind === "webapp"); return cms.products.filter((p) => p.kind === kinds[type]); }
export function schemaFor(type: CmsEntityType) { if (type === "paths") return pathSchema; if (type === "articles") return articleSchema; return productSchema; }
function matchesType(type: CmsEntityType, item: CmsProduct) { return type === "products" || (type === "courses" && item.kind === "course") || (type === "tools" && (item.kind === "desktop" || item.kind === "webapp")) || (type === "affiliates" && item.kind === "affiliate") || (type === "bundles" && item.kind === "bundle") || (type === "resources" && item.kind === "resource"); }
export async function createEntity(type: CmsEntityType, input: unknown) { const entity = schemaFor(type).parse(input) as CmsProduct | CmsPath | CmsArticle; await mutateCms((cms) => { if (type === "paths") cms.paths.push(entity as CmsPath); else if (type === "articles") cms.articles.push(entity as CmsArticle); else { if (!matchesType(type, entity as CmsProduct)) throw new z.ZodError([{ code: "custom", path: ["kind"], message: "Loại sản phẩm không khớp chuyên mục" }]); cms.products.push(entity as CmsProduct); } return cms; }); return entity; }
export async function updateEntity(type: CmsEntityType, id: string, input: unknown) { const entity = schemaFor(type).parse(input) as CmsProduct | CmsPath | CmsArticle; if (entity.id !== id) throw new z.ZodError([{ code: "custom", path: ["id"], message: "Không được thay đổi ID" }]); let found = false; await mutateCms((cms) => { if (type === "paths") cms.paths = cms.paths.map((item) => item.id === id ? (found = true, entity as CmsPath) : item); else if (type === "articles") cms.articles = cms.articles.map((item) => item.id === id ? (found = true, entity as CmsArticle) : item); else { if (!matchesType(type, entity as CmsProduct)) throw new z.ZodError([{ code: "custom", path: ["kind"], message: "Loại sản phẩm không khớp chuyên mục" }]); cms.products = cms.products.map((item) => item.id === id && matchesType(type, item) ? (found = true, entity as CmsProduct) : item); } if (!found) throw new CmsNotFoundError(); return cms; }); return entity; }
export async function deleteEntity(type: CmsEntityType, id: string) { let found = false; await mutateCms((cms) => { if (type === "paths") cms.paths = cms.paths.filter((x) => (x.id === id ? !(found = true) : true)); else if (type === "articles") cms.articles = cms.articles.filter((x) => (x.id === id ? !(found = true) : true)); else cms.products = cms.products.filter((x) => (x.id === id && matchesType(type, x) ? !(found = true) : true)); if (!found) throw new CmsNotFoundError(); return cms; }); }
export class CmsNotFoundError extends Error {}
