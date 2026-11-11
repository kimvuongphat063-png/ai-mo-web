import fs from "node:fs";
import path from "node:path";
import { HTML_APPS, type HtmlAppItem } from "@/lib/apps-data";

export interface HtmlAppWithManifest extends HtmlAppItem {
  fileSizeBytes: number;
  fileSizeFormatted: string;
  isOfflineReady: boolean;
  zeroTelemetry: boolean;
  standaloneSingleFile: boolean;
}

export function getAppManifest(app: HtmlAppItem): HtmlAppWithManifest {
  const filePath = path.join(process.cwd(), "public", "html-apps", app.fileName);
  let fileSizeBytes = 0;

  try {
    const stat = fs.statSync(filePath);
    fileSizeBytes = stat.size;
  } catch {
    fileSizeBytes = 0;
  }

  const fileSizeKb = Math.round(fileSizeBytes / 1024);
  const fileSizeFormatted = `${fileSizeKb} KB`;

  return {
    ...app,
    fileSizeBytes,
    fileSizeFormatted,
    isOfflineReady: true,
    zeroTelemetry: true,
    standaloneSingleFile: true,
  };
}

export function getAllAppsWithManifest(): HtmlAppWithManifest[] {
  return HTML_APPS.map(getAppManifest);
}

export function getFeaturedAppsWithManifest(): HtmlAppWithManifest[] {
  return getAllAppsWithManifest()
    .filter((a) => a.isFeatured)
    .sort((a, b) => (a.featuredRank ?? 99) - (b.featuredRank ?? 99));
}
