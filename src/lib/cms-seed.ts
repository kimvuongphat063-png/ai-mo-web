import { products, type Product } from "@/lib/store";

export type SerializableRecord = Record<string, unknown>;

function courseModules(product: Product) {
  return (product.curriculum ?? []).map((module, moduleIndex) => ({
    id: `module-${product.id}-${moduleIndex + 1}`,
    title: module.title,
    description: "",
    sortOrder: moduleIndex,
    lessons: module.lessons.map((lesson, lessonIndex) => ({
      id: `lesson-${product.id}-${moduleIndex + 1}-${lessonIndex + 1}`,
      ...lesson,
      youtube: "",
      summary: "",
      exercise: "",
      resources: [],
      preview: lesson.preview ?? false,
      sortOrder: lessonIndex,
      status: "published",
    })),
  }));
}

function productSeed(product: Product, index: number): SerializableRecord {
  const base = {
    id: product.id,
    slug: product.slug,
    title: product.name,
    summary: product.description,
    description: product.description,
    longDescription: product.longDescription,
    kind: product.kind,
    ownership: product.ownership,
    category: product.category,
    price: product.price,
    compareAt: product.compareAt,
    pricingModel: product.pricingModel,
    rating: product.rating,
    reviews: product.reviews,
    badge: product.badge ?? "",
    accent: product.color,
    formats: product.formats,
    features: product.features,
    creator: product.creator,
    updated: product.updated,
    status: "published",
    featured: index < 4,
    sortOrder: index,
    image: "",
    seo: { title: "", description: "" },
  };

  switch (product.kind) {
    case "course":
      return { ...base, level: product.level ?? "Cơ bản", duration: product.duration ?? "", outcomes: product.outcomes ?? [], modules: courseModules(product) };
    case "desktop":
      return { ...base, platform: product.compatibility ?? [], requirements: product.requirements ?? [], changelog: product.changelog ?? [] };
    case "webapp":
      return { ...base, platform: product.compatibility ?? product.formats, requirements: product.requirements ?? [], changelog: product.changelog ?? [], usage: product.usage ?? [], privacy: product.privacy ?? "" };
    case "affiliate":
      return { ...base, vendor: product.vendor ?? product.creator, affiliateUrl: product.affiliateUrl ?? "", disclosure: product.disclosure ?? "", pros: product.pros ?? [], cons: product.cons ?? [], bestFor: product.bestFor ?? "", clicks: 0 };
    case "bundle":
      return { ...base, productIds: [], bundleContents: product.bundleContents ?? [] };
    case "resource":
      return { ...base, downloadUrl: "", fileType: product.formats[0] ?? "PDF" };
  }
}

/** Client-safe, serializable CMS seeds derived from the canonical static catalog. */
export const cmsProductSeeds: SerializableRecord[] = products.map(productSeed);

function legacyCourse(course: SerializableRecord, index: number): SerializableRecord {
  const modules = Array.isArray(course.modules) ? course.modules as SerializableRecord[] : [];
  return {
    id: `course-${index + 1}`,
    kind: "course",
    slug: course.slug,
    title: course.title,
    summary: course.summary,
    description: course.description,
    longDescription: course.description,
    price: course.price,
    level: course.level,
    duration: course.duration,
    accent: course.accent,
    status: "published",
    featured: index === 0,
    sortOrder: index,
    category: "Khóa học",
    pricingModel: "Thanh toán một lần",
    outcomes: [],
    modules: modules.map((module, moduleIndex) => ({
      id: `module-${index + 1}-${moduleIndex + 1}`,
      title: module.title,
      description: module.description ?? "",
      sortOrder: moduleIndex,
      lessons: (Array.isArray(module.lessons) ? module.lessons as SerializableRecord[] : []).map((lesson, lessonIndex) => ({
        id: `lesson-${index + 1}-${moduleIndex + 1}-${lessonIndex + 1}`,
        ...lesson,
        sortOrder: lessonIndex,
        status: "published",
      })),
    })),
  };
}

/** Upgrade v1 CMS data by overlaying matching legacy courses onto all catalog seeds. */
export function migrateLegacyCms(input: unknown): unknown {
  if (!input || typeof input !== "object") return input;
  const raw = input as SerializableRecord;
  if (raw.version === 2) return raw;

  const legacyCourses = Array.isArray(raw.courses)
    ? raw.courses.map((course, index) => legacyCourse(course as SerializableRecord, index))
    : [];
  const coursesBySlug = new Map(legacyCourses.map((course) => [course.slug, course]));
  const seededProducts = cmsProductSeeds.map((seed) => {
    const legacy = coursesBySlug.get(seed.slug);
    return legacy ? { ...seed, ...legacy, id: seed.id, kind: seed.kind, ownership: seed.ownership, sortOrder: seed.sortOrder } : { ...seed };
  });

  return {
    version: 2,
    updatedAt: new Date().toISOString(),
    homepage: raw.homepage,
    products: seededProducts,
    paths: [],
    articles: [],
  };
}
