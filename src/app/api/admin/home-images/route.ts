import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile } from "fs/promises";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "src", "data", "home-images.json");
const CONTENT_FILE = path.join(process.cwd(), "src", "data", "home-content.json");
const UPLOAD_DIR = path.join(process.cwd(), "public", "images", "home", "uploads");

const TMP_IMAGES_FILE = path.join("/tmp", "home-images.json");
const TMP_CONTENT_FILE = path.join("/tmp", "home-content.json");

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

export interface HomeContent {
  heroBadge: string;
  heroTitle: string;
  heroDesc: string;
  quickActionsTitle: string;
  quickActionsDesc: string;
  toolsTitle: string;
  toolsDesc: string;
  pathTitle: string;
  pathDesc: string;
  articlesTitle: string;
  articlesDesc: string;
  exploreTitle: string;
  exploreDesc: string;
}

export const DEFAULT_HOME_CONTENT: HomeContent = {
  heroBadge: "AI Studio của AI Mở",
  heroTitle: "Học AI bằng cách tạo ra thứ dùng được.",
  heroDesc: "Bộ công cụ AI thực tế, ứng dụng miễn phí và lộ trình thực hành dành cho người làm việc thật. Không lý thuyết suông.",
  quickActionsTitle: "Bắt đầu nhanh với 3 việc phổ biến nhất",
  quickActionsDesc: "Không cần đọc tài liệu dài dòng. Chọn một bài toán và thử ngay trên trình duyệt.",
  toolsTitle: "Bộ công cụ AI giải quyết bài toán thật",
  toolsDesc: "Mỗi công cụ xử lý một việc cụ thể, có thể dùng ngay mà không cần kết nối API phức tạp.",
  pathTitle: "Lộ trình học AI thực chiến",
  pathDesc: "Học theo sản phẩm đầu ra, không học theo tính năng trừu tượng.",
  articlesTitle: "Kiến thức & Hướng dẫn thực hành",
  articlesDesc: "Những bài viết thực chiến, chia sẻ kinh nghiệm dùng AI vào công việc hàng ngày.",
  exploreTitle: "Khám phá thêm trên AI Mở",
  exploreDesc: "Bốn lối đi rõ ràng: mỗi ô là một điểm đến cụ thể.",
};

// Global in-memory cache to survive lambda invocations
let memoryImages: Record<string, string> = { ...DEFAULT_IMAGES };
let memoryContent: HomeContent = { ...DEFAULT_HOME_CONTENT };
let initialized = false;

async function getImages(): Promise<Record<string, string>> {
  if (initialized) return memoryImages;
  try {
    const raw = await readFile(TMP_IMAGES_FILE, "utf-8");
    memoryImages = { ...DEFAULT_IMAGES, ...JSON.parse(raw) };
    return memoryImages;
  } catch {
    // fallback to repo file
  }
  try {
    const raw = await readFile(DATA_FILE, "utf-8");
    memoryImages = { ...DEFAULT_IMAGES, ...JSON.parse(raw) };
    return memoryImages;
  } catch {
    return memoryImages;
  }
}

async function saveImages(data: Record<string, string>) {
  memoryImages = { ...data };
  initialized = true;
  try {
    await writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    try {
      await writeFile(TMP_IMAGES_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch {
      // In-memory already saved
    }
  }
}

async function getContent(): Promise<HomeContent> {
  if (initialized) return memoryContent;
  try {
    const raw = await readFile(TMP_CONTENT_FILE, "utf-8");
    memoryContent = { ...DEFAULT_HOME_CONTENT, ...JSON.parse(raw) };
    return memoryContent;
  } catch {
    // fallback to repo file
  }
  try {
    const raw = await readFile(CONTENT_FILE, "utf-8");
    memoryContent = { ...DEFAULT_HOME_CONTENT, ...JSON.parse(raw) };
    return memoryContent;
  } catch {
    return memoryContent;
  }
}

async function saveContent(data: HomeContent) {
  memoryContent = { ...data };
  initialized = true;
  try {
    await writeFile(CONTENT_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    try {
      await writeFile(TMP_CONTENT_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch {
      // In-memory already saved
    }
  }
}

export async function GET() {
  const images = await getImages();
  const content = await getContent();
  return NextResponse.json({ ok: true, images, content });
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

      // Extract extension and mime
      const origName = file.name || "image.jpg";
      const extMatch = origName.match(/\.([a-zA-Z0-9]+)$/);
      const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
      const mime = file.type || (ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg");

      // Attempt to save to disk if possible
      let publicUrl = "";
      try {
        const filename = `${cardId}-${Date.now()}.${ext}`;
        const filePath = path.join(UPLOAD_DIR, filename);
        await writeFile(filePath, buffer);
        publicUrl = `/images/home/uploads/${filename}`;
      } catch {
        // Fallback to Base64 data URL on read-only environments (e.g. Vercel)
        publicUrl = `data:${mime};base64,${buffer.toString("base64")}`;
      }

      const current = await getImages();
      current[cardId] = publicUrl;
      await saveImages(current);

      return NextResponse.json({ ok: true, url: publicUrl, images: current });
    } catch (err: unknown) {
      console.error("[POST /api/admin/home-images upload]", err);
      return NextResponse.json({ error: "Lỗi tải ảnh lên server." }, { status: 500 });
    }
  }

  // 2. JSON Payload (Update URL, Content or Reset)
  try {
    const body = await req.json();

    // Reset images
    if (body.action === "reset") {
      await saveImages(DEFAULT_IMAGES);
      return NextResponse.json({ ok: true, images: DEFAULT_IMAGES });
    }

    // Reset content
    if (body.action === "reset_content") {
      await saveContent(DEFAULT_HOME_CONTENT);
      return NextResponse.json({ ok: true, content: DEFAULT_HOME_CONTENT });
    }

    // Update text content
    if (body.action === "update_content" && body.content) {
      const current = await getContent();
      const nextContent = { ...current, ...body.content };
      await saveContent(nextContent);
      return NextResponse.json({ ok: true, content: nextContent });
    }

    // Update image URL
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
