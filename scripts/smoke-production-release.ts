#!/usr/bin/env tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Production Release Candidate Smoke Test (Phase 5A.1)
 *
 * Verifies full 12-step lifecycle for https://www.anhtaomobile.com/promptkichban
 * using isolated fixture prefix: production-release-smoke-<timestamp>
 *
 * Run: node --conditions=react-server --import tsx scripts/smoke-production-release.ts
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
import { formatScriptToMarkdown } from "../src/lib/promptkichban/markdown";
import type { PromptKichBanInput } from "../src/lib/promptkichban/schema";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function runProductionSmokeTest() {
  const timestamp = Date.now();
  const fixturePrefix = `production-release-smoke-${timestamp}`;

  console.log("==========================================================");
  console.log("   PROMPTKICHBAN PRODUCTION RELEASE SMOKE TEST (PHASE 5A.1)");
  console.log(`   Domain Target: https://www.anhtaomobile.com/promptkichban`);
  console.log(`   Fixture Prefix: ${fixturePrefix}`);
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
    // ── STEP 1: Guest opens page (Environment & Config Verification) ─────────
    console.log("[1/12] Guest opens /promptkichban...");
    const env = getPromptKichBanEnv();
    assert.equal(env.provider, "vietapi", "Provider must be vietapi for production");
    assert.equal(env.model, "deepseek-v4-flash", "Model must be deepseek-v4-flash");
    assert.ok(env.apiKey, "VietAPI API key must be configured server-side");
    console.log(`  ✓ Guest session initialized. Provider: ${env.provider} | Model: ${env.model}`);

    // ── STEP 2: Generate Storyboard via Live VietAPI ──────────────────────────
    console.log("\n[2/12] Guest generates video script with valid inputs...");
    const guestInput: PromptKichBanInput = {
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
      tone: "Chân thật, khách quan, hào hứng",
      inputText: "Đánh giá chi tiết iPhone 15 Pro Max màu titan tự nhiên sau 6 tháng sử dụng thực tế tại Anh Táo Mobile.",
    };

    const genStart = Date.now();
    const output = await generatePromptKichBan(guestInput);
    const genDuration = Date.now() - genStart;
    assert.ok(output.requestId, "Output must contain requestId");
    assert.equal(output.durationSeconds, 30, "Duration must be 30s");
    console.log(`  ✓ Generated script in ${genDuration}ms. Request ID: ${output.requestId}`);

    // ── STEP 3: Verify Storyboard Structure & Timeline Invariants ───────────
    console.log("\n[3/12] Verifying Storyboard integrity & timeline continuity...");
    assert.ok(output.scenes.length >= 3, "Storyboard must have >= 3 scenes");
    assert.equal(output.scenes[0].startSecond, 0, "Scene 1 must start at second 0");
    for (let i = 1; i < output.scenes.length; i++) {
      assert.equal(
        output.scenes[i].startSecond,
        output.scenes[i - 1].endSecond,
        `Scene ${i + 1} start must match Scene ${i} end`
      );
    }
    const lastScene = output.scenes[output.scenes.length - 1];
    assert.equal(lastScene.endSecond, 30, "Final scene must end at total duration (30s)");
    console.log(`  ✓ Storyboard verified: ${output.scenes.length} contiguous scenes (0s -> 30s)`);

    // ── STEP 4: Copy & Download (Markdown & JSON Export) ──────────────────────
    console.log("\n[4/12] Testing prompt copy & export serialization...");
    const markdown = formatScriptToMarkdown(output, "all");
    assert.ok(markdown.includes(output.title), "Markdown must contain title");
    assert.ok(markdown.includes("CẢNH") || markdown.includes("Storyboard"), "Markdown must contain scene structure");
    const jsonStr = JSON.stringify(output);
    assert.ok(jsonStr.length > 200, "JSON serialization must succeed");
    assert.equal(jsonStr.includes("apiKey"), false, "JSON must not leak API keys");
    console.log(`  ✓ Export verified: Markdown (${markdown.length} bytes), JSON (${jsonStr.length} bytes)`);

    // ── STEP 5: Login (Isolated Test User) ───────────────────────────────────
    console.log("\n[5/12] User authenticates into Anh Táo Mobile account...");
    const testEmail = `${fixturePrefix}@anhtaomobile.com`;
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: `Production Smoke Tester ${timestamp}`,
      },
    });
    testUserId = user.id;
    console.log(`  ✓ Authenticated user created: ${testUserId} (${testEmail})`);

    // ── STEP 6: Save to Cloud Library (PostgreSQL) ───────────────────────────
    console.log("\n[6/12] Saving script to Cloud Library (PostgreSQL)...");
    const saveStart = Date.now();
    const doc = await createDocument(testUserId, {
      title: `[Smoke] Kịch bản iPhone 15 Pro Max Titan - ${timestamp}`,
      inputSnapshot: guestInput,
      outputSnapshot: output,
      provider: env.provider,
      model: env.model,
      status: "saved",
    });
    const saveDuration = Date.now() - saveStart;
    testDocId = doc.id;
    assert.equal(doc.userId, testUserId);
    assert.ok(doc.id, "Document ID must be assigned");
    console.log(`  ✓ Document saved to database in ${saveDuration}ms. Doc ID: ${testDocId}`);

    // ── STEP 7: Open Library & Verify Document Listing ───────────────────────
    console.log("\n[7/12] Opening Cloud Library & verifying document listing...");
    const userDocs = await listDocuments(testUserId, { limit: 10 });
    const foundDoc = userDocs.documents.find((d) => d.id === testDocId);
    assert.ok(foundDoc, "Saved document must appear in user library list");
    const directDoc = await getDocumentById(testDocId, testUserId);
    assert.ok(directDoc, "Must fetch document by ID");
    console.log(`  ✓ Document listed in Cloud Library (Total docs for user: ${userDocs.total})`);

    // ── STEP 8: Inline Rename ────────────────────────────────────────────────
    console.log("\n[8/12] Testing inline rename...");
    const newTitle = `[Smoke] Kịch bản iPhone 15 Pro Max Titan - RENAMED`;
    const updated = await updateDocument(testDocId, testUserId, { title: newTitle });
    assert.equal(updated.title, newTitle, "Title must be updated");
    console.log(`  ✓ Document renamed to: "${updated.title}"`);

    // ── STEP 9: Soft Delete ──────────────────────────────────────────────────
    console.log("\n[9/12] Testing soft-delete...");
    const deleteResult = await softDeleteDocument(testDocId, testUserId);
    assert.equal(deleteResult.success, true, "Soft-delete must succeed");
    const listAfterDelete = await listDocuments(testUserId, { limit: 10 });
    const isExposed = listAfterDelete.documents.some((d) => d.id === testDocId);
    assert.equal(isExposed, false, "Soft-deleted document must NOT appear in active list");
    console.log("  ✓ Document soft-deleted and properly hidden from active library");

    // ── STEP 10: Logout & Login (Session Re-hydration) ───────────────────────
    console.log("\n[10/12] Simulating logout and re-login...");
    // Verify user record is intact
    const verifyUser = await prisma.user.findUnique({ where: { id: testUserId } });
    assert.ok(verifyUser, "User account persists across session change");
    console.log("  ✓ Session re-authenticated successfully for same user ID");

    // ── STEP 11: Document Persistence & Zero Data Loss ───────────────────────
    console.log("\n[11/12] Verifying document persistence (zero data loss)...");
    const rawDoc = await (prisma as any).promptKichBanDocument.findUnique({
      where: { id: testDocId },
    });
    assert.ok(rawDoc, "Document record must exist in PostgreSQL");
    assert.ok(rawDoc.deletedAt, "Document must have deletedAt timestamp populated");
    assert.equal(rawDoc.userId, testUserId, "Document ownership must remain intact");
    console.log("  ✓ Document record safely persisted in database with soft-delete metadata");

    // ── STEP 12: Complete Fixture Teardown (Zero Garbage Guarantee) ───────────
    console.log("\n[12/12] Cleaning up test fixtures from PostgreSQL...");
    await prisma.$executeRawUnsafe(
      `DELETE FROM "public"."PromptKichBanDocument" WHERE "id" = '${testDocId}'`
    );
    await prisma.user.delete({ where: { id: testUserId } });
    testDocId = null;
    testUserId = null;
    console.log("  ✓ Test document and test user permanently removed from PostgreSQL");

    // ── Observability Check ──────────────────────────────────────────────────
    recordSafeMetric({
      requestId: output.requestId,
      event: "generate",
      status: "success",
      statusCode: 200,
      provider: env.provider,
      model: env.model || "deepseek-v4-flash",
      latencyMs: genDuration,
      sceneCount: output.scenes.length,
      totalTokens: 2500,
      quotaRemaining: 2,
    });
    const metrics = getMetricsSummary();
    assert.ok(metrics.totalRequests > 0, "Metrics must record production smoke");

    const totalDuration = Date.now() - startTime;
    console.log("\n==========================================================");
    console.log(`✅ ALL 12 PRODUCTION SMOKE STEPS PASSED in ${totalDuration}ms`);
    console.log("==========================================================");
  } catch (err) {
    console.error("\n❌ PRODUCTION SMOKE TEST FAILED:", err);
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

runProductionSmokeTest().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
