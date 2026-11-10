#!/usr/bin/env tsx
/**
 * Seed studio.json with representative UAT data for both demo users.
 * Does NOT touch the database — only writes JSON files.
 *
 * Usage:  npx tsx scripts/seed-studio-data.ts
 */
import { writeFile, copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const NOW = "2026-08-26T10:00:00.000Z";
const ts = (d: Date) => d.toISOString();

// ── IDs ──────────────────────────────────────────────────────────────────────
const admin = "admin-demo";
const learner = "learner-demo";

// ── Brand Profiles ───────────────────────────────────────────────────────────
const brandProfiles = [
  {
    userId: admin,
    companyName: "AI MỞ Studio",
    brandVoice: "Chuyên nghiệp, gần gũi, truyền cảm hứng cho người mới bắt đầu",
    prohibitedClaims: "Không cam kết doanh thu, không保证效果",
    requiredDisclosures: "Kết quả có thể khác nhau tùy từng người dùng",
    preferredFormats: ["ugc", "talking-head", "slides"],
    targetAudience: "Người mới bắt đầu với AI, content creator Việt Nam",
    competitorUrls: ["https://example-competitor.vn"],
    language: "vi" as const,
    updatedAt: NOW,
  },
  {
    userId: learner,
    companyName: "Học Viên Demo Store",
    brandVoice: "Thân thiện, đơn giản, dễ hiểu",
    prohibitedClaims: "Không hứa hẹn thu nhập passive income",
    requiredDisclosures: "Đây là sản phẩm demo",
    preferredFormats: ["ugc"],
    targetAudience: "Sinh viên, người đi làm muốn học AI",
    competitorUrls: [],
    language: "vi" as const,
    updatedAt: NOW,
  },
];

// ── Products ─────────────────────────────────────────────────────────────────
const productAdmin1 = {
  id: "prod-admin-001",
  userId: admin,
  name: "Khóa Học AI Cho Người Mới",
  url: "https://aimo.vn/khoa-hoc-ai",
  description: "Lộ trình 21 ngày học AI từ số 0, dành cho người mới bắt đầu.",
  priceOffer: "990.000đ (giảm từ 1.990.000đ)",
  featuresText: "21 bài học video, 5 dự án thực hành, group hỗ trợ, chứng nhận hoàn thành",
  targetCustomer: "Người mới bắt đầu với AI, không cần kỹ năng lập trình",
  problemSolved: "Không biết bắt đầu từ đâu khi học AI, quá nhiều thông tin loạn",
  allowedProof: "Hơn 2.400 học viên đã đăng ký, đánh giá 4.9/5",
  claimsToAvoid: "Không cam kết thu nhập, không đảm bảo việc làm",
  affiliateLink: "https://aimo.vn/aff/admin",
  brandVoice: "Chuyên nghiệp, gần gũi",
  analysisCache: {
    summary: "Khóa học AI 21 ngày dành cho người mới, giá cạnh tranh ở phân khúc middle-market.",
    sellingAngles: [
      { id: "angle-time", name: "Tiết kiệm thời gian", description: "Không mất hàng năm tự mò mẫm" },
      { id: "angle-results", name: "Kết quả thực tế", description: "5 dự án thực hành trong 21 ngày" },
      { id: "angle-community", name: "Cộng đồng hỗ trợ", description: "Không học một mình, có group riêng" },
    ],
    keyBenefits: ["Lộ trình rõ ràng", "Học theo dự án thực tế", "Hỗ trợ cộng đồng"],
    complianceFlags: [],
  },
  analysisFingerprint: "abc123hash",
  createdAt: ts(new Date("2026-08-01T08:00:00Z")),
  updatedAt: NOW,
};

const productAdmin2 = {
  id: "prod-admin-002",
  userId: admin,
  name: "AI Content Toolkit",
  url: "https://aimo.vn/toolkit",
  description: "Bộ công cụ AI giúp tạo nội dung nhanh 10x cho marketer.",
  priceOffer: "490.000đ",
  featuresText: "50+ prompt templates, 10 workflow tự động, cập nhật hàng tháng",
  targetCustomer: "Marketer, content creator bận rộn",
  problemSolved: "Mất 3-4 tiếng mỗi ngày để viết nội dung thủ công",
  allowedProof: "Đã giúp 500+ marketer tiết kiệm 20 tiếng/tuần",
  claimsToAvoid: "Không thay thế hoàn toàn con người",
  affiliateLink: "https://aimo.vn/aff/admin-toolkit",
  brandVoice: "Năng động, thực tế",
  createdAt: ts(new Date("2026-08-10T08:00:00Z")),
  updatedAt: NOW,
};

const productLearner1 = {
  id: "prod-learner-001",
  userId: learner,
  name: "Sách AI Cơ Bản",
  url: "https://example.com/sach-ai",
  description: "Cuốn sách hướng dẫn AI cho người mới, viết bằng tiếng Việt.",
  priceOffer: "199.000đ",
  featuresText: "300 trang, 10 chương, bài tập thực hành cuối mỗi chương",
  targetCustomer: "Sinh viên CNTT muốn hiểu AI",
  problemSolved: "Tài liệu AI đều bằng tiếng Anh, khó tiếp cận",
  allowedProof: "Đã bán 300 bản trong tháng đầu",
  claimsToAvoid: "Không phải sách giáo khoa đại học",
  affiliateLink: "https://example.com/aff/learner",
  brandVoice: "Đơn giản, dễ hiểu",
  createdAt: ts(new Date("2026-08-15T08:00:00Z")),
  updatedAt: NOW,
};

const allProducts = [productAdmin1, productAdmin2, productLearner1];

// ── Scripts (with embedded variants + shots) ─────────────────────────────────
const scriptAdmin1 = {
  id: "script-admin-001",
  userId: admin,
  productProfileId: "prod-admin-001",
  platform: "tiktok" as const,
  goal: "conversion" as const,
  durationSeconds: 30,
  selectedAngleId: "angle-time",
  scripts: [
    {
      title: "Kịch bản A — Tiết kiệm thời gian",
      angle: "Tiết kiệm thời gian",
      hook: "Bạn mất bao nhiêu giờ để tự mò AI?",
      durationSeconds: 30,
      shots: [
        {
          startSecond: 0,
          endSecond: 10,
          purpose: "Hook — thu hút sự chú ý",
          spokenText: "Bạn mất bao nhiêu giờ | để tự học AI?",
          visualDirection: "Close-up presenter, ánh sáng ấm",
          onScreenText: "Bao nhiêu giờ?",
          bRoll: "Màn hình hiển thị Google search 'how to learn AI'",
          cameraAction: "Dolly in chậm",
          ctaLine: undefined,
        },
        {
          startSecond: 10,
          endSecond: 20,
          purpose: "Problem — nêu pain point",
          spokenText: "Hàng trăm bài viết, hàng nghìn video. Nhưng chẳng ai dạy bạn từng bước một.",
          visualDirection: "Split screen:resenter vs overwhelming info",
          onScreenText: "Quá nhiều thông tin!",
          bRoll: "Scroll nhanh qua nhiều trang web",
          cameraAction: "Medium shot",
          ctaLine: undefined,
        },
        {
          startSecond: 20,
          endSecond: 30,
          purpose: "CTA — kêu gọi hành động",
          spokenText: "21 ngày. 5 dự án. Từ số 0 đến tạo được kịch bản video bằng AI. Link bên dưới.",
          visualDirection: "Product showcase + text overlay",
          onScreenText: "21 NGÀY → TẠO KỊCH BẢN AI",
          bRoll: "Hình ảnh học viên hoàn thành khóa học",
          cameraAction: "Close-up, mỉm cười",
          ctaLine: "Nhấn link bên dưới để đăng ký",
        },
      ],
      alternativeHooks: [
        "Tại sao 90% người học AI bỏ cuộc?",
        "AI không khó. Bạn chỉ cần lộ trình đúng.",
      ],
      audioSuggestion: "Nhạc nền piano nhẹ nhàng, tempo chậm → nhanh dần",
      cta: "Đăng ký khóa học 21 ngày — link bio",
      caption: "21 ngày từ số 0 đến tạo kịch bản video AI 🚀 #aimo #hocai #aitools",
      hashtags: ["aimo", "hocai", "aitools", "contentcreator", "21ngay"],
      disclosureNote: "Có liên kết affiliate — bạn không mất thêm phí",
      warnings: [],
    },
    {
      title: "Kịch bản B — Kết quả thực tế",
      angle: "Kết quả thực tế",
      hook: "21 ngày. 5 dự án. Đây là kết quả của học viên tôi.",
      durationSeconds: 30,
      shots: [
        {
          startSecond: 0,
          endSecond: 8,
          purpose: "Hook — proof-based",
          spokenText: "21 ngày. 5 dự án. Đây là kết quả.",
          visualDirection: "Screen recording kết quả học viên",
          onScreenText: "KẾT QUẢ THỰC TẾ",
          bRoll: undefined,
          cameraAction: "Over-the-shoulder",
          ctaLine: undefined,
        },
        {
          startSecond: 8,
          endSecond: 22,
          purpose: "Social proof — testimonial",
          spokenText: "Học viên Nguyễn An đã tạo được 10 kịch bản video trong tuần đầu tiên. Không cần biết lập trình.",
          visualDirection: "Testimonial card + screen recording",
          onScreenText: "Học viên: 10 kịch bản / tuần đầu",
          bRoll: "Demo kết quả",
          cameraAction: "Smooth pan",
          ctaLine: undefined,
        },
        {
          startSecond: 22,
          endSecond: 30,
          purpose: "CTA",
          spokenText: "Bạn muốn giống Nguyễn An? Bắt đầu ngay. Link trong bio.",
          visualDirection: "CTA overlay on dark background",
          onScreenText: "BẮT ĐẦU NGAY →",
          bRoll: undefined,
          cameraAction: "Close-up",
          ctaLine: "Link trong bio",
        },
      ],
      alternativeHooks: ["Học viên tôi tạo được 10 kịch bản trong 1 tuần"],
      audioSuggestion: "Upbeat, energetic",
      cta: "Bắt đầu ngay — link bio",
      caption: "Kết quả thật từ học viên thật 📊 #aimo #hocai",
      hashtags: ["aimo", "hocai", "ketqua", "testimonial"],
      disclosureNote: "Kết quả cá nhân, có thể khác nhau",
      warnings: ["[CẦN XÁC MINH] số liệu học viên"],
    },
  ],
  missingInformation: [],
  complianceNotes: ["Không cam kết thu nhập cụ thể", "Luôn hiển thị disclosure"],
  createdAt: ts(new Date("2026-08-20T14:00:00Z")),
  updatedAt: NOW,
};

const scriptAdmin2 = {
  id: "script-admin-002",
  userId: admin,
  productProfileId: "prod-admin-002",
  platform: "reels" as const,
  goal: "engagement" as const,
  durationSeconds: 15,
  selectedAngleId: "angle-toolkit",
  scripts: [
    {
      title: "Quick Tip — 1 prompt = 10 bài viết",
      angle: "Năng suất 10x",
      hook: "1 prompt. 10 bài viết. Thử không?",
      durationSeconds: 15,
      shots: [
        {
          startSecond: 0,
          endSecond: 5,
          purpose: "Hook",
          spokenText: "1 prompt. 10 bài viết.",
          visualDirection: "Fast cut, typing animation",
          onScreenText: "1 → 10",
          bRoll: undefined,
          cameraAction: "Close-up screen",
          ctaLine: undefined,
        },
        {
          startSecond: 5,
          endSecond: 15,
          purpose: "Demo nhanh",
          spokenText: "Nhập prompt, chọn template, bấm enter. 10 bài viết khác nhau xuất hiện trong 30 giây.",
          visualDirection: "Screen recording time-lapse",
          onScreenText: "Content Toolkit 🚀",
          bRoll: undefined,
          cameraAction: "Screen recording",
          ctaLine: "Comment TOOLKIT để nhận free template",
        },
      ],
      alternativeHooks: [],
      audioSuggestion: "Futuristic tech sound",
      cta: "Comment TOOLKIT",
      caption: "1 prompt = 10 bài viết? Thử ngay 🚀 #aitools #marketing",
      hashtags: ["aitools", "marketing", "contentcreator"],
      disclosureNote: "",
      warnings: [],
    },
  ],
  missingInformation: [],
  complianceNotes: [],
  createdAt: ts(new Date("2026-08-22T09:00:00Z")),
  updatedAt: NOW,
};

const scriptLearner1 = {
  id: "script-learner-001",
  userId: learner,
  productProfileId: "prod-learner-001",
  platform: "tiktok" as const,
  goal: "awareness" as const,
  durationSeconds: 30,
  selectedAngleId: "angle-accessible",
  scripts: [
    {
      title: "AI không khó như bạn nghĩ",
      angle: "AI dễ tiếp cận",
      hook: "Nếu bạn nghĩ AI chỉ dành cho dân IT, bạn sai rồi.",
      durationSeconds: 30,
      shots: [
        {
          startSecond: 0,
          endSecond: 10,
          purpose: "Hook — challenge assumption",
          spokenText: "Nếu bạn nghĩ AI chỉ dành cho dân IT, bạn sai rồi.",
          visualDirection: "Presenter nói thẳng vào camera",
          onScreenText: "AI ≠ DÂN IT",
          bRoll: undefined,
          cameraAction: "Medium close-up",
          ctaLine: undefined,
        },
        {
          startSecond: 10,
          endSecond: 25,
          purpose: "Educate",
          spokenText: "Cuốn sách này viết bằng tiếng Việt, giải thích AI bằng ngôn ngữ đời thường. Không cần code, không cần toán cao.",
          visualDirection: "Flip through book pages",
          onScreenText: "Tiếng Việt · Không cần code",
          bRoll: "Hình ảnh sách thực tế",
          cameraAction: "Overhead shot",
          ctaLine: undefined,
        },
        {
          startSecond: 25,
          endSecond: 30,
          purpose: "CTA",
          spokenText: "Link mua sách ở bio. 199k cho một cuốn sách thay đổi cách bạn nhìn AI.",
          visualDirection: "Book cover + CTA overlay",
          onScreenText: "199K · LINK BIO",
          bRoll: undefined,
          cameraAction: "Close-up",
          ctaLine: "Mua sách qua link bio",
        },
      ],
      alternativeHooks: ["AI không phải robot đáng sợ. Đây là công cụ giúp bạn."],
      audioSuggestion: "Acoustic guitar nhẹ",
      cta: "Mua sách — link bio",
      caption: "AI không khó! Cuốn sách này chứng minh điều đó 📖 #sachai #hocai #aimo",
      hashtags: ["sachai", "hocai", "aimo", "aitools"],
      disclosureNote: "",
      warnings: [],
    },
  ],
  missingInformation: [],
  complianceNotes: [],
  createdAt: ts(new Date("2026-08-23T16:00:00Z")),
  updatedAt: NOW,
};

const allScripts = [scriptAdmin1, scriptAdmin2, scriptLearner1];

// ── Campaigns ────────────────────────────────────────────────────────────────
const campaignAdmin1 = {
  id: "camp-admin-001",
  userId: admin,
  name: "Launch Khóa Học AI — Tuần 1",
  startDate: "2026-08-20T00:00:00Z",
  durationDays: 7 as 7,
  platform: "tiktok" as const,
  goal: "conversion" as const,
  items: [
    { day: 1, scriptId: "script-admin-001", status: "published" as const, publishedUrl: "https://tiktok.com/@aimo/video/1", notes: "Video launch đầu tiên" },
    { day: 2, scriptId: undefined, status: "planned" as const, publishedUrl: undefined, notes: "Rest day — engagement post" },
    { day: 3, scriptId: "script-admin-001", status: "scripted" as const, publishedUrl: undefined, notes: "Variant B" },
    { day: 4, scriptId: undefined, status: "planned" as const, publishedUrl: undefined, notes: "UGC repost" },
    { day: 5, scriptId: "script-admin-001", status: "produced" as const, publishedUrl: undefined, notes: "Quay lại với testimonial" },
    { day: 6, scriptId: undefined, status: "planned" as const, publishedUrl: undefined, notes: "Behind the scenes" },
    { day: 7, scriptId: "script-admin-001", status: "planned" as const, publishedUrl: undefined, notes: "Flash sale closing" },
  ],
  createdAt: ts(new Date("2026-08-19T10:00:00Z")),
  updatedAt: NOW,
};

const campaignAdmin2 = {
  id: "camp-admin-002",
  userId: admin,
  name: "Toolkit Reels Series",
  startDate: "2026-08-22T00:00:00Z",
  durationDays: 14 as 14,
  platform: "reels" as const,
  goal: "engagement" as const,
  items: [
    { day: 1, scriptId: "script-admin-002", status: "published" as const, publishedUrl: "https://instagram.com/reel/xyz1", notes: "First reel" },
    { day: 2, scriptId: undefined, status: "planned" as const, publishedUrl: undefined, notes: "Carousel post" },
    { day: 3, scriptId: "script-admin-002", status: "scripted" as const, publishedUrl: undefined, notes: "Tip 2" },
  ],
  createdAt: ts(new Date("2026-08-21T08:00:00Z")),
  updatedAt: NOW,
};

const campaignLearner1 = {
  id: "camp-learner-001",
  userId: learner,
  name: "Sách AI — Launch 7 ngày",
  startDate: "2026-08-23T00:00:00Z",
  durationDays: 7 as 7,
  platform: "tiktok" as const,
  goal: "awareness" as const,
  items: [
    { day: 1, scriptId: "script-learner-001", status: "published" as const, publishedUrl: "https://tiktok.com/@learner/video/100", notes: "Giới thiệu sách" },
    { day: 2, scriptId: undefined, status: "planned" as const, publishedUrl: undefined, notes: "Review sách" },
    { day: 3, scriptId: "script-learner-001", status: "produced" as const, publishedUrl: undefined, notes: "Trích đoạn hay" },
  ],
  createdAt: ts(new Date("2026-08-22T14:00:00Z")),
  updatedAt: NOW,
};

const allCampaigns = [campaignAdmin1, campaignAdmin2, campaignLearner1];

// ── Performance Metrics ──────────────────────────────────────────────────────
const perfMetrics = [
  {
    id: "perf-001",
    userId: admin,
    scriptId: "script-admin-001",
    campaignId: "camp-admin-001",
    recordedAt: ts(new Date("2026-08-21T08:00:00Z")),
    views: 12500,
    likes: 890,
    comments: 145,
    shares: 78,
    clicks: 320,
    conversions: 28,
    revenue: 27720000,
    costSpent: 500000,
    watchTimeSeconds: 18750,
    engagementRate: 9.6,
    ctr: 2.56,
    roas: 55.44,
  },
  {
    id: "perf-002",
    userId: admin,
    scriptId: "script-admin-002",
    campaignId: "camp-admin-002",
    recordedAt: ts(new Date("2026-08-23T08:00:00Z")),
    views: 8300,
    likes: 620,
    comments: 89,
    shares: 45,
    clicks: 210,
    conversions: 12,
    revenue: 5880000,
    costSpent: 300000,
    watchTimeSeconds: 6225,
    engagementRate: 10.1,
    ctr: 2.53,
    roas: 19.6,
  },
  {
    id: "perf-003",
    userId: learner,
    scriptId: "script-learner-001",
    campaignId: "camp-learner-001",
    recordedAt: ts(new Date("2026-08-24T08:00:00Z")),
    views: 3200,
    likes: 280,
    comments: 34,
    shares: 22,
    clicks: 95,
    conversions: 8,
    revenue: 1592000,
    costSpent: 100000,
    watchTimeSeconds: 4800,
    engagementRate: 12.1,
    ctr: 2.97,
    roas: 15.92,
  },
];

// ── Generation Jobs ──────────────────────────────────────────────────────────
const genJobs = [
  {
    id: "gen-001",
    userId: admin,
    status: "complete",
    prompt: { platform: "tiktok", goal: "conversion" },
    result: { generatedCount: 3 },
    createdAt: ts(new Date("2026-08-20T14:00:00Z")),
    updatedAt: NOW,
  },
  {
    id: "gen-002",
    userId: learner,
    status: "complete",
    prompt: { platform: "tiktok", goal: "awareness" },
    result: { generatedCount: 3 },
    createdAt: ts(new Date("2026-08-23T16:00:00Z")),
    updatedAt: NOW,
  },
];

// ── Assemble & Write ─────────────────────────────────────────────────────────
const studioDb = {
  version: 1,
  updatedAt: NOW,
  products: allProducts,
  scripts: allScripts,
  campaigns: allCampaigns,
  brandProfiles,
  performanceMetrics: perfMetrics,
  generationJobs: genJobs,
};

const usageDb = {
  entries: [
    { userId: admin, day: "2026-08-20", count: 3 },
    { userId: admin, day: "2026-08-21", count: 1 },
    { userId: admin, day: "2026-08-22", count: 2 },
    { userId: admin, day: "2026-08-26", count: 0 },
    { userId: learner, day: "2026-08-23", count: 3 },
    { userId: learner, day: "2026-08-24", count: 1 },
    { userId: learner, day: "2026-08-26", count: 0 },
  ],
  updatedAt: NOW,
};

async function main() {
  const dir = path.resolve(process.cwd(), "data");

  // Timestamped backup of current studio.json
  const ts2 = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(dir, "backups");
  await mkdir(backupDir, { recursive: true });
  try {
    await copyFile(path.join(dir, "studio.json"), path.join(backupDir, `studio.pre-seed.${ts2}.json`));
    console.log(`[Backup] studio.json → backups/studio.pre-seed.${ts2}.json`);
  } catch { /* file may not exist */ }

  await writeFile(path.join(dir, "studio.json"), JSON.stringify(studioDb, null, 2));
  console.log("[Write] data/studio.json updated");

  await writeFile(path.join(dir, "ai-usage.json"), JSON.stringify(usageDb, null, 2));
  console.log("[Write] data/ai-usage.json updated");

  // Checksum
  const raw = await import("node:fs/promises").then(f => f.readFile(path.join(dir, "studio.json"), "utf-8"));
  const checksum = crypto.createHash("sha256").update(raw).digest("hex");
  console.log(`\n[Checksum] SHA-256: ${checksum}`);
  console.log(`[Checksum] Size: ${raw.length} bytes`);

  // Entity counts
  console.log("\n--- Expected Entity Counts ---");
  console.log(`  Brand Profiles:       ${studioDb.brandProfiles.length}`);
  console.log(`  Products:             ${studioDb.products.length}`);
  console.log(`    admin-demo:         ${studioDb.products.filter(p => p.userId === admin).length}`);
  console.log(`    learner-demo:       ${studioDb.products.filter(p => p.userId === learner).length}`);
  console.log(`  Scripts:              ${studioDb.scripts.length}`);
  console.log(`    admin-demo:         ${studioDb.scripts.filter(s => s.userId === admin).length}`);
  console.log(`    learner-demo:       ${studioDb.scripts.filter(s => s.userId === learner).length}`);
  console.log(`  Campaigns:            ${studioDb.campaigns.length}`);
  console.log(`    admin-demo:         ${studioDb.campaigns.filter(c => c.userId === admin).length}`);
  console.log(`    learner-demo:       ${studioDb.campaigns.filter(c => c.userId === learner).length}`);
  const totalItems = studioDb.campaigns.reduce((n, c) => n + c.items.length, 0);
  console.log(`  Campaign Items:       ${totalItems}`);
  console.log(`  Performance Metrics:  ${studioDb.performanceMetrics.length}`);
  console.log(`  Generation Jobs:      ${studioDb.generationJobs.length}`);
  console.log(`  AI Usage Entries:     ${usageDb.entries.length}`);

  console.log("\n✅ Seed data written.");
}

main().catch(console.error);
