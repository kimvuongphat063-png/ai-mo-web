/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * PromptKichBan Authenticated Library & Postgres Document Store Test Suite (Phase 4)
 *
 * Run:
 *   node --conditions=react-server --import tsx tests/promptkichban-documents.ts
 */

import assert from "node:assert/strict";
import {
  createDocument,
  listDocuments,
  getDocumentById,
  updateDocument,
  softDeleteDocument,
  _resetMemoryStoreForTesting,
} from "../src/lib/promptkichban/document-store";
import type {
  PromptKichBanInput,
  VideoPromptOutput,
} from "../src/lib/promptkichban/schema";
import { PromptKichBanError } from "../src/lib/promptkichban/ai";

let passed = 0;
let failed = 0;
const failures: string[] = [];

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
    failures.push(`${name}\n${message}`);
    console.log(`  ✗ ${name}`);
  }
}

function section(name: string) {
  console.log(`\n=== ${name} ===`);
}

// Sample mock data for testing
const sampleInput: PromptKichBanInput = {
  inputText: "iPhone 15 Pro Max màu titan tự nhiên nguyên zin bảo hành 12 tháng tại Anh Táo Mobile.",
  contentType: "product-review",
  visualStyle: "tech-cinematic",
  publishingPlatform: "tiktok",
  promptModel: "all",
  aspectRatio: "9:16",
  durationSeconds: 30,
  voiceGender: "male",
  voiceRegion: "south",
  voiceAge: "young",
  voiceRole: "reviewer",
  speakingSpeed: "normal",
  emotion: "friendly",
  language: "vi",
  tone: "Hài hước, gần gũi, uy tín",
  callToAction: "Ghé ngay Anh Táo Mobile để nhận báo giá!",
};

const sampleOutput: VideoPromptOutput = {
  title: "Review iPhone 15 Pro Max Titan Tự Nhiên",
  summary: "Video review chi tiết iPhone 15 Pro Max 99% nguyên zin 30 giây",
  visualStyle: "tech-cinematic",
  contentType: "product-review",
  publishingPlatform: "tiktok",
  promptModel: "all",
  aspectRatio: "9:16",
  durationSeconds: 30,
  targetAudience: "Khách hàng mua iPhone cũ uy tín",
  tone: "Chân thực, đáng tin cậy",
  hook: "Đừng mua iPhone 15 Pro Max cũ nếu bạn chưa biết điều này!",
  cta: "Bấm ngay vào giỏ hàng hoặc inbox Anh Táo Mobile nhé!",
  caption: "iPhone 15 Pro Max titan tự nhiên cực hot! #AnhTaoMobile #iPhone15ProMax",
  hashtags: ["#iPhone15ProMax", "#AnhTaoMobile", "#ReviewCongNghe"],
  scenes: [
    {
      sceneNumber: 1,
      startSecond: 0,
      endSecond: 10,
      scenePurpose: "Hook mở đầu",
      visualDescription: "Cận cảnh viền titan tự nhiên lấp lánh ánh kim",
      setting: "Studio chuyên nghiệp",
      subject: "iPhone 15 Pro Max",
      cameraShot: "Extreme Close-up",
      cameraMovement: "Slow orbital pan",
      lensAndDepth: "50mm prime, f/1.8",
      lighting: "Soft cinematic studio lighting",
      action: "Xoay nhẹ thân máy khoe viền titan",
      voiceover: "Trên tay mình là iPhone 15 Pro Max màu titan tự nhiên đẹp 99%.",
      onScreenText: "Titan tự nhiên • Đẹp 99%",
      soundDesign: "Whoosh nhẹ nhàng",
      transition: "Cut",
      prompt: "Cinematic close-up of natural titanium iPhone 15 Pro Max",
      negativePrompt: "blurry, low quality",
      modelPrompts: {
        veo3: "Cinematic macro shot of titanium smartphone",
        grok: "High-fidelity 4K video of titanium phone",
        seedance2: "At [0s-10s] titanium smartphone close-up",
        seedance25: "At [0s-10s] close-up of titanium device",
        muse: "Commercial TVC optical profile 50mm lens",
      },
    },
    {
      sceneNumber: 2,
      startSecond: 10,
      endSecond: 30,
      scenePurpose: "Bảo hành và CTA",
      visualDescription: "Người dẫn cầm máy trên tay nở nụ cười",
      setting: "Cửa hàng Anh Táo Mobile",
      subject: "Người dẫn và máy",
      cameraShot: "Medium shot",
      cameraMovement: "Static",
      lensAndDepth: "35mm prime, f/2.0",
      lighting: "Warm retail lighting",
      action: "Người dẫn giơ máy và chỉ tay vào màn hình",
      voiceover: "Cam kết máy nguyên zin, bảo hành 1 đổi 1 trong 12 tháng tại Anh Táo Mobile!",
      onScreenText: "Bảo hành 1 đổi 1 trong 12 tháng",
      soundDesign: "Upbeat background acoustic music",
      transition: "Fade out",
      prompt: "Friendly Vietnamese presenter holding smartphone in modern store",
      negativePrompt: "distorted faces",
      modelPrompts: {
        veo3: "Presenter in modern tech retail store",
        grok: "Medium shot of presenter smiling with smartphone",
        seedance2: "At [10s-30s] presenter holding smartphone",
        seedance25: "At [10s-30s] smiling presenter in store",
        muse: "Commercial TVC 35mm wide aperture",
      },
    },
  ],
  voiceoverFull: "Trên tay mình là iPhone 15 Pro Max màu titan tự nhiên đẹp 99%. Cam kết máy nguyên zin, bảo hành 1 đổi 1 trong 12 tháng tại Anh Táo Mobile!",
  warnings: [],
  missingInformation: [],
  generatedAt: new Date().toISOString(),
  requestId: "test-req-12345",
};

