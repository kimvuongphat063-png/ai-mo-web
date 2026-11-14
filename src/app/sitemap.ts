import type { MetadataRoute } from "next";
import { products } from "@/lib/store";
import { readCms, isPublic } from "@/lib/cms";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.heyaimo.com";
  const staticRoutes = [
    "",
    "/courses",
    "/tools",
    "/apps",
    "/affiliate",
    "/bundles",
    "/free-resources",
    "/guides",
    "/about",
    "/help",
    "/affiliate-disclosure",
    "/privacy",
    "/terms",
  ];

  let articles: { slug: string }[] = [];
  try {
    const cms = await readCms();
    articles = cms.articles.filter(isPublic);
  } catch {
    // fallback if CMS read fails
  }

  const staticEntries = staticRoutes.map((url) => ({
    url: base + url,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: url === "" ? 1 : 0.7,
  }));

  const productEntries = products.map((p) => ({
    url: `${base}/${
      p.ownership === "affiliate"
        ? "affiliate"
        : p.kind === "course"
        ? "courses"
        : p.kind === "bundle"
        ? "bundles"
        : p.kind === "resource"
        ? "free-resources"
        : "tools"
    }/${p.slug}`,
    lastModified: new Date(p.updated.split("/").reverse().join("-")),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const articleEntries = articles.map((a) => ({
    url: `${base}/guides/${a.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticEntries, ...productEntries, ...articleEntries];
}
