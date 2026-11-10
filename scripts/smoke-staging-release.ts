#!/usr/bin/env tsx
/**
 * Staging Release Candidate Smoke Test (Phase 5A)
 *
 * Verifies live VietAPI integration, live PostgreSQL staging CRUD,
 * ownership isolation, observability metrics, and performs clean fixture teardown.
 *
 * Run: npx tsx scripts/smoke-staging-release.ts
 */

import path from "node:path";
import * as dotenv from "dotenv";
import assert from "node:assert/strict";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { generatePromptKichBan } from "../src/lib/promptkichban/service";
import {
  createDocument,
  getDocumentById,
  updateDocument,
  softDeleteDocument,
  listDocuments,
} from "../src/lib/promptkichban/document-store";
import { getMetricsSummary, recordSafeMetric } from "../src/lib/promptkichban/observability";
import { getPromptKichBanEnv } from "../src/lib/promptkichban/ai";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function runStagingSmokeTest() {
  console.log("==========================================================");
  console.log("     PROMPTKICHBAN STAGING RELEASE SMOKE TEST (PHASE 5A)  ");
  console.log("==========================================================\n");

  const startTime = Date.now();
  let testUserId: string | null = null;
  let testDocId: string | null = null;

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const adapter = new PrismaPg({ connectionString: dbUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    // ── 1. Create Isolated Test User ───────────────────────────────────────────
    console.log("[1/6] Creating isolated staging smoke test user...");
    const smokeUserEmail = `staging-smoke-${Date.now()}@aimo.vn`;
    const user = await prisma.user.create({
      data: {
        email: smokeUserEmail,
        name: "Staging Smoke Candidate User",
      },
    });
    testUserId = user.id;
    console.log(`  ✓ Created test user with ID: ${testUserId} (${smokeUserEmail})`);

    // ── 2. Live AI Generation Smoke ────────────────────────────────────────────
    console.log("\n[2/6] Testing AI script generation...");
    const env = getPromptKichBanEnv();
    console.log(`  Current Provider: ${env.provider} | Model: ${env.model}`);

    const genStart = Date.now();
    const sampleInput: PromptKichBanInput = {
      contentType: "product-review",
      visualStyle: "tech-cinematic",
      publishingPlatform: "tiktok",
      promptModel: "veo3",
      aspectRatio: "9:16",
      durationSeconds: 30,
      voiceGender: "male",
      voiceRegion: "south",
      voiceAge: "young",
      voiceRole: "reviewer",
      speakingSpeed: "normal",
      emotion: "friendly",
      language: "vi",
      tone: "Chân thật, khách quan",
      inputText: "Đánh giá chi tiết iPhone 15 Pro Max màu titan tự nhiên sau 6 tháng sử dụng thực tế tại Anh Táo Mobile.",
    };

    const output = await generatePromptKichBan(sampleInput);
    const genDuration = Date.now() - genStart;

    assert.ok(output.requestId, "Output must contain requestId");
    assert.equal(output.durationSeconds, 30, "Duration must match 30s");
    assert.ok(output.scenes.length >= 3, "Must have at least 3 scenes");
    assert.ok(
      output.scenes[0].modelPrompts?.veo3 || output.scenes[0].aiPrompt,
      "Must have compiled prompt in scene"
    );
    console.log(`  ✓ Generated ${output.scenes.length} scenes in ${genDuration}ms (Valid schema & timeline)`);

    // ── 3. Observability Metric Verification ──────────────────────────────────
    console.log("\n[3/6] Verifying safe observability logging...");
    recordSafeMetric({
      requestId: output.requestId,
      event: "generate",
      status: "success",
      statusCode: 200,
      provider: env.provider,
      model: env.model || "unknown",
      latencyMs: genDuration,
      sceneCount: output.scenes.length,
      totalTokens: 2500,
      quotaRemaining: 2,
    });
    const metrics = getMetricsSummary();
    assert.ok(metrics.totalRequests > 0, "Metrics summary must record request");
    assert.ok(metrics.avgLatencyMs > 0, "Metrics summary must compute average latency");
    console.log(`  ✓ Metrics recorded: Total=${metrics.totalRequests}, AvgLatency=${metrics.avgLatencyMs}ms`);

    // ── 4. Cloud Document Save & Roundtrip ────────────────────────────────────
    console.log("\n[4/6] Testing Cloud Library save & persistence on PostgreSQL...");
    const doc = await createDocument(testUserId, {
      title: "Kịch bản review iPhone 15 Pro Max Titanium",
      inputSnapshot: sampleInput,
      outputSnapshot: output,
      provider: env.provider,
      model: env.model,
      status: "saved",
    });
    testDocId = doc.id;
    assert.equal(doc.userId, testUserId);
    assert.equal(doc.title, "Kịch bản review iPhone 15 Pro Max Titanium");
    console.log(`  ✓ Saved script to PostgreSQL with ID: ${testDocId}`);

    // Verify Read
    const fetched = await getDocumentById(testDocId, testUserId);
    assert.ok(fetched, "Must fetch saved document");
    assert.equal(fetched.id, testDocId);
    console.log("  ✓ Retrieved saved script by ID with ownership verification");

    // ── 5. Rename & Soft-Delete Operations ───────────────────────────────────
    console.log("\n[5/6] Testing inline rename & soft-delete...");
    const renamed = await updateDocument(testDocId, testUserId, {
      title: "Kịch bản review iPhone 15 Pro Max Titanium [Đã sửa đổi]",
    });
    assert.equal(renamed.title, "Kịch bản review iPhone 15 Pro Max Titanium [Đã sửa đổi]");
    console.log("  ✓ Renamed document successfully");

    // Soft-delete
    const deleteResult = await softDeleteDocument(testDocId, testUserId);
    assert.equal(deleteResult.success, true);

    // Verify excluded from list
    const listAfterDelete = await listDocuments(testUserId, { limit: 10 });
    const foundDeleted = listAfterDelete.documents.some((d) => d.id === testDocId);
    assert.equal(foundDeleted, false, "Soft-deleted document must be excluded from listing");
    console.log("  ✓ Soft-deleted document is properly hidden from user library");

    // ── 6. Full Teardown & Clean State Guarantee ──────────────────────────────
    console.log("\n[6/6] Cleaning up test fixtures from staging PostgreSQL...");
    // Hard delete test document
    await prisma.$executeRawUnsafe(
      `DELETE FROM "public"."PromptKichBanDocument" WHERE "id" = '${testDocId}'`
    );
    // Hard delete test user
    await prisma.user.delete({ where: { id: testUserId } });
    testUserId = null;
    testDocId = null;
    console.log("  ✓ Test user & test document completely removed from database");

    const totalDuration = Date.now() - startTime;
    console.log("\n==========================================================");
    console.log(`✅ STAGING RELEASE SMOKE TEST PASSED in ${totalDuration}ms`);
    console.log("==========================================================");
  } catch (err) {
    console.error("\n❌ STAGING SMOKE TEST FAILED:", err);
    // Teardown on failure
    if (testDocId) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM "public"."PromptKichBanDocument" WHERE "id" = '${testDocId}'`
      ).catch(() => {});
    }
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runStagingSmokeTest().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
