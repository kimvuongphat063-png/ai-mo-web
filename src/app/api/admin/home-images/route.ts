import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile } from "fs/promises";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "src", "data", "home-images.json");
const UPLOAD_DIR = path.join(process.cwd(), "public", "images", "home", "uploads");

const DEFAULT_IMAGES: Record<string, string> = {
  "hero-preview": "/images/home/hero-creator-preview.jpg",
  "scene-1": "/images/home/scene-1-serum-pastel.jpg",
  "scene-2": "/images/home/scene-2-serum-droplet.jpg",
  "scene-3": "/images/home/scene-3-serum-flatlay.jpg",
  "action-1": "/images/home/action-prompt-kich-ban.jpg",
  "action-2": "/images/home/action-apps-free.jpg",
  "action-3": "/images/home/action-learning-path.jpg",
  "bento-prompt": "/images/home/bento-prompt-studio.jpg",
  "bento-profit": "/images/home/bento-profit-calc.jpg",
  "bento-pricing": "/images/home/bento-pricing-tool.jpg",
  "bento-apps": "/images/home/bento-apps-hub.jpg",
  "path-main": "/images/home/path-step-1.jpg",
  "article-1": "/images/home/path-step-2.jpg",
  "article-2": "/images/home/path-step-3.jpg",
  "article-3": "/images/home/article-ai-chatbot.jpg",
  "explore-1": "/images/home/article-serum-case-study.jpg",
  "explore-2": "/images/home/article-apps-offline.jpg",
  "explore-3": "/images/home/explore-courses.jpg",
  "explore-4": "/images/home/explore-games.jpg",
};

async function getImages(): Promise<Record<string, string>> {
  try {
    const raw = await readFile(DATA_FILE, "utf-8");
    return { ...DEFAULT_IMAGES, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_IMAGES };
  }
}

async function saveImages(data: Record<string, string>) {
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET() {
  const images = await getImages();
  return NextResponse.json({ ok: true, images });
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";

  // 1. Multipart Form Data (File Upload)
  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const cardId = formData.get("cardId") as string | null;

      if (!file || !cardId) {
        return NextResponse.json({ error: "Thiếu tệp hoặc ID card." }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Extract extension
      const origName = file.name || "image.jpg";
      const extMatch = origName.match(/\.([a-zA-Z0-9]+)$/);
      const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";

      // File name format
      const filename = `${cardId}-${Date.now()}.${ext}`;
      const filePath = path.join(UPLOAD_DIR, filename);

      await writeFile(filePath, buffer);

      const publicUrl = `/images/home/uploads/${filename}`;
      const current = await getImages();
      current[cardId] = publicUrl;
      await saveImages(current);

      return NextResponse.json({ ok: true, url: publicUrl, images: current });
    } catch (err: unknown) {
      console.error("[POST /api/admin/home-images upload]", err);
      return NextResponse.json({ error: "Lỗi tải ảnh lên server." }, { status: 500 });
    }
  }

  // 2. JSON Payload (Update URL or Reset)
  try {
    const body = await req.json();

    if (body.action === "reset") {
      await saveImages(DEFAULT_IMAGES);
      return NextResponse.json({ ok: true, images: DEFAULT_IMAGES });
    }

    if (body.cardId && body.url) {
      const current = await getImages();
      current[body.cardId] = body.url;
      await saveImages(current);
      return NextResponse.json({ ok: true, images: current });
    }

    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 400 });
  } catch (err: unknown) {
    console.error("[POST /api/admin/home-images json]", err);
    return NextResponse.json({ error: "Lỗi xử lý yêu cầu." }, { status: 500 });
  }
}