async function run() {
  _resetMemoryStoreForTesting();

  section("1. Document Creation & Snapshot Validation");

  await test("createDocument requires valid userId", async () => {
    await assert.rejects(
      async () => {
        await createDocument("", {
          inputSnapshot: sampleInput,
          outputSnapshot: sampleOutput,
        });
      },
      (err: any) => {
        assert.equal(err.code, "validation");
        return true;
      }
    );
  });

  await test("createDocument validates inputSnapshot schema", async () => {
    await assert.rejects(
      async () => {
        await createDocument("user-1", {
          inputSnapshot: { ...sampleInput, inputText: "Quá ngắn" }, // < 20 chars
          outputSnapshot: sampleOutput,
        });
      },
      (err: any) => {
        assert.equal(err.code, "validation");
        return true;
      }
    );
  });

  await test("createDocument persists document with ownership and metadata", async () => {
    const doc = await createDocument("user-1", {
      title: "Review iPhone 15 Pro Max Titan",
      inputSnapshot: sampleInput,
      outputSnapshot: sampleOutput,
      provider: "vietapi",
      model: "deepseek-v4-flash",
    });

    assert.ok(doc.id.startsWith("pkb_") || doc.id.length > 10);
    assert.equal(doc.userId, "user-1");
    assert.equal(doc.title, "Review iPhone 15 Pro Max Titan");
    assert.equal(doc.contentType, "product-review");
    assert.equal(doc.durationSeconds, 30);
    assert.equal(doc.aspectRatio, "9:16");
    assert.equal(doc.publishingPlatform, "tiktok");
    assert.equal(doc.status, "saved");
    assert.ok(doc.createdAt);
    assert.ok(doc.updatedAt);
  });

  section("2. Strict Ownership & User Isolation");

  await test("listDocuments only returns documents for the requesting userId", async () => {
    // user-1 has 1 document from previous test
    // Create 2 more documents for user-2
    await createDocument("user-2", {
      title: "Kịch bản User 2 - Bài 1",
      inputSnapshot: sampleInput,
      outputSnapshot: sampleOutput,
    });
    await createDocument("user-2", {
      title: "Kịch bản User 2 - Bài 2",
      inputSnapshot: sampleInput,
      outputSnapshot: sampleOutput,
    });

    const user1List = await listDocuments("user-1");
    assert.equal(user1List.total, 1);
    assert.equal(user1List.documents[0].userId, "user-1");

    const user2List = await listDocuments("user-2");
    assert.equal(user2List.total, 2);
    assert.ok(user2List.documents.every((d) => d.userId === "user-2"));

    // User-3 has 0 documents
    const user3List = await listDocuments("user-3");
    assert.equal(user3List.total, 0);
    assert.equal(user3List.documents.length, 0);
  });

  await test("getDocumentById returns document only if owned by session userId", async () => {
    const doc = await createDocument("user-alice", {
      title: "Kịch bản bí mật của Alice",
      inputSnapshot: sampleInput,
      outputSnapshot: sampleOutput,
    });

    // Alice can fetch her own document
    const aliceDoc = await getDocumentById(doc.id, "user-alice");
    assert.ok(aliceDoc);
    assert.equal(aliceDoc.id, doc.id);
    assert.equal(aliceDoc.title, "Kịch bản bí mật của Alice");

    // Bob cannot fetch Alice's document (returns null to prevent ID enumeration)
    const bobDoc = await getDocumentById(doc.id, "user-bob");
    assert.equal(bobDoc, null);

    // Non-existent ID returns null
    const notFound = await getDocumentById("non-existent-id", "user-alice");
    assert.equal(notFound, null);
  });

  section("3. Update Operations (Rename & Storyboard Sync)");

  await test("updateDocument updates title and status for owner", async () => {
    const doc = await createDocument("user-charlie", {
      title: "Tên cũ",
      inputSnapshot: sampleInput,
      outputSnapshot: sampleOutput,
    });

    const updated = await updateDocument(doc.id, "user-charlie", {
      title: "Tên mới đã đổi",
      status: "draft",
    });

    assert.equal(updated.title, "Tên mới đã đổi");
    assert.equal(updated.status, "draft");

    // Verify persistence
    const fetched = await getDocumentById(doc.id, "user-charlie");
    assert.equal(fetched?.title, "Tên mới đã đổi");
    assert.equal(fetched?.status, "draft");
  });

  await test("updateDocument rejects unauthorized updates from non-owner", async () => {
    const doc = await createDocument("user-david", {
      title: "Kịch bản của David",
      inputSnapshot: sampleInput,
      outputSnapshot: sampleOutput,
    });

    // Eve attempts to update David's document
    await assert.rejects(
      async () => {
        await updateDocument(doc.id, "user-eve", {
          title: "Bị Eve sửa lén",
        });
      },
      (err: any) => {
        assert.equal(err.code, "not_found");
        return true;
      }
    );

    // Verify title was NOT modified
    const original = await getDocumentById(doc.id, "user-david");
    assert.equal(original?.title, "Kịch bản của David");
  });

  section("4. Soft Deletion & Exclusion");

  await test("softDeleteDocument hides document from list and get queries", async () => {
    const doc = await createDocument("user-frank", {
      title: "Kịch bản sắp xóa",
      inputSnapshot: sampleInput,
      outputSnapshot: sampleOutput,
    });

    // Before deletion
    const beforeList = await listDocuments("user-frank");
    assert.equal(beforeList.total, 1);

    // Delete
    const deleteRes = await softDeleteDocument(doc.id, "user-frank");
    assert.equal(deleteRes.success, true);

    // After deletion: listDocuments excludes it
    const afterList = await listDocuments("user-frank");
    assert.equal(afterList.total, 0);

    // getDocumentById returns null
    const getDeleted = await getDocumentById(doc.id, "user-frank");
    assert.equal(getDeleted, null);
  });

  await test("softDeleteDocument rejects deletion attempt from non-owner", async () => {
    const doc = await createDocument("user-grace", {
      title: "Kịch bản của Grace",
      inputSnapshot: sampleInput,
      outputSnapshot: sampleOutput,
    });

    // Mallory attempts to delete Grace's document
    const res = await softDeleteDocument(doc.id, "user-mallory");
    assert.equal(res.success, false);

    // Grace's document remains active
    const stillExists = await getDocumentById(doc.id, "user-grace");
    assert.ok(stillExists);
    assert.equal(stillExists.title, "Kịch bản của Grace");
  });

  section("5. Search & Filtering");

  await test("listDocuments filters by search keyword and contentType", async () => {
    _resetMemoryStoreForTesting();

    await createDocument("user-filter", {
      title: "Review camera iPhone 15 Pro",
      inputSnapshot: { ...sampleInput, contentType: "product-review" },
      outputSnapshot: sampleOutput,
    });
    await createDocument("user-filter", {
      title: "Bán hàng tai nghe chống ồn",
      inputSnapshot: { ...sampleInput, contentType: "sales" },
      outputSnapshot: sampleOutput,
    });
    await createDocument("user-filter", {
      title: "Mẹo hay tăng tốc iPhone",
      inputSnapshot: { ...sampleInput, contentType: "tips" },
      outputSnapshot: sampleOutput,
    });

    // Search by keyword "iphone"
    const searchRes = await listDocuments("user-filter", { search: "iphone" });
    assert.equal(searchRes.total, 2);

    // Filter by contentType "sales"
    const typeRes = await listDocuments("user-filter", { contentType: "sales" });
    assert.equal(typeRes.total, 1);
    assert.equal(typeRes.documents[0].title, "Bán hàng tai nghe chống ồn");
  });

  section("6. Security: No Sensitive Key Storage");

  await test("document snapshots do not store API keys or secrets", async () => {
    const doc = await createDocument("user-sec", {
      title: "Kiểm tra bảo mật",
      inputSnapshot: sampleInput,
      outputSnapshot: sampleOutput,
      provider: "vietapi",
      model: "deepseek-v4-flash",
    });

    const serialized = JSON.stringify(doc);
    assert.equal(serialized.includes("sk-"), false);
    assert.equal(serialized.includes("PROMPTKICHBAN_AI_API_KEY"), false);
    assert.equal(serialized.includes("passwordHash"), false);
  });

  section("7. Staging / Production Memory Fallback Guard");

  await test("blocks memory fallback in production when database table is unavailable", async () => {
    const origNodeEnv = process.env.NODE_ENV;
    const origDbUrl = process.env.DATABASE_URL;
    try {
      process.env.NODE_ENV = "production";
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";
      await assert.rejects(
        async () => {
          await createDocument("user-guard-test", {
            inputSnapshot: sampleInput,
            outputSnapshot: sampleOutput,
          });
        },
        (err: any) => {
          assert.equal(err instanceof PromptKichBanError, true);
          assert.equal(err.code, "config");
          return true;
        }
      );
    } finally {
      process.env.NODE_ENV = origNodeEnv;
      if (origDbUrl) {
        process.env.DATABASE_URL = origDbUrl;
      } else {
        delete process.env.DATABASE_URL;
      }
    }
  });

  // Final summary
  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================`);

  if (failed > 0) {
    console.error("\nFailures:\n" + failures.join("\n\n"));
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
