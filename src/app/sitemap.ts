import type { MetadataRoute } from "next";
import { products } from "@/lib/store";
import { HTML_APPS } from "@/lib/apps-data";
import { readCms, isPublic } from "@/lib/cms";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://heyaimo.com";
  const staticRoutes = [
    "",
    "/products",
    "/courses",
    "/tools",
    "/apps",
    "/promptkichban",
    "/games",
    "/games/schulte",
    "/affiliate",
    "/bundles",
    "/free-resources",
    "/guides",
    "/about",
    "/help",
    "/affiliate-disclosure",
    "/privacy",
    "/terms",
    "/lien-he",
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
    priority: url === "" ? 1 : 0.8,
  }));

  const appEntries = HTML_APPS.map((app) => ({
    url: `${base}/apps/${app.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: app.isFeatured ? 0.9 : 0.75,
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
    priority: 0.75,
  }));

  const articleEntries = articles.map((a) => ({
    url: `${base}/guides/${a.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticEntries, ...appEntries, ...productEntries, ...articleEntries];
}
